import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const deployDir = path.join(rootDir, '.deploy', 'baohanh-sgesolartech')
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
copySafe(path.join(rootDir, 'deploy', 'nginx', 'baohanh.sgesolartech.vn.conf'), path.join(deployDir, 'nginx.conf'))

copySafe(path.join(backendRoot, 'dist'), path.join(apiApp, 'dist'))
copySafe(path.join(backendRoot, 'package.json'), path.join(apiApp, 'package.json'))
copySafe(path.join(backendRoot, 'package-lock.json'), path.join(apiApp, 'package-lock.json'))
copySafe(path.join(backendRoot, 'env.example.txt'), path.join(apiApp, '.env.example'))
copySafe(path.join(backendRoot, 'ecosystem.config.cjs'), path.join(apiApp, 'ecosystem.config.cjs'))
copySafe(path.join(backendRoot, 'database'), path.join(apiApp, 'database'))
copySafe(path.join(backendRoot, 'reports'), path.join(apiApp, 'reports'))
copySafe(path.join(backendRoot, 'private'), path.join(apiApp, 'private'))

const readme = [
  'DEPLOY PACKAGE — https://baohanh.sgesolartech.vn/',
  '',
  '1) public_html/*     → document root (Vite dist + .htaccess)',
  '2) api-server/*      → Node.js app (PM2 hoặc cPanel Node.js)',
  '',
  'Frontend build env (.env.production):',
  '  VITE_API_URL=https://baohanh.sgesolartech.vn/api',
  '',
  'Backend env (server/.env):',
  '  NODE_ENV=production',
  '  PORT=3000',
  '  JWT_SECRET=<strong-secret>',
  '  CORS_ORIGIN=https://baohanh.sgesolartech.vn',
  '  DATABASE_PATH=./database/SSE.db',
  '  TZ=Asia/Ho_Chi_Minh',
  '  STAMP_IMAGE_PATH=./private/stamp.png   # con dấu báo giá (hoặc ./dist/private/stamp.png)',
  '',
  'Linux (PM2):',
  '  cd api-server && npm ci --omit=dev',
  '  cp .env.example .env  # chỉnh JWT_SECRET',
  '  pm2 start ecosystem.config.cjs',
  '',
  'Nginx: xem nginx.conf trong gói này.',
  '',
  'Kiểm tra:',
  '  node scripts/smoke-test-api-subdomain.mjs https://baohanh.sgesolartech.vn',
].join('\n')

fs.writeFileSync(path.join(deployDir, 'README-UPLOAD.txt'), readme, 'utf8')
console.log(`Deploy package ready: ${deployDir}`)
