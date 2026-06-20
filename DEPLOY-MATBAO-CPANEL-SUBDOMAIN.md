# Deploy Mắt Bão Linux (cPanel + API Subdomain)

Tài liệu này chuẩn hóa deploy cho mô hình:

- Frontend: `https://SSEvietnam.com`
- Backend API: `https://api.SSEvietnam.com`

## 1) Kiến trúc deploy

- Frontend là static build từ Vite, upload vào `public_html/`.
- Backend là Node.js app (Express) chạy trong cPanel Node.js App ở subdomain API.
- Frontend gọi API qua biến môi trường:

```env
VITE_API_URL=https://api.SSEvietnam.com/api
```

## 2) Pre-deploy checklist

- cPanel có Node.js App (Node 18+).
- Đã tạo subdomain `api.SSEvietnam.com`.
- SSL đã bật cho cả domain chính và subdomain API.
- Có SSH hoặc File Manager để upload.

## 3) Build và đóng gói artifact

Từ máy local:

```bash
npm run deploy:prepare:cpanel-subdomain
```

Lệnh trên sẽ:

- Build frontend + backend
- Tạo thư mục deploy tại `.deploy/matbao-cpanel-subdomain/`
- Sinh 2 gói upload:
  - `frontend-public_html/`
  - `backend-api-app/`

## 4) Upload lên cPanel

### Frontend

- Upload toàn bộ nội dung `frontend-public_html/` vào `public_html/`.
- Đảm bảo `.htaccess` có SPA rewrite về `index.html`.

### Backend (API subdomain)

- Upload toàn bộ nội dung `backend-api-app/` vào thư mục root app của subdomain API (ví dụ `~/api/`).
- Trong cPanel Node.js App:
  - Startup file: `dist/index.js`
  - Chạy install: `npm ci --omit=dev`
  - Restart app

## 5) Environment variables khuyến nghị

Thiết lập trong Node.js App (không commit file `.env` thật):

```env
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
DATABASE_PATH=./database/SSE.db
CORS_ORIGIN=https://SSEvietnam.com,https://www.SSEvietnam.com
TZ=Asia/Ho_Chi_Minh
```

Lưu ý:

- `CORS_ORIGIN` hỗ trợ nhiều domain, ngăn cách bằng dấu phẩy.
- Không dùng default JWT secret ở production.

## 6) Frontend env production

Tại root project trước khi build frontend:

```env
VITE_API_URL=https://api.SSEvietnam.com/api
```

## 7) Health check và smoke test

Sau khi restart backend:

1. `https://api.SSEvietnam.com/health`
2. `https://api.SSEvietnam.com/api/health`

Cả 2 endpoint đều phải trả:

```json
{"status":"ok","message":"SSE API is running"}
```

## 8) Go-live checklist

- Đăng nhập frontend thành công.
- Dashboard tải dữ liệu không lỗi CORS.
- Tạo ticket mới thành công.
- Comment + upload ảnh thành công.
- Điều phối kỹ thuật và lịch task hiển thị đúng.
- Generate report PDF hoạt động.
- Refresh trực tiếp URL sâu không 404 (SPA rewrite OK).

## 9) Backup và rollback

Backup hằng ngày:

- `database/SSE.db` (+ `SSE.db-wal` nếu có)
- thư mục `reports/`

Rollback nhanh:

1. Giữ bản snapshot theo timestamp của `dist/` (frontend/backend).
2. Upload lại snapshot gần nhất ổn định.
3. Restart Node.js App.
4. Chạy lại health check + smoke test.

## 10) Giới hạn hiện tại và hướng nâng cấp

- SQLite trên shared hosting có thể nghẽn khi tải cao/concurrency lớn.
- Khi số người dùng tăng, nên chuyển sang MySQL/PostgreSQL.
- Nên bổ sung giám sát lỗi backend (5xx) và log aggregation.
