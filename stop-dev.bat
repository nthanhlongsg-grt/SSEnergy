@echo off
echo ========================================
echo Stopping All SSE Demo Servers
echo ========================================
echo.

echo Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

if %errorlevel% == 0 (
    echo [SUCCESS] All Node.js processes have been stopped.
) else (
    echo [INFO] No Node.js processes were running.
)

echo.
echo ========================================
echo All servers have been stopped.
echo ========================================
echo.
pause








