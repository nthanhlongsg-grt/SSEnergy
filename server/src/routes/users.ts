import { Router } from 'express'
import bcrypt from 'bcryptjs'
import db from '../database/db.js'
import { CreateUserDto, UpdateUserDto, UserRole, isAdminRole } from '../types/index.js'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { syncUserData } from '../database/sync.js'
import { maskSystemUser, isSystemUserId, SYSTEM_USER_CONSTANTS } from '../utils/systemUser.js'

const router = Router()

// Get all users
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const user = req.user!
    const { status, limit } = req.query

    // Allow ADMIN, DEV, SERVICE_CENTER, TECHNICIAN to view users
    // For watchers functionality, we need to allow more roles
    const allowedRoles = [UserRole.ADMIN, UserRole.DEV, UserRole.SERVICE_CENTER, UserRole.TECHNICIAN]
    if (!allowedRoles.includes(user.role as UserRole)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const placeholders = SYSTEM_USER_CONSTANTS.emails.map(() => '?').join(',')
    let query = `
      SELECT id, name, email, code, role, function, organization, status, phone, created_at, updated_at
      FROM users
      WHERE LOWER(email) NOT IN (${placeholders})
    `
    const params: any[] = [...SYSTEM_USER_CONSTANTS.emails.map((email) => email.toLowerCase())]

    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }

    query += ' ORDER BY created_at DESC'

    if (limit) {
      query += ' LIMIT ?'
      params.push(parseInt(limit as string))
    }

    const users = db.prepare(query).all(...params) as any[]

    res.json(users.map((user) => (maskSystemUser(user) as typeof user)))
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get current user profile (for editing own profile)
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, code, role, function, organization, status, phone, address, parent_distributor_id, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(req.user!.id) as any

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(maskSystemUser(user) || user)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Change password for current user
router.put('/me/password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Mật khẩu cũ và mật khẩu mới là bắt buộc' })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
    }

    // Get current user with password
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
    if (!user) {
      return res.status(404).json({ error: 'Người dùng không tồn tại' })
    }

    // Verify old password
    const isValidPassword = await bcrypt.compare(oldPassword, user.password)
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Mật khẩu cũ không đúng' })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashedPassword, userId)

    res.json({ message: 'Đổi mật khẩu thành công' })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Lỗi server' })
  }
})

// Upload avatar for current user
router.post('/me/avatar', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const { avatar } = req.body // Expecting base64 string

    if (!avatar) {
      return res.status(400).json({ error: 'Avatar data is required' })
    }

    // Validate base64 format
    const base64Regex = /^data:image\/(png|jpeg|jpg|gif|webp);base64,/
    if (!base64Regex.test(avatar)) {
      return res.status(400).json({ error: 'Invalid image format. Only PNG, JPEG, JPG, GIF, and WEBP are allowed.' })
    }

    // Update avatar in database
    db.prepare('UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(avatar, userId)

    // Get updated user
    const updatedUser = db.prepare(`
      SELECT id, name, email, code, role, organization, status, phone, address, avatar, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(userId) as any

    res.json({ message: 'Avatar uploaded successfully', avatar: updatedUser.avatar })
  } catch (error) {
    console.error('Upload avatar error:', error)
    res.status(500).json({ error: 'Lỗi server' })
  }
})

// Delete avatar for current user
router.delete('/me/avatar', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id

    // Remove avatar from database
    db.prepare('UPDATE users SET avatar = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(userId)

    res.json({ message: 'Avatar deleted successfully' })
  } catch (error) {
    console.error('Delete avatar error:', error)
    res.status(500).json({ error: 'Lỗi server' })
  }
})

// Update current user profile
router.put('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id
    const { name, email, phone, code, organization, address, function: userFunction } = req.body

    // Check if email is being changed and if it's already taken
    if (email) {
      const emailCheck = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, userId) as any
      if (emailCheck) {
        return res.status(400).json({ error: 'Email already exists' })
      }
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []

    if (name) {
      updates.push('name = ?')
      values.push(name)
    }
    if (email) {
      updates.push('email = ?')
      values.push(email)
    }
    if (phone !== undefined) {
      updates.push('phone = ?')
      values.push(phone || null)
    }
    if (code !== undefined) {
      updates.push('code = ?')
      values.push(code || null)
    }
    if (organization !== undefined) {
      updates.push('organization = ?')
      values.push(organization || null)
    }
    if (address !== undefined) {
      updates.push('address = ?')
      values.push(address || null)
    }
    if (userFunction !== undefined) {
      updates.push('function = ?')
      values.push(userFunction || null)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(userId)

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)

    // Auto-sync to customers and distributors
    syncUserData(userId)

    const updatedUser = db.prepare(`
      SELECT id, name, email, code, role, function, organization, status, phone, address, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(userId) as any

    res.json(updatedUser)
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get user by ID
router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id)
    
    // Users can only view their own profile unless they're admin
    if (req.user!.id !== userId && !isAdminRole(req.user!.role)) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const user = db.prepare(`
      SELECT id, name, email, code, role, function, organization, status, phone, address, parent_distributor_id, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(userId) as any

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(maskSystemUser(user) || user)
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create user
router.post('/', authenticateToken, requireRole(UserRole.ADMIN, UserRole.DEV), async (req: AuthRequest, res) => {
  try {
    const userData: CreateUserDto = req.body
    const requesterRole = req.user!.role

    // Validate required fields
    if (!userData.name || !userData.email || !userData.password || !userData.role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' })
    }

    if (userData.role === UserRole.DEV && requesterRole !== UserRole.DEV) {
      return res.status(403).json({ error: 'Only developer accounts can create Developer users' })
    }

    // Check if email already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(userData.email) as any
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' })
    }

    // Validate parent_distributor_id if provided (can be from distributors table)
    if (userData.parent_distributor_id) {
      // Check if it exists in distributors table
      const distributor = db.prepare('SELECT id, status FROM distributors WHERE id = ?').get(userData.parent_distributor_id) as { id: number; status: string } | undefined
      if (!distributor) {
        return res.status(400).json({ error: 'Distributor not found' })
      }
      if (distributor.status !== 'active') {
        return res.status(400).json({ error: 'Distributor is not active' })
      }
      // Only allow parent_distributor_id for end_user role
      if (userData.role !== UserRole.END_USER) {
        return res.status(400).json({ error: 'parent_distributor_id can only be set for end_user role' })
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10)

    const result = db.prepare(`
      INSERT INTO users (name, email, password, code, role, function, organization, status, parent_distributor_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userData.name,
      userData.email,
      hashedPassword,
      userData.code || null,
      userData.role,
      userData.function || null,
      userData.organization || null,
      userData.status || 'active',
      userData.parent_distributor_id || null
    )

    const newUser = db.prepare(`
      SELECT id, name, email, code, role, function, organization, status, parent_distributor_id, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(result.lastInsertRowid) as any

    // Auto-sync to customers and distributors
    syncUserData(Number(result.lastInsertRowid))

    res.status(201).json(maskSystemUser(newUser) || newUser)
  } catch (error) {
    console.error('Create user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update user (Admin only, or user updating their own profile)
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id)
    const userData: UpdateUserDto = req.body
    const requesterRole = req.user!.role

    if (userData.role === UserRole.DEV && requesterRole !== UserRole.DEV) {
      return res.status(403).json({ error: 'Only Developer accounts can assign the Developer role' })
    }

    // Validate parent_distributor_id if provided (can be from distributors table)
    if (userData.parent_distributor_id !== undefined) {
      if (userData.parent_distributor_id) {
        // Check if it exists in distributors table
        const distributor = db.prepare('SELECT id, status FROM distributors WHERE id = ?').get(userData.parent_distributor_id) as { id: number; status: string } | undefined
        if (!distributor) {
          return res.status(400).json({ error: 'Distributor not found' })
        }
        if (distributor.status !== 'active') {
          return res.status(400).json({ error: 'Distributor is not active' })
        }
      }
      // Only allow parent_distributor_id for end_user role
      const currentUser = db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as { role: string } | undefined
      const targetRole = userData.role || currentUser?.role
      if (targetRole !== UserRole.END_USER) {
        return res.status(400).json({ error: 'parent_distributor_id can only be set for end_user role' })
      }
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as any
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Check if email is being changed and if it's already taken
    if (userData.email) {
      const emailCheck = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(userData.email, userId) as any
      if (emailCheck) {
        return res.status(400).json({ error: 'Email already exists' })
      }
    }

    // Build update query dynamically
    const updates: string[] = []
    const values: any[] = []

    if (userData.name) {
      updates.push('name = ?')
      values.push(userData.name)
    }
    if (userData.email) {
      updates.push('email = ?')
      values.push(userData.email)
    }
    if (userData.password) {
      const hashedPassword = await bcrypt.hash(userData.password, 10)
      updates.push('password = ?')
      values.push(hashedPassword)
    }
    if (userData.code !== undefined) {
      updates.push('code = ?')
      values.push(userData.code || null)
    }
    if (userData.role) {
      updates.push('role = ?')
      values.push(userData.role)
    }
    if (userData.organization !== undefined) {
      updates.push('organization = ?')
      values.push(userData.organization || null)
    }
    if (userData.phone !== undefined) {
      updates.push('phone = ?')
      values.push(userData.phone || null)
    }
    if (userData.address !== undefined) {
      updates.push('address = ?')
      values.push(userData.address || null)
    }
    if (userData.function !== undefined) {
      updates.push('function = ?')
      values.push(userData.function || null)
    }
    if (userData.status) {
      updates.push('status = ?')
      values.push(userData.status)
    }
    if (userData.parent_distributor_id !== undefined) {
      updates.push('parent_distributor_id = ?')
      values.push(userData.parent_distributor_id || null)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(userId)

    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)

    // Auto-sync to customers and distributors
    syncUserData(userId)

    const updatedUser = db.prepare(`
      SELECT id, name, email, code, role, function, organization, status, phone, address, parent_distributor_id, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(userId) as any

    res.json(maskSystemUser(updatedUser) || updatedUser)
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete user
router.delete('/:id', authenticateToken, requireRole(UserRole.ADMIN), (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id)

    // Prevent deleting own account
    if (req.user!.id === userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' })
    }

    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as any
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId)

    res.status(204).send()
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
