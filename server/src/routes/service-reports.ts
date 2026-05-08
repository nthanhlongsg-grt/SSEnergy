import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { UserRole } from '../types/index.js'

const router = Router()

// Get all service reports
router.get('/', authenticateToken, (req, res) => {
  try {
    const { ticket_id, technician_id, status, page = '1', limit = '50' } = req.query

    let query = `
      SELECT sr.*,
             t.ticket_number,
             t.title as ticket_title,
             u.name as technician_name,
             c.name as customer_name
      FROM service_reports sr
      LEFT JOIN tickets t ON sr.ticket_id = t.id
      LEFT JOIN users u ON sr.technician_id = u.id
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE 1=1
    `
    const params: any[] = []

    if (ticket_id) {
      query += ' AND sr.ticket_id = ?'
      params.push(parseInt(ticket_id as string))
    }

    if (technician_id) {
      query += ' AND sr.technician_id = ?'
      params.push(parseInt(technician_id as string))
    }

    if (status) {
      query += ' AND sr.status = ?'
      params.push(status)
    }

    query += ' ORDER BY sr.created_at DESC LIMIT ? OFFSET ?'
    const limitNum = parseInt(limit as string)
    const offset = (parseInt(page as string) - 1) * limitNum
    params.push(limitNum, offset)

    const reports = db.prepare(query).all(...params)

    res.json({
      data: reports,
      pagination: {
        page: parseInt(page as string),
        limit: limitNum,
      },
    })
  } catch (error) {
    console.error('Get service reports error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get service report by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const reportId = parseInt(req.params.id)

    const report = db.prepare(`
      SELECT sr.*,
             t.ticket_number,
             t.title as ticket_title,
             u.name as technician_name,
             c.name as customer_name,
             i.serial_number as inverter_serial
      FROM service_reports sr
      LEFT JOIN tickets t ON sr.ticket_id = t.id
      LEFT JOIN users u ON sr.technician_id = u.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN inverters i ON t.inverter_id = i.id
      WHERE sr.id = ?
    `).get(reportId) as any

    if (!report) {
      return res.status(404).json({ error: 'Service report not found' })
    }

    // Get parts used
    const parts = db.prepare(`
      SELECT srp.*, wp.name as part_name, wp.part_number
      FROM service_report_parts srp
      LEFT JOIN warehouse_parts wp ON srp.part_id = wp.id
      WHERE srp.service_report_id = ?
    `).all(reportId)

    res.json({
      ...report,
      parts,
    })
  } catch (error) {
    console.error('Get service report error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create service report
router.post('/', authenticateToken, requireRole(UserRole.ADMIN, UserRole.SERVICE_CENTER, UserRole.TECHNICIAN), (req, res) => {
  try {
    const {
      ticket_id,
      technician_id,
      service_date,
      service_start_time,
      service_end_time,
      service_type,
      description,
      diagnosis,
      actions_taken,
      parts,
      labor_cost = 0,
      status = 'draft',
    } = req.body

    if (!ticket_id || !service_date) {
      return res.status(400).json({ error: 'Ticket ID and service date are required' })
    }

    const user = (req as AuthRequest).user!

    const reportNumber = `SR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    // Calculate parts cost
    let partsCost = 0
    if (parts && Array.isArray(parts)) {
      parts.forEach((part: any) => {
        partsCost += (part.quantity || 0) * (part.unit_price || 0)
      })
    }

    const totalCost = labor_cost + partsCost

    // Extract new fields
    const replacement_parts = req.body.replacement_parts || null
    const before_images = req.body.before_images || null // JSON string
    const after_images = req.body.after_images || null // JSON string
    const customer_signature = req.body.customer_signature || null // base64
    const technician_signature = req.body.technician_signature || null // base64
    
    // If technician_id is not provided, try to get from ticket
    let finalTechnicianId = technician_id
    if (!finalTechnicianId && ticket_id) {
      const ticket = db.prepare('SELECT assigned_to FROM tickets WHERE id = ?').get(ticket_id) as { assigned_to: number | null } | undefined
      if (ticket?.assigned_to) {
        finalTechnicianId = ticket.assigned_to
      }
    }
    
    // If technician_id is still not available, use default service_type as 'repair'
    const defaultServiceType = 'repair'

    const result = db.prepare(`
      INSERT INTO service_reports (
        report_number, ticket_id, technician_id, service_date,
        service_start_time, service_end_time, service_type,
        description, diagnosis, actions_taken,
        replacement_parts, before_images, after_images,
        customer_signature, technician_signature,
        labor_cost, parts_cost, total_cost, status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      reportNumber,
      ticket_id,
      finalTechnicianId || null,
      service_date,
      service_start_time || null,
      service_end_time || null,
      service_type || defaultServiceType,
      description || null,
      diagnosis || null,
      actions_taken || null,
      replacement_parts,
      before_images,
      after_images,
      customer_signature,
      technician_signature,
      labor_cost,
      partsCost,
      totalCost,
      status
    )

    // Insert parts if provided
    if (parts && Array.isArray(parts)) {
      const partStmt = db.prepare(`
        INSERT INTO service_report_parts (service_report_id, part_id, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?)
      `)

      parts.forEach((part: any) => {
        const totalPrice = (part.quantity || 0) * (part.unit_price || 0)
        partStmt.run(
          result.lastInsertRowid,
          part.part_id,
          part.quantity,
          part.unit_price,
          totalPrice
        )

        // Update warehouse inventory
        db.prepare(`
          UPDATE warehouse_parts
          SET quantity = quantity - ?
          WHERE id = ?
        `).run(part.quantity, part.part_id)
      })
    }

    const newReport = db.prepare('SELECT * FROM service_reports WHERE id = ?').get(result.lastInsertRowid) as any

    res.status(201).json(newReport)
  } catch (error) {
    console.error('Create service report error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update service report
router.put('/:id', authenticateToken, requireRole(UserRole.ADMIN, UserRole.SERVICE_CENTER, UserRole.TECHNICIAN), (req, res) => {
  try {
    const reportId = parseInt(req.params.id)
    const report = db.prepare('SELECT * FROM service_reports WHERE id = ?').get(reportId) as any

    if (!report) {
      return res.status(404).json({ error: 'Service report not found' })
    }

    const user = (req as AuthRequest).user!

    // Permission check
    if (user.role === UserRole.TECHNICIAN && report.technician_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const {
      service_date,
      service_start_time,
      service_end_time,
      service_type,
      description,
      diagnosis,
      actions_taken,
      labor_cost,
      status,
    } = req.body

    // Recalculate total cost
    const parts = db.prepare('SELECT SUM(total_price) as total FROM service_report_parts WHERE service_report_id = ?').get(reportId) as { total: number }
    const partsCost = parts?.total || 0
    const totalCost = (labor_cost !== undefined ? labor_cost : report.labor_cost) + partsCost

    db.prepare(`
      UPDATE service_reports
      SET service_date = COALESCE(?, service_date),
          service_start_time = COALESCE(?, service_start_time),
          service_end_time = COALESCE(?, service_end_time),
          service_type = COALESCE(?, service_type),
          description = COALESCE(?, description),
          diagnosis = COALESCE(?, diagnosis),
          actions_taken = COALESCE(?, actions_taken),
          labor_cost = COALESCE(?, labor_cost),
          parts_cost = ?,
          total_cost = ?,
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      service_date || null,
      service_start_time || null,
      service_end_time || null,
      service_type || null,
      description || null,
      diagnosis || null,
      actions_taken || null,
      labor_cost || null,
      partsCost,
      totalCost,
      status || null,
      reportId
    )

    const updatedReport = db.prepare('SELECT * FROM service_reports WHERE id = ?').get(reportId) as any

    res.json(updatedReport)
  } catch (error) {
    console.error('Update service report error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete service report
router.delete('/:id', authenticateToken, requireRole(UserRole.ADMIN, UserRole.SERVICE_CENTER), (req, res) => {
  try {
    const reportId = parseInt(req.params.id)

    const report = db.prepare('SELECT id FROM service_reports WHERE id = ?').get(reportId) as any
    if (!report) {
      return res.status(404).json({ error: 'Service report not found' })
    }

    db.prepare('DELETE FROM service_reports WHERE id = ?').run(reportId)

    res.status(204).send()
  } catch (error) {
    console.error('Delete service report error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
