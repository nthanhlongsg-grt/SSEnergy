import db from '../src/database/db.js'

try {
  const tableInfo = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>
  const hasParentDistributorColumn = tableInfo.some((col) => col.name === 'parent_distributor_id')

  if (!hasParentDistributorColumn) {
    db.prepare('ALTER TABLE users ADD COLUMN parent_distributor_id INTEGER').run()
    console.log('✅ Added parent_distributor_id column to users table')
    
    // Add foreign key constraint (SQLite doesn't support adding FK after table creation, but we can add index)
    db.prepare('CREATE INDEX IF NOT EXISTS idx_users_parent_distributor ON users(parent_distributor_id)').run()
    console.log('✅ Added index for parent_distributor_id')
  } else {
    console.log('ℹ️  parent_distributor_id column already exists in users table')
  }

  console.log('✅ Migration completed successfully')
} catch (error) {
  console.error('❌ Migration error:', error)
  process.exit(1)
}

