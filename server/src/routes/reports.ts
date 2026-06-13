import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { UserRole, isStaffAdminRole } from '../types/index.js'
import { canViewContractFinance } from '../utils/contractFinance.js'

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
    } else if (isStaffAdminRole(user.role)) {
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
    } else if (isStaffAdminRole(user.role)) {
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

/** Ngày nhận thanh toán — ghi nhận doanh thu */
const PAYMENT_RECEIVED_DATE_SQL = `NULLIF(TRIM(json_extract(c.paperwork, '$.payment_received_date')), '')`

const revenuePeriodFilter = `
  ${PAYMENT_RECEIVED_DATE_SQL} IS NOT NULL
  AND DATE(${PAYMENT_RECEIVED_DATE_SQL}) >= DATE(?)
  AND DATE(${PAYMENT_RECEIVED_DATE_SQL}) <= DATE(?)
  AND c.status != 'cancelled'
`

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
        COALESCE(SUM(CASE WHEN ${UNPAID_PAYMENT_SQL} THEN c.value ELSE 0 END), 0) as total_debt
      FROM contracts c
      WHERE ${signedFilter}
    `).get(dateFrom, dateTo) as {
      signed_count: number
      total_debt: number
    }

    const revenueRow = db.prepare(`
      SELECT COALESCE(SUM(c.value), 0) as total_revenue
      FROM contracts c
      WHERE ${revenuePeriodFilter}
    `).get(dateFrom, dateTo) as { total_revenue: number }

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

    const showFinance = canViewContractFinance(user.role)

    res.json({
      signed_count: summary.signed_count,
      total_revenue: showFinance ? revenueRow.total_revenue : 0,
      total_debt: showFinance ? summary.total_debt : 0,
      total_unpaid_debt: showFinance ? allUnpaid.total_unpaid_debt : 0,
      unpaid_count: allUnpaid.unpaid_count,
      draft_count: draftStats.draft_count,
      undelivered_contract_count: undeliveredContracts.undelivered_contract_count,
      undelivered_device_count: undeliveredDevices.undelivered_device_count,
      repair_devices: devices.repair_devices,
      contracts: contractRows.map((row) => ({
        id: row.id,
        contract_number: row.contract_number,
        customer_name: row.customer_name,
        ...(showFinance ? { value: row.value } : {}),
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

const canReviewPaymentRequest = (role: UserRole): boolean => isStaffAdminRole(role)

type ChartGranularity = 'day' | 'week' | 'month'

const chartGranularity = (dateFrom: string, dateTo: string): ChartGranularity => {
  const fromMs = new Date(`${dateFrom}T00:00:00`).getTime()
  const toMs = new Date(`${dateTo}T00:00:00`).getTime()
  const days = Math.max(1, Math.round((toMs - fromMs) / 86_400_000) + 1)
  if (days <= 31) return 'day'
  if (days <= 120) return 'week'
  return 'month'
}

const chartPeriodExpr = (columnSql: string, granularity: ChartGranularity): string => {
  if (granularity === 'day') return `DATE(${columnSql})`
  if (granularity === 'week') return `strftime('%Y-W%W', ${columnSql})`
  return `strftime('%Y-%m', ${columnSql})`
}

const mergeTrendSeries = (
  revenueRows: Array<{ period: string; revenue: number }>,
  signedRows: Array<{ period: string; signed_count: number }>,
) => {
  const map = new Map<string, { period: string; revenue: number; signed_count: number }>()

  for (const row of revenueRows) {
    map.set(row.period, {
      period: row.period,
      revenue: Number(row.revenue ?? 0),
      signed_count: 0,
    })
  }

  for (const row of signedRows) {
    const existing = map.get(row.period) ?? {
      period: row.period,
      revenue: 0,
      signed_count: 0,
    }
    existing.signed_count = Number(row.signed_count ?? 0)
    map.set(row.period, existing)
  }

  return Array.from(map.values()).sort((a, b) => a.period.localeCompare(b.period))
}

// GET /api/reports/charts — dữ liệu biểu đồ thu/chi theo kỳ
router.get('/charts', authenticateToken, (req: AuthRequest, res) => {
  try {
    const user = req.user!
    if (!isStaffRole(user.role)) {
      return res.status(403).json({ error: 'Không có quyền xem biểu đồ báo cáo' })
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

    const granularity = chartGranularity(dateFrom, dateTo)
    const showFinance = canViewContractFinance(user.role)
    const showExpenses = canReviewPaymentRequest(user.role)

    const signedFilter = `
      c.signed_date IS NOT NULL
      AND DATE(c.signed_date) >= DATE(?)
      AND DATE(c.signed_date) <= DATE(?)
      AND c.status != 'cancelled'
    `

    let revenueTrend: Array<{ period: string; revenue: number; signed_count: number }> = []
    let contractPayment = {
      paid_count: 0,
      unpaid_count: 0,
      paid_value: 0,
      unpaid_value: 0,
    }
    let cashFlowRevenue = 0

    if (showFinance) {
      const revenuePeriodCol = chartPeriodExpr(PAYMENT_RECEIVED_DATE_SQL, granularity)
      const revenueRows = db
        .prepare(
          `SELECT ${revenuePeriodCol} AS period, COALESCE(SUM(c.value), 0) AS revenue
           FROM contracts c
           WHERE ${revenuePeriodFilter}
           GROUP BY ${revenuePeriodCol}
           ORDER BY period ASC`,
        )
        .all(dateFrom, dateTo) as Array<{ period: string; revenue: number }>

      const signedPeriodCol = chartPeriodExpr('c.signed_date', granularity)
      const signedRows = db
        .prepare(
          `SELECT ${signedPeriodCol} AS period, COUNT(*) AS signed_count
           FROM contracts c
           WHERE ${signedFilter}
           GROUP BY ${signedPeriodCol}
           ORDER BY period ASC`,
        )
        .all(dateFrom, dateTo) as Array<{ period: string; signed_count: number }>

      revenueTrend = mergeTrendSeries(revenueRows, signedRows)

      const paymentBreakdown = db
        .prepare(
          `SELECT
             SUM(CASE WHEN ${UNPAID_PAYMENT_SQL} THEN 0 ELSE 1 END) AS paid_count,
             SUM(CASE WHEN ${UNPAID_PAYMENT_SQL} THEN 1 ELSE 0 END) AS unpaid_count,
             COALESCE(SUM(CASE WHEN ${UNPAID_PAYMENT_SQL} THEN 0 ELSE c.value END), 0) AS paid_value,
             COALESCE(SUM(CASE WHEN ${UNPAID_PAYMENT_SQL} THEN c.value ELSE 0 END), 0) AS unpaid_value
           FROM contracts c
           WHERE ${signedFilter}`,
        )
        .get(dateFrom, dateTo) as {
        paid_count: number
        unpaid_count: number
        paid_value: number
        unpaid_value: number
      }

      contractPayment = {
        paid_count: Number(paymentBreakdown.paid_count ?? 0),
        unpaid_count: Number(paymentBreakdown.unpaid_count ?? 0),
        paid_value: Number(paymentBreakdown.paid_value ?? 0),
        unpaid_value: Number(paymentBreakdown.unpaid_value ?? 0),
      }

      const revenueTotal = db
        .prepare(
          `SELECT COALESCE(SUM(c.value), 0) AS total
           FROM contracts c
           WHERE ${revenuePeriodFilter}`,
        )
        .get(dateFrom, dateTo) as { total: number }

      cashFlowRevenue = Number(revenueTotal.total ?? 0)
    } else {
      const signedPeriodCol = chartPeriodExpr('c.signed_date', granularity)
      const signedRows = db
        .prepare(
          `SELECT ${signedPeriodCol} AS period, COUNT(*) AS signed_count
           FROM contracts c
           WHERE ${signedFilter}
           GROUP BY ${signedPeriodCol}
           ORDER BY period ASC`,
        )
        .all(dateFrom, dateTo) as Array<{ period: string; signed_count: number }>

      revenueTrend = mergeTrendSeries([], signedRows)
    }

    let expenseTrend: Array<{ period: string; total: number; count: number }> = []
    let expenseByCategory: Array<{ expense_category: string; total: number }> = []
    let expenseByStatus = { pending: 0, approved: 0, paid: 0 }
    let cashFlowExpense = 0

    if (showExpenses) {
      const paidFilter = `
        pr.status = 'paid'
        AND ${EXPENSE_DATE_SQL} IS NOT NULL
        AND DATE(${EXPENSE_DATE_SQL}) >= DATE(?)
        AND DATE(${EXPENSE_DATE_SQL}) <= DATE(?)
      `

      const expensePeriodCol = chartPeriodExpr(EXPENSE_DATE_SQL, granularity)
      expenseTrend = db
        .prepare(
          `SELECT ${expensePeriodCol} AS period,
                  COALESCE(SUM(pr.amount), 0) AS total,
                  COUNT(*) AS count
           FROM payment_requests pr
           WHERE ${paidFilter}
           GROUP BY ${expensePeriodCol}
           ORDER BY period ASC`,
        )
        .all(dateFrom, dateTo) as Array<{ period: string; total: number; count: number }>

      expenseByCategory = db
        .prepare(
          `SELECT COALESCE(pr.expense_category, 'other') AS expense_category,
                  COALESCE(SUM(pr.amount), 0) AS total
           FROM payment_requests pr
           WHERE ${paidFilter}
           GROUP BY COALESCE(pr.expense_category, 'other')
           ORDER BY total DESC`,
        )
        .all(dateFrom, dateTo) as Array<{ expense_category: string; total: number }>

      const statusRow = db
        .prepare(
          `SELECT
             COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) AS pending,
             COALESCE(SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END), 0) AS approved,
             COALESCE(SUM(CASE WHEN status = 'paid' AND DATE(${EXPENSE_DATE_SQL}) >= DATE(?) AND DATE(${EXPENSE_DATE_SQL}) <= DATE(?) THEN amount ELSE 0 END), 0) AS paid
           FROM payment_requests`,
        )
        .get(dateFrom, dateTo) as { pending: number; approved: number; paid: number }

      expenseByStatus = {
        pending: Number(statusRow.pending ?? 0),
        approved: Number(statusRow.approved ?? 0),
        paid: Number(statusRow.paid ?? 0),
      }

      const expenseTotal = db
        .prepare(
          `SELECT COALESCE(SUM(pr.amount), 0) AS total
           FROM payment_requests pr
           WHERE ${paidFilter}`,
        )
        .get(dateFrom, dateTo) as { total: number }

      cashFlowExpense = Number(expenseTotal.total ?? 0)
    }

    res.json({
      granularity,
      revenue_trend: revenueTrend,
      expense_trend: showExpenses ? expenseTrend : [],
      contract_payment: showFinance ? contractPayment : null,
      expense_by_category: showExpenses ? expenseByCategory : [],
      expense_by_status: showExpenses ? expenseByStatus : null,
      cash_flow: {
        revenue: showFinance ? cashFlowRevenue : 0,
        expense: showExpenses ? cashFlowExpense : 0,
      },
      from: dateFrom,
      to: dateTo,
    })
  } catch (error) {
    console.error('Get report charts error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/** Ngày ghi nhận chi — ngày chi trên DNTT, fallback ngày cập nhật khi đã chi trả */
const EXPENSE_DATE_SQL = `COALESCE(NULLIF(TRIM(pr.payment_date), ''), date(pr.updated_at))`

// GET /api/reports/expenses — thống kê chi (DNTT) theo kỳ
router.get('/expenses', authenticateToken, (req: AuthRequest, res) => {
  try {
    const user = req.user!
    if (!canReviewPaymentRequest(user.role)) {
      return res.status(403).json({ error: 'Không có quyền xem thống kê chi' })
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

    const paidFilter = `
      pr.status = 'paid'
      AND ${EXPENSE_DATE_SQL} IS NOT NULL
      AND DATE(${EXPENSE_DATE_SQL}) >= DATE(?)
      AND DATE(${EXPENSE_DATE_SQL}) <= DATE(?)
    `

    const paidSummary = db.prepare(`
      SELECT COUNT(*) as paid_count, COALESCE(SUM(pr.amount), 0) as total_paid
      FROM payment_requests pr
      WHERE ${paidFilter}
    `).get(dateFrom, dateTo) as { paid_count: number; total_paid: number }

    const openStats = db
      .prepare(
        `SELECT
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
           SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
           SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending_total,
           SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) AS approved_total
         FROM payment_requests`,
      )
      .get() as {
      pending_count: number | null
      approved_count: number | null
      pending_total: number | null
      approved_total: number | null
    }

    const byCategory = db
      .prepare(
        `SELECT
           COALESCE(pr.expense_category, 'other') AS expense_category,
           COUNT(*) AS count,
           COALESCE(SUM(pr.amount), 0) AS total
         FROM payment_requests pr
         WHERE ${paidFilter}
         GROUP BY COALESCE(pr.expense_category, 'other')
         ORDER BY total DESC`,
      )
      .all(dateFrom, dateTo) as Array<{ expense_category: string; count: number; total: number }>

    const items = db
      .prepare(
        `SELECT pr.id, pr.request_number, pr.amount, pr.payment_date, pr.payment_content,
                pr.expense_category, pr.payment_source, pr.status,
                ru.name AS requested_by_name,
                ${EXPENSE_DATE_SQL} AS expense_date
         FROM payment_requests pr
         LEFT JOIN users ru ON ru.id = pr.requested_by
         WHERE ${paidFilter}
         ORDER BY DATE(${EXPENSE_DATE_SQL}) DESC, pr.id DESC
         LIMIT 200`,
      )
      .all(dateFrom, dateTo)

    res.json({
      paid_count: Number(paidSummary.paid_count ?? 0),
      total_paid: Number(paidSummary.total_paid ?? 0),
      pending_count: Number(openStats.pending_count ?? 0),
      approved_count: Number(openStats.approved_count ?? 0),
      pending_total: Number(openStats.pending_total ?? 0),
      approved_total: Number(openStats.approved_total ?? 0),
      by_category: byCategory.map((row) => ({
        expense_category: row.expense_category,
        count: row.count,
        total: row.total,
      })),
      items,
      from: dateFrom,
      to: dateTo,
    })
  } catch (error) {
    console.error('Get expense reports error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

