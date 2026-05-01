"""
FastAPI Backend Wrapper for Smart Travel Planner
Provides SSE (Server-Sent Events) streaming interface for real-time updates
"""
import os
import sys
import json
import asyncio
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

# Import core logic from parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from travel_agent import app as langgraph_app, tools

# -----------------------------------
# Pydantic Models
# -----------------------------------

class TravelRequest(BaseModel):
    destination: str
    travel_dates: str


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    api_keys_configured: dict


# -----------------------------------
# FastAPI Application Setup
# -----------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    print("[INFO] FastAPI server starting...")
    print("[INFO] SSE endpoint available at /api/travel/stream")
    yield
    print("[INFO] FastAPI server shutting down...")


app = FastAPI(
    title="Smart Travel Planner API",
    description="AI-powered travel planning with weather-based recommendations",
    version="1.0.0",
    lifespan=lifespan
)

# -----------------------------------
# Global exception handler
# -----------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all for unhandled exceptions so the frontend always gets
    a JSON error response instead of a raw 500 / dropped connection.
    """
    error_type = type(exc).__name__
    error_msg = str(exc)
    print(f"Unhandled {error_type}: {error_msg}")
    return JSONResponse(
        status_code=500,
        content={"error": f"{error_type}: {error_msg}"},
    )


# -----------------------------------
# CORS Configuration
# -----------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For local dev; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------
# Helper Functions
# -----------------------------------

def check_api_keys() -> dict:
    """Check if required API keys are configured"""
    return {
        "openweather": bool(os.environ.get("OPENWEATHER_API_KEY")),
        "openai": bool(os.environ.get("OPENAI_API_KEY"))
    }


async def stream_agent_execution(destination: str, travel_dates: str):
    """
    Execute the LangGraph agent and yield SSE-formatted events

    Event types:
    - status: Agent status updates
    - tool_call: When agent invokes a tool
    - result: Final travel guide result
    - error: Error messages
    - done: Stream completion signal
    """

    # Validate API keys first
    keys = check_api_keys()
    if not keys["openweather"]:
        yield f"event: error\ndata: {json.dumps({'error': 'OPENWEATHER_API_KEY not configured'})}\n\n"
        return
    if not keys["openai"]:
        yield f"event: error\ndata: {json.dumps({'error': 'OPENAI_API_KEY not configured'})}\n\n"
        return

    # Send initial status
    yield f"event: status\ndata: {json.dumps({'message': 'Initializing AI agent...'})}\n\n"
    await asyncio.sleep(0.1)

    # Construct the prompt
    initial_prompt = (
        f"I am traveling to {destination} on {travel_dates}. "
        "Please check the weather forecast for that location using the available tool. "
        "Based STRICTLY on the weather conditions and summary provided by the tool, generate a travel guide including:\n"
        "1. Clothing Recommendations (based on temperature and conditions).\n"
        "2. Packing Essentials (e.g., umbrella, sunscreen, specific gear).\n"
        "3. Activity Recommendations (3 specific activities suitable for the weather).\n\n"
        "Please provide the response in English, acting as a helpful local guide."
    )

    yield f"event: status\ndata: {json.dumps({'message': f'Planning trip to {destination}...'})}\n\n"
    await asyncio.sleep(0.1)

    # Prepare inputs
    from langchain_core.messages import HumanMessage, AIMessage
    inputs = {"messages": [HumanMessage(content=initial_prompt)]}

    try:
        # Stream through the LangGraph workflow
        for event in langgraph_app.stream(inputs, stream_mode="values"):
            message = event["messages"][-1]

            # Tool call event
            if isinstance(message, AIMessage) and message.tool_calls:
                tool_name = message.tool_calls[0]['name']
                tool_args = message.tool_calls[0]['args']

                yield f"event: tool_call\ndata: {json.dumps({'tool': tool_name, 'args': tool_args})}\n\n"
                await asyncio.sleep(0.1)

            # AI response with final result
            elif isinstance(message, AIMessage) and message.content:
                yield f"event: status\ndata: {json.dumps({'message': 'Generating travel guide...'})}\n\n"
                await asyncio.sleep(0.1)

                yield f"event: result\ndata: {json.dumps({'content': message.content})}\n\n"
                await asyncio.sleep(0.1)

        # Send completion signal
        yield f"event: done\ndata: {json.dumps({'message': 'Travel guide generated successfully'})}\n\n"

    except KeyboardInterrupt:
        raise
    except Exception as e:
        error_msg = str(e)
        error_type = type(e).__name__
        # Always send a structured error event so the frontend can display it
        yield f"event: error\ndata: {json.dumps({'error': f'{error_type}: {error_msg}'})}\n\n"
        print(f"Error in stream_agent_execution [{error_type}]: {error_msg}")


# -----------------------------------
# API Endpoints
# -----------------------------------

@app.get("/", response_model=HealthResponse)
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "api_keys_configured": check_api_keys()
    }


@app.post("/api/travel/stream")
async def travel_stream(request: TravelRequest):
    """
    SSE endpoint for streaming travel planning results

    Example usage from frontend:
    ```javascript
    const eventSource = new EventSource(
        `POST /api/travel/stream`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                destination: 'Tokyo',
                travel_dates: 'May 15-20, 2026'
            })
        }
    );

    eventSource.addEventListener('status', (e) => {
        const data = JSON.parse(e.data);
        console.log(data.message);
    });

    eventSource.addEventListener('result', (e) => {
        const data = JSON.parse(e.data);
        console.log(data.content);
    });
    ```
    """

    if not request.destination or not request.travel_dates:
        raise HTTPException(status_code=400, detail="destination and travel_dates are required")

    return StreamingResponse(
        stream_agent_execution(request.destination, request.travel_dates),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


@app.get("/api/tools")
async def list_tools():
    """List available tools"""
    return {
        "tools": [
            {
                "name": tool.name,
                "description": tool.description,
            }
            for tool in tools
        ]
    }


# -----------------------------------
# Run with: uvicorn backend.app:app --reload --port 8000
# -----------------------------------
