@echo off
echo ================================
echo Smart Travel Planner Backend
echo ================================
echo.

REM Check if .env exists
if not exist .env (
    echo [ERROR] .env file not found!
    echo Please create a .env file with:
    echo   OPENWEATHER_API_KEY=your_key_here
    echo   OPENAI_API_KEY=your_key_here
    echo.
    pause
    exit /b 1
)

echo [INFO] Loading environment variables...
for /f "tokens=*" %%a in (.env) do set %%a

echo [INFO] Starting FastAPI server...
echo [INFO] API will be available at: http://localhost:8000
echo [INFO] API Docs: http://localhost:8000/docs
echo.

uvicorn backend.app:app --reload --port 8000
