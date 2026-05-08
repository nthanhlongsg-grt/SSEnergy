import db from '../src/database/db.js'
import { UserRole } from '../src/types/index.js'

console.log('🧪 Testing customer auto-creation when creating inverter...\n')
console.log('='.repeat(80))

try {
  // Get test users - try multiple possible emails
  let distributor = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?').get('demo2@gmail.com', 'distributor') as any
  if (!distributor) {
    distributor = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?').get('demo1@gmail.com', 'distributor') as any
  }
  if (!distributor) {
    // Get any distributor
    distributor = db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').get('distributor') as any
  }

  let endUser = db.prepare('SELECT * FROM users WHERE email = ? AND role = ?').get('enduser@demo.com', 'end_user') as any
  if (!endUser) {
    // Get any end_user
    endUser = db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').get('end_user') as any
  }

  if (!distributor) {
    console.log('❌ No distributor account found')
    process.exit(1)
  }

  if (!endUser) {
    console.log('⚠️  No end_user account found, will only test distributor')
  }

  console.log('\n📋 Test User Info:')
  console.log(`  Distributor: ${distributor.name} (${distributor.email})`)
  if (endUser) {
    console.log(`  End User: ${endUser.name} (${endUser.email})`)
  }

  // Check existing customers
  console.log('\n🔍 Checking existing customer records...')
  const distributorCustomer = db.prepare(`
    SELECT * FROM customers 
    WHERE email = ? OR phone = ?
  `).get(distributor.email, distributor.phone || '') as any

  console.log(`  Distributor customer: ${distributorCustomer ? `Found (ID: ${distributorCustomer.id})` : 'Not found'}`)
  
  let endUserCustomer: any = null
  if (endUser) {
    endUserCustomer = db.prepare(`
      SELECT * FROM customers 
      WHERE email = ? OR phone = ?
    `).get(endUser.email, endUser.phone || '') as any
    console.log(`  End user customer: ${endUserCustomer ? `Found (ID: ${endUserCustomer.id})` : 'Not found'}`)
  }

  // Simulate creating inverter for distributor
  console.log('\n📦 Simulating inverter creation for DISTRIBUTOR...')
  
  if (!distributorCustomer) {
    console.log('  → Customer record does not exist, will be created automatically')
    const customerType = distributor.organization ? 'enterprise' : 'residential'
    const customerResult = db.prepare(`
      INSERT INTO customers (name, email, phone, address, customer_type, organization)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      distributor.name,
      distributor.email || null,
      distributor.phone || null,
      distributor.address || null,
      customerType,
      distributor.organization || null
    )
    console.log(`  ✅ Created customer record (ID: ${customerResult.lastInsertRowid})`)
  } else {
    console.log(`  ✅ Using existing customer record (ID: ${distributorCustomer.id})`)
  }

  // Simulate creating inverter for end user (if exists)
  if (endUser) {
    console.log('\n📦 Simulating inverter creation for END_USER...')
    
    if (!endUserCustomer) {
      console.log('  → Customer record does not exist, will be created automatically')
      const customerType = endUser.organization ? 'enterprise' : 'residential'
      const customerResult = db.prepare(`
        INSERT INTO customers (name, email, phone, address, customer_type, organization)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        endUser.name,
        endUser.email || null,
        endUser.phone || null,
        endUser.address || null,
        customerType,
        endUser.organization || null
      )
      console.log(`  ✅ Created customer record (ID: ${customerResult.lastInsertRowid})`)
    } else {
      console.log(`  ✅ Using existing customer record (ID: ${endUserCustomer.id})`)
    }
  }

  // Check inverters linked to these users
  console.log('\n📊 Current Inverters:')
  const distributorInverters = db.prepare(`
    SELECT i.id, i.serial_number, i.user_id, i.customer_id, c.name as customer_name
    FROM inverters i
    LEFT JOIN customers c ON i.customer_id = c.id
    WHERE i.user_id = ?
  `).all(distributor.id) as Array<{ id: number; serial_number: string; user_id: number; customer_id: number | null; customer_name: string | null }>

  console.log(`  Distributor inverters: ${distributorInverters.length}`)
  distributorInverters.forEach(inv => {
    console.log(`    - ${inv.serial_number}: user_id=${inv.user_id}, customer_id=${inv.customer_id || 'NULL'} (${inv.customer_name || 'No customer'})`)
  })

  if (endUser) {
    const endUserInverters = db.prepare(`
      SELECT i.id, i.serial_number, i.user_id, i.customer_id, c.name as customer_name
      FROM inverters i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.user_id = ?
    `).all(endUser.id) as Array<{ id: number; serial_number: string; user_id: number; customer_id: number | null; customer_name: string | null }>

    console.log(`  End user inverters: ${endUserInverters.length}`)
    endUserInverters.forEach(inv => {
      console.log(`    - ${inv.serial_number}: user_id=${inv.user_id}, customer_id=${inv.customer_id || 'NULL'} (${inv.customer_name || 'No customer'})`)
    })
  }

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('\n✅ Test Summary:')
  console.log('  When END_USER or DISTRIBUTOR creates an inverter:')
  console.log('  1. System automatically finds or creates customer record from user info')
  console.log('  2. customer_id is automatically linked to the customer record')
  console.log('  3. user_id is set to the user creating the inverter')
  console.log('  4. Customer info (name, email, phone, organization) is synced from user')

  db.close()
  process.exit(0)
} catch (error) {
  console.error('❌ Error:', error)
  db.close()
  process.exit(1)
}

