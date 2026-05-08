import db from '../src/database/db.js'

try {
  // Check if type column exists
  const tableInfo = db.prepare('PRAGMA table_info(inverters)').all() as Array<{ name: string }>
  const hasTypeColumn = tableInfo.some((col) => col.name === 'type')

  if (!hasTypeColumn) {
    db.prepare('ALTER TABLE inverters ADD COLUMN type TEXT').run()
    console.log('✅ Added type column to inverters table')
  } else {
    console.log('ℹ️  Type column already exists in inverters table')
  }

  console.log('✅ Migration completed successfully')
} catch (error) {
  console.error('❌ Migration error:', error)
  process.exit(1)
}


