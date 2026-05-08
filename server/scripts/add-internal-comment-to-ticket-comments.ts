import db from '../src/database/db.js'

try {
  // Check if is_internal column exists
  const tableInfo = db.prepare('PRAGMA table_info(ticket_comments)').all() as Array<{ name: string }>
  const hasInternalColumn = tableInfo.some((col) => col.name === 'is_internal')

  if (!hasInternalColumn) {
    // Add is_internal column to ticket_comments table
    db.prepare('ALTER TABLE ticket_comments ADD COLUMN is_internal INTEGER DEFAULT 0').run()
    console.log('✅ Added is_internal column to ticket_comments table')
  } else {
    console.log('ℹ️  is_internal column already exists in ticket_comments table')
  }

  console.log('✅ Migration completed successfully')
} catch (error) {
  console.error('❌ Migration error:', error)
  process.exit(1)
} finally {
  db.close()
}

