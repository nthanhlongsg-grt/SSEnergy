import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { UserRole } from '../types/index.js'

const router = Router()

// Get all warehouse parts
router.get('/parts', authenticateToken, (req, res) => {
  try {
    const { search, category, status, low_stock, page = '1', limit = '50' } = req.query

    let query = 'SELECT * FROM warehouse_parts WHERE 1=1'
    const params: any[] = []

    if (search) {
      query += ' AND (name LIKE ? OR part_number LIKE ? OR description LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    if (category) {
      query += ' AND category = ?'
      params.push(category)
    }

    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }

    if (low_stock === 'true') {
      query += ' AND quantity <= min_quantity'
    }

    query += ' ORDER BY name ASC LIMIT ? OFFSET ?'
    const limitNum = parseInt(limit as string)
    const offset = (parseInt(page as string) - 1) * limitNum
    params.push(limitNum, offset)

    const parts = db.prepare(query).all(...params)

    res.json({
      data: parts,
      pagination: {
        page: parseInt(page as string),
        limit: limitNum,
      },
    })
  } catch (error) {
    console.error('Get warehouse parts error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get warehouse part by ID
router.get('/parts/:id', authenticateToken, (req, res) => {
  try {
    const partId = parseInt(req.params.id)
    const part = db.prepare('SELECT * FROM warehouse_parts WHERE id = ?').get(partId) as any

    if (!part) {
      return res.status(404).json({ error: 'Part not found' })
    }

    // Get transaction history
    const transactions = db.prepare(`
      SELECT wt.*, u.name as created_by_name
      FROM warehouse_transactions wt
      LEFT JOIN users u ON wt.created_by = u.id
      WHERE wt.part_id = ?
      ORDER BY wt.created_at DESC
      LIMIT 50
    `).all(partId)

    res.json({
      ...part,
      transactions,
    })
  } catch (error) {
    console.error('Get warehouse part error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create warehouse part
router.post('/parts', authenticateToken, requireRole(UserRole.ADMIN, UserRole.WAREHOUSE), (req, res) => {
  try {
    const {
      part_number,
      name,
      category,
      description,
      manufacturer,
      quantity = 0,
      min_quantity = 0,
      max_quantity,
      unit_price = 0,
      unit = 'pcs',
      supplier,
      location,
      status = 'active',
    } = req.body

    if (!part_number || !name) {
      return res.status(400).json({ error: 'Part number and name are required' })
    }

    // Check if part number already exists
    const existing = db.prepare('SELECT id FROM warehouse_parts WHERE part_number = ?').get(part_number) as any
    if (existing) {
      return res.status(400).json({ error: 'Part number already exists' })
    }

    const result = db.prepare(`
      INSERT INTO warehouse_parts (
        part_number, name, category, description, manufacturer,
        quantity, min_quantity, max_quantity, unit_price, unit,
        supplier, location, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      part_number,
      name,
      category || null,
      description || null,
      manufacturer || null,
      quantity,
      min_quantity,
      max_quantity || null,
      unit_price,
      unit,
      supplier || null,
      location || null,
      status
    )

    // Create initial transaction
    const user = (req as AuthRequest).user!
    db.prepare(`
      INSERT INTO warehouse_transactions (
        part_id, transaction_type, quantity, unit_price, notes, created_by
      )
      VALUES (?, 'initial', ?, ?, 'Initial stock', ?)
    `).run(result.lastInsertRowid, quantity, unit_price, user.id)

    const newPart = db.prepare('SELECT * FROM warehouse_parts WHERE id = ?').get(result.lastInsertRowid) as any

    res.status(201).json(newPart)
  } catch (error) {
    console.error('Create warehouse part error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update warehouse part
router.put('/parts/:id', authenticateToken, requireRole(UserRole.ADMIN, UserRole.WAREHOUSE), (req, res) => {
  try {
    const partId = parseInt(req.params.id)
    const part = db.prepare('SELECT id FROM warehouse_parts WHERE id = ?').get(partId) as any

    if (!part) {
      return res.status(404).json({ error: 'Part not found' })
    }

    const {
      part_number,
      name,
      category,
      description,
      manufacturer,
      min_quantity,
      max_quantity,
      unit_price,
      unit,
      supplier,
      location,
      status,
    } = req.body

    // Check if part number is being changed
    if (part_number) {
      const partCheck = db.prepare('SELECT id FROM warehouse_parts WHERE part_number = ? AND id != ?').get(part_number, partId) as any
      if (partCheck) {
        return res.status(400).json({ error: 'Part number already exists' })
      }
    }

    db.prepare(`
      UPDATE warehouse_parts
      SET part_number = COALESCE(?, part_number),
          name = COALESCE(?, name),
          category = COALESCE(?, category),
          description = COALESCE(?, description),
          manufacturer = COALESCE(?, manufacturer),
          min_quantity = COALESCE(?, min_quantity),
          max_quantity = COALESCE(?, max_quantity),
          unit_price = COALESCE(?, unit_price),
          unit = COALESCE(?, unit),
          supplier = COALESCE(?, supplier),
          location = COALESCE(?, location),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      part_number || null,
      name || null,
      category || null,
      description || null,
      manufacturer || null,
      min_quantity !== undefined ? min_quantity : null,
      max_quantity !== undefined ? max_quantity : null,
      unit_price !== undefined ? unit_price : null,
      unit || null,
      supplier || null,
      location || null,
      status || null,
      partId
    )

    const updatedPart = db.prepare('SELECT * FROM warehouse_parts WHERE id = ?').get(partId) as any

    res.json(updatedPart)
  } catch (error) {
    console.error('Update warehouse part error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update inventory (add/remove stock)
router.post('/parts/:id/inventory', authenticateToken, requireRole(UserRole.ADMIN, UserRole.WAREHOUSE), (req, res) => {
  try {
    const partId = parseInt(req.params.id)
    const { transaction_type, quantity, unit_price, notes, reference_type, reference_id } = req.body

    if (!transaction_type || !quantity) {
      return res.status(400).json({ error: 'Transaction type and quantity are required' })
    }

    const part = db.prepare('SELECT * FROM warehouse_parts WHERE id = ?').get(partId) as any
    if (!part) {
      return res.status(404).json({ error: 'Part not found' })
    }

    const user = (req as AuthRequest).user!

    // Update quantity based on transaction type
    let newQuantity = part.quantity
    if (transaction_type === 'in' || transaction_type === 'import' || transaction_type === 'return') {
      newQuantity += quantity
    } else if (transaction_type === 'out' || transaction_type === 'export' || transaction_type === 'use') {
      newQuantity -= quantity
      if (newQuantity < 0) {
        return res.status(400).json({ error: 'Insufficient stock' })
      }
    } else {
      return res.status(400).json({ error: 'Invalid transaction type' })
    }

    // Update part quantity
    db.prepare('UPDATE warehouse_parts SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newQuantity, partId)

    // Create transaction record
    db.prepare(`
      INSERT INTO warehouse_transactions (
        part_id, transaction_type, quantity, unit_price,
        reference_type, reference_id, notes, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      partId,
      transaction_type,
      quantity,
      unit_price || part.unit_price,
      reference_type || null,
      reference_id || null,
      notes || null,
      user.id
    )

    const updatedPart = db.prepare('SELECT * FROM warehouse_parts WHERE id = ?').get(partId) as any

    res.json(updatedPart)
  } catch (error) {
    console.error('Update inventory error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get RMA requests
router.get('/rma', authenticateToken, (req, res) => {
  try {
    const { status, customer_id, page = '1', limit = '50' } = req.query

    let query = `
      SELECT r.*,
             wp.name as part_name,
             wp.part_number,
             t.ticket_number,
             c.name as customer_name
      FROM rma_requests r
      LEFT JOIN warehouse_parts wp ON r.part_id = wp.id
      LEFT JOIN tickets t ON r.ticket_id = t.id
      LEFT JOIN customers c ON r.customer_id = c.id
      WHERE 1=1
    `
    const params: any[] = []

    if (status) {
      query += ' AND r.status = ?'
      params.push(status)
    }

    if (customer_id) {
      query += ' AND r.customer_id = ?'
      params.push(parseInt(customer_id as string))
    }

    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?'
    const limitNum = parseInt(limit as string)
    const offset = (parseInt(page as string) - 1) * limitNum
    params.push(limitNum, offset)

    const rmas = db.prepare(query).all(...params)

    res.json({
      data: rmas,
      pagination: {
        page: parseInt(page as string),
        limit: limitNum,
      },
    })
  } catch (error) {
    console.error('Get RMA requests error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create RMA request
router.post('/rma', authenticateToken, (req, res) => {
  try {
    const {
      part_id,
      ticket_id,
      customer_id,
      reason,
      description,
    } = req.body

    if (!customer_id || !reason) {
      return res.status(400).json({ error: 'Customer ID and reason are required' })
    }

    const user = (req as AuthRequest).user!
    const rmaNumber = `RMA-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    const result = db.prepare(`
      INSERT INTO rma_requests (
        rma_number, part_id, ticket_id, customer_id, reason, description, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      rmaNumber,
      part_id || null,
      ticket_id || null,
      customer_id,
      reason,
      description || null,
      user.id
    )

    const newRMA = db.prepare('SELECT * FROM rma_requests WHERE id = ?').get(result.lastInsertRowid) as any

    res.status(201).json(newRMA)
  } catch (error) {
    console.error('Create RMA error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update RMA request
router.put('/rma/:id', authenticateToken, requireRole(UserRole.ADMIN, UserRole.SERVICE_CENTER, UserRole.WAREHOUSE), (req, res) => {
  try {
    const rmaId = parseInt(req.params.id)
    const {
      status,
      received_date,
      processed_date,
      replacement_part_id,
      return_tracking_number,
      replacement_tracking_number,
    } = req.body

    db.prepare(`
      UPDATE rma_requests
      SET status = COALESCE(?, status),
          received_date = COALESCE(?, received_date),
          processed_date = COALESCE(?, processed_date),
          replacement_part_id = COALESCE(?, replacement_part_id),
          return_tracking_number = COALESCE(?, return_tracking_number),
          replacement_tracking_number = COALESCE(?, replacement_tracking_number),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      status || null,
      received_date || null,
      processed_date || null,
      replacement_part_id || null,
      return_tracking_number || null,
      replacement_tracking_number || null,
      rmaId
    )

    const updatedRMA = db.prepare('SELECT * FROM rma_requests WHERE id = ?').get(rmaId) as any

    res.json(updatedRMA)
  } catch (error) {
    console.error('Update RMA error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
