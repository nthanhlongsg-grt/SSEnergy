import db from '../src/database/db.js'

try {
  console.log('🎫 Checking ticket 86...\n')
  
  // Get ticket info
  const ticket = db.prepare(`
    SELECT id, ticket_number, category, priority, status, assigned_to, created_at, title
    FROM tickets 
    WHERE id = 86
  `).get() as any
  
  if (!ticket) {
    console.log('❌ Ticket 86 not found')
    process.exit(1)
  }
  
  console.log('📋 Ticket Information:')
  console.log(`   ID: ${ticket.id}`)
  console.log(`   Number: ${ticket.ticket_number}`)
  console.log(`   Title: ${ticket.title}`)
  console.log(`   Category: ${ticket.category || 'NULL'}`)
  console.log(`   Priority: ${ticket.priority}`)
  console.log(`   Status: ${ticket.status}`)
  console.log(`   Assigned to: ${ticket.assigned_to || 'NULL (not assigned)'}`)
  console.log(`   Created at: ${ticket.created_at}`)
  
  // Show expected auto-assignment
  console.log('\n🎯 Auto-assignment Logic:')
  
  let targetFunction = null
  switch (ticket.category) {
    case 'warranty':
      targetFunction = 'repair'
      console.log(`   Category "${ticket.category}" → Looking for function: "repair"`)
      break
    case 'technicalSupport':
      targetFunction = 'technicalSupport'
      console.log(`   Category "${ticket.category}" → Looking for function: "technicalSupport"`)
      break
    case 'productConsultation':
      targetFunction = 'sale'
      console.log(`   Category "${ticket.category}" → Looking for function: "sale"`)
      break
    case 'other':
      targetFunction = 'management'
      console.log(`   Category "${ticket.category}" → Looking for function: "management"`)
      break
    default:
      console.log(`   ⚠️ Category "${ticket.category}" does not map to any function`)
      console.log('   ℹ️ Valid categories: warranty, technicalSupport, productConsultation, other')
  }
  
  // Check available technicians
  console.log('\n👥 All active technicians/admins/devs:')
  const allTechs = db.prepare(`
    SELECT id, name, role, function, status 
    FROM users 
    WHERE role IN ('technician', 'admin', 'dev') AND status = 'active'
    ORDER BY id ASC
  `).all() as any[]
  
  allTechs.forEach(tech => {
    const match = targetFunction && tech.function === targetFunction ? '✅ MATCH' : ''
    console.log(`   - ID ${tech.id}: ${tech.name} (${tech.role}) - function: ${tech.function || 'NULL'} ${match}`)
  })
  
  // Try to find match
  if (targetFunction) {
    const matchedTech = db.prepare(`
      SELECT id, name, function 
      FROM users 
      WHERE role IN ('technician', 'admin', 'dev') 
        AND function = ? 
        AND status = 'active'
      ORDER BY id ASC
      LIMIT 1
    `).get(targetFunction) as any
    
    if (matchedTech) {
      console.log(`\n✅ Should be assigned to: ${matchedTech.name} (ID: ${matchedTech.id})`)
      console.log(`   Reason: First active user with function = "${targetFunction}"`)
    } else {
      console.log(`\n❌ No technician found with function = "${targetFunction}"`)
      console.log('   ⚠️ This is why ticket was not auto-assigned!')
    }
  } else {
    console.log('\n❌ Category does not map to any function')
    console.log('   ⚠️ Ticket cannot be auto-assigned!')
  }
  
} catch (error) {
  console.error('❌ Error:', error)
  process.exit(1)
} finally {
  db.close()
}


