import db from '../src/database/db.js'

try {
  console.log('🔧 Correcting technician functions based on UI...\n')
  
  // Based on user's screenshot:
  // - Nguyễn Quốc Khánh → Technic (technicalSupport)
  // - Nguyễn Thanh Vũ → Repair (repair)
  // - Nguyễn Thành Long → Repair (repair)
  // - Đoàn Nguyễn Hải Thanh → Sale (sale)
  // - Phạm Văn Hùng → Manage (management)
  // - Hoàng Đức Sơn → Manage (management)
  
  const updates = [
    { id: 12, name: 'Nguyễn Quốc Khánh', function: 'technicalSupport' },
    { id: 13, name: 'Nguyễn Thanh Vũ', function: 'repair' },
    { id: 14, name: 'Nguyễn Thành Long', function: 'repair' },
    { id: 15, name: 'Đoàn Nguyễn Hải Thanh', function: 'sale' },
    { id: 10, name: 'Phạm Văn Hùng', function: 'management' },
    { id: 11, name: 'Hoàng Đức Sơn', function: 'management' },
  ]
  
  console.log('Updating functions:\n')
  
  updates.forEach(update => {
    const current = db.prepare('SELECT function FROM users WHERE id = ?').get(update.id) as any
    
    if (current) {
      console.log(`${update.name}:`)
      console.log(`   Before: ${current.function || 'NULL'}`)
      
      db.prepare('UPDATE users SET function = ? WHERE id = ?').run(update.function, update.id)
      
      console.log(`   After:  ${update.function}`)
      console.log('')
    }
  })
  
  console.log('✅ All functions updated!\n')
  
  // Show final mapping
  console.log('📊 Final auto-assignment mapping:')
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


