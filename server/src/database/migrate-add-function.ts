import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const dbDir = path.join(process.cwd(), 'data')
const dbPath = path.join(dbDir, 'growatt.db')

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

const db = new Database(dbPath)

try {
  // Check if column already exists
  const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>
  const hasFunctionColumn = tableInfo.some(col => col.name === 'function')
  
  if (!hasFunctionColumn) {
    db.prepare('ALTER TABLE users ADD COLUMN function TEXT').run()
    console.log('✅ Added function column to users table')
  } else {
    console.log('ℹ️  Column function already exists in users table')
  }
  
  db.close()
  process.exit(0)
} catch (error: any) {
  console.error('❌ Migration error:', error.message)
  db.close()
  process.exit(1)
}




