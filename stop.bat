@echo off
echo ========================================
echo   Stopping Services...
echo ========================================
echo.

echo Stopping Backend Server (uvicorn)...
taskkill /F /FI "WINDOWTITLE eq Backend Server*" >nul 2>&1
taskkill /F /IM uvicorn.exe >nul 2>&1

echo Stopping Frontend Dev Server (npm/node)...
taskkill /F /FI "WINDOWTITLE eq Frontend Dev Server*" >nul 2>&1

echo.
echo ========================================
echo   All Services Stopped!
echo ========================================
echo.
pause
