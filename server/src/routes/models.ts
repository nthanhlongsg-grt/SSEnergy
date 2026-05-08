import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js'
import { UserRole } from '../types/index.js'

const router = Router()

// Get all models - All authenticated users can read (needed for inverter registration)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { search, type, status = 'active', page = '1', limit = '20' } = req.query
    
    let query = `
      SELECT id, name, manufacturer, type, description, status, created_at, updated_at
      FROM models
      WHERE 1=1
    `
    const params: any[] = []

    if (status) {
      query += ' AND status = ?'
      params.push(status)
    }

    if (type) {
      // Use exact match or match values that start with the type (e.g., "Hybrid" matches "Hybrid" and "Hybrid/Storage")
      query += ' AND (type = ? OR type LIKE ?)'
      params.push(type, `${type}%`)
    }

    if (search) {
      query += ' AND (name LIKE ? OR manufacturer LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm)
    }

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM models WHERE 1=1'
    const countParams: any[] = []

    if (status) {
      countQuery += ' AND status = ?'
      countParams.push(status)
    }

    if (type) {
      // Use exact match or match values that start with the type
      countQuery += ' AND (type = ? OR type LIKE ?)'
      countParams.push(type, `${type}%`)
    }

    if (search) {
      countQuery += ' AND (name LIKE ? OR manufacturer LIKE ?)'
      const searchTerm = `%${search}%`
      countParams.push(searchTerm, searchTerm)
    }

    const totalResult = db.prepare(countQuery).get(...countParams) as { total: number }
    const total = totalResult.total

    // Apply pagination
    query += ' ORDER BY name ASC LIMIT ? OFFSET ?'
    const limitNum = parseInt(limit as string)
    const offset = (parseInt(page as string) - 1) * limitNum
    params.push(limitNum, offset)

    const models = db.prepare(query).all(...params)

    res.json({
      data: models,
      pagination: {
        page: parseInt(page as string),
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    })
  } catch (error) {
    console.error('Get models error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get model by ID - All authenticated users can read (needed for inverter registration)
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const modelId = parseInt(req.params.id)
    const model = db.prepare('SELECT * FROM models WHERE id = ?').get(modelId) as any

    if (!model) {
      return res.status(404).json({ error: 'Model not found' })
    }

    res.json(model)
  } catch (error) {
    console.error('Get model error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create model - Only admin, dev, service_center can create
router.post('/', authenticateToken, requireRole(UserRole.ADMIN, UserRole.DEV, UserRole.SERVICE_CENTER), (req: AuthRequest, res) => {
  try {
    const { name, manufacturer, type, description } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Model name is required' })
    }

    // Check if model name already exists
    const existing = db.prepare('SELECT id FROM models WHERE name = ?').get(name) as { id: number } | undefined
    if (existing) {
      return res.status(400).json({ error: 'Model name already exists' })
    }

    const result = db.prepare(`
      INSERT INTO models (name, manufacturer, type, description, status)
      VALUES (?, ?, ?, ?, 'active')
    `).run(
      name,
      manufacturer || null,
      type || null,
      description || null
    )

    const newModel = db.prepare('SELECT * FROM models WHERE id = ?').get(result.lastInsertRowid) as any

    res.status(201).json(newModel)
  } catch (error) {
    console.error('Create model error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update model - Only admin, dev, service_center can update
router.put('/:id', authenticateToken, requireRole(UserRole.ADMIN, UserRole.DEV, UserRole.SERVICE_CENTER), (req: AuthRequest, res) => {
  try {
    const modelId = parseInt(req.params.id)
    const { name, manufacturer, type, description, status } = req.body

    const existing = db.prepare('SELECT id FROM models WHERE id = ?').get(modelId) as { id: number } | undefined
    if (!existing) {
      return res.status(404).json({ error: 'Model not found' })
    }

    // Check if name is being changed and if it's already taken
    if (name) {
      const nameCheck = db.prepare('SELECT id FROM models WHERE name = ? AND id != ?').get(name, modelId) as { id: number } | undefined
      if (nameCheck) {
        return res.status(400).json({ error: 'Model name already exists' })
      }
    }

    db.prepare(`
      UPDATE models
      SET name = COALESCE(?, name),
          manufacturer = COALESCE(?, manufacturer),
          type = COALESCE(?, type),
          description = COALESCE(?, description),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || null,
      manufacturer !== undefined ? manufacturer : null,
      type !== undefined ? type : null,
      description !== undefined ? description : null,
      status || null,
      modelId
    )

    const updatedModel = db.prepare('SELECT * FROM models WHERE id = ?').get(modelId) as any

    res.json(updatedModel)
  } catch (error) {
    console.error('Update model error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete model - Only admin, dev, service_center can delete
router.delete('/:id', authenticateToken, requireRole(UserRole.ADMIN, UserRole.DEV, UserRole.SERVICE_CENTER), (req: AuthRequest, res) => {
  try {
    const modelId = parseInt(req.params.id)

    const existing = db.prepare('SELECT id FROM models WHERE id = ?').get(modelId) as { id: number } | undefined
    if (!existing) {
      return res.status(404).json({ error: 'Model not found' })
    }

    // Soft delete: set status to inactive instead of deleting
    db.prepare('UPDATE models SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run('inactive', modelId)

    res.status(204).send()
  } catch (error) {
    console.error('Delete model error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Bulk delete models - Only admin, dev, service_center can delete
router.post('/bulk-delete', authenticateToken, requireRole(UserRole.ADMIN, UserRole.DEV, UserRole.SERVICE_CENTER), (req: AuthRequest, res) => {
  try {
    const { ids } = req.body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Model IDs array is required' })
    }

    // Validate all IDs are numbers
    const modelIds = ids.map(id => parseInt(id)).filter(id => !isNaN(id))
    
    if (modelIds.length === 0) {
      return res.status(400).json({ error: 'No valid model IDs provided' })
    }

    // Check which models exist
    const placeholders = modelIds.map(() => '?').join(',')
    const existing = db.prepare(`SELECT id FROM models WHERE id IN (${placeholders})`).all(...modelIds) as { id: number }[]
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'No models found with provided IDs' })
    }

    // Soft delete: set status to inactive
    const existingIds = existing.map(m => m.id)
    const updatePlaceholders = existingIds.map(() => '?').join(',')
    const result = db.prepare(`
      UPDATE models 
      SET status = 'inactive', updated_at = CURRENT_TIMESTAMP 
      WHERE id IN (${updatePlaceholders})
    `).run(...existingIds)

    res.json({
      success: true,
      deleted: result.changes,
      requested: modelIds.length,
      notFound: modelIds.length - existing.length,
    })
  } catch (error) {
    console.error('Bulk delete models error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

