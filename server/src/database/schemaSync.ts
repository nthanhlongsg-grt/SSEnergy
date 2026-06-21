import type Database from 'better-sqlite3'
import { applyViewsAndTriggers, applyPerformanceIndexes } from './viewsAndTriggers.js'
import { reconcileDataIntegrity } from './dataIntegrity.js'

function tableColumns(db: Database.Database, table: string): Set<string> {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  return new Set(cols.map((c) => c.name))
}

function tableExists(db: Database.Database, table: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table) as { name: string } | undefined
  return !!row
}

function addColumn(
  db: Database.Database,
  table: string,
  column: string,
  definition: string,
  applied: string[],
): void {
  if (!tableExists(db, table)) return
  if (tableColumns(db, table).has(column)) return
  db.prepare(`ALTER TABLE ${table} ADD COLUMN ${definition}`).run()
  applied.push(`${table}.${column}`)
}

/**
 * Align an existing SQLite database with the current application schema.
 * Safe to run repeatedly (idempotent).
 */
export function applySchemaSync(db: Database.Database): string[] {
  const applied: string[] = []

  const add = (table: string, column: string, definition: string) =>
    addColumn(db, table, column, definition, applied)

  // --- users ---
  add('users', 'function', 'function TEXT')
  add('users', 'avatar', 'avatar TEXT')
  add('users', 'parent_distributor_id', 'parent_distributor_id INTEGER')
  add('users', 'cached_active_tickets', 'cached_active_tickets INTEGER DEFAULT 0')
  add('users', 'cached_today_tasks', 'cached_today_tasks INTEGER DEFAULT 0')
  add('users', 'bank_account', 'bank_account TEXT')
  add('users', 'bank_name', 'bank_name TEXT')
  add('users', 'bank_account_name', 'bank_account_name TEXT')

  // --- customers ---
  add('customers', 'contact_user_id', 'contact_user_id INTEGER')
  add('customers', 'contact_phone', 'contact_phone TEXT')
  add('customers', 'contact_email', 'contact_email TEXT')
  add('customers', 'contact_address', 'contact_address TEXT')
  add('customers', 'representative_name', 'representative_name TEXT')
  add('customers', 'representative_position', 'representative_position TEXT')
  add('customers', 'authorization_doc', 'authorization_doc TEXT')
  add('customers', 'recipient_name', 'recipient_name TEXT')
  add('customers', 'recipient_address', 'recipient_address TEXT')
  add('customers', 'recipient_phone', 'recipient_phone TEXT')

  if (tableExists(db, 'customers') && tableColumns(db, 'customers').has('contact_user_id')) {
    db.prepare(
      'UPDATE customers SET contact_user_id = user_id WHERE user_id IS NOT NULL AND contact_user_id IS NULL',
    ).run()
  }

  // --- inverters ---
  add('inverters', 'type', 'type TEXT')
  add('inverters', 'manufacturer', 'manufacturer TEXT')
  add('inverters', 'warranty_months', 'warranty_months INTEGER')
  add('inverters', 'project_name', 'project_name TEXT')

  // --- tickets ---
  add('tickets', 'notes', 'notes TEXT')
  add('tickets', 'pending_reason', 'pending_reason TEXT')
  add('tickets', 'assigned_at', 'assigned_at DATETIME')
  add('tickets', 'customer_name', 'customer_name TEXT')
  add('tickets', 'customer_email', 'customer_email TEXT')
  add('tickets', 'customer_phone', 'customer_phone TEXT')
  add('tickets', 'customer_address', 'customer_address TEXT')
  add('tickets', 'inverter_serial', 'inverter_serial TEXT')
  add('tickets', 'inverter_model', 'inverter_model TEXT')
  add('tickets', 'report_html_file', 'report_html_file TEXT')

  // --- ticket attachments / comments ---
  add('ticket_attachments', 'comment_id', 'comment_id INTEGER')
  add('ticket_attachments', 'file_size', 'file_size INTEGER')
  add('ticket_attachments', 'mime_type', 'mime_type TEXT')
  add('ticket_attachments', 'uploaded_by', 'uploaded_by INTEGER')
  add('ticket_comments', 'is_internal', 'is_internal INTEGER DEFAULT 0')

  // --- timestamps (old DBs may lack these) ---
  add('tickets', 'updated_at', 'updated_at DATETIME DEFAULT CURRENT_TIMESTAMP')
  add('users', 'updated_at', 'updated_at DATETIME DEFAULT CURRENT_TIMESTAMP')
  add('technician_schedules', 'updated_at', 'updated_at DATETIME DEFAULT CURRENT_TIMESTAMP')

  // --- notifications (old DBs may use read_at instead of is_read) ---
  add('notifications', 'is_read', 'is_read INTEGER DEFAULT 0')

  // --- contracts ---
  add('contracts', 'items', 'items TEXT')
  add('contracts', 'vat_rate', 'vat_rate REAL DEFAULT 8')
  add('contracts', 'delivery_days', 'delivery_days INTEGER DEFAULT 7')
  add('contracts', 'warranty_months', 'warranty_months INTEGER DEFAULT 12')
  add('contracts', 'paperwork', 'paperwork TEXT')

  // --- service reports ---
  add('service_reports', 'before_images', 'before_images TEXT')
  add('service_reports', 'after_images', 'after_images TEXT')
  add('service_reports', 'replacement_parts', 'replacement_parts TEXT')
  add('service_reports', 'completion_date', 'completion_date DATE')

  // --- payment_requests: add new fields, migrate to nullable contract_id ---
  if (tableExists(db, 'payment_requests') && !tableColumns(db, 'payment_requests').has('payment_date')) {
    // Migrate: recreate table with new schema (nullable contract_id + new columns)
    db.exec(`
      BEGIN;
      CREATE TABLE payment_requests_v2 (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_number TEXT NOT NULL UNIQUE,
        contract_id INTEGER,
        amount REAL NOT NULL,
        payment_date TEXT,
        payment_content TEXT NOT NULL,
        expense_category TEXT,
        payment_source TEXT DEFAULT 'bank_account',
        payer_name TEXT,
        has_vat INTEGER DEFAULT 0,
        invoice_images TEXT,
        notes TEXT,
        beneficiary_name TEXT,
        bank_account TEXT,
        bank_name TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        requested_by INTEGER NOT NULL,
        reviewed_by INTEGER,
        reviewed_at DATETIME,
        review_note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL,
        FOREIGN KEY (requested_by) REFERENCES users(id),
        FOREIGN KEY (reviewed_by) REFERENCES users(id)
      );
      INSERT INTO payment_requests_v2
        (id, request_number, contract_id, amount, payment_content, notes, beneficiary_name, bank_account, bank_name, status, requested_by, reviewed_by, reviewed_at, review_note, created_at, updated_at)
        SELECT id, request_number, contract_id, amount, payment_content, notes, beneficiary_name, bank_account, bank_name, status, requested_by, reviewed_by, reviewed_at, review_note, created_at, updated_at
        FROM payment_requests;
      DROP TABLE payment_requests;
      ALTER TABLE payment_requests_v2 RENAME TO payment_requests;
      COMMIT;
    `)
    applied.push('payment_requests: migrated to v2 (nullable contract, new fields)')
  } else {
    add('payment_requests', 'payment_date', 'payment_date TEXT')
    add('payment_requests', 'expense_category', 'expense_category TEXT')
    add('payment_requests', 'payment_source', "payment_source TEXT DEFAULT 'bank_account'")
    add('payment_requests', 'payer_name', 'payer_name TEXT')
    add('payment_requests', 'has_vat', 'has_vat INTEGER DEFAULT 0')
    add('payment_requests', 'invoice_images', 'invoice_images TEXT')
  }

  add('payment_requests', 'payment_proof_images', 'payment_proof_images TEXT')

  db.exec(`
    CREATE TABLE IF NOT EXISTS payment_request_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_request_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (payment_request_id) REFERENCES payment_requests(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_payment_request_comments_pr ON payment_request_comments(payment_request_id, created_at);
  `)

  // --- models ---
  add('models', 'capacity', 'capacity REAL')

  // --- technician schedules ---
  add('technician_schedules', 'work_requirements', 'work_requirements TEXT')
  add('technician_schedules', 'created_by', 'created_by INTEGER')

  // --- tables that may be missing on old databases ---
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

    CREATE TABLE IF NOT EXISTS models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      manufacturer TEXT,
      type TEXT,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_models_name ON models(name);
    CREATE INDEX IF NOT EXISTS idx_models_status ON models(status);

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

    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payment_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      request_number TEXT NOT NULL UNIQUE,
      contract_id INTEGER,
      amount REAL NOT NULL,
      payment_date TEXT,
      payment_content TEXT NOT NULL,
      expense_category TEXT,
      payment_source TEXT DEFAULT 'bank_account',
      payer_name TEXT,
      has_vat INTEGER DEFAULT 0,
      invoice_images TEXT,
      notes TEXT,
      beneficiary_name TEXT,
      bank_account TEXT,
      bank_name TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      requested_by INTEGER NOT NULL,
      reviewed_by INTEGER,
      reviewed_at DATETIME,
      review_note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE SET NULL,
      FOREIGN KEY (requested_by) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_payment_requests_contract ON payment_requests(contract_id);
    CREATE INDEX IF NOT EXISTS idx_payment_requests_status ON payment_requests(status);
    CREATE INDEX IF NOT EXISTS idx_payment_requests_requested_by ON payment_requests(requested_by);
  `)

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_ticket_attachments_comment_id ON ticket_attachments(comment_id);
    CREATE INDEX IF NOT EXISTS idx_ticket_comments_is_internal ON ticket_comments(is_internal);
    CREATE INDEX IF NOT EXISTS idx_users_parent_distributor ON users(parent_distributor_id);
    CREATE INDEX IF NOT EXISTS idx_users_cached_tickets ON users(cached_active_tickets);
    CREATE INDEX IF NOT EXISTS idx_users_cached_tasks ON users(cached_today_tasks);
  `)

  try {
    db.exec('DROP INDEX IF EXISTS idx_customers_user_id_unique')
  } catch {
    // ignore
  }

  // Backfill denormalized ticket snapshots — reconcileDataIntegrity() below to current workflow
  const statusMigrations: Array<{ from: string[]; to: string }> = [
    { from: ['initialized', 'pending'], to: 'new' },
    { from: ['assigned'], to: 'machine_received' },
    { from: ['waiting_parts'], to: 'waiting_delivery' },
    { from: ['completed'], to: 'closed' },
  ]
  for (const { from, to } of statusMigrations) {
    for (const legacy of from) {
      db.prepare('UPDATE tickets SET status = ? WHERE status = ?').run(to, legacy)
    }
  }

  applyPerformanceIndexes(db)
  applyViewsAndTriggers(db)
  reconcileDataIntegrity(db)

  return applied
}
