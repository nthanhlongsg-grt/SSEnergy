# Script to restart all servers (backend and frontend)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Restarting All SGE Servers" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Stop processes on port 3000 (backend)
Write-Host "Checking for processes on port 3000 (Backend)..." -ForegroundColor Green
$backendProcesses = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($backendProcesses) {
    Write-Host "Found processes on port 3000: $($backendProcesses -join ', ')" -ForegroundColor Yellow
    foreach ($pid in $backendProcesses) {
        try {
            Stop-Process -Id $pid -Force
            Write-Host "Stopped backend process $pid" -ForegroundColor Green
        } catch {
            $errorMsg = $_.Exception.Message
            Write-Host "Could not stop process $pid : $errorMsg" -ForegroundColor Red
        }
    }
} else {
    Write-Host "No processes found on port 3000" -ForegroundColor Green
}

# Stop processes on port 5173 (frontend)
Write-Host ""
Write-Host "Checking for processes on port 5173 (Frontend)..." -ForegroundColor Green
$frontendProcesses = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique

if ($frontendProcesses) {
    Write-Host "Found processes on port 5173: $($frontendProcesses -join ', ')" -ForegroundColor Yellow
    foreach ($pid in $frontendProcesses) {
        try {
            Stop-Process -Id $pid -Force
            Write-Host "Stopped frontend process $pid" -ForegroundColor Green
        } catch {
            $errorMsg = $_.Exception.Message
            Write-Host "Could not stop process $pid : $errorMsg" -ForegroundColor Red
        }
    }
} else {
    Write-Host "No processes found on port 5173" -ForegroundColor Green
}

# Wait a moment for processes to fully stop
Write-Host ""
Write-Host "Waiting for processes to stop..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

# Start Backend Server
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Backend Server..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\server'; npm run dev"

Start-Sleep -Seconds 3

# Start Frontend Server
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Starting Frontend Server..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath'; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All servers are starting in separate windows." -ForegroundColor Yellow
Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Wait a few seconds for the servers to start, then refresh your browser." -ForegroundColor Yellow
Write-Host ""

