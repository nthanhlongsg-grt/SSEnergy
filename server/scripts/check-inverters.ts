import db from '../src/database/db.js'

console.log('🔍 Checking inverters in database...\n')

try {
  // Get total inverters
  const totalInverters = db.prepare('SELECT COUNT(*) as count FROM inverters').get() as { count: number }
  console.log(`📊 Total inverters: ${totalInverters.count}\n`)
  
  if (totalInverters.count === 0) {
    console.log('⚠️  No inverters found in database!')
    console.log('💡 You can add inverters by:')
    console.log('   1. Go to /inverters/register page')
    console.log('   2. Or import CSV file')
    console.log('   3. Or use API to create inverters\n')
  } else {
    // Get sample inverters
    const inverters = db.prepare('SELECT * FROM inverters LIMIT 5').all() as any[]
    console.log('📦 Sample inverters:')
    inverters.forEach((inv, idx) => {
      console.log(`\n${idx + 1}. ${inv.serial_number} (${inv.model})`)
      console.log(`   Customer ID: ${inv.customer_id || 'N/A'}`)
      console.log(`   Distributor ID: ${inv.distributor_id || 'N/A'}`)
      console.log(`   Status: ${inv.status}`)
    })
  }
  
  // Check inverters by distributor
  console.log('\n' + '='.repeat(80))
  console.log('\n🔍 Checking inverters by distributor...\n')
  
  const distributors = db.prepare('SELECT id, email, name FROM users WHERE role = ?').all('distributor') as Array<{ id: number; email: string; name: string }>
  
  distributors.forEach((dist) => {
    const count = db.prepare('SELECT COUNT(*) as count FROM inverters WHERE distributor_id = ?').get(dist.id) as { count: number }
    console.log(`${dist.email}: ${count.count} inverter(s)`)
    
    // Check linked end users
    const linkedEndUsers = db.prepare(`
      SELECT id, email, name FROM users 
      WHERE parent_distributor_id = ? AND role = 'end_user'
    `).all(dist.id) as Array<{ id: number; email: string; name: string }>
    
    if (linkedEndUsers.length > 0) {
      console.log(`  Linked end users: ${linkedEndUsers.length}`)
      linkedEndUsers.forEach((eu) => {
        // Check customer records
        const customer = db.prepare(`
          SELECT id FROM customers 
          WHERE (email = ? OR phone = (SELECT phone FROM users WHERE id = ?))
          LIMIT 1
        `).get(eu.email, eu.id) as { id: number } | undefined
        
        if (customer) {
          const euInverters = db.prepare('SELECT COUNT(*) as count FROM inverters WHERE customer_id = ?').get(customer.id) as { count: number }
          console.log(`    - ${eu.email}: ${euInverters.count} inverter(s) via customer_id`)
        } else {
          console.log(`    - ${eu.email}: no matching customer record`)
        }
      })
    }
  })
  
  console.log('\n✅ Check completed!')
  
  db.close()
  process.exit(0)
} catch (error) {
  console.error('❌ Error checking inverters:', error)
  db.close()
  process.exit(1)
}




