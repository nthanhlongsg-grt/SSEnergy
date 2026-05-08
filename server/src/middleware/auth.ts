import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UserRole } from '../types/index.js'

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

  const jwtSecret = process.env.JWT_SECRET || 'your-secret-key'

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' })
    }
    req.user = user as { id: number; email: string; role: UserRole }
    next()
  })
}

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userRole = req.user.role
    const effectiveRoles = roles.includes(UserRole.ADMIN)
      ? Array.from(new Set([UserRole.DEV, ...roles]))
      : roles

    if (!effectiveRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    next()
  }
}
