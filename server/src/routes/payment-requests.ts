import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'
import { UserRole, isAdminRole, isStaffAdminRole } from '../types/index.js'
import { createNotification, notifyUsersByRoles } from '../services/notificationService.js'

const router = Router()

const STATUSES = ['pending', 'approved', 'rejected', 'paid'] as const
type PaymentRequestStatus = (typeof STATUSES)[number]

const EXPENSE_CATEGORIES = [
  'tools',
  'materials',
  'external_labor',
  'transport',
  'business_travel',
  'office',
  'entertainment',
  'other',
] as const

const PAYMENT_SOURCES = ['company_account', 'cash', 'other'] as const

const canViewPaymentRequests = (role: UserRole): boolean => {
  if (isAdminRole(role)) return true
  return [
    UserRole.SERVICE_CENTER,
    UserRole.DEALER,
    UserRole.ACCOUNTING,
    UserRole.TECHNICIAN,
    UserRole.WAREHOUSE,
  ].includes(role)
}

const canCreatePaymentRequest = (role: UserRole): boolean => {
  if (isAdminRole(role)) return true
  return [
    UserRole.SERVICE_CENTER,
    UserRole.DEALER,
    UserRole.ACCOUNTING,
    UserRole.TECHNICIAN,
    UserRole.WAREHOUSE,
  ].includes(role)
}

const canReviewPaymentRequest = (role: UserRole): boolean => {
  return isStaffAdminRole(role)
}

/** Admin / dev / kế toán — xem tất cả DNTT */
const canViewAllPaymentRequests = (role: UserRole): boolean => {
  return isStaffAdminRole(role)
}

const canDeletePaymentRequest = (role: UserRole): boolean => {
  return isAdminRole(role)
}

const userCanAccessPaymentRequest = (
  user: { id: number; role: UserRole },
  requestedBy: number,
): boolean => {
  return canViewAllPaymentRequests(user.role) || requestedBy === user.id
}

const generateRequestNumber = (): string => {
  const year = new Date().getFullYear()
  const prefix = `DN${year}`
  const row = db
    .prepare(
      `SELECT request_number FROM payment_requests
       WHERE request_number LIKE ?
       ORDER BY id DESC LIMIT 1`,
    )
    .get(`${prefix}%`) as { request_number: string } | undefined

  let seq = 1
  if (row?.request_number) {
    const tail = row.request_number.slice(prefix.length)
    const parsed = parseInt(tail, 10)
    if (!Number.isNaN(parsed)) seq = parsed + 1
  }
  return `${prefix}${String(seq).padStart(4, '0')}`
}

const mapRow = (row: Record<string, unknown>) => ({
  ...row,
  amount: Number(row.amount ?? 0),
  has_vat: Number(row.has_vat ?? 0) === 1,
})

// GET /api/payment-requests/contract-options — hợp đồng cho form tạo mới
router.get('/contract-options', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canCreatePaymentRequest(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    const { search = '', limit = '30', contract_id } = req.query
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 30))
    let where = "c.status IN ('active', 'draft')"
    const params: unknown[] = []

    if (contract_id) {
      where += ' AND c.id = ?'
      params.push(parseInt(contract_id as string, 10))
    } else if (search) {
      where += ' AND (c.contract_number LIKE ? OR c.title LIKE ? OR cu.name LIKE ?)'
      const like = `%${search}%`
      params.push(like, like, like)
    }

    const rows = db
      .prepare(
        `SELECT c.id, c.contract_number, c.title, c.value, c.status,
                cu.name AS customer_name
         FROM contracts c
         LEFT JOIN customers cu ON cu.id = c.customer_id
         WHERE ${where}
         ORDER BY c.created_at DESC
         LIMIT ?`,
      )
      .all(...params, limitNum)

    res.json(rows)
  } catch (err: unknown) {
    console.error('Error loading contract options:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

const paymentRequestListSelect = `
  SELECT pr.*,
         c.contract_number, c.title AS contract_title, c.value AS contract_value,
         cu.name AS customer_name,
         ru.name AS requested_by_name,
         rv.name AS reviewed_by_name
  FROM payment_requests pr
  LEFT JOIN contracts c ON c.id = pr.contract_id
  LEFT JOIN customers cu ON cu.id = c.customer_id
  LEFT JOIN users ru ON ru.id = pr.requested_by
  LEFT JOIN users rv ON rv.id = pr.reviewed_by
`

// GET /api/payment-requests/dashboard-summary — thống kê DNTT chưa xong (admin/dev/kế toán)
router.get('/dashboard-summary', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canReviewPaymentRequest(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    const stats = db
      .prepare(
        `SELECT
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
           SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved_count,
           SUM(CASE WHEN status IN ('pending', 'approved') THEN amount ELSE 0 END) AS open_total_amount,
           SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS pending_total_amount,
           SUM(CASE WHEN status = 'approved' THEN amount ELSE 0 END) AS approved_total_amount
         FROM payment_requests`,
      )
      .get() as {
      pending_count: number | null
      approved_count: number | null
      open_total_amount: number | null
      pending_total_amount: number | null
      approved_total_amount: number | null
    }

    const pendingRows = db
      .prepare(
        `${paymentRequestListSelect}
         WHERE pr.status = 'pending'
         ORDER BY pr.created_at DESC
         LIMIT 10`,
      )
      .all()
      .map((r) => mapRow(r as Record<string, unknown>))

    const approvedRows = db
      .prepare(
        `${paymentRequestListSelect}
         WHERE pr.status = 'approved'
         ORDER BY pr.created_at DESC
         LIMIT 10`,
      )
      .all()
      .map((r) => mapRow(r as Record<string, unknown>))

    res.json({
      pending_count: Number(stats.pending_count ?? 0),
      approved_count: Number(stats.approved_count ?? 0),
      open_count: Number(stats.pending_count ?? 0) + Number(stats.approved_count ?? 0),
      open_total_amount: Number(stats.open_total_amount ?? 0),
      pending_total_amount: Number(stats.pending_total_amount ?? 0),
      approved_total_amount: Number(stats.approved_total_amount ?? 0),
      pending_list: pendingRows,
      approved_list: approvedRows,
    })
  } catch (err: unknown) {
    console.error('Error loading payment request dashboard summary:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/payment-requests
router.get('/', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canViewPaymentRequests(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    const { status, contract_id, search, from, to, page = '1', limit = '20' } = req.query
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20))
    const offset = (pageNum - 1) * limitNum

    let where = '1=1'
    const params: unknown[] = []

    if (status && STATUSES.includes(status as PaymentRequestStatus)) {
      where += ' AND pr.status = ?'
      params.push(status)
    }
    if (contract_id) {
      where += ' AND pr.contract_id = ?'
      params.push(parseInt(contract_id as string, 10))
    }
    if (search) {
      where += ' AND (pr.request_number LIKE ? OR pr.payment_content LIKE ? OR pr.payer_name LIKE ?)'
      const like = `%${search}%`
      params.push(like, like, like)
    }
    if (from && to) {
      where += ` AND DATE(COALESCE(NULLIF(TRIM(pr.payment_date), ''), pr.created_at)) >= DATE(?) AND DATE(COALESCE(NULLIF(TRIM(pr.payment_date), ''), pr.created_at)) <= DATE(?)`
      params.push(from, to)
    }

    // Nhân viên chỉ xem DNTT của mình; admin / dev / kế toán xem tất cả
    if (!canViewAllPaymentRequests(user.role)) {
      where += ' AND pr.requested_by = ?'
      params.push(user.id)
    }

    const totalRow = db
      .prepare(
        `SELECT COUNT(*) AS total
         FROM payment_requests pr
         LEFT JOIN contracts c ON c.id = pr.contract_id
         LEFT JOIN customers cu ON cu.id = c.customer_id
         WHERE ${where}`,
      )
      .get(...params) as { total: number }

    const rows = db
      .prepare(
        `SELECT pr.*,
                c.contract_number, c.title AS contract_title, c.value AS contract_value,
                cu.name AS customer_name,
                ru.name AS requested_by_name,
                rv.name AS reviewed_by_name
         FROM payment_requests pr
         LEFT JOIN contracts c ON c.id = pr.contract_id
         LEFT JOIN customers cu ON cu.id = c.customer_id
         LEFT JOIN users ru ON ru.id = pr.requested_by
         LEFT JOIN users rv ON rv.id = pr.reviewed_by
         WHERE ${where}
         ORDER BY pr.created_at DESC
         LIMIT ? OFFSET ?`,
      )
      .all(...params, limitNum, offset)
      .map((r) => mapRow(r as Record<string, unknown>))

    res.json({
      data: rows,
      pagination: { total: totalRow.total, page: pageNum, limit: limitNum },
    })
  } catch (err: unknown) {
    console.error('Error listing payment requests:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/payment-requests/:id/comments
router.get('/:id/comments', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canViewPaymentRequests(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    const pr = db
      .prepare('SELECT id, requested_by FROM payment_requests WHERE id = ?')
      .get(req.params.id) as { id: number; requested_by: number } | undefined

    if (!pr) return res.status(404).json({ error: 'Không tìm thấy chi phí' })
    if (!userCanAccessPaymentRequest(user, pr.requested_by)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    const rows = db
      .prepare(
        `SELECT c.id, c.payment_request_id, c.user_id, c.comment, c.created_at,
                u.name AS user_name, u.role AS user_role
         FROM payment_request_comments c
         LEFT JOIN users u ON u.id = c.user_id
         WHERE c.payment_request_id = ?
         ORDER BY c.created_at ASC`,
      )
      .all(pr.id)

    res.json(rows)
  } catch (err: unknown) {
    console.error('Error listing payment request comments:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/payment-requests/:id/comments
router.post('/:id/comments', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canViewPaymentRequests(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    const { comment } = req.body as { comment?: string }
    if (!comment?.trim()) {
      return res.status(400).json({ error: 'Nội dung tin nhắn không được để trống' })
    }

    const pr = db
      .prepare('SELECT id, requested_by, request_number FROM payment_requests WHERE id = ?')
      .get(req.params.id) as { id: number; requested_by: number; request_number: string } | undefined

    if (!pr) return res.status(404).json({ error: 'Không tìm thấy chi phí' })
    if (!userCanAccessPaymentRequest(user, pr.requested_by)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    const result = db
      .prepare(
        `INSERT INTO payment_request_comments (payment_request_id, user_id, comment)
         VALUES (?, ?, ?)`,
      )
      .run(pr.id, user.id, comment.trim())

    const created = db
      .prepare(
        `SELECT c.id, c.payment_request_id, c.user_id, c.comment, c.created_at,
                u.name AS user_name, u.role AS user_role
         FROM payment_request_comments c
         LEFT JOIN users u ON u.id = c.user_id
         WHERE c.id = ?`,
      )
      .get(result.lastInsertRowid)

    res.status(201).json(created)
  } catch (err: unknown) {
    console.error('Error creating payment request comment:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/payment-requests/:id
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canViewPaymentRequests(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    const row = db
      .prepare(
        `SELECT pr.*,
                c.contract_number, c.title AS contract_title, c.value AS contract_value,
                cu.name AS customer_name, cu.phone AS customer_phone,
                ru.name AS requested_by_name, ru.email AS requested_by_email,
                rv.name AS reviewed_by_name
         FROM payment_requests pr
         LEFT JOIN contracts c ON c.id = pr.contract_id
         LEFT JOIN customers cu ON cu.id = c.customer_id
         LEFT JOIN users ru ON ru.id = pr.requested_by
         LEFT JOIN users rv ON rv.id = pr.reviewed_by
         WHERE pr.id = ?`,
      )
      .get(req.params.id) as Record<string, unknown> | undefined

    if (!row) return res.status(404).json({ error: 'Không tìm thấy chi phí' })

    if (!userCanAccessPaymentRequest(user, Number(row.requested_by))) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    res.json(mapRow(row))
  } catch (err: unknown) {
    console.error('Error getting payment request:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/payment-requests
router.post('/', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canCreatePaymentRequest(user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền tạo chi phí' })
    }

    const {
      contract_id,
      amount,
      payment_date,
      payment_content,
      expense_category,
      payment_source,
      payer_name,
      has_vat,
      invoice_images,
      notes,
      beneficiary_name,
      bank_account,
      bank_name,
    } = req.body as Record<string, unknown>

    if (!payment_content || amount == null) {
      return res.status(400).json({ error: 'Thiếu số tiền hoặc nội dung chi' })
    }

    const parsedAmount = Number(amount)
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Số tiền không hợp lệ' })
    }

    // Validate expense_category if provided
    if (expense_category && !EXPENSE_CATEGORIES.includes(expense_category as typeof EXPENSE_CATEGORIES[number])) {
      return res.status(400).json({ error: 'Hạng mục chi không hợp lệ' })
    }

    // Nguồn tiền — chỉ reviewer điền khi duyệt; tạo mới để trống
    let source: string | null = null
    if (payment_source != null && String(payment_source).trim() !== '') {
      source = String(payment_source).trim()
      if (!PAYMENT_SOURCES.includes(source as typeof PAYMENT_SOURCES[number])) {
        return res.status(400).json({ error: 'Nguồn tiền không hợp lệ' })
      }
    }

    // Validate contract if provided
    let contract: { id: number; contract_number: string } | undefined
    if (contract_id) {
      contract = db
        .prepare('SELECT id, contract_number FROM contracts WHERE id = ?')
        .get(contract_id) as { id: number; contract_number: string } | undefined
      if (!contract) return res.status(404).json({ error: 'Không tìm thấy hợp đồng' })
    }

    // Validate invoice_images: must be JSON array or null
    let imagesJson: string | null = null
    if (invoice_images) {
      const arr = Array.isArray(invoice_images) ? invoice_images : JSON.parse(String(invoice_images))
      imagesJson = JSON.stringify(arr)
    }

    const requestNumber = generateRequestNumber()
    const result = db
      .prepare(
        `INSERT INTO payment_requests (
          request_number, contract_id, amount, payment_date, payment_content,
          expense_category, payment_source, payer_name, has_vat, invoice_images,
          notes, beneficiary_name, bank_account, bank_name,
          status, requested_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      )
      .run(
        requestNumber,
        contract_id ? Number(contract_id) : null,
        parsedAmount,
        payment_date ? String(payment_date).trim() : null,
        String(payment_content).trim(),
        expense_category ? String(expense_category).trim() : null,
        source,
        payer_name ? String(payer_name).trim() : null,
        has_vat ? 1 : 0,
        imagesJson,
        notes ? String(notes).trim() : null,
        beneficiary_name ? String(beneficiary_name).trim() : null,
        bank_account ? String(bank_account).trim() : null,
        bank_name ? String(bank_name).trim() : null,
        user.id,
      )

    const created = db
      .prepare(
        `SELECT pr.*, c.contract_number, cu.name AS customer_name, ru.name AS requested_by_name
         FROM payment_requests pr
         LEFT JOIN contracts c ON c.id = pr.contract_id
         LEFT JOIN customers cu ON cu.id = c.customer_id
         LEFT JOIN users ru ON ru.id = pr.requested_by
         WHERE pr.id = ?`,
      )
      .get(result.lastInsertRowid) as Record<string, unknown>

    const userName = (db.prepare('SELECT name FROM users WHERE id = ?').get(user.id) as { name: string } | undefined)?.name || user.email
    notifyUsersByRoles(
      [UserRole.ADMIN, UserRole.ACCOUNTING],
      {
        type: 'payment_request_created',
        title: 'Chi phí mới',
        message: `${userName} tạo ${requestNumber}${contract ? ` cho HĐ ${contract.contract_number}` : ''}`,
        entityType: 'payment_request',
        entityId: Number(result.lastInsertRowid),
      },
      { excludeIds: [user.id] },
    )

    res.status(201).json(mapRow(created))
  } catch (err: unknown) {
    console.error('Error creating payment request:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/payment-requests/:id — cập nhật chi phí (chỉ khi pending)
router.patch('/:id', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!

    const existing = db
      .prepare(
        `SELECT id, status, requested_by, request_number,
                payment_date, payment_content, amount, expense_category,
                payment_source, payer_name, review_note
         FROM payment_requests WHERE id = ?`,
      )
      .get(req.params.id) as {
      id: number
      status: string
      requested_by: number
      request_number: string
      payment_date: string | null
      payment_content: string
      amount: number
      expense_category: string | null
      payment_source: string | null
      payer_name: string | null
      review_note: string | null
    } | undefined

    if (!existing) return res.status(404).json({ error: 'Không tìm thấy chi phí' })

    const isOwner = existing.requested_by === user.id
    const isReviewer = canReviewPaymentRequest(user.role)

    if (!isOwner && !isReviewer) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    // Người tạo chỉ sửa khi pending; reviewer có thể cập nhật payment_source ở mọi trạng thái
    const body = req.body as Record<string, unknown>
    const bodyKeys = Object.keys(body)
    const isSourceOnlyUpdate = bodyKeys.length === 1 && body.payment_source !== undefined
    const reviewerPaidKeys = ['payment_source', 'payment_proof_images']
    const isReviewerPaidUpdate =
      bodyKeys.length > 0 && bodyKeys.every((k) => reviewerPaidKeys.includes(k))

    if (!isReviewer && existing.status !== 'pending') {
      return res.status(400).json({ error: 'Chỉ có thể chỉnh sửa chi phí đang ở trạng thái Tạo mới' })
    }
    if (isReviewer && existing.status === 'paid' && !isReviewerPaidUpdate) {
      return res.status(400).json({ error: 'Chi phí đã thanh toán, chỉ có thể cập nhật nguồn tiền hoặc ảnh chứng từ' })
    }

    const updates: string[] = []
    const values: unknown[] = []

    const setIfDefined = (col: string, val: unknown, transform?: (v: unknown) => unknown) => {
      if (val !== undefined) {
        updates.push(`${col} = ?`)
        values.push(transform ? transform(val) : val)
      }
    }

    if (body.amount !== undefined) {
      const n = Number(body.amount)
      if (!Number.isFinite(n) || n <= 0) return res.status(400).json({ error: 'Số tiền không hợp lệ' })
      setIfDefined('amount', n)
    }
    setIfDefined('payment_date', body.payment_date, (v) => (v ? String(v).trim() : null))
    setIfDefined('payment_content', body.payment_content, (v) => String(v).trim())
    setIfDefined('expense_category', body.expense_category, (v) => v || null)
    if (body.payment_source !== undefined) {
      if (!isReviewer) {
        return res.status(403).json({ error: 'Chỉ người duyệt mới được cập nhật nguồn tiền' })
      }
      const src = body.payment_source ? String(body.payment_source).trim() : null
      if (src && !PAYMENT_SOURCES.includes(src as typeof PAYMENT_SOURCES[number])) {
        return res.status(400).json({ error: 'Nguồn tiền không hợp lệ' })
      }
      setIfDefined('payment_source', src)
    }
    setIfDefined('payer_name', body.payer_name, (v) => v || null)
    setIfDefined('has_vat', body.has_vat, (v) => (v ? 1 : 0))
    if (body.invoice_images !== undefined) {
      const arr = Array.isArray(body.invoice_images) ? body.invoice_images : null
      updates.push('invoice_images = ?')
      values.push(arr ? JSON.stringify(arr) : null)
    }
    if (body.payment_proof_images !== undefined) {
      if (!isReviewer) {
        return res.status(403).json({ error: 'Chỉ người duyệt mới được tải ảnh đã thanh toán' })
      }
      const arr = Array.isArray(body.payment_proof_images) ? body.payment_proof_images : null
      updates.push('payment_proof_images = ?')
      values.push(arr ? JSON.stringify(arr) : null)
    }
    if (body.review_note !== undefined) {
      if (!isReviewer) {
        return res.status(403).json({ error: 'Chỉ người duyệt mới được cập nhật ghi chú duyệt' })
      }
      setIfDefined('review_note', body.review_note, (v) => (v ? String(v).trim() : null))
    }
    setIfDefined('notes', body.notes, (v) => v || null)

    if (updates.length === 0) return res.status(400).json({ error: 'Không có gì để cập nhật' })
    updates.push('updated_at = CURRENT_TIMESTAMP')
    values.push(existing.id)

    db.prepare(`UPDATE payment_requests SET ${updates.join(', ')} WHERE id = ?`).run(...values)

    if (isReviewer && existing.requested_by !== user.id) {
      const infoLabels: Record<string, string> = {
        payment_date: 'Ngày chi',
        payment_content: 'Nội dung chi',
        amount: 'Số tiền',
        expense_category: 'Hạng mục',
        payment_source: 'Nguồn tiền',
        payer_name: 'Người yêu cầu',
        review_note: 'Ghi chú duyệt',
      }
      const changed: string[] = []
      if (body.payment_date !== undefined) {
        const oldVal = existing.payment_date ? String(existing.payment_date).slice(0, 10) : ''
        const newVal = body.payment_date ? String(body.payment_date).trim().slice(0, 10) : ''
        if (oldVal !== newVal) changed.push(infoLabels.payment_date)
      }
      if (
        body.payment_content !== undefined &&
        String(existing.payment_content).trim() !== String(body.payment_content).trim()
      ) {
        changed.push(infoLabels.payment_content)
      }
      if (body.amount !== undefined && Number(existing.amount) !== Number(body.amount)) {
        changed.push(infoLabels.amount)
      }
      if (body.expense_category !== undefined) {
        const oldCat = existing.expense_category || ''
        const newCat = body.expense_category ? String(body.expense_category) : ''
        if (oldCat !== newCat) changed.push(infoLabels.expense_category)
      }
      if (body.payment_source !== undefined) {
        const oldSrc = existing.payment_source || ''
        const newSrc = body.payment_source ? String(body.payment_source) : ''
        if (oldSrc !== newSrc) changed.push(infoLabels.payment_source)
      }
      if (body.payer_name !== undefined) {
        const oldPayer = existing.payer_name || ''
        const newPayer = body.payer_name ? String(body.payer_name) : ''
        if (oldPayer !== newPayer) changed.push(infoLabels.payer_name)
      }
      if (body.review_note !== undefined) {
        const oldNote = existing.review_note || ''
        const newNote = body.review_note ? String(body.review_note).trim() : ''
        if (oldNote !== newNote) changed.push(infoLabels.review_note)
      }
      if (changed.length > 0) {
        const reviewerRow = db.prepare('SELECT name FROM users WHERE id = ?').get(user.id) as { name: string }
        createNotification(existing.requested_by, {
          type: 'payment_request_updated',
          title: 'Chi phí đã được cập nhật',
          message: `${existing.request_number}: ${reviewerRow.name} đã chỉnh sửa ${changed.join(', ')}`,
          entityType: 'payment_request',
          entityId: existing.id,
        })
      }
    }

    const updated = db
      .prepare(
        `SELECT pr.*, c.contract_number, cu.name AS customer_name,
                ru.name AS requested_by_name, rv.name AS reviewed_by_name
         FROM payment_requests pr
         LEFT JOIN contracts c ON c.id = pr.contract_id
         LEFT JOIN customers cu ON cu.id = c.customer_id
         LEFT JOIN users ru ON ru.id = pr.requested_by
         LEFT JOIN users rv ON rv.id = pr.reviewed_by
         WHERE pr.id = ?`,
      )
      .get(existing.id) as Record<string, unknown>

    res.json(mapRow(updated))
  } catch (err: unknown) {
    console.error('Error updating payment request:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/payment-requests/:id/review — duyệt / từ chối
router.patch('/:id/review', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canReviewPaymentRequest(user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền duyệt chi phí' })
    }

    const { action, review_note, payment_source, payment_proof_images } = req.body as {
      action?: string
      review_note?: string
      payment_source?: string
      payment_proof_images?: string[]
    }
    if (action !== 'approve' && action !== 'reject') {
      return res.status(400).json({ error: 'Hành động không hợp lệ' })
    }

    const existing = db
      .prepare('SELECT id, status, requested_by, request_number FROM payment_requests WHERE id = ?')
      .get(req.params.id) as
      | { id: number; status: string; requested_by: number; request_number: string }
      | undefined

    if (!existing) return res.status(404).json({ error: 'Không tìm thấy chi phí' })
    if (existing.status !== 'pending') {
      return res.status(400).json({ error: 'Chỉ có thể duyệt chi phí đang chờ xử lý' })
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected'

    if (payment_source !== undefined) {
      if (payment_source && !PAYMENT_SOURCES.includes(payment_source as typeof PAYMENT_SOURCES[number])) {
        return res.status(400).json({ error: 'Nguồn tiền không hợp lệ' })
      }
    }

    let proofJson: string | null = null
    if (Array.isArray(payment_proof_images) && payment_proof_images.length > 0) {
      proofJson = JSON.stringify(payment_proof_images)
    }

    db.prepare(
      `UPDATE payment_requests
       SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP,
           review_note = ?,
           payment_source = COALESCE(?, payment_source),
           payment_proof_images = COALESCE(?, payment_proof_images),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    ).run(
      newStatus,
      user.id,
      review_note?.trim() || null,
      payment_source !== undefined ? (payment_source || null) : null,
      proofJson,
      existing.id,
    )

    createNotification(existing.requested_by, {
      type: 'payment_request_reviewed',
      title: action === 'approve' ? 'Chi phí đã duyệt' : 'Chi phí bị từ chối',
      message: `${existing.request_number} — ${action === 'approve' ? 'Đã duyệt' : 'Từ chối'}`,
      entityType: 'payment_request',
      entityId: existing.id,
    })

    const updated = db
      .prepare(
        `SELECT pr.*, c.contract_number, cu.name AS customer_name,
                ru.name AS requested_by_name, rv.name AS reviewed_by_name
         FROM payment_requests pr
         LEFT JOIN contracts c ON c.id = pr.contract_id
         LEFT JOIN customers cu ON cu.id = c.customer_id
         LEFT JOIN users ru ON ru.id = pr.requested_by
         LEFT JOIN users rv ON rv.id = pr.reviewed_by
         WHERE pr.id = ?`,
      )
      .get(existing.id) as Record<string, unknown>

    res.json(mapRow(updated))
  } catch (err: unknown) {
    console.error('Error reviewing payment request:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PATCH /api/payment-requests/:id/mark-paid
router.patch('/:id/mark-paid', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canReviewPaymentRequest(user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền xác nhận thanh toán' })
    }

    const existing = db
      .prepare('SELECT id, status, requested_by, request_number FROM payment_requests WHERE id = ?')
      .get(req.params.id) as
      | { id: number; status: string; requested_by: number; request_number: string }
      | undefined

    if (!existing) return res.status(404).json({ error: 'Không tìm thấy chi phí' })
    if (existing.status !== 'approved') {
      return res.status(400).json({ error: 'Chỉ đánh dấu đã thanh toán khi chi phí đã được duyệt' })
    }

    const { payment_proof_images } = req.body as { payment_proof_images?: string[] }
    let proofJson: string | null = null
    if (Array.isArray(payment_proof_images) && payment_proof_images.length > 0) {
      proofJson = JSON.stringify(payment_proof_images)
    }

    db.prepare(
      `UPDATE payment_requests
       SET status = 'paid',
           payment_proof_images = COALESCE(?, payment_proof_images),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
    ).run(proofJson, existing.id)

    createNotification(existing.requested_by, {
      type: 'payment_request_paid',
      title: 'Chi phí đã chi trả',
      message: `${existing.request_number} đã được xác nhận thanh toán`,
      entityType: 'payment_request',
      entityId: existing.id,
    })

    const updated = db
      .prepare(
        `SELECT pr.*, c.contract_number, cu.name AS customer_name,
                ru.name AS requested_by_name, rv.name AS reviewed_by_name
         FROM payment_requests pr
         LEFT JOIN contracts c ON c.id = pr.contract_id
         LEFT JOIN customers cu ON cu.id = c.customer_id
         LEFT JOIN users ru ON ru.id = pr.requested_by
         LEFT JOIN users rv ON rv.id = pr.reviewed_by
         WHERE pr.id = ?`,
      )
      .get(existing.id) as Record<string, unknown>

    res.json(mapRow(updated))
  } catch (err: unknown) {
    console.error('Error marking payment request paid:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/payment-requests/:id — chỉ admin / dev
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canDeletePaymentRequest(user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền xóa chi phí' })
    }

    const existing = db
      .prepare('SELECT id, request_number FROM payment_requests WHERE id = ?')
      .get(req.params.id) as { id: number; request_number: string } | undefined

    if (!existing) return res.status(404).json({ error: 'Không tìm thấy chi phí' })

    db.prepare('DELETE FROM payment_requests WHERE id = ?').run(existing.id)

    res.json({ success: true, id: existing.id, request_number: existing.request_number })
  } catch (err: unknown) {
    console.error('Error deleting payment request:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
