import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { UserRole, isAdminRole, isStaffAdminRole } from '../types/index.js'

const router = Router()

const canManageCashFund = (role: UserRole): boolean =>
  isStaffAdminRole(role) || role === UserRole.ACCOUNTING

const canViewCashFund = (role: UserRole): boolean =>
  isStaffAdminRole(role) || role === UserRole.ACCOUNTING

// GET /api/cash-fund/stats — thống kê cho biểu đồ
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canViewCashFund(user.role)) return res.status(403).json({ error: 'Insufficient permissions' })

    const { from, to } = req.query
    const dateFilter = (alias: string) =>
      from && to ? `AND DATE(${alias}) >= DATE(?) AND DATE(${alias}) <= DATE(?)` : ''
    const dateParams = from && to ? [from, to] : []

    // Monthly receipts
    const receiptsMonthly = db.prepare(`
      SELECT strftime('%Y-%m', receipt_date) AS month, SUM(amount) AS total
      FROM cash_receipts WHERE 1=1 ${dateFilter('receipt_date')}
      GROUP BY month ORDER BY month
    `).all(...dateParams) as Array<{ month: string; total: number }>

    // Monthly cash expenses
    const expensesMonthly = db.prepare(`
      SELECT strftime('%Y-%m', COALESCE(NULLIF(TRIM(payment_date),''), created_at)) AS month,
             SUM(amount) AS total
      FROM payment_requests
      WHERE payment_source = 'cash' AND status = 'paid'
      ${from && to ? "AND DATE(COALESCE(NULLIF(TRIM(payment_date),''), created_at)) >= DATE(?) AND DATE(COALESCE(NULLIF(TRIM(payment_date),''), created_at)) <= DATE(?)" : ''}
      GROUP BY month ORDER BY month
    `).all(...dateParams) as Array<{ month: string; total: number }>

    // Expenses by category
    const byCategory = db.prepare(`
      SELECT COALESCE(expense_category, 'other') AS category, SUM(amount) AS total, COUNT(*) AS count
      FROM payment_requests
      WHERE payment_source = 'cash' AND status = 'paid'
      ${from && to ? "AND DATE(COALESCE(NULLIF(TRIM(payment_date),''), created_at)) >= DATE(?) AND DATE(COALESCE(NULLIF(TRIM(payment_date),''), created_at)) <= DATE(?)" : ''}
      GROUP BY category ORDER BY total DESC
    `).all(...dateParams) as Array<{ category: string; total: number; count: number }>

    // Total summary
    const totalIn = (db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS t FROM cash_receipts WHERE 1=1 ${dateFilter('receipt_date')}
    `).get(...dateParams) as any).t

    const totalOut = (db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS t FROM payment_requests
      WHERE payment_source = 'cash' AND status = 'paid'
      ${from && to ? "AND DATE(COALESCE(NULLIF(TRIM(payment_date),''), created_at)) >= DATE(?) AND DATE(COALESCE(NULLIF(TRIM(payment_date),''), created_at)) <= DATE(?)" : ''}
    `).get(...dateParams) as any).t

    const pendingOut = (db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS t FROM payment_requests
      WHERE payment_source = 'cash' AND status IN ('pending','approved')
      ${from && to ? "AND DATE(COALESCE(NULLIF(TRIM(payment_date),''), created_at)) >= DATE(?) AND DATE(COALESCE(NULLIF(TRIM(payment_date),''), created_at)) <= DATE(?)" : ''}
    `).get(...dateParams) as any).t

    res.json({ receipts_monthly: receiptsMonthly, expenses_monthly: expensesMonthly, by_category: byCategory, total_in: totalIn, total_out: totalOut, pending_out: pendingOut })
  } catch (err) {
    console.error('Error getting cash fund stats:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/cash-fund/expenses — danh sách chi tiêu từ quỹ tiền mặt (DNTT)
router.get('/expenses', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canViewCashFund(user.role)) return res.status(403).json({ error: 'Insufficient permissions' })

    const { from, to, category, page = '1', limit = '20' } = req.query
    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20))
    const offset = (pageNum - 1) * limitNum

    let where = `payment_source = 'cash' AND status = 'paid'`
    const params: unknown[] = []

    if (from && to) {
      where += ` AND DATE(COALESCE(NULLIF(TRIM(payment_date),''), created_at)) >= DATE(?) AND DATE(COALESCE(NULLIF(TRIM(payment_date),''), created_at)) <= DATE(?)`
      params.push(from, to)
    }
    if (category) { where += ' AND COALESCE(expense_category, \'other\') = ?'; params.push(category) }

    const total = (db.prepare(`SELECT COUNT(*) AS t FROM payment_requests WHERE ${where}`).get(...params) as any).t
    const rows = db.prepare(`
      SELECT pr.id, pr.request_number, pr.payment_date, pr.payment_content, pr.amount,
             pr.expense_category, pr.payer_name, pr.has_vat,
             u.name AS requester_name
      FROM payment_requests pr
      LEFT JOIN users u ON u.id = pr.created_by
      WHERE ${where}
      ORDER BY COALESCE(NULLIF(TRIM(pr.payment_date),''), pr.created_at) DESC
      LIMIT ? OFFSET ?
    `).all(...params, limitNum, offset)

    res.json({ data: rows, pagination: { total, page: pageNum, limit: limitNum } })
  } catch (err) {
    console.error('Error listing cash expenses:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/cash-fund/balance — số dư hiện tại
router.get('/balance', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canViewCashFund(user.role)) return res.status(403).json({ error: 'Insufficient permissions' })

    const receipts = (db.prepare(`SELECT COALESCE(SUM(amount), 0) AS total FROM cash_receipts`).get() as any).total
    const expenses = (db.prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total FROM payment_requests
      WHERE payment_source = 'cash' AND status = 'paid'
    `).get() as any).total

    res.json({ receipts, expenses, balance: receipts - expenses })
  } catch (err) {
    console.error('Error getting cash fund balance:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/cash-fund/report — báo cáo thu chi hằng tháng
router.get('/report', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canViewCashFund(user.role)) return res.status(403).json({ error: 'Insufficient permissions' })

    const { from, to } = req.query
    let receiptWhere = '1=1'
    let expenseWhere = `payment_source = 'cash' AND status = 'paid'`
    const params: unknown[] = []
    const expenseParams: unknown[] = []

    if (from && to) {
      receiptWhere += ' AND DATE(receipt_date) >= DATE(?) AND DATE(receipt_date) <= DATE(?)'
      params.push(from, to)
      expenseWhere += ' AND DATE(COALESCE(NULLIF(TRIM(payment_date), \'\'), created_at)) >= DATE(?) AND DATE(COALESCE(NULLIF(TRIM(payment_date), \'\'), created_at)) <= DATE(?)'
      expenseParams.push(from, to)
    }

    const receiptMonths = db.prepare(`
      SELECT strftime('%Y-%m', receipt_date) AS month,
             SUM(amount) AS receipts,
             COUNT(*) AS receipt_count
      FROM cash_receipts
      WHERE ${receiptWhere}
      GROUP BY month ORDER BY month
    `).all(...params) as Array<{ month: string; receipts: number; receipt_count: number }>

    const expenseMonths = db.prepare(`
      SELECT strftime('%Y-%m', COALESCE(NULLIF(TRIM(payment_date), ''), created_at)) AS month,
             SUM(amount) AS expenses,
             COUNT(*) AS expense_count
      FROM payment_requests
      WHERE ${expenseWhere}
      GROUP BY month ORDER BY month
    `).all(...expenseParams) as Array<{ month: string; expenses: number; expense_count: number }>

    // Merge into unified monthly list
    const monthMap: Record<string, { month: string; receipts: number; expenses: number; receipt_count: number; expense_count: number }> = {}
    for (const r of receiptMonths) {
      monthMap[r.month] = { month: r.month, receipts: r.receipts, expenses: 0, receipt_count: r.receipt_count, expense_count: 0 }
    }
    for (const e of expenseMonths) {
      if (!monthMap[e.month]) monthMap[e.month] = { month: e.month, receipts: 0, expenses: 0, receipt_count: 0, expense_count: 0 }
      monthMap[e.month].expenses = e.expenses
      monthMap[e.month].expense_count = e.expense_count
    }

    const months = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month))
    let cumulative = 0
    const monthsWithCumulative = months.map((m) => {
      cumulative += m.receipts - m.expenses
      return { ...m, net: m.receipts - m.expenses, cumulative }
    })

    const totalReceipts = months.reduce((s, m) => s + m.receipts, 0)
    const totalExpenses = months.reduce((s, m) => s + m.expenses, 0)

    res.json({
      months: monthsWithCumulative,
      total_receipts: totalReceipts,
      total_expenses: totalExpenses,
      net: totalReceipts - totalExpenses,
    })
  } catch (err) {
    console.error('Error getting cash fund report:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/cash-fund — danh sách phiếu thu
router.get('/', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canViewCashFund(user.role)) return res.status(403).json({ error: 'Insufficient permissions' })

    const { search, from, to, page = '1', limit = '20' } = req.query
    const pageNum = Math.max(1, parseInt(page as string) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20))
    const offset = (pageNum - 1) * limitNum

    let where = '1=1'
    const params: unknown[] = []

    if (search) {
      where += ' AND (cr.content LIKE ? OR cr.notes LIKE ?)'
      const like = `%${search}%`
      params.push(like, like)
    }
    if (from && to) {
      where += ' AND DATE(cr.receipt_date) >= DATE(?) AND DATE(cr.receipt_date) <= DATE(?)'
      params.push(from, to)
    }

    const total = (db.prepare(`SELECT COUNT(*) AS total FROM cash_receipts cr WHERE ${where}`).get(...params) as any).total

    const rows = db.prepare(`
      SELECT cr.*, u.name AS created_by_name
      FROM cash_receipts cr
      LEFT JOIN users u ON u.id = cr.created_by
      WHERE ${where}
      ORDER BY cr.receipt_date DESC, cr.id DESC
      LIMIT ? OFFSET ?
    `).all(...params, limitNum, offset)

    res.json({ data: rows, pagination: { total, page: pageNum, limit: limitNum } })
  } catch (err) {
    console.error('Error listing cash receipts:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/cash-fund — tạo phiếu thu mới
router.post('/', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canManageCashFund(user.role)) return res.status(403).json({ error: 'Insufficient permissions' })

    const { receipt_date, amount, content, notes } = req.body
    if (!receipt_date || !amount || !content) {
      return res.status(400).json({ error: 'receipt_date, amount, content are required' })
    }

    const result = db.prepare(`
      INSERT INTO cash_receipts (receipt_date, amount, content, notes, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(receipt_date, Number(amount), String(content).trim(), notes || null, user.id)

    const row = db.prepare(`
      SELECT cr.*, u.name AS created_by_name FROM cash_receipts cr
      LEFT JOIN users u ON u.id = cr.created_by WHERE cr.id = ?
    `).get(result.lastInsertRowid)

    res.status(201).json(row)
  } catch (err) {
    console.error('Error creating cash receipt:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/cash-fund/:id — cập nhật
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canManageCashFund(user.role)) return res.status(403).json({ error: 'Insufficient permissions' })

    const id = parseInt(req.params.id)
    const existing = db.prepare('SELECT * FROM cash_receipts WHERE id = ?').get(id)
    if (!existing) return res.status(404).json({ error: 'Not found' })

    const { receipt_date, amount, content, notes } = req.body
    db.prepare(`
      UPDATE cash_receipts SET receipt_date = ?, amount = ?, content = ?, notes = ?
      WHERE id = ?
    `).run(receipt_date, Number(amount), String(content).trim(), notes || null, id)

    const row = db.prepare(`
      SELECT cr.*, u.name AS created_by_name FROM cash_receipts cr
      LEFT JOIN users u ON u.id = cr.created_by WHERE cr.id = ?
    `).get(id)

    res.json(row)
  } catch (err) {
    console.error('Error updating cash receipt:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/cash-fund/:id
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!isAdminRole(user.role)) return res.status(403).json({ error: 'Insufficient permissions' })

    const id = parseInt(req.params.id)
    const result = db.prepare('DELETE FROM cash_receipts WHERE id = ?').run(id)
    if (result.changes === 0) return res.status(404).json({ error: 'Not found' })

    res.json({ success: true })
  } catch (err) {
    console.error('Error deleting cash receipt:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
