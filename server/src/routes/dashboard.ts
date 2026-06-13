import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { UserRole, isStaffAdminRole } from '../types/index.js'
import {
  TicketStatus,
  TICKET_STATUS_ORDER,
  expandStatusFilter,
  isTicketClosed,
} from '../constants/ticketStatus.js'

const CLOSED_DB_STATUSES_SQL = expandStatusFilter(TicketStatus.CLOSED)
  .map((s) => `'${s}'`)
  .join(', ')
const ACTIVE_DB_STATUSES_SQL = TICKET_STATUS_ORDER.filter((s) => s !== TicketStatus.CLOSED)
  .flatMap((s) => expandStatusFilter(s))
  .map((s) => `'${s}'`)
  .join(', ')
const NEW_DB_STATUSES_SQL = expandStatusFilter(TicketStatus.NEW)
  .map((s) => `'${s}'`)
  .join(', ')

const router = Router()

// Helper function to build ticket filter based on user role
const buildTicketFilter = (user: any): { whereClause: string; params: any[] } => {
  let whereClause = ''
  const params: any[] = []

  if (user.role === UserRole.END_USER) {
    // End users can see tickets they created OR tickets assigned to them OR tickets for their inverters OR tickets they are watching
    whereClause = 'WHERE (t.created_by = ? OR t.assigned_to = ? OR EXISTS (SELECT 1 FROM inverters i WHERE i.id = t.inverter_id AND i.user_id = ?) OR EXISTS (SELECT 1 FROM ticket_watchers tw WHERE tw.ticket_id = t.id AND tw.user_id = ?))'
    params.push(user.id, user.id, user.id, user.id)
  } else if (user.role === UserRole.TECHNICIAN) {
    // Technicians can see tickets assigned to them OR tickets they created OR tickets they are watching
    whereClause = 'WHERE (t.assigned_to = ? OR t.created_by = ? OR EXISTS (SELECT 1 FROM ticket_watchers tw WHERE tw.ticket_id = t.id AND tw.user_id = ?))'
    params.push(user.id, user.id, user.id)
  } else if (user.role === UserRole.DISTRIBUTOR) {
    // Distributors can see tickets they created AND tickets of end users linked to them AND tickets for their inverters AND tickets they are watching
    const linkedEndUsers = db.prepare(`
      SELECT id FROM users 
      WHERE parent_distributor_id = ? AND role = ?
    `).all(user.id, UserRole.END_USER) as Array<{ id: number }>
    
    if (linkedEndUsers.length > 0) {
      const endUserIds = linkedEndUsers.map(u => u.id)
      // Include distributor's own ID and linked end user IDs
      const allUserIds = [user.id, ...endUserIds]
      whereClause = `WHERE (t.created_by IN (${allUserIds.map(() => '?').join(',')}) OR t.assigned_to = ? OR EXISTS (SELECT 1 FROM inverters i WHERE i.id = t.inverter_id AND i.user_id IN (${allUserIds.map(() => '?').join(',')})) OR EXISTS (SELECT 1 FROM ticket_watchers tw WHERE tw.ticket_id = t.id AND tw.user_id = ?))`
      params.push(...allUserIds, user.id, ...allUserIds, user.id)
    } else {
      // If no linked end users, show tickets created by distributor OR assigned to them OR tickets for their inverters OR tickets they are watching
      whereClause = 'WHERE (t.created_by = ? OR t.assigned_to = ? OR EXISTS (SELECT 1 FROM inverters i WHERE i.id = t.inverter_id AND i.user_id = ?) OR EXISTS (SELECT 1 FROM ticket_watchers tw WHERE tw.ticket_id = t.id AND tw.user_id = ?))'
      params.push(user.id, user.id, user.id, user.id)
    }
  } else {
    // For admin/dev/service_center, no filter needed
    whereClause = ''
  }

  return { whereClause, params }
}

// Helper function to build inverter filter based on user role
const buildInverterFilter = (user: any): { whereClause: string; params: any[] } => {
  let whereClause = ''
  const params: any[] = []

  if (user.role === UserRole.END_USER) {
    // End users can see inverters where user_id = their id
    whereClause = 'WHERE i.user_id = ?'
    params.push(user.id)
  } else if (user.role === UserRole.DISTRIBUTOR) {
    // Distributors can see inverters where:
    // 1. user_id = their id (their own inverters)
    // 2. user_id of linked end users (end users with parent_distributor_id = this distributor)
    const linkedEndUsers = db.prepare(`
      SELECT id FROM users 
      WHERE parent_distributor_id = ? AND role = ?
    `).all(user.id, UserRole.END_USER) as Array<{ id: number }>
    
    if (linkedEndUsers.length > 0) {
      const endUserIds = linkedEndUsers.map(u => u.id)
      const allUserIds = [user.id, ...endUserIds]
      whereClause = `WHERE i.user_id IN (${allUserIds.map(() => '?').join(',')})`
      params.push(...allUserIds)
    } else {
      // Only show their own inverters
      whereClause = 'WHERE i.user_id = ?'
      params.push(user.id)
    }
  } else {
    // For admin/dev/service_center, no filter needed
    whereClause = ''
  }

  return { whereClause, params }
}

// Get dashboard statistics
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    const { from, to } = req.query
    
    // Build date filter for tickets (based on completed_at for completed/closed, or created_at for others)
    let ticketDateFilter = ''
    let ticketDateParams: any[] = []
    if (from && to) {
      ticketDateFilter = ` AND (
        (t.status IN (${CLOSED_DB_STATUSES_SQL}) AND t.updated_at IS NOT NULL AND t.updated_at >= ? AND t.updated_at <= ?)
        OR
        (t.status NOT IN (${CLOSED_DB_STATUSES_SQL}) AND t.created_at >= ? AND t.created_at <= ?)
      )`
      ticketDateParams = [`${from} 00:00:00`, `${to} 23:59:59`, `${from} 00:00:00`, `${to} 23:59:59`]
    }
    
    const ticketFilter = buildTicketFilter(user)
    const inverterFilter = buildInverterFilter(user)
    
    // Combine ticket filter with date filter
    const combinedTicketParams = [...ticketFilter.params, ...ticketDateParams]
    const combinedTicketWhere = ticketFilter.whereClause 
      ? `${ticketFilter.whereClause}${ticketDateFilter}`
      : ticketDateFilter ? `WHERE 1=1${ticketDateFilter}` : ''

    // Total tickets by category
    const ticketsByCategoryQuery = combinedTicketWhere
      ? `SELECT 
          COALESCE(category, 'N/A') as category,
          COUNT(*) as count,
          COUNT(CASE WHEN status IN (${CLOSED_DB_STATUSES_SQL}) THEN 1 END) as completed_count,
          COUNT(CASE WHEN status IN (${ACTIVE_DB_STATUSES_SQL}) THEN 1 END) as active_count,
          COUNT(CASE WHEN status IN (${NEW_DB_STATUSES_SQL}) THEN 1 END) as new_count
        FROM tickets t ${combinedTicketWhere} GROUP BY category ORDER BY count DESC`
      : `SELECT 
          COALESCE(category, 'N/A') as category,
          COUNT(*) as count,
          COUNT(CASE WHEN status IN (${CLOSED_DB_STATUSES_SQL}) THEN 1 END) as completed_count,
          COUNT(CASE WHEN status IN (${ACTIVE_DB_STATUSES_SQL}) THEN 1 END) as active_count,
          COUNT(CASE WHEN status IN (${NEW_DB_STATUSES_SQL}) THEN 1 END) as new_count
        FROM tickets GROUP BY category ORDER BY count DESC`
    const ticketsByCategory = combinedTicketWhere
      ? db.prepare(ticketsByCategoryQuery).all(...combinedTicketParams) as Array<{ 
          category: string
          count: number
          completed_count: number
          active_count: number
          new_count: number
        }>
      : db.prepare(ticketsByCategoryQuery).all() as Array<{ 
          category: string
          count: number
          completed_count: number
          active_count: number
          new_count: number
        }>

    // Recent tickets
    const recentTicketsQuery = combinedTicketWhere
      ? `SELECT t.*, c.name as customer_name FROM tickets t LEFT JOIN customers c ON t.customer_id = c.id ${combinedTicketWhere} ORDER BY t.created_at DESC LIMIT 10`
      : `SELECT t.*, c.name as customer_name FROM tickets t LEFT JOIN customers c ON t.customer_id = c.id ORDER BY t.created_at DESC LIMIT 10`
    const recentTickets = combinedTicketWhere
      ? db.prepare(recentTicketsQuery).all(...combinedTicketParams)
      : db.prepare(recentTicketsQuery).all()

    // Low stock parts (only for admin/technician roles)
    let lowStockParts: any[] = []
    if (isStaffAdminRole(user.role) || user.role === UserRole.TECHNICIAN || user.role === UserRole.SERVICE_CENTER) {
      lowStockParts = db.prepare(`
        SELECT * FROM warehouse_parts
        WHERE quantity <= min_quantity AND status = 'active'
        ORDER BY quantity ASC
        LIMIT 10
      `).all()
    }

    // Total counts
    const totalTicketsQuery = combinedTicketWhere
      ? `SELECT COUNT(*) as count FROM tickets t ${combinedTicketWhere}`
      : `SELECT COUNT(*) as count FROM tickets`
    const totalTickets = combinedTicketWhere
      ? db.prepare(totalTicketsQuery).get(...combinedTicketParams) as { count: number }
      : db.prepare(totalTicketsQuery).get() as { count: number }
    
    const totalInvertersQuery = inverterFilter.whereClause
      ? `SELECT COUNT(*) as count FROM inverters i ${inverterFilter.whereClause}`
      : `SELECT COUNT(*) as count FROM inverters`
    const totalInverters = inverterFilter.whereClause
      ? db.prepare(totalInvertersQuery).get(...inverterFilter.params) as { count: number }
      : db.prepare(totalInvertersQuery).get() as { count: number }
    
    // Only show customers and service reports for admin/technician roles
    let totalCustomers = { count: 0 }
    let totalServiceReports = { count: 0 }
    if (isStaffAdminRole(user.role) || user.role === UserRole.TECHNICIAN || user.role === UserRole.SERVICE_CENTER) {
      totalCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number }
      totalServiceReports = db.prepare('SELECT COUNT(*) as count FROM service_reports').get() as { count: number }
    }

    // Active tickets (in_progress, assigned, waiting_parts, initialized, new)
    const activeTicketsWhere = combinedTicketWhere 
      ? `${combinedTicketWhere} AND t.status IN (${ACTIVE_DB_STATUSES_SQL})`
      : `WHERE t.status IN (${ACTIVE_DB_STATUSES_SQL})`
    const activeTickets = combinedTicketWhere
      ? db.prepare(`SELECT COUNT(*) as count FROM tickets t ${activeTicketsWhere}`).get(...combinedTicketParams) as { count: number }
      : db.prepare(`SELECT COUNT(*) as count FROM tickets t ${activeTicketsWhere}`).get() as { count: number }

    // Pending tickets (initialized, new)
    const pendingTicketsWhere = combinedTicketWhere
      ? `${combinedTicketWhere} AND t.status IN (${NEW_DB_STATUSES_SQL})`
      : `WHERE t.status IN (${NEW_DB_STATUSES_SQL})`
    const pendingTickets = combinedTicketWhere
      ? db.prepare(`SELECT COUNT(*) as count FROM tickets t ${pendingTicketsWhere}`).get(...combinedTicketParams) as { count: number }
      : db.prepare(`SELECT COUNT(*) as count FROM tickets t ${pendingTicketsWhere}`).get() as { count: number }

    // Warranty active inverters
    const warrantyActiveWhere = inverterFilter.whereClause
      ? `${inverterFilter.whereClause} AND i.warranty_end_date >= date('now') AND i.warranty_start_date IS NOT NULL`
      : `WHERE i.warranty_end_date >= date('now') AND i.warranty_start_date IS NOT NULL`
    const warrantyActive = inverterFilter.whereClause
      ? db.prepare(`SELECT COUNT(*) as count FROM inverters i ${warrantyActiveWhere}`).get(...inverterFilter.params) as { count: number }
      : db.prepare(`SELECT COUNT(*) as count FROM inverters i ${warrantyActiveWhere}`).get() as { count: number }

    // Technician stats (only for admin/technician roles)
    let totalTechnicians = { count: 0 }
    let activeTechnicians = { count: 0 }
    let techniciansOnsite = { count: 0 }
    if (isStaffAdminRole(user.role) || user.role === UserRole.TECHNICIAN || user.role === UserRole.SERVICE_CENTER) {
      totalTechnicians = db.prepare(`
        SELECT COUNT(*) as count
        FROM users
        WHERE role = 'technician' AND status = 'active'
      `).get() as { count: number }

      const activeTechniciansWhere = combinedTicketWhere
        ? `${combinedTicketWhere} AND t.assigned_to IS NOT NULL AND t.status IN (${ACTIVE_DB_STATUSES_SQL})`
        : `WHERE t.assigned_to IS NOT NULL AND t.status IN (${ACTIVE_DB_STATUSES_SQL})`
      activeTechnicians = combinedTicketWhere
        ? db.prepare(`SELECT COUNT(DISTINCT assigned_to) as count FROM tickets t ${activeTechniciansWhere}`).get(...combinedTicketParams) as { count: number }
        : db.prepare(`SELECT COUNT(DISTINCT assigned_to) as count FROM tickets t ${activeTechniciansWhere}`).get() as { count: number }

      techniciansOnsite = db.prepare(`
        SELECT COUNT(DISTINCT ts.technician_id) as count
        FROM technician_schedules ts
        WHERE ts.schedule_date = date('now') AND ts.status = 'onsite'
      `).get() as { count: number }
    }

    // Recent tickets with more details
    const recentTicketsDetailedQuery = combinedTicketWhere
      ? `SELECT 
          t.id,
          t.ticket_number,
          t.title,
          t.status,
          t.priority,
          t.created_at,
          t.sla_deadline,
          c.name as customer_name,
          i.model as inverter_model,
          i.serial_number as inverter_serial,
          u1.name as assigned_to_name
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN inverters i ON t.inverter_id = i.id
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        ${combinedTicketWhere}
        ORDER BY t.created_at DESC
        LIMIT 10`
      : `SELECT 
          t.id,
          t.ticket_number,
          t.title,
          t.status,
          t.priority,
          t.created_at,
          t.sla_deadline,
          c.name as customer_name,
          i.model as inverter_model,
          i.serial_number as inverter_serial,
          u1.name as assigned_to_name
        FROM tickets t
        LEFT JOIN customers c ON t.customer_id = c.id
        LEFT JOIN inverters i ON t.inverter_id = i.id
        LEFT JOIN users u1 ON t.assigned_to = u1.id
        ORDER BY t.created_at DESC
        LIMIT 10`
    const recentTicketsDetailedRaw = combinedTicketWhere
      ? db.prepare(recentTicketsDetailedQuery).all(...combinedTicketParams)
      : db.prepare(recentTicketsDetailedQuery).all()
    
    // Add "sắp đến hạn" status for tickets with less than 2 days remaining
    const recentTicketsDetailed = recentTicketsDetailedRaw.map((ticket: any) => {
      const result = { ...ticket }
      
      // Check if ticket is approaching deadline (less than 2 days remaining)
      if (ticket.sla_deadline && !isTicketClosed(ticket.status)) {
        const deadline = new Date(ticket.sla_deadline)
        const now = new Date()
        const diffMs = deadline.getTime() - now.getTime()
        const diffDays = diffMs / (1000 * 60 * 60 * 24)
        
        // If less than 2 days remaining and not overdue
        if (diffDays > 0 && diffDays < 2) {
          result.is_approaching_deadline = true
        } else {
          result.is_approaching_deadline = false
        }
      } else {
        result.is_approaching_deadline = false
      }
      
      return result
    })

    // Filter by user role
    let userFilteredStats = {}
    if (user.role === 'technician') {
      const myTickets = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE assigned_to = ?').get(user.id) as { count: number }
      const mySchedules = db.prepare(`
        SELECT COUNT(*) as count FROM technician_schedules 
        WHERE technician_id = ? AND schedule_date >= date('now')
      `).get(user.id) as { count: number }
      
      userFilteredStats = {
        my_tickets: myTickets.count,
        my_upcoming_schedules: mySchedules.count,
      }
    }

    res.json({
      totals: {
        tickets: totalTickets.count,
        customers: totalCustomers.count,
        inverters: totalInverters.count,
        service_reports: totalServiceReports.count,
      },
      metrics: {
        totalTickets: totalTickets.count,
        activeTickets: activeTickets.count,
        pendingTickets: pendingTickets.count,
        totalInverters: totalInverters.count,
        warrantyActive: warrantyActive.count,
        activeTechnicians: activeTechnicians.count,
        techniciansOnsite: techniciansOnsite.count,
        totalTechnicians: totalTechnicians.count,
      },
      tickets_by_category: ticketsByCategory,
      recent_tickets: recentTicketsDetailed,
      low_stock_parts: lowStockParts,
      ...userFilteredStats,
    })
  } catch (error) {
    console.error('Get dashboard stats error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
