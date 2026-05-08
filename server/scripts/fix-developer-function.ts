import db from '../src/database/db.js'

try {
  console.log('🔧 Fixing Developer user function...\n')
  
  // Find Developer users
  const devUsers = db.prepare(`
    SELECT id, name, email, role, function 
    FROM users 
    WHERE role = 'dev'
    ORDER BY id ASC
  `).all() as any[]
  
  console.log(`Found ${devUsers.length} Developer users:\n`)
  
  devUsers.forEach(user => {
    console.log(`👤 ${user.name} (${user.email})`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Current function: ${user.function || 'NULL'}`)
    
    // Set function to NULL or 'develop' for developers
    if (user.function !== null) {
      console.log(`   Setting function to NULL...`)
      db.prepare('UPDATE users SET function = NULL WHERE id = ?').run(user.id)
      console.log(`   ✅ Updated to NULL`)
    } else {
      console.log(`   ✅ Already NULL`)
    }
    console.log('')
  })
  
  console.log('✅ All Developer users now have function = NULL')
  console.log('ℹ️  Developers will not be selected for auto-assignment')
  
  // Show current mapping
  console.log('\n📊 Current auto-assignment mapping (TECHNICIAN & ADMIN only):')
  const techUsers = db.prepare(`
    SELECT id, name, role, function 
    FROM users 
    WHERE role IN ('technician', 'admin') AND status = 'active' AND function IS NOT NULL
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
      functionMap[u.function].push(`${u.name} (${u.role}, ID: ${u.id})`)
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


