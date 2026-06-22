import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { UserRole, isStaffAdminRole } from '../types/index.js'
import { syncTicketData } from '../database/sync.js'
import { createNotification, notifyUsersByRoles } from '../services/notificationService.js'
import { syncTicketRelatedCounts } from '../database/syncCounts.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { generateReportHTML } from '../templates/report-template.js'
import { AUTO_ASSIGN_KEYS } from './auto-assign-settings.js'
import { resolveStaffFunction, AUTO_ASSIGN_STAFF_ROLES } from '../utils/staffFunction.js'
import { generateLegacyTicketNumber, generateTicketNumber } from '../utils/ticketNumber.js'
import {
  decodeUploadPayload,
  resolveAttachmentAbsolutePath,
  sanitizeAttachmentRow,
  saveAttachmentToDisk,
} from '../utils/attachmentStorage.js'
import { findReportFilename, saveTicketReportHtml } from '../utils/ticketReportStorage.js'
import {
  TicketStatus,
  TICKET_STATUS_ORDER,
  expandStatusFilter,
  getTicketStatusLabel,
  isTicketClosed,
  isValidTicketStatus,
  normalizeTicketStatus,
  type TicketStatusValue,
} from '../constants/ticketStatus.js'
import { userCanAccessTicketViaContractManager } from '../utils/contractManagers.js'
import {
  canEndUserAccessTicket,
  endUserTicketAccessParams,
  endUserTicketAccessSqlFor,
} from '../utils/ticketAccessFilter.js'

const CLOSED_DB_STATUSES = expandStatusFilter(TicketStatus.CLOSED)
const CLOSED_DB_STATUSES_SQL = CLOSED_DB_STATUSES.map((s) => `'${s}'`).join(', ')

function appendTicketStatusFilter(query: string, params: any[], status: string): string {
  const values = expandStatusFilter(status)
  if (values.length === 1) {
    params.push(values[0])
    return `${query} AND t.status = ?`
  }
  params.push(...values)
  return `${query} AND t.status IN (${values.map(() => '?').join(', ')})`
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Tạo thư mục reports nếu chưa có
const reportsDir = path.join(__dirname, '../../reports')
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true })
}

const router = Router()

const DEFAULT_SLA_HOURS_BY_PRIORITY = {
  urgent: 24,
  high: 48,
  medium: 72,
} as const

const getSlaHoursByPriority = (priority?: string): number => {
  const normalizedPriority =
    priority === 'urgent' || priority === 'high' ? priority : 'medium'

  const settingKey = `sla_hours_${normalizedPriority}`
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(settingKey) as
    | { value: string | null }
    | undefined

  const settingValue = Number(row?.value)
  if (Number.isInteger(settingValue) && settingValue > 0) {
    return settingValue
  }

  return DEFAULT_SLA_HOURS_BY_PRIORITY[normalizedPriority]
}

/** Khách hàng từ hợp đồng liên kết (ưu tiên) hoặc customer_id trực tiếp trên máy */
const getCustomerIdForInverter = (inverterId: number): number | null => {
  const row = db.prepare(`
    SELECT COALESCE(
      (SELECT cu.id
       FROM contract_inverters ci
       JOIN contracts ct ON ct.id = ci.contract_id
       JOIN customers cu ON cu.id = ct.customer_id
       WHERE ci.inverter_id = ?
       ORDER BY ct.updated_at DESC, ci.contract_id DESC
       LIMIT 1),
      (SELECT customer_id FROM inverters WHERE id = ?)
    ) AS customer_id
  `).get(inverterId, inverterId) as { customer_id: number | null } | undefined
  return row?.customer_id ?? null
}

// Get ticket statistics
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user
    let query = 'SELECT status, COUNT(*) as count FROM tickets WHERE 1=1'
    const params: any[] = []

    // Filter by user role
    // ADMIN, DEV, SERVICE_CENTER, and TECHNICIAN can see all tickets (no filter needed)
    if (user?.role === UserRole.END_USER) {
      query += ` AND ${endUserTicketAccessSqlFor('tickets')}`
      params.push(...endUserTicketAccessParams(user.id))
    } else if (user?.role === UserRole.DISTRIBUTOR) {
      // Distributors can see tickets of end users linked to them, assigned to them, for their inverters, or tickets they are watching
      const linkedEndUsers = db.prepare(`
        SELECT id FROM users 
        WHERE parent_distributor_id = ? AND role = ?
      `).all(user.id, UserRole.END_USER) as Array<{ id: number }>
      
      if (linkedEndUsers.length > 0) {
        const endUserIds = linkedEndUsers.map(u => u.id)
        const allUserIds = [user.id, ...endUserIds]
        query += ` AND (created_by IN (${allUserIds.map(() => '?').join(',')}) OR assigned_to = ? OR EXISTS (SELECT 1 FROM inverters i WHERE i.id = tickets.inverter_id AND i.user_id IN (${allUserIds.map(() => '?').join(',')})) OR EXISTS (SELECT 1 FROM ticket_watchers tw WHERE tw.ticket_id = tickets.id AND tw.user_id = ?))`
        params.push(...allUserIds, user.id, ...allUserIds, user.id)
      } else {
        query += ' AND (created_by = ? OR assigned_to = ? OR EXISTS (SELECT 1 FROM inverters i WHERE i.id = tickets.inverter_id AND i.user_id = ?) OR EXISTS (SELECT 1 FROM ticket_watchers tw WHERE tw.ticket_id = tickets.id AND tw.user_id = ?))'
        params.push(user.id, user.id, user.id, user.id)
      }
    }

    query += ' GROUP BY status'

    const statusCounts = db.prepare(query).all(...params) as Array<{ status: string; count: number }>
    
    const stats: Record<string, number> = {
      total: 0,
      new: 0,
      machine_received: 0,
      in_progress: 0,
      waiting_delivery: 0,
      delivered: 0,
      closed: 0,
    }

    statusCounts.forEach((row) => {
      stats.total += row.count
      const normalized = normalizeTicketStatus(row.status) as TicketStatusValue
      if (normalized in stats) {
        stats[normalized] += row.count
      }
    })

    res.json(stats)
  } catch (error) {
    console.error('Get ticket stats error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get all tickets
router.get('/', authenticateToken, (req, res) => {
  try {
    const {
      search,
      status,
      priority,
      assigned_to,
      customer_id,
      inverter_id,
      created_by,
      sla_status,
      from,
      to,
      page = '1',
      limit = '50',
    } = req.query

    let query = `
      SELECT t.*,
             c.name as customer_name,
             c.email as customer_email,
             c.phone as customer_phone,
             i.serial_number as inverter_serial,
             i.model as inverter_model,
             u1.name as assigned_to_name,
             u1.email as assigned_to_email,
             u1.phone as assigned_to_phone,
             u1.role as assigned_to_role,
             u1.function as assigned_to_function,
             u2.name as created_by_name
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN inverters i ON t.inverter_id = i.id
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE 1=1
    `
    const params: any[] = []

    if (search) {
      query += ' AND (t.title LIKE ? OR t.description LIKE ? OR t.ticket_number LIKE ? OR i.serial_number LIKE ? OR c.name LIKE ? OR c.email LIKE ?)'
      const searchTerm = `%${search}%`
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
    }

    if (status) {
      query = appendTicketStatusFilter(query, params, status as string)
    }

    if (priority) {
      query += ' AND t.priority = ?'
      params.push(priority)
    }

    if (assigned_to) {
      query += ' AND t.assigned_to = ?'
      params.push(parseInt(assigned_to as string))
    }

    if (customer_id) {
      query += ' AND t.customer_id = ?'
      params.push(parseInt(customer_id as string))
    }

    if (inverter_id) {
      query += ' AND t.inverter_id = ?'
      params.push(parseInt(inverter_id as string))
    }

    if (created_by) {
      query += ' AND t.created_by = ?'
      params.push(parseInt(created_by as string))
    }

    // Filter by SLA status
    if (sla_status) {
      if (sla_status === 'completed') {
        // Tickets that are closed or completed
        query += ` AND t.status IN (${CLOSED_DB_STATUSES_SQL})`
      } else if (sla_status === 'overdue') {
        // Tickets with SLA deadline passed and not closed
        query += ` AND t.sla_deadline IS NOT NULL AND datetime(t.sla_deadline) < datetime('now') AND t.status NOT IN (${CLOSED_DB_STATUSES_SQL})`
      } else if (sla_status === 'on_time') {
        // Tickets with SLA deadline not passed and not closed
        query += ` AND t.sla_deadline IS NOT NULL AND datetime(t.sla_deadline) >= datetime('now') AND t.status NOT IN (${CLOSED_DB_STATUSES_SQL})`
      }
    }

    // Filter by date range (based on updated_at for completed/closed tickets, or created_at for others)
    if (from && to) {
      query += ` AND (
        (t.status IN (${CLOSED_DB_STATUSES_SQL}) AND t.updated_at IS NOT NULL AND t.updated_at >= ? AND t.updated_at <= ?)
        OR
        (t.status NOT IN (${CLOSED_DB_STATUSES_SQL}) AND t.created_at >= ? AND t.created_at <= ?)
      )`
      params.push(`${from} 00:00:00`, `${to} 23:59:59`, `${from} 00:00:00`, `${to} 23:59:59`)
    }

    // Filter by user role - MUST be applied for non-admin roles
    const user = (req as AuthRequest).user
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    // ADMIN, DEV, SERVICE_CENTER, and TECHNICIAN can see all tickets
    const canSeeAllTickets =
      isStaffAdminRole(user.role) ||
      user.role === UserRole.SERVICE_CENTER ||
      user.role === UserRole.TECHNICIAN
    
    if (!canSeeAllTickets) {
      if (user.role === UserRole.END_USER) {
      query += ` AND ${endUserTicketAccessSqlFor('t')}`
      params.push(...endUserTicketAccessParams(user.id))
      } else if (user.role === UserRole.DISTRIBUTOR) {
      // Distributors can see tickets they created AND tickets of end users linked to them AND tickets for their inverters AND tickets they are watching
      // Get all end users that have this distributor as parent_distributor_id
      const linkedEndUsers = db.prepare(`
        SELECT id FROM users 
        WHERE parent_distributor_id = ? AND role = ?
      `).all(user.id, UserRole.END_USER) as Array<{ id: number }>
      
      if (linkedEndUsers.length > 0) {
        const endUserIds = linkedEndUsers.map(u => u.id)
        // Include distributor's own ID and linked end user IDs
        const allUserIds = [user.id, ...endUserIds]
        query += ` AND (t.created_by IN (${allUserIds.map(() => '?').join(',')}) OR t.assigned_to = ? OR EXISTS (SELECT 1 FROM inverters i WHERE i.id = t.inverter_id AND i.user_id IN (${allUserIds.map(() => '?').join(',')})) OR EXISTS (SELECT 1 FROM ticket_watchers tw WHERE tw.ticket_id = t.id AND tw.user_id = ?))`
        params.push(...allUserIds, user.id, ...allUserIds, user.id)
      } else {
        // If no linked end users, show tickets created by distributor OR assigned to them OR tickets for their inverters OR tickets they are watching
        query += ' AND (t.created_by = ? OR t.assigned_to = ? OR EXISTS (SELECT 1 FROM inverters i WHERE i.id = t.inverter_id AND i.user_id = ?) OR EXISTS (SELECT 1 FROM ticket_watchers tw WHERE tw.ticket_id = t.id AND tw.user_id = ?))'
        params.push(user.id, user.id, user.id, user.id)
        }
      } else {
        // For other roles (DEALER, WAREHOUSE, etc.), deny access by default
        query += ' AND 1=0' // This will return no results
      }
    }

    query += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?'
    const limitNum = parseInt(limit as string)
    const offset = (parseInt(page as string) - 1) * limitNum
    params.push(limitNum, offset)

    const tickets = db.prepare(query).all(...params)

    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN inverters i ON t.inverter_id = i.id
      WHERE 1=1
    `
    const countParams: any[] = []

    if (search) {
      countQuery += ' AND (t.title LIKE ? OR t.description LIKE ? OR t.ticket_number LIKE ? OR i.serial_number LIKE ? OR c.name LIKE ? OR c.email LIKE ?)'
      const searchTerm = `%${search}%`
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
    }

    if (status) {
      countQuery = appendTicketStatusFilter(countQuery, countParams, status as string)
    }

    if (priority) {
      countQuery += ' AND t.priority = ?'
      countParams.push(priority)
    }

    if (assigned_to) {
      countQuery += ' AND t.assigned_to = ?'
      countParams.push(parseInt(assigned_to as string))
    }

    if (customer_id) {
      countQuery += ' AND t.customer_id = ?'
      countParams.push(parseInt(customer_id as string))
    }

    if (inverter_id) {
      countQuery += ' AND t.inverter_id = ?'
      countParams.push(parseInt(inverter_id as string))
    }

    if (created_by) {
      countQuery += ' AND t.created_by = ?'
      countParams.push(parseInt(created_by as string))
    }

    // Filter by SLA status in count query
    if (sla_status) {
      if (sla_status === 'completed') {
        // Tickets that are closed or completed
        countQuery += ` AND t.status IN (${CLOSED_DB_STATUSES_SQL})`
      } else if (sla_status === 'overdue') {
        countQuery += ` AND t.sla_deadline IS NOT NULL AND datetime(t.sla_deadline) < datetime('now') AND t.status NOT IN (${CLOSED_DB_STATUSES_SQL})`
      } else if (sla_status === 'on_time') {
        countQuery += ` AND t.sla_deadline IS NOT NULL AND datetime(t.sla_deadline) >= datetime('now') AND t.status NOT IN (${CLOSED_DB_STATUSES_SQL})`
      }
    }

    // Apply role-based filtering to count query - MUST match main query
    // ADMIN, DEV, SERVICE_CENTER, and TECHNICIAN can see all tickets
    const canSeeAllTicketsCount =
      isStaffAdminRole(user?.role) ||
      user?.role === UserRole.SERVICE_CENTER ||
      user?.role === UserRole.TECHNICIAN
    
    if (!canSeeAllTicketsCount) {
      if (user?.role === UserRole.END_USER) {
      countQuery += ` AND ${endUserTicketAccessSqlFor('t')}`
      countParams.push(...endUserTicketAccessParams(user.id))
    } else if (user?.role === UserRole.DISTRIBUTOR) {
      // Distributors can see tickets they created AND tickets of end users linked to them AND tickets for their inverters AND tickets they are watching
      const linkedEndUsers = db.prepare(`
        SELECT id FROM users 
        WHERE parent_distributor_id = ? AND role = ?
      `).all(user.id, UserRole.END_USER) as Array<{ id: number }>
      
      if (linkedEndUsers.length > 0) {
        const endUserIds = linkedEndUsers.map(u => u.id)
        // Include distributor's own ID and linked end user IDs
        const allUserIds = [user.id, ...endUserIds]
        countQuery += ` AND (t.created_by IN (${allUserIds.map(() => '?').join(',')}) OR t.assigned_to = ? OR EXISTS (SELECT 1 FROM inverters i WHERE i.id = t.inverter_id AND i.user_id IN (${allUserIds.map(() => '?').join(',')})) OR EXISTS (SELECT 1 FROM ticket_watchers tw WHERE tw.ticket_id = t.id AND tw.user_id = ?))`
        countParams.push(...allUserIds, user.id, ...allUserIds, user.id)
      } else {
        // If no linked end users, show tickets created by distributor OR assigned to them OR tickets for their inverters OR tickets they are watching
        countQuery += ' AND (t.created_by = ? OR t.assigned_to = ? OR EXISTS (SELECT 1 FROM inverters i WHERE i.id = t.inverter_id AND i.user_id = ?) OR EXISTS (SELECT 1 FROM ticket_watchers tw WHERE tw.ticket_id = t.id AND tw.user_id = ?))'
        countParams.push(user.id, user.id, user.id, user.id)
        }
      } else {
        // For other roles (DEALER, WAREHOUSE, etc.), deny access by default
        countQuery += ' AND 1=0' // This will return no results
      }
    }

    const totalResult = db.prepare(countQuery).get(...countParams) as { total: number }

    res.json({
      data: tickets,
      pagination: {
        page: parseInt(page as string),
        limit: limitNum,
        total: totalResult.total,
        totalPages: Math.ceil(totalResult.total / limitNum),
      },
    })
  } catch (error) {
    console.error('Get tickets error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Bulk delete tickets (Dev only)
router.post('/bulk-delete', authenticateToken, requireRole(UserRole.DEV), (req: AuthRequest, res) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid request. ids array is required.' })
    }

    // Use transaction for bulk delete
    const deleteTx = db.transaction((ticketIds: number[]) => {
      const stmt = db.prepare('DELETE FROM tickets WHERE id = ?')
      let deletedCount = 0
      for (const id of ticketIds) {
        const result = stmt.run(id)
        deletedCount += result.changes
      }
      return deletedCount
    })

    const count = deleteTx(ids)
    res.json({ success: true, count, message: `Successfully deleted ${count} tickets` })
  } catch (error) {
    console.error('Bulk delete tickets error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get ticket by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const ticketId = parseInt(req.params.id)
    const user = (req as AuthRequest).user

    const ticket = db.prepare(`
      SELECT t.*,
             c.name as customer_name,
             c.email as customer_email,
             c.phone as customer_phone,
             c.user_id as customer_user_id,
             (SELECT ct.id
              FROM contract_inverters ci
              JOIN contracts ct ON ct.id = ci.contract_id
              WHERE ci.inverter_id = t.inverter_id
              ORDER BY ct.updated_at DESC, ci.contract_id DESC
              LIMIT 1) AS contract_id,
             (SELECT ct.contract_number
              FROM contract_inverters ci
              JOIN contracts ct ON ct.id = ci.contract_id
              WHERE ci.inverter_id = t.inverter_id
              ORDER BY ct.updated_at DESC, ci.contract_id DESC
              LIMIT 1) AS contract_number,
             (SELECT ct.title
              FROM contract_inverters ci
              JOIN contracts ct ON ct.id = ci.contract_id
              WHERE ci.inverter_id = t.inverter_id
              ORDER BY ct.updated_at DESC, ci.contract_id DESC
              LIMIT 1) AS contract_title,
             i.serial_number as inverter_serial,
             i.model as inverter_model,
             COALESCE(NULLIF(TRIM(i.manufacturer), ''), m.manufacturer, '') AS inverter_manufacturer,
             i.user_id as inverter_user_id,
             i.warranty_end_date as inverter_warranty_end_date,
             u1.name as assigned_to_name,
             u1.email as assigned_to_email,
             u1.phone as assigned_to_phone,
             u1.role as assigned_to_role,
             u1.function as assigned_to_function,
             u2.name as created_by_name,
             u2.email as created_by_email,
             u2.phone as created_by_phone
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN inverters i ON t.inverter_id = i.id
      LEFT JOIN models m ON m.name = i.model
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      LEFT JOIN users u2 ON t.created_by = u2.id
      WHERE t.id = ?
    `).get(ticketId) as any

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Check access permissions based on user role
    // Logic phải khớp với GET /tickets (danh sách) để tránh hiển thị ticket nhưng không xem được chi tiết
    if (user?.role === UserRole.END_USER) {
      if (!canEndUserAccessTicket(user.id, { ...ticket, id: ticketId })) {
        return res.status(403).json({ error: 'Access denied' })
      }
    } else if (user?.role === UserRole.DISTRIBUTOR) {
      // Distributors can view:
      // 1. Tickets they created
      // 2. Tickets assigned to them
      // 3. Tickets created by linked end users
      // 4. Tickets for their inverters or inverters of linked end users
      // 5. Tickets they are watching
      
      // Check basic access
      let canAccess = 
        ticket.created_by === user.id || 
        ticket.assigned_to === user.id ||
        db.prepare('SELECT 1 FROM ticket_watchers WHERE ticket_id = ? AND user_id = ?').get(ticketId, user.id)
      
      // Check if ticket is for distributor's inverter
      if (!canAccess && ticket.inverter_id) {
        const inverter = db.prepare('SELECT user_id FROM inverters WHERE id = ?').get(ticket.inverter_id) as { user_id: number | null } | undefined
        if (inverter?.user_id === user.id) {
          canAccess = true
        } else if (inverter?.user_id) {
          // Check if inverter belongs to a linked end user
          const linkedEndUser = db.prepare(`
            SELECT id FROM users 
            WHERE id = ? AND parent_distributor_id = ? AND role = ?
          `).get(inverter.user_id, user.id, UserRole.END_USER) as { id: number } | undefined
          if (linkedEndUser) {
            canAccess = true
          }
        }
      }
      
      // Check if ticket created by linked end user
      if (!canAccess) {
        const linkedEndUser = db.prepare(`
          SELECT id FROM users 
          WHERE id = ? AND parent_distributor_id = ? AND role = ?
        `).get(ticket.created_by, user.id, UserRole.END_USER) as { id: number } | undefined
        if (linkedEndUser) {
          canAccess = true
        }
      }
      
      if (!canAccess) {
        return res.status(403).json({ error: 'Access denied' })
      }
    } else if (user?.role === UserRole.TECHNICIAN) {
      const canAccess =
        ticket.assigned_to === user.id ||
        ticket.created_by === user.id ||
        db.prepare('SELECT 1 FROM ticket_watchers WHERE ticket_id = ? AND user_id = ?').get(ticketId, user.id) ||
        userCanAccessTicketViaContractManager(user.id, ticket)

      if (!canAccess) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    // Get comments - filter internal comments based on user role
    const canViewInternal =
      isStaffAdminRole(user?.role) || user?.role === UserRole.TECHNICIAN
    let commentsQuery = `
      SELECT tc.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM ticket_comments tc
      LEFT JOIN users u ON tc.user_id = u.id
      WHERE tc.ticket_id = ?
    `
    const commentsParams: any[] = [ticketId]
    
    if (!canViewInternal) {
      // Non-admin/dev/technician users cannot see internal comments
      // Check if is_internal column exists before filtering
      const tableInfo = db.prepare('PRAGMA table_info(ticket_comments)').all() as Array<{ name: string }>
      const hasIsInternal = tableInfo.some(col => col.name === 'is_internal')
      if (hasIsInternal) {
        commentsQuery += ' AND (tc.is_internal = 0 OR tc.is_internal IS NULL)'
      }
    }
    
    commentsQuery += ' ORDER BY tc.created_at ASC'
    
    const rawComments = db.prepare(commentsQuery).all(...commentsParams) as any[]

    // Enrich each comment with linked image attachment IDs (not base64 payloads)
    const commentImages = db.prepare(`
      SELECT id, comment_id
      FROM ticket_attachments
      WHERE ticket_id = ?
        AND comment_id IS NOT NULL
        AND (mime_type LIKE 'image/%' OR file_path LIKE 'data:image/%' OR mime_type IS NULL)
      ORDER BY created_at ASC
    `).all(ticketId) as Array<{ id: number; comment_id: number }>

    const imagesByComment = new Map<number, number[]>()
    for (const img of commentImages) {
      if (!imagesByComment.has(img.comment_id)) {
        imagesByComment.set(img.comment_id, [])
      }
      imagesByComment.get(img.comment_id)!.push(img.id)
    }

    const comments = rawComments.map((c: any) => ({
      ...c,
      images: imagesByComment.get(c.id) || [],
    }))

    // Get watchers
    const watchers = db.prepare(`
      SELECT 
        tw.id,
        tw.user_id,
        tw.created_at,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        u.role as user_role
      FROM ticket_watchers tw
      INNER JOIN users u ON tw.user_id = u.id
      WHERE tw.ticket_id = ?
      ORDER BY tw.created_at ASC
    `).all(ticketId) as any[]

    // Get attachments (exclude images/files linked to comments); omit file_path from JSON
    const rawAttachments = db.prepare(`
      SELECT ta.*, u.name as uploaded_by_name
      FROM ticket_attachments ta
      LEFT JOIN users u ON ta.uploaded_by = u.id
      WHERE ta.ticket_id = ? AND ta.comment_id IS NULL
      ORDER BY ta.created_at DESC
    `).all(ticketId) as Array<Record<string, unknown>>

    const attachments = rawAttachments.map((a) => sanitizeAttachmentRow(a, ticketId))

    // Get service reports
    const serviceReports = db.prepare('SELECT * FROM service_reports WHERE ticket_id = ? ORDER BY created_at DESC').all(ticketId)

    const storedReportFile = (ticket as { report_html_file?: string | null }).report_html_file
    const resolvedReportFile = findReportFilename(ticketId, storedReportFile)
    if (resolvedReportFile && resolvedReportFile !== storedReportFile) {
      db.prepare('UPDATE tickets SET report_html_file = ? WHERE id = ?').run(resolvedReportFile, ticketId)
    }
    const report_url = resolvedReportFile
      ? `/api/tickets/reports/${resolvedReportFile}`
      : null

    res.json({
      ...ticket,
      comments,
      attachments,
      service_reports: serviceReports,
      watchers,
      report_url,
    })
  } catch (error) {
    console.error('Get ticket error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})


// Create ticket
router.post('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const {
      inverter_id,
      customer_id,
      contract_id,
      title,
      description,
      priority = 'medium',
      category,
    } = req.body

    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const authUser = req.user!
    
    // Get full user info from database
    const fullUser = db.prepare('SELECT id, name, email, phone, organization FROM users WHERE id = ?').get(authUser.id) as {
      id: number
      name: string
      email: string
      phone: string | null
      organization: string | null
    } | undefined
    
    if (!fullUser) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    let finalCustomerId = customer_id

    // For END_USER: automatically find or create customer record bằng user_id
    if (authUser.role === UserRole.END_USER) {
      // Tìm customer record bằng user_id
      const matchingCustomer = db.prepare(`
        SELECT id FROM customers 
        WHERE user_id = ?
        LIMIT 1
      `).get(fullUser.id) as { id: number } | undefined

      if (matchingCustomer) {
        finalCustomerId = matchingCustomer.id
      } else {
        // Tạo customer record mới với user_id
        const customerType = fullUser.organization ? 'enterprise' : 'residential'
        const customerResult = db.prepare(`
          INSERT INTO customers (name, email, phone, address, customer_type, organization, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          fullUser.name,
          fullUser.email || null,
          fullUser.phone || null,
          null,
          customerType,
          fullUser.organization || null,
          fullUser.id
        )
        finalCustomerId = customerResult.lastInsertRowid as number
      }
    } else {
      // For ADMIN/TECHNICIAN: customer_id from body, or from hợp đồng/thiết bị
      if (!finalCustomerId && inverter_id) {
        finalCustomerId = getCustomerIdForInverter(Number(inverter_id)) ?? undefined
      }
    }

    finalCustomerId = finalCustomerId ? Number(finalCustomerId) : undefined

    if (!finalCustomerId) {
      return res.status(400).json({ error: 'Không xác định được khách hàng. Thiết bị cần thuộc hợp đồng có khách hàng.' })
    }

    let finalContractId: number | null = null
    if (contract_id !== undefined && contract_id !== null && contract_id !== '') {
      const parsed = Number(contract_id)
      if (!isNaN(parsed) && parsed > 0) {
        const contractRow = db.prepare('SELECT id, customer_id FROM contracts WHERE id = ?').get(parsed) as
          | { id: number; customer_id: number | null }
          | undefined
        if (contractRow) {
          finalContractId = contractRow.id
          if (contractRow.customer_id && contractRow.customer_id !== finalCustomerId) {
            return res.status(400).json({ error: 'Hợp đồng không thuộc khách hàng của ticket' })
          }
        }
      }
    }

    if (!finalContractId && inverter_id) {
      const linked = db.prepare(`
        SELECT ct.id FROM contract_inverters ci
        INNER JOIN contracts ct ON ct.id = ci.contract_id
        WHERE ci.inverter_id = ?
        ORDER BY ct.updated_at DESC, ci.contract_id DESC
        LIMIT 1
      `).get(Number(inverter_id)) as { id: number } | undefined
      if (linked) finalContractId = linked.id
    }

    let ticketNumber: string
    if (inverter_id) {
      try {
        ticketNumber = generateTicketNumber(Number(inverter_id))
      } catch (err: any) {
        return res.status(400).json({ error: err.message || 'Không tạo được mã ticket' })
      }
    } else {
      ticketNumber = generateLegacyTicketNumber()
    }

    // Calculate SLA deadline from settings (fallback to defaults if not configured)
    const slaHours = getSlaHoursByPriority(priority)
    const slaDeadline = new Date()
    slaDeadline.setHours(slaDeadline.getHours() + slaHours)

    // Auto-assign technician based on ticket category
    let assignedTechnicianId: number | null = null
    if (category) {
      let targetFunction: string | null = null
      
      // Normalize category (support both camelCase and snake_case)
      const normalizedCategory = String(category).replace(/_/g, '')
      
      // Map ticket category to technician function
      switch (normalizedCategory.toLowerCase()) {
        case 'repair':
          targetFunction = 'repair' // Sửa chữa
          break
        case 'warranty':
          targetFunction = 'repair' // Bảo hành → Sửa chữa
          break
        case 'technicalsupport':
          targetFunction = 'technicalSupport' // Hỗ trợ kỹ thuật → Hỗ trợ kỹ thuật
          break
        case 'productconsultation':
          targetFunction = 'sale' // Tư vấn sản phẩm → Sale
          break
        case 'other':
          targetFunction = 'management' // Khác → Quản lý
          break
      }

      // Find assigned technician from auto-assign settings first
      if (targetFunction) {
        const settingKey = AUTO_ASSIGN_KEYS[targetFunction as keyof typeof AUTO_ASSIGN_KEYS]

        if (settingKey) {
          const setting = db.prepare(`SELECT value FROM settings WHERE key = ?`).get(settingKey) as { value: string | null } | undefined
          const configuredUserId = setting?.value ? Number(setting.value) : null

          if (configuredUserId && Number.isInteger(configuredUserId)) {
            const rolePlaceholders = AUTO_ASSIGN_STAFF_ROLES.map(() => '?').join(', ')
            const configuredUser = db.prepare(`
              SELECT id, role, function FROM users
              WHERE id = ? AND role IN (${rolePlaceholders}) AND status = 'active'
            `).get(configuredUserId, ...AUTO_ASSIGN_STAFF_ROLES) as { id: number; role: string; function: string | null } | undefined

            if (configuredUser && resolveStaffFunction(configuredUser.role, configuredUser.function) === targetFunction) {
              assignedTechnicianId = configuredUser.id
              console.log(`✅ [POST /tickets] Auto-assigned to configured staff ID ${assignedTechnicianId} (function: ${targetFunction})`)
            } else {
              console.log(`⚠️ [POST /tickets] Configured staff ID ${configuredUserId} not available for function: ${targetFunction}, skipping auto-assign`)
            }
          }
        }

        // No configured staff → do not fall back to lowest ID, leave unassigned
        if (!assignedTechnicianId) {
          console.log(`ℹ️ [POST /tickets] No auto-assign configured for function: ${targetFunction}`)
        }
      }
    }

    const initialStatus = TicketStatus.NEW

    const result = db.prepare(`
      INSERT INTO tickets (
        ticket_number, inverter_id, customer_id, contract_id, title, description,
        priority, status, category, assigned_to, created_by, sla_deadline
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ticketNumber,
      inverter_id || null,
      finalCustomerId,
      finalContractId,
      title,
      description || null,
      priority,
      initialStatus,
      category || null,
      assignedTechnicianId,
      fullUser.id,
      slaDeadline.toISOString()
    )

    const ticketId = Number(result.lastInsertRowid)
    
    // Sync ticket data (populate denormalized fields)
    syncTicketData(ticketId)

    const newTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId) as any

    try {
    // Notify admins and service center
    notifyUsersByRoles(
      [UserRole.ADMIN, UserRole.DEV, UserRole.SERVICE_CENTER],
      {
        type: 'ticket_created',
        title: `Ticket mới ${newTicket.ticket_number}`,
        message: `${fullUser.name} đã tạo ticket "${title}" với mức ưu tiên ${priority}`,
        entityType: 'ticket',
        entityId: ticketId,
        data: {
          ticket_number: newTicket.ticket_number,
          priority,
          customer_id: finalCustomerId,
        },
      },
      { excludeIds: [fullUser.id] }
    )

    // Notify customer about ticket creation - link bằng user_id
    // Lấy user_id từ customer record
    let customerUserId: number | null = null
    if (finalCustomerId) {
      const customer = db.prepare('SELECT user_id FROM customers WHERE id = ?').get(finalCustomerId) as { user_id: number | null } | undefined
      customerUserId = customer?.user_id || null
    }
    
    // Gửi notification cho customer (user_id của customer)
    if (customerUserId && customerUserId !== fullUser.id) {
      createNotification(customerUserId, {
        type: 'ticket_created',
        title: `Ticket ${newTicket.ticket_number} đã được tạo`,
        message: `Ticket "${title}" của bạn đã được tạo thành công${assignedTechnicianId ? ' và đã được phân công cho kỹ thuật viên' : ''}`,
        entityType: 'ticket',
        entityId: ticketId,
        data: {
          ticket_number: newTicket.ticket_number,
          priority,
          category,
        },
      })
    }

    const isEndUserOrDistributor =
      authUser.role === UserRole.END_USER || authUser.role === UserRole.DISTRIBUTOR
    createNotification(fullUser.id, {
      type: 'ticket_created',
      title: `Ticket ${newTicket.ticket_number} đã được tạo`,
      message: isEndUserOrDistributor
        ? `Ticket "${title}" của bạn đã được tạo thành công${assignedTechnicianId ? ' và đã được phân công cho kỹ thuật viên' : ''}`
        : `Bạn đã tạo ticket "${title}" (${newTicket.ticket_number}) thành công`,
      entityType: 'ticket',
      entityId: ticketId,
      data: {
        ticket_number: newTicket.ticket_number,
        priority,
        category,
      },
    })

    // Notify assigned technician if ticket was auto-assigned
    if (assignedTechnicianId) {
      // Get assigned technician info for activity log
      const assignedTechnician = db.prepare('SELECT name FROM users WHERE id = ?').get(assignedTechnicianId) as { name: string } | undefined
      const technicianName = assignedTechnician?.name || 'Nhân viên'
      
      // Add system comment for auto-assignment
      const greetingMessage = `Hệ thống đã chuyển người phụ trách sang ${technicianName}`
      
      db.prepare(`
        INSERT INTO ticket_comments (ticket_id, user_id, comment)
        VALUES (?, ?, ?)
      `).run(
        ticketId,
        fullUser.id, // Use creator's ID for system comment
        greetingMessage
      )
      
      createNotification(assignedTechnicianId, {
        type: 'ticket_assigned',
        title: `Ticket được gán: ${newTicket.ticket_number}`,
        message: `Bạn đã được gán ticket "${title}" (${category || 'N/A'})`,
        entityType: 'ticket',
        entityId: ticketId,
        data: {
          ticket_number: newTicket.ticket_number,
          priority,
          category,
        },
      })
    }

    // Sync ticket counts if ticket was assigned
    if (assignedTechnicianId) {
      syncTicketRelatedCounts(ticketId, undefined, assignedTechnicianId)
    }
    } catch (notifyErr) {
      console.error('Ticket notification error (ticket still created):', notifyErr)
    }

    res.status(201).json(newTicket)
  } catch (error) {
    console.error('Create ticket error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    res.status(500).json({ error: message })
  }
})

// Update ticket
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const ticketId = parseInt(req.params.id)
    const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId) as any

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    const user = (req as AuthRequest).user!
    const { title, description, priority, status, assigned_to, category, customer_id, inverter_id, created_at } = req.body

    let normalizedStatus: string | undefined = status
    if (status !== undefined && status !== null && status !== '') {
      if (!isValidTicketStatus(status)) {
        return res.status(400).json({ error: 'Trạng thái ticket không hợp lệ' })
      }
      normalizedStatus = normalizeTicketStatus(status) as string
    }

    let normalizedAssignedTo = assigned_to
    if (assigned_to !== undefined && assigned_to !== null) {
      const parsed = Number(assigned_to)
      if (Number.isNaN(parsed)) {
        return res.status(400).json({ error: 'assigned_to phải là số hợp lệ' })
      }
      normalizedAssignedTo = parsed
    }

    const isAdminLike = isStaffAdminRole(user.role) || user.role === UserRole.SERVICE_CENTER
    const isDev = user.role === UserRole.DEV
    const isTechnician = user.role === UserRole.TECHNICIAN
    const isCreator = ticket.created_by === user.id
    const isAssignee = ticket.assigned_to === user.id

    // Allow ADMIN, SERVICE_CENTER, DEV, TECHNICIAN, creator, or assignee to update ticket
    if (
      !isAdminLike &&
      !isDev &&
      !isTechnician &&
      !isCreator &&
      !isAssignee
    ) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Snapshot fields (ticket / customer / device) are fixed after creation
    if (customer_id !== undefined && Number(customer_id) !== ticket.customer_id) {
      return res.status(403).json({ error: 'Không thể thay đổi khách hàng của ticket' })
    }
    if (inverter_id !== undefined) {
      const requestedInverterId =
        inverter_id === null || inverter_id === '' ? null : Number(inverter_id)
      if (requestedInverterId !== ticket.inverter_id) {
        return res.status(403).json({ error: 'Không thể thay đổi thiết bị của ticket' })
      }
    }
    if (created_at !== undefined && created_at !== null && created_at !== '') {
      return res.status(403).json({ error: 'Không thể thay đổi ngày tạo ticket' })
    }
    if (category !== undefined && category !== ticket.category) {
      return res.status(403).json({ error: 'Không thể thay đổi loại ticket' })
    }
    if (priority !== undefined && priority !== ticket.priority) {
      return res.status(403).json({ error: 'Không thể thay đổi mức ưu tiên ticket' })
    }
    if (title !== undefined && title !== ticket.title) {
      return res.status(403).json({ error: 'Không thể thay đổi tiêu đề ticket' })
    }
    if (description !== undefined && description !== ticket.description) {
      return res.status(403).json({ error: 'Không thể thay đổi mô tả ticket' })
    }

    // TECHNICIAN and ADMIN can always change assigned_to (except for closed/completed tickets)
    const canChangeAssignee = isAdminLike || isTechnician
    if (normalizedAssignedTo !== undefined && canChangeAssignee) {
      // Allow changing assignee for non-closed tickets
      if (isTicketClosed(ticket.status)) {
        return res.status(400).json({ error: 'Cannot change assignee for closed tickets' })
      }
    }

    // TECHNICIAN can only update assigned_to field if not the assignee (unless updating their own assigned ticket)
    if (isTechnician && !isAssignee && normalizedAssignedTo === undefined) {
      // Check if trying to update other fields
      const hasOtherFields = title !== undefined || description !== undefined || priority !== undefined || status !== undefined || category !== undefined
      if (hasOtherFields) {
        return res.status(403).json({ error: 'Technicians can only change assigned_to or update tickets assigned to them' })
      }
    }

    // Track assigned_at when assigned_to is set for the first time
    let assignedAt = null
    if (normalizedAssignedTo !== undefined && normalizedAssignedTo !== null && !ticket.assigned_to) {
      // First time assigning
      assignedAt = new Date().toISOString()
    } else if (normalizedAssignedTo !== undefined && normalizedAssignedTo === null && ticket.assigned_to) {
      // Unassigning
      assignedAt = null
    } else if (normalizedAssignedTo !== undefined && normalizedAssignedTo !== ticket.assigned_to && normalizedAssignedTo !== null) {
      // Reassigning
      assignedAt = new Date().toISOString()
    }

    // Update closed_at when ticket is closed
    let closedAt = ticket.closed_at
    if (normalizedStatus === TicketStatus.CLOSED && !isTicketClosed(ticket.status)) {
      closedAt = new Date().toISOString()
    }

    // Validate customer_id if provided
    let normalizedCustomerId = customer_id
    if (customer_id !== undefined && customer_id !== null) {
      const parsed = Number(customer_id)
      if (Number.isNaN(parsed)) {
        return res.status(400).json({ error: 'customer_id phải là số hợp lệ' })
      }
      // Check if customer exists
      const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(parsed) as any
      if (!customer) {
        return res.status(400).json({ error: 'Customer không tồn tại' })
      }
      normalizedCustomerId = parsed
    }

    // Validate inverter_id if provided
    let normalizedInverterId = inverter_id
    if (inverter_id !== undefined && inverter_id !== null) {
      if (inverter_id === '') {
        normalizedInverterId = null
      } else {
        const parsed = Number(inverter_id)
        if (Number.isNaN(parsed)) {
          return res.status(400).json({ error: 'inverter_id phải là số hợp lệ' })
        }
        // Check if inverter exists
        const inverter = db.prepare('SELECT id FROM inverters WHERE id = ?').get(parsed) as any
        if (!inverter) {
          return res.status(400).json({ error: 'Device không tồn tại' })
        }
        normalizedInverterId = parsed
      }
    }

    // Validate and normalize created_at if provided
    let normalizedCreatedAt = null
    if (created_at !== undefined && created_at !== null && created_at !== '') {
      const parsedDate = new Date(created_at)
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'created_at không hợp lệ' })
      }
      normalizedCreatedAt = parsedDate.toISOString()
    }

    const resolvedAt = ticket.resolved_at

    const assignmentChanged = normalizedAssignedTo !== undefined

    db.prepare(`
      UPDATE tickets
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          priority = COALESCE(?, priority),
          status = COALESCE(?, status),
          assigned_to = COALESCE(?, assigned_to),
          assigned_at = CASE WHEN ? THEN ? ELSE assigned_at END,
          category = COALESCE(?, category),
          customer_id = COALESCE(?, customer_id),
          inverter_id = COALESCE(?, inverter_id),
          created_at = COALESCE(?, created_at),
          resolved_at = COALESCE(?, resolved_at),
          closed_at = COALESCE(?, closed_at),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title || null,
      description || null,
      priority || null,
      normalizedStatus || null,
      normalizedAssignedTo !== undefined ? normalizedAssignedTo : null,
      assignmentChanged ? 1 : 0,
      assignedAt,
      category || null,
      normalizedCustomerId !== undefined ? normalizedCustomerId : null,
      normalizedInverterId !== undefined ? normalizedInverterId : null,
      normalizedCreatedAt || null,
      resolvedAt || null,
      closedAt || null,
      ticketId
    )

    // Sync ticket data (update denormalized fields)
    syncTicketData(ticketId)

    // Sync ticket counts for affected users
    syncTicketRelatedCounts(ticketId, ticket.assigned_to || undefined, normalizedAssignedTo || undefined)

    const updatedTicket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId) as any

    // Get ticket creator info for notifications
    const ticketCreator = db.prepare(`
      SELECT u.id, u.name, u.role, u.parent_distributor_id
      FROM users u
      WHERE u.id = ?
    `).get(updatedTicket.created_by) as { id: number; name: string; role: string; parent_distributor_id: number | null } | undefined

    // Notify about status change
    if (normalizedStatus && normalizedStatus !== ticket.status) {
      const statusLabel = getTicketStatusLabel(normalizedStatus)

      // Notify customer about status change - link bằng user_id từ customer record
      let customerUserId: number | null = null
      if (updatedTicket.customer_id) {
        const customer = db.prepare('SELECT user_id FROM customers WHERE id = ?').get(updatedTicket.customer_id) as { user_id: number | null } | undefined
        customerUserId = customer?.user_id || null
      }
      
      // Gửi notification cho customer (user_id của customer)
      const notificationUserId = customerUserId || ticketCreator?.id
      if (notificationUserId && notificationUserId !== user.id) {
        createNotification(notificationUserId, {
          type: 'ticket_status_changed',
          title: `Ticket ${updatedTicket.ticket_number} đã thay đổi trạng thái`,
          message: `Ticket "${updatedTicket.title}" của bạn đã được chuyển sang trạng thái "${statusLabel}"`,
          entityType: 'ticket',
          entityId: ticketId,
          data: {
            ticket_number: updatedTicket.ticket_number,
            old_status: ticket.status,
            new_status: normalizedStatus,
          },
        })
      }

      // Notify distributor if ticket belongs to an end user linked to a distributor
      if (ticketCreator && ticketCreator.role === UserRole.END_USER && ticketCreator.parent_distributor_id) {
        createNotification(ticketCreator.parent_distributor_id, {
          type: 'ticket_status_changed',
          title: `Ticket ${updatedTicket.ticket_number} đã thay đổi trạng thái`,
          message: `Ticket "${updatedTicket.title}" của khách hàng ${ticketCreator.name || ''} đã được chuyển sang trạng thái "${statusLabel}"`,
          entityType: 'ticket',
          entityId: ticketId,
          data: {
            ticket_number: updatedTicket.ticket_number,
            old_status: ticket.status,
            new_status: normalizedStatus,
          },
        })
      }
    }

    if (
      normalizedAssignedTo !== undefined &&
      normalizedAssignedTo !== null &&
      normalizedAssignedTo !== ticket.assigned_to
    ) {
      const actor = db.prepare('SELECT name FROM users WHERE id = ?').get(user.id) as { name: string } | undefined
      
      // Get assigned technician info
      const assignedTechnician = db.prepare('SELECT name FROM users WHERE id = ?').get(normalizedAssignedTo) as { name: string } | undefined
      const technicianName = assignedTechnician?.name || 'Nhân viên'
      
      // Notify assigned technician
      createNotification(normalizedAssignedTo, {
        type: 'ticket_assigned',
        title: `Bạn được phân công ticket ${updatedTicket.ticket_number}`,
        message: `${actor?.name || 'Hệ thống'} đã phân công ticket "${updatedTicket.title}" cho bạn`,
        entityType: 'ticket',
        entityId: ticketId,
        data: {
          ticket_number: updatedTicket.ticket_number,
          priority: updatedTicket.priority,
        },
      })

      // Notify customer about assignment - link bằng user_id từ customer record
      let customerUserIdForAssignment: number | null = null
      if (updatedTicket.customer_id) {
        const customerForAssignment = db.prepare('SELECT user_id FROM customers WHERE id = ?').get(updatedTicket.customer_id) as { user_id: number | null } | undefined
        customerUserIdForAssignment = customerForAssignment?.user_id || null
      }
      
      const notificationUserIdForAssignment = customerUserIdForAssignment || ticketCreator?.id
      if (notificationUserIdForAssignment && notificationUserIdForAssignment !== user.id) {
        createNotification(notificationUserIdForAssignment, {
          type: 'ticket_assigned',
          title: `Ticket ${updatedTicket.ticket_number} đã được phân công`,
          message: `Ticket "${updatedTicket.title}" của bạn đã được phân công cho ${technicianName}`,
          entityType: 'ticket',
          entityId: ticketId,
          data: {
            ticket_number: updatedTicket.ticket_number,
          },
        })
      }

      // Notify distributor if ticket belongs to an end user linked to a distributor
      if (ticketCreator && ticketCreator.role === UserRole.END_USER && ticketCreator.parent_distributor_id) {
        createNotification(ticketCreator.parent_distributor_id, {
          type: 'ticket_assigned',
          title: `Ticket ${updatedTicket.ticket_number} đã được phân công`,
          message: `Ticket "${updatedTicket.title}" của khách hàng ${ticketCreator.name || ''} đã được phân công cho ${technicianName}`,
          entityType: 'ticket',
          entityId: ticketId,
          data: {
            ticket_number: updatedTicket.ticket_number,
          },
        })
      }
    }

    res.json(updatedTicket)
  } catch (error) {
    console.error('Update ticket error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add comment to ticket
router.post('/:id/comments', authenticateToken, (req, res) => {
  try {
    const ticketId = parseInt(req.params.id)
    const { comment, is_internal } = req.body

    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' })
    }

    const user = (req as AuthRequest).user!

    // Only ADMIN, DEV, TECHNICIAN can create internal comments
    const canCreateInternal = isStaffAdminRole(user.role) || user.role === UserRole.TECHNICIAN
    const isInternal = canCreateInternal && is_internal === true ? 1 : 0

    // Check if is_internal column exists
    const tableInfo = db.prepare('PRAGMA table_info(ticket_comments)').all() as Array<{ name: string }>
    const hasIsInternal = tableInfo.some(col => col.name === 'is_internal')

    let result
    if (hasIsInternal) {
      result = db.prepare(`
        INSERT INTO ticket_comments (ticket_id, user_id, comment, is_internal)
        VALUES (?, ?, ?, ?)
      `).run(ticketId, user.id, comment, isInternal)
    } else {
      result = db.prepare(`
        INSERT INTO ticket_comments (ticket_id, user_id, comment)
        VALUES (?, ?, ?)
      `).run(ticketId, user.id, comment)
    }

    const newComment = db.prepare(`
      SELECT tc.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM ticket_comments tc
      LEFT JOIN users u ON tc.user_id = u.id
      WHERE tc.id = ?
    `).get(result.lastInsertRowid) as any

    // Get ticket info for notifications
    const ticketInfo = db.prepare(`
      SELECT t.*, u.name as created_by_name, u.role as created_by_role, u.parent_distributor_id
      FROM tickets t
      LEFT JOIN users u ON t.created_by = u.id
      WHERE t.id = ?
    `).get(ticketId) as any

    if (!ticketInfo) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    const ticketNumber = ticketInfo.ticket_number || ''
    const ticketTitle = ticketInfo.title || ''

    // Get user name from database
    const userInfo = db.prepare('SELECT name FROM users WHERE id = ?').get(user.id) as { name: string } | undefined
    const userName = userInfo?.name || 'Người dùng'

    // Notify watchers about new comment (only if not internal)
    if (!isInternal) {
      const watchers = db.prepare(`
        SELECT user_id FROM ticket_watchers 
        WHERE ticket_id = ? AND user_id != ?
      `).all(ticketId, user.id) as Array<{ user_id: number }>

      watchers.forEach((watcher) => {
        createNotification(watcher.user_id, {
          type: 'ticket_comment',
          title: `Comment mới trong ticket ${ticketNumber}`,
          message: `${userName} đã thêm comment vào ticket "${ticketTitle}"`,
          entityType: 'ticket',
          entityId: ticketId,
          data: {
            ticket_number: ticketNumber,
          },
        })
      })

      // Notify customer about new comment - link bằng user_id từ customer record
      let customerUserId: number | null = null
      if (ticketInfo.customer_id) {
        const customer = db.prepare('SELECT user_id FROM customers WHERE id = ?').get(ticketInfo.customer_id) as { user_id: number | null } | undefined
        customerUserId = customer?.user_id || null
      }
      
      const notificationUserId = customerUserId || ticketInfo.created_by
      if (notificationUserId && notificationUserId !== user.id) {
        createNotification(notificationUserId, {
          type: 'ticket_comment',
          title: `Comment mới trong ticket ${ticketNumber}`,
          message: `${userName} đã thêm comment vào ticket "${ticketTitle}" của bạn`,
          entityType: 'ticket',
          entityId: ticketId,
          data: {
            ticket_number: ticketNumber,
          },
        })
      }

      // Notify assigned technician if comment is not internal and not from assigned technician
      if (ticketInfo.assigned_to && ticketInfo.assigned_to !== user.id && ticketInfo.assigned_to !== ticketInfo.created_by) {
        createNotification(ticketInfo.assigned_to, {
          type: 'ticket_comment',
          title: `Comment mới trong ticket ${ticketNumber}`,
          message: `${userName} đã thêm comment vào ticket "${ticketTitle}"`,
          entityType: 'ticket',
          entityId: ticketId,
          data: {
            ticket_number: ticketNumber,
          },
        })
      }

      // Notify distributor if ticket belongs to an end user linked to a distributor
      if (ticketInfo.created_by_role === UserRole.END_USER && ticketInfo.parent_distributor_id && ticketInfo.parent_distributor_id !== user.id) {
        createNotification(ticketInfo.parent_distributor_id, {
          type: 'ticket_comment',
          title: `Comment mới trong ticket ${ticketNumber}`,
          message: `${userName} đã thêm comment vào ticket "${ticketTitle}" của khách hàng ${ticketInfo.created_by_name || ''}`,
          entityType: 'ticket',
          entityId: ticketId,
          data: {
            ticket_number: ticketNumber,
          },
        })
      }
    }

    // Update ticket updated_at
    db.prepare('UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(ticketId)

    res.status(201).json(newComment)
  } catch (error) {
    console.error('Add comment error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update comment
router.put('/:id/comments/:commentId', authenticateToken, (req, res) => {
  try {
    const ticketId = parseInt(req.params.id)
    const commentId = parseInt(req.params.commentId)
    const { comment } = req.body

    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' })
    }

    const user = (req as AuthRequest).user!

    // Only TECHNICIAN, ADMIN, and DEV can edit comments
    if (user.role !== UserRole.TECHNICIAN && !isStaffAdminRole(user.role)) {
      return res.status(403).json({ error: 'Only technicians, admins, and developers can edit comments' })
    }

    // Check if comment exists and belongs to user
    const existingComment = db.prepare(`
      SELECT user_id, comment as old_comment
      FROM ticket_comments
      WHERE id = ? AND ticket_id = ?
    `).get(commentId, ticketId) as { user_id: number; old_comment: string } | undefined

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    if (existingComment.user_id !== user.id) {
      return res.status(403).json({ error: 'You can only edit your own comments' })
    }

    // Update comment
    db.prepare(`
      UPDATE ticket_comments
      SET comment = ?
      WHERE id = ? AND ticket_id = ?
    `).run(comment, commentId, ticketId)

    // Add notification comment about edit with full content
    const userInfo = db.prepare('SELECT name FROM users WHERE id = ?').get(user.id) as { name: string } | undefined
    const userName = userInfo?.name || 'Người dùng'
    const oldCommentFull = existingComment.old_comment || ''
    const newCommentFull = comment || ''
    const editNotification = `Người dùng ${userName} đã chỉnh sửa tin nhắn:\n\nNội dung cũ: ${oldCommentFull}\n\nNội dung mới: ${newCommentFull}`
    
    db.prepare(`
      INSERT INTO ticket_comments (ticket_id, user_id, comment)
      VALUES (?, ?, ?)
    `).run(ticketId, user.id, editNotification)

    // Get updated comment
    const updatedComment = db.prepare(`
      SELECT tc.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM ticket_comments tc
      LEFT JOIN users u ON tc.user_id = u.id
      WHERE tc.id = ?
    `).get(commentId) as any

    // Update ticket updated_at
    db.prepare('UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(ticketId)

    res.json(updatedComment)
  } catch (error) {
    console.error('Update comment error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete comment (recall)
router.delete('/:id/comments/:commentId', authenticateToken, (req, res) => {
  try {
    const ticketId = parseInt(req.params.id)
    const commentId = parseInt(req.params.commentId)

    const user = (req as AuthRequest).user!

    // Only TECHNICIAN, ADMIN, and DEV can delete/recall comments
    if (user.role !== UserRole.TECHNICIAN && !isStaffAdminRole(user.role)) {
      return res.status(403).json({ error: 'Only technicians, admins, and developers can recall comments' })
    }

    // Check if comment exists and belongs to user
    const existingComment = db.prepare(`
      SELECT user_id, comment
      FROM ticket_comments
      WHERE id = ? AND ticket_id = ?
    `).get(commentId, ticketId) as { user_id: number; comment: string } | undefined

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' })
    }

    if (existingComment.user_id !== user.id) {
      return res.status(403).json({ error: 'You can only delete your own comments' })
    }

    // Delete the comment completely without creating notification
    db.prepare(`
      DELETE FROM ticket_comments
      WHERE id = ? AND ticket_id = ?
    `).run(commentId, ticketId)

    // Update ticket updated_at
    db.prepare('UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(ticketId)

    res.json({ 
      success: true, 
      message: 'Comment deleted successfully'
    })
  } catch (error) {
    console.error('Delete comment error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get ticket watchers
router.get('/:id/watchers', authenticateToken, (req: AuthRequest, res) => {
  try {
    const ticketId = parseInt(req.params.id)
    const user = req.user!

    // Check if user has access to this ticket
    const ticket = db.prepare(`
      SELECT id, created_by, assigned_to, inverter_id, customer_id, contract_id
      FROM tickets WHERE id = ?
    `).get(ticketId) as {
      id: number
      created_by: number
      assigned_to: number | null
      inverter_id: number | null
      customer_id: number | null
      contract_id: number | null
    } | undefined

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    if (user.role === UserRole.END_USER) {
      if (!canEndUserAccessTicket(user.id, ticket)) {
        return res.status(403).json({ error: 'Access denied' })
      }
    } else if (user.role === UserRole.DISTRIBUTOR) {
      // Distributors can view tickets they created, assigned to them, for their inverters, or tickets they are watching
      const canAccess = 
        ticket.created_by === user.id || 
        ticket.assigned_to === user.id ||
        db.prepare('SELECT 1 FROM ticket_watchers WHERE ticket_id = ? AND user_id = ?').get(ticketId, user.id)
      
      if (!canAccess) {
        // Check if ticket belongs to an end user linked to this distributor
        const linkedEndUser = db.prepare(`
          SELECT id FROM users 
          WHERE id = ? AND parent_distributor_id = ? AND role = ?
        `).get(ticket.created_by, user.id, UserRole.END_USER) as { id: number } | undefined
        
        if (!linkedEndUser) {
          // Check if ticket is for an inverter of a linked end user or distributor's own inverter
          const ticketInfo = db.prepare('SELECT inverter_id FROM tickets WHERE id = ?').get(ticketId) as { inverter_id: number | null } | undefined
          if (ticketInfo?.inverter_id) {
            const inverter = db.prepare('SELECT user_id FROM inverters WHERE id = ?').get(ticketInfo.inverter_id) as { user_id: number | null } | undefined
            if (inverter?.user_id) {
              if (inverter.user_id === user.id) {
                // Distributor's own inverter
                return // Allow access
              } else {
                const linkedEndUserByInverter = db.prepare(`
                  SELECT id FROM users 
                  WHERE id = ? AND parent_distributor_id = ? AND role = ?
                `).get(inverter.user_id, user.id, UserRole.END_USER) as { id: number } | undefined
                if (!linkedEndUserByInverter) {
                  return res.status(403).json({ error: 'Access denied' })
                }
              }
            } else {
              return res.status(403).json({ error: 'Access denied' })
            }
          } else {
            return res.status(403).json({ error: 'Access denied' })
          }
        }
      }
    }
    // TECHNICIAN can now see all tickets (no access restriction)

    // Get watchers
    const watchers = db.prepare(`
      SELECT 
        tw.id,
        tw.user_id,
        tw.created_at,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        u.role as user_role
      FROM ticket_watchers tw
      INNER JOIN users u ON tw.user_id = u.id
      WHERE tw.ticket_id = ?
      ORDER BY tw.created_at ASC
    `).all(ticketId) as any[]

    res.json(watchers)
  } catch (error) {
    console.error('Get watchers error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add watcher to ticket
router.post('/:id/watchers', authenticateToken, (req: AuthRequest, res) => {
  try {
    const ticketId = parseInt(req.params.id)
    const { user_id } = req.body
    const currentUser = req.user!

    if (!user_id) {
      return res.status(400).json({ error: 'user_id is required' })
    }

    // Check if user has access to this ticket
    const ticket = db.prepare(`
      SELECT id, created_by, assigned_to, inverter_id, customer_id, contract_id, ticket_number
      FROM tickets WHERE id = ?
    `).get(ticketId) as {
      id: number
      created_by: number
      assigned_to: number | null
      inverter_id: number | null
      customer_id: number | null
      contract_id: number | null
      ticket_number?: string
    } | undefined

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Check access based on role
    if (currentUser.role === UserRole.END_USER) {
      if (!canEndUserAccessTicket(currentUser.id, ticket)) {
        return res.status(403).json({ error: 'Access denied' })
      }
    } else if (currentUser.role === UserRole.DISTRIBUTOR) {
      const linkedEndUser = db.prepare(`
        SELECT id FROM users 
        WHERE id = ? AND parent_distributor_id = ? AND role = ?
      `).get(ticket.created_by, currentUser.id, UserRole.END_USER) as { id: number } | undefined
      if (!linkedEndUser) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }
    // TECHNICIAN can now see all tickets (no access restriction)

    // Check if user exists
    const targetUser = db.prepare('SELECT id, name FROM users WHERE id = ? AND status = ?').get(user_id, 'active') as {
      id: number
      name: string
    } | undefined

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found or inactive' })
    }

    // Check if already watching
    const existing = db.prepare('SELECT id FROM ticket_watchers WHERE ticket_id = ? AND user_id = ?').get(ticketId, user_id) as {
      id: number
    } | undefined

    if (existing) {
      return res.status(400).json({ error: 'User is already watching this ticket' })
    }

    // Add watcher
    const result = db.prepare(`
      INSERT INTO ticket_watchers (ticket_id, user_id)
      VALUES (?, ?)
    `).run(ticketId, user_id)

    // Get watcher info
    const watcher = db.prepare(`
      SELECT 
        tw.id,
        tw.user_id,
        tw.created_at,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone,
        u.role as user_role
      FROM ticket_watchers tw
      INNER JOIN users u ON tw.user_id = u.id
      WHERE tw.id = ?
    `).get(result.lastInsertRowid) as any

    // Get current user name from database
    const currentUserInfo = db.prepare('SELECT name FROM users WHERE id = ?').get(currentUser.id) as { name: string } | undefined
    const currentUserName = currentUserInfo?.name || 'Hệ thống'

    // Add notification comment as internal comment
    const notificationComment = `${currentUserName} đã thêm ${targetUser.name} vào theo dõi ticket này`
    
    // Check if is_internal column exists
    const tableInfo = db.prepare('PRAGMA table_info(ticket_comments)').all() as Array<{ name: string }>
    const hasIsInternal = tableInfo.some(col => col.name === 'is_internal')
    
    if (hasIsInternal) {
      db.prepare(`
        INSERT INTO ticket_comments (ticket_id, user_id, comment, is_internal)
        VALUES (?, ?, ?, ?)
      `).run(ticketId, currentUser.id, notificationComment, 1)
    } else {
    db.prepare(`
      INSERT INTO ticket_comments (ticket_id, user_id, comment)
      VALUES (?, ?, ?)
    `).run(ticketId, currentUser.id, notificationComment)
    }

    // Notify the added watcher
    createNotification(user_id, {
      type: 'ticket_watched',
      title: `Bạn đã được thêm vào theo dõi ticket`,
      message: `${currentUserName} đã thêm bạn vào theo dõi ticket "${ticket.ticket_number || ''}"`,
      entityType: 'ticket',
      entityId: ticketId,
    })

    res.status(201).json(watcher)
  } catch (error) {
    console.error('Add watcher error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Remove watcher from ticket
router.delete('/:id/watchers/:watcherId', authenticateToken, (req: AuthRequest, res) => {
  try {
    const ticketId = parseInt(req.params.id)
    const watcherId = parseInt(req.params.watcherId)
    const currentUser = req.user!

    // Check if watcher exists
    const watcher = db.prepare(`
      SELECT tw.user_id, u.name as user_name
      FROM ticket_watchers tw
      INNER JOIN users u ON tw.user_id = u.id
      WHERE tw.id = ? AND tw.ticket_id = ?
    `).get(watcherId, ticketId) as { user_id: number; user_name: string } | undefined

    if (!watcher) {
      return res.status(404).json({ error: 'Watcher not found' })
    }

    // Check if user has permission (can remove themselves or is admin/technician)
    const ticket = db.prepare('SELECT created_by, assigned_to FROM tickets WHERE id = ?').get(ticketId) as {
      created_by: number
      assigned_to: number | null
    } | undefined

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    const canRemove =
      watcher.user_id === currentUser.id ||
      isStaffAdminRole(currentUser.role) ||
      currentUser.role === UserRole.TECHNICIAN

    if (!canRemove) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Remove watcher
    db.prepare('DELETE FROM ticket_watchers WHERE id = ? AND ticket_id = ?').run(watcherId, ticketId)

    // Get current user name from database
    const currentUserInfo = db.prepare('SELECT name FROM users WHERE id = ?').get(currentUser.id) as { name: string } | undefined
    const currentUserName = currentUserInfo?.name || 'Hệ thống'

    // Add notification comment as internal comment if removed by someone else
    if (watcher.user_id !== currentUser.id) {
      const notificationComment = `${currentUserName} đã xóa ${watcher.user_name} khỏi danh sách theo dõi ticket này`
      
      // Check if is_internal column exists
      const tableInfo = db.prepare('PRAGMA table_info(ticket_comments)').all() as Array<{ name: string }>
      const hasIsInternal = tableInfo.some(col => col.name === 'is_internal')
      
      if (hasIsInternal) {
        db.prepare(`
          INSERT INTO ticket_comments (ticket_id, user_id, comment, is_internal)
          VALUES (?, ?, ?, ?)
        `).run(ticketId, currentUser.id, notificationComment, 1)
      } else {
      db.prepare(`
        INSERT INTO ticket_comments (ticket_id, user_id, comment)
        VALUES (?, ?, ?)
      `).run(ticketId, currentUser.id, notificationComment)
      }
    }

    res.json({ success: true, message: 'Watcher removed successfully' })
  } catch (error) {
    console.error('Remove watcher error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Import tickets from CSV
router.post('/import', authenticateToken, async (req, res) => {
  try {
    const { tickets: ticketsData } = req.body

    if (!Array.isArray(ticketsData) || ticketsData.length === 0) {
      return res.status(400).json({ error: 'Tickets array is required' })
    }

    const user = (req as AuthRequest).user!
    const errors: string[] = []
    let successCount = 0

    for (let i = 0; i < ticketsData.length; i++) {
      const ticketData = ticketsData[i]
      const rowNumber = i + 1

      try {
        // Resolve customer_id from email if provided
        let customerId = ticketData.customer_id
        if (!customerId && ticketData.customer_email) {
          const customer = db.prepare('SELECT id FROM customers WHERE email = ?').get(ticketData.customer_email) as any
          if (!customer) {
            errors.push(`Dòng ${rowNumber}: Không tìm thấy khách hàng với email: ${ticketData.customer_email}`)
            continue
          }
          customerId = customer.id
        }

        if (!customerId) {
          errors.push(`Dòng ${rowNumber}: Thiếu customer_id hoặc customer_email không hợp lệ`)
          continue
        }

        if (!ticketData.title) {
          errors.push(`Dòng ${rowNumber}: Thiếu title`)
          continue
        }

        // Resolve inverter_id from serial number if provided
        let inverterId = ticketData.inverter_id
        if (!inverterId && ticketData.inverter_serial) {
          const inverter = db.prepare('SELECT id FROM inverters WHERE serial_number = ?').get(ticketData.inverter_serial) as any
          if (inverter) {
            inverterId = inverter.id
          }
        }

        let ticketNumber: string
        if (inverterId) {
          try {
            ticketNumber = generateTicketNumber(Number(inverterId))
          } catch {
            ticketNumber = generateLegacyTicketNumber()
          }
        } else {
          ticketNumber = generateLegacyTicketNumber()
        }
        const priority = ticketData.priority || 'medium'
        
        // Calculate SLA deadline from settings (fallback to defaults if not configured)
        const slaHours = getSlaHoursByPriority(priority)
        const slaDeadline = new Date()
        slaDeadline.setHours(slaDeadline.getHours() + slaHours)

        db.prepare(`
          INSERT INTO tickets (
            ticket_number, inverter_id, customer_id, title, description,
            priority, status, category, created_by, sla_deadline
          )
          VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)
        `).run(
          ticketNumber,
          inverterId || null,
          customerId,
          ticketData.title,
          ticketData.description || null,
          priority,
          ticketData.category || null,
          user.id,
          slaDeadline.toISOString()
        )

        successCount++
      } catch (error: any) {
        errors.push(`Dòng ${rowNumber}: ${error.message || 'Lỗi không xác định'}`)
      }
    }

    res.json({
      success: successCount,
      errors,
    })
  } catch (error) {
    console.error('Import tickets error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete ticket
router.delete('/:id', authenticateToken, requireRole(UserRole.DEV), (req, res) => {
  try {
    const ticketId = parseInt(req.params.id)

    const ticket = db.prepare('SELECT id, assigned_to FROM tickets WHERE id = ?').get(ticketId) as any
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    const assignedTo = ticket.assigned_to
    db.prepare('DELETE FROM tickets WHERE id = ?').run(ticketId)

    // Sync ticket counts for affected user
    if (assignedTo) {
      syncTicketRelatedCounts(undefined, assignedTo, undefined)
    }

    res.status(204).send()
  } catch (error) {
    console.error('Delete ticket error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get attachment file (public access for images)
router.get('/:ticketId/attachments/:attachmentId', (req, res) => {
  try {
    const ticketId = parseInt(req.params.ticketId)
    const attachmentId = parseInt(req.params.attachmentId)

    // Get attachment from database
    const attachment = db.prepare(`
      SELECT ta.*, t.id as ticket_id
      FROM ticket_attachments ta
      JOIN tickets t ON ta.ticket_id = t.id
      WHERE ta.id = ? AND ta.ticket_id = ?
    `).get(attachmentId, ticketId) as any

    if (!attachment) {
      return res.status(404).json({ error: 'Attachment not found' })
    }

    const filePath = attachment.file_path || ''
    const mimeType = attachment.mime_type || 'application/octet-stream'

    // Set CORS headers to allow image loading
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    res.setHeader('Cache-Control', 'public, max-age=31536000')
    res.setHeader('Access-Control-Expose-Headers', 'Content-Type, Content-Length')

    // If file_path is base64 data URI, extract and serve it
    if (filePath && filePath.toString().startsWith('data:')) {
      const base64Match = filePath.toString().match(/^data:([^;]+);base64,(.+)$/)
      if (base64Match) {
        const detectedMimeType = base64Match[1]
        const base64Data = base64Match[2]
        const buffer = Buffer.from(base64Data, 'base64')
        
        res.setHeader('Content-Type', detectedMimeType)
        res.setHeader('Content-Disposition', `inline; filename="${attachment.filename || 'attachment'}"`)
        res.setHeader('Content-Length', buffer.length.toString())
        return res.send(buffer)
      }
    }

    // If file_path is a base64 string without data: prefix
    if (filePath && filePath.toString().length > 100 && !filePath.toString().includes('/') && !filePath.toString().includes('\\')) {
      // Likely base64 string
      let finalMimeType = mimeType
      if (!finalMimeType.startsWith('image/')) {
        // Try to determine from filename
        const filename = (attachment.filename || '').toLowerCase()
        if (filename.endsWith('.png')) finalMimeType = 'image/png'
        else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) finalMimeType = 'image/jpeg'
        else if (filename.endsWith('.gif')) finalMimeType = 'image/gif'
        else if (filename.endsWith('.webp')) finalMimeType = 'image/webp'
        else finalMimeType = 'image/jpeg'
      }
      
      try {
        const buffer = Buffer.from(filePath.toString(), 'base64')
        
        res.setHeader('Content-Type', finalMimeType)
        res.setHeader('Content-Disposition', `inline; filename="${attachment.filename || 'attachment'}"`)
        res.setHeader('Content-Length', buffer.length.toString())
        return res.send(buffer)
      } catch (err) {
        console.error('Error decoding base64:', err)
        return res.status(500).json({ error: 'Invalid attachment data' })
      }
    }

    // Serve from disk when stored as relative path
    const absolutePath = resolveAttachmentAbsolutePath(String(filePath))
    if (absolutePath && fs.existsSync(absolutePath)) {
      res.setHeader('Content-Type', mimeType)
      res.setHeader('Content-Disposition', `inline; filename="${attachment.filename || 'attachment'}"`)
      return res.sendFile(absolutePath)
    }

    return res.status(404).json({ error: 'Attachment file not found or invalid format' })
  } catch (error) {
    console.error('Get attachment error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Generate HTML report for closed ticket (must be before /:id/attachments to avoid route conflict)
router.post('/:id/generate-report', authenticateToken, (req: AuthRequest, res) => {
  try {
    const ticketId = parseInt(req.params.id)
    const ticket = db.prepare(`
      SELECT t.*,
             i.serial_number as inverter_serial,
             i.model as inverter_model,
             i.warranty_end_date as inverter_warranty_end_date,
             c.name as customer_name,
             c.email as customer_email,
             c.phone as customer_phone,
             c.address as customer_address,
             u.name as technician_name,
             u.email as technician_email,
             u.phone as technician_phone,
             u.role as technician_role
      FROM tickets t
      LEFT JOIN inverters i ON t.inverter_id = i.id
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN users u ON t.assigned_to = u.id
      WHERE t.id = ?
    `).get(ticketId) as any

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    const {
      service_date,
      completion_date,
      diagnosis,
      actions_taken,
      replacement_parts,
      before_images,
      after_images,
      customer_signature,
      technician_signature,
    } = req.body

    // Parse images
    let beforeImagesArray: string[] = []
    let afterImagesArray: string[] = []
    
    if (before_images) {
      try {
        beforeImagesArray = typeof before_images === 'string' ? JSON.parse(before_images) : before_images
      } catch (e) {
        console.warn('Error parsing before_images:', e)
      }
    }
    
    if (after_images) {
      try {
        afterImagesArray = typeof after_images === 'string' ? JSON.parse(after_images) : after_images
      } catch (e) {
        console.warn('Error parsing after_images:', e)
      }
    }

    // Copy logo to reports directory for direct use (no base64 conversion)
    let logoUrl = ''
    try {
      // Calculate path from reportsDir (server/reports) to project root/public/images/logo/
      // reportsDir is at server/reports/, so go up one level to server/, then up to root
      const projectRoot = path.join(reportsDir, '../..')
      
      // Try new logo first, then fallback to old logo
      let logoSourcePath = path.join(projectRoot, 'public/images/logo/SSE-logo.png')
      if (!fs.existsSync(logoSourcePath)) {
        logoSourcePath = path.join(projectRoot, 'public/images/logo/SSElogo.png')
      }
      if (!fs.existsSync(logoSourcePath)) {
        logoSourcePath = path.join(projectRoot, 'public/images/logo/logo.png')
      }
      if (fs.existsSync(logoSourcePath)) {
        // Copy logo to reports directory
        const logoFileName = 'SSE-logo.png'
        const logoDestPath = path.join(reportsDir, logoFileName)
        fs.copyFileSync(logoSourcePath, logoDestPath)
        // Use full URL path for logo in HTML
        logoUrl = '/api/tickets/reports/SSE-logo.png'
        console.log('Logo copied successfully from', logoSourcePath, 'to', logoDestPath)
      } else {
        console.warn('Logo file not found. Tried:', logoSourcePath)
      }
    } catch (e) {
      console.error('Could not copy logo:', e)
    }

    // Generate HTML report using template
    const html = generateReportHTML({
      ticket,
      ticketId,
      service_date,
      completion_date,
      diagnosis,
      actions_taken,
      replacement_parts,
      beforeImagesArray,
      afterImagesArray,
      customer_signature,
      technician_signature,
      logoUrl
    })

    const { reportId, filename, url } = saveTicketReportHtml(ticketId, html)

    db.prepare('UPDATE tickets SET report_html_file = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      filename,
      ticketId,
    )

    res.json({
      reportId,
      url,
      message: 'Report generated successfully'
    })
  } catch (error) {
    console.error('Generate report error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Upload attachment to ticket
router.post('/:id/attachments', authenticateToken, async (req, res) => {
  try {
    const ticketId = parseInt(req.params.id)
    const user = (req as AuthRequest).user!

    // Check if ticket exists
    const ticket = db.prepare('SELECT id FROM tickets WHERE id = ?').get(ticketId) as any
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' })
    }

    // Get file from request body (expecting base64 encoded file)
    const { file, filename, mime_type, file_size, comment_id } = req.body

    if (!file || !filename) {
      return res.status(400).json({ error: 'File data and filename are required' })
    }

    // Validate file size (max 10MB base64)
    if (typeof file === 'string' && file.length > 15 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB' })
    }

    let buffer: Buffer
    let storedMime: string
    try {
      const decoded = decodeUploadPayload(file, mime_type)
      buffer = decoded.buffer
      storedMime = decoded.mimeType
    } catch {
      return res.status(400).json({ error: 'Invalid file data' })
    }

    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB' })
    }

    const { relativePath, size } = saveAttachmentToDisk(ticketId, filename, buffer)

    const linkedCommentId = comment_id ? Number(comment_id) : null

    // Insert attachment into database (with optional comment_id link)
    const result = db.prepare(`
      INSERT INTO ticket_attachments (ticket_id, filename, file_path, file_size, mime_type, uploaded_by, comment_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      ticketId,
      filename,
      relativePath,
      size,
      storedMime,
      user.id,
      linkedCommentId
    )

    const attachment = db.prepare(`
      SELECT ta.*, u.name as uploaded_by_name
      FROM ticket_attachments ta
      LEFT JOIN users u ON ta.uploaded_by = u.id
      WHERE ta.id = ?
    `).get(result.lastInsertRowid) as Record<string, unknown>

    // Update ticket updated_at
    db.prepare('UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(ticketId)

    res.status(201).json(sanitizeAttachmentRow(attachment, ticketId))
  } catch (error: any) {
    console.error('Upload attachment error:', error)
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      body: req.body ? { filename: req.body.filename, fileLength: req.body.file?.length } : 'no body'
    })
    res.status(500).json({ error: error?.message || 'Internal server error' })
  }
})

// Serve logo file from reports directory
router.get('/reports/SSE-logo.png', (req, res) => {
  try {
    const reportsDir = path.join(__dirname, '../../reports')
    const logoPath = path.join(reportsDir, 'SSE-logo.png')
    
    if (!fs.existsSync(logoPath)) {
      return res.status(404).send('Logo not found')
    }
    
    const logoBuffer = fs.readFileSync(logoPath)
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=86400') // Cache for 1 day
    res.send(logoBuffer)
  } catch (error) {
    console.error('Serve logo error:', error)
    res.status(500).send('Error loading logo')
  }
})

// Serve HTML report file (public access - no auth required for viewing generated reports)
router.get('/reports/:fileName', (req, res) => {
  try {
    const fileName = req.params.fileName
    
    // Validate filename to prevent path traversal
    if (!fileName.match(/^REPORT-[\w-]+\.html$/)) {
      return res.status(400).send('<h1>Invalid file name</h1>')
    }
    
    const reportsDir = path.join(__dirname, '../../reports')
    const filePath = path.join(reportsDir, fileName)
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('<h1>Report not found</h1><p>The requested report file does not exist.</p>')
    }
    
    // Read and send HTML file
    const htmlContent = fs.readFileSync(filePath, 'utf8')
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'private, max-age=3600') // Cache for 1 hour
    res.send(htmlContent)
  } catch (error) {
    console.error('Serve report error:', error)
    res.status(500).send('<h1>Server Error</h1><p>An error occurred while loading the report.</p>')
  }
})

export default router
