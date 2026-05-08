# ✅ Checklist Deploy Production

## 🔍 Kiểm tra trước khi deploy

### 1. Code Quality
- [x] **TypeScript**: Không có lỗi type (đã sửa 12 lỗi)
- [x] **Linter**: Không có lỗi ESLint
- [x] **Build**: Build thành công không có lỗi
- [ ] **Tests**: Chạy tests (nếu có)

### 2. Environment Variables

#### Frontend (`.env.production`)
```env
VITE_API_URL=https://growattvietnam.com/api
```
**Lưu ý**: 
- File `.env.production` KHÔNG được commit vào Git
- Nếu backend chạy trên subdomain riêng: `VITE_API_URL=https://api.growattvietnam.com`
- Nếu backend chạy cùng domain: `VITE_API_URL=https://growattvietnam.com/api`

#### Backend (`.env`)
```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
DATABASE_PATH=./database/growatt.db
CORS_ORIGIN=https://growattvietnam.com
```

### 3. Cấu hình Backend

- [ ] **CORS**: Đảm bảo `CORS_ORIGIN` cho phép domain production
- [ ] **Database**: Database đã được migrate và seed (nếu cần)
- [ ] **SSL**: SSL certificate đã được cài đặt cho backend

### 4. Build Frontend

```bash
npm run build
```

Kiểm tra:
- [ ] Build thành công không có lỗi
- [ ] Thư mục `dist/` được tạo
- [ ] File `dist/index.html` tồn tại
- [ ] Assets được build đúng (JS, CSS, images)

### 5. Kiểm tra File Quan Trọng

- [x] `vite.config.ts`: Base path = `/`
- [x] `src/utils/apiUrl.ts`: API URL detection logic
- [x] `index.html`: Meta tags và viewport
- [x] `.gitignore`: Đã ignore `.env.production` và `dist/`

### 6. Security

- [ ] **JWT Secret**: Đã thay đổi secret key mặc định
- [ ] **Environment Variables**: Không commit sensitive data
- [ ] **CORS**: Chỉ cho phép domain production
- [ ] **HTTPS**: Sử dụng HTTPS cho production

### 7. Performance

- [ ] **Assets**: Images đã được optimize
- [ ] **Code Splitting**: Vite đã tự động code splitting
- [ ] **Caching**: Web server đã cấu hình cache headers

## 🚀 Deploy Steps

### Option 1: Vercel (Recommended)

1. **Frontend**:
   - Kết nối GitHub repository
   - Root Directory: `.` (root)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Environment Variables:
     - `VITE_API_URL`: `https://growattvietnam.com/api`

2. **Backend**:
   - Kết nối GitHub repository
   - Root Directory: `server`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Start Command: `npm start`
   - Environment Variables:
     - `PORT`: `3000`
     - `NODE_ENV`: `production`
     - `JWT_SECRET`: `[your-secret]`
     - `CORS_ORIGIN`: `https://growattvietnam.com`
     - `DATABASE_PATH`: `./database/growatt.db`

### Option 2: Server (Nginx)

1. **Upload files**:
   ```bash
   # Upload dist/ lên server
   scp -r dist/ user@server:/var/www/growatt/
   ```

2. **Cấu hình Nginx** (xem `DEPLOY.md`)

3. **Cấu hình Backend**:
   - Chạy backend như service (PM2/systemd)
   - Cấu hình reverse proxy cho `/api`

## ✅ Kiểm tra sau khi deploy

### Frontend
- [ ] Trang chủ load thành công: https://growattvietnam.com
- [ ] Login/Register hoạt động
- [ ] API calls thành công (mở DevTools > Network)
- [ ] Routing hoạt động (thử navigate giữa các trang)
- [ ] Images/assets load đúng
- [ ] Responsive design hoạt động trên mobile

### Backend
- [ ] Health check: `https://growattvietnam.com/api/health`
- [ ] API endpoints hoạt động
- [ ] Authentication hoạt động
- [ ] Database connection thành công

### Mobile
- [ ] Giao diện mobile tối ưu
- [ ] Date picker hoạt động trên mobile
- [ ] Forms submit thành công
- [ ] Images upload hoạt động

## 🐛 Troubleshooting

### Lỗi CORS
- Kiểm tra `CORS_ORIGIN` trong backend có đúng domain không
- Kiểm tra backend có chạy và accessible không

### Lỗi 404 khi refresh trang
- Đảm bảo web server đã cấu hình SPA routing (redirect về index.html)

### API calls fail
- Kiểm tra `VITE_API_URL` trong environment variables
- Kiểm tra backend URL có đúng không
- Kiểm tra network tab trong DevTools để xem request URL

### Assets không load
- Kiểm tra `base` trong `vite.config.ts` (phải là `/`)
- Kiểm tra đường dẫn assets trong HTML

## 📝 Notes

- File `.env.production` KHÔNG được commit vào Git
- Đảm bảo backend đã được deploy và chạy trước khi deploy frontend
- Test kỹ trên staging environment trước khi deploy production
- Backup database trước khi deploy

## 🔄 Rollback Plan

Nếu có vấn đề sau khi deploy:

1. **Frontend**: Revert về commit trước đó và rebuild
2. **Backend**: Restart service hoặc revert code
3. **Database**: Restore từ backup nếu cần

---

**Ngày tạo**: $(date)
**Version**: 2.0.1
**Status**: ✅ Sẵn sàng deploy (sau khi hoàn thành checklist)




