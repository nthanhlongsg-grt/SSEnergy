import db from '../src/database/db.js'

try {
  console.log('👥 Finding users to assign technicalSupport function...\n')
  
  // Get all active technicians/admins/devs
  const users = db.prepare(`
    SELECT id, name, role, function, status 
    FROM users 
    WHERE role IN ('technician', 'admin', 'dev') AND status = 'active'
    ORDER BY id ASC
  `).all() as any[]
  
  console.log(`Found ${users.length} active staff members:\n`)
  
  users.forEach((user, index) => {
    const functionDesc = user.function ? `✅ ${user.function}` : '❌ NULL (available)'
    console.log(`${index + 1}. ID ${user.id}: ${user.name} (${user.role})`)
    console.log(`   Function: ${functionDesc}`)
    console.log('')
  })
  
  // Find users with NULL function
  const availableUsers = users.filter(u => !u.function)
  
  if (availableUsers.length > 0) {
    console.log(`\n🎯 ${availableUsers.length} user(s) available for technicalSupport assignment:`)
    availableUsers.forEach(u => {
      console.log(`   - ID ${u.id}: ${u.name} (${u.role})`)
    })
    
    // Set technicalSupport for first available user
    const userToUpdate = availableUsers[0]
    console.log(`\n🔧 Setting technicalSupport function for: ${userToUpdate.name} (ID: ${userToUpdate.id})...`)
    
    db.prepare('UPDATE users SET function = ? WHERE id = ?').run('technicalSupport', userToUpdate.id)
    
    console.log('✅ Done!')
    
    // Verify
    const updated = db.prepare('SELECT id, name, function FROM users WHERE id = ?').get(userToUpdate.id) as any
    console.log(`\n✅ Verified: ${updated.name} now has function = "${updated.function}"`)
    
  } else {
    console.log('\n⚠️ All users already have functions assigned.')
    console.log('💡 You can reassign an existing user or add a new user.')
  }
  
} catch (error) {
  console.error('❌ Error:', error)
  process.exit(1)
} finally {
  db.close()
}


