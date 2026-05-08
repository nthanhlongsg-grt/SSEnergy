# 🌐 Hướng dẫn truy cập Localhost từ mạng LAN

Script tự động kiểm tra IP của laptop và hiển thị link để các thiết bị trong mạng LAN có thể truy cập.

## 🚀 Cách sử dụng

### Cách 1: Sử dụng npm script (Khuyến nghị)

```bash
# Hiển thị thông tin IP và link LAN
npm run lan

# Hiển thị thông tin và tự động mở trình duyệt
npm run lan:open
```

### Cách 2: Chạy trực tiếp PowerShell script

```powershell
# Hiển thị thông tin IP và link LAN
.\get-local-ip.ps1

# Hiển thị thông tin và tự động mở trình duyệt
.\get-local-ip.ps1 -Open
```

## 📋 Kết quả

Script sẽ hiển thị:

- **Địa chỉ IP chính**: IP được chọn tự động (ưu tiên Wi-Fi/Ethernet)
- **Tất cả địa chỉ IP**: Danh sách tất cả IP có sẵn
- **Links truy cập**: 
  - Frontend: `http://<IP>:5173`
  - Backend: `http://<IP>:3000`
- **Trạng thái servers**: Kiểm tra xem Frontend và Backend có đang chạy không

## 🔧 Yêu cầu

1. **Frontend và Backend phải đang chạy**
   ```bash
   # Terminal 1: Backend
   cd server
   npm run dev
   
   # Terminal 2: Frontend
   npm run dev
   ```

2. **Windows Firewall phải cho phép kết nối**
   ```powershell
   # Chạy với quyền Administrator
   .\setup-firewall.ps1
   ```

## 📱 Truy cập từ thiết bị khác

1. Đảm bảo thiết bị cùng mạng LAN/Wi-Fi với laptop
2. Mở trình duyệt trên thiết bị
3. Truy cập link Frontend được hiển thị (ví dụ: `http://192.168.1.8:5173`)

## ⚙️ Tùy chỉnh Port

Nếu bạn sử dụng port khác, có thể set biến môi trường:

```powershell
# PowerShell
$env:VITE_PORT = "5174"  # Frontend port
$env:PORT = "3001"        # Backend port
npm run lan
```

```bash
# Bash/CMD
set VITE_PORT=5174
set PORT=3001
npm run lan
```

## 🔍 Xử lý sự cố

### Không tìm thấy IP

- Kiểm tra kết nối mạng
- Đảm bảo Wi-Fi/Ethernet đã được kết nối
- Thử chạy lại script

### Không thể truy cập từ thiết bị khác

1. **Kiểm tra Firewall:**
   ```powershell
   Get-NetFirewallRule -DisplayName "Growatt*" | Select-Object DisplayName, Enabled
   ```

2. **Kiểm tra servers đang chạy:**
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3000`

3. **Kiểm tra cùng mạng:**
   - Ping từ thiết bị khác: `ping <IP>`
   - Đảm bảo không dùng VPN hoặc mạng riêng ảo

### IP được chọn không đúng

Script tự động ưu tiên:
1. Wi-Fi/Ethernet adapters (physical)
2. IP trong dải `192.168.1.x` (mạng nhà phổ biến)
3. Các IP trong dải private network khác

Nếu IP được chọn không phù hợp, bạn có thể:
- Sử dụng IP khác từ danh sách "Tất cả địa chỉ IP"
- Tạm thời disable các adapter không cần thiết (VMware, VirtualBox, etc.)

## 📝 Lưu ý

- IP có thể thay đổi khi kết nối lại Wi-Fi
- Chạy lại script để lấy IP mới
- Đảm bảo cả Frontend và Backend đều đang chạy
- Sử dụng HTTPS trong production (không dùng HTTP trên mạng công cộng)















