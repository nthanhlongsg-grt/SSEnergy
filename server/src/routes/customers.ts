import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { UserRole } from '../types/index.js'
import { syncCustomerToTickets, syncUserToCustomers } from '../database/sync.js'

const router = Router()

// Get all customers (only users with END_USER and DISTRIBUTOR roles)
router.get('/', authenticateToken, (req, res) => {
  try {
    const { search, customer_type, page = '1', limit = '1000' } = req.query
    
    // Get users with customer roles (END_USER, DISTRIBUTOR, DEALER)
    let userQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u.phone,
        u.address,
        u.role as type,
        u.organization,
        u.code,
        u.parent_distributor_id,
        u.created_at,
        dist.name as distributor_name,
        dist.code as distributor_code
      FROM users u
      LEFT JOIN distributors dist ON u.parent_distributor_id = dist.id
      WHERE u.role IN ('end_user', 'distributor', 'dealer')
        AND u.status = 'active'
    `
    const userParams: any[] = []

    if (search) {
      userQuery += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR u.organization LIKE ? OR u.code LIKE ?)'
      const searchTerm = `%${search}%`
      userParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm)
    }

    if (customer_type) {
      if (customer_type === 'end_user') {
        userQuery += ' AND u.role = ?'
        userParams.push('end_user')
      } else if (customer_type === 'distributor') {
        userQuery += ' AND u.role = ?'
        userParams.push('distributor')
      }
    }

    const users = db.prepare(userQuery).all(...userParams)

    // Map users to customer format
    const allCustomers = users.map((u: any) => ({
      id: u.id, // Use actual user ID instead of prefix
      user_id: u.id, // Keep for reference
      name: u.name,
      email: u.email || null,
      phone: u.phone || null,
      address: u.address || null,
      type: u.type,
      customer_type: u.type,
      organization: u.organization || null,
      code: u.code || null,
      parent_distributor_id: u.parent_distributor_id || null,
      distributor_name: u.distributor_name || null,
      distributor_code: u.distributor_code || null,
      source: 'user',
      created_at: u.created_at,
      projectCount: 0,
      inverterCount: 0,
    }))

    // Get statistics for each customer
    for (const customer of allCustomers) {
      // Count inverters
      // 1. Inverters where user is the distributor
      // 2. Inverters linked via customer_id that matches this user's email/phone in customers table
      let inverterCount = 0
      
      // Count inverters where user is distributor
      const distributorCount = db.prepare('SELECT COUNT(*) as count FROM inverters WHERE distributor_id = ?').get(customer.user_id) as { count: number } | undefined
      inverterCount += distributorCount?.count || 0
      
      // Try to find via matching customer record (for backward compatibility)
      if (customer.email || customer.phone) {
        const matchingCustomer = db.prepare(`
          SELECT id FROM customers 
          WHERE (email = ? OR phone = ?) 
          LIMIT 1
        `).get(customer.email || '', customer.phone || '') as { id: number } | undefined
        
        if (matchingCustomer) {
          const count = db.prepare('SELECT COUNT(*) as count FROM inverters WHERE customer_id = ?').get(matchingCustomer.id) as { count: number } | undefined
          inverterCount += count?.count || 0
        }
      }
      
      customer.inverterCount = inverterCount
      
      // Count tickets as projects indicator
      // 1. Tickets created by this user
      // 2. Tickets linked via customer_id that matches this user's email/phone in customers table
      let ticketCount = 0
      
      // Count tickets created by this user
      const createdCount = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE created_by = ?').get(customer.user_id) as { count: number } | undefined
      ticketCount += createdCount?.count || 0
      
      // Try to find via matching customer record (for backward compatibility)
      if (customer.email || customer.phone) {
        const matchingCustomer = db.prepare(`
          SELECT id FROM customers 
          WHERE (email = ? OR phone = ?) 
          LIMIT 1
        `).get(customer.email || '', customer.phone || '') as { id: number } | undefined
        
        if (matchingCustomer) {
          const count = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE customer_id = ?').get(matchingCustomer.id) as { count: number } | undefined
          ticketCount += count?.count || 0
        }
      }
      
      customer.projectCount = ticketCount
    }

    // Sort by created_at DESC
    allCustomers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // Apply pagination
    const limitNum = parseInt(limit as string)
    const offset = (parseInt(page as string) - 1) * limitNum
    const paginatedCustomers = allCustomers.slice(offset, offset + limitNum)

    res.json({
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

// Get customer by ID (supports user IDs from users table)
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const id = req.params.id
    let customer: any = null
    let inverters: any[] = []
    let tickets: any[] = []

    console.log('🔍 [GET /customers/:id] Requested ID:', id)

    // Check if ID is a user ID (number or user_ prefix)
    const userId = id.startsWith('user_') ? parseInt(id.replace('user_', '')) : parseInt(id)
    
    if (!isNaN(userId) && userId > 0) {
      console.log('🔍 [GET /customers/:id] Parsed userId:', userId)
      // Try to get from users table
      customer = db.prepare(`
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
        WHERE id = ? AND role IN ('end_user', 'distributor', 'dealer') AND status = 'active'
      `).get(userId) as any

      if (customer) {
        console.log('✅ [GET /customers/:id] Found customer from users table:', customer.name)
        // Get inverters where user_id = userId (thiết bị của user này)
        let userInverters: any[] = []
        try {
          userInverters = db.prepare(`
            SELECT i.*, m.capacity as model_capacity 
            FROM inverters i
            LEFT JOIN models m ON i.model = m.name
            WHERE i.user_id = ?
          `).all(userId) as any[] || []
        } catch (err) {
          console.error('❌ [GET /customers/:id] Error fetching user inverters:', err)
          // Try without models join if models table doesn't exist
          try {
            userInverters = db.prepare(`
              SELECT i.*
              FROM inverters i
              WHERE i.user_id = ?
            `).all(userId) as any[] || []
          } catch (err2) {
            console.error('❌ [GET /customers/:id] Error fetching inverters (fallback):', err2)
            userInverters = []
          }
        }
        
        // Get inverters where user is distributor (with capacity from models)
        let distributorInverters: any[] = []
        try {
          distributorInverters = db.prepare(`
            SELECT i.*, m.capacity as model_capacity 
            FROM inverters i
            LEFT JOIN models m ON i.model = m.name
            WHERE i.distributor_id = ?
          `).all(userId) as any[] || []
        } catch (err) {
          console.error('❌ [GET /customers/:id] Error fetching distributor inverters:', err)
          // Try without models join if models table doesn't exist
          try {
            distributorInverters = db.prepare(`
              SELECT i.*
              FROM inverters i
              WHERE i.distributor_id = ?
            `).all(userId) as any[] || []
          } catch (err2) {
            console.error('❌ [GET /customers/:id] Error fetching inverters (fallback):', err2)
            distributorInverters = []
          }
        }
        
        // Also get inverters linked via customer records matching email/phone
        if (customer.email || customer.phone) {
          let matchingCustomer: { id: number } | undefined
          try {
            matchingCustomer = db.prepare(`
              SELECT id FROM customers 
              WHERE (email = ? OR phone = ?) 
              LIMIT 1
            `).get(customer.email || '', customer.phone || '') as { id: number } | undefined
          } catch (err) {
            console.error('❌ [GET /customers/:id] Error finding matching customer:', err)
            matchingCustomer = undefined
          }
          
          if (matchingCustomer) {
            let customerInverters: any[] = []
            try {
              customerInverters = db.prepare(`
                SELECT i.*, m.capacity as model_capacity 
                FROM inverters i
                LEFT JOIN models m ON i.model = m.name
                WHERE i.customer_id = ?
              `).all(matchingCustomer.id) as any[] || []
            } catch (err) {
              console.error('❌ [GET /customers/:id] Error fetching customer inverters:', err)
              // Try without models join if models table doesn't exist
              try {
                customerInverters = db.prepare(`
                  SELECT i.*
                  FROM inverters i
                  WHERE i.customer_id = ?
                `).all(matchingCustomer.id) as any[] || []
              } catch (err2) {
                console.error('❌ [GET /customers/:id] Error fetching customer inverters (fallback):', err2)
                customerInverters = []
              }
            }
            inverters = [...(userInverters || []), ...(distributorInverters || []), ...(customerInverters || [])]
            // Remove duplicates if any
            const inverterIds = new Set(inverters.filter(i => i && i.id).map(i => i.id))
            inverters = Array.from(inverterIds)
              .map(id => inverters.find(i => i && i.id === id))
              .filter((inv): inv is any => inv !== undefined && inv !== null) // Remove undefined and null values
          } else {
            inverters = [...(userInverters || []), ...(distributorInverters || [])]
            // Remove duplicates if any
            const inverterIds = new Set(inverters.filter(i => i && i.id).map(i => i.id))
            inverters = Array.from(inverterIds)
              .map(id => inverters.find(i => i && i.id === id))
              .filter((inv): inv is any => inv !== undefined && inv !== null)
          }
        } else {
          inverters = [...(userInverters || []), ...(distributorInverters || [])]
          // Remove duplicates if any
          const inverterIds = new Set(inverters.filter(i => i && i.id).map(i => i.id))
          inverters = Array.from(inverterIds)
            .map(id => inverters.find(i => i && i.id === id))
            .filter((inv): inv is any => inv !== undefined && inv !== null)
        }

        // Get tickets: created by this user OR assigned to this user OR linked to inverters managed by this customer
        try {
          const inverterIds = (inverters || []).filter(inv => inv && inv.id).map(inv => inv.id)
          if (inverterIds.length > 0) {
            const placeholders = inverterIds.map(() => '?').join(',')
            tickets = db.prepare(`
              SELECT DISTINCT * FROM tickets 
              WHERE created_by = ? OR assigned_to = ? OR inverter_id IN (${placeholders})
              ORDER BY created_at DESC
            `).all(userId, userId, ...inverterIds) as any[] || []
          } else {
            tickets = db.prepare('SELECT * FROM tickets WHERE created_by = ? OR assigned_to = ? ORDER BY created_at DESC').all(userId, userId) as any[] || []
          }
        } catch (err) {
          console.error('❌ [GET /customers/:id] Error fetching tickets:', err)
          tickets = []
        }
      } else {
        console.log('⚠️ [GET /customers/:id] User not found or not a valid customer role')
      }
    }

    // If not found in users, try customers table for backward compatibility
    if (!customer && !isNaN(parseInt(id))) {
      const customerId = parseInt(id)
      console.log('🔍 [GET /customers/:id] Trying customers table with ID:', customerId)
      customer = db.prepare('SELECT *, "customer" as source FROM customers WHERE id = ?').get(customerId) as any
      
      if (customer) {
        console.log('✅ [GET /customers/:id] Found customer from customers table:', customer.name)
        try {
          inverters = db.prepare(`
            SELECT i.*, m.capacity as model_capacity 
            FROM inverters i
            LEFT JOIN models m ON i.model = m.name
            WHERE i.customer_id = ?
          `).all(customerId) as any[] || []
        } catch (err) {
          console.error('❌ [GET /customers/:id] Error fetching inverters:', err)
          // Try without models join if models table doesn't exist
          try {
            inverters = db.prepare(`
              SELECT i.*
              FROM inverters i
              WHERE i.customer_id = ?
            `).all(customerId) as any[] || []
          } catch (err2) {
            console.error('❌ [GET /customers/:id] Error fetching inverters (fallback):', err2)
            inverters = []
          }
        }
        
        // Get tickets: linked to customer OR linked to inverters of this customer
        try {
          const inverterIds = (inverters || []).filter(inv => inv && inv.id).map(inv => inv.id)
          if (inverterIds.length > 0) {
            const placeholders = inverterIds.map(() => '?').join(',')
            tickets = db.prepare(`
              SELECT DISTINCT * FROM tickets 
              WHERE customer_id = ? OR inverter_id IN (${placeholders})
              ORDER BY created_at DESC
            `).all(customerId, ...inverterIds) as any[] || []
          } else {
            tickets = db.prepare('SELECT * FROM tickets WHERE customer_id = ? ORDER BY created_at DESC').all(customerId) as any[] || []
          }
        } catch (err) {
          console.error('❌ [GET /customers/:id] Error fetching tickets:', err)
          tickets = []
        }
      } else {
        console.log('❌ [GET /customers/:id] Customer not found in customers table')
      }
    }

    if (!customer) {
      console.log('❌ [GET /customers/:id] Customer not found for ID:', id)
      return res.status(404).json({ error: 'Customer not found' })
    }

    console.log('✅ [GET /customers/:id] Returning customer data')
    
    // Ensure customer object is safe to spread
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
    console.error('❌ [GET /customers/:id] Get customer error:', error)
    console.error('❌ [GET /customers/:id] Error details:', error instanceof Error ? error.stack : String(error))
    res.status(500).json({ 
      error: 'Internal server error', 
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
    })
  }
})

// Create customer
router.post('/', authenticateToken, requireRole(UserRole.ADMIN, UserRole.SERVICE_CENTER, UserRole.DISTRIBUTOR), (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      customer_type,
      organization,
      tax_code,
      contact_person,
      notes,
    } = req.body

    if (!name || !customer_type) {
      return res.status(400).json({ error: 'Name and customer_type are required' })
    }

    // Check if email already exists
    if (email) {
      const existingCustomer = db.prepare('SELECT id FROM customers WHERE email = ?').get(email) as any
      if (existingCustomer) {
        return res.status(400).json({ error: 'Email already exists' })
      }
    }

    const result = db.prepare(`
      INSERT INTO customers (name, email, phone, address, customer_type, organization, tax_code, contact_person, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name,
      email || null,
      phone || null,
      address || null,
      customer_type,
      organization || null,
      tax_code || null,
      contact_person || null,
      notes || null
    )

    const newCustomer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid) as any

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
          notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      name || null,
      email !== undefined ? email : null,
      phone || null,
      address || null,
      customer_type || null,
      organization || null,
      tax_code || null,
      contact_person || null,
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

    // Check if customer has related records
    const inverterCount = db.prepare('SELECT COUNT(*) as count FROM inverters WHERE customer_id = ?').get(customerId) as { count: number }
    const ticketCount = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE customer_id = ?').get(customerId) as { count: number }

    if (inverterCount.count > 0 || ticketCount.count > 0) {
      return res.status(400).json({
        error: 'Cannot delete customer with associated records. Please remove inverters and tickets first.',
      })
    }

    db.prepare('DELETE FROM customers WHERE id = ?').run(customerId)

    res.status(204).send()
  } catch (error) {
    console.error('Delete customer error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
