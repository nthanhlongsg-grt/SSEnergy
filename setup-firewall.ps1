# Script to setup Windows Firewall rules for SGE LAN access
# This script requires Administrator privileges

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "`n⚠️  This script requires Administrator privileges!" -ForegroundColor Yellow
    Write-Host "`nRestarting PowerShell with Administrator rights..." -ForegroundColor Cyan
    
    # Restart script with Administrator privileges
    $scriptPath = $MyInvocation.MyCommand.Path
    Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
    exit
}

Write-Host "`n=== SGE Firewall Setup ===" -ForegroundColor Cyan
Write-Host "Setting up firewall rules for LAN access...`n" -ForegroundColor Yellow

# Remove existing rules if they exist
Write-Host "Checking for existing rules..." -ForegroundColor Gray
$existingFrontend = Get-NetFirewallRule -DisplayName "SGE Frontend" -ErrorAction SilentlyContinue
$existingBackend = Get-NetFirewallRule -DisplayName "SGE Backend" -ErrorAction SilentlyContinue

if ($existingFrontend) {
    Write-Host "  Removing existing 'SGE Frontend' rule..." -ForegroundColor Gray
    Remove-NetFirewallRule -DisplayName "SGE Frontend" -ErrorAction SilentlyContinue
}

if ($existingBackend) {
    Write-Host "  Removing existing 'SGE Backend' rule..." -ForegroundColor Gray
    Remove-NetFirewallRule -DisplayName "SGE Backend" -ErrorAction SilentlyContinue
}

# Create Frontend rule (port 5173)
Write-Host "`nCreating firewall rule for Frontend (port 5173)..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "SGE Frontend" `
        -Direction Inbound `
        -LocalPort 5173 `
        -Protocol TCP `
        -Action Allow `
        -Profile Domain,Private,Public `
        -Description "Allow inbound connections for SGE Frontend on port 5173"
    Write-Host "  ✅ Frontend rule created successfully!" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Failed to create Frontend rule: $_" -ForegroundColor Red
}

# Create Backend rule (port 3000)
Write-Host "`nCreating firewall rule for Backend (port 3000)..." -ForegroundColor Yellow
try {
    New-NetFirewallRule -DisplayName "SGE Backend" `
        -Direction Inbound `
        -LocalPort 3000 `
        -Protocol TCP `
        -Action Allow `
        -Profile Domain,Private,Public `
        -Description "Allow inbound connections for SGE Backend on port 3000"
    Write-Host "  ✅ Backend rule created successfully!" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Failed to create Backend rule: $_" -ForegroundColor Red
}

# Verify rules
Write-Host "`n=== Verification ===" -ForegroundColor Cyan
$frontendRule = Get-NetFirewallRule -DisplayName "SGE Frontend" -ErrorAction SilentlyContinue
$backendRule = Get-NetFirewallRule -DisplayName "SGE Backend" -ErrorAction SilentlyContinue

if ($frontendRule -and $backendRule) {
    Write-Host "✅ Both firewall rules are active!" -ForegroundColor Green
    Write-Host "`nFrontend rule:" -ForegroundColor Yellow
    $frontendRule | Select-Object DisplayName, Enabled, Direction, Action | Format-Table -AutoSize
    Write-Host "Backend rule:" -ForegroundColor Yellow
    $backendRule | Select-Object DisplayName, Enabled, Direction, Action | Format-Table -AutoSize
} else {
    Write-Host "⚠️  Some rules may not have been created. Please check manually." -ForegroundColor Yellow
}

Write-Host "`n=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Run '.\get-local-ip.ps1' to get your local IP address" -ForegroundColor White
Write-Host "2. Start your servers (frontend and backend)" -ForegroundColor White
Write-Host "3. Access from other devices using: http://<your-ip>:5173" -ForegroundColor White
Write-Host "`nPress any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

