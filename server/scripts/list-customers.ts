import db from '../src/database/db.js'

console.log('📋 Danh sách Customers:\n')

const customers = db.prepare('SELECT * FROM customers ORDER BY id').all() as any[]

console.log(`Tổng số: ${customers.length}\n`)

customers.forEach((c, i) => {
  console.log(`${i + 1}. ${c.name} (ID: ${c.id})`)
  console.log(`   Email: ${c.email || '-'}`)
  console.log(`   Phone: ${c.phone || '-'}`)
  console.log(`   Type: ${c.customer_type}`)
  console.log(`   Address: ${c.address || '-'}`)
  if (c.organization) {
    console.log(`   Organization: ${c.organization}`)
  }
  if (c.user_id) {
    console.log(`   Linked to user_id: ${c.user_id}`)
  }
  console.log('')
})




