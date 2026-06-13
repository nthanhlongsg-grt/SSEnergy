import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.join(__dirname, '..')
const stampSrc = path.join(serverRoot, 'private', 'stamp.png')
const stampDestDir = path.join(serverRoot, 'dist', 'private')
const stampDest = path.join(stampDestDir, 'stamp.png')

if (!fs.existsSync(stampSrc)) {
  console.warn('[copy-build-assets] Warning: server/private/stamp.png not found — quotation stamp will be missing')
  process.exit(0)
}

fs.mkdirSync(stampDestDir, { recursive: true })
fs.copyFileSync(stampSrc, stampDest)
console.log('[copy-build-assets] Copied stamp.png → dist/private/stamp.png')
