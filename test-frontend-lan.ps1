# Script to test if frontend can connect to backend on LAN
Write-Host "`n=== Testing Frontend-Backend LAN Connection ===" -ForegroundColor Cyan

# Get local IP addresses
$adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -ne "WellKnown"
} | Sort-Object IPAddress

if ($adapters.Count -eq 0) {
    Write-Host "No network adapters found!" -ForegroundColor Red
    exit
}

$primaryIP = $adapters[0].IPAddress
Write-Host "`nPrimary IP: $primaryIP" -ForegroundColor Yellow

# Check frontend configuration
Write-Host "`n=== Frontend Configuration Check ===" -ForegroundColor Cyan
$apiFile = "src\services\api.ts"
$apiUrlFile = "src\utils\apiUrl.ts"

if (Test-Path $apiFile) {
    $content = Get-Content $apiFile -Raw
    if ($content -match "getApiBaseUrl|window\.location\.hostname") {
        Write-Host "✅ Frontend API client is configured for auto-detection" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Frontend may not be configured for LAN access" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Cannot find src/services/api.ts" -ForegroundColor Yellow
}

if (Test-Path $apiUrlFile) {
    Write-Host "✅ API URL utility file exists" -ForegroundColor Green
} else {
    Write-Host "❌ API URL utility file not found!" -ForegroundColor Red
}

# Check if frontend is running
Write-Host "`n=== Checking if frontend is running ===" -ForegroundColor Cyan
$frontendListening = netstat -ano | findstr ":5173"
if ($frontendListening) {
    Write-Host "✅ Port 5173 is listening" -ForegroundColor Green
    Write-Host $frontendListening -ForegroundColor Gray
} else {
    Write-Host "⚠️  Port 5173 is NOT listening" -ForegroundColor Yellow
    Write-Host "   Frontend server may not be running!" -ForegroundColor Yellow
    Write-Host "   Start frontend with: npm run dev" -ForegroundColor Yellow
}

# Check if backend is running
Write-Host "`n=== Checking if backend is running ===" -ForegroundColor Cyan
$backendListening = netstat -ano | findstr ":3000"
if ($backendListening) {
    Write-Host "✅ Port 3000 is listening" -ForegroundColor Green
    Write-Host $backendListening -ForegroundColor Gray
} else {
    Write-Host "❌ Port 3000 is NOT listening" -ForegroundColor Red
    Write-Host "   Backend server may not be running!" -ForegroundColor Yellow
    Write-Host "   Start backend with: cd server; npm run dev" -ForegroundColor Yellow
    exit
}

# Test backend connection from LAN IP
Write-Host "`n=== Testing Backend Connection from LAN ===" -ForegroundColor Cyan
try {
    $backendUrl = "http://${primaryIP}:3000/health"
    $response = Invoke-WebRequest -Uri $backendUrl -Method GET -TimeoutSec 3 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is accessible from LAN: $backendUrl" -ForegroundColor Green
        Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Cannot connect to backend from LAN: $backendUrl" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Frontend URL (localhost): http://localhost:5173" -ForegroundColor White
Write-Host "Frontend URL (LAN):       http://${primaryIP}:5173" -ForegroundColor White
Write-Host "Backend URL (localhost):  http://localhost:3000" -ForegroundColor White
Write-Host "Backend URL (LAN):       http://${primaryIP}:3000" -ForegroundColor White
Write-Host "`n=== How it works ===" -ForegroundColor Cyan
Write-Host "When accessing frontend via LAN IP (e.g., http://${primaryIP}:5173):" -ForegroundColor Yellow
Write-Host "  - Frontend will automatically detect the hostname (${primaryIP})" -ForegroundColor Gray
Write-Host "  - Frontend will use http://${primaryIP}:3000/api for backend API calls" -ForegroundColor Gray
Write-Host "`n=== Testing Instructions ===" -ForegroundColor Cyan
Write-Host "1. Open http://${primaryIP}:5173 on your mobile device" -ForegroundColor White
Write-Host "2. Check browser console (F12) for any connection errors" -ForegroundColor White
Write-Host "3. Try to sign in - if it works, backend connection is successful!" -ForegroundColor White
Write-Host "`n"
