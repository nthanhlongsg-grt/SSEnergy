import db from '../src/database/db.js'

try {
  console.log('🔄 Thêm bảng inverter_errors vào database...')
  
  // Create inverter_errors table
  db.exec(`
    CREATE TABLE IF NOT EXISTS inverter_errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inverter_id INTEGER NOT NULL,
      error_code TEXT,
      error_type TEXT NOT NULL,
      error_message TEXT NOT NULL,
      severity TEXT NOT NULL DEFAULT 'medium',
      occurred_at DATETIME NOT NULL,
      resolved_at DATETIME,
      resolution TEXT,
      ticket_id INTEGER,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inverter_id) REFERENCES inverters(id) ON DELETE CASCADE,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_inverter_errors_inverter ON inverter_errors(inverter_id);
    CREATE INDEX IF NOT EXISTS idx_inverter_errors_occurred ON inverter_errors(occurred_at);
  `)
  
  console.log('✅ Đã tạo bảng inverter_errors thành công!')
  
  // Check if table exists
  const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='inverter_errors'").get() as any
  if (tableInfo) {
    console.log('✅ Bảng inverter_errors đã tồn tại trong database')
  }
} catch (error) {
  console.error('❌ Lỗi khi tạo bảng:', error)
  process.exit(1)
}


