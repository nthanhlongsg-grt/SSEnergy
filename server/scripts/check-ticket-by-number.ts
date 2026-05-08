import db from '../src/database/db.js'

const ticketNumber = process.argv[2] || 'TKT-2025-562668'

try {
  console.log(`🎫 Checking ticket: ${ticketNumber}\n`)
  
  // Get ticket info by ticket_number
  const ticket = db.prepare(`
    SELECT 
      t.id, 
      t.ticket_number, 
      t.category, 
      t.priority, 
      t.status, 
      t.assigned_to,
      t.created_at, 
      t.updated_at,
      t.title,
      t.description,
      t.customer_id,
      t.inverter_id,
      u1.name as assigned_to_name,
      u1.email as assigned_to_email,
      u1.role as assigned_to_role,
      u1.function as assigned_to_function,
      c.name as customer_name,
      c.email as customer_email,
      i.serial_number as inverter_serial,
      i.model as inverter_model
    FROM tickets t
    LEFT JOIN users u1 ON t.assigned_to = u1.id
    LEFT JOIN customers c ON t.customer_id = c.id
    LEFT JOIN inverters i ON t.inverter_id = i.id
    WHERE t.ticket_number = ?
  `).get(ticketNumber) as any
  
  if (!ticket) {
    console.log(`❌ Ticket ${ticketNumber} not found`)
    process.exit(1)
  }
  
  console.log('📋 Ticket Information:')
  console.log(`   ID: ${ticket.id}`)
  console.log(`   Number: ${ticket.ticket_number}`)
  console.log(`   Title: ${ticket.title || 'N/A'}`)
  console.log(`   Category: ${ticket.category || 'NULL'}`)
  console.log(`   Priority: ${ticket.priority || 'N/A'}`)
  console.log(`   Status: ${ticket.status}`)
  console.log(`   Created at: ${ticket.created_at}`)
  console.log(`   Updated at: ${ticket.updated_at || 'N/A'}`)
  
  console.log('\n👤 Assigned To:')
  if (ticket.assigned_to) {
    console.log(`   User ID: ${ticket.assigned_to}`)
    console.log(`   Name: ${ticket.assigned_to_name || 'N/A'}`)
    console.log(`   Email: ${ticket.assigned_to_email || 'N/A'}`)
    console.log(`   Role: ${ticket.assigned_to_role || 'N/A'}`)
    console.log(`   Function: ${ticket.assigned_to_function || 'NULL'}`)
  } else {
    console.log('   ❌ Not assigned')
  }
  
  console.log('\n👥 Customer Information:')
  if (ticket.customer_id) {
    console.log(`   Customer ID: ${ticket.customer_id}`)
    console.log(`   Name: ${ticket.customer_name || 'N/A'}`)
    console.log(`   Email: ${ticket.customer_email || 'N/A'}`)
  } else {
    console.log('   ❌ No customer assigned')
  }
  
  console.log('\n🔧 Device Information:')
  if (ticket.inverter_id) {
    console.log(`   Inverter ID: ${ticket.inverter_id}`)
    console.log(`   Serial: ${ticket.inverter_serial || 'N/A'}`)
    console.log(`   Model: ${ticket.inverter_model || 'N/A'}`)
  } else {
    console.log('   ❌ No device linked')
  }
  
  // Get comments count
  const commentsCount = db.prepare(`
    SELECT COUNT(*) as count FROM ticket_comments WHERE ticket_id = ?
  `).get(ticket.id) as any
  
  console.log(`\n💬 Comments: ${commentsCount.count || 0}`)
  
  // Get attachments count
  const attachmentsCount = db.prepare(`
    SELECT COUNT(*) as count FROM ticket_attachments WHERE ticket_id = ?
  `).get(ticket.id) as any
  
  console.log(`📎 Attachments: ${attachmentsCount.count || 0}`)
  
  // Get watchers count
  const watchersCount = db.prepare(`
    SELECT COUNT(*) as count FROM ticket_watchers WHERE ticket_id = ?
  `).get(ticket.id) as any
  
  console.log(`👀 Watchers: ${watchersCount.count || 0}`)
  
  console.log('\n✅ Ticket found and displayed successfully')
  
} catch (error) {
  console.error('❌ Error:', error)
  process.exit(1)
} finally {
  db.close()
}

