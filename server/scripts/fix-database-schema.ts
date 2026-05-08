import db from '../src/database/db';

console.log('🔧 Fixing database schema...');

// 1. Create ticket_watchers table if not exists
try {
  console.log('Creating ticket_watchers table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS ticket_watchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(ticket_id, user_id)
    )
  `);
  console.log('✅ Verified/Created ticket_watchers table');
} catch (error) {
  console.error('❌ Error creating ticket_watchers:', error);
}

// 2. Add missing columns to tickets table
const columnsToAdd = [
  { name: 'customer_name', type: 'TEXT' },
  { name: 'customer_email', type: 'TEXT' },
  { name: 'customer_phone', type: 'TEXT' },
  { name: 'customer_address', type: 'TEXT' },
  { name: 'inverter_serial', type: 'TEXT' },
  { name: 'inverter_model', type: 'TEXT' }
];

console.log('Checking tickets table columns...');
try {
  const tableInfo = db.prepare('PRAGMA table_info(tickets)').all() as any[];
  const existingColumns = tableInfo.map(c => c.name);

  for (const col of columnsToAdd) {
    if (!existingColumns.includes(col.name)) {
      try {
        console.log(`Adding column ${col.name}...`);
        db.exec(`ALTER TABLE tickets ADD COLUMN ${col.name} ${col.type}`);
        console.log(`✅ Added column ${col.name} to tickets table`);
      } catch (error) {
        console.error(`❌ Error adding column ${col.name}:`, error);
      }
    } else {
      console.log(`ℹ️ Column ${col.name} already exists`);
    }
  }
} catch (error) {
  console.error('❌ Error checking/altering tickets table:', error);
}

console.log('🏁 Schema fix completed');




