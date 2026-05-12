"""
FastAPI Backend Wrapper for Smart Travel Planner
Provides SSE (Server-Sent Events) streaming interface for real-time updates
"""
import os
import sys
import re
import json
import asyncio
from datetime import datetime
from typing import Optional
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel

# Import core logic from parent directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from travel_agent import app as langgraph_app, tools, SYSTEM_PROMPT

# -----------------------------------
# Pydantic Models
# -----------------------------------

class TravelRequest(BaseModel):
    departure: Optional[str] = ''
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
        "openai": bool(os.environ.get("OPENAI_API_KEY")),
        "rapidapi": bool(os.environ.get("RAPIDAPI_KEY")),
    }


async def stream_agent_execution(departure: str, destination: str, travel_dates: str):
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

    # Construct the prompt (mirrors travel_agent.py)
    departure_info = f" from {departure}" if departure else ""
    initial_prompt = (
        f"I am traveling{departure_info} to {destination} on {travel_dates}.\n\n"
        "Please gather real-time data using the available tools, then produce a complete travel guide.\n\n"
        "**Data gathering** (use tools in parallel where possible):\n"
        "1. Use `get_weather_forecast` to get the weather forecast for the destination.\n"
        "2. Use `search_hotels` to find available hotels with real prices.\n"
        "3. Use `search_restaurants` to find top-rated dining options.\n"
        "4. Use `search_attractions` to find popular things to do.\n"
        f"5. {'Use `search_flights` to find flights from ' + departure + ' to ' + destination + '.' if departure else 'If a departure city is obvious from context, use `search_flights` to find flights.'}\n\n"
        "**Output structure** — base ALL recommendations on the real data returned:\n\n"
        "## Daily Itinerary\n"
        f"You MUST provide a full-day plan for EVERY day of the trip ({travel_dates}). "
        "Do NOT skip any day. If weather forecast data is not available for some days, "
        "extrapolate from the closest available forecast and note it.\n"
        "For EACH day, provide:\n"
        "- **Weather Summary**: Quote the key data (high/low temp, condition).\n"
        "- **Sightseeing Route**: List 3-4 specific attractions from search results in a geographically logical order. "
        "For each spot, note why it suits the day's weather and how to get to the next one.\n"
        "- **Meals**: Recommend specific restaurants from search results near the day's route for lunch and dinner. "
        "Include ratings and price level.\n"
        "- **Outfit Plan**: What to wear for the day based on the temperature range and conditions.\n"
        "- **Accommodation**: Recommend a specific hotel from search results, including price and rating. "
        "Prefer hotels in areas convenient for the next day's itinerary.\n\n"
        "## Flights & Transportation\n"
        "- If flight data was retrieved, list the best options with price and duration.\n"
        "- How to get from the airport/station to the city center.\n"
        "- Recommended transit method for sightseeing (metro, bus, taxi, walking) based on weather and distances.\n"
        "- Any travel passes or apps that are useful.\n\n"
        "## Hotel Recommendations\n"
        "- Summarize the top 3 hotel picks from search results with prices, ratings, and area.\n\n"
        "## Packing Checklist\n"
        "A consolidated, categorized list:\n"
        "- Weather protection (rain/sun/wind gear)\n"
        "- Clothing essentials (with quantities based on trip length)\n"
        "- Health & comfort (sunscreen SPF level, hydration advice, etc.)\n\n"
        "## Practical Tips\n"
        "- Local food/drink specialties worth trying given the weather.\n"
        "- Any weather-related safety warnings or cultural tips.\n\n"
        "Format the output clearly with markdown headers and bullet points."
    )

    yield f"event: status\ndata: {json.dumps({'message': f'Planning trip to {destination}...'})}\n\n"
    await asyncio.sleep(0.1)

    # Prepare inputs with system prompt
    from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, ToolMessage
    inputs = {"messages": [SystemMessage(content=SYSTEM_PROMPT), HumanMessage(content=initial_prompt)]}

    # Accumulate structured data from tool responses
    structured_data = []
    seen_tool_ids = set()
    STRUCTURED_PATTERN = re.compile(r'<!--STRUCTURED_DATA:(.*?)-->')

    try:
        # Stream through the LangGraph workflow
        for event in langgraph_app.stream(inputs, stream_mode="values"):
            # Extract structured data from any new ToolMessages
            for msg in event["messages"]:
                if isinstance(msg, ToolMessage) and msg.content:
                    msg_id = msg.id or id(msg)
                    if msg_id in seen_tool_ids:
                        continue
                    seen_tool_ids.add(msg_id)
                    matches = STRUCTURED_PATTERN.findall(msg.content)
                    for match in matches:
                        try:
                            parsed = json.loads(match)
                            structured_data.append(parsed)
                        except json.JSONDecodeError:
                            pass

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

                yield f"event: result\ndata: {json.dumps({'content': message.content, 'structured_data': structured_data})}\n\n"
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
        stream_agent_execution(request.departure or '', request.destination, request.travel_dates),
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
