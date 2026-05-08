# Script to restart backend server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Restarting Backend Server" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find and kill processes using port 3000
Write-Host "Checking for processes on port 3000..." -ForegroundColor Green
$processes = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($processes) {
    Write-Host "Found processes on port 3000: $($processes -join ', ')" -ForegroundColor Yellow
    foreach ($pid in $processes) {
        try {
            Stop-Process -Id $pid -Force
            Write-Host "Stopped process $pid" -ForegroundColor Green
        } catch {
            Write-Host "Could not stop process $pid: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "No processes found on port 3000" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting Backend Server..." -ForegroundColor Green
Write-Host ""

# Start backend server in a new window
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\server'; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Backend server is starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Wait a few seconds for the server to start, then refresh your browser." -ForegroundColor Yellow

