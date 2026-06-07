import { Router } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { UserRole } from '../types/index.js'

const router = Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const STAMP_PATH =
  process.env.STAMP_IMAGE_PATH || path.join(__dirname, '../../private/stamp.png')

/** Con dấu/chữ ký — chỉ nhân viên nội bộ, không public static */
router.get(
  '/stamp',
  authenticateToken,
  requireRole(UserRole.ADMIN, UserRole.SERVICE_CENTER, UserRole.TECHNICIAN),
  (_req, res) => {
    try {
      if (!fs.existsSync(STAMP_PATH)) {
        return res.status(404).json({ error: 'Không tìm thấy file con dấu' })
      }
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Cache-Control', 'private, no-store')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      fs.createReadStream(STAMP_PATH).pipe(res)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  }
)

export default router
