import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.join(__dirname, '..')
const distDir = path.join(serverRoot, 'dist')
const stampSrc = path.join(serverRoot, 'private', 'stamp.png')
const stampDestDir = path.join(distDir, 'private')
const stampDest = path.join(stampDestDir, 'stamp.png')

// Generate a CommonJS startup wrapper so hosts that boot the app via require()
// (e.g. LiteSpeed lsnode / Phusion Passenger on Plesk) can load the ESM build.
// require() cannot load ES Modules, but a .cjs file can dynamically import() one.
const startCjsDest = path.join(distDir, 'start.cjs')
const startCjsContent = `// Auto-generated CommonJS entry. Set this as the app "startup file" on hosts
// that load Node apps via require() (LiteSpeed lsnode / Passenger), which cannot
// require() an ES Module directly. Dynamic import() works from CommonJS.
import('./index.js').catch((err) => {
  console.error('Failed to start application:', err)
  process.exit(1)
})
`
fs.mkdirSync(distDir, { recursive: true })
fs.writeFileSync(startCjsDest, startCjsContent)
console.log('[copy-build-assets] Wrote dist/start.cjs (CommonJS startup wrapper)')

const dbUpkeepDest = path.join(distDir, 'db-upkeep.cjs')
const dbUpkeepContent = `// Run DB maintenance on production (no git source / tsx required).
// Stop the Node app first, then from the api app root (sge-api/):
//   node dist/db-upkeep.cjs sync
//   node dist/db-upkeep.cjs migrate
//   node dist/db-upkeep.cjs all
// Optional: DATABASE_PATH=./database/SSE.db
const { spawnSync } = require('node:child_process')
const path = require('node:path')

const task = (process.argv[2] || 'all').toLowerCase()
const distDir = __dirname

function runScript(relative) {
  const script = path.join(distDir, relative)
  const result = spawnSync(process.execPath, [script], {
    stdio: 'inherit',
    env: process.env,
  })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

if (task === 'sync' || task === 'all') {
  runScript('database/runSchemaSync.js')
}
if (task === 'migrate' || task === 'all') {
  runScript('database/migrate.js')
}
if (!['sync', 'migrate', 'all'].includes(task)) {
  console.error('Usage: node dist/db-upkeep.cjs [sync|migrate|all]')
  process.exit(1)
}
`
fs.writeFileSync(dbUpkeepDest, dbUpkeepContent)
console.log('[copy-build-assets] Wrote dist/db-upkeep.cjs (production DB migrate helper)')

if (!fs.existsSync(stampSrc)) {
  console.warn('[copy-build-assets] Warning: server/private/stamp.png not found — quotation stamp will be missing')
  process.exit(0)
}

fs.mkdirSync(stampDestDir, { recursive: true })
fs.copyFileSync(stampSrc, stampDest)
console.log('[copy-build-assets] Copied stamp.png → dist/private/stamp.png')
