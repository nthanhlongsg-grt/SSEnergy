# SGE Backend API

Backend API cho hệ thống quản lý hậu mãi SGE After-Sales Management System.

## Công nghệ sử dụng

- **Node.js** với **Express**
- **TypeScript**
- **SQLite** (better-sqlite3)
- **JWT** cho authentication
- **bcryptjs** để hash passwords

## Cài đặt

1. Cài đặt dependencies:
```bash
cd server
npm install
```

2. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

3. Chỉnh sửa file `.env` nếu cần (mặc định đã đủ để chạy)

4. Khởi tạo database và seed dữ liệu mẫu:
```bash
npm run db:seed
```

## Chạy server

### Development mode (với hot reload):
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm start
```

Server sẽ chạy tại `http://localhost:3000`

## API Endpoints

### Authentication

- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/me` - Lấy thông tin user hiện tại

### Users

- `GET /api/users` - Lấy danh sách users (Admin only)
- `GET /api/users/:id` - Lấy thông tin user theo ID
- `POST /api/users` - Tạo user mới (Admin only)
- `PUT /api/users/:id` - Cập nhật user (Admin only)
- `DELETE /api/users/:id` - Xóa user (Admin only)

## Database

Database được lưu tại `server/database/SGE.db` (SQLite)

### Schema

- **users**: Thông tin người dùng
- **inverters**: Thiết bị inverter
- **customers**: Khách hàng
- **tickets**: Ticket bảo hành/sửa chữa
- **service_reports**: Biên bản dịch vụ
- **warehouse_parts**: Linh kiện trong kho

## Tài khoản developer (local only)

Script seed đọc mật khẩu từ biến môi trường `DEV_SEED_PASSWORD` — **không lưu trong git**.

```bash
DEV_SEED_PASSWORD=your-local-password npm run db:seed
```
