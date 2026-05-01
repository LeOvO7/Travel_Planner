#!/bin/bash

echo "================================"
echo "Smart Travel Planner Backend"
echo "================================"
echo

# Check if .env exists
if [ ! -f .env ]; then
    echo "[ERROR] .env file not found!"
    echo "Please create a .env file with:"
    echo "  OPENWEATHER_API_KEY=your_key_here"
    echo "  OPENAI_API_KEY=your_key_here"
    echo
    exit 1
fi

echo "[INFO] Loading environment variables..."
export $(cat .env | xargs)

echo "[INFO] Starting FastAPI server..."
echo "[INFO] API will be available at: http://localhost:8000"
echo "[INFO] API Docs: http://localhost:8000/docs"
echo

uvicorn backend.app:app --reload --port 8000
