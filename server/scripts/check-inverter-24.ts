import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, '../database/growatt.db')
const db = new Database(dbPath)

console.log('🔍 Checking Inverter ID 24...\n')

try {
  // Get inverter basic info
  const inverter = db.prepare(`
    SELECT i.*, 
           c.name as customer_name, 
           c.email as customer_email,
           c.phone as customer_phone,
           c.address as customer_address,
           u.name as distributor_name,
           u.id as distributor_id
    FROM inverters i
    LEFT JOIN customers c ON i.customer_id = c.id
    LEFT JOIN users u ON i.distributor_id = u.id
    WHERE i.id = ?
  `).get(24) as any

  if (!inverter) {
    console.log('❌ Inverter ID 24 not found!')
    process.exit(1)
  }

  console.log('📦 Inverter Basic Info:')
  console.log('─'.repeat(60))
  console.log(`ID: ${inverter.id}`)
  console.log(`Serial Number: ${inverter.serial_number || 'N/A'}`)
  console.log(`Model: ${inverter.model || 'N/A'}`)
  console.log(`Type: ${inverter.type || 'N/A'}`)
  console.log(`Status: ${inverter.status || 'N/A'}`)
  console.log(`Warranty Start: ${inverter.warranty_start_date || 'N/A'}`)
  console.log(`Warranty End: ${inverter.warranty_end_date || 'N/A'}`)
  console.log(`Installation Address: ${inverter.installation_address || 'N/A'}`)
  console.log(`Notes: ${inverter.notes || 'N/A'}`)
  console.log(`Created At: ${inverter.created_at || 'N/A'}`)
  console.log(`Updated At: ${inverter.updated_at || 'N/A'}`)
  console.log()

  // Customer info
  console.log('👤 Customer Info:')
  console.log('─'.repeat(60))
  console.log(`Customer ID: ${inverter.customer_id || 'N/A'}`)
  console.log(`Customer Name: ${inverter.customer_name || 'N/A'}`)
  console.log(`Customer Email: ${inverter.customer_email || 'N/A'}`)
  console.log(`Customer Phone: ${inverter.customer_phone || 'N/A'}`)
  console.log(`Customer Address: ${inverter.customer_address || 'N/A'}`)
  console.log()

  // Distributor info
  console.log('🏢 Distributor Info:')
  console.log('─'.repeat(60))
  console.log(`Distributor ID: ${inverter.distributor_id || 'N/A'}`)
  console.log(`Distributor Name: ${inverter.distributor_name || 'N/A'}`)
  console.log()

  // User ID (owner)
  console.log('👥 User/Owner Info:')
  console.log('─'.repeat(60))
  console.log(`User ID: ${inverter.user_id || 'N/A'}`)
  if (inverter.user_id) {
    const user = db.prepare('SELECT id, name, email, role FROM users WHERE id = ?').get(inverter.user_id) as any
    if (user) {
      console.log(`User Name: ${user.name || 'N/A'}`)
      console.log(`User Email: ${user.email || 'N/A'}`)
      console.log(`User Role: ${user.role || 'N/A'}`)
    } else {
      console.log('⚠️  User not found!')
    }
  }
  console.log()

  // Related tickets
  const tickets = db.prepare('SELECT * FROM tickets WHERE inverter_id = ? ORDER BY created_at DESC').all(24) as any[]
  console.log('🎫 Related Tickets:')
  console.log('─'.repeat(60))
  if (tickets.length === 0) {
    console.log('No tickets found')
  } else {
    tickets.forEach((ticket, index) => {
      console.log(`\nTicket ${index + 1}:`)
      console.log(`  ID: ${ticket.id}`)
      console.log(`  Ticket Number: ${ticket.ticket_number || 'N/A'}`)
      console.log(`  Title: ${ticket.title || 'N/A'}`)
      console.log(`  Status: ${ticket.status || 'N/A'}`)
      console.log(`  Priority: ${ticket.priority || 'N/A'}`)
      console.log(`  Created At: ${ticket.created_at || 'N/A'}`)
    })
  }
  console.log()

  // Error history
  const errors = db.prepare(`
    SELECT ie.*,
           u.name as created_by_name,
           t.ticket_number
    FROM inverter_errors ie
    LEFT JOIN users u ON ie.created_by = u.id
    LEFT JOIN tickets t ON ie.ticket_id = t.id
    WHERE ie.inverter_id = ?
    ORDER BY ie.occurred_at DESC, ie.created_at DESC
  `).all(24) as any[]
  
  console.log('⚠️  Error History:')
  console.log('─'.repeat(60))
  if (errors.length === 0) {
    console.log('No errors found')
  } else {
    errors.forEach((error, index) => {
      console.log(`\nError ${index + 1}:`)
      console.log(`  ID: ${error.id}`)
      console.log(`  Error Code: ${error.error_code || 'N/A'}`)
      console.log(`  Error Type: ${error.error_type || 'N/A'}`)
      console.log(`  Error Message: ${error.error_message || 'N/A'}`)
      console.log(`  Severity: ${error.severity || 'N/A'}`)
      console.log(`  Occurred At: ${error.occurred_at || 'N/A'}`)
      console.log(`  Resolved At: ${error.resolved_at || 'N/A'}`)
      console.log(`  Resolution: ${error.resolution || 'N/A'}`)
      console.log(`  Created By: ${error.created_by_name || 'N/A'}`)
      console.log(`  Related Ticket: ${error.ticket_number || 'N/A'}`)
    })
  }
  console.log()

  // Service history
  const serviceReports = db.prepare(`
    SELECT 
      sr.id,
      sr.report_number,
      sr.service_date,
      sr.service_type,
      sr.description,
      sr.status,
      sr.total_cost,
      u.name as technician_name,
      t.ticket_number
    FROM service_reports sr
    INNER JOIN tickets t ON sr.ticket_id = t.id
    LEFT JOIN users u ON sr.technician_id = u.id
    WHERE t.inverter_id = ?
    ORDER BY sr.service_date DESC
  `).all(24) as any[]
  
  console.log('🔧 Service History:')
  console.log('─'.repeat(60))
  if (serviceReports.length === 0) {
    console.log('No service reports found')
  } else {
    serviceReports.forEach((report, index) => {
      console.log(`\nService Report ${index + 1}:`)
      console.log(`  ID: ${report.id}`)
      console.log(`  Report Number: ${report.report_number || 'N/A'}`)
      console.log(`  Service Date: ${report.service_date || 'N/A'}`)
      console.log(`  Service Type: ${report.service_type || 'N/A'}`)
      console.log(`  Status: ${report.status || 'N/A'}`)
      console.log(`  Total Cost: ${report.total_cost || 0}`)
      console.log(`  Technician: ${report.technician_name || 'N/A'}`)
      console.log(`  Related Ticket: ${report.ticket_number || 'N/A'}`)
    })
  }
  console.log()

  // General history
  const generalHistory = db.prepare(`
    SELECT ih.*,
           u.name as created_by_name
    FROM inverter_history ih
    LEFT JOIN users u ON ih.created_by = u.id
    WHERE ih.inverter_id = ?
    ORDER BY ih.event_date DESC
  `).all(24) as any[]
  
  console.log('📋 General History:')
  console.log('─'.repeat(60))
  if (generalHistory.length === 0) {
    console.log('No general history found')
  } else {
    generalHistory.forEach((history, index) => {
      console.log(`\nHistory ${index + 1}:`)
      console.log(`  ID: ${history.id}`)
      console.log(`  Event Type: ${history.event_type || 'N/A'}`)
      console.log(`  Event Date: ${history.event_date || 'N/A'}`)
      console.log(`  Description: ${history.description || 'N/A'}`)
      console.log(`  Created By: ${history.created_by_name || 'N/A'}`)
    })
  }
  console.log()

  // Check for potential issues
  console.log('🔍 Potential Issues:')
  console.log('─'.repeat(60))
  const issues: string[] = []

  if (!inverter.serial_number) {
    issues.push('⚠️  Missing serial number')
  }

  if (!inverter.model) {
    issues.push('⚠️  Missing model')
  }

  if (!inverter.customer_id) {
    issues.push('⚠️  Not assigned to any customer')
  }

  if (!inverter.user_id) {
    issues.push('⚠️  Not assigned to any user')
  }

  if (!inverter.warranty_start_date || !inverter.warranty_end_date) {
    issues.push('⚠️  Warranty dates not set')
  }

  if (inverter.warranty_end_date) {
    const endDate = new Date(inverter.warranty_end_date)
    const today = new Date()
    if (endDate < today) {
      issues.push('⚠️  Warranty has expired')
    }
  }

  if (issues.length === 0) {
    console.log('✅ No issues found')
  } else {
    issues.forEach(issue => console.log(issue))
  }

} catch (error) {
  console.error('❌ Error checking inverter:', error)
  process.exit(1)
} finally {
  db.close()
}

