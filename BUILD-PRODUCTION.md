# 🚀 Build Production cho https://growattvietnam.com

## ✅ Kiểm tra trước khi build

1. **Type Check**: ✅ PASSED
   ```bash
   npm run type-check
   ```

2. **Build**: ✅ SUCCESS
   ```bash
   npm run build
   ```

## 📝 Cấu hình Production

### Bước 1: Tạo file `.env.production`

Tạo file `.env.production` trong thư mục root:

```env
VITE_API_URL=https://growattvietnam.com/api
```

**Lưu ý**: 
- Nếu backend chạy trên subdomain riêng: `VITE_API_URL=https://api.growattvietnam.com`
- Nếu backend chạy cùng domain: `VITE_API_URL=https://growattvietnam.com/api`

### Bước 2: Build với production environment

```bash
npm run build
```

Build output sẽ nằm trong thư mục `dist/`

### Bước 3: Kiểm tra build output

```bash
# Kiểm tra file index.html
cat dist/index.html

# Kiểm tra assets
ls -la dist/assets/
```

## 🌐 Deploy Options

### Option 1: Vercel (Recommended)

1. Kết nối GitHub repository
2. Cấu hình:
   - **Root Directory**: `.` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
3. Environment Variables:
   - `VITE_API_URL`: `https://growattvietnam.com/api`

### Option 2: Netlify

1. Kết nối GitHub repository
2. Cấu hình:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
3. Environment Variables:
   - `VITE_API_URL`: `https://growattvietnam.com/api`

### Option 3: Server (Nginx)

1. Upload thư mục `dist/` lên server
2. Cấu hình Nginx (xem `DEPLOY.md`)

## 🔍 Kiểm tra sau khi deploy

1. ✅ Trang load thành công: https://growattvietnam.com
2. ✅ Login/Register hoạt động
3. ✅ API calls thành công (mở DevTools > Network)
4. ✅ Routing hoạt động (thử navigate giữa các trang)
5. ✅ Images/assets load đúng

## ⚠️ Lưu ý

- File `.env.production` KHÔNG được commit vào Git
- Đảm bảo backend đã được deploy và chạy trước khi deploy frontend
- Kiểm tra CORS settings trong backend cho phép domain production

## 🐛 Troubleshooting

### Lỗi: API calls fail
- Kiểm tra `VITE_API_URL` trong environment variables
- Kiểm tra backend URL có đúng không
- Kiểm tra CORS settings trong backend

### Lỗi: 404 khi refresh trang
- Đảm bảo web server đã cấu hình SPA routing (redirect về index.html)

### Lỗi: Assets không load
- Kiểm tra `base` trong `vite.config.ts` (phải là `/`)
- Kiểm tra đường dẫn assets trong HTML














