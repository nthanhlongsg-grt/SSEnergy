import fs from 'node:fs'
import path from 'node:path'

const APP_URL = 'https://baohanh.ssenergy.vn'
const API_URL = `${APP_URL}/api`

const rootDir = process.cwd()
const deployDir = path.join(rootDir, '.deploy', 'baohanh-ssenergy')
const frontendSource = path.join(rootDir, 'dist')
const backendSource = path.join(rootDir, 'server', 'dist')
const backendRoot = path.join(rootDir, 'server')

for (const item of [
  { label: 'Frontend build', path: frontendSource },
  { label: 'Backend build', path: backendSource },
]) {
  if (!fs.existsSync(item.path)) {
    console.error(`Missing ${item.label}: ${item.path}`)
    console.error('Run: npm run build:all')
    process.exit(1)
  }
}

fs.rmSync(deployDir, { recursive: true, force: true })
fs.mkdirSync(deployDir, { recursive: true })

const publicHtml = path.join(deployDir, 'public_html')
const apiApp = path.join(deployDir, 'api-server')
fs.mkdirSync(publicHtml, { recursive: true })
fs.mkdirSync(apiApp, { recursive: true })

const copySafe = (src, dest) => {
  if (fs.existsSync(src)) fs.cpSync(src, dest, { recursive: true })
}

copySafe(frontendSource, publicHtml)
copySafe(path.join(rootDir, '.htaccess.example'), path.join(publicHtml, '.htaccess'))
copySafe(path.join(rootDir, 'deploy', 'nginx', 'baohanh.ssenergy.vn.conf'), path.join(deployDir, 'nginx.conf'))

copySafe(path.join(backendRoot, 'dist'), path.join(apiApp, 'dist'))
copySafe(path.join(backendRoot, 'package.json'), path.join(apiApp, 'package.json'))
copySafe(path.join(backendRoot, 'package-lock.json'), path.join(apiApp, 'package-lock.json'))
copySafe(path.join(backendRoot, 'env.example.txt'), path.join(apiApp, '.env.example'))
copySafe(path.join(backendRoot, 'ecosystem.config.cjs'), path.join(apiApp, 'ecosystem.config.cjs'))
copySafe(path.join(backendRoot, 'database'), path.join(apiApp, 'database'))
copySafe(path.join(backendRoot, 'reports'), path.join(apiApp, 'reports'))
copySafe(path.join(backendRoot, 'private'), path.join(apiApp, 'private'))

const readme = [
  `DEPLOY PACKAGE — ${APP_URL}/`,
  '',
  '=== Mắt Bão / cPanel (khuyến nghị) ===',
  '',
  '1) public_html/*  → document root subdomain baohanh.ssenergy.vn',
  '   (đã kèm .htaccess proxy /api → Node.js port 3000)',
  '',
  '2) api-server/*   → thư mục Node.js App (cPanel → Setup Node.js App)',
  '   - Application startup file: dist/index.js',
  '   - Application URL: (để trống hoặc subdomain riêng nếu không dùng proxy)',
  '   - cd api-server && npm ci --omit=dev',
  '   - npm rebuild better-sqlite3   (nếu lỗi native module trên server)',
  '   - Restart app',
  '',
  'Frontend build env (.env.production):',
  `  VITE_API_URL=${API_URL}`,
  '',
  'Backend env (cPanel Node.js App hoặc file .env):',
  '  NODE_ENV=production',
  '  PORT=3000',
  '  JWT_SECRET=<strong-random-secret>',
  `  CORS_ORIGIN=${APP_URL}`,
  '  DATABASE_PATH=./database/SSE.db',
  '  TZ=Asia/Ho_Chi_Minh',
  '  STAMP_IMAGE_PATH=./private/stamp.png',
  '',
  '=== Linux VPS (Nginx + PM2) ===',
  '',
  '  cd api-server && npm ci --omit=dev && cp .env.example .env',
  '  pm2 start ecosystem.config.cjs',
  '  sudo cp nginx.conf /etc/nginx/sites-available/baohanh.ssenergy.vn',
  '',
  'Kiểm tra:',
  `  curl ${API_URL}/health`,
  '',
  'Kỳ vọng: {"status":"ok","message":"SSE API is running"}',
].join('\n')

fs.writeFileSync(path.join(deployDir, 'README-UPLOAD.txt'), readme, 'utf8')
console.log(`Deploy package ready: ${deployDir}`)
