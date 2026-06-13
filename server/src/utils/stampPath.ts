import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** Resolve stamp.png for quotation export (works in dev + production dist-only deploy). */
export function resolveStampPath(): string | null {
  const envPath = process.env.STAMP_IMAGE_PATH?.trim()
  if (envPath && fs.existsSync(envPath)) {
    return envPath
  }

  const candidates = [
    path.join(__dirname, '../private/stamp.png'),
    path.join(__dirname, '../../private/stamp.png'),
    path.join(process.cwd(), 'private/stamp.png'),
    path.join(process.cwd(), 'dist/private/stamp.png'),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate
  }

  return null
}

export const STAMP_PATH = resolveStampPath()

if (!STAMP_PATH && process.env.NODE_ENV === 'production') {
  console.warn(
    '[quotation] stamp.png not found — báo giá sẽ không có con dấu. ' +
      'Chạy `npm run build` trong server/ hoặc đặt STAMP_IMAGE_PATH trong .env',
  )
}
