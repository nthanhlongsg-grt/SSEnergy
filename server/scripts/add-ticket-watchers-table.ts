import db from '../src/database/db.js'

try {
  // Create ticket_watchers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_watchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(ticket_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_ticket_watchers_ticket ON ticket_watchers(ticket_id);
    CREATE INDEX IF NOT EXISTS idx_ticket_watchers_user ON ticket_watchers(user_id);
  `)

  console.log('✅ Created ticket_watchers table and indexes')
  console.log('✅ Migration completed successfully')
} catch (error) {
  console.error('❌ Migration error:', error)
  process.exit(1)
} finally {
  db.close()
}

