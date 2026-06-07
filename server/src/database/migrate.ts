import db from './db.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Migration script for database schema changes
 * 
 * Usage:
 * 1. Create a new migration file in migrations/ folder
 * 2. Add migration logic below
 * 3. Run: npm run db:migrate
 */

interface Migration {
  version: number
  name: string
  up: () => void
  down?: () => void
}

// Track migrations in database
const createMigrationsTable = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

// Check if migration has been applied
const isMigrationApplied = (version: number): boolean => {
  const result = db.prepare('SELECT id FROM migrations WHERE version = ?').get(version) as { id: number } | undefined
  return !!result
}

// Mark migration as applied
const markMigrationApplied = (version: number, name: string) => {
  db.prepare('INSERT INTO migrations (version, name) VALUES (?, ?)').run(version, name)
}

// Define migrations here
const migrations: Migration[] = [
  {
    version: 1,
    name: 'Add denormalized fields to tickets table for data synchronization',
    up: () => {
      // Check which columns already exist
      const tableInfo = db.prepare('PRAGMA table_info(tickets)').all() as Array<{ name: string }>
      const existingColumns = tableInfo.map(col => col.name)
      
      // Add denormalized customer fields (only if they don't exist)
      if (!existingColumns.includes('customer_name')) {
        db.exec(`ALTER TABLE tickets ADD COLUMN customer_name TEXT;`)
      }
      if (!existingColumns.includes('customer_email')) {
        db.exec(`ALTER TABLE tickets ADD COLUMN customer_email TEXT;`)
      }
      if (!existingColumns.includes('customer_phone')) {
        db.exec(`ALTER TABLE tickets ADD COLUMN customer_phone TEXT;`)
      }
      if (!existingColumns.includes('customer_address')) {
        db.exec(`ALTER TABLE tickets ADD COLUMN customer_address TEXT;`)
      }
      
      // Add denormalized inverter fields (only if they don't exist)
      if (!existingColumns.includes('inverter_serial')) {
        db.exec(`ALTER TABLE tickets ADD COLUMN inverter_serial TEXT;`)
      }
      if (!existingColumns.includes('inverter_model')) {
        db.exec(`ALTER TABLE tickets ADD COLUMN inverter_model TEXT;`)
      }
      
      // Populate existing tickets with denormalized data
      db.exec(`
        UPDATE tickets 
        SET customer_name = (SELECT name FROM customers WHERE customers.id = tickets.customer_id),
            customer_email = (SELECT email FROM customers WHERE customers.id = tickets.customer_id),
            customer_phone = (SELECT phone FROM customers WHERE customers.id = tickets.customer_id),
            customer_address = (SELECT address FROM customers WHERE customers.id = tickets.customer_id)
        WHERE customer_id IS NOT NULL;
      `)
      
      db.exec(`
        UPDATE tickets 
        SET inverter_serial = (SELECT serial_number FROM inverters WHERE inverters.id = tickets.inverter_id),
            inverter_model = (SELECT model FROM inverters WHERE inverters.id = tickets.inverter_id)
        WHERE inverter_id IS NOT NULL;
      `)
    },
  },
  {
    version: 2,
    name: 'Set developer account role to dev',
    up: () => {
      db.exec(`
        UPDATE users
        SET role = 'dev'
        WHERE email = 'developer@SGE.vn' OR name = 'developer'
      `)
    },
  },
  {
    version: 3,
    name: 'Create notifications table',
    up: () => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS notifications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT,
          entity_type TEXT,
          entity_id INTEGER,
          data TEXT,
          is_read INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at);
      `)
    },
  },
  {
    version: 4,
    name: 'Add pending_reason to tickets',
    up: () => {
      db.exec(`
        ALTER TABLE tickets ADD COLUMN pending_reason TEXT;
      `)
    },
  },
  {
    version: 5,
    name: 'Add comment_id to ticket_attachments',
    up: () => {
      // Check if column already exists
      const tableInfo = db.prepare('PRAGMA table_info(ticket_attachments)').all() as Array<{ name: string }>
      const hasCommentId = tableInfo.some(col => col.name === 'comment_id')
      
      if (!hasCommentId) {
        db.exec(`
          ALTER TABLE ticket_attachments ADD COLUMN comment_id INTEGER;
          CREATE INDEX IF NOT EXISTS idx_ticket_attachments_comment_id ON ticket_attachments(comment_id);
        `)
      }
    },
  },
]

const runMigrations = () => {
  console.log('🔄 Running database migrations...\n')
  
  createMigrationsTable()
  
  let appliedCount = 0
  
  for (const migration of migrations) {
    if (isMigrationApplied(migration.version)) {
      console.log(`⏭️  Migration ${migration.version}: ${migration.name} - already applied`)
      continue
    }
    
    try {
      console.log(`📝 Applying migration ${migration.version}: ${migration.name}...`)
      migration.up()
      markMigrationApplied(migration.version, migration.name)
      appliedCount++
      console.log(`✅ Migration ${migration.version} applied successfully\n`)
    } catch (error) {
      console.error(`❌ Error applying migration ${migration.version}:`, error)
      throw error
    }
  }
  
  if (appliedCount === 0) {
    console.log('✅ No new migrations to apply')
  } else {
    console.log(`✅ Applied ${appliedCount} migration(s)`)
  }
}

// Run migrations
try {
  runMigrations()
  db.close()
  process.exit(0)
} catch (error) {
  console.error('❌ Migration failed:', error)
  db.close()
  process.exit(1)
}


