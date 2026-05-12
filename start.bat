@echo off
echo ========================================
echo   Smart Travel Planner - Starting...
echo ========================================
echo.

echo [1/3] Checking environment configuration...
if not exist ".env" (
    echo [ERROR] .env file not found!
    echo Please copy .env.example to .env and configure API keys
    pause
    exit /b 1
)

echo [2/3] Starting Backend Server...
start "Backend Server" cmd /k "uvicorn backend.app:app --reload --port 8000"

echo [3/3] Waiting for backend to start...
ping 127.0.0.1 -n 5 >nul

if exist "frontend" (
    echo Starting Frontend Dev Server...
    start "Frontend Dev Server" cmd /k "cd frontend && npm run dev"
) else (
    echo.
    echo [WARNING] frontend directory not found!
    echo Only backend server started.
)

echo.
echo ========================================
echo   Services Started Successfully!
echo ========================================
echo   Backend:  http://localhost:8000
echo   Frontend: http://localhost:5173
echo   API Docs: http://localhost:8000/docs
echo ========================================
echo.
echo Tip: Closing this window will not stop the services
echo To stop services, close the respective windows or run stop.bat
echo.
pause
