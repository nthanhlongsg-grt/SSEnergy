import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { UserRole } from '../types/index.js'
import { syncInverterToTickets } from '../database/sync.js'

const router = Router()

/** Lấy trường khách hàng từ hợp đồng liên kết gần nhất (ưu tiên hơn customer_id trực tiếp trên máy) */
const contractCustomerColumn = (column: string): string => `
  (SELECT cu_ct.${column}
   FROM contract_inverters ci_ct
   JOIN contracts ct_ct ON ct_ct.id = ci_ct.contract_id
   JOIN customers cu_ct ON cu_ct.id = ct_ct.customer_id
   WHERE ci_ct.inverter_id = i.id
   ORDER BY ct_ct.updated_at DESC, ci_ct.contract_id DESC
   LIMIT 1)`

const inverterCustomerSelect = `
  COALESCE(${contractCustomerColumn('id')}, i.customer_id) AS customer_id,
  COALESCE(${contractCustomerColumn('name')}, c.name) AS customer_name,
  COALESCE(${contractCustomerColumn('email')}, c.email) AS customer_email,
  COALESCE(${contractCustomerColumn('phone')}, c.phone) AS customer_phone,
  COALESCE(${contractCustomerColumn('address')}, c.address) AS customer_address,
  (SELECT ct_ct.contract_number
   FROM contract_inverters ci_ct
   JOIN contracts ct_ct ON ct_ct.id = ci_ct.contract_id
   WHERE ci_ct.inverter_id = i.id
   ORDER BY ct_ct.updated_at DESC, ci_ct.contract_id DESC
   LIMIT 1) AS contract_number,
  (SELECT ct_ct.id
   FROM contract_inverters ci_ct
   JOIN contracts ct_ct ON ct_ct.id = ci_ct.contract_id
   WHERE ci_ct.inverter_id = i.id
   ORDER BY ct_ct.updated_at DESC, ci_ct.contract_id DESC
   LIMIT 1) AS contract_id
`

const isStaffRole = (role: UserRole): boolean =>
  role !== UserRole.END_USER && role !== UserRole.DISTRIBUTOR

/** User IDs có quyền xem thiết bị/hợp đồng của khách hàng (owner + end user thuộc đại lý) */
const getLinkedUserIds = (user: NonNullable<AuthRequest['user']>): number[] => {
  if (user.role === UserRole.DISTRIBUTOR) {
    const linked = db
      .prepare(`SELECT id FROM users WHERE parent_distributor_id = ? AND role = ?`)
      .all(user.id, UserRole.END_USER) as Array<{ id: number }>
    return linked.length > 0 ? [user.id, ...linked.map((u) => u.id)] : [user.id]
  }
  return [user.id]
}

/** Kiểm tra user portal có quyền xem thiết bị qua hợp đồng (user_id hoặc contact_user_id trên customers) */
const canAccessInverterViaContract = (
  user: NonNullable<AuthRequest['user']>,
  inverterId: number
): boolean => {
  if (isStaffRole(user.role)) return true
  const userIds = getLinkedUserIds(user)
  const placeholders = userIds.map(() => '?').join(', ')
  const row = db
    .prepare(`
      SELECT 1
      FROM contract_inverters ci
      JOIN contracts ct ON ct.id = ci.contract_id
      JOIN customers cu ON cu.id = ct.customer_id
      WHERE ci.inverter_id = ?
        AND (cu.user_id IN (${placeholders}) OR cu.contact_user_id IN (${placeholders}))
    `)
    .get(inverterId, ...userIds, ...userIds)
  return !!row
}

const appendContractPortalAccessFilter = (
  user: NonNullable<AuthRequest['user']>,
  baseQuery: string,
  params: unknown[]
): string => {
  if (isStaffRole(user.role)) return baseQuery
  const userIds = getLinkedUserIds(user)
  const placeholders = userIds.map(() => '?').join(', ')
  params.push(...userIds, ...userIds)
  return `${baseQuery} AND EXISTS (
    SELECT 1 FROM contract_inverters ci2
    JOIN contracts ct ON ct.id = ci2.contract_id
    JOIN customers cu ON cu.id = ct.customer_id
    WHERE ci2.inverter_id = i.id
      AND (cu.user_id IN (${placeholders}) OR cu.contact_user_id IN (${placeholders}))
  )`
}

// Get all inverters
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { search, model, type, status, warranty_status, customer_id, serial_number, page = '1', limit = '50' } = req.query
    const user = req.user!
    
    let baseQuery = `
      FROM inverters i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN users u ON i.distributor_id = u.id
      WHERE EXISTS (
        SELECT 1 FROM contract_inverters ci WHERE ci.inverter_id = i.id
      )
    `
    const params: any[] = []
    
    baseQuery = appendContractPortalAccessFilter(user, baseQuery, params)

    if (search) {
      const searchTerm = `%${search}%`
      baseQuery += ` AND (
        i.serial_number LIKE ?
        OR EXISTS (
          SELECT 1 FROM contract_inverters ci_s
          JOIN contracts ct_s ON ct_s.id = ci_s.contract_id
          JOIN customers cu_s ON cu_s.id = ct_s.customer_id
          WHERE ci_s.inverter_id = i.id AND (
            cu_s.name LIKE ? OR cu_s.organization LIKE ?
          )
        )
      )`
      params.push(searchTerm, searchTerm, searchTerm)
    }

    if (model) {
      baseQuery += ' AND i.model LIKE ?'
      params.push(`%${model}%`)
    }

    if (type) {
      baseQuery += ' AND i.type = ?'
      params.push(type)
    }

    if (status) {
      baseQuery += ' AND i.status = ?'
      params.push(status)
    }

    if (warranty_status) {
      if (warranty_status === 'active') {
        baseQuery += " AND i.warranty_end_date >= DATE('now') AND i.warranty_start_date IS NOT NULL AND i.warranty_end_date IS NOT NULL"
      } else if (warranty_status === 'expired') {
        baseQuery += " AND i.warranty_end_date < DATE('now') AND i.warranty_start_date IS NOT NULL AND i.warranty_end_date IS NOT NULL"
      } else if (warranty_status === 'pending') {
        baseQuery += " AND (i.warranty_start_date IS NULL OR i.warranty_end_date IS NULL)"
      }
    }

    if (customer_id) {
      baseQuery += ' AND i.customer_id = ?'
      params.push(parseInt(customer_id as string))
    }

    if (serial_number) {
      baseQuery += ' AND i.serial_number = ?'
      params.push(serial_number)
    }

    // Count total items for pagination
    const countResult = db.prepare(`SELECT COUNT(*) as count ${baseQuery}`).get(...params) as { count: number }
    const totalItems = countResult.count

    // Get paginated data
    const query = `
      SELECT i.*, 
             u.name as distributor_name,
             COALESCE(i.manufacturer, '') AS manufacturer,
             (SELECT GROUP_CONCAT(DISTINCT ct.contract_number)
              FROM contract_inverters ci3
              JOIN contracts ct ON ct.id = ci3.contract_id
              WHERE ci3.inverter_id = i.id) AS contract_numbers,
             (SELECT GROUP_CONCAT(DISTINCT cu_ct.name)
              FROM contract_inverters ci4
              JOIN contracts ct2 ON ct2.id = ci4.contract_id
              JOIN customers cu_ct ON cu_ct.id = ct2.customer_id
              WHERE ci4.inverter_id = i.id) AS customer_name
      ${baseQuery}
      ORDER BY i.created_at DESC LIMIT ? OFFSET ?
    `
    
    const limitNum = parseInt(limit as string)
    const offset = (parseInt(page as string) - 1) * limitNum
    const queryParams = [...params, limitNum, offset]

    const inverters = db.prepare(query).all(...queryParams)

    res.json({
      data: inverters,
      pagination: {
        page: parseInt(page as string),
        limit: limitNum,
        total: totalItems,
        totalPages: Math.ceil(totalItems / limitNum)
      },
    })
  } catch (error) {
    console.error('Get inverters error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    res.status(500).json({ error: errorMessage, details: String(error) })
  }
})

// Get inverter by ID
router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const inverterId = parseInt(req.params.id)
    const user = req.user!
    
    const inverter = db.prepare(`
      SELECT i.*,
             ${inverterCustomerSelect},
             COALESCE(NULLIF(TRIM(i.manufacturer), ''), m.manufacturer, '') AS manufacturer,
             u.name as distributor_name
      FROM inverters i
      LEFT JOIN customers c ON i.customer_id = c.id
      LEFT JOIN models m ON m.name = i.model
      LEFT JOIN users u ON i.distributor_id = u.id
      WHERE i.id = ?
    `).get(inverterId) as any

    if (!inverter) {
      return res.status(404).json({ error: 'Inverter not found' })
    }

    if (!canAccessInverterViaContract(user, inverterId)) {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const linkedContracts = db.prepare(`
      SELECT
        ct.id,
        ct.contract_number,
        ct.updated_at,
        cu.name AS customer_name,
        cu.email AS customer_email,
        cu.phone AS customer_phone,
        cu.address AS customer_address
      FROM contract_inverters ci
      JOIN contracts ct ON ct.id = ci.contract_id
      JOIN customers cu ON cu.id = ct.customer_id
      WHERE ci.inverter_id = ?
      ORDER BY ct.updated_at DESC, ci.contract_id DESC
    `).all(inverterId) as Array<{
      id: number
      contract_number: string
      customer_name: string
      customer_email: string | null
      customer_phone: string | null
      customer_address: string | null
    }>

    inverter.contracts = linkedContracts
    inverter.contract_numbers = linkedContracts.map(c => c.contract_number).join(', ')

    const contractIdFilter = req.query.contract_id
      ? parseInt(String(req.query.contract_id), 10)
      : null
    if (contractIdFilter && !Number.isNaN(contractIdFilter)) {
      const ctx = linkedContracts.find(c => c.id === contractIdFilter)
      if (ctx) {
        inverter.contract_id = ctx.id
        inverter.contract_number = ctx.contract_number
        inverter.customer_name = ctx.customer_name
        inverter.customer_email = ctx.customer_email
        inverter.customer_phone = ctx.customer_phone
        inverter.customer_address = ctx.customer_address
      }
    }

    // Get related tickets
    const tickets = db.prepare('SELECT * FROM tickets WHERE inverter_id = ? ORDER BY created_at DESC').all(inverterId)

    // Get error history
    const errorHistory = db.prepare(`
      SELECT ie.*,
             u.name as created_by_name,
             t.ticket_number
      FROM inverter_errors ie
      LEFT JOIN users u ON ie.created_by = u.id
      LEFT JOIN tickets t ON ie.ticket_id = t.id
      WHERE ie.inverter_id = ?
      ORDER BY ie.occurred_at DESC, ie.created_at DESC
    `).all(inverterId)

    // Get service history (from inverter_history and service_reports)
    const serviceHistory = db.prepare(`
      SELECT 
        sr.id,
        sr.report_number,
        sr.service_date,
        sr.service_type,
        sr.description,
        sr.diagnosis,
        sr.actions_taken,
        sr.status,
        sr.total_cost,
        u.name as technician_name,
        t.ticket_number,
        sr.created_at
      FROM service_reports sr
      INNER JOIN tickets t ON sr.ticket_id = t.id
      LEFT JOIN users u ON sr.technician_id = u.id
      WHERE t.inverter_id = ?
      ORDER BY sr.service_date DESC, sr.created_at DESC
    `).all(inverterId)

    // Get general history (maintenance/other events)
    const generalHistory = db.prepare(`
      SELECT ih.*,
             u.name as created_by_name
      FROM inverter_history ih
      LEFT JOIN users u ON ih.created_by = u.id
      WHERE ih.inverter_id = ?
      ORDER BY ih.event_date DESC, ih.created_at DESC
    `).all(inverterId)

    res.json({
      ...inverter,
      tickets,
      error_history: errorHistory,
      service_history: serviceHistory,
      general_history: generalHistory,
    })
  } catch (error) {
    console.error('Get inverter error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create inverter
router.post('/', authenticateToken, requireRole(UserRole.ADMIN, UserRole.SERVICE_CENTER, UserRole.DISTRIBUTOR, UserRole.END_USER), (req: AuthRequest, res) => {
  try {
    const {
      serial_number,
      model,
      manufacturer,
      type,
      power_rating,
      installation_date,
      warranty_start_date,
      warranty_end_date,
      warranty_months,
      warranty_type,
      customer_id,
      distributor_id,
      installation_address,
      location_lat,
      location_lng,
      status,
      notes,
    } = req.body

    console.log('📝 [POST /inverters] Request body:', { serial_number, model, customer_id, role: req.user?.role })

    if (!serial_number || !model) {
      return res.status(400).json({ error: 'Serial number and model are required' })
    }

    // Check if serial number already exists
    const existing = db.prepare('SELECT id FROM inverters WHERE serial_number = ?').get(serial_number) as any
    if (existing) {
      return res.status(400).json({ error: 'Serial number already exists' })
    }

    const authUser = req.user!
    
    // Get full user info from database
    const fullUser = db.prepare('SELECT id, name, email, phone, organization, address FROM users WHERE id = ?').get(authUser.id) as {
      id: number
      name: string
      email: string
      phone: string | null
      organization: string | null
      address: string | null
    } | undefined
    
    if (!fullUser) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // For END_USER and DISTRIBUTOR: automatically create/link customer record from their user info
    let finalCustomerId: number | null = null
    
    if (authUser.role === UserRole.END_USER || authUser.role === UserRole.DISTRIBUTOR) {
      // Quản lý customer bằng user_id - tìm customer đã link với user này
      const matchingCustomer = db.prepare(`
        SELECT id FROM customers 
        WHERE user_id = ?
        LIMIT 1
      `).get(fullUser.id) as { id: number } | undefined

      if (matchingCustomer) {
        // Sử dụng customer record đã có
        finalCustomerId = matchingCustomer.id
        
        // Cập nhật thông tin customer từ user
        db.prepare(`
          UPDATE customers 
          SET name = ?, email = ?, phone = ?, address = COALESCE(?, address), 
              organization = COALESCE(?, organization),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(
          fullUser.name,
          fullUser.email || null,
          fullUser.phone || null,
          fullUser.address || null,
          fullUser.organization || null,
          finalCustomerId
        )
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
          fullUser.address || null,
          customerType,
          fullUser.organization || null,
          fullUser.id
        )
        finalCustomerId = customerResult.lastInsertRowid as number
      }
    } else {
      // For ADMIN, DEV, SERVICE_CENTER: allow manual customer_id selection
      console.log(`🔍 [POST /inverters] Processing customer_id for ${authUser.role}:`, customer_id)
      
      if (customer_id !== undefined && customer_id !== null && customer_id !== '') {
        const customerIdNum = typeof customer_id === 'string' ? parseInt(customer_id) : Number(customer_id)
        console.log(`   Parsed customer_id:`, customerIdNum)
        
        if (!isNaN(customerIdNum) && customerIdNum > 0) {
          // First, check if it's a valid customer ID in customers table
          const validCustomer = db.prepare('SELECT id FROM customers WHERE id = ?').get(customerIdNum) as { id: number } | undefined
          
          if (validCustomer) {
            console.log(`   ✅ Valid customer found in customers table: ${validCustomer.id}`)
            finalCustomerId = customerIdNum
            
            // Đảm bảo customer record có user_id nếu customer đó là user
            const customerWithUserId = db.prepare('SELECT user_id FROM customers WHERE id = ?').get(customerIdNum) as { user_id: number | null } | undefined
            if (customerWithUserId && !customerWithUserId.user_id) {
              // Nếu customer không có user_id, kiểm tra xem có user nào match với email/phone không
              const customerInfo = db.prepare('SELECT email, phone FROM customers WHERE id = ?').get(customerIdNum) as { email: string | null; phone: string | null } | undefined
              if (customerInfo) {
                let matchingUser: any = null
                if (customerInfo.email) {
                  matchingUser = db.prepare('SELECT id FROM users WHERE email = ? AND role IN (?, ?, ?) AND status = ?').get(
                    customerInfo.email, 'end_user', 'distributor', 'dealer', 'active'
                  ) as { id: number } | undefined
                }
                if (!matchingUser && customerInfo.phone) {
                  matchingUser = db.prepare('SELECT id FROM users WHERE phone = ? AND role IN (?, ?, ?) AND status = ?').get(
                    customerInfo.phone, 'end_user', 'distributor', 'dealer', 'active'
                  ) as { id: number } | undefined
                }
                if (matchingUser) {
                  // Cập nhật customer với user_id
                  db.prepare('UPDATE customers SET user_id = ? WHERE id = ?').run(matchingUser.id, customerIdNum)
                  console.log(`   ✅ Updated customer ${customerIdNum} with user_id ${matchingUser.id}`)
                }
              }
            }
          } else {
            // Check if it's a user ID with customer role (end_user, distributor)
            console.log(`   🔍 Not found in customers table, checking users table...`)
            const user = db.prepare(`
              SELECT id, email, name, phone, address, role, organization 
              FROM users 
              WHERE id = ? AND role IN ('end_user', 'distributor', 'dealer') AND status = 'active'
            `).get(customerIdNum) as any
            
            if (user) {
              console.log(`   ✅ Found user with customer role: ${user.name} (role: ${user.role})`)
              
              // Tìm customer record bằng user_id
              const existingCustomer = db.prepare('SELECT id FROM customers WHERE user_id = ?').get(user.id) as { id: number } | undefined
              
              if (existingCustomer) {
                console.log(`   ✅ Found linked customer record: ${existingCustomer.id}`)
                finalCustomerId = existingCustomer.id
              } else {
                // Tạo customer record mới với user_id
                console.log(`   📝 Creating new customer record for user ${user.id}...`)
                const customerType = user.role === 'end_user' ? 'residential' : 'enterprise'
                const result = db.prepare(`
                  INSERT INTO customers (name, email, phone, address, customer_type, organization, user_id, status)
                  VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
                `).run(user.name, user.email, user.phone, user.address, customerType, user.organization, user.id)
                
                finalCustomerId = Number(result.lastInsertRowid)
                console.log(`   ✅ Created customer record with ID: ${finalCustomerId}`)
              }
            } else {
              console.warn(`   ⚠️ Invalid customer_id ${customerIdNum} - not found in customers or users table, setting to null`)
              finalCustomerId = null
            }
          }
        } else {
          // Invalid number format, set to null
          console.warn(`   ⚠️ Invalid customer_id format: ${customer_id}, setting to null`)
          finalCustomerId = null
        }
      } else {
        console.log(`   ℹ️ No customer_id provided, setting to null`)
      }
      // If customer_id not provided, finalCustomerId remains null
      console.log(`   📌 Final customer_id:`, finalCustomerId)
    }

    // Set user_id: 
    // - For END_USER and DISTRIBUTOR: always use their own user_id
    // - For ADMIN/SERVICE_CENTER: use customer's user_id if available, otherwise use current user's id
    let userId: number | null = null
    
    if (authUser.role === UserRole.END_USER || authUser.role === UserRole.DISTRIBUTOR) {
      userId = authUser.id
    } else {
      // For ADMIN/SERVICE_CENTER: use customer's user_id if available
      if (finalCustomerId) {
        const customerUserId = db.prepare('SELECT user_id FROM customers WHERE id = ?').get(finalCustomerId) as { user_id: number | null } | undefined
        userId = customerUserId?.user_id || authUser.id
      } else {
        userId = authUser.id
      }
    }
    
    const result = db.prepare(`
      INSERT INTO inverters (
        serial_number, model, manufacturer, type, power_rating, installation_date,
        warranty_start_date, warranty_end_date, warranty_months, warranty_type,
        customer_id, distributor_id, installation_address,
        location_lat, location_lng, status, notes, user_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      serial_number,
      model,
      manufacturer || null,
      type || null,
      power_rating || null,
      installation_date || null,
      warranty_start_date || null,
      warranty_end_date || null,
      (warranty_months !== undefined && warranty_months !== null && warranty_months !== '') ? Number(warranty_months) : null,
      warranty_type || null,
      finalCustomerId || null,
      distributor_id || null,
      installation_address || null,
      location_lat || null,
      location_lng || null,
      status || 'active',
      notes || null,
      userId
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
      (req as AuthRequest).user?.id || null
    )

    res.status(201).json(newInverter)
  } catch (error) {
    console.error('Create inverter error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    res.status(500).json({ error: errorMessage, details: String(error) })
  }
})

// Update inverter
router.put('/:id', authenticateToken, requireRole(UserRole.ADMIN, UserRole.SERVICE_CENTER, UserRole.DISTRIBUTOR), (req, res) => {
  try {
    const inverterId = parseInt(req.params.id)
    const inverter = db.prepare('SELECT id FROM inverters WHERE id = ?').get(inverterId) as any

    if (!inverter) {
      return res.status(404).json({ error: 'Inverter not found' })
    }

    const {
      serial_number,
      model,
      manufacturer,
      type,
      power_rating,
      installation_date,
      warranty_start_date,
      warranty_end_date,
      warranty_months,
      warranty_type,
      customer_id,
      distributor_id,
      installation_address,
      location_lat,
      location_lng,
      status,
      notes,
    } = req.body

    // Check if serial number is being changed and if it's already taken
    if (serial_number) {
      const serialCheck = db.prepare('SELECT id FROM inverters WHERE serial_number = ? AND id != ?').get(serial_number, inverterId) as any
      if (serialCheck) {
        return res.status(400).json({ error: 'Serial number already exists' })
      }
    }

    // Resolve customer_id: normalize and validate
    let finalCustomerId: number | null = null
    
    console.log('🔍 [PUT /inverters/:id] Received customer_id:', customer_id, 'Type:', typeof customer_id)
    
    // Normalize customer_id: convert to number or null
    if (customer_id !== undefined && customer_id !== null && customer_id !== '') {
      const customerIdNum = typeof customer_id === 'string' ? parseInt(customer_id) : Number(customer_id)
      if (!isNaN(customerIdNum) && customerIdNum > 0) {
        finalCustomerId = customerIdNum
        console.log('✅ [PUT /inverters/:id] Parsed customer_id:', finalCustomerId)
      } else {
        console.log('⚠️ [PUT /inverters/:id] Invalid customer_id number:', customerIdNum)
      }
    } else {
      console.log('ℹ️ [PUT /inverters/:id] customer_id is empty/null, will set to null')
    }
    
    if (finalCustomerId) {
      // Check if this ID exists in users table (might be a user ID)
      // Frontend loads customers from users table, so we need to check users first
      const user = db.prepare('SELECT id, email, phone, name, organization FROM users WHERE id = ? AND role IN (?, ?, ?)').get(
        finalCustomerId,
        UserRole.END_USER,
        UserRole.DISTRIBUTOR,
        UserRole.DEALER
      ) as { id: number; email: string; phone: string; name: string; organization: string } | undefined

      if (user) {
        console.log('👤 [PUT /inverters/:id] Found user with ID:', finalCustomerId)
        // Tìm customer record bằng user_id
        const matchingCustomer = db.prepare(`
          SELECT id FROM customers 
          WHERE user_id = ?
          LIMIT 1
        `).get(user.id) as { id: number } | undefined

        if (matchingCustomer) {
          finalCustomerId = matchingCustomer.id
          console.log('✅ [PUT /inverters/:id] Found customer record with ID:', finalCustomerId)
        } else {
          // Tạo customer record mới với user_id
          const customerType = user.organization ? 'enterprise' : 'residential'
          const customerResult = db.prepare(`
            INSERT INTO customers (name, email, phone, address, customer_type, organization, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            user.name,
            user.email || null,
            user.phone || null,
            null,
            customerType,
            user.organization || null,
            user.id
          )
          finalCustomerId = customerResult.lastInsertRowid as number
          console.log('✅ [PUT /inverters/:id] Created customer record with ID:', finalCustomerId)
        }
      } else {
        // Check if it's a valid customer ID in customers table
        const customerCheck = db.prepare('SELECT id, name FROM customers WHERE id = ?').get(finalCustomerId) as { id: number; name: string } | undefined
        if (customerCheck) {
          console.log('✅ [PUT /inverters/:id] Valid customer ID in customers table:', finalCustomerId, 'Name:', customerCheck.name)
        } else {
          // If not found in customers table, check if it's a user ID (from users table)
          // This handles the case where frontend loads customers from users table
          const userCheck = db.prepare(`
            SELECT id, name, email, phone, organization 
            FROM users 
            WHERE id = ? AND role IN (?, ?, ?) AND status = 'active'
          `).get(
            finalCustomerId,
            UserRole.END_USER,
            UserRole.DISTRIBUTOR,
            UserRole.DEALER
          ) as { id: number; name: string; email: string; phone: string; organization: string } | undefined
          
          if (userCheck) {
            console.log('✅ [PUT /inverters/:id] Found user ID:', finalCustomerId, 'Name:', userCheck.name)
            // Tìm customer record bằng user_id
            const matchingCustomer = db.prepare(`
              SELECT id FROM customers 
              WHERE user_id = ?
              LIMIT 1
            `).get(userCheck.id) as { id: number } | undefined

            if (matchingCustomer) {
              finalCustomerId = matchingCustomer.id
              console.log('✅ [PUT /inverters/:id] Found customer record with ID:', finalCustomerId, 'for user:', userCheck.name)
            } else {
              // Tạo customer record mới với user_id
              const customerType = userCheck.organization ? 'enterprise' : 'residential'
              const customerResult = db.prepare(`
                INSERT INTO customers (name, email, phone, address, customer_type, organization, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
              `).run(
                userCheck.name,
                userCheck.email || null,
                userCheck.phone || null,
                null,
                customerType,
                userCheck.organization || null,
                userCheck.id
              )
              finalCustomerId = customerResult.lastInsertRowid as number
              console.log('✅ [PUT /inverters/:id] Created customer record with ID:', finalCustomerId, 'for user:', userCheck.name)
            }
          } else {
            // Invalid customer ID, set to null
            console.log('❌ [PUT /inverters/:id] Invalid customer ID:', finalCustomerId, '- Not found in customers or users table')
            console.log('🔍 [PUT /inverters/:id] Checking all customers in database...')
            const allCustomers = db.prepare('SELECT id, name FROM customers').all() as Array<{ id: number; name: string }>
            console.log('📋 [PUT /inverters/:id] Available customers:', allCustomers)
            const allUsers = db.prepare(`
              SELECT id, name FROM users 
              WHERE role IN (?, ?, ?) AND status = 'active'
            `).all(UserRole.END_USER, UserRole.DISTRIBUTOR, UserRole.DEALER) as Array<{ id: number; name: string }>
            console.log('📋 [PUT /inverters/:id] Available users (customers):', allUsers)
            finalCustomerId = null
          }
        }
      }
    }
    
    console.log('📤 [PUT /inverters/:id] Final customer_id to update:', finalCustomerId)

    const normalizedWarrantyMonths =
      warranty_months !== undefined && warranty_months !== null && warranty_months !== ''
        ? Number(warranty_months)
        : null

    db.prepare(`
      UPDATE inverters
      SET serial_number = COALESCE(?, serial_number),
          model = COALESCE(?, model),
          manufacturer = COALESCE(?, manufacturer),
          type = COALESCE(?, type),
          power_rating = COALESCE(?, power_rating),
          installation_date = COALESCE(?, installation_date),
          warranty_start_date = COALESCE(?, warranty_start_date),
          warranty_end_date = COALESCE(?, warranty_end_date),
          warranty_months = COALESCE(?, warranty_months),
          warranty_type = COALESCE(?, warranty_type),
          customer_id = ?,
          distributor_id = COALESCE(?, distributor_id),
          installation_address = COALESCE(?, installation_address),
          location_lat = COALESCE(?, location_lat),
          location_lng = COALESCE(?, location_lng),
          status = COALESCE(?, status),
          notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      serial_number || null,
      model || null,
      manufacturer || null,
      type || null,
      power_rating || null,
      installation_date || null,
      warranty_start_date || null,
      warranty_end_date || null,
      normalizedWarrantyMonths,
      warranty_type || null,
      finalCustomerId,
      distributor_id || null,
      installation_address || null,
      location_lat || null,
      location_lng || null,
      status || null,
      notes || null,
      inverterId
    )

    // Sync inverter to tickets
    syncInverterToTickets(inverterId)

    const updatedInverter = db.prepare(`
      SELECT i.*,
             ${inverterCustomerSelect}
      FROM inverters i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ?
    `).get(inverterId) as any

    console.log('✅ [PUT /inverters/:id] Updated inverter customer_id:', updatedInverter?.customer_id)
    console.log('✅ [PUT /inverters/:id] Full updated inverter:', JSON.stringify(updatedInverter, null, 2))
    res.json(updatedInverter)
  } catch (error) {
    console.error('❌ [PUT /inverters/:id] Update inverter error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    console.error('❌ [PUT /inverters/:id] Error details:', String(error))
    res.status(500).json({ error: errorMessage, details: String(error) })
  }
})

// Delete inverter
router.delete('/:id', authenticateToken, requireRole(UserRole.ADMIN, UserRole.DEV, UserRole.TECHNICIAN), (req, res) => {
  try {
    const inverterId = parseInt(req.params.id)

    const inverter = db.prepare('SELECT id FROM inverters WHERE id = ?').get(inverterId) as any
    if (!inverter) {
      return res.status(404).json({ error: 'Inverter not found' })
    }

    // Check if inverter has related tickets
    const ticketCount = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE inverter_id = ?').get(inverterId) as { count: number }

    if (ticketCount.count > 0) {
      return res.status(400).json({
        error: 'Cannot delete inverter with associated tickets. Please resolve tickets first.',
      })
    }

    db.prepare('DELETE FROM inverters WHERE id = ?').run(inverterId)

    res.status(204).send()
  } catch (error) {
    console.error('Delete inverter error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST: Bulk delete inverters
router.post('/bulk-delete', authenticateToken, requireRole(UserRole.ADMIN, UserRole.DEV, UserRole.TECHNICIAN), (req: AuthRequest, res) => {
  try {
    const { ids } = req.body
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'An array of inverter IDs is required' })
    }

    const user = req.user!
    const userInfo = db.prepare('SELECT email FROM users WHERE id = ?').get(user.id) as { email: string } | undefined
    console.log(`🗑️ [Bulk Delete Inverters] User ${userInfo?.email || user.id} (${user.role}) deleting ${ids.length} inverters`)

    let deletedCount = 0
    let notFoundCount = 0
    let skippedCount = 0

    const stmt = db.prepare('DELETE FROM inverters WHERE id = ?')
    const transaction = db.transaction((inverterIds: number[]) => {
      for (const id of inverterIds) {
        const existing = db.prepare('SELECT id FROM inverters WHERE id = ?').get(id) as { id: number } | undefined
        if (!existing) {
          notFoundCount++
          continue
        }

        // Check if inverter has related tickets
        const ticketCount = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE inverter_id = ?').get(id) as { count: number }
        if (ticketCount.count > 0) {
          console.warn(`   ⚠️ Skipping inverter ${id} - has ${ticketCount.count} tickets`)
          skippedCount++
          continue
        }

        stmt.run(id)
        deletedCount++
      }
    })
    
    transaction(ids)

    console.log(`   ✅ Deleted: ${deletedCount}, Skipped (has tickets): ${skippedCount}, Not found: ${notFoundCount}`)

    res.json({
      success: true,
      deleted: deletedCount,
      requested: ids.length,
      notFound: notFoundCount,
      skipped: skippedCount,
    })
  } catch (error) {
    console.error('❌ Bulk delete inverters error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Import inverters from CSV
router.post('/import', authenticateToken, requireRole(UserRole.ADMIN, UserRole.SERVICE_CENTER, UserRole.DISTRIBUTOR), async (req, res) => {
  try {
    const { inverters: invertersData } = req.body

    if (!Array.isArray(invertersData) || invertersData.length === 0) {
      return res.status(400).json({ error: 'Inverters array is required' })
    }

    const errors: string[] = []
    let successCount = 0

    for (let i = 0; i < invertersData.length; i++) {
      const inverterData = invertersData[i]
      const rowNumber = i + 1

      try {
        // Validate required fields
        if (!inverterData.serial_number || !inverterData.model) {
          errors.push(`Dòng ${rowNumber}: Thiếu serial_number hoặc model (bắt buộc)`)
          continue
        }

        // Check if serial number already exists
        const existing = db.prepare('SELECT id FROM inverters WHERE serial_number = ?').get(inverterData.serial_number) as any
        if (existing) {
          errors.push(`Dòng ${rowNumber}: Serial number đã tồn tại: ${inverterData.serial_number}`)
          continue
        }

        // Resolve customer_id from email if provided
        let customerId = inverterData.customer_id
        if (!customerId && inverterData.customer_email) {
          const customer = db.prepare('SELECT id FROM customers WHERE email = ?').get(inverterData.customer_email) as any
          if (!customer) {
            errors.push(`Dòng ${rowNumber}: Không tìm thấy khách hàng với email: ${inverterData.customer_email}`)
            continue
          }
          customerId = customer.id
        }

        // Validate type if provided
        if (inverterData.type) {
          const validTypes = ['grid-tie', 'hybrid', 'logger', 'meter', 'bess', 'other']
          if (!validTypes.includes(inverterData.type)) {
            errors.push(`Dòng ${rowNumber}: Type không hợp lệ: ${inverterData.type}. Phải là: ${validTypes.join(', ')}`)
            continue
          }
        }

        // Validate status if provided
        if (inverterData.status) {
          const validStatuses = ['active', 'inactive', 'maintenance']
          if (!validStatuses.includes(inverterData.status)) {
            errors.push(`Dòng ${rowNumber}: Status không hợp lệ: ${inverterData.status}. Phải là: ${validStatuses.join(', ')}`)
            continue
          }
        }

        db.prepare(`
          INSERT INTO inverters (
            serial_number, model, type, power_rating, installation_date,
            warranty_start_date, warranty_end_date, customer_id,
            status, notes
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          inverterData.serial_number,
          inverterData.model,
          inverterData.type || null,
          inverterData.power_rating || null,
          inverterData.installation_date || null,
          inverterData.warranty_start_date || null,
          inverterData.warranty_end_date || null,
          customerId || null,
          inverterData.status || 'active',
          inverterData.notes || null
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
    console.error('Import inverters error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get inverter error history
router.get('/:id/errors', authenticateToken, (req, res) => {
  try {
    const inverterId = parseInt(req.params.id)
    
    const errors = db.prepare(`
      SELECT ie.*,
             u.name as created_by_name,
             t.ticket_number
      FROM inverter_errors ie
      LEFT JOIN users u ON ie.created_by = u.id
      LEFT JOIN tickets t ON ie.ticket_id = t.id
      WHERE ie.inverter_id = ?
      ORDER BY ie.occurred_at DESC, ie.created_at DESC
    `).all(inverterId)

    res.json({ data: errors })
  } catch (error) {
    console.error('Get inverter errors error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add inverter error
router.post('/:id/errors', authenticateToken, requireRole(UserRole.ADMIN, UserRole.SERVICE_CENTER, UserRole.TECHNICIAN), (req: AuthRequest, res) => {
  try {
    const inverterId = parseInt(req.params.id)
    const {
      error_code,
      error_type,
      error_message,
      severity = 'medium',
      occurred_at,
      resolved_at,
      resolution,
      ticket_id,
    } = req.body

    if (!error_type || !error_message || !occurred_at) {
      return res.status(400).json({ error: 'error_type, error_message, and occurred_at are required' })
    }

    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical']
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({ error: `severity must be one of: ${validSeverities.join(', ')}` })
    }

    const user = req.user!

    const result = db.prepare(`
      INSERT INTO inverter_errors (
        inverter_id, error_code, error_type, error_message, severity,
        occurred_at, resolved_at, resolution, ticket_id, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      inverterId,
      error_code || null,
      error_type,
      error_message,
      severity,
      occurred_at,
      resolved_at || null,
      resolution || null,
      ticket_id || null,
      user.id
    )

    const newError = db.prepare(`
      SELECT ie.*,
             u.name as created_by_name,
             t.ticket_number
      FROM inverter_errors ie
      LEFT JOIN users u ON ie.created_by = u.id
      LEFT JOIN tickets t ON ie.ticket_id = t.id
      WHERE ie.id = ?
    `).get(result.lastInsertRowid) as any

    res.status(201).json(newError)
  } catch (error) {
    console.error('Add inverter error error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update inverter error
router.put('/:id/errors/:errorId', authenticateToken, requireRole(UserRole.ADMIN, UserRole.SERVICE_CENTER, UserRole.TECHNICIAN), (req, res) => {
  try {
    const inverterId = parseInt(req.params.id)
    const errorId = parseInt(req.params.errorId)
    const {
      error_code,
      error_type,
      error_message,
      severity,
      occurred_at,
      resolved_at,
      resolution,
    } = req.body

    const error = db.prepare('SELECT id FROM inverter_errors WHERE id = ? AND inverter_id = ?').get(errorId, inverterId) as any
    if (!error) {
      return res.status(404).json({ error: 'Error not found' })
    }

    // Update all fields if provided
    db.prepare(`
      UPDATE inverter_errors
      SET error_code = COALESCE(?, error_code),
          error_type = COALESCE(?, error_type),
          error_message = COALESCE(?, error_message),
          severity = COALESCE(?, severity),
          occurred_at = COALESCE(?, occurred_at),
          resolved_at = COALESCE(?, resolved_at),
          resolution = COALESCE(?, resolution),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      error_code || null,
      error_type || null,
      error_message || null,
      severity || null,
      occurred_at || null,
      resolved_at || null,
      resolution || null,
      errorId
    )

    const updatedError = db.prepare(`
      SELECT ie.*,
             u.name as created_by_name,
             t.ticket_number
      FROM inverter_errors ie
      LEFT JOIN users u ON ie.created_by = u.id
      LEFT JOIN tickets t ON ie.ticket_id = t.id
      WHERE ie.id = ?
    `).get(errorId) as any

    res.json(updatedError)
  } catch (error) {
    console.error('Update inverter error error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete inverter error
router.delete('/:id/errors/:errorId', authenticateToken, requireRole(UserRole.ADMIN, UserRole.SERVICE_CENTER, UserRole.TECHNICIAN), (req, res) => {
  try {
    const inverterId = parseInt(req.params.id)
    const errorId = parseInt(req.params.errorId)

    const error = db.prepare('SELECT id FROM inverter_errors WHERE id = ? AND inverter_id = ?').get(errorId, inverterId) as any
    if (!error) {
      return res.status(404).json({ error: 'Error not found' })
    }

    db.prepare('DELETE FROM inverter_errors WHERE id = ?').run(errorId)

    res.json({ success: true })
  } catch (error) {
    console.error('Delete inverter error error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get inverter service history
router.get('/:id/services', authenticateToken, (req, res) => {
  try {
    const inverterId = parseInt(req.params.id)
    
    const services = db.prepare(`
      SELECT 
        sr.id,
        sr.report_number,
        sr.service_date,
        sr.service_type,
        sr.description,
        sr.diagnosis,
        sr.actions_taken,
        sr.status,
        sr.total_cost,
        u.name as technician_name,
        t.ticket_number,
        sr.created_at
      FROM service_reports sr
      INNER JOIN tickets t ON sr.ticket_id = t.id
      LEFT JOIN users u ON sr.technician_id = u.id
      WHERE t.inverter_id = ?
      ORDER BY sr.service_date DESC, sr.created_at DESC
    `).all(inverterId)

    res.json({ data: services })
  } catch (error) {
    console.error('Get inverter services error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
