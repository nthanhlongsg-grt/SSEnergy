# Hướng dẫn chia sẻ Localhost với thiết bị trong mạng LAN

## 📋 Yêu cầu

- Các thiết bị phải cùng kết nối với một mạng LAN/WiFi
- Windows Firewall phải cho phép kết nối trên port 5173 (Frontend) và 3000 (Backend)

## 🚀 Các bước thực hiện

### 1. Tìm địa chỉ IP local của máy

**Cách 1: Sử dụng PowerShell script (Khuyến nghị)**
```powershell
.\get-local-ip.ps1
```

**Cách 2: Sử dụng Command Prompt**
```cmd
ipconfig
```
Tìm dòng `IPv4 Address` (thường là `192.168.x.x` hoặc `10.x.x.x`)

**Cách 3: Sử dụng PowerShell trực tiếp**
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike "127.*"} | Select-Object IPAddress, InterfaceAlias
```

### 2. Cấu hình Firewall (Quan trọng!)

**Cách 1: Sử dụng script tự động (Khuyến nghị)**

Chạy script sau (sẽ tự động yêu cầu quyền Administrator):
```powershell
.\setup-firewall.ps1
```

Script sẽ tự động:
- Yêu cầu quyền Administrator nếu chưa có
- Tạo firewall rules cho port 5173 (Frontend) và 3000 (Backend)
- Xác minh các rules đã được tạo thành công

**Cách 2: Chạy thủ công với quyền Administrator**

1. **Mở PowerShell với quyền Administrator:**
   - Nhấn `Win + X`
   - Chọn "Windows PowerShell (Admin)" hoặc "Terminal (Admin)"
   - Hoặc tìm "PowerShell" → Click chuột phải → "Run as administrator"

2. **Chạy các lệnh:**
```powershell
# Cho phép Frontend (port 5173)
New-NetFirewallRule -DisplayName "Growatt Frontend" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow

# Cho phép Backend (port 3000)
New-NetFirewallRule -DisplayName "Growatt Backend" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
```

Hoặc sử dụng Windows Firewall GUI:
1. Mở **Windows Defender Firewall**
2. Chọn **Advanced settings**
3. Click **Inbound Rules** → **New Rule**
4. Chọn **Port** → **TCP** → Nhập port `5173` hoặc `3000`
5. Chọn **Allow the connection**
6. Áp dụng cho tất cả profiles
7. Đặt tên: "Growatt Frontend" hoặc "Growatt Backend"

### 3. Khởi động servers

**Backend:**
```bash
cd server
npm run dev
```

**Frontend:**
```bash
npm run dev
```

### 4. Truy cập từ thiết bị khác

Sau khi có địa chỉ IP (ví dụ: `192.168.1.100`), truy cập từ thiết bị khác:

- **Frontend:** `http://192.168.1.100:5173`
- **Backend API:** `http://192.168.1.100:3000`

### 5. Cấu hình Frontend để kết nối với Backend trên LAN

Nếu frontend không kết nối được với backend, bạn có thể:

**Cách 1: Sử dụng biến môi trường**

Tạo file `.env.local` trong thư mục gốc:
```env
VITE_API_URL=http://192.168.1.100:3000/api
```
(Thay `192.168.1.100` bằng IP thực tế của máy)

**Cách 2: Sử dụng IP động**

Frontend sẽ tự động sử dụng IP hiện tại nếu bạn truy cập qua IP thay vì localhost.

## 🔧 Xử lý sự cố

### Không thể truy cập từ thiết bị khác

1. **Kiểm tra Firewall:**
   ```powershell
   Get-NetFirewallRule -DisplayName "Growatt*" | Select-Object DisplayName, Enabled, Direction, Action
   ```

2. **Kiểm tra server đang chạy:**
   - Frontend: `http://localhost:5173` phải hoạt động
   - Backend: `http://localhost:3000` phải hoạt động

3. **Kiểm tra cùng mạng:**
   - Đảm bảo các thiết bị cùng WiFi/LAN
   - Ping từ thiết bị khác: `ping 192.168.1.100`

4. **Kiểm tra CORS:**
   - Backend đã được cấu hình để chấp nhận requests từ LAN IPs
   - Nếu vẫn lỗi CORS, kiểm tra console browser

### Lỗi CORS

Nếu gặp lỗi CORS, đảm bảo:
- Backend đang chạy và lắng nghe trên `0.0.0.0`
- Frontend truy cập qua IP thay vì localhost
- CORS đã được cấu hình đúng trong `server/src/index.ts`

## 📝 Lưu ý

- IP có thể thay đổi khi kết nối lại WiFi
- Chạy lại script `get-local-ip.ps1` để lấy IP mới
- Đảm bảo cả Frontend và Backend đều đang chạy
- Sử dụng HTTPS trong production (không dùng HTTP trên mạng công cộng)

