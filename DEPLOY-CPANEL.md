# 🚀 Hướng dẫn Deploy lên cPanel

> Khuyến nghị cho mô hình production hiện tại (frontend domain chính + backend API subdomain): xem thêm `DEPLOY-MATBAO-CPANEL-SUBDOMAIN.md`.

## 📋 Yêu cầu

1. cPanel hosting với Node.js support
2. SSH access (khuyến nghị)
3. Domain đã được cấu hình DNS

## 🔧 Bước 1: Build Backend và Frontend

### Build Backend
```bash
cd server
npm install
npm run build
```

Output: `server/dist/`

### Build Frontend
```bash
npm install
npm run build
```

Output: `dist/`

## 📦 Bước 2: Chuẩn bị Files để Upload

### Cấu trúc thư mục trên cPanel:

```
public_html/
├── api/              # Backend (Node.js app)
│   ├── dist/         # Compiled backend code
│   ├── database/     # SQLite database
│   ├── reports/      # Generated reports
│   ├── node_modules/ # Backend dependencies
│   ├── package.json
│   └── .env          # Backend environment variables
│
└── [frontend files]  # Frontend build files
    ├── index.html
    ├── assets/
    └── images/
```

## 📤 Bước 3: Upload Files lên cPanel

### Option A: Sử dụng File Manager

1. Đăng nhập vào cPanel
2. Mở **File Manager**
3. Upload các files:

**Backend:**
- Upload toàn bộ thư mục `server/dist/` → `public_html/api/dist/`
- Upload `server/package.json` → `public_html/api/`
- Upload `server/database/` → `public_html/api/database/` (nếu có)
- Tạo thư mục `public_html/api/reports/` (nếu chưa có)

**Frontend:**
- Upload toàn bộ nội dung thư mục `dist/` → `public_html/`

### Option B: Sử dụng FTP/SFTP

```bash
# Upload backend
scp -r server/dist/* user@yourdomain.com:~/public_html/api/dist/
scp server/package.json user@yourdomain.com:~/public_html/api/

# Upload frontend
scp -r dist/* user@yourdomain.com:~/public_html/
```

## ⚙️ Bước 4: Cấu hình Backend trên cPanel

### 4.1. Tạo file `.env` trong `public_html/api/`

Tạo file `.env` với nội dung:

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=your-secret-key-here
CORS_ORIGIN=https://SSEvietnam.com
TZ=Asia/Ho_Chi_Minh
```

### 4.2. Cài đặt Node.js Dependencies

**Cách 1: Qua SSH (Khuyến nghị)**
```bash
cd ~/public_html/api
npm install --production
```

**Cách 2: Qua cPanel Node.js App**
1. Vào **Node.js** trong cPanel
2. Tạo Node.js App:
   - **Node.js version**: Chọn version mới nhất (18+)
   - **Application root**: `api`
   - **Application URL**: `/api` hoặc subdomain
   - **Application startup file**: `dist/index.js`
3. Cài đặt dependencies:
   - Click vào app → **Run NPM Install**
   - Hoặc chạy: `npm install --production`

### 4.3. Cấu hình Node.js App trong cPanel

1. Vào **Node.js** trong cPanel
2. Chọn app → **Edit**
3. Cấu hình:
   - **Application startup file**: `dist/index.js`
   - **Application URL**: `/api` (hoặc subdomain như `api.SSEvietnam.com`)
   - **Environment variables**: Thêm các biến từ `.env`
4. Click **Save** và **Restart App**

## 🌐 Bước 5: Cấu hình Frontend

### 5.1. Tạo file `.htaccess` trong `public_html/`

Tạo file `.htaccess` với nội dung:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Redirect API requests to Node.js backend
  RewriteCond %{REQUEST_URI} ^/api/(.*)$
  RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]
  
  # SPA routing - redirect all requests to index.html
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Security headers
<IfModule mod_headers.c>
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-Content-Type-Options "nosniff"
  Header set X-XSS-Protection "1; mode=block"
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
</IfModule>
```

### 5.2. Cấu hình API URL

Tạo file `.env.production` trong thư mục root (trước khi build):

```env
VITE_API_URL=https://SSEvietnam.com/api
```

Sau đó build lại:
```bash
npm run build
```

## 🔒 Bước 6: Cấu hình SSL/HTTPS

1. Vào **SSL/TLS** trong cPanel
2. Cài đặt SSL certificate (Let's Encrypt hoặc paid SSL)
3. Force HTTPS redirect trong `.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

## 📝 Bước 7: Cấu hình Database

### Nếu sử dụng SQLite (mặc định):

1. Đảm bảo thư mục `public_html/api/database/` có quyền ghi:
   ```bash
   chmod 755 database/
   chmod 644 database/*.db
   ```

2. Database sẽ tự động tạo khi chạy lần đầu

### Nếu muốn migrate database:

```bash
cd ~/public_html/api
node dist/database/migrate.js
```

## ✅ Bước 8: Kiểm tra

1. **Backend**: Truy cập `https://SSEvietnam.com/api/health`
   - Kết quả mong đợi: `{"status":"ok","message":"SSE API is running"}`

2. **Frontend**: Truy cập `https://SSEvietnam.com`
   - Kiểm tra trang load thành công
   - Kiểm tra login/register hoạt động
   - Kiểm tra API calls trong DevTools > Network

## 🐛 Troubleshooting

### Backend không chạy
- Kiểm tra Node.js version (cần 18+)
- Kiểm tra `.env` file có đúng không
- Kiểm tra logs trong cPanel Node.js App
- Kiểm tra port có bị conflict không

### API calls fail
- Kiểm tra CORS settings trong backend
- Kiểm tra `VITE_API_URL` trong frontend build
- Kiểm tra `.htaccess` có proxy đúng không

### 404 khi refresh trang
- Kiểm tra `.htaccess` có rule SPA routing không
- Kiểm tra `mod_rewrite` đã được enable chưa

### Database errors
- Kiểm tra quyền ghi trên thư mục database
- Kiểm tra đường dẫn database trong code

## 📋 Checklist Deploy

- [ ] Backend đã build thành công
- [ ] Frontend đã build thành công
- [ ] Files đã upload lên cPanel
- [ ] Node.js app đã được tạo và cấu hình
- [ ] Dependencies đã được cài đặt
- [ ] `.env` file đã được tạo với đúng values
- [ ] `.htaccess` đã được cấu hình
- [ ] SSL certificate đã được cài đặt
- [ ] Database có quyền ghi
- [ ] Backend health check thành công
- [ ] Frontend load thành công
- [ ] Login/Register hoạt động
- [ ] API calls thành công

## 🔄 Update sau khi Deploy

### Update Backend:
```bash
cd ~/public_html/api
git pull  # hoặc upload files mới
npm install --production
npm run build
# Restart Node.js app trong cPanel
```

### Update Frontend:
```bash
# Build mới
npm run build

# Upload files mới lên public_html/
```

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. cPanel Error Logs
2. Node.js App Logs trong cPanel
3. Browser Console (F12)
4. Network tab trong DevTools














