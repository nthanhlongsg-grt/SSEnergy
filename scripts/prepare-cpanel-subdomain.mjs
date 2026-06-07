import fs from 'node:fs'
import path from 'node:path'

const rootDir = process.cwd()
const deployDir = path.join(rootDir, '.deploy', 'matbao-cpanel-subdomain')
const frontendSource = path.join(rootDir, 'dist')
const backendSource = path.join(rootDir, 'server', 'dist')
const backendRoot = path.join(rootDir, 'server')

const requiredPaths = [
  { label: 'Frontend build', path: frontendSource },
  { label: 'Backend build', path: backendSource },
]

for (const item of requiredPaths) {
  if (!fs.existsSync(item.path)) {
    console.error(`Missing ${item.label}: ${item.path}`)
    console.error('Run frontend and backend build before packaging deploy artifacts.')
    process.exit(1)
  }
}

fs.rmSync(deployDir, { recursive: true, force: true })
fs.mkdirSync(deployDir, { recursive: true })

const frontendTarget = path.join(deployDir, 'frontend-public_html')
const backendTarget = path.join(deployDir, 'backend-api-app')
fs.mkdirSync(frontendTarget, { recursive: true })
fs.mkdirSync(backendTarget, { recursive: true })

const copySafe = (sourcePath, targetPath) => {
  if (fs.existsSync(sourcePath)) {
    fs.cpSync(sourcePath, targetPath, { recursive: true })
  }
}

// Frontend upload package (upload contents into public_html)
copySafe(frontendSource, frontendTarget)
copySafe(path.join(rootDir, '.htaccess.example'), path.join(frontendTarget, '.htaccess.example'))

// Backend upload package (upload into API subdomain application root)
copySafe(path.join(backendRoot, 'dist'), path.join(backendTarget, 'dist'))
copySafe(path.join(backendRoot, 'package.json'), path.join(backendTarget, 'package.json'))
copySafe(path.join(backendRoot, 'package-lock.json'), path.join(backendTarget, 'package-lock.json'))
copySafe(path.join(backendRoot, 'env.example.txt'), path.join(backendTarget, '.env.example'))
copySafe(path.join(backendRoot, 'database'), path.join(backendTarget, 'database'))
copySafe(path.join(backendRoot, 'reports'), path.join(backendTarget, 'reports'))

const readmePath = path.join(deployDir, 'README-UPLOAD.txt')
const readme = [
  'MAT BAO CPANEL SUBDOMAIN DEPLOY PACKAGE',
  '',
  '1) frontend-public_html/*  -> upload to public_html/ (main domain)',
  '2) backend-api-app/*      -> upload to Node.js app root for api subdomain',
  '',
  'After upload backend:',
  '- npm ci --omit=dev',
  '- set environment variables in cPanel Node.js app',
  '- restart app',
  '',
  'Environment baseline:',
  '- NODE_ENV=production',
  '- JWT_SECRET=<strong-secret>',
  '- CORS_ORIGIN=https://baohanh.sgesolartech.vn',
  '- TZ=Asia/Ho_Chi_Minh',
].join('\n')

fs.writeFileSync(readmePath, readme, 'utf8')

console.log(`Deploy package ready: ${deployDir}`)
