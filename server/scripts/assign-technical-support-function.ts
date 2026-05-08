import db from '../src/database/db.js'

try {
  console.log('🔧 Assigning technicalSupport function to user...\n')
  
  // Option 1: Assign to Nguyễn Quốc Khánh (ID: 6) who currently has NULL function
  const userId = 6
  
  // Check user first
  const user = db.prepare('SELECT id, name, role, function FROM users WHERE id = ?').get(userId) as any
  
  if (!user) {
    console.error('❌ User not found with ID:', userId)
    process.exit(1)
  }
  
  console.log('👤 User before update:')
  console.log(`   Name: ${user.name}`)
  console.log(`   Role: ${user.role}`)
  console.log(`   Function: ${user.function || 'NULL'}`)
  
  // Update function
  db.prepare('UPDATE users SET function = ? WHERE id = ?').run('technicalSupport', userId)
  
  // Verify update
  const updatedUser = db.prepare('SELECT id, name, role, function FROM users WHERE id = ?').get(userId) as any
  
  console.log('\n✅ User after update:')
  console.log(`   Name: ${updatedUser.name}`)
  console.log(`   Role: ${updatedUser.role}`)
  console.log(`   Function: ${updatedUser.function}`)
  
  console.log('\n🎯 Auto-assignment mapping:')
  console.log('   Category "technicalSupport" (Hỗ trợ kỹ thuật) → User:', updatedUser.name)
  
  console.log('\n✅ Done! Now tickets with category "technicalSupport" will be auto-assigned to:', updatedUser.name)
  
} catch (error) {
  console.error('❌ Error:', error)
  process.exit(1)
} finally {
  db.close()
}


