import db from '../src/database/db.js'

try {
  console.log('🔧 Manually assigning ticket 86...\n')
  
  // Get ticket info
  const ticket = db.prepare('SELECT id, ticket_number, category FROM tickets WHERE id = 86').get() as any
  
  if (!ticket) {
    console.log('❌ Ticket not found')
    process.exit(1)
  }
  
  console.log(`📋 Ticket: ${ticket.ticket_number}`)
  console.log(`   Category: ${ticket.category}`)
  
  // Find appropriate technician based on category
  let targetFunction = null
  const normalizedCategory = (ticket.category || '').replace(/_/g, '').toLowerCase()
  
  switch (normalizedCategory) {
    case 'warranty':
      targetFunction = 'repair'
      break
    case 'technicalsupport':
      targetFunction = 'technicalSupport'
      break
    case 'productconsultation':
      targetFunction = 'sale'
      break
    case 'other':
      targetFunction = 'management'
      break
  }
  
  console.log(`   Mapped to function: ${targetFunction}`)
  
  if (targetFunction) {
    // Find technician
    const technician = db.prepare(`
      SELECT id, name, function 
      FROM users 
      WHERE role IN ('technician', 'admin', 'dev') 
        AND function = ? 
        AND status = 'active'
      ORDER BY id ASC
      LIMIT 1
    `).get(targetFunction) as any
    
    if (technician) {
      console.log(`\n✅ Found technician: ${technician.name} (ID: ${technician.id})`)
      console.log('   Assigning...')
      
      // Update ticket
      db.prepare(`
        UPDATE tickets 
        SET assigned_to = ?, status = 'assigned', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(technician.id, 86)
      
      // Add system comment
      const comment = `Hệ thống đã chuyển người phụ trách sang ${technician.name}`
      db.prepare(`
        INSERT INTO ticket_comments (ticket_id, user_id, comment)
        VALUES (?, ?, ?)
      `).run(86, technician.id, comment)
      
      console.log('✅ Ticket assigned successfully!')
      
      // Verify
      const updated = db.prepare('SELECT assigned_to, status FROM tickets WHERE id = 86').get() as any
      console.log(`\n✅ Verified: Ticket status = "${updated.status}", assigned_to = ${updated.assigned_to}`)
      
    } else {
      console.log(`\n❌ No technician found with function = "${targetFunction}"`)
    }
  } else {
    console.log('\n❌ Cannot determine function from category')
  }
  
} catch (error) {
  console.error('❌ Error:', error)
  process.exit(1)
} finally {
  db.close()
}


