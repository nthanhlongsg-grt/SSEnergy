-- Growatt After-Sales Management System Database Schema
-- SQLite Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  code TEXT,
  role TEXT NOT NULL,
  organization TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  phone TEXT,
  address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

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
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Inverters table
CREATE TABLE IF NOT EXISTS inverters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  serial_number TEXT NOT NULL UNIQUE,
  model TEXT NOT NULL,
  power_rating TEXT,
  installation_date DATE,
  warranty_start_date DATE,
  warranty_end_date DATE,
  warranty_type TEXT,
  customer_id INTEGER,
  distributor_id INTEGER,
  installation_address TEXT,
  location_lat REAL,
  location_lng REAL,
  status TEXT NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (distributor_id) REFERENCES users(id) ON DELETE SET NULL
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
  status TEXT NOT NULL DEFAULT 'new',
  category TEXT,
  assigned_to INTEGER,
  created_by INTEGER NOT NULL,
  resolved_at DATETIME,
  closed_at DATETIME,
  sla_deadline DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (inverter_id) REFERENCES inverters(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Ticket comments
CREATE TABLE IF NOT EXISTS ticket_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  comment TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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

-- Warehouse Transactions
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

-- RMA Requests
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

-- Technician Schedules
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

-- Projects/Installations
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

-- Inverter History
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

-- System Settings
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_inverters_serial ON inverters(serial_number);
CREATE INDEX IF NOT EXISTS idx_inverters_customer ON inverters(customer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_number ON tickets(ticket_number);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_customer ON tickets(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_reports_ticket ON service_reports(ticket_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_parts_number ON warehouse_parts(part_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_technician_schedules_date ON technician_schedules(schedule_date);
