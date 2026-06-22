import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { UserRole } from '../types/index.js'
import { syncCustomerToTickets, syncUserToCustomers } from '../database/sync.js'
import { CUSTOMER_INVERTERS_WITH_MODEL_SQL } from '../database/dataModel.js'
import { createNotification, notifyUsersByRoles } from '../services/notificationService.js'
import { stripContractFinancialFields } from '../utils/contractFinance.js'

const router = Router()

function dedupeInverters(list: any[]): any[] {
  const seen = new Set<number>()
  return list.filter((inv) => {
    if (!inv?.id || seen.has(inv.id)) return false
    seen.add(inv.id)
    return true
  })
}

function fetchInvertersByCustomerId(customerId: number): any[] {
  try {
    return db.prepare(CUSTOMER_INVERTERS_WITH_MODEL_SQL).all(customerId, customerId) as any[]
  } catch {
    try {
      return db.prepare(`
        SELECT DISTINCT i.*
        FROM inverters i
        WHERE i.customer_id = ?
           OR i.id IN (
             SELECT ci.inverter_id
             FROM contract_inverters ci
             INNER JOIN contracts ct ON ct.id = ci.contract_id
             WHERE ct.customer_id = ?
           )
      `).all(customerId, customerId) as any[]
    } catch {
      return []
    }
  }
}

// Get all customers (only users with END_USER and DISTRIBUTOR roles)
router.get('/', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user
    if (user && (user.role === UserRole.TECHNICIAN || user.role === UserRole.WAREHOUSE)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    const { search, customer_type, page = '1', limit = '1000' } = req.query

    let query = `
      SELECT
        c.id, c.name, c.email, c.phone, c.address,
        c.customer_type as type, c.customer_type,
        c.tax_code, c.contact_person, c.notes,
        c.representative_name, c.representative_position, c.authorization_doc,
        c.recipient_name, c.recipient_address, c.recipient_phone,
        c.contact_user_id, c.created_at,
        c.contact_person  AS contact_name,
        c.contact_email   AS contact_email,
        c.contact_phone   AS contact_phone,
        c.contact_address AS contact_address
      FROM customers c
      WHERE 1=1
    `
    const params: any[] = []

    if (search) {
      query += ` AND (c.name LIKE ? OR c.email LIKE ? OR c.tax_code LIKE ?
                   OR c.contact_person LIKE ?)`
      const s = `%${search}%`
      params.push(s, s, s, s)
    }
    if (customer_type) { query += ' AND c.customer_type = ?'; params.push(customer_type) }

    query += ' ORDER BY c.created_at DESC'

    const allCustomers = db.prepare(query).all(...params) as any[]

    const limitNum = parseInt(limit as string)
    const offset = (parseInt(page as string) - 1) * limitNum
    const paginatedCustomers = allCustomers.slice(offset, offset + limitNum)

    res.json({
      customers: paginatedCustomers,
      data: paginatedCustomers,
      pagination: {
        page: parseInt(page as string),
        limit: limitNum,
        total: allCustomers.length,
        totalPages: Math.ceil(allCustomers.length / limitNum),
      },
    })
  } catch (error) {
    console.error('Get customers error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get customer by ID — luôn ưu tiên customers.id; portal user chỉ khi prefix user_
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user
    if (user && (user.role === UserRole.TECHNICIAN || user.role === UserRole.WAREHOUSE)) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }
    const id = req.params.id
    let customer: any = null
    let inverters: any[] = []
    let tickets: any[] = []

    const isPortalUserId = id.startsWith('user_')
    const numericId = isPortalUserId
      ? parseInt(id.replace('user_', ''), 10)
      : parseInt(id, 10)

    if (isNaN(numericId) || numericId <= 0) {
      return res.status(400).json({ error: 'Invalid customer id' })
    }

    const customerSelectSql = `
      SELECT c.id, c.name, c.email, c.phone, c.address,
             c.customer_type as type, c.customer_type,
             c.organization, c.tax_code as code, c.tax_code,
             c.contact_person, c.representative_name, c.representative_position, c.authorization_doc,
             c.recipient_name, c.recipient_address, c.recipient_phone,
             c.notes, c.user_id, c.contact_user_id,
             c.created_at, c.updated_at, 'customer' as source,
             c.contact_person  AS contact_name,
             c.contact_email   AS contact_email,
             c.contact_phone   AS contact_phone,
             c.contact_address AS contact_address
      FROM customers c
      WHERE c.id = ?
    `

    const loadTicketsForCustomer = (customerId: number, inverterList: any[]) => {
      try {
        const inverterIds = inverterList.filter((inv) => inv?.id).map((inv) => inv.id)
        if (inverterIds.length > 0) {
          const placeholders = inverterIds.map(() => '?').join(',')
          return db.prepare(`
            SELECT DISTINCT * FROM tickets
            WHERE customer_id = ? OR inverter_id IN (${placeholders})
            ORDER BY created_at DESC
          `).all(customerId, ...inverterIds) as any[]
        }
        return db.prepare(
          'SELECT * FROM tickets WHERE customer_id = ? ORDER BY created_at DESC',
        ).all(customerId) as any[]
      } catch {
        return []
      }
    }

    // CRM customer (mặc định khi không có prefix user_)
    if (!isPortalUserId) {
      customer = db.prepare(customerSelectSql).get(numericId) as any
      if (customer) {
        inverters = dedupeInverters(fetchInvertersByCustomerId(customer.id))
        tickets = loadTicketsForCustomer(customer.id, inverters)
      }
    }

    // Portal user — chỉ khi user_<id> hoặc không tìm thấy CRM record
    if (!customer) {
      const portalUser = db.prepare(`
        SELECT
          id, name, email, phone, address,
          role as type, role as customer_type,
          organization, code, NULL as tax_code, NULL as contact_person,
          created_at, updated_at, 'user' as source
        FROM users
        WHERE id = ? AND role IN ('end_user', 'distributor', 'dealer') AND status = 'active'
      `).get(numericId) as any

      if (portalUser) {
        customer = portalUser

        const linkedCustomer = db.prepare(`
          SELECT id FROM customers
          WHERE user_id = ? OR contact_user_id = ?
             OR (email IS NOT NULL AND email != '' AND email = ?)
             OR (phone IS NOT NULL AND phone != '' AND phone = ?)
          ORDER BY CASE WHEN user_id = ? OR contact_user_id = ? THEN 0 ELSE 1 END
          LIMIT 1
        `).get(numericId, numericId, portalUser.email || '', portalUser.phone || '', numericId, numericId) as { id: number } | undefined

        if (linkedCustomer) {
          inverters = dedupeInverters(fetchInvertersByCustomerId(linkedCustomer.id))
          tickets = loadTicketsForCustomer(linkedCustomer.id, inverters)
        } else {
          try {
            inverters = dedupeInverters(db.prepare(`
              SELECT i.*, m.capacity as model_capacity
              FROM inverters i
              LEFT JOIN models m ON i.model = m.name
              WHERE i.distributor_id = ? OR i.user_id = ?
            `).all(numericId, numericId) as any[])
          } catch {
            inverters = dedupeInverters(db.prepare(`
              SELECT i.* FROM inverters i
              WHERE i.distributor_id = ? OR i.user_id = ?
            `).all(numericId, numericId) as any[])
          }

          try {
            const inverterIds = inverters.filter((inv) => inv?.id).map((inv) => inv.id)
            if (inverterIds.length > 0) {
              const placeholders = inverterIds.map(() => '?').join(',')
              tickets = db.prepare(`
                SELECT DISTINCT * FROM tickets
                WHERE created_by = ? OR assigned_to = ? OR inverter_id IN (${placeholders})
                ORDER BY created_at DESC
              `).all(numericId, numericId, ...inverterIds) as any[]
            } else {
              tickets = db.prepare(
                'SELECT * FROM tickets WHERE created_by = ? OR assigned_to = ? ORDER BY created_at DESC',
              ).all(numericId, numericId) as any[]
            }
          } catch {
            tickets = []
          }
        }
      }
    }

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    const customerData = {
      id: customer.id,
      name: customer.name || null,
      email: customer.email || null,
      phone: customer.phone || null,
      address: customer.address || null,
      type: customer.type || customer.customer_type || null,
      customer_type: customer.customer_type || customer.type || null,
      organization: customer.organization || null,
      code: customer.code || null,
      tax_code: customer.tax_code || customer.code || null,
      contact_person: customer.contact_person || null,
      representative_name: customer.representative_name || null,
      representative_position: customer.representative_position || null,
      authorization_doc: customer.authorization_doc || null,
      contact_name: customer.contact_name || null,
      contact_email: customer.contact_email || null,
      contact_phone: customer.contact_phone || null,
      contact_address: customer.contact_address || null,
      recipient_name: customer.recipient_name || null,
      recipient_address: customer.recipient_address || null,
      recipient_phone: customer.recipient_phone || null,
      parent_distributor_id: customer.parent_distributor_id || null,
      distributor_name: customer.distributor_name || null,
      distributor_code: customer.distributor_code || null,
      source: customer.source || 'customer',
      created_at: customer.created_at || null,
      updated_at: customer.updated_at || null,
      inverters: inverters || [],
      tickets: tickets || [],
    }

    res.json(customerData)
  } catch (error) {
    console.error('Get customer error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create customer
router.post('/', authenticateToken, requireRole(UserRole.ADMIN, UserRole.SERVICE_CENTER, UserRole.DISTRIBUTOR), (req: AuthRequest, res) => {
  try {
    const authUser = req.user!
    const {
      name,
      email,
      phone,
      address,
      customer_type,
      organization,
      tax_code,
      contact_person,
      contact_phone,
      contact_email,
      contact_address,
      representative_name,
      representative_position,
      authorization_doc,
      recipient_name,
      recipient_address,
      recipient_phone,
      contact_user_id,
      user_id,
      notes,
    } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Name is required' })
    }

    if (!representative_name || !String(representative_name).trim()) {
      return res.status(400).json({ error: 'Người đại diện là bắt buộc' })
    }
    if (!representative_position || !String(representative_position).trim()) {
      return res.status(400).json({ error: 'Chức vụ người đại diện là bắt buộc' })
    }

    // Check if email already exists in customers table
    if (email) {
      const existingCustomer = db.prepare('SELECT id FROM customers WHERE email = ?').get(email) as any
      if (existingCustomer) {
        return res.status(400).json({ error: 'Email đã tồn tại trong hệ thống' })
      }
    }

    const resolvedContactUserId = contact_user_id || user_id || null

    // Get contact person name from users table if contact_user_id provided and contact_person not given
    let resolvedContactPerson = contact_person || null
    if (resolvedContactUserId && !resolvedContactPerson) {
      const contactUser = db.prepare('SELECT name FROM users WHERE id = ?').get(resolvedContactUserId) as any
      if (contactUser) resolvedContactPerson = contactUser.name
    }

    const result = db.prepare(`
      INSERT INTO customers (name, email, phone, address, customer_type, organization, tax_code, contact_person, contact_phone, contact_email, contact_address, representative_name, representative_position, authorization_doc, recipient_name, recipient_address, recipient_phone, contact_user_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      email || null,
      phone || null,
      address || null,
      customer_type || 'end_user',
      organization || null,
      tax_code || null,
      resolvedContactPerson,
      contact_phone || null,
      contact_email || null,
      contact_address || null,
      representative_name || null,
      representative_position || null,
      authorization_doc || null,
      recipient_name || null,
      recipient_address || null,
      recipient_phone || null,
      resolvedContactUserId,
      notes || null
    )

    const newCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid) as any

    try {
      const creator = db.prepare('SELECT name FROM users WHERE id = ?').get(authUser.id) as { name: string } | undefined
      const creatorName = creator?.name || 'Nhân viên'
      const customerId = Number(result.lastInsertRowid)

      createNotification(authUser.id, {
        type: 'customer_created',
        title: 'Khách hàng mới đã được tạo',
        message: `Bạn đã thêm khách hàng "${name}" vào hệ thống`,
        entityType: 'customer',
        entityId: customerId,
        data: { customer_name: name },
      })

      notifyUsersByRoles(
        [UserRole.ADMIN, UserRole.DEV, UserRole.SERVICE_CENTER],
        {
          type: 'customer_created',
          title: `Khách hàng mới: ${name}`,
          message: `${creatorName} đã thêm khách hàng "${name}"`,
          entityType: 'customer',
          entityId: customerId,
          data: { customer_name: name },
        },
        { excludeIds: [authUser.id] }
      )
    } catch (notifyErr) {
      console.error('Customer notification error (customer still created):', notifyErr)
    }

    res.status(201).json(newCustomer)
  } catch (error) {
    console.error('Create customer error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update customer (supports both users table and customers table)
router.put('/:id', authenticateToken, requireRole(UserRole.ADMIN, UserRole.SERVICE_CENTER, UserRole.DISTRIBUTOR), (req, res) => {
  try {
    const id = req.params.id
    const userId = id.startsWith('user_') ? parseInt(id.replace('user_', '')) : parseInt(id)
    
    const {
      name,
      email,
      phone,
      address,
      customer_type,
      organization,
      tax_code,
      contact_person,
      contact_phone,
      contact_email,
      contact_address,
      representative_name,
      representative_position,
      authorization_doc,
      recipient_name,
      recipient_address,
      recipient_phone,
      notes,
    } = req.body

    // First, check if it's a user ID (from users table)
    if (!isNaN(userId)) {
      const user = db.prepare(`
        SELECT id, email 
        FROM users 
        WHERE id = ? AND role IN ('end_user', 'distributor', 'dealer') AND status = 'active'
      `).get(userId) as { id: number; email: string } | undefined

      if (user) {
        // Update user in users table
        // Check if email is being changed and if it's already taken
        if (email && email !== user.email) {
          const emailCheck = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, userId) as { id: number } | undefined
          if (emailCheck) {
            return res.status(400).json({ error: 'Email already exists' })
          }
        }

        const updates: string[] = []
        const values: any[] = []

        if (name !== undefined) {
          updates.push('name = ?')
          values.push(name)
        }
        if (email !== undefined) {
          updates.push('email = ?')
          values.push(email)
        }
        if (phone !== undefined) {
          updates.push('phone = ?')
          values.push(phone || null)
        }
        if (address !== undefined) {
          updates.push('address = ?')
          values.push(address || null)
        }
        if (organization !== undefined) {
          updates.push('organization = ?')
          values.push(organization || null)
        }

        if (updates.length > 0) {
          updates.push('updated_at = CURRENT_TIMESTAMP')
          values.push(userId)

          db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values)
        }

        // Sync user to customers table
        syncUserToCustomers(userId)

        // Get updated user
        const updatedUser = db.prepare(`
          SELECT 
            id,
            name,
            email,
            phone,
            address,
            role as type,
            role as customer_type,
            organization,
            code,
            created_at,
            updated_at,
            'user' as source
          FROM users
          WHERE id = ?
        `).get(userId) as any

        return res.json(updatedUser)
      }
    }

    // If not a user, try to update in customers table
    const customerId = parseInt(id)
    if (isNaN(customerId)) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    const customer = db.prepare('SELECT id, email FROM customers WHERE id = ?').get(customerId) as { id: number; email: string } | undefined

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== customer.email) {
      const emailCheck = db.prepare('SELECT id FROM customers WHERE email = ? AND id != ?').get(email, customerId) as { id: number } | undefined
      if (emailCheck) {
        return res.status(400).json({ error: 'Email already exists' })
      }
    }

    db.prepare(`
      UPDATE customers
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          customer_type = COALESCE(?, customer_type),
          organization = COALESCE(?, organization),
          tax_code = COALESCE(?, tax_code),
          contact_person = COALESCE(?, contact_person),
          contact_phone = COALESCE(?, contact_phone),
          contact_email = COALESCE(?, contact_email),
          contact_address = COALESCE(?, contact_address),
          representative_name = COALESCE(?, representative_name),
          representative_position = COALESCE(?, representative_position),
          authorization_doc = COALESCE(?, authorization_doc),
          recipient_name = COALESCE(?, recipient_name),
          recipient_address = COALESCE(?, recipient_address),
          recipient_phone = COALESCE(?, recipient_phone),
          notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || null,
      email !== undefined ? (email || null) : null,
      phone || null,
      address || null,
      customer_type || null,
      organization || null,
      tax_code || null,
      contact_person || null,
      contact_phone || null,
      contact_email || null,
      contact_address || null,
      representative_name || null,
      representative_position || null,
      authorization_doc || null,
      recipient_name || null,
      recipient_address || null,
      recipient_phone || null,
      notes || null,
      customerId
    )

    // Sync customer to tickets
    syncCustomerToTickets(customerId)

    const updatedCustomer = db.prepare('SELECT *, "customer" as source FROM customers WHERE id = ?').get(customerId) as any

    res.json(updatedCustomer)
  } catch (error) {
    console.error('Update customer error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete customer
// Register inverter for a customer
router.post('/:id/inverters', authenticateToken, requireRole(UserRole.ADMIN, UserRole.SERVICE_CENTER, UserRole.DISTRIBUTOR, UserRole.END_USER), (req: AuthRequest, res) => {
  try {
    const customerId = parseInt(req.params.id)
    const authUser = req.user!
    
    if (isNaN(customerId)) {
      return res.status(400).json({ error: 'Invalid customer ID' })
    }

    // Get customer info
    const customer = db.prepare('SELECT id, user_id, email, phone, name FROM customers WHERE id = ?').get(customerId) as {
      id: number
      user_id: number | null
      email: string | null
      phone: string | null
      name: string
    } | undefined

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    // Nếu customer chưa có user_id, gán user_id của người đang đăng nhập
    let finalUserId: number | null = null
    if (!customer.user_id) {
      // Kiểm tra xem có user nào match với email/phone không
      let matchingUser: any = null
      if (customer.email) {
        matchingUser = db.prepare('SELECT id FROM users WHERE email = ? AND role IN (?, ?, ?) AND status = ?').get(
          customer.email, 'end_user', 'distributor', 'dealer', 'active'
        ) as { id: number } | undefined
      }
      if (!matchingUser && customer.phone) {
        matchingUser = db.prepare('SELECT id FROM users WHERE phone = ? AND role IN (?, ?, ?) AND status = ?').get(
          customer.phone, 'end_user', 'distributor', 'dealer', 'active'
        ) as { id: number } | undefined
      }
      
      // Nếu không tìm thấy user match, sử dụng user_id của người đang đăng nhập
      finalUserId = matchingUser ? matchingUser.id : authUser.id
      
      // Cập nhật customer với user_id
      db.prepare('UPDATE customers SET user_id = ? WHERE id = ?').run(finalUserId, customerId)
      console.log(`✅ Updated customer ${customerId} with user_id ${finalUserId}`)
    } else {
      finalUserId = customer.user_id
    }

    // Lấy thông tin inverter từ body
    const {
      serial_number,
      model,
      type,
      power_rating,
      installation_date,
      warranty_start_date,
      warranty_end_date,
      warranty_type,
      distributor_id,
      installation_address,
      location_lat,
      location_lng,
      status,
      notes,
    } = req.body

    if (!serial_number || !model) {
      return res.status(400).json({ error: 'Serial number and model are required' })
    }

    // Check if serial number already exists
    const existing = db.prepare('SELECT id FROM inverters WHERE serial_number = ?').get(serial_number) as any
    if (existing) {
      return res.status(400).json({ error: 'Serial number already exists' })
    }

    // Tạo inverter với customer_id và user_id
    const result = db.prepare(`
      INSERT INTO inverters (
        serial_number, model, type, power_rating, installation_date,
        warranty_start_date, warranty_end_date, warranty_type,
        customer_id, distributor_id, installation_address,
        location_lat, location_lng, status, notes, user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      serial_number,
      model,
      type || null,
      power_rating || null,
      installation_date || null,
      warranty_start_date || null,
      warranty_end_date || null,
      warranty_type || null,
      customerId,
      distributor_id || null,
      installation_address || null,
      location_lat || null,
      location_lng || null,
      status || 'active',
      notes || null,
      finalUserId
    )

    const newInverter = db.prepare('SELECT * FROM inverters WHERE id = ?').get(result.lastInsertRowid) as any

    // Create history entry
    db.prepare(`
      INSERT INTO inverter_history (inverter_id, event_type, title, description, event_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      result.lastInsertRowid,
      'registered',
      'Đăng ký thiết bị mới',
      `Thiết bị ${serial_number} đã được đăng ký vào hệ thống`,
      new Date().toISOString().split('T')[0],
      authUser.id
    )

    res.status(201).json(newInverter)
  } catch (error) {
    console.error('Register inverter for customer error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authenticateToken, requireRole(UserRole.ADMIN), (req, res) => {
  try {
    const customerId = parseInt(req.params.id)

    const customer = db.prepare('SELECT id FROM customers WHERE id = ?').get(customerId) as any
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' })
    }

    db.exec('BEGIN TRANSACTION')
    try {
      // SQLite FK rules: tickets/contracts/projects/rma CASCADE; inverters.customer_id SET NULL
      db.prepare('DELETE FROM customers WHERE id = ?').run(customerId)
      db.exec('COMMIT')
    } catch (deleteError) {
      db.exec('ROLLBACK')
      throw deleteError
    }

    res.status(204).send()
  } catch (error: any) {
    console.error('Delete customer error:', error)
    const related = {
      inverters: (db.prepare('SELECT COUNT(*) as count FROM inverters WHERE customer_id = ?').get(parseInt(req.params.id)) as { count: number }).count,
      tickets: (db.prepare('SELECT COUNT(*) as count FROM tickets WHERE customer_id = ?').get(parseInt(req.params.id)) as { count: number }).count,
      contracts: (db.prepare('SELECT COUNT(*) as count FROM contracts WHERE customer_id = ?').get(parseInt(req.params.id)) as { count: number }).count,
    }
    res.status(500).json({
      error: 'Cannot delete customer. Related records may still exist.',
      details: related,
      message: error?.message,
    })
  }
})

// GET /api/customers/:id/contracts
router.get('/:id/contracts', authenticateToken, (req, res) => {
  try {
    const user = (req as AuthRequest).user
    const customerId = parseInt(req.params.id)
    const contracts = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM contract_inverters ci WHERE ci.contract_id = c.id) AS device_count
      FROM contracts c
      WHERE c.customer_id = ?
      ORDER BY c.created_at DESC
    `).all(customerId) as Array<Record<string, unknown>>

    for (const c of contracts) {
      stripContractFinancialFields(user?.role, c)
    }

    res.json(contracts)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
