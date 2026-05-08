import db from '../src/database/db.js'

try {
  // Check users table schema
  console.log('📋 Users table schema:')
  const tableInfo = db.prepare('PRAGMA table_info(users)').all() as Array<{ 
    cid: number
    name: string
    type: string
    notnull: number
    dflt_value: any
    pk: number 
  }>
  
  tableInfo.forEach(col => {
    console.log(`  - ${col.name} (${col.type})${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`)
  })
  
  // Check if function column exists
  const hasFunctionColumn = tableInfo.some(col => col.name === 'function')
  console.log('\n✅ Has function column:', hasFunctionColumn)
  
  if (hasFunctionColumn) {
    // Show users with their functions
    console.log('\n👥 Users with functions:')
    const users = db.prepare(`
      SELECT id, name, role, function, status 
      FROM users 
      WHERE role IN ('TECHNICIAN', 'ADMIN', 'DEV')
      ORDER BY id ASC
    `).all() as any[]
    
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.role}) - function: ${user.function || 'NULL'} - status: ${user.status}`)
    })
  }
  
} catch (error) {
  console.error('❌ Error:', error)
  process.exit(1)
} finally {
  db.close()
}


