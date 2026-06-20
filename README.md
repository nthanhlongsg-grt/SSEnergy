# SSE After-Sales Management System

Hệ thống quản lý hậu mãi cho sản phẩm SSE - Quản lý tickets, kỹ thuật viên, lịch trình, kho hàng và báo cáo dịch vụ.

## 🚀 Tính năng chính

- ✅ **Quản lý Tickets**: Tạo, theo dõi và xử lý tickets dịch vụ
- 👥 **Quản lý Người dùng**: Quản lý nhiều vai trò (Admin, Developer, Service Center, Technician, etc.)
- 📅 **Lịch trình Kỹ thuật viên**: Giao việc và quản lý lịch làm việc
- 📦 **Quản lý Kho hàng**: Theo dõi linh kiện, RMA
- 🔧 **Quản lý Inverter**: Quản lý thông tin và lịch sử bảo hành
- 📊 **Báo cáo Dịch vụ**: Tạo và quản lý biên bản dịch vụ
- 🔔 **Thông báo**: Hệ thống thông báo real-time

## 🛠️ Công nghệ sử dụng

### Frontend
- Vue 3 + TypeScript
- Vite
- TailwindCSS
- Vue Router
- FullCalendar

### Backend
- Node.js + Express
- TypeScript
- SQLite (better-sqlite3)
- JWT Authentication
- bcryptjs

## 📦 Cài đặt

### Yêu cầu
- Node.js >= 18
- npm hoặc yarn

### Cài đặt Backend

```bash
cd server
npm install
npm run db:migrate
npm run db:add:developer
npm run dev
```

Backend sẽ chạy tại: `http://localhost:3000`

### Cài đặt Frontend

```bash
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173`

### Khởi động nhanh (Windows)

Sử dụng file batch để khởi động cả hai server:

```bash
start-dev.bat
```

Hoặc dừng tất cả server:

```bash
stop-dev.bat
```

## 🔐 Tài khoản dev (chỉ môi trường local)

Không có mật khẩu mặc định trong repository. Khi seed database local:

```bash
cd server
set DEV_SEED_PASSWORD=your-local-password
npm run db:seed
```

Tùy chọn: `DEV_SEED_EMAIL=you@example.com` để đặt email developer.

## 📁 Cấu trúc dự án

```
.
├── server/              # Backend API
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── middleware/ # Authentication & authorization
│   │   ├── database/   # Database migrations
│   │   └── services/   # Business logic
│   └── database/       # SQLite database
├── src/                # Frontend Vue app
│   ├── views/          # Pages
│   ├── components/    # Vue components
│   ├── services/      # API services
│   └── composables/   # Vue composables
└── public/            # Static assets
```

## 🌐 Deploy

### Deploy Backend (Vercel/Railway/Render)

1. **Vercel**:
   - Kết nối repository GitHub
   - Chọn thư mục `server`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

2. **Railway**:
   - Kết nối repository
   - Chọn thư mục `server`
   - Start Command: `npm start`

### Deploy Frontend (Vercel/Netlify)

1. **Vercel**:
   - Kết nối repository GitHub
   - Root Directory: `.` (root)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

2. **Netlify**:
   - Kết nối repository
   - Build command: `npm run build`
   - Publish directory: `dist`

### Cấu hình Environment Variables

**Backend (.env)**:
```
PORT=3000
JWT_SECRET=your-secret-key
NODE_ENV=production
```

**Frontend (.env)**:
```
VITE_API_URL=https://your-backend-url.com
```

## 📝 API Documentation

Xem chi tiết tại: `server/API-DOCUMENTATION.md`

## 🤝 Đóng góp

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📄 License

MIT License

## 👨‍💻 Tác giả

SSE Development Team

---

**Lưu ý**: Đảm bảo cập nhật các biến môi trường khi deploy lên production!
