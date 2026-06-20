# Deploy — https://baohanh.ssenergy.vn/

Portal bảo hành SS Energy: Vue 3 (Vite) + Express (SQLite), hosting Mắt Bão / cPanel hoặc Linux VPS.

## Kiến trúc

| Thành phần | URL / Port |
|------------|------------|
| Frontend (SPA) | `https://baohanh.ssenergy.vn/` |
| API | `https://baohanh.ssenergy.vn/api/*` → Node.js `127.0.0.1:3000` |

## Build trên máy dev

```bash
# .env.production (đã có mẫu .env.production.example):
# VITE_API_URL=https://baohanh.ssenergy.vn/api

npm run deploy:prepare:baohanh
```

Gói deploy tại: **`.deploy/baohanh-ssenergy/`**

- `public_html/` — upload lên document root subdomain
- `api-server/` — Node.js backend
- `README-UPLOAD.txt` — hướng dẫn chi tiết

## Mắt Bão / cPanel

1. **Frontend:** Upload toàn bộ `public_html/*` vào document root `baohanh.ssenergy.vn`  
   (đã kèm `.htaccess` proxy `/api` và `/health` → port 3000)

2. **Backend:** Upload `api-server/*` vào thư mục Node.js App  
   - Startup file: `dist/index.js`  
   - `npm ci --omit=dev`  
   - `npm rebuild better-sqlite3` (nếu cần)  
   - Biến môi trường:

```env
NODE_ENV=production
PORT=3000
JWT_SECRET=<secret-mạnh>
CORS_ORIGIN=https://baohanh.ssenergy.vn
DATABASE_PATH=./database/SSE.db
TZ=Asia/Ho_Chi_Minh
```

3. **SSL:** Bật AutoSSL / Let's Encrypt cho `baohanh.ssenergy.vn`

4. **Restart** Node.js App

## Linux VPS (Nginx + PM2)

```bash
sudo cp -r .deploy/baohanh-ssenergy/public_html/* /var/www/baohanh/dist/
sudo cp -r .deploy/baohanh-ssenergy/api-server/* /opt/ssenergy-baohanh-api/
cd /opt/ssenergy-baohanh-api && npm ci --omit=dev && cp .env.example .env
pm2 start ecosystem.config.cjs && pm2 save
sudo cp deploy/nginx/baohanh.ssenergy.vn.conf /etc/nginx/sites-available/
sudo certbot --nginx -d baohanh.ssenergy.vn
sudo nginx -t && sudo systemctl reload nginx
```

## Kiểm tra sau deploy

```bash
npm run smoke:api:baohanh
# hoặc
curl https://baohanh.ssenergy.vn/api/health
```

Kỳ vọng: `{"status":"ok","message":"SSE API is running"}`

## Lưu ý

- Đổi `JWT_SECRET` mạnh trên production
- Không commit `server/.env` / `.env.production`
- Backup định kỳ `database/SSE.db`
