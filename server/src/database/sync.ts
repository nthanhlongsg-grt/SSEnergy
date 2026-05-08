/**
 * Database Synchronization Helper Functions
 * 
 * These functions ensure data consistency across related tables
 * by automatically updating denormalized fields when source data changes.
 */

import db from './db.js'

/**
 * Sync customer information to all related tickets
 * Updates denormalized customer fields in tickets table
 */
export const syncCustomerToTickets = (customerId: number) => {
  try {
    const customer = db.prepare(`
      SELECT name, email, phone, address 
      FROM customers 
      WHERE id = ?
    `).get(customerId) as {
      name: string
      email: string | null
      phone: string | null
      address: string | null
    } | undefined

    if (!customer) {
      console.warn(`⚠️ Customer ${customerId} not found, skipping sync`)
      return
    }

    // Update all tickets linked to this customer
    db.prepare(`
      UPDATE tickets 
      SET customer_name = ?,
          customer_email = ?,
          customer_phone = ?,
          customer_address = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE customer_id = ?
    `).run(
      customer.name,
      customer.email || null,
      customer.phone || null,
      customer.address || null,
      customerId
    )

    console.log(`✅ Synced customer ${customerId} to related tickets`)
  } catch (error) {
    console.error(`❌ Error syncing customer ${customerId} to tickets:`, error)
  }
}

/**
 * Sync user information to customers table (for end_user, distributor, dealer roles)
 * Creates or updates customer record based on user data
 */
export const syncUserToCustomers = (userId: number) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, phone, address, organization, role
      FROM users 
      WHERE id = ? AND role IN ('end_user', 'distributor', 'dealer')
    `).get(userId) as {
      id: number
      name: string
      email: string
      phone: string | null
      address: string | null
      organization: string | null
      role: string
    } | undefined

    if (!user) {
      console.warn(`⚠️ User ${userId} not found or not a customer role, skipping sync`)
      return
    }

    // Check if customer record exists (by email, phone, or user_id)
    const customer = db.prepare(`
      SELECT id FROM customers 
      WHERE user_id = ? 
         OR (email = ? AND email IS NOT NULL AND email != '')
         OR (phone = ? AND phone IS NOT NULL AND phone != '')
      LIMIT 1
    `).get(user.id, user.email || '', user.phone || '') as { id: number } | undefined

    if (customer) {
      // Update existing customer record
      const customerType = user.organization ? 'enterprise' : 'residential'
      db.prepare(`
        UPDATE customers 
        SET name = ?,
            email = ?,
            phone = ?,
            address = ?,
            organization = ?,
            customer_type = ?,
            user_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        user.name,
        user.email,
        user.phone || null,
        user.address || null,
        user.organization || null,
        customerType,
        user.id,
        customer.id
      )

      // Sync to tickets
      syncCustomerToTickets(customer.id)
      console.log(`✅ Synced user ${userId} to customer ${customer.id}`)
    } else {
      // Create new customer record if email or phone exists
      if (user.email || user.phone) {
        const customerType = user.organization ? 'enterprise' : 'residential'
        const result = db.prepare(`
          INSERT INTO customers (name, email, phone, address, customer_type, organization, user_id)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          user.name,
          user.email || null,
          user.phone || null,
          user.address || null,
          customerType,
          user.organization || null,
          user.id
        )

        console.log(`✅ Created customer record ${result.lastInsertRowid} from user ${userId}`)
      }
    }
  } catch (error) {
    console.error(`❌ Error syncing user ${userId} to customers:`, error)
  }
}

/**
 * Sync user information to distributors table (for distributor role)
 * Creates or updates distributor record based on user data
 */
export const syncUserToDistributors = (userId: number) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, phone, address, organization, role, code
      FROM users 
      WHERE id = ? AND role = 'distributor'
    `).get(userId) as {
      id: number
      name: string
      email: string
      phone: string | null
      address: string | null
      organization: string | null
      role: string
      code: string | null
    } | undefined

    if (!user) {
      console.warn(`⚠️ User ${userId} not found or not a distributor role, skipping sync`)
      return
    }

    // Check if distributor record exists (by user_id, email, or name)
    const distributor = db.prepare(`
      SELECT id FROM distributors 
      WHERE user_id = ? 
         OR (email = ? AND email IS NOT NULL AND email != '')
         OR (name = ? AND name IS NOT NULL AND name != '')
      LIMIT 1
    `).get(user.id, user.email || '', user.name || '') as { id: number } | undefined

    if (distributor) {
      // Update existing distributor record
      db.prepare(`
        UPDATE distributors 
        SET name = ?,
            email = ?,
            phone = ?,
            address = ?,
            code = ?,
            user_id = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        user.name,
        user.email,
        user.phone || null,
        user.address || null,
        user.code || null,
        user.id,
        distributor.id
      )

      console.log(`✅ Synced user ${userId} to distributor ${distributor.id}`)
    } else {
      // Create new distributor record
      const result = db.prepare(`
        INSERT INTO distributors (name, email, phone, address, code, user_id, status)
        VALUES (?, ?, ?, ?, ?, ?, 'active')
      `).run(
        user.name,
        user.email || null,
        user.phone || null,
        user.address || null,
        user.code || null,
        user.id
      )

      console.log(`✅ Created distributor record ${result.lastInsertRowid} from user ${userId}`)
    }
  } catch (error) {
    console.error(`❌ Error syncing user ${userId} to distributors:`, error)
  }
}

/**
 * Sync customer information back to user (reverse sync)
 * Updates user record from customer data
 */
export const syncCustomerToUser = (customerId: number) => {
  try {
    const customer = db.prepare(`
      SELECT user_id, name, email, phone, address, organization
      FROM customers 
      WHERE id = ? AND user_id IS NOT NULL
    `).get(customerId) as {
      user_id: number | null
      name: string
      email: string | null
      phone: string | null
      address: string | null
      organization: string | null
    } | undefined

    if (!customer || !customer.user_id) {
      return // No user linked, skip
    }

    // Update user record
    db.prepare(`
      UPDATE users 
      SET name = ?,
          email = ?,
          phone = ?,
          address = ?,
          organization = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      customer.name,
      customer.email || null,
      customer.phone || null,
      customer.address || null,
      customer.organization || null,
      customer.user_id
    )

    console.log(`✅ Synced customer ${customerId} to user ${customer.user_id}`)
  } catch (error) {
    console.error(`❌ Error syncing customer ${customerId} to user:`, error)
  }
}

/**
 * Sync distributor information back to user (reverse sync)
 * Updates user record from distributor data
 */
export const syncDistributorToUser = (distributorId: number) => {
  try {
    const distributor = db.prepare(`
      SELECT user_id, name, email, phone, address, code
      FROM distributors 
      WHERE id = ? AND user_id IS NOT NULL
    `).get(distributorId) as {
      user_id: number | null
      name: string
      email: string | null
      phone: string | null
      address: string | null
      code: string | null
    } | undefined

    if (!distributor || !distributor.user_id) {
      return // No user linked, skip
    }

    // Update user record
    db.prepare(`
      UPDATE users 
      SET name = ?,
          email = ?,
          phone = ?,
          address = ?,
          code = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND role = 'distributor'
    `).run(
      distributor.name,
      distributor.email || null,
      distributor.phone || null,
      distributor.address || null,
      distributor.code || null,
      distributor.user_id
    )

    console.log(`✅ Synced distributor ${distributorId} to user ${distributor.user_id}`)
  } catch (error) {
    console.error(`❌ Error syncing distributor ${distributorId} to user:`, error)
  }
}

/**
 * Sync all user-related data (customers and distributors)
 * Main function to call when user is created/updated
 */
export const syncUserData = (userId: number) => {
  syncUserToCustomers(userId)
  syncUserToDistributors(userId)
}

/**
 * Sync inverter information to all related tickets
 * Updates denormalized inverter fields in tickets table
 */
export const syncInverterToTickets = (inverterId: number) => {
  try {
    const inverter = db.prepare(`
      SELECT serial_number, model 
      FROM inverters 
      WHERE id = ?
    `).get(inverterId) as {
      serial_number: string
      model: string
    } | undefined

    if (!inverter) {
      console.warn(`⚠️ Inverter ${inverterId} not found, skipping sync`)
      return
    }

    // Update all tickets linked to this inverter
    db.prepare(`
      UPDATE tickets 
      SET inverter_serial = ?,
          inverter_model = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE inverter_id = ?
    `).run(
      inverter.serial_number,
      inverter.model,
      inverterId
    )

    console.log(`✅ Synced inverter ${inverterId} to related tickets`)
  } catch (error) {
    console.error(`❌ Error syncing inverter ${inverterId} to tickets:`, error)
  }
}

/**
 * Sync all related data when a ticket is created or updated
 * Ensures denormalized fields are populated
 */
export const syncTicketData = (ticketId: number) => {
  try {
    const ticket = db.prepare(`
      SELECT customer_id, inverter_id 
      FROM tickets 
      WHERE id = ?
    `).get(ticketId) as {
      customer_id: number | null
      inverter_id: number | null
    } | undefined

    if (!ticket) {
      console.warn(`⚠️ Ticket ${ticketId} not found, skipping sync`)
      return
    }

    // Sync customer data
    if (ticket.customer_id) {
      syncCustomerToTickets(ticket.customer_id)
    }

    // Sync inverter data
    if (ticket.inverter_id) {
      syncInverterToTickets(ticket.inverter_id)
    }
  } catch (error) {
    console.error(`❌ Error syncing ticket ${ticketId}:`, error)
  }
}
