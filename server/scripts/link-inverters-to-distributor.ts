import db from '../src/database/db.js'

console.log('🔗 Linking inverters to distributors...\n')

try {
  // Get distributor demo2
  const distributor = db.prepare('SELECT id, email, name FROM users WHERE email = ?').get('demo2@gmail.com') as { id: number; email: string; name: string } | undefined
  
  if (!distributor) {
    console.log('❌ Distributor demo2@gmail.com not found!')
    process.exit(1)
  }
  
  console.log(`✅ Found distributor: ${distributor.email} (ID: ${distributor.id})\n`)
  
  // Get inverters without distributor_id
  const invertersWithoutDist = db.prepare('SELECT id, serial_number, model FROM inverters WHERE distributor_id IS NULL').all() as Array<{ id: number; serial_number: string; model: string }>
  
  console.log(`📊 Found ${invertersWithoutDist.length} inverter(s) without distributor\n`)
  
  if (invertersWithoutDist.length === 0) {
    console.log('✅ All inverters already have distributor assigned!')
    process.exit(0)
  }
  
  // Link first 3 inverters to this distributor
  const invertersToLink = invertersWithoutDist.slice(0, 3)
  
  console.log(`🔗 Linking ${invertersToLink.length} inverter(s) to distributor...\n`)
  
  invertersToLink.forEach((inv) => {
    db.prepare('UPDATE inverters SET distributor_id = ? WHERE id = ?').run(distributor.id, inv.id)
    console.log(`  ✓ Linked: ${inv.serial_number} (${inv.model})`)
  })
  
  // Also create a customer record for the end user if not exists
  const endUser = db.prepare('SELECT id, email, phone, name FROM users WHERE email = ?').get('enduser@demo.com') as { id: number; email: string; phone: string | null; name: string } | undefined
  
  if (endUser) {
    console.log(`\n📝 Checking customer record for end user: ${endUser.email}`)
    
    const existingCustomer = db.prepare('SELECT id FROM customers WHERE email = ?').get(endUser.email) as { id: number } | undefined
    
    if (!existingCustomer) {
      console.log('  Creating customer record...')
      const result = db.prepare(`
        INSERT INTO customers (name, email, phone, customer_type, organization)
        VALUES (?, ?, ?, ?, ?)
      `).run(endUser.name, endUser.email, endUser.phone || null, 'residential', 'Demo End User')
      
      const customerId = result.lastInsertRowid as number
      console.log(`  ✓ Created customer record (ID: ${customerId})`)
      
      // Link 2 inverters to this customer
      if (invertersWithoutDist.length > 3) {
        const customerInverters = invertersWithoutDist.slice(3, 5)
        console.log(`\n🔗 Linking ${customerInverters.length} inverter(s) to customer...\n`)
        
        customerInverters.forEach((inv) => {
          db.prepare('UPDATE inverters SET customer_id = ?, distributor_id = ? WHERE id = ?').run(customerId, distributor.id, inv.id)
          console.log(`  ✓ Linked: ${inv.serial_number} (${inv.model})`)
        })
      }
    } else {
      console.log(`  ✓ Customer record already exists (ID: ${existingCustomer.id})`)
    }
  }
  
  // Show final summary
  console.log('\n' + '='.repeat(80))
  console.log('\n📊 Final Summary:\n')
  
  const distInverters = db.prepare('SELECT COUNT(*) as count FROM inverters WHERE distributor_id = ?').get(distributor.id) as { count: number }
  console.log(`Distributor ${distributor.email}: ${distInverters.count} inverter(s)`)
  
  console.log('\n✅ Linking completed!')
  console.log('\n💡 Now login with demo2@gmail.com to see the inverters!')
  
  db.close()
  process.exit(0)
} catch (error) {
  console.error('❌ Error linking inverters:', error)
  db.close()
  process.exit(1)
}




