# Script to get local IP address for LAN access
# Usage: .\get-local-ip.ps1 [--open]
#   --open: Automatically open the frontend URL in browser

param(
    [switch]$Open
)

Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host "SSE LAN Access Information".PadRight(60) -ForegroundColor Cyan
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""

# Get all network adapters with IPv4 addresses
$adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and 
    $_.IPAddress -notlike "169.254.*" -and
    $_.PrefixOrigin -ne "WellKnown"
} | Sort-Object IPAddress

if ($adapters.Count -eq 0) {
    Write-Host "Khong tim thay dia chi IP mang LAN!" -ForegroundColor Red
    Write-Host "Vui long kiem tra ket noi mang cua ban." -ForegroundColor Yellow
    Write-Host ""
    exit
}

# Sort IPs: prefer Wi-Fi/Ethernet over VMware/Virtual adapters, then by LAN ranges
$sortedAdapters = $adapters | Sort-Object {
    $ip = $_.IPAddress
    $iface = $_.InterfaceAlias
    
    # Prefer physical adapters (Wi-Fi, Ethernet) over virtual (VMware, VirtualBox, etc.)
    $isVirtual = $iface -match "VMware|VirtualBox|Hyper-V|vEthernet|Virtual"
    $isPhysical = $iface -match "Wi-Fi|Ethernet|LAN|Local Area Connection"
    
    # Priority: Physical adapters first, then by IP range
    if ($isPhysical) {
        $basePriority = 0
    } elseif ($isVirtual) {
        $basePriority = 100
    } else {
        $basePriority = 50
    }
    
    # Then sort by IP range preference
    if ($ip -match "^192\.168\.1\.") { return $basePriority + 1 }  # Most common home network
    if ($ip -match "^192\.168\.") { return $basePriority + 2 }
    if ($ip -match "^10\.") { return $basePriority + 3 }
    if ($ip -match "^172\.(1[6-9]|2[0-9]|3[0-1])\.") { return $basePriority + 4 }
    return $basePriority + 5
}

$primaryIP = $sortedAdapters[0].IPAddress
$primaryInterface = $sortedAdapters[0].InterfaceAlias

Write-Host "Dia chi IP chinh:" -ForegroundColor Yellow
Write-Host "   $primaryIP ($primaryInterface)" -ForegroundColor Green
Write-Host ""

# Display all IPs
if ($sortedAdapters.Count -gt 1) {
    Write-Host "Tat ca dia chi IP:" -ForegroundColor Yellow
    foreach ($adapter in $sortedAdapters) {
        $isPrimary = $adapter.IPAddress -eq $primaryIP
        if ($isPrimary) {
            $marker = "->"
            $label = " [Primary]"
            $color = "Green"
        } else {
            $marker = "  "
            $label = ""
            $color = "White"
        }
        $ipStr = $adapter.IPAddress.PadRight(15)
        $ifaceStr = $adapter.InterfaceAlias
        Write-Host "   $marker $ipStr ($ifaceStr)$label" -ForegroundColor $color
    }
    Write-Host ""
}

# Get ports from environment or use defaults
$frontendPort = "5173"
$backendPort = "3000"
if ($env:VITE_PORT) {
    $frontendPort = $env:VITE_PORT
}
if ($env:PORT) {
    $backendPort = $env:PORT
}

$frontendUrl = "http://$primaryIP`:$frontendPort"
$backendUrl = "http://$primaryIP`:$backendPort"

Write-Host "Links truy cap tu mang LAN:" -ForegroundColor Yellow
Write-Host "   Frontend:  $frontendUrl" -ForegroundColor Green
Write-Host "   Backend:   $backendUrl" -ForegroundColor Green
Write-Host ""

Write-Host "Huong dan:" -ForegroundColor Yellow
Write-Host "   1. Dam bao Frontend va Backend dang chay" -ForegroundColor White
Write-Host "   2. Tren thiet bi khac trong cung mang LAN, mo trinh duyet" -ForegroundColor White
Write-Host "   3. Truy cap: $frontendUrl" -ForegroundColor White
Write-Host "   4. Dam bao Windows Firewall cho phep ket noi" -ForegroundColor White
Write-Host ""

Write-Host "Kiem tra Firewall:" -ForegroundColor Yellow
Write-Host "   Chay: .\setup-firewall.ps1 (voi quyen Administrator)" -ForegroundColor White
Write-Host ""

# Check if servers are running
Write-Host "Kiem tra servers dang chay:" -ForegroundColor Yellow
try {
    $frontendTest = Test-NetConnection -ComputerName localhost -Port $frontendPort -WarningAction SilentlyContinue -InformationLevel Quiet -ErrorAction SilentlyContinue
    $backendTest = Test-NetConnection -ComputerName localhost -Port $backendPort -WarningAction SilentlyContinue -InformationLevel Quiet -ErrorAction SilentlyContinue
    
    if ($frontendTest) {
        Write-Host "   Frontend dang chay tren port $frontendPort" -ForegroundColor Green
    } else {
        Write-Host "   Frontend khong chay tren port $frontendPort" -ForegroundColor Red
    }
    
    if ($backendTest) {
        Write-Host "   Backend dang chay tren port $backendPort" -ForegroundColor Green
    } else {
        Write-Host "   Backend khong chay tren port $backendPort" -ForegroundColor Red
    }
} catch {
    Write-Host "   Khong the kiem tra trang thai servers" -ForegroundColor Yellow
}
Write-Host ""

# Open browser if requested
if ($Open) {
    try {
        Start-Process $frontendUrl
        Write-Host "Da mo trinh duyet: $frontendUrl" -ForegroundColor Green
        Write-Host ""
    } catch {
        Write-Host "Khong the mo trinh duyet tu dong" -ForegroundColor Yellow
        Write-Host ""
    }
}

Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""
