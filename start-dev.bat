@echo off
echo ========================================
echo Starting SSE Demo Servers
echo ========================================
echo.

echo [1/2] Starting Backend Server (port 3000)...
start "Backend Server" cmd /k "cd /d %~dp0server && npm run dev"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend Server (port 5173)...
start "Frontend Server" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo ========================================
echo Both servers are starting in separate windows.
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo ========================================
echo.
echo Press any key to close this window (servers will continue running)...
pause >nul








