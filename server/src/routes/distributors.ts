import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

// Get all distributors from distributors table
router.get('/', authenticateToken, (req, res) => {
  try {
    const { search, status = 'active' } = req.query
    
    let query = `
      SELECT 
        id,
        name,
        code,
        contact_person,
        email,
        phone,
        address,
        tax_code,
        status,
        notes,
        created_at,
        updated_at
      FROM distributors
      WHERE 1=1
    `
    const params: any[] = []

    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }

    if (search) {
      query += ' AND (name LIKE ? OR code LIKE ? OR email LIKE ? OR phone LIKE ? OR contact_person LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
    }

    query += ' ORDER BY name ASC'

    const distributors = db.prepare(query).all(...params) as any[]

    res.json(distributors)
  } catch (error) {
    console.error('Get distributors error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get distributor by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const id = parseInt(req.params.id)
    
    const distributor = db.prepare('SELECT * FROM distributors WHERE id = ?').get(id) as any

    if (!distributor) {
      return res.status(404).json({ error: 'Distributor not found' })
    }

    res.json(distributor)
  } catch (error) {
    console.error('Get distributor error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

