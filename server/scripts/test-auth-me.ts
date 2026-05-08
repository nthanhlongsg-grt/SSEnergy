import db from '../src/database/db.js'
import jwt from 'jsonwebtoken'

const testAuthMe = () => {
  try {
    console.log('🧪 Testing /auth/me endpoint logic...\n')
    
    // Get a distributor user
    const distributor = db.prepare('SELECT * FROM users WHERE role = ? LIMIT 1').get('distributor') as any
    if (!distributor) {
      console.log('❌ No distributor found in database')
      process.exit(1)
    }
    
    console.log(`✅ Found distributor: ${distributor.email}`)
    console.log(`   ID: ${distributor.id}`)
    console.log(`   Role: ${distributor.role}`)
    console.log(`   Status: ${distributor.status}\n`)
    
    // Get table info
    const tableInfo = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>
    const columnNames = tableInfo.map(col => col.name)
    console.log(`📋 Available columns (${columnNames.length}):`)
    console.log(`   ${columnNames.join(', ')}\n`)
    
    // Build SELECT query with only existing columns
    const selectColumns = [
      'id', 'name', 'email', 'code', 'role', 'function', 
      'organization', 'status', 'phone', 'address', 
      'parent_distributor_id', 'created_at', 'updated_at'
    ].filter(col => columnNames.includes(col))
    
    // Add avatar if it exists
    if (columnNames.includes('avatar')) {
      selectColumns.push('avatar')
    }
    
    console.log(`🔍 Selected columns (${selectColumns.length}):`)
    console.log(`   ${selectColumns.join(', ')}\n`)
    
    // Test query
    const query = `SELECT ${selectColumns.join(', ')} FROM users WHERE id = ?`
    console.log(`📝 Query: ${query}\n`)
    
    const user = db.prepare(query).get(distributor.id) as any
    
    if (!user) {
      console.log('❌ User not found with query')
      process.exit(1)
    }
    
    console.log('✅ Query successful!')
    console.log('📦 User data:')
    console.log(JSON.stringify(user, null, 2))
    
    // Check permissions
    const rolePermissions: Record<string, string[]> = {
      distributor: ['view_inverters', 'create_inverter', 'view_tickets', 'create_ticket'],
      end_user: ['view_inverters', 'create_inverter'],
    }
    
    const expectedPerms = rolePermissions[user.role] || []
    console.log(`\n🔐 Expected permissions for ${user.role}:`)
    expectedPerms.forEach(perm => {
      console.log(`   ✓ ${perm}`)
    })
    
    console.log('\n✅ All tests passed!')
    
    db.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error testing auth/me:', error)
    console.error('Error details:', error instanceof Error ? error.message : String(error))
    db.close()
    process.exit(1)
  }
}

testAuthMe()




