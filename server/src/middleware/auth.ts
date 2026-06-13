import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import db from '../database/db.js'
import { UserRole } from '../types/index.js'
import { getJwtSecret } from '../config/env.js'

export interface AuthRequest extends Request {
  user?: {
    id: number
    email: string
    role: UserRole
  }
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  const jwtSecret = getJwtSecret()

  jwt.verify(token, jwtSecret, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }

    const decoded = payload as { id: number; email: string; role: UserRole }
    const row = db.prepare('SELECT id, email, role, status FROM users WHERE id = ?').get(decoded.id) as {
      id: number
      email: string
      role: UserRole
      status: string
    } | undefined

    if (!row) {
      return res.status(403).json({ error: 'User not found' })
    }
    if (row.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' })
    }

    // Luôn dùng role mới nhất từ DB (tránh JWT cũ sau khi admin đổi vai trò)
    req.user = { id: row.id, email: row.email, role: row.role }
    next()
  })
}

const expandAdminRoles = (roles: UserRole[], includeAccounting: boolean): UserRole[] => {
  if (!roles.includes(UserRole.ADMIN)) return roles
  const extras = includeAccounting ? [UserRole.DEV, UserRole.ACCOUNTING] : [UserRole.DEV]
  return Array.from(new Set([...extras, ...roles]))
}

const createRoleGuard = (includeAccounting: boolean) => {
  return (...roles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' })
      }

      const effectiveRoles = expandAdminRoles(roles, includeAccounting)

      if (!effectiveRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' })
      }

      next()
    }
  }
}

export const requireRole = createRoleGuard(true)

/** Admin/dev only — không bao gồm kế toán (SLA, auto-assign, sync hệ thống) */
export const requireSystemAdmin = createRoleGuard(false)
