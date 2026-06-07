# Hướng dẫn Deploy lên https://SGEvietnam.com

## 📋 Yêu cầu

1. Backend server đã được deploy và chạy
2. Domain đã được cấu hình DNS
3. SSL certificate đã được cài đặt

## 🔧 Cấu hình Production

### 1. Tạo file `.env.production`

Tạo file `.env.production` trong thư mục root với nội dung:

```env
VITE_API_URL=https://SGEvietnam.com/api
```

**Lưu ý**: 
- Nếu backend chạy trên subdomain riêng (ví dụ: `api.SGEvietnam.com`), sử dụng: `VITE_API_URL=https://api.SGEvietnam.com`
- Nếu backend chạy cùng domain với frontend, sử dụng: `VITE_API_URL=https://SGEvietnam.com/api`

### 2. Cấu hình Backend CORS

Đảm bảo backend cho phép CORS từ domain production:

**File: `server/src/index.ts`**

```typescript
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'https://SGEvietnam.com'
```

Hoặc set environment variable:
```env
CORS_ORIGIN=https://SGEvietnam.com
```

### 3. Build Frontend

```bash
npm run build
```

Build output sẽ nằm trong thư mục `dist/`

### 4. Deploy

#### Option A: Deploy lên Vercel/Netlify

1. **Vercel**:
   - Kết nối GitHub repository
   - Root Directory: `.` (root)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Environment Variables:
     - `VITE_API_URL`: `https://SGEvietnam.com/api`

2. **Netlify**:
   - Kết nối GitHub repository
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Environment Variables:
     - `VITE_API_URL`: `https://SGEvietnam.com/api`

#### Option B: Deploy lên Server (Nginx/Apache)

1. Upload thư mục `dist/` lên server
2. Cấu hình web server:

**Nginx**:
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name SGEvietnam.com www.SGEvietnam.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name SGEvietnam.com www.SGEvietnam.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    root /var/www/SGE/dist;
    index index.html;

    # SPA routing - redirect all requests to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Apache (.htaccess)**:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## ✅ Kiểm tra sau khi deploy

1. Truy cập: https://SGEvietnam.com
2. Kiểm tra:
   - ✅ Trang load thành công
   - ✅ Login/Register hoạt động
   - ✅ API calls thành công (mở DevTools > Network)
   - ✅ Routing hoạt động (thử navigate giữa các trang)
   - ✅ Images/assets load đúng

## 🐛 Troubleshooting

### Lỗi CORS
- Kiểm tra `CORS_ORIGIN` trong backend có đúng domain không
- Kiểm tra backend có chạy và accessible không

### Lỗi 404 khi refresh trang
- Đảm bảo web server đã cấu hình SPA routing (redirect về index.html)

### API calls fail
- Kiểm tra `VITE_API_URL` trong `.env.production`
- Kiểm tra backend URL có đúng không
- Kiểm tra network tab trong DevTools để xem request URL

### Assets không load
- Kiểm tra `base` trong `vite.config.ts` (nên là `/`)
- Kiểm tra đường dẫn assets trong HTML

## 📝 Notes

- File `.env.production` không nên commit vào Git (thêm vào `.gitignore`)
- Đảm bảo backend đã được deploy và chạy trước khi deploy frontend
- Test kỹ trên staging environment trước khi deploy production

