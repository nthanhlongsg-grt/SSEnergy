import db from '../src/database/db.js'

try {
  console.log('🔧 Updating user functions...\n')
  
  // First, show all technicians
  const allUsers = db.prepare(`
    SELECT id, name, role, function, status 
    FROM users 
    WHERE status = 'active'
    ORDER BY id ASC
  `).all() as any[]
  
  console.log(`Found ${allUsers.length} active users\n`)
  
  // Update user ID 6 to have technicalSupport function
  console.log('📝 Setting technicalSupport function for user ID 6...')
  const result = db.prepare('UPDATE users SET function = ? WHERE id = ?').run('technicalSupport', 6)
  console.log(`   Changes: ${result.changes}`)
  
  if (result.changes > 0) {
    console.log('✅ Successfully updated!')
    
    // Verify
    const updated = db.prepare('SELECT id, name, function FROM users WHERE id = 6').get() as any
    if (updated) {
      console.log(`\n✅ Verified: ${updated.name} now has function = "${updated.function}"`)
    }
  } else {
    console.log('⚠️ No changes made. User ID 6 might not exist.')
  }
  
  // Show current mapping
  console.log('\n📊 Current auto-assignment mapping:')
  const techUsers = db.prepare(`
    SELECT id, name, function 
    FROM users 
    WHERE role IN ('technician', 'admin', 'dev') AND status = 'active' AND function IS NOT NULL
    ORDER BY function, id ASC
  `).all() as any[]
  
  const functionMap: Record<string, string[]> = {
    repair: [],
    technicalSupport: [],
    sale: [],
    management: []
  }
  
  techUsers.forEach(u => {
    if (u.function && functionMap[u.function]) {
      functionMap[u.function].push(`${u.name} (ID: ${u.id})`)
    }
  })
  
  console.log(`   warranty (Bảo hành) → ${functionMap.repair.join(', ') || 'None'}`)
  console.log(`   technicalSupport (Hỗ trợ kỹ thuật) → ${functionMap.technicalSupport.join(', ') || 'None'}`)
  console.log(`   productConsultation (Tư vấn) → ${functionMap.sale.join(', ') || 'None'}`)
  console.log(`   other (Khác) → ${functionMap.management.join(', ') || 'None'}`)
  
} catch (error) {
  console.error('❌ Error:', error)
  process.exit(1)
} finally {
  db.close()
}


