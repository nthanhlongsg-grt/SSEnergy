import db from '../src/database/db.js'

try {
  // Check if notes column exists
  const tableInfo = db.prepare('PRAGMA table_info(tickets)').all() as Array<{ name: string }>
  const hasNotesColumn = tableInfo.some((col) => col.name === 'notes')

  if (!hasNotesColumn) {
    db.prepare('ALTER TABLE tickets ADD COLUMN notes TEXT').run()
    console.log('✅ Added notes column to tickets table')
  } else {
    console.log('ℹ️  Notes column already exists in tickets table')
  }

  // Update default status from 'new' to 'initialized' for new tickets
  // Note: This doesn't change existing tickets, only affects new ones
  console.log('ℹ️  Default status is now set to "initialized" in schema')

  console.log('✅ Migration completed successfully')
} catch (error) {
  console.error('❌ Migration error:', error)
  process.exit(1)
}


