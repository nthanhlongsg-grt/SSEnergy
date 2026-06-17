/**
 * Import production SQLite DB for local dev.
 *
 * Usage:
 *   npm run db:import -- "C:/Users/.../Downloads/SGE.db"
 *
 * Or set PRODUCTION_DB_PATH in env / .env
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'
import Database from 'better-sqlite3'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serverRoot = path.resolve(__dirname, '..')

const sourceArg = process.argv[2] || process.env.PRODUCTION_DB_PATH
if (!sourceArg) {
  console.error('❌ Thiếu đường dẫn file DB production.')
  console.error('   npm run db:import -- "C:/Users/.../Downloads/SGE.db"')
  process.exit(1)
}

const sourcePath = path.resolve(sourceArg)
const targetDir = path.resolve(serverRoot, 'database')
const targetPath = path.join(targetDir, 'SGE.db')
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

if (!fs.existsSync(sourcePath)) {
  console.error(`❌ Không tìm thấy file: ${sourcePath}`)
  process.exit(1)
}

const sourceStat = fs.statSync(sourcePath)
console.log(`📥 Nguồn: ${sourcePath} (${(sourceStat.size / 1024 / 1024).toFixed(2)} MB)`)

// Quick integrity check on source before replacing local DB
try {
  const probe = new Database(sourcePath, { readonly: true })
  const integrity = probe.pragma('integrity_check') as Array<{ integrity_check: string }>
  const ok = integrity.every((row) => row.integrity_check === 'ok')
  if (!ok) {
    console.error('❌ File DB production bị lỗi integrity:', integrity)
    probe.close()
    process.exit(1)
  }
  probe.close()
  console.log('✅ Integrity check OK')
} catch (err) {
  console.error('❌ Không mở được file DB:', err)
  process.exit(1)
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true })
}

if (fs.existsSync(targetPath)) {
  const backupPath = path.join(targetDir, `SGE.db.local-backup-${timestamp}.db`)
  fs.copyFileSync(targetPath, backupPath)
  console.log(`💾 Backup DB local cũ → ${backupPath}`)
}

for (const suffix of ['-wal', '-shm']) {
  const sidecar = targetPath + suffix
  if (fs.existsSync(sidecar)) {
    fs.unlinkSync(sidecar)
    console.log(`🗑️  Xóa ${path.basename(sidecar)}`)
  }
}

fs.copyFileSync(sourcePath, targetPath)
console.log(`✅ Đã copy → ${targetPath}`)

function runNpmScript(script: string) {
  console.log(`\n▶ npm run ${script}`)
  const result = spawnSync('npm', ['run', script], {
    cwd: serverRoot,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, DATABASE_PATH: './database/SGE.db' },
  })
  if (result.status !== 0) {
    throw new Error(`Script failed: ${script}`)
  }
}

try {
  runNpmScript('db:sync')
  runNpmScript('db:migrate')
  runNpmScript('db:migrate:attachments')
  runNpmScript('db:optimize')
} catch (err) {
  console.error('❌ Import/sync failed:', err)
  process.exit(1)
}

const finalSize = fs.statSync(targetPath).size
console.log(`\n✅ Hoàn tất. DB local: ${targetPath} (${(finalSize / 1024 / 1024).toFixed(2)} MB)`)
console.log('💡 Restart backend (npm run dev) và đăng nhập bằng tài khoản production.')
console.log('   Xem admin: npm run db:get:admin')
