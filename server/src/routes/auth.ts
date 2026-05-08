import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt, { SignOptions } from 'jsonwebtoken'
import db from '../database/db.js'
import { LoginDto, AuthResponse } from '../types/index.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { maskSystemUser } from '../utils/systemUser.js'

const router = Router()

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password }: LoginDto = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' })
    }

    const jwtSecret: string = process.env.JWT_SECRET || 'your-secret-key'
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      jwtSecret,
      { expiresIn } as SignOptions
    )

    const { password: _, ...userWithoutPassword } = user

    const response: AuthResponse = {
      token,
      user: (maskSystemUser(userWithoutPassword) as typeof userWithoutPassword) || userWithoutPassword,
    }

    res.json(response)
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Register (Sign up) - Public endpoint for end users only
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, address, customerType, organization, password } = req.body

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc' })
    }

    // Determine customer type based on organization
    const finalCustomerType = organization ? (customerType || 'enterprise') : 'residential'

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email không hợp lệ' })
    }

    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' })
    }

    // Check if email already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email) as any
    if (existingUser) {
      return res.status(400).json({ error: 'Email đã được sử dụng' })
    }

    // Check if phone already exists
    if (phone) {
      const existingPhone = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone) as any
      if (existingPhone) {
        return res.status(400).json({ error: 'Số điện thoại đã được sử dụng' })
      }
    }

    // Combine first and last name
    const fullName = `${firstName} ${lastName}`.trim()

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Start transaction to create both user and customer
    const createUser = db.transaction(() => {
      // Create user with END_USER role
      const userResult = db.prepare(`
        INSERT INTO users (name, email, password, role, status, phone, address, organization)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        fullName,
        email,
        hashedPassword,
        'end_user', // Fixed role for public registration
        'active', // Auto-activate end user accounts
        phone || null,
        address || null,
        organization || null
      )

      // Create customer record linked to user
      const customerResult = db.prepare(`
        INSERT INTO customers (name, email, phone, address, customer_type, organization)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        fullName,
        email,
        phone || null,
        address || null,
        finalCustomerType, // 'residential' or 'enterprise'
        organization || null
      )

      return {
        userId: userResult.lastInsertRowid,
        customerId: customerResult.lastInsertRowid,
      }
    })

    const { userId } = createUser()

    const newUser = db.prepare(`
      SELECT id, name, email, code, role, organization, status, phone, address, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(userId) as any

    // Generate JWT token for auto-login after registration
    const jwtSecret: string = process.env.JWT_SECRET || 'your-secret-key'
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      jwtSecret,
      { expiresIn } as SignOptions
    )

    const response: AuthResponse = {
      token,
      user: newUser,
    }

    res.status(201).json(response)
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Lỗi hệ thống. Vui lòng thử lại sau.' })
  }
})

// Get current user
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  try {
    // Get table info to check which columns exist
    const tableInfo = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>
    const columnNames = tableInfo.map(col => col.name)
    
    // Build SELECT query with only existing columns
    const selectColumns = [
      'id', 'name', 'email', 'code', 'role', 'function', 
      'organization', 'status', 'phone', 'address', 
      'parent_distributor_id', 'created_at', 'updated_at'
    ].filter(col => columnNames.includes(col))
    
    // Add avatar if it exists
    if (columnNames.includes('avatar')) {
      selectColumns.push('avatar')
    }
    
    const user = db.prepare(`SELECT ${selectColumns.join(', ')} FROM users WHERE id = ?`).get(req.user!.id) as any

    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const maskedUser = maskSystemUser(user)
    res.json(maskedUser || user)
  } catch (error) {
    console.error('Get user error:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
