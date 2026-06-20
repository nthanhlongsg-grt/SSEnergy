# Script Upload Frontend lên cPanel qua FTP
# Sử dụng: .\upload-ftp.ps1 -FtpHost "SSEvietnam.com" -FtpUser "username" -FtpPass "password"

param(
    [Parameter(Mandatory=$true)]
    [string]$FtpHost,
    
    [Parameter(Mandatory=$true)]
    [string]$FtpUser,
    
    [Parameter(Mandatory=$true)]
    [string]$FtpPass,
    
    [string]$RemotePath = "/public_html",
    [string]$LocalPath = "dist"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  UPLOAD FRONTEND QUA FTP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra thư mục dist
if (-not (Test-Path $LocalPath)) {
    Write-Host "  ✗ Không tìm thấy thư mục $LocalPath!" -ForegroundColor Red
    Write-Host "  Vui lòng chạy script build trước: .\deploy-cpanel.ps1" -ForegroundColor Red
    exit 1
}

Write-Host "📤 Đang upload file lên FTP..." -ForegroundColor Yellow
Write-Host "   Host: $FtpHost" -ForegroundColor White
Write-Host "   Path: $RemotePath" -ForegroundColor White
Write-Host ""

# Tạo FTP URI
$ftpUri = "ftp://$FtpHost$RemotePath"

try {
    # Tạo FTP request
    $ftp = [System.Net.FtpWebRequest]::Create("$ftpUri/")
    $ftp.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $FtpPass)
    $ftp.Method = [System.Net.WebRequestMethods+Ftp]::ListDirectory
    
    # Test connection
    $response = $ftp.GetResponse()
    $response.Close()
    Write-Host "  ✓ Kết nối FTP thành công" -ForegroundColor Green
} catch {
    Write-Host "  ✗ Không thể kết nối FTP!" -ForegroundColor Red
    Write-Host "  Lỗi: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Function để upload file
function Upload-File {
    param(
        [string]$LocalFile,
        [string]$RemoteFile
    )
    
    try {
        $ftp = [System.Net.FtpWebRequest]::Create("$ftpUri/$RemoteFile")
        $ftp.Credentials = New-Object System.Net.NetworkCredential($FtpUser, $FtpPass)
        $ftp.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $ftp.UseBinary = $true
        $ftp.UsePassive = $true
        
        $fileContent = [System.IO.File]::ReadAllBytes($LocalFile)
        $ftp.ContentLength = $fileContent.Length
        
        $requestStream = $ftp.GetRequestStream()
        $requestStream.Write($fileContent, 0, $fileContent.Length)
        $requestStream.Close()
        
        $response = $ftp.GetResponse()
        $response.Close()
        
        return $true
    } catch {
        Write-Host "    ✗ Lỗi upload $RemoteFile : $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function để upload thư mục
function Upload-Directory {
    param(
        [string]$LocalDir,
        [string]$RemoteDir
    )
    
    $files = Get-ChildItem -Path $LocalDir -File
    $dirs = Get-ChildItem -Path $LocalDir -Directory
    
    # Upload files
    foreach ($file in $files) {
        $remoteFile = if ($RemoteDir -eq "") { $file.Name } else { "$RemoteDir/$($file.Name)" }
        Write-Host "  📄 Upload: $remoteFile" -ForegroundColor Cyan
        if (Upload-File -LocalFile $file.FullName -RemoteFile $remoteFile) {
            Write-Host "    ✓ Thành công" -ForegroundColor Green
        }
    }
    
    # Upload subdirectories
    foreach ($dir in $dirs) {
        $remoteSubDir = if ($RemoteDir -eq "") { $dir.Name } else { "$RemoteDir/$($dir.Name)" }
        Write-Host "  📁 Tạo thư mục: $remoteSubDir" -ForegroundColor Cyan
        Upload-Directory -LocalDir $dir.FullName -RemoteDir $remoteSubDir
    }
}

# Bắt đầu upload
Write-Host "🚀 Bắt đầu upload..." -ForegroundColor Yellow
Upload-Directory -LocalDir $LocalPath -RemoteDir ""

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  UPLOAD HOÀN TẤT!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Kiểm tra website: https://$FtpHost/" -ForegroundColor Cyan
Write-Host ""

