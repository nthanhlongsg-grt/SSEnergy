import db from '../src/database/db.js'

try {
  // Check if capacity column exists
  const tableInfo = db.prepare('PRAGMA table_info(models)').all() as Array<{ name: string }>
  const hasCapacityColumn = tableInfo.some((col) => col.name === 'capacity')

  if (!hasCapacityColumn) {
    db.prepare('ALTER TABLE models ADD COLUMN capacity REAL').run()
    console.log('✅ Added capacity column to models table')
  } else {
    console.log('ℹ️  Capacity column already exists in models table')
  }

  console.log('✅ Migration completed successfully')
} catch (error) {
  console.error('❌ Migration error:', error)
  process.exit(1)
}

