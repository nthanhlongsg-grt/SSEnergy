import db from '../src/database/db.js'

try {
  console.log('👥 All users in database:\n')
  
  const users = db.prepare(`
    SELECT id, name, email, role, function, status 
    FROM users 
    ORDER BY id ASC
  `).all() as any[]
  
  console.log(`Total users: ${users.length}\n`)
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name} (${user.email})`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Function: ${user.function || 'NULL'}`)
    console.log(`   Status: ${user.status}`)
    console.log('')
  })
  
  // Count by role
  console.log('📊 Count by role:')
  const roleCounts = db.prepare(`
    SELECT role, COUNT(*) as count 
    FROM users 
    GROUP BY role
  `).all() as any[]
  
  roleCounts.forEach(row => {
    console.log(`  - ${row.role}: ${row.count}`)
  })
  
} catch (error) {
  console.error('❌ Error:', error)
  process.exit(1)
} finally {
  db.close()
}


