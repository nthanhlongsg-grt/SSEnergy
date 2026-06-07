import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { UserRole } from '../types/index.js'

const router = Router()

// Get comprehensive reports data
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const user = req.user!
    const { from, to, reportType = 'monthly' } = req.query

    // Parse date range
    let dateFrom: string | null = null
    let dateTo: string | null = null

    if (from && to) {
      dateFrom = from as string
      dateTo = to as string
    } else {
      // Default to current month
      const now = new Date()
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      dateTo = now.toISOString().split('T')[0]
    }

    // Build base WHERE clause for date filtering
    const dateFilter = `AND t.created_at >= ? AND t.created_at <= ?`
    const dateParams = [`${dateFrom} 00:00:00`, `${dateTo} 23:59:59`]

    // Build user role filter
    let userFilter = ''
    const userParams: any[] = []

    if (user.role === UserRole.TECHNICIAN) {
      userFilter = 'AND (t.assigned_to = ? OR t.created_by = ?)'
      userParams.push(user.id, user.id)
    } else if (user.role === UserRole.END_USER) {
      userFilter = 'AND t.created_by = ?'
      userParams.push(user.id)
    } else if (user.role === UserRole.DISTRIBUTOR) {
      const linkedEndUsers = db.prepare(`
        SELECT id FROM users 
        WHERE parent_distributor_id = ? AND role = ?
      `).all(user.id, UserRole.END_USER) as Array<{ id: number }>
      
      if (linkedEndUsers.length > 0) {
        const endUserIds = linkedEndUsers.map(u => u.id)
        userFilter = `AND t.created_by IN (${endUserIds.map(() => '?').join(',')})`
        userParams.push(...endUserIds)
      } else {
        userFilter = 'AND 1=0'
      }
    }

    // 1. Summary Statistics
    const totalTicketsQuery = `
      SELECT COUNT(*) as count 
      FROM tickets t 
      WHERE 1=1 ${dateFilter} ${userFilter}
    `
    const totalTickets = db.prepare(totalTicketsQuery).get(...dateParams, ...userParams) as { count: number }

    // Previous period for growth calculation (same duration as current period)
    const periodDuration = new Date(dateTo).getTime() - new Date(dateFrom).getTime()
    const prevDateTo = new Date(new Date(dateFrom).getTime() - 1)
    const prevDateFrom = new Date(prevDateTo.getTime() - periodDuration)
    const prevTotalTickets = db.prepare(`
      SELECT COUNT(*) as count 
      FROM tickets t 
      WHERE 1=1 AND t.created_at >= ? AND t.created_at <= ? ${userFilter}
    `).get(
      `${prevDateFrom.toISOString().split('T')[0]} 00:00:00`,
      `${prevDateTo.toISOString().split('T')[0]} 23:59:59`,
      ...userParams
    ) as { count: number }

    const ticketGrowth = prevTotalTickets.count > 0
      ? ((totalTickets.count - prevTotalTickets.count) / prevTotalTickets.count * 100).toFixed(1)
      : '0.0'

    // Average processing time (hours)
    const avgProcessingTimeQuery = `
      SELECT AVG(
        CASE 
          WHEN t.resolved_at IS NOT NULL THEN
            (julianday(t.resolved_at) - julianday(t.created_at)) * 24
          WHEN t.closed_at IS NOT NULL THEN
            (julianday(t.closed_at) - julianday(t.created_at)) * 24
          ELSE NULL
        END
      ) as avg_hours
      FROM tickets t
      WHERE 1=1 ${dateFilter} ${userFilter}
        AND (t.resolved_at IS NOT NULL OR t.closed_at IS NOT NULL)
    `
    const avgProcessingTime = db.prepare(avgProcessingTimeQuery).get(...dateParams, ...userParams) as { avg_hours: number | null }
    const avgProcessingTimeHours = avgProcessingTime.avg_hours ? parseFloat(avgProcessingTime.avg_hours.toFixed(1)) : 0

    // Total parts cost from service reports
    const partsCostQuery = `
      SELECT 
        COALESCE(SUM(sr.parts_cost), 0) as total_cost,
        COUNT(DISTINCT sr.id) as reports_count
      FROM service_reports sr
      INNER JOIN tickets t ON sr.ticket_id = t.id
      WHERE 1=1 ${dateFilter} ${userFilter}
    `
    const partsCost = db.prepare(partsCostQuery).get(...dateParams, ...userParams) as { total_cost: number; reports_count: number }

    // Count of parts replaced (from service_report_parts)
    const partsReplacedQuery = `
      SELECT COUNT(*) as count
      FROM service_report_parts srp
      INNER JOIN service_reports sr ON srp.service_report_id = sr.id
      INNER JOIN tickets t ON sr.ticket_id = t.id
      WHERE 1=1 ${dateFilter} ${userFilter}
    `
    const partsReplaced = db.prepare(partsReplacedQuery).get(...dateParams, ...userParams) as { count: number }

    // DOA rate (tickets created within 7 days of installation)
    const doaQuery = `
      SELECT COUNT(*) as count
      FROM tickets t
      INNER JOIN inverters i ON t.inverter_id = i.id
      WHERE 1=1 ${dateFilter} ${userFilter}
        AND i.installation_date IS NOT NULL
        AND julianday(t.created_at) - julianday(i.installation_date) <= 7
    `
    const doaCount = db.prepare(doaQuery).get(...dateParams, ...userParams) as { count: number }
    const doaRate = totalTickets.count > 0 ? ((doaCount.count / totalTickets.count) * 100).toFixed(1) : '0.0'

    // 2. Tickets by Status
    const ticketsByStatusQuery = `
      SELECT status, COUNT(*) as count
      FROM tickets t
      WHERE 1=1 ${dateFilter} ${userFilter}
      GROUP BY status
    `
    const ticketsByStatus = db.prepare(ticketsByStatusQuery).all(...dateParams, ...userParams) as Array<{ status: string; count: number }>

    // 3. Tickets by Priority
    const ticketsByPriorityQuery = `
      SELECT priority, COUNT(*) as count
      FROM tickets t
      WHERE 1=1 ${dateFilter} ${userFilter}
      GROUP BY priority
    `
    const ticketsByPriority = db.prepare(ticketsByPriorityQuery).all(...dateParams, ...userParams) as Array<{ priority: string; count: number }>

    // 4. Tickets by Category (chi tiết)
    const ticketsByCategoryQuery = `
      SELECT 
        COALESCE(category, 'N/A') as category,
        COUNT(*) as count,
        COUNT(CASE WHEN status IN ('completed', 'closed') THEN 1 END) as completed_count,
        COUNT(CASE WHEN status IN ('in_progress', 'assigned', 'waiting_parts') THEN 1 END) as active_count,
        COUNT(CASE WHEN status = 'new' THEN 1 END) as new_count
      FROM tickets t
      WHERE 1=1 ${dateFilter} ${userFilter}
      GROUP BY category
      ORDER BY count DESC
    `
    const ticketsByCategory = db.prepare(ticketsByCategoryQuery).all(...dateParams, ...userParams) as Array<{ 
      category: string
      count: number
      completed_count: number
      active_count: number
      new_count: number
    }>
    
    // Thống kê chi tiết theo từng loại công việc
    const workStats = {
      warranty: ticketsByCategory.find(c => c.category === 'warranty')?.count || 0,
      repair: ticketsByCategory.find(c => c.category === 'repair')?.count || 0,
      technical_support: ticketsByCategory.find(c => c.category === 'technical_support' || c.category === 'consultation')?.count || 0,
      other: ticketsByCategory.find(c => !['warranty', 'repair', 'technical_support', 'consultation'].includes(c.category))?.count || 0
    }

    // 5. Top Issues by Model
    const topIssuesQuery = `
      SELECT 
        i.model,
        t.category as error_type,
        COUNT(t.id) as count
      FROM tickets t
      LEFT JOIN inverters i ON t.inverter_id = i.id
      WHERE 1=1 ${dateFilter} ${userFilter}
        AND i.model IS NOT NULL
      GROUP BY i.model, t.category
      ORDER BY count DESC
      LIMIT 10
    `
    const topIssues = db.prepare(topIssuesQuery).all(...dateParams, ...userParams) as Array<{ model: string; error_type: string | null; count: number }>

    // Calculate percentages for top issues
    const topIssuesWithPercentage = topIssues.map(issue => ({
      ...issue,
      percentage: totalTickets.count > 0 ? ((issue.count / totalTickets.count) * 100).toFixed(1) : '0.0',
    }))

    // 6. Tickets by Province (from customer address or installation address)
    const ticketsByProvinceQuery = `
      SELECT 
        COALESCE(
          CASE 
            WHEN c.address LIKE '%TP. Hồ Chí Minh%' OR c.address LIKE '%Hồ Chí Minh%' OR c.address LIKE '%TP.HCM%' THEN 'TP. Hồ Chí Minh'
            WHEN c.address LIKE '%Hà Nội%' THEN 'Hà Nội'
            WHEN c.address LIKE '%Đà Nẵng%' THEN 'Đà Nẵng'
            WHEN c.address LIKE '%Cần Thơ%' THEN 'Cần Thơ'
            WHEN c.address LIKE '%Hải Phòng%' THEN 'Hải Phòng'
            WHEN c.address IS NOT NULL AND c.address != '' THEN 
              SUBSTR(c.address, 1, INSTR(c.address || ',', ',') - 1)
            WHEN i.installation_address IS NOT NULL AND i.installation_address != '' THEN
              SUBSTR(i.installation_address, 1, INSTR(i.installation_address || ',', ',') - 1)
            ELSE 'Khác'
          END,
          'Khác'
        ) as province,
        COUNT(*) as count,
        MAX(t.category) as top_error
      FROM tickets t
      LEFT JOIN customers c ON t.customer_id = c.id
      LEFT JOIN inverters i ON t.inverter_id = i.id
      WHERE 1=1 ${dateFilter} ${userFilter}
      GROUP BY province
      ORDER BY count DESC
    `
    const ticketsByProvince = db.prepare(ticketsByProvinceQuery).all(...dateParams, ...userParams) as Array<{ province: string; count: number; top_error: string | null }>

    // Calculate percentages for provinces
    const ticketsByProvinceWithPercentage = ticketsByProvince.map(item => ({
      ...item,
      percentage: totalTickets.count > 0 ? ((item.count / totalTickets.count) * 100).toFixed(1) : '0.0',
    }))

    // 7. Tickets by Technician/Admin (workload) - với phân quyền
    let ticketsByUserQuery = ''
    let ticketsByUserParams: any[] = []
    
    if (user.role === UserRole.TECHNICIAN) {
      // Technician chỉ xem của họ
      ticketsByUserQuery = `
        SELECT 
          u.id as user_id,
          u.name as user_name,
          u.role,
          COUNT(t.id) as ticket_count,
          COUNT(CASE WHEN t.status IN ('in_progress', 'assigned', 'waiting_parts') THEN 1 END) as active_count,
          COUNT(CASE WHEN t.status IN ('completed', 'closed') THEN 1 END) as completed_count,
          COUNT(CASE WHEN t.category = 'warranty' THEN 1 END) as warranty_count,
          COUNT(CASE WHEN t.category = 'repair' THEN 1 END) as repair_count,
          COUNT(CASE WHEN t.category IN ('technical_support', 'consultation') THEN 1 END) as technical_support_count
        FROM tickets t
        INNER JOIN users u ON (t.assigned_to = u.id OR t.created_by = u.id)
        WHERE 1=1 ${dateFilter} AND (t.assigned_to = ? OR t.created_by = ?)
        GROUP BY u.id, u.name, u.role
        ORDER BY ticket_count DESC
      `
      ticketsByUserParams = [...dateParams, user.id, user.id]
    } else if (user.role === UserRole.ADMIN || user.role === UserRole.DEV) {
      // Admin xem tất cả admin và technician
      ticketsByUserQuery = `
        SELECT 
          u.id as user_id,
          u.name as user_name,
          u.role,
          COUNT(t.id) as ticket_count,
          COUNT(CASE WHEN t.status IN ('in_progress', 'assigned', 'waiting_parts') THEN 1 END) as active_count,
          COUNT(CASE WHEN t.status IN ('completed', 'closed') THEN 1 END) as completed_count,
          COUNT(CASE WHEN t.category = 'warranty' THEN 1 END) as warranty_count,
          COUNT(CASE WHEN t.category = 'repair' THEN 1 END) as repair_count,
          COUNT(CASE WHEN t.category IN ('technical_support', 'consultation') THEN 1 END) as technical_support_count
        FROM tickets t
        INNER JOIN users u ON (t.assigned_to = u.id OR t.created_by = u.id)
        WHERE 1=1 ${dateFilter} 
          AND u.role IN ('admin', 'dev', 'technician')
        GROUP BY u.id, u.name, u.role
        ORDER BY ticket_count DESC
      `
      ticketsByUserParams = dateParams
    } else {
      // Các role khác: không hiển thị
      ticketsByUserQuery = `
        SELECT 
          u.id as user_id,
          u.name as user_name,
          u.role,
          COUNT(t.id) as ticket_count,
          COUNT(CASE WHEN t.status IN ('in_progress', 'assigned', 'waiting_parts') THEN 1 END) as active_count,
          COUNT(CASE WHEN t.status IN ('completed', 'closed') THEN 1 END) as completed_count,
          COUNT(CASE WHEN t.category = 'warranty' THEN 1 END) as warranty_count,
          COUNT(CASE WHEN t.category = 'repair' THEN 1 END) as repair_count,
          COUNT(CASE WHEN t.category IN ('technical_support', 'consultation') THEN 1 END) as technical_support_count
        FROM tickets t
        INNER JOIN users u ON (t.assigned_to = u.id OR t.created_by = u.id)
        WHERE 1=1 ${dateFilter} ${userFilter}
        GROUP BY u.id, u.name, u.role
        ORDER BY ticket_count DESC
      `
      ticketsByUserParams = [...dateParams, ...userParams]
    }
    
    const ticketsByUser = db.prepare(ticketsByUserQuery).all(...ticketsByUserParams) as Array<{
      user_id: number
      user_name: string
      role: string
      ticket_count: number
      active_count: number
      completed_count: number
      warranty_count: number
      repair_count: number
      technical_support_count: number
    }>
    
    // Thống kê công việc (tasks/schedules) theo user
    const taskDateFilter = `AND ts.schedule_date >= ? AND ts.schedule_date <= ?`
    let tasksByUserQuery = ''
    let tasksByUserParams: any[] = []
    
    if (user.role === UserRole.TECHNICIAN) {
      // Technician chỉ xem của họ
      tasksByUserQuery = `
        SELECT 
          u.id as user_id,
          u.name as user_name,
          u.role,
          COUNT(ts.id) as total_tasks,
          COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN ts.status = 'scheduled' THEN 1 END) as scheduled_tasks,
          COUNT(CASE WHEN ts.status = 'onsite' THEN 1 END) as onsite_tasks,
          COUNT(CASE WHEN ts.status = 'cancelled' THEN 1 END) as cancelled_tasks
        FROM technician_schedules ts
        INNER JOIN users u ON ts.technician_id = u.id
        WHERE 1=1 ${taskDateFilter} AND ts.technician_id = ?
        GROUP BY u.id, u.name, u.role
        ORDER BY total_tasks DESC
      `
      tasksByUserParams = [dateFrom, dateTo, user.id]
    } else if (user.role === UserRole.ADMIN || user.role === UserRole.DEV) {
      // Admin xem tất cả admin và technician
      tasksByUserQuery = `
        SELECT 
          u.id as user_id,
          u.name as user_name,
          u.role,
          COUNT(ts.id) as total_tasks,
          COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN ts.status = 'scheduled' THEN 1 END) as scheduled_tasks,
          COUNT(CASE WHEN ts.status = 'onsite' THEN 1 END) as onsite_tasks,
          COUNT(CASE WHEN ts.status = 'cancelled' THEN 1 END) as cancelled_tasks
        FROM technician_schedules ts
        INNER JOIN users u ON ts.technician_id = u.id
        WHERE 1=1 ${taskDateFilter} 
          AND u.role IN ('admin', 'technician')
        GROUP BY u.id, u.name, u.role
        ORDER BY total_tasks DESC
      `
      tasksByUserParams = [dateFrom, dateTo]
    } else {
      tasksByUserQuery = `
        SELECT 
          u.id as user_id,
          u.name as user_name,
          u.role,
          COUNT(ts.id) as total_tasks,
          COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN ts.status = 'scheduled' THEN 1 END) as scheduled_tasks,
          COUNT(CASE WHEN ts.status = 'onsite' THEN 1 END) as onsite_tasks,
          COUNT(CASE WHEN ts.status = 'cancelled' THEN 1 END) as cancelled_tasks
        FROM technician_schedules ts
        INNER JOIN users u ON ts.technician_id = u.id
        WHERE 1=1 ${taskDateFilter}
        GROUP BY u.id, u.name, u.role
        ORDER BY total_tasks DESC
      `
      tasksByUserParams = [dateFrom, dateTo]
    }
    
    const tasksByUser = db.prepare(tasksByUserQuery).all(...tasksByUserParams) as Array<{
      user_id: number
      user_name: string
      role: string
      total_tasks: number
      completed_tasks: number
      scheduled_tasks: number
      onsite_tasks: number
      cancelled_tasks: number
    }>

    // 8. Tickets by Day/Month (time series)
    const timeSeriesQuery = `
      SELECT 
        DATE(t.created_at) as date,
        COUNT(*) as count
      FROM tickets t
      WHERE 1=1 ${dateFilter} ${userFilter}
      GROUP BY DATE(t.created_at)
      ORDER BY date ASC
    `
    const ticketsTimeSeries = db.prepare(timeSeriesQuery).all(...dateParams, ...userParams) as Array<{ date: string; count: number }>

    // 9. Service Reports Statistics
    const serviceReportsQuery = `
      SELECT 
        COUNT(*) as total_reports,
        COUNT(CASE WHEN sr.status = 'completed' THEN 1 END) as completed_reports,
        SUM(sr.total_cost) as total_cost,
        AVG(
          CASE 
            WHEN sr.service_start_time IS NOT NULL AND sr.service_end_time IS NOT NULL THEN
              (julianday(sr.service_date || ' ' || sr.service_end_time) - julianday(sr.service_date || ' ' || sr.service_start_time)) * 24
            ELSE NULL
          END
        ) as avg_service_hours
      FROM service_reports sr
      INNER JOIN tickets t ON sr.ticket_id = t.id
      WHERE 1=1 ${dateFilter} ${userFilter}
    `
    const serviceReportsStats = db.prepare(serviceReportsQuery).get(...dateParams, ...userParams) as {
      total_reports: number
      completed_reports: number
      total_cost: number | null
      avg_service_hours: number | null
    }

    // 10. Tasks/Schedules Statistics
    const tasksQuery = `
      SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN ts.status = 'completed' THEN 1 END) as completed_tasks,
        COUNT(CASE WHEN ts.status = 'scheduled' THEN 1 END) as scheduled_tasks,
        COUNT(CASE WHEN ts.status = 'onsite' THEN 1 END) as onsite_tasks
      FROM technician_schedules ts
      INNER JOIN tickets t ON ts.ticket_id = t.id
      WHERE 1=1 ${dateFilter} ${userFilter}
    `
    const tasksStats = db.prepare(tasksQuery).get(...dateParams, ...userParams) as {
      total_tasks: number
      completed_tasks: number
      scheduled_tasks: number
      onsite_tasks: number
    }

    res.json({
      summary: {
        totalTickets: totalTickets.count,
        ticketGrowth: parseFloat(ticketGrowth),
        doaRate: parseFloat(doaRate),
        doaCount: doaCount.count,
        avgProcessingTime: avgProcessingTimeHours,
        totalPartsCost: partsCost.total_cost || 0,
        partsReplaced: partsReplaced.count,
        totalServiceReports: serviceReportsStats.total_reports,
        completedServiceReports: serviceReportsStats.completed_reports,
        totalTasks: tasksStats.total_tasks,
        completedTasks: tasksStats.completed_tasks,
      },
      ticketsByStatus,
      ticketsByPriority,
      ticketsByCategory,
      topIssues: topIssuesWithPercentage,
      errorsByProvince: ticketsByProvinceWithPercentage,
      ticketsByUser,
      tasksByUser,
      workStats,
      ticketsTimeSeries,
      serviceReports: {
        total: serviceReportsStats.total_reports,
        completed: serviceReportsStats.completed_reports,
        totalCost: serviceReportsStats.total_cost || 0,
        avgServiceHours: serviceReportsStats.avg_service_hours ? parseFloat(serviceReportsStats.avg_service_hours.toFixed(1)) : 0,
      },
      tasks: {
        total: tasksStats.total_tasks,
        completed: tasksStats.completed_tasks,
        scheduled: tasksStats.scheduled_tasks,
        onsite: tasksStats.onsite_tasks,
      },
    })
  } catch (error) {
    console.error('Get reports error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const UNPAID_PAYMENT_SQL = `(
  c.paperwork IS NULL
  OR TRIM(c.paperwork) = ''
  OR TRIM(c.paperwork) = '{}'
  OR NULLIF(TRIM(json_extract(c.paperwork, '$.payment_received_date')), '') IS NULL
)`

const ACTIVE_UNPAID_SQL = `c.status = 'active' AND ${UNPAID_PAYMENT_SQL}`

const DEVICE_NOT_DELIVERED_SQL = `(
  c.paperwork IS NULL
  OR TRIM(c.paperwork) = ''
  OR TRIM(c.paperwork) = '{}'
  OR NULLIF(TRIM(json_extract(c.paperwork, '$.device_delivery_date')), '') IS NULL
)`

const ACTIVE_UNDELIVERED_SQL = `c.status = 'active' AND ${DEVICE_NOT_DELIVERED_SQL}`

const vietnamDateString = (date = new Date()): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)

const vietnamMonthRange = (): { from: string; to: string } => {
  const now = new Date()
  const to = vietnamDateString(now)
  const parts = to.split('-')
  return { from: `${parts[0]}-${parts[1]}-01`, to }
}

const isStaffRole = (role: UserRole): boolean =>
  role !== UserRole.END_USER && role !== UserRole.DISTRIBUTOR

// GET /api/reports/contracts — contract summary for reports page
router.get('/contracts', authenticateToken, (req: AuthRequest, res) => {
  try {
    const user = req.user!
    if (!isStaffRole(user.role)) {
      return res.status(403).json({ error: 'Không có quyền xem báo cáo hợp đồng' })
    }

    const { from, to } = req.query
    let dateFrom: string
    let dateTo: string

    if (from && to) {
      dateFrom = from as string
      dateTo = to as string
    } else {
      const range = vietnamMonthRange()
      dateFrom = range.from
      dateTo = range.to
    }

    const signedFilter = `
      c.signed_date IS NOT NULL
      AND DATE(c.signed_date) >= DATE(?)
      AND DATE(c.signed_date) <= DATE(?)
      AND c.status != 'cancelled'
    `

    const summary = db.prepare(`
      SELECT
        COUNT(*) as signed_count,
        COALESCE(SUM(CASE WHEN NOT ${UNPAID_PAYMENT_SQL} THEN c.value ELSE 0 END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN ${UNPAID_PAYMENT_SQL} THEN c.value ELSE 0 END), 0) as total_debt
      FROM contracts c
      WHERE ${signedFilter}
    `).get(dateFrom, dateTo) as {
      signed_count: number
      total_revenue: number
      total_debt: number
    }

    const devices = db.prepare(`
      SELECT COUNT(DISTINCT ci.inverter_id) as repair_devices
      FROM contract_inverters ci
      JOIN contracts c ON c.id = ci.contract_id
      WHERE ${signedFilter}
    `).get(dateFrom, dateTo) as { repair_devices: number }

    const allUnpaid = db.prepare(`
      SELECT
        COUNT(*) as unpaid_count,
        COALESCE(SUM(c.value), 0) as total_unpaid_debt
      FROM contracts c
      WHERE ${ACTIVE_UNPAID_SQL}
    `).get() as { unpaid_count: number; total_unpaid_debt: number }

    const draftStats = db.prepare(`
      SELECT COUNT(*) as draft_count FROM contracts WHERE status = 'draft'
    `).get() as { draft_count: number }

    const undeliveredContracts = db.prepare(`
      SELECT COUNT(*) as undelivered_contract_count
      FROM contracts c
      WHERE ${ACTIVE_UNDELIVERED_SQL}
    `).get() as { undelivered_contract_count: number }

    const undeliveredDevices = db.prepare(`
      SELECT COUNT(DISTINCT ci.inverter_id) as undelivered_device_count
      FROM contract_inverters ci
      JOIN contracts c ON c.id = ci.contract_id
      WHERE ${ACTIVE_UNDELIVERED_SQL}
    `).get() as { undelivered_device_count: number }

    const contractRows = db.prepare(`
      SELECT
        c.id,
        c.contract_number,
        cu.name AS customer_name,
        c.value,
        c.signed_date,
        c.status,
        (SELECT COUNT(*) FROM contract_inverters ci WHERE ci.contract_id = c.id) AS device_count,
        CASE WHEN ${UNPAID_PAYMENT_SQL} THEN 1 ELSE 0 END AS is_unpaid
      FROM contracts c
      LEFT JOIN customers cu ON cu.id = c.customer_id
      WHERE ${signedFilter}
      ORDER BY DATE(c.signed_date) DESC, c.id DESC
      LIMIT 200
    `).all(dateFrom, dateTo) as Array<{
      id: number
      contract_number: string
      customer_name: string | null
      value: number
      signed_date: string | null
      status: string
      device_count: number
      is_unpaid: number
    }>

    res.json({
      signed_count: summary.signed_count,
      total_revenue: summary.total_revenue,
      total_debt: summary.total_debt,
      total_unpaid_debt: allUnpaid.total_unpaid_debt,
      unpaid_count: allUnpaid.unpaid_count,
      draft_count: draftStats.draft_count,
      undelivered_contract_count: undeliveredContracts.undelivered_contract_count,
      undelivered_device_count: undeliveredDevices.undelivered_device_count,
      repair_devices: devices.repair_devices,
      contracts: contractRows.map((row) => ({
        id: row.id,
        contract_number: row.contract_number,
        customer_name: row.customer_name,
        value: row.value,
        signed_date: row.signed_date,
        status: row.status,
        device_count: row.device_count,
        is_unpaid: row.is_unpaid === 1,
      })),
      from: dateFrom,
      to: dateTo,
    })
  } catch (error) {
    console.error('Get contract reports error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

