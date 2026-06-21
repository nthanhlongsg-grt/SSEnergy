import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { UserRole } from '../types/index.js'
import { createNotification, notifyUsersByRoles } from '../services/notificationService.js'
import { canViewContractFinance, canManageContracts, stripContractFinancialFields } from '../utils/contractFinance.js'

const router = Router()

/**
 * Đồng bộ ngày kết thúc bảo hành cho thiết bị thuộc hợp đồng.
 * Ngày bắt đầu = warranty_start_date đã nhập trên từng thiết bị trong hợp đồng (không dùng ngày nghiệm thu / xuất HĐ).
 * Ngày hết hạn = ngày bắt đầu + warranty_months của thiết bị.
 */
function addMonthsToDateString(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setMonth(date.getMonth() + months)
  const yy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

const syncContractDeviceWarranty = (contractId: number | string): void => {
  const rows = db
    .prepare(`
      SELECT i.id AS id, i.warranty_months AS warranty_months, i.warranty_start_date AS warranty_start_date
      FROM contract_inverters ci
      JOIN inverters i ON i.id = ci.inverter_id
      WHERE ci.contract_id = ?
    `)
    .all(contractId) as Array<{ id: number; warranty_months: number | null; warranty_start_date: string | null }>

  const upd = db.prepare(
    'UPDATE inverters SET warranty_end_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  )

  for (const r of rows) {
    const months = Number(r.warranty_months) || 0
    const startDate = r.warranty_start_date ? String(r.warranty_start_date).slice(0, 10) : null
    if (startDate && months > 0) {
      upd.run(addMonthsToDateString(startDate, months), r.id)
    } else {
      upd.run(null, r.id)
    }
  }
}

/** Gán customer_id của thiết bị theo khách hàng trên hợp đồng liên kết */
const syncInverterCustomersFromContract = (contractId: number | string): void => {
  const contract = db
    .prepare('SELECT customer_id FROM contracts WHERE id = ?')
    .get(contractId) as { customer_id: number } | undefined
  if (!contract?.customer_id) return

  const rows = db
    .prepare('SELECT inverter_id FROM contract_inverters WHERE contract_id = ?')
    .all(contractId) as Array<{ inverter_id: number }>

  const upd = db.prepare(
    'UPDATE inverters SET customer_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
  )
  for (const r of rows) {
    upd.run(contract.customer_id, r.inverter_id)
  }
}

const DEFAULT_DELIVERY_DAYS = 7
const DEFAULT_WARRANTY_MONTHS = 12

export interface ContractPaperwork {
  invoice_date?: string | null
  payment_received_date?: string | null
  device_delivery_date?: string | null
  paper_sent_date?: string | null
  shipping_carrier?: string | null
  tracking_number?: string | null
  contract_returned_date?: string | null
  verification_date?: string | null
}

const emptyPaperwork = (): ContractPaperwork => ({
  invoice_date: null,
  payment_received_date: null,
  device_delivery_date: null,
  paper_sent_date: null,
  shipping_carrier: '',
  tracking_number: '',
  contract_returned_date: null,
  verification_date: null,
})

const parsePaperwork = (raw: unknown): ContractPaperwork => {
  if (!raw) return emptyPaperwork()
  try {
    const o = typeof raw === 'string' ? JSON.parse(raw) : raw
    return { ...emptyPaperwork(), ...(o as object) }
  } catch {
    return emptyPaperwork()
  }
}

const normalizeContractJson = (contract: Record<string, unknown>): void => {
  try {
    contract.items = contract.items ? JSON.parse(contract.items as string) : []
  } catch {
    contract.items = []
  }
  contract.paperwork = parsePaperwork(contract.paperwork)
}

const normalizeDateField = (v: unknown): string | null => {
  if (v === undefined || v === null || v === '') return null
  return String(v).slice(0, 10)
}

const hasAnyPaperworkDate = (
  signed_date: string | null,
  end_date: string,
  paperwork: ContractPaperwork
): boolean => {
  if (signed_date) return true
  if (end_date.trim()) return true
  return PAPERWORK_DATE_FIELDS.some(f => {
    const v = paperwork[f]
    return v !== undefined && v !== null && String(v).trim() !== ''
  })
}

const mergePaperworkFromBody = (
  existing: ContractPaperwork,
  body: Record<string, unknown>
): ContractPaperwork => {
  const next = { ...existing }
  const dateKeys: (keyof ContractPaperwork)[] = [
    'invoice_date',
    'payment_received_date',
    'device_delivery_date',
    'paper_sent_date',
    'contract_returned_date',
    'verification_date',
  ]
  for (const key of dateKeys) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      next[key] = normalizeDateField(body[key]) as ContractPaperwork[typeof key]
    }
  }
  if (Object.prototype.hasOwnProperty.call(body, 'shipping_carrier')) {
    next.shipping_carrier = body.shipping_carrier ? String(body.shipping_carrier).trim() : ''
  }
  if (Object.prototype.hasOwnProperty.call(body, 'tracking_number')) {
    next.tracking_number = body.tracking_number ? String(body.tracking_number).trim() : ''
  }
  return next
}

const PAPERWORK_DATE_FIELDS: (keyof ContractPaperwork)[] = [
  'invoice_date',
  'payment_received_date',
  'device_delivery_date',
  'paper_sent_date',
  'contract_returned_date',
  'verification_date',
]

/** Chưa có ngày nhận thanh toán trong paperwork JSON */
const UNPAID_PAYMENT_SQL = `(
  c.paperwork IS NULL
  OR TRIM(c.paperwork) = ''
  OR TRIM(c.paperwork) = '{}'
  OR NULLIF(TRIM(json_extract(c.paperwork, '$.payment_received_date')), '') IS NULL
)`

const ACTIVE_UNPAID_SQL = `c.status = 'active' AND ${UNPAID_PAYMENT_SQL}`

/** Chưa có ngày giao máy đi trong paperwork JSON */
const DEVICE_NOT_DELIVERED_SQL = `(
  c.paperwork IS NULL
  OR TRIM(c.paperwork) = ''
  OR TRIM(c.paperwork) = '{}'
  OR NULLIF(TRIM(json_extract(c.paperwork, '$.device_delivery_date')), '') IS NULL
)`

const ACTIVE_UNDELIVERED_SQL = `c.status = 'active' AND ${DEVICE_NOT_DELIVERED_SQL}`

const CONTRACT_STATUSES = ['draft', 'active', 'expired', 'cancelled'] as const
type ContractStatus = (typeof CONTRACT_STATUSES)[number]

const isStaffRole = (role: UserRole): boolean =>
  role !== UserRole.END_USER && role !== UserRole.DISTRIBUTOR

/** User IDs that may access contracts of a customer (owner + distributor-linked end users) */
const getLinkedUserIds = (user: NonNullable<AuthRequest['user']>): number[] => {
  if (user.role === UserRole.DISTRIBUTOR) {
    const linked = db
      .prepare(`SELECT id FROM users WHERE parent_distributor_id = ? AND role = ?`)
      .all(user.id, UserRole.END_USER) as Array<{ id: number }>
    return linked.length > 0 ? [user.id, ...linked.map(u => u.id)] : [user.id]
  }
  return [user.id]
}

const canAccessContractCustomer = (user: NonNullable<AuthRequest['user']>, customerId: number): boolean => {
  if (isStaffRole(user.role)) return true
  const userIds = getLinkedUserIds(user)
  const placeholders = userIds.map(() => '?').join(', ')
  const row = db
    .prepare(`
      SELECT 1 FROM customers
      WHERE id = ? AND (user_id IN (${placeholders}) OR contact_user_id IN (${placeholders}))
    `)
    .get(customerId, ...userIds, ...userIds)
  return !!row
}

const customerScopeClause = (user: NonNullable<AuthRequest['user']>): { clause: string; params: number[] } => {
  if (isStaffRole(user.role)) return { clause: '', params: [] }
  const userIds = getLinkedUserIds(user)
  const placeholders = userIds.map(() => '?').join(', ')
  return {
    clause: ` AND EXISTS (
      SELECT 1 FROM customers cu_access
      WHERE cu_access.id = c.customer_id
        AND (cu_access.user_id IN (${placeholders}) OR cu_access.contact_user_id IN (${placeholders}))
    )`,
    params: [...userIds, ...userIds],
  }
}

/** Ghi chú nội bộ — chỉ nhân viên xem được; giá trị HĐ — chỉ kế toán/admin */
const stripInternalFields = (user: AuthRequest['user'], contract: Record<string, unknown>): void => {
  if (user?.role === UserRole.END_USER) {
    delete contract.notes
  }
  stripContractFinancialFields(user?.role, contract)
}

const generateContractNumber = (): string => {
  const year = new Date().getFullYear()
  const row = db
    .prepare(`SELECT COUNT(*) as count FROM contracts WHERE contract_number LIKE 'CT-${year}-%'`)
    .get() as { count: number }
  const seq = String(row.count + 1).padStart(4, '0')
  return `CT-${year}-${seq}`
}

// GET /api/contracts/customer-inverters?customer_id=X
router.get('/customer-inverters', authenticateToken, (req, res) => {
  try {
    const { customer_id } = req.query
    if (!customer_id) return res.status(400).json({ error: 'customer_id required' })

    const inverters = db
      .prepare(`
        SELECT i.id, i.serial_number, i.model, i.type, i.power_rating, i.status,
               COALESCE(m.manufacturer, '') AS manufacturer
        FROM inverters i
        LEFT JOIN models m ON m.name = i.model
        WHERE i.customer_id = ? AND i.status != 'deleted'
        ORDER BY i.model, i.serial_number
      `)
      .all(customer_id)

    res.json(inverters)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/contracts - list all contracts
router.get('/', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user
    if (user && (user.role === UserRole.TECHNICIAN || user.role === UserRole.WAREHOUSE)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    const { status, customer_id, search, unpaid, undelivered, contract_type, from, to, page = '1', limit = '20' } = req.query

    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)))
    const offset = (pageNum - 1) * limitNum

    let where = '1=1'
    const params: any[] = []

    if (status) { where += ' AND c.status = ?'; params.push(status) }
    if (customer_id) { where += ' AND c.customer_id = ?'; params.push(customer_id) }
    if (contract_type) { where += ' AND c.contract_type = ?'; params.push(contract_type) }
    if (search) {
      where += ' AND (c.contract_number LIKE ? OR c.title LIKE ? OR cu.name LIKE ?)'
      const like = `%${search}%`
      params.push(like, like, like)
    }
    if (unpaid === '1' || unpaid === 'true') {
      where += ` AND ${ACTIVE_UNPAID_SQL}`
    }
    if (undelivered === '1' || undelivered === 'true') {
      where += ` AND ${ACTIVE_UNDELIVERED_SQL}`
    }
    if (from && to) {
      where += ` AND DATE(COALESCE(c.signed_date, c.created_at)) >= DATE(?) AND DATE(COALESCE(c.signed_date, c.created_at)) <= DATE(?)`
      params.push(from, to)
    }

    const scope = customerScopeClause(user!)
    where += scope.clause
    params.push(...scope.params)

    const contracts = db
      .prepare(`
        SELECT c.*,
          cu.name  AS customer_name,
          cu.phone AS customer_phone,
          cu.contact_person AS customer_contact,
          u.name   AS created_by_name
        FROM contracts c
        LEFT JOIN customers cu ON cu.id = c.customer_id
        LEFT JOIN users     u  ON u.id  = c.created_by
        WHERE ${where}
        ORDER BY c.created_at DESC
        LIMIT ? OFFSET ?
      `)
      .all(...params, limitNum, offset) as any[]

    for (const c of contracts) {
      normalizeContractJson(c)
      stripInternalFields(user, c)
    }

    const total = (
      db.prepare(`SELECT COUNT(*) as count FROM contracts c LEFT JOIN customers cu ON cu.id = c.customer_id WHERE ${where}`).get(...params) as { count: number }
    ).count

    res.json({ contracts, total, page: pageNum, limit: limitNum })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/contracts/stats
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!isStaffRole(user.role)) {
      return res.status(403).json({ error: 'Không có quyền xem thống kê hợp đồng' })
    }
    const rows = db
      .prepare(`SELECT status, COUNT(*) as count FROM contracts GROUP BY status`)
      .all() as Array<{ status: string; count: number }>

    const stats: Record<string, number> = { draft: 0, active: 0, expired: 0, cancelled: 0 }
    rows.forEach(r => { stats[r.status] = r.count })
    stats.total = Object.values(stats).reduce((a, b) => a + b, 0)

    // Expiring soon (within 30 days)
    const soon = db
      .prepare(`SELECT COUNT(*) as count FROM contracts WHERE status = 'active' AND end_date <= date('now', '+30 days') AND end_date >= date('now')`)
      .get() as { count: number }
    stats.expiring_soon = soon.count

    const activeUnpaid = db
      .prepare(`SELECT COUNT(*) as count FROM contracts c WHERE ${ACTIVE_UNPAID_SQL}`)
      .get() as { count: number }
    stats.active_unpaid = activeUnpaid.count

    res.json(stats)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/contracts/dashboard-metrics — tóm tắt HĐ cho dashboard
router.get('/dashboard-metrics', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!isStaffRole(user.role)) {
      return res.status(403).json({ error: 'Không có quyền xem thống kê hợp đồng' })
    }

    const allUnpaid = db
      .prepare(
        `SELECT COUNT(*) as unpaid_count, COALESCE(SUM(c.value), 0) as total_unpaid_debt
         FROM contracts c WHERE ${ACTIVE_UNPAID_SQL}`,
      )
      .get() as { unpaid_count: number; total_unpaid_debt: number }

    const draftStats = db
      .prepare(`SELECT COUNT(*) as draft_count FROM contracts WHERE status = 'draft'`)
      .get() as { draft_count: number }

    const undeliveredContracts = db
      .prepare(`SELECT COUNT(*) as undelivered_contract_count FROM contracts c WHERE ${ACTIVE_UNDELIVERED_SQL}`)
      .get() as { undelivered_contract_count: number }

    const undeliveredDevices = db
      .prepare(
        `SELECT COUNT(DISTINCT ci.inverter_id) as undelivered_device_count
         FROM contract_inverters ci
         JOIN contracts c ON c.id = ci.contract_id
         WHERE ${ACTIVE_UNDELIVERED_SQL}`,
      )
      .get() as { undelivered_device_count: number }

    const showFinance = canViewContractFinance(user.role)

    res.json({
      total_unpaid_debt: showFinance ? allUnpaid.total_unpaid_debt : 0,
      unpaid_count: allUnpaid.unpaid_count,
      draft_count: draftStats.draft_count,
      undelivered_contract_count: undeliveredContracts.undelivered_contract_count,
      undelivered_device_count: undeliveredDevices.undelivered_device_count,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/contracts/:id
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user
    if (user && (user.role === UserRole.TECHNICIAN || user.role === UserRole.WAREHOUSE)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    const contract = db
      .prepare(`
        SELECT c.*,
          cu.name  AS customer_name,
          cu.email AS customer_email,
          cu.phone AS customer_phone,
          cu.address AS customer_address,
          cu.tax_code AS customer_tax_code,
          cu.representative_name AS customer_representative_name,
          cu.representative_position AS customer_representative_position,
          cu.contact_person AS customer_contact_name,
          cu.contact_phone AS customer_contact_phone,
          cu.contact_email AS customer_contact_email,
          cu.contact_address AS customer_contact_address,
          cu.recipient_name AS customer_recipient_name,
          cu.recipient_phone AS customer_recipient_phone,
          cu.recipient_address AS customer_recipient_address,
          u.name   AS created_by_name
        FROM contracts c
        LEFT JOIN customers cu ON cu.id = c.customer_id
        LEFT JOIN users     u  ON u.id  = c.created_by
        WHERE c.id = ?
      `)
      .get(req.params.id) as any

    if (!contract) return res.status(404).json({ error: 'Không tìm thấy hợp đồng' })

    if (!canAccessContractCustomer(user!, contract.customer_id)) {
      return res.status(403).json({ error: 'Bạn không có quyền xem hợp đồng này' })
    }

    normalizeContractJson(contract)

    const inverters = db
      .prepare(`
        SELECT
          i.id, i.serial_number, i.model, i.type, i.power_rating, i.status,
          i.installation_address, i.warranty_start_date, i.warranty_end_date,
          i.warranty_months, i.notes, i.project_name,
          i.installation_date,
          COALESCE(i.manufacturer, m.manufacturer, '') AS manufacturer,
          (SELECT COUNT(*) FROM tickets t WHERE t.inverter_id = i.id) AS ticket_count,
          (SELECT COUNT(*) FROM service_reports sr JOIN tickets t2 ON t2.id = sr.ticket_id WHERE t2.inverter_id = i.id) AS repair_count,
          (SELECT MAX(sr.service_date) FROM service_reports sr JOIN tickets t2 ON t2.id = sr.ticket_id WHERE t2.inverter_id = i.id) AS last_repair_date
        FROM contract_inverters ci
        JOIN inverters i ON i.id = ci.inverter_id
        LEFT JOIN models m ON m.name = i.model
        WHERE ci.contract_id = ?
        ORDER BY i.model, i.serial_number
      `)
      .all(req.params.id)

    // For each inverter, get linked tickets (last 3)
    const invertersWithTickets = (inverters as any[]).map(inv => {
      const tickets = db.prepare(`
        SELECT t.id, t.ticket_number, t.title, t.status, t.priority, t.created_at, t.resolved_at
        FROM tickets t
        WHERE t.inverter_id = ?
        ORDER BY t.created_at DESC
        LIMIT 3
      `).all(inv.id)
      return { ...inv, tickets }
    })

    stripInternalFields(user, contract)
    res.json({ ...(contract as object), inverters: invertersWithTickets })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/contracts/:id/inverters  — inverters by customer for selection
router.get('/:id/available-inverters', authenticateToken, (req, res) => {
  try {
    const contract = db.prepare('SELECT customer_id FROM contracts WHERE id = ?').get(req.params.id) as any
    if (!contract) return res.status(404).json({ error: 'Không tìm thấy hợp đồng' })

    const inverters = db
      .prepare(`SELECT id, serial_number, model, type, power_rating, installation_address FROM inverters WHERE customer_id = ? AND status != 'deleted'`)
      .all(contract.customer_id)
    res.json(inverters)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/contracts/:id/inverters — replace inverter list
router.put('/:id/inverters', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canManageContracts(user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa hợp đồng' })
    }
    const { inverter_ids } = req.body as { inverter_ids: number[] }
    const existing = db.prepare('SELECT id, end_date FROM contracts WHERE id = ?').get(req.params.id) as { id: number; end_date?: string } | undefined
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy hợp đồng' })

    db.prepare('DELETE FROM contract_inverters WHERE contract_id = ?').run(req.params.id)
    const insert = db.prepare('INSERT OR IGNORE INTO contract_inverters (contract_id, inverter_id) VALUES (?, ?)')
    for (const invId of (inverter_ids || [])) {
      insert.run(req.params.id, invId)
    }
    syncContractDeviceWarranty(req.params.id)
    syncInverterCustomersFromContract(req.params.id)
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/contracts
router.post('/', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user
    if (!user || !canManageContracts(user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền tạo hợp đồng' })
    }
    const { customer_id, contract_number: bodyNumber, title, contract_type, start_date, end_date, value, status, description, notes, signed_date, delivery_days, warranty_months, items, vat_rate, inverter_ids } = req.body

    if (!customer_id) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc: customer_id' })
    }

    // Kiểm tra người tạo (token) còn tồn tại — tránh lỗi FOREIGN KEY khó hiểu
    const creator = db.prepare('SELECT id FROM users WHERE id = ?').get(user!.id)
    if (!creator) {
      return res.status(401).json({ error: 'Phiên đăng nhập không hợp lệ, vui lòng đăng xuất và đăng nhập lại' })
    }

    // Kiểm tra khách hàng tồn tại
    const customerRow = db.prepare('SELECT id FROM customers WHERE id = ?').get(customer_id)
    if (!customerRow) {
      return res.status(400).json({ error: 'Khách hàng không tồn tại, vui lòng chọn lại' })
    }

    const contract_number = (bodyNumber && String(bodyNumber).trim()) || generateContractNumber()
    const contractTitle = (title && String(title).trim()) || contract_number
    const canSetFinance = canViewContractFinance(user!.role)
    const contractValue = canSetFinance ? (value || 0) : 0
    const contractVatRate = canSetFinance ? (vat_rate ?? 8) : 8
    const itemsJson = canSetFinance
      ? (Array.isArray(items) ? JSON.stringify(items) : (items || null))
      : null

    const result = db
      .prepare(`
        INSERT INTO contracts (contract_number, customer_id, title, contract_type, start_date, end_date, value, status, description, notes, signed_date, delivery_days, warranty_months, items, vat_rate, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        contract_number, customer_id, contractTitle,
        contract_type || 'service', start_date || '', end_date || '',
        contractValue, status || 'draft',
        description || null, notes || null, signed_date || null,
        (delivery_days !== undefined && delivery_days !== null && delivery_days !== '') ? Number(delivery_days) : DEFAULT_DELIVERY_DAYS,
        (warranty_months !== undefined && warranty_months !== null && warranty_months !== '') ? Number(warranty_months) : DEFAULT_WARRANTY_MONTHS,
        itemsJson, contractVatRate,
        user!.id
      )

    const newId = Number(result.lastInsertRowid)
    if (inverter_ids?.length) {
      const insert = db.prepare('INSERT OR IGNORE INTO contract_inverters (contract_id, inverter_id) VALUES (?, ?)')
      for (const invId of inverter_ids) insert.run(newId, invId)
    }
    syncInverterCustomersFromContract(newId)

    const created = db.prepare('SELECT * FROM contracts WHERE id = ?').get(newId) as any
    try { created.items = created.items ? JSON.parse(created.items) : [] } catch { created.items = [] }
    stripInternalFields(user, created)

    try {
      const creator = db.prepare('SELECT name FROM users WHERE id = ?').get(user!.id) as { name: string } | undefined
      const creatorName = creator?.name || 'Nhân viên'
      const contractId = Number(newId)

      createNotification(user!.id, {
        type: 'contract_created',
        title: `Hợp đồng ${contract_number} đã được tạo`,
        message: `Bạn đã tạo hợp đồng ${contract_number} thành công`,
        entityType: 'contract',
        entityId: contractId,
        data: { contract_number, customer_id },
      })

      notifyUsersByRoles(
        [UserRole.ADMIN, UserRole.DEV, UserRole.SERVICE_CENTER, UserRole.ACCOUNTING],
        {
          type: 'contract_created',
          title: `Hợp đồng mới ${contract_number}`,
          message: `${creatorName} đã tạo hợp đồng ${contract_number}`,
          entityType: 'contract',
          entityId: contractId,
          data: { contract_number, customer_id },
        },
        { excludeIds: [user!.id] }
      )
    } catch (notifyErr) {
      console.error('Contract notification error (contract still created):', notifyErr)
    }

    res.status(201).json(created)
  } catch (err: any) {
    if (typeof err?.message === 'string' && err.message.includes('UNIQUE') && err.message.includes('contract_number')) {
      return res.status(400).json({ error: 'Số hợp đồng đã tồn tại, vui lòng nhập số khác' })
    }
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/contracts/:id/status — cập nhật nhanh trạng thái (nhân viên + khách hàng liên quan)
router.patch('/:id/status', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    const { status } = req.body as { status?: string }

    if (!status || !CONTRACT_STATUSES.includes(status as ContractStatus)) {
      return res.status(400).json({ error: 'Trạng thái không hợp lệ' })
    }

    const existing = db
      .prepare('SELECT id, customer_id, status FROM contracts WHERE id = ?')
      .get(req.params.id) as { id: number; customer_id: number; status: string } | undefined

    if (!existing) return res.status(404).json({ error: 'Không tìm thấy hợp đồng' })

    if (!canAccessContractCustomer(user, existing.customer_id)) {
      return res.status(403).json({ error: 'Bạn không có quyền cập nhật hợp đồng này' })
    }

    db.prepare(`
      UPDATE contracts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(status, req.params.id)

    const updated = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id) as Record<string, unknown>
    try {
      updated.items = updated.items ? JSON.parse(updated.items as string) : []
    } catch {
      updated.items = []
    }
    stripInternalFields(user, updated)
    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/contracts/:id/paperwork — checklist hồ sơ giấy tờ
router.patch('/:id/paperwork', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    if (!canManageContracts(user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền cập nhật hồ sơ giấy tờ' })
    }

    const existing = db
      .prepare('SELECT id, customer_id, status, signed_date, end_date, paperwork FROM contracts WHERE id = ?')
      .get(req.params.id) as {
        id: number
        customer_id: number
        status: string
        signed_date: string | null
        end_date: string | null
        paperwork: string | null
      } | undefined
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy hợp đồng' })

    const body = req.body as Record<string, unknown>
    const existingPaperwork = parsePaperwork(existing.paperwork)
    const signed_date = Object.prototype.hasOwnProperty.call(body, 'signed_date')
      ? normalizeDateField(body.signed_date)
      : existing.signed_date
        ? String(existing.signed_date).slice(0, 10)
        : null
    const end_date = Object.prototype.hasOwnProperty.call(body, 'end_date')
      ? normalizeDateField(body.end_date) || ''
      : existing.end_date
        ? String(existing.end_date).slice(0, 10)
        : ''
    const paperworkObj = mergePaperworkFromBody(existingPaperwork, body)
    const paperwork = JSON.stringify(paperworkObj)

    const newStatus =
      existing.status === 'draft' && hasAnyPaperworkDate(signed_date, end_date, paperworkObj)
        ? 'active'
        : existing.status

    db.prepare(`
      UPDATE contracts
      SET signed_date = ?, end_date = ?, paperwork = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(signed_date, end_date, paperwork, newStatus, req.params.id)

    syncContractDeviceWarranty(req.params.id)

    const updated = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id) as Record<string, unknown>
    normalizeContractJson(updated)
    stripInternalFields(user, updated)
    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/contracts/:id
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    const { title, contract_type, start_date, end_date, value, status, description, notes, signed_date, delivery_days, warranty_months, items, vat_rate, inverter_ids } = req.body

    const existing = db.prepare('SELECT id, customer_id, value, vat_rate, items FROM contracts WHERE id = ?').get(req.params.id) as {
      id: number
      customer_id: number
      value: number
      vat_rate: number
      items: string | null
    } | undefined
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy hợp đồng' })

    if (!canManageContracts(user.role)) {
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa hợp đồng' })
    }

    const canSetFinance = canViewContractFinance(user.role)
    const contractValue = canSetFinance ? value : existing.value
    const contractVatRate = canSetFinance ? (vat_rate ?? 8) : existing.vat_rate
    const itemsJson = canSetFinance
      ? (Array.isArray(items) ? JSON.stringify(items) : (items ?? null))
      : existing.items

    db.prepare(`
      UPDATE contracts
      SET title = ?, contract_type = ?, start_date = ?, end_date = ?,
          value = ?, status = ?, description = ?, notes = ?, signed_date = ?,
          delivery_days = ?, warranty_months = ?, items = ?, vat_rate = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title, contract_type, start_date || '', end_date || '', contractValue, status, description, notes, signed_date,
      (delivery_days !== undefined && delivery_days !== null && delivery_days !== '') ? Number(delivery_days) : DEFAULT_DELIVERY_DAYS,
      (warranty_months !== undefined && warranty_months !== null && warranty_months !== '') ? Number(warranty_months) : DEFAULT_WARRANTY_MONTHS,
      itemsJson, contractVatRate, req.params.id
    )

    if (inverter_ids !== undefined) {
      db.prepare('DELETE FROM contract_inverters WHERE contract_id = ?').run(req.params.id)
      const insert = db.prepare('INSERT OR IGNORE INTO contract_inverters (contract_id, inverter_id) VALUES (?, ?)')
      for (const invId of (inverter_ids || [])) insert.run(req.params.id, invId)
      syncInverterCustomersFromContract(req.params.id)
    }

    syncContractDeviceWarranty(req.params.id)
    syncInverterCustomersFromContract(req.params.id)

    const updated = db.prepare('SELECT * FROM contracts WHERE id = ?').get(req.params.id) as any
    try { updated.items = updated.items ? JSON.parse(updated.items) : [] } catch { updated.items = [] }
    stripInternalFields(user, updated)
    res.json(updated)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/contracts/:id — chỉ dev
router.delete('/:id', authenticateToken, requireRole(UserRole.DEV), (req, res) => {
  try {
    const existing = db.prepare('SELECT id FROM contracts WHERE id = ?').get(req.params.id)
    if (!existing) return res.status(404).json({ error: 'Không tìm thấy hợp đồng' })

    db.prepare('DELETE FROM contract_inverters WHERE contract_id = ?').run(req.params.id)
    db.prepare('DELETE FROM contracts WHERE id = ?').run(req.params.id)
    res.status(204).send()
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
