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

if (!fs.existsSync(stampSrc)) {
  console.warn('[copy-build-assets] Warning: server/private/stamp.png not found — quotation stamp will be missing')
  process.exit(0)
}

fs.mkdirSync(stampDestDir, { recursive: true })
fs.copyFileSync(stampSrc, stampDest)
console.log('[copy-build-assets] Copied stamp.png → dist/private/stamp.png')
