# Script to test if backend is accessible on LAN
Write-Host "`n=== Testing Backend LAN Access ===" -ForegroundColor Cyan

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

# Check if port 3000 is listening
Write-Host "`n=== Checking if backend is running ===" -ForegroundColor Cyan
$listening = netstat -ano | findstr ":3000"
if ($listening) {
    Write-Host "✅ Port 3000 is listening" -ForegroundColor Green
    Write-Host $listening -ForegroundColor Gray
} else {
    Write-Host "❌ Port 3000 is NOT listening" -ForegroundColor Red
    Write-Host "   Backend server may not be running!" -ForegroundColor Yellow
    Write-Host "`n   Start backend with: cd server; npm run dev" -ForegroundColor Yellow
    exit
}

# Test localhost connection
Write-Host "`n=== Testing localhost connection ===" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 3 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is responding on localhost:3000" -ForegroundColor Green
        Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Cannot connect to backend on localhost:3000" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test LAN IP connection
Write-Host "`n=== Testing LAN IP connection ===" -ForegroundColor Cyan
try {
    $lanUrl = "http://${primaryIP}:3000/health"
    $response = Invoke-WebRequest -Uri $lanUrl -Method GET -TimeoutSec 3 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Backend is accessible on LAN: $lanUrl" -ForegroundColor Green
        Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Cannot connect to backend on LAN IP: $lanUrl" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "`n   Possible issues:" -ForegroundColor Yellow
    Write-Host "   1. Backend may not be listening on 0.0.0.0" -ForegroundColor Gray
    Write-Host "   2. Windows Firewall may be blocking port 3000" -ForegroundColor Gray
    Write-Host "   3. Check server/src/index.ts for app.listen(PORT, '0.0.0.0', ...)" -ForegroundColor Gray
}

# Check CORS configuration
Write-Host "`n=== Backend Configuration Check ===" -ForegroundColor Cyan
$indexFile = "server\src\index.ts"
if (Test-Path $indexFile) {
    $content = Get-Content $indexFile -Raw
    if ($content -match "app\.listen\(PORT,\s*['\`"]0\.0\.0\.0['\`"]") {
        Write-Host "✅ Backend is configured to listen on 0.0.0.0 (all interfaces)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Backend may not be listening on all interfaces" -ForegroundColor Yellow
        Write-Host "   Check: app.listen(PORT, '0.0.0.0', ...)" -ForegroundColor Gray
    }
    
    if ($content -match "192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])") {
        Write-Host "✅ CORS is configured to allow LAN IPs" -ForegroundColor Green
    } else {
        Write-Host "⚠️  CORS may not be configured for LAN IPs" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Cannot find server/src/index.ts" -ForegroundColor Yellow
}

# Summary
Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "Backend URL (localhost): http://localhost:3000" -ForegroundColor White
Write-Host "Backend URL (LAN):       http://${primaryIP}:3000" -ForegroundColor White
Write-Host "`nTo access from other devices:" -ForegroundColor Yellow
Write-Host "  1. Make sure backend is running" -ForegroundColor Gray
Write-Host "  2. Use the LAN URL above on other devices" -ForegroundColor Gray
Write-Host "  3. Ensure Windows Firewall allows port 3000" -ForegroundColor Gray
Write-Host "`n"

