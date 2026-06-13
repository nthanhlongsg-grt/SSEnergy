import { Router } from 'express'
import fs from 'fs'
import { authenticateToken, requireRole } from '../middleware/auth.js'
import { UserRole } from '../types/index.js'
import { STAMP_PATH } from '../utils/stampPath.js'

const router = Router()

/** Con dấu/chữ ký — chỉ nhân viên được xuất báo giá, không public static */
router.get(
  '/stamp',
  authenticateToken,
  requireRole(
    UserRole.ADMIN,
    UserRole.SERVICE_CENTER,
    UserRole.TECHNICIAN,
    UserRole.ACCOUNTING,
  ),
  (_req, res) => {
    try {
      if (!STAMP_PATH || !fs.existsSync(STAMP_PATH)) {
        return res.status(404).json({
          error: 'Không tìm thấy file con dấu trên server',
          hint: 'Upload server/private/stamp.png hoặc đặt STAMP_IMAGE_PATH trong .env',
        })
      }
      res.setHeader('Content-Type', 'image/png')
      res.setHeader('Cache-Control', 'private, no-store')
      res.setHeader('X-Content-Type-Options', 'nosniff')
      fs.createReadStream(STAMP_PATH).pipe(res)
    } catch (err: any) {
      res.status(500).json({ error: err.message })
    }
  },
)

export default router
