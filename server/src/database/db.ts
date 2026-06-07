import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../database/SGE.db')

// Ensure database directory exists
import fs from 'fs'
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// Initialize database with error handling
let db: Database.Database
try {
  console.log(`🔌 Attempting to connect to database at: ${dbPath}`)
  console.log(`📁 Database directory exists: ${fs.existsSync(dbDir)}`)
  console.log(`📄 Database file exists: ${fs.existsSync(dbPath)}`)
  
  db = new Database(dbPath)
  console.log(`✅ Database connected: ${dbPath}`)
  
  // Set timezone to UTC for SQLite (we'll format to Vietnam timezone in responses)
  // SQLite doesn't have native timezone support, so we handle conversion in application layer
  db.prepare('PRAGMA timezone = UTC').run()
  
  // Test connection
  const testResult = db.prepare('SELECT 1 as test').get()
  console.log('✅ Database connection test passed:', testResult)
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON')
  console.log('✅ Foreign keys enabled')
  
  // Optimize SQLite settings for better performance
  try {
    // Enable WAL mode (Write-Ahead Logging) for better concurrent performance
    db.pragma('journal_mode = WAL')
    // Increase cache size (10000 pages ~ 40MB)
    db.pragma('cache_size = -10000')
    // Set synchronous to NORMAL for better performance (still safe)
    db.pragma('synchronous = NORMAL')
    // Store temp tables in memory
    db.pragma('temp_store = MEMORY')
    console.log('✅ SQLite optimization settings applied')
  } catch (err: any) {
    console.log('⚠️  Some SQLite optimizations may not be available:', err.message)
  }
} catch (error: any) {
  console.error('❌ Database connection error:', error.message)
  console.error('📋 Error details:', error)
  console.error('💡 Make sure better-sqlite3 is properly installed:')
  console.error('   1. Run: cd server && npm install')
  console.error('   2. If on Windows, install build tools:')
  console.error('      npm install -g windows-build-tools')
  console.error('   3. Rebuild: npm rebuild better-sqlite3')
  console.error('   4. Check if database file is locked by another process')
  process.exit(1)
}

// Create tables
db.exec(`
  -- Users table
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    code TEXT,
    role TEXT NOT NULL,
    function TEXT,
    organization TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    phone TEXT,
    address TEXT,
    avatar TEXT,
    parent_distributor_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_distributor_id) REFERENCES distributors(id) ON DELETE SET NULL
  );
  
  -- Add function column if it doesn't exist (for existing databases)
  -- SQLite doesn't support ALTER TABLE ADD COLUMN IF NOT EXISTS, so we use a try-catch approach
  -- This will be handled by the application layer

  -- Customers table
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    customer_type TEXT NOT NULL,
    organization TEXT,
    tax_code TEXT,
    contact_person TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    contact_address TEXT,
    representative_name TEXT,
    representative_position TEXT,
    authorization_doc TEXT,
    recipient_name TEXT,
    recipient_address TEXT,
    recipient_phone TEXT,
    notes TEXT,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  -- Inverters table
  CREATE TABLE IF NOT EXISTS inverters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    serial_number TEXT NOT NULL UNIQUE,
    model TEXT NOT NULL,
    manufacturer TEXT,
    type TEXT,
    power_rating TEXT,
    installation_date DATE,
    warranty_start_date DATE,
    warranty_end_date DATE,
    warranty_months INTEGER,
    warranty_type TEXT,
    customer_id INTEGER,
    distributor_id INTEGER,
    user_id INTEGER,
    installation_address TEXT,
    location_lat REAL,
    location_lng REAL,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (distributor_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  -- Tickets table
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_number TEXT NOT NULL UNIQUE,
    inverter_id INTEGER,
    customer_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'initialized',
    category TEXT,
    assigned_to INTEGER,
    created_by INTEGER NOT NULL,
    resolved_at DATETIME,
    closed_at DATETIME,
    sla_deadline DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inverter_id) REFERENCES inverters(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Ticket comments/updates
  CREATE TABLE IF NOT EXISTS ticket_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    comment TEXT NOT NULL,
    is_internal INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Ticket attachments
  CREATE TABLE IF NOT EXISTS ticket_attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    comment_id INTEGER,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Ticket watchers (users following ticket updates)
  CREATE TABLE IF NOT EXISTS ticket_watchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(ticket_id, user_id)
  );

  -- Service Reports table
  CREATE TABLE IF NOT EXISTS service_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_number TEXT NOT NULL UNIQUE,
    ticket_id INTEGER NOT NULL,
    technician_id INTEGER NOT NULL,
    service_date DATE NOT NULL,
    service_start_time TIME,
    service_end_time TIME,
    service_type TEXT NOT NULL,
    description TEXT,
    diagnosis TEXT,
    actions_taken TEXT,
    parts_used TEXT,
    labor_cost REAL DEFAULT 0,
    parts_cost REAL DEFAULT 0,
    total_cost REAL DEFAULT 0,
    customer_signature TEXT,
    technician_signature TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Service Report Parts (many-to-many relationship)
  CREATE TABLE IF NOT EXISTS service_report_parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_report_id INTEGER NOT NULL,
    part_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    FOREIGN KEY (service_report_id) REFERENCES service_reports(id) ON DELETE CASCADE,
    FOREIGN KEY (part_id) REFERENCES warehouse_parts(id) ON DELETE CASCADE
  );

  -- Warehouse Parts table
  CREATE TABLE IF NOT EXISTS warehouse_parts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part_number TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    manufacturer TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER DEFAULT 0,
    max_quantity INTEGER,
    unit_price REAL DEFAULT 0,
    unit TEXT DEFAULT 'pcs',
    supplier TEXT,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Warehouse Transactions (inventory movements)
  CREATE TABLE IF NOT EXISTS warehouse_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    part_id INTEGER NOT NULL,
    transaction_type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL,
    reference_type TEXT,
    reference_id INTEGER,
    notes TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (part_id) REFERENCES warehouse_parts(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  );

  -- RMA (Return Merchandise Authorization) table
  CREATE TABLE IF NOT EXISTS rma_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rma_number TEXT NOT NULL UNIQUE,
    part_id INTEGER,
    ticket_id INTEGER,
    customer_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    received_date DATE,
    processed_date DATE,
    replacement_part_id INTEGER,
    return_tracking_number TEXT,
    replacement_tracking_number TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (part_id) REFERENCES warehouse_parts(id) ON DELETE SET NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (replacement_part_id) REFERENCES warehouse_parts(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Technician Schedule table
  CREATE TABLE IF NOT EXISTS technician_schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    technician_id INTEGER NOT NULL,
    ticket_id INTEGER,
    title TEXT NOT NULL,
    description TEXT,
    schedule_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME,
    location TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    completed_at DATETIME,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL
  );

  -- Task Related Users (many-to-many relationship)
  CREATE TABLE IF NOT EXISTS task_related_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES technician_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(task_id, user_id)
  );

  -- Task comments/activity log
  CREATE TABLE IF NOT EXISTS task_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    comment TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES technician_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Projects/Installations table
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT NOT NULL,
    customer_id INTEGER NOT NULL,
    project_type TEXT NOT NULL,
    address TEXT,
    start_date DATE,
    completion_date DATE,
    status TEXT NOT NULL DEFAULT 'planning',
    total_capacity REAL,
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  );

  -- Project Inverters (many-to-many)
  CREATE TABLE IF NOT EXISTS project_inverters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    inverter_id INTEGER NOT NULL,
    installation_date DATE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (inverter_id) REFERENCES inverters(id) ON DELETE CASCADE
  );

  -- Distributors/Dealers table
  CREATE TABLE IF NOT EXISTS distributors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    tax_code TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    user_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  -- Inverter History (maintenance/service history)
  CREATE TABLE IF NOT EXISTS inverter_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inverter_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    service_report_id INTEGER,
    ticket_id INTEGER,
    event_date DATE NOT NULL,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inverter_id) REFERENCES inverters(id) ON DELETE CASCADE,
    FOREIGN KEY (service_report_id) REFERENCES service_reports(id) ON DELETE SET NULL,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
  );

  -- Inverter Errors (error history)
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

  -- Models table
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

  -- Contracts table
  CREATE TABLE IF NOT EXISTS contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_number TEXT NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    contract_type TEXT NOT NULL DEFAULT 'maintenance',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    value REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft',
    description TEXT,
    notes TEXT,
    signed_date DATE,
    delivery_days INTEGER DEFAULT 7,
    warranty_months INTEGER DEFAULT 12,
    items TEXT,
    vat_rate REAL DEFAULT 8,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_contracts_customer ON contracts(customer_id);
  CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
  CREATE INDEX IF NOT EXISTS idx_contracts_end_date ON contracts(end_date);
  CREATE INDEX IF NOT EXISTS idx_contracts_created_at ON contracts(created_at);

  -- Contract Inverters (many-to-many)
  CREATE TABLE IF NOT EXISTS contract_inverters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    contract_id INTEGER NOT NULL,
    inverter_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
    FOREIGN KEY (inverter_id) REFERENCES inverters(id) ON DELETE CASCADE,
    UNIQUE(contract_id, inverter_id)
  );
  CREATE INDEX IF NOT EXISTS idx_contract_inverters_contract ON contract_inverters(contract_id);
  CREATE INDEX IF NOT EXISTS idx_contract_inverters_inverter ON contract_inverters(inverter_id);

  -- System Settings table
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes for better performance
  
  -- Users indexes
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
  CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status);
  CREATE INDEX IF NOT EXISTS idx_users_parent_distributor ON users(parent_distributor_id);
  CREATE INDEX IF NOT EXISTS idx_users_parent_role ON users(parent_distributor_id, role);
  
  -- Customers indexes
  CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
  CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
  CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);
  CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_user_id_unique ON customers(user_id) WHERE user_id IS NOT NULL;
  
  -- Distributors indexes
  CREATE INDEX IF NOT EXISTS idx_distributors_user_id ON distributors(user_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_distributors_user_id_unique ON distributors(user_id) WHERE user_id IS NOT NULL;
  
  -- Inverters indexes
  CREATE INDEX IF NOT EXISTS idx_inverters_serial ON inverters(serial_number);
  CREATE INDEX IF NOT EXISTS idx_inverters_customer ON inverters(customer_id);
  CREATE INDEX IF NOT EXISTS idx_inverters_distributor_id ON inverters(distributor_id);
  CREATE INDEX IF NOT EXISTS idx_inverters_user_id ON inverters(user_id);
  CREATE INDEX IF NOT EXISTS idx_inverters_model ON inverters(model);
  CREATE INDEX IF NOT EXISTS idx_inverters_status ON inverters(status);
  CREATE INDEX IF NOT EXISTS idx_inverters_created_at ON inverters(created_at);
  CREATE INDEX IF NOT EXISTS idx_inverters_distributor_status ON inverters(distributor_id, status);
  CREATE INDEX IF NOT EXISTS idx_inverters_customer_status ON inverters(customer_id, status);
  CREATE INDEX IF NOT EXISTS idx_inverters_user_status ON inverters(user_id, status);
  
  -- Tickets indexes (most critical for performance)
  CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);
  CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
  CREATE INDEX IF NOT EXISTS idx_tickets_customer ON tickets(customer_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by);
  CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to);
  CREATE INDEX IF NOT EXISTS idx_tickets_inverter_id ON tickets(inverter_id);
  CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at);
  CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
  -- Composite indexes for common query patterns
  CREATE INDEX IF NOT EXISTS idx_tickets_status_created_at ON tickets(status, created_at);
  CREATE INDEX IF NOT EXISTS idx_tickets_assigned_status ON tickets(assigned_to, status);
  CREATE INDEX IF NOT EXISTS idx_tickets_created_status ON tickets(created_by, status);
  CREATE INDEX IF NOT EXISTS idx_tickets_status_priority ON tickets(status, priority);
  
  -- Ticket comments indexes
  CREATE INDEX IF NOT EXISTS idx_ticket_comments_user_id ON ticket_comments(user_id);
  CREATE INDEX IF NOT EXISTS idx_ticket_comments_created_at ON ticket_comments(created_at);
  
  -- Service Reports indexes
  CREATE INDEX IF NOT EXISTS idx_service_reports_ticket ON service_reports(ticket_id);
  CREATE INDEX IF NOT EXISTS idx_service_reports_technician_id ON service_reports(technician_id);
  CREATE INDEX IF NOT EXISTS idx_service_reports_created_at ON service_reports(created_at);
  CREATE INDEX IF NOT EXISTS idx_service_reports_service_date ON service_reports(service_date);
  CREATE INDEX IF NOT EXISTS idx_service_reports_status ON service_reports(status);
  CREATE INDEX IF NOT EXISTS idx_service_reports_tech_date ON service_reports(technician_id, service_date);
  
  -- Warehouse indexes
  CREATE INDEX IF NOT EXISTS idx_warehouse_parts_number ON warehouse_parts(part_number);
  CREATE INDEX IF NOT EXISTS idx_warehouse_parts_status ON warehouse_parts(status);
  CREATE INDEX IF NOT EXISTS idx_warehouse_parts_category ON warehouse_parts(category);
  CREATE INDEX IF NOT EXISTS idx_warehouse_trans_part_id ON warehouse_transactions(part_id);
  CREATE INDEX IF NOT EXISTS idx_warehouse_trans_created_at ON warehouse_transactions(created_at);
  CREATE INDEX IF NOT EXISTS idx_warehouse_trans_type ON warehouse_transactions(transaction_type);
  
  -- RMA indexes
  CREATE INDEX IF NOT EXISTS idx_rma_status ON rma_requests(status);
  CREATE INDEX IF NOT EXISTS idx_rma_customer_id ON rma_requests(customer_id);
  CREATE INDEX IF NOT EXISTS idx_rma_created_at ON rma_requests(created_at);
  
  -- Technician Schedules indexes
  CREATE INDEX IF NOT EXISTS idx_technician_schedules_date ON technician_schedules(schedule_date);
  CREATE INDEX IF NOT EXISTS idx_schedules_technician_id ON technician_schedules(technician_id);
  CREATE INDEX IF NOT EXISTS idx_schedules_status ON technician_schedules(status);
  CREATE INDEX IF NOT EXISTS idx_schedules_created_at ON technician_schedules(created_at);
  CREATE INDEX IF NOT EXISTS idx_schedules_tech_date ON technician_schedules(technician_id, schedule_date);
  CREATE INDEX IF NOT EXISTS idx_schedules_date_status ON technician_schedules(schedule_date, status);
  
  -- Task indexes
  CREATE INDEX IF NOT EXISTS idx_task_related_users_task ON task_related_users(task_id);
  CREATE INDEX IF NOT EXISTS idx_task_related_users_user ON task_related_users(user_id);
  CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
  
  -- Projects indexes
  CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON projects(customer_id);
  CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
  
  -- Inverter History & Errors indexes
  CREATE INDEX IF NOT EXISTS idx_inverter_errors_inverter ON inverter_errors(inverter_id);
  CREATE INDEX IF NOT EXISTS idx_inverter_errors_occurred ON inverter_errors(occurred_at);
  CREATE INDEX IF NOT EXISTS idx_inverter_history_inverter ON inverter_history(inverter_id);
  
  -- Models indexes
  CREATE INDEX IF NOT EXISTS idx_models_name ON models(name);
  CREATE INDEX IF NOT EXISTS idx_models_status ON models(status);
  
  -- Notifications indexes
  -- CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
  -- CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
`)

// Note: initCountColumns() is called from index.ts after db initialization
// to avoid circular dependency

// Migration: Drop unique index on customers.user_id (allow one user to be contact for multiple companies)
try {
  db.exec('DROP INDEX IF EXISTS idx_customers_user_id_unique')
  console.log('✅ Dropped unique index on customers.user_id')
} catch (err: any) {
  console.log('ℹ️  idx_customers_user_id_unique:', err.message)
}

// Migration: Add contact_user_id column to customers if missing
try {
  const custCols = db.prepare("PRAGMA table_info(customers)").all() as Array<{ name: string }>
  if (!custCols.some(c => c.name === 'contact_user_id')) {
    db.prepare('ALTER TABLE customers ADD COLUMN contact_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL').run()
    // Copy existing user_id -> contact_user_id
    db.prepare('UPDATE customers SET contact_user_id = user_id WHERE user_id IS NOT NULL').run()
    console.log('✅ Added contact_user_id to customers')
  }
} catch (err: any) {
  console.log('ℹ️  contact_user_id migration:', err.message)
}

// Migration: Add contact detail columns (phone/email/address) to customers if missing
try {
  const custCols = db.prepare("PRAGMA table_info(customers)").all() as Array<{ name: string }>
  if (!custCols.some(c => c.name === 'contact_phone')) {
    db.prepare('ALTER TABLE customers ADD COLUMN contact_phone TEXT').run()
    console.log('✅ Added contact_phone to customers')
  }
  if (!custCols.some(c => c.name === 'contact_email')) {
    db.prepare('ALTER TABLE customers ADD COLUMN contact_email TEXT').run()
    console.log('✅ Added contact_email to customers')
  }
  if (!custCols.some(c => c.name === 'contact_address')) {
    db.prepare('ALTER TABLE customers ADD COLUMN contact_address TEXT').run()
    console.log('✅ Added contact_address to customers')
  }
} catch (err: any) {
  console.log('ℹ️  customer contact detail columns migration:', err.message)
}

// Migration: Add legal representative columns to customers if missing
try {
  const custCols = db.prepare("PRAGMA table_info(customers)").all() as Array<{ name: string }>
  if (!custCols.some(c => c.name === 'representative_name')) {
    db.prepare('ALTER TABLE customers ADD COLUMN representative_name TEXT').run()
    console.log('✅ Added representative_name to customers')
  }
  if (!custCols.some(c => c.name === 'representative_position')) {
    db.prepare('ALTER TABLE customers ADD COLUMN representative_position TEXT').run()
    console.log('✅ Added representative_position to customers')
  }
  if (!custCols.some(c => c.name === 'authorization_doc')) {
    db.prepare('ALTER TABLE customers ADD COLUMN authorization_doc TEXT').run()
    console.log('✅ Added authorization_doc to customers')
  }
} catch (err: any) {
  console.log('ℹ️  customer representative columns migration:', err.message)
}

// Migration: Add contract recipient columns to customers if missing
try {
  const custCols = db.prepare("PRAGMA table_info(customers)").all() as Array<{ name: string }>
  if (!custCols.some(c => c.name === 'recipient_name')) {
    db.prepare('ALTER TABLE customers ADD COLUMN recipient_name TEXT').run()
    console.log('✅ Added recipient_name to customers')
  }
  if (!custCols.some(c => c.name === 'recipient_address')) {
    db.prepare('ALTER TABLE customers ADD COLUMN recipient_address TEXT').run()
    console.log('✅ Added recipient_address to customers')
  }
  if (!custCols.some(c => c.name === 'recipient_phone')) {
    db.prepare('ALTER TABLE customers ADD COLUMN recipient_phone TEXT').run()
    console.log('✅ Added recipient_phone to customers')
  }
} catch (err: any) {
  console.log('ℹ️  customer recipient columns migration:', err.message)
}

// Migration: Add manufacturer / warranty_months columns to inverters if missing
try {
  const invCols = db.prepare("PRAGMA table_info(inverters)").all() as Array<{ name: string }>
  if (!invCols.some(c => c.name === 'manufacturer')) {
    db.prepare('ALTER TABLE inverters ADD COLUMN manufacturer TEXT').run()
    console.log('✅ Added manufacturer to inverters')
  }
  if (!invCols.some(c => c.name === 'warranty_months')) {
    db.prepare('ALTER TABLE inverters ADD COLUMN warranty_months INTEGER').run()
    console.log('✅ Added warranty_months to inverters')
  }
} catch (err: any) {
  console.log('ℹ️  inverter columns migration:', err.message)
}

// Migration: Add line-item columns to contracts if missing
try {
  const contractCols = db.prepare("PRAGMA table_info(contracts)").all() as Array<{ name: string }>
  if (!contractCols.some(c => c.name === 'items')) {
    db.prepare('ALTER TABLE contracts ADD COLUMN items TEXT').run()
    console.log('✅ Added items to contracts')
  }
  if (!contractCols.some(c => c.name === 'vat_rate')) {
    db.prepare('ALTER TABLE contracts ADD COLUMN vat_rate REAL DEFAULT 8').run()
    console.log('✅ Added vat_rate to contracts')
  }
  if (!contractCols.some(c => c.name === 'delivery_days')) {
    db.prepare('ALTER TABLE contracts ADD COLUMN delivery_days INTEGER DEFAULT 7').run()
    console.log('✅ Added delivery_days to contracts')
  }
  if (!contractCols.some(c => c.name === 'warranty_months')) {
    db.prepare('ALTER TABLE contracts ADD COLUMN warranty_months INTEGER DEFAULT 12').run()
    console.log('✅ Added warranty_months to contracts')
  }
  if (!contractCols.some(c => c.name === 'paperwork')) {
    db.prepare('ALTER TABLE contracts ADD COLUMN paperwork TEXT').run()
    console.log('✅ Added paperwork to contracts')
  }
} catch (err: any) {
  console.log('ℹ️  contract items columns migration:', err.message)
}

// Migration: denormalized ticket fields (customer/inverter snapshot)
try {
  const ticketCols = db.prepare('PRAGMA table_info(tickets)').all() as Array<{ name: string }>
  const addTicketCol = (name: string, ddl: string) => {
    if (!ticketCols.some(c => c.name === name)) {
      db.prepare(`ALTER TABLE tickets ADD COLUMN ${ddl}`).run()
      console.log(`✅ Added ${name} to tickets`)
    }
  }
  addTicketCol('customer_name', 'customer_name TEXT')
  addTicketCol('customer_email', 'customer_email TEXT')
  addTicketCol('customer_phone', 'customer_phone TEXT')
  addTicketCol('customer_address', 'customer_address TEXT')
  addTicketCol('inverter_serial', 'inverter_serial TEXT')
  addTicketCol('inverter_model', 'inverter_model TEXT')
} catch (err: any) {
  console.log('ℹ️  tickets denormalized columns migration:', err.message)
}

// Migration: Add function column to users table if it doesn't exist
try {
  const tableInfo = db.prepare("PRAGMA table_info(users)").all() as Array<{ name: string }>
  const hasFunctionColumn = tableInfo.some(col => col.name === 'function')
  
  if (!hasFunctionColumn) {
    db.prepare('ALTER TABLE users ADD COLUMN function TEXT').run()
    console.log('✅ Added function column to users table')
  }
} catch (err: any) {
  if (err.message && err.message.includes('duplicate column')) {
    console.log('ℹ️  Column function already exists in users table')
  } else {
    console.error('⚠️  Error checking/adding function column:', err.message)
  }
}

// Migration: ticket_watchers table (required by GET /api/tickets/:id)
try {
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
} catch (err: any) {
  console.log('ℹ️  ticket_watchers migration:', err.message)
}

// Migration: comment_id on ticket_attachments (comment-linked images)
try {
  const attCols = db.prepare('PRAGMA table_info(ticket_attachments)').all() as Array<{ name: string }>
  if (!attCols.some(c => c.name === 'comment_id')) {
    db.prepare('ALTER TABLE ticket_attachments ADD COLUMN comment_id INTEGER').run()
    db.prepare('CREATE INDEX IF NOT EXISTS idx_ticket_attachments_comment_id ON ticket_attachments(comment_id)').run()
    console.log('✅ Added comment_id to ticket_attachments')
  }
} catch (err: any) {
  console.log('ℹ️  ticket_attachments comment_id migration:', err.message)
}

// Migration: is_internal on ticket_comments
try {
  const commentCols = db.prepare('PRAGMA table_info(ticket_comments)').all() as Array<{ name: string }>
  if (!commentCols.some(c => c.name === 'is_internal')) {
    db.prepare('ALTER TABLE ticket_comments ADD COLUMN is_internal INTEGER DEFAULT 0').run()
    console.log('✅ Added is_internal to ticket_comments')
  }
} catch (err: any) {
  console.log('ℹ️  ticket_comments is_internal migration:', err.message)
}

export default db
