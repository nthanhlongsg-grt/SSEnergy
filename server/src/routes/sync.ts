/**
 * API endpoints for syncing ticket and task counts + lightweight change detection
 */
import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, requireSystemAdmin, AuthRequest } from '../middleware/auth.js'
import { UserRole, isAdminRole } from '../types/index.js'
import { syncAllUsersCounts, syncUserCounts, syncUserActiveTickets, syncUserTodayTasks } from '../database/syncCounts.js'
import { buildTicketAccessFilter } from '../utils/ticketAccessFilter.js'

const router = Router()

function tableExists(table: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table) as { name: string } | undefined
  return !!row
}

function tableColumns(table: string): Set<string> {
  if (!tableExists(table)) return new Set()
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  return new Set(cols.map((c) => c.name))
}

function pickTimestampColumn(table: string): string | null {
  const cols = tableColumns(table)
  if (cols.has('updated_at')) return 'updated_at'
  if (cols.has('created_at')) return 'created_at'
  return null
}

function getUnreadNotificationCount(userId: number): number {
  if (!tableExists('notifications')) return 0
  const cols = tableColumns('notifications')
  if (cols.has('is_read')) {
    const row = db
      .prepare(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      )
      .get(userId) as { count: number }
    return row.count
  }
  if (cols.has('read_at')) {
    const row = db
      .prepare(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_at IS NULL',
      )
      .get(userId) as { count: number }
    return row.count
  }
  return 0
}

/**
 * Lightweight change snapshot for frontend polling (~5s).
 * Returns fingerprints instead of full data so the client only refetches when needed.
 */
router.get('/changes', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    const ticketIdParam = req.query.ticket_id
    const ticketId =
      ticketIdParam !== undefined && ticketIdParam !== ''
        ? Number.parseInt(String(ticketIdParam), 10)
        : null

    const { whereClause, params } = buildTicketAccessFilter(user)

    const ticketTsCol = pickTimestampColumn('tickets') ?? 'id'
    let ticketsQuery = `
      SELECT MAX(t.${ticketTsCol}) as max_updated, COUNT(*) as total
      FROM tickets t
      ${whereClause || 'WHERE 1=1'}
    `
    const ticketParams = [...params]

    if (ticketId && !Number.isNaN(ticketId)) {
      ticketsQuery += ' AND t.id = ?'
      ticketParams.push(ticketId)
    }

    const ticketRow = db.prepare(ticketsQuery).get(...ticketParams) as {
      max_updated: string | null
      total: number
    }

    let tickets: string | null = null
    if (ticketRow.max_updated || ticketRow.total > 0) {
      if (ticketId && !Number.isNaN(ticketId)) {
        const commentRow = db
          .prepare(`
            SELECT COUNT(*) as count, MAX(created_at) as last_comment
            FROM ticket_comments
            WHERE ticket_id = ?
          `)
          .get(ticketId) as { count: number; last_comment: string | null }
        tickets = `${ticketRow.max_updated || ''}:${commentRow.count}:${commentRow.last_comment || ''}`
      } else {
        tickets = `${ticketRow.max_updated || ''}:${ticketRow.total}`
      }
    }

    let users: string | null = null
    if (isAdminRole(user.role) || user.role === UserRole.SERVICE_CENTER) {
      const userTsCol = pickTimestampColumn('users')
      if (userTsCol) {
        const userRow = db.prepare(`SELECT MAX(${userTsCol}) as max_updated FROM users`).get() as {
          max_updated: string | null
        }
        users = userRow.max_updated
      }
    }

    const notifications = getUnreadNotificationCount(user.id)

    let tasks: string | null = null
    const scheduleTsCol = pickTimestampColumn('technician_schedules')
    if (scheduleTsCol) {
      const taskRow = db
        .prepare(`SELECT MAX(${scheduleTsCol}) as max_updated FROM technician_schedules`)
        .get() as { max_updated: string | null }
      tasks = taskRow.max_updated
    }

    const userCols = tableColumns('users')
    const profileSelect = userCols.has('updated_at')
      ? 'updated_at, role'
      : userCols.has('created_at')
        ? 'created_at as updated_at, role'
        : 'role'
    const profileRow = db
      .prepare(`SELECT ${profileSelect} FROM users WHERE id = ?`)
      .get(user.id) as { updated_at?: string | null; role: string } | undefined
    const profile =
      profileRow?.updated_at != null
        ? `${profileRow.updated_at}:${profileRow.role}`
        : profileRow?.role
          ? `:${profileRow.role}`
          : null

    res.json({
      tickets,
      users,
      profile,
      notifications,
      tasks,
    })
  } catch (error) {
    console.error('Sync changes error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Sync counts for all users (Admin/Dev only)
router.post('/all', authenticateToken, requireSystemAdmin(UserRole.ADMIN, UserRole.DEV), (req, res) => {
  try {
    const synced = syncAllUsersCounts()
    res.json({
      message: 'Successfully synced counts for all users',
      synced
    })
  } catch (error) {
    console.error('Sync all counts error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Sync counts for a specific user
router.post('/user/:userId', authenticateToken, requireSystemAdmin(UserRole.ADMIN, UserRole.DEV), (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const counts = syncUserCounts(userId)
    res.json({
      message: 'Successfully synced counts for user',
      userId,
      counts
    })
  } catch (error) {
    console.error('Sync user counts error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Sync active tickets for a specific user
router.post('/user/:userId/tickets', authenticateToken, requireSystemAdmin(UserRole.ADMIN, UserRole.DEV), (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const count = syncUserActiveTickets(userId)
    res.json({
      message: 'Successfully synced active tickets count',
      userId,
      count
    })
  } catch (error) {
    console.error('Sync user tickets error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Sync today's tasks for a specific user
router.post('/user/:userId/tasks', authenticateToken, requireSystemAdmin(UserRole.ADMIN, UserRole.DEV), (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const count = syncUserTodayTasks(userId)
    res.json({
      message: 'Successfully synced today tasks count',
      userId,
      count
    })
  } catch (error) {
    console.error('Sync user tasks error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router



