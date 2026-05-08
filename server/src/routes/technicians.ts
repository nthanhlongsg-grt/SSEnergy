import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { UserRole } from '../types/index.js'

const router = Router()

// Get all technicians
router.get('/', authenticateToken, (req, res) => {
  try {
    const includeAdmins = req.query.includeAdmins === 'true'
    const roles = includeAdmins
      ? [UserRole.TECHNICIAN, UserRole.ADMIN, UserRole.DEV]
      : [UserRole.TECHNICIAN]
    const rolePlaceholders = roles.map(() => '?').join(', ')

    const technicians = db.prepare(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.code,
        u.phone,
        u.status,
        u.role,
        u.function,
        u.created_at,
        u.updated_at,
        COALESCE(u.cached_active_tickets, 0) as active_tickets,
        COALESCE(u.cached_today_tasks, 0) as today_tasks
      FROM users u
      WHERE u.role IN (${rolePlaceholders}) AND u.status = 'active'
      ORDER BY u.name ASC
    `).all(...roles)

    res.json(technicians)
  } catch (error) {
    console.error('Get technicians error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get technician stats
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const includeAdmins = req.query.includeAdmins === 'true'
    const roles = includeAdmins
      ? [UserRole.TECHNICIAN, UserRole.ADMIN, UserRole.DEV]
      : [UserRole.TECHNICIAN]
    const rolePlaceholders = roles.map(() => '?').join(', ')

    const totalTechnicians = db.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE role IN (${rolePlaceholders}) AND status = 'active'
    `).get(...roles) as { count: number }

    const activeTickets = db.prepare(`
      SELECT COUNT(DISTINCT assigned_to) as count
      FROM tickets
      WHERE assigned_to IS NOT NULL AND status IN ('initialized', 'in_progress', 'new', 'assigned', 'waiting_parts')
    `).get() as { count: number }

    const totalActiveTickets = db.prepare(`
      SELECT COUNT(*) as count
      FROM tickets
      WHERE assigned_to IS NOT NULL AND status IN ('initialized', 'in_progress', 'new', 'assigned', 'waiting_parts')
    `).get() as { count: number }

    const onsiteCount = db.prepare(`
      SELECT COUNT(DISTINCT ts.technician_id) as count
      FROM technician_schedules ts
      WHERE ts.schedule_date = date('now') AND ts.status = 'onsite'
    `).get() as { count: number }

    res.json({
      totalTechnicians: totalTechnicians.count,
      activeTechnicians: activeTickets.count,
      onsiteTechnicians: onsiteCount.count,
      activeTickets: totalActiveTickets.count,
    })
  } catch (error) {
    console.error('Get technician stats error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

