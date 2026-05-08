import db from '../src/database/db.js'

try {
  console.log('🔧 Setting user functions for auto-assignment...\n')
  
  // Get all TECHNICIAN, ADMIN, DEV users
  const users = db.prepare(`
    SELECT id, name, role, function, status 
    FROM users 
    WHERE role IN ('TECHNICIAN', 'ADMIN', 'DEV') AND status = 'active'
    ORDER BY id ASC
  `).all() as any[]
  
  console.log(`Found ${users.length} active users with TECHNICIAN/ADMIN/DEV role:\n`)
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.role}) - ID: ${user.id}`)
    console.log(`   Current function: ${user.function || 'NULL'}`)
  })
  
  console.log('\n📝 Available functions for auto-assignment:')
  console.log('  - repair: Sửa chữa (for warranty tickets)')
  console.log('  - technicalSupport: Hỗ trợ kỹ thuật (for technical support tickets)')
  console.log('  - sale: Bán hàng (for product consultation tickets)')
  console.log('  - management: Quản lý (for other tickets)')
  
  console.log('\n💡 To set user function, run SQL command:')
  console.log('   UPDATE users SET function = \'repair\' WHERE id = <user_id>;')
  console.log('\nExample:')
  console.log('   UPDATE users SET function = \'repair\' WHERE id = 1;')
  console.log('   UPDATE users SET function = \'technicalSupport\' WHERE id = 2;')
  
} catch (error) {
  console.error('❌ Error:', error)
  process.exit(1)
} finally {
  db.close()
}


