import db from '../src/database/db.js'

console.log('🔍 Verifying user_id links in database...\n')
console.log('='.repeat(80))

try {
  // Check inverters table
  console.log('\n📦 INVERTERS Table:')
  const inverterCols = db.prepare('PRAGMA table_info(inverters)').all() as Array<{ name: string }>
  const hasUserIdInInverters = inverterCols.some(col => col.name === 'user_id')
  console.log(`  ✓ Has user_id column: ${hasUserIdInInverters ? '✅ YES' : '❌ NO'}`)
  
  if (hasUserIdInInverters) {
    const totalInverters = db.prepare('SELECT COUNT(*) as count FROM inverters').get() as { count: number }
    const withUserId = db.prepare('SELECT COUNT(*) as count FROM inverters WHERE user_id IS NOT NULL').get() as { count: number }
    console.log(`  Total: ${totalInverters.count}, With user_id: ${withUserId.count}`)
  }
  
  // Check tickets table
  console.log('\n🎫 TICKETS Table:')
  const ticketCols = db.prepare('PRAGMA table_info(tickets)').all() as Array<{ name: string }>
  const hasCreatedByInTickets = ticketCols.some(col => col.name === 'created_by')
  console.log(`  ✓ Has created_by column (links to users): ${hasCreatedByInTickets ? '✅ YES' : '❌ NO'}`)
  
  if (hasCreatedByInTickets) {
    const totalTickets = db.prepare('SELECT COUNT(*) as count FROM tickets').get() as { count: number }
    const withCreatedBy = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE created_by IS NOT NULL').get() as { count: number }
    console.log(`  Total: ${totalTickets.count}, With created_by: ${withCreatedBy.count}`)
  }
  
  // Check notifications table
  console.log('\n🔔 NOTIFICATIONS Table:')
  const notifCols = db.prepare('PRAGMA table_info(notifications)').all() as Array<{ name: string }>
  const hasUserIdInNotif = notifCols.some(col => col.name === 'user_id')
  console.log(`  ✓ Has user_id column: ${hasUserIdInNotif ? '✅ YES' : '❌ NO'}`)
  
  if (hasUserIdInNotif) {
    const totalNotif = db.prepare('SELECT COUNT(*) as count FROM notifications').get() as { count: number }
    const withUserId = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id IS NOT NULL').get() as { count: number }
    console.log(`  Total: ${totalNotif.count}, With user_id: ${withUserId.count}`)
  }
  
  // Check specific users
  console.log('\n' + '='.repeat(80))
  console.log('\n👥 USERS Check:')
  
  const testUsers = [
    { email: 'demo2@gmail.com', role: 'distributor' },
    { email: 'enduser@demo.com', role: 'end_user' },
  ]
  
  for (const testUser of testUsers) {
    const user = db.prepare('SELECT id, email, name, role FROM users WHERE email = ?').get(testUser.email) as { id: number; email: string; name: string; role: string } | undefined
    
    if (!user) {
      console.log(`\n❌ User not found: ${testUser.email}`)
      continue
    }
    
    console.log(`\n📋 ${user.email} (${user.role}, ID: ${user.id}):`)
    
    // Check inverters
    if (hasUserIdInInverters) {
      const inverters = db.prepare('SELECT COUNT(*) as count FROM inverters WHERE user_id = ?').get(user.id) as { count: number }
      console.log(`  Inverters: ${inverters.count}`)
      
      if (inverters.count > 0) {
        const sampleInv = db.prepare('SELECT serial_number, model FROM inverters WHERE user_id = ? LIMIT 3').all(user.id) as Array<{ serial_number: string; model: string }>
        sampleInv.forEach(inv => {
          console.log(`    - ${inv.serial_number} (${inv.model})`)
        })
      }
    }
    
    // Check tickets
    if (hasCreatedByInTickets) {
      const tickets = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE created_by = ?').get(user.id) as { count: number }
      console.log(`  Tickets (created): ${tickets.count}`)
    }
    
    // Check notifications
    if (hasUserIdInNotif) {
      const notifications = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?').get(user.id) as { count: number }
      console.log(`  Notifications: ${notifications.count}`)
    }
    
    // For distributor, check linked end users
    if (user.role === 'distributor') {
      const linkedEndUsers = db.prepare(`
        SELECT id, email, name FROM users 
        WHERE parent_distributor_id = ? AND role = 'end_user'
      `).all(user.id) as Array<{ id: number; email: string; name: string }>
      
      console.log(`  Linked end users: ${linkedEndUsers.length}`)
      if (linkedEndUsers.length > 0) {
        linkedEndUsers.forEach(eu => {
          console.log(`    - ${eu.email}`)
          
          // Check inverters of linked end user
          if (hasUserIdInInverters) {
            const euInverters = db.prepare('SELECT COUNT(*) as count FROM inverters WHERE user_id = ?').get(eu.id) as { count: number }
            console.log(`      Inverters: ${euInverters.count}`)
          }
        })
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('\n✅ Verification Summary:')
  console.log(`  Inverters: ${hasUserIdInInverters ? '✅' : '❌'} user_id column`)
  console.log(`  Tickets: ${hasCreatedByInTickets ? '✅' : '❌'} created_by column`)
  console.log(`  Notifications: ${hasUserIdInNotif ? '✅' : '❌'} user_id column`)
  
  if (hasUserIdInInverters && hasCreatedByInTickets && hasUserIdInNotif) {
    console.log('\n🎉 All tables are correctly linked via user_id!')
    console.log('\n📝 Summary:')
    console.log('  - Inverters: linked via user_id')
    console.log('  - Tickets: linked via created_by (user_id)')
    console.log('  - Notifications: linked via user_id')
  } else {
    console.log('\n⚠️  Some tables are missing user_id links!')
  }
  
  db.close()
  process.exit(0)
} catch (error) {
  console.error('❌ Error verifying user links:', error)
  db.close()
  process.exit(1)
}




