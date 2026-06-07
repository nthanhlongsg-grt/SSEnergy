const Database = require('better-sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, '../database/SGE.db')
const db = new Database(dbPath, { readonly: true })

const tables = db
  .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`)
  .all()

console.log('=== TABLES ===')
console.log(tables.map((t) => t.name).join('\n'))

const summary = []

for (const { name } of tables) {
  const cols = db.prepare(`PRAGMA table_info(${name})`).all()
  const cnt = db.prepare(`SELECT COUNT(*) as n FROM ${name}`).get().n
  summary.push({ name, cols: cols.map((c) => c.name), rows: cnt })
}

console.log('\n=== TABLE SUMMARY ===')
for (const t of summary) {
  console.log(`${t.name}: ${t.rows} rows, ${t.cols.length} cols`)
}

// Orphan / dangling checks
const checks = []

function runCheck(label, sql) {
  try {
    const rows = db.prepare(sql).all()
    checks.push({ label, count: rows.length, sample: rows.slice(0, 5) })
  } catch (e) {
    checks.push({ label, error: e.message })
  }
}

runCheck('tickets.customer_id -> missing customer', `
  SELECT t.id, t.ticket_number, t.customer_id FROM tickets t
  LEFT JOIN customers c ON c.id = t.customer_id
  WHERE t.customer_id IS NOT NULL AND c.id IS NULL
`)

runCheck('tickets.inverter_id -> missing inverter', `
  SELECT t.id, t.ticket_number, t.inverter_id FROM tickets t
  LEFT JOIN inverters i ON i.id = t.inverter_id
  WHERE t.inverter_id IS NOT NULL AND i.id IS NULL
`)

runCheck('tickets.assigned_to -> missing user', `
  SELECT t.id, t.ticket_number, t.assigned_to FROM tickets t
  LEFT JOIN users u ON u.id = t.assigned_to
  WHERE t.assigned_to IS NOT NULL AND u.id IS NULL
`)

runCheck('contracts.customer_id -> missing customer', `
  SELECT c.id, c.contract_number, c.customer_id FROM contracts c
  LEFT JOIN customers cu ON cu.id = c.customer_id
  WHERE c.customer_id IS NOT NULL AND cu.id IS NULL
`)

runCheck('contract_inverters -> missing contract', `
  SELECT ci.contract_id, ci.inverter_id FROM contract_inverters ci
  LEFT JOIN contracts c ON c.id = ci.contract_id
  WHERE c.id IS NULL
`)

runCheck('contract_inverters -> missing inverter', `
  SELECT ci.contract_id, ci.inverter_id FROM contract_inverters ci
  LEFT JOIN inverters i ON i.id = ci.inverter_id
  WHERE i.id IS NULL
`)

runCheck('inverters.customer_id -> missing customer', `
  SELECT i.id, i.serial_number, i.customer_id FROM inverters i
  LEFT JOIN customers c ON c.id = i.customer_id
  WHERE i.customer_id IS NOT NULL AND c.id IS NULL
`)

runCheck('notifications.user_id -> missing user', `
  SELECT n.id, n.user_id FROM notifications n
  LEFT JOIN users u ON u.id = n.user_id
  WHERE u.id IS NULL
`)

runCheck('ticket_comments.ticket_id -> missing ticket', `
  SELECT tc.id, tc.ticket_id FROM ticket_comments tc
  LEFT JOIN tickets t ON t.id = tc.ticket_id
  WHERE t.id IS NULL
`)

runCheck('ticket_watchers -> missing ticket/user', `
  SELECT tw.ticket_id, tw.user_id FROM ticket_watchers tw
  LEFT JOIN tickets t ON t.id = tw.ticket_id
  LEFT JOIN users u ON u.id = tw.user_id
  WHERE t.id IS NULL OR u.id IS NULL
`)

runCheck('schedules -> missing ticket or technician', `
  SELECT s.id, s.ticket_id, s.technician_id FROM schedules s
  LEFT JOIN tickets t ON t.id = s.ticket_id
  LEFT JOIN users u ON u.id = s.technician_id
  WHERE (s.ticket_id IS NOT NULL AND t.id IS NULL) OR (s.technician_id IS NOT NULL AND u.id IS NULL)
`)

runCheck('service_reports -> missing ticket', `
  SELECT sr.id, sr.ticket_id FROM service_reports sr
  LEFT JOIN tickets t ON t.id = sr.ticket_id
  WHERE sr.ticket_id IS NOT NULL AND t.id IS NULL
`)

runCheck('customers.user_id -> missing user', `
  SELECT c.id, c.name, c.user_id FROM customers c
  LEFT JOIN users u ON u.id = c.user_id
  WHERE c.user_id IS NOT NULL AND u.id IS NULL
`)

runCheck('customers.contact_user_id -> missing user', `
  SELECT c.id, c.name, c.contact_user_id FROM customers c
  LEFT JOIN users u ON u.id = c.contact_user_id
  WHERE c.contact_user_id IS NOT NULL AND u.id IS NULL
`)

runCheck('duplicate customer emails', `
  SELECT email, COUNT(*) as cnt FROM customers
  WHERE email IS NOT NULL AND TRIM(email) != ''
  GROUP BY LOWER(email) HAVING cnt > 1
`)

runCheck('duplicate inverter serial_number', `
  SELECT serial_number, COUNT(*) as cnt FROM inverters
  GROUP BY serial_number HAVING cnt > 1
`)

runCheck('duplicate contract_number', `
  SELECT contract_number, COUNT(*) as cnt FROM contracts
  GROUP BY contract_number HAVING cnt > 1
`)

runCheck('duplicate ticket_number', `
  SELECT ticket_number, COUNT(*) as cnt FROM tickets
  GROUP BY ticket_number HAVING cnt > 1
`)

runCheck('duplicate user emails', `
  SELECT email, COUNT(*) as cnt FROM users
  GROUP BY LOWER(email) HAVING cnt > 1
`)

// Empty / unused tables
console.log('\n=== ORPHAN / DUPLICATE CHECKS ===')
for (const c of checks) {
  if (c.error) {
    console.log(`[SKIP] ${c.label}: ${c.error}`)
  } else if (c.count > 0) {
    console.log(`[ISSUE] ${c.label}: ${c.count}`)
    if (c.sample?.length) console.log(JSON.stringify(c.sample, null, 2))
  } else {
    console.log(`[OK] ${c.label}`)
  }
}

// Columns that might be legacy - list all columns per table for manual review
console.log('\n=== ALL COLUMNS ===')
for (const t of summary) {
  console.log(`${t.name}: ${t.cols.join(', ')}`)
}

// Tables with 0 rows
const empty = summary.filter((t) => t.rows === 0)
console.log('\n=== EMPTY TABLES ===')
console.log(empty.length ? empty.map((t) => t.name).join(', ') : '(none)')

console.log('\n=== DATA CONSISTENCY ===')
const dataChecks = [
  ['users', `SELECT id,name,email,role,function FROM users`],
  ['customers', `SELECT id,name,email,user_id,contact_user_id FROM customers`],
  ['contracts delivery cols', `SELECT id,contract_number,delivery_time,delivery_days FROM contracts`],
  ['inverters links', `SELECT id,serial_number,customer_id,user_id,distributor_id FROM inverters`],
  ['inverter/contract customer mismatch', `SELECT i.id,i.serial_number,i.customer_id inv_customer,c.customer_id contract_customer,ci.contract_id FROM contract_inverters ci JOIN inverters i ON i.id=ci.inverter_id JOIN contracts c ON c.id=ci.contract_id WHERE i.customer_id IS NOT NULL AND c.customer_id IS NOT NULL AND i.customer_id!=c.customer_id`],
  ['inverters both customer_id and user_id', `SELECT id,serial_number,customer_id,user_id FROM inverters WHERE customer_id IS NOT NULL AND user_id IS NOT NULL`],
  ['inverter_history orphan inverter', `SELECT ih.id,ih.inverter_id FROM inverter_history ih LEFT JOIN inverters i ON i.id=ih.inverter_id WHERE i.id IS NULL`],
  ['inverter_history orphan ticket', `SELECT ih.id,ih.ticket_id FROM inverter_history ih LEFT JOIN tickets t ON t.id=ih.ticket_id WHERE ih.ticket_id IS NOT NULL AND t.id IS NULL`],
  ['contracts.created_by missing user', `SELECT c.id,c.contract_number,c.created_by FROM contracts c LEFT JOIN users u ON u.id=c.created_by WHERE c.created_by IS NOT NULL AND u.id IS NULL`],
  ['duplicate customers.user_id', `SELECT user_id,COUNT(*) cnt FROM customers WHERE user_id IS NOT NULL GROUP BY user_id HAVING cnt>1`],
  ['delivery_time populated', `SELECT id,contract_number,delivery_time,delivery_days FROM contracts WHERE delivery_time IS NOT NULL AND TRIM(delivery_time)!=''`],
  ['END_USER without customer', `SELECT u.id,u.name,u.email FROM users u LEFT JOIN customers c ON c.user_id=u.id OR c.contact_user_id=u.id WHERE u.role IN ('end_user','distributor','dealer') AND c.id IS NULL`],
]
for (const [label, sql] of dataChecks) {
  try {
    const rows = db.prepare(sql).all()
    if (rows.length === 0) console.log(`[OK] ${label}`)
    else {
      console.log(`[INFO] ${label}: ${rows.length}`)
      console.log(JSON.stringify(rows, null, 2))
    }
  } catch (e) {
    console.log(`[SKIP] ${label}: ${e.message}`)
  }
}

console.log('\n=== LEGACY / UNUSED IN CODE ===')
;['projects','project_inverters','distributors','delivery_time column'].forEach((x) => console.log('-', x))

db.close()
