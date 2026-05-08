# ✅ Checklist Deploy lên cPanel

## 📦 Pre-Deployment

- [ ] Backend build thành công (`cd server && npm run build`)
- [ ] Frontend build thành công (`npm run build`)
- [ ] Tạo file `.env.production` với `VITE_API_URL=https://growattvietnam.com/api`
- [ ] Rebuild frontend với production environment
- [ ] Kiểm tra không có lỗi TypeScript
- [ ] Kiểm tra không có lỗi CSS

## 📤 Upload Files

### Backend
- [ ] Upload `server/dist/` → `public_html/api/dist/`
- [ ] Upload `server/package.json` → `public_html/api/`
- [ ] Upload `server/database/` → `public_html/api/database/` (nếu có)
- [ ] Tạo thư mục `public_html/api/reports/`

### Frontend
- [ ] Upload toàn bộ `dist/` → `public_html/`
- [ ] Upload `public/images/` → `public_html/images/`

## ⚙️ Backend Configuration

- [ ] Tạo file `.env` trong `public_html/api/`
- [ ] Cấu hình PORT, JWT_SECRET, CORS_ORIGIN
- [ ] Tạo Node.js App trong cPanel
- [ ] Set Application startup file: `dist/index.js`
- [ ] Set Application URL: `/api`
- [ ] Cài đặt dependencies (`npm install --production`)
- [ ] Set environment variables trong Node.js App
- [ ] Restart Node.js App

## 🌐 Frontend Configuration

- [ ] Tạo file `.htaccess` trong `public_html/`
- [ ] Cấu hình SPA routing
- [ ] Cấu hình API proxy (nếu cần)
- [ ] Cấu hình cache headers

## 🔒 Security & SSL

- [ ] Cài đặt SSL certificate
- [ ] Force HTTPS redirect
- [ ] Kiểm tra security headers

## 🗄️ Database

- [ ] Set quyền ghi cho thư mục `database/`
- [ ] Chạy migration (nếu cần): `node dist/database/migrate.js`
- [ ] Kiểm tra database file tồn tại

## ✅ Testing

- [ ] Backend health check: `https://growattvietnam.com/api/health`
- [ ] Frontend load: `https://growattvietnam.com`
- [ ] Login/Register hoạt động
- [ ] API calls thành công (check Network tab)
- [ ] Routing hoạt động (thử refresh trang)
- [ ] Images/assets load đúng

## 📝 Post-Deployment

- [ ] Kiểm tra error logs
- [ ] Kiểm tra Node.js app logs
- [ ] Test tất cả chức năng chính
- [ ] Document deployment process
- [ ] Backup database














