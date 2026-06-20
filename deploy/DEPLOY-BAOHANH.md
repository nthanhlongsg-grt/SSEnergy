# Deploy — https://baohanh.sgesolartech.vn/

Portal bảo hành SSE: Vue 3 (Vite) + Express (SQLite), chạy trên Linux với Nginx reverse proxy.

## Kiến trúc

| Thành phần | URL / Port |
|------------|------------|
| Frontend (SPA) | `https://baohanh.sgesolartech.vn/` |
| API | `https://baohanh.sgesolartech.vn/api/*` → `127.0.0.1:3000` |
| Trang chủ marketing | `https://sgesolartech.vn/` (link ngoài) |

## Build trên máy dev

```bash
# Đảm bảo .env.production có:
# VITE_API_URL=https://baohanh.sgesolartech.vn/api

npm run deploy:prepare:baohanh
```

Gói deploy tại: `.deploy/baohanh-sgesolartech/`

## Cài trên Linux (VPS)

### 1. Frontend

```bash
sudo mkdir -p /var/www/baohanh
sudo cp -r .deploy/baohanh-sgesolartech/public_html/* /var/www/baohanh/dist/
```

### 2. Backend (PM2)

```bash
sudo mkdir -p /opt/sge-baohanh-api
sudo cp -r .deploy/baohanh-sgesolartech/api-server/* /opt/sge-baohanh-api/
cd /opt/sge-baohanh-api
npm ci --omit=dev
cp .env.example .env
# Sửa JWT_SECRET trong .env
pm2 start ecosystem.config.cjs
pm2 save
```

### 3. Nginx

```bash
sudo cp deploy/nginx/baohanh.sgesolartech.vn.conf /etc/nginx/sites-available/baohanh.sgesolartech.vn
sudo ln -s /etc/nginx/sites-available/baohanh.sgesolartech.vn /etc/nginx/sites-enabled/
sudo certbot --nginx -d baohanh.sgesolartech.vn
sudo nginx -t && sudo systemctl reload nginx
```

## Kiểm tra sau deploy

```bash
npm run smoke:api:baohanh
# hoặc
curl https://baohanh.sgesolartech.vn/api/health
```

Kỳ vọng: `{"status":"ok","message":"SSE API is running"}`

## cPanel / Mắt Bão

- Upload `public_html/*` vào document root subdomain `baohanh`
- Tạo Node.js app trỏ `api-server`, port 3000
- Bật `.htaccess` proxy `/api` (xem `.htaccess.example`)
- Set env: `CORS_ORIGIN=https://baohanh.sgesolartech.vn`

## Lưu ý bảo mật

- Đổi `JWT_SECRET` mạnh trên production
- Không commit `server/.env`
- SQLite: backup định kỳ `database/SSE.db`
- `better-sqlite3`: trên server chạy `npm rebuild better-sqlite3` nếu đổi phiên bản Node
