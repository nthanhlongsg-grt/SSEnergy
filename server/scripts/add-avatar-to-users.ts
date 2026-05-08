import db from '../src/database/db.js'

const addAvatarColumn = () => {
  console.log('🔧 Adding avatar column to users table...')
  
  try {
    // Check if column already exists
    const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[]
    const hasAvatar = tableInfo.some(col => col.name === 'avatar')
    
    if (hasAvatar) {
      console.log('  ℹ️ Avatar column already exists in users table.')
      return
    }
    
    // Add avatar column
    db.prepare(`
      ALTER TABLE users
      ADD COLUMN avatar TEXT
    `).run()
    
    console.log('  ✓ Added avatar column to users table')
    console.log('✅ Avatar column setup completed!')
  } catch (error) {
    console.error('❌ Error adding avatar column:', error)
    process.exit(1)
  } finally {
    db.close()
  }
}

addAvatarColumn()

