import bcrypt from 'bcryptjs'
import db from './db.js'
import { requireSeedPassword } from '../utils/seedPassword.js'

const DEV_EMAIL = process.env.DEV_SEED_EMAIL || 'system@sgesolartech.vn'

const seedUsers = async () => {
  const plainPassword = requireSeedPassword()
  console.log('🌱 Seeding system user...')

  const MOCK_USERS = [
    {
      name: 'System',
      email: DEV_EMAIL,
      password: await bcrypt.hash(plainPassword, 10),
      code: 'SYS001',
      role: 'dev',
      organization: 'SS ENERGY',
      phone: '0900000000',
    },
  ]

  const insertStmt = db.prepare(`
    INSERT INTO users (name, email, password, code, role, organization, status, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const updateStmt = db.prepare(`
    UPDATE users 
    SET name = ?, password = ?, code = ?, role = ?, organization = ?, status = ?, phone = ?
    WHERE email = ?
  `)

  const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?')

  let insertedCount = 0
  let updatedCount = 0

  for (const user of MOCK_USERS) {
    const existing = checkStmt.get(user.email) as { id: number } | undefined

    if (existing) {
      // Update existing user
      updateStmt.run(
        user.name,
        user.password,
        user.code,
        user.role,
        user.organization,
        'active',
        user.phone,
        user.email
      )
      updatedCount++
      console.log(`  ↻ Updated user: ${user.email}`)
    } else {
      // Insert new user
      insertStmt.run(
        user.name,
        user.email,
        user.password,
        user.code,
        user.role,
        user.organization,
        'active',
        user.phone
      )
      insertedCount++
      console.log(`  ✓ Inserted user: ${user.email}`)
    }
  }

  console.log(`✅ Seeded users successfully! (Inserted: ${insertedCount}, Updated: ${updatedCount})`)
}

const seedCustomers = () => {
  const existingCustomers = db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number }
  
  if (existingCustomers.count === 0) {
    const stmt = db.prepare(`
      INSERT INTO customers (name, email, phone, address, customer_type, organization, tax_code)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run('Công ty ABC Solar', 'contact@abcsolar.vn', '0281234567', '123 Nguyễn Huệ, Q1, HCM', 'enterprise', 'ABC Solar Co.', '1234567890')
    stmt.run('Hộ gia đình Nguyễn Văn A', 'nguyenvana@gmail.com', '0912345678', '456 Lê Lợi, Q3, HCM', 'residential', null, null)
    stmt.run('Trường THPT ABC', 'admin@thptabc.edu.vn', '0287654321', '789 Trần Hưng Đạo, Q5, HCM', 'enterprise', 'THPT ABC', '9876543210')
    stmt.run('Chung cư XYZ', 'management@xyz.com', '0288888888', '321 Võ Văn Tần, Q3, HCM', 'residential', 'XYZ Building Management', '1122334455')

    console.log('✅ Seeded customers successfully!')
  } else {
    console.log('ℹ️  Customers already exist, skipping seed.')
  }
}

const seedDistributors = () => {
  const existingDistributors = db.prepare('SELECT COUNT(*) as count FROM distributors').get() as { count: number }
  
  if (existingDistributors.count === 0) {
    const stmt = db.prepare(`
      INSERT INTO distributors (name, code, contact_person, email, phone, address, tax_code)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run('Đại lý Solar Miền Nam', 'DL-SMN-001', 'Nguyễn Văn B', 'contact@solarsouth.vn', '0281111111', '100 Pasteur, Q3, HCM', '1112223334')
    stmt.run('Nhà phân phối Năng lượng Xanh', 'NPP-NLX-001', 'Trần Thị C', 'info@nangluongxanh.vn', '0282222222', '200 Nam Kỳ Khởi Nghĩa, Q3, HCM', '2223334445')

    console.log('✅ Seeded distributors successfully!')
  } else {
    console.log('ℹ️  Distributors already exist, skipping seed.')
  }
}

const seedInverters = () => {
  const existingInverters = db.prepare('SELECT COUNT(*) as count FROM inverters').get() as { count: number }
  
  if (existingInverters.count === 0) {
    // Get customer and distributor IDs
    const customer1 = db.prepare('SELECT id FROM customers WHERE email = ?').get('contact@abcsolar.vn') as { id: number }
    const customer2 = db.prepare('SELECT id FROM customers WHERE email = ?').get('nguyenvana@gmail.com') as { id: number }
    const distributor1 = db.prepare('SELECT id FROM distributors WHERE code = ?').get('DL-SMN-001') as { id: number }

    const stmt = db.prepare(`
      INSERT INTO inverters (serial_number, model, type, power_rating, installation_date, warranty_start_date, warranty_end_date, customer_id, distributor_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const today = new Date()
    const warrantyStart = new Date(today)
    warrantyStart.setMonth(warrantyStart.getMonth() - 6)
    const warrantyEnd = new Date(warrantyStart)
    warrantyEnd.setFullYear(warrantyEnd.getFullYear() + 10)

    stmt.run('GW1234567890', 'MAX 10KTL3-X', 'grid-tie', '10kW', today.toISOString().split('T')[0], warrantyStart.toISOString().split('T')[0], warrantyEnd.toISOString().split('T')[0], customer1.id, distributor1.id, 'active')
    stmt.run('GW0987654321', 'MID 15KTL3-X', 'grid-tie', '15kW', today.toISOString().split('T')[0], warrantyStart.toISOString().split('T')[0], warrantyEnd.toISOString().split('T')[0], customer2.id, distributor1.id, 'active')
    stmt.run('GW1122334455', 'SPH 6000', 'hybrid', '6kW', today.toISOString().split('T')[0], warrantyStart.toISOString().split('T')[0], warrantyEnd.toISOString().split('T')[0], customer1.id, distributor1.id, 'active')

    console.log('✅ Seeded inverters successfully!')
  } else {
    console.log(`ℹ️  Đã có ${existingInverters.count} thiết bị trong database, bỏ qua seed.`)
    console.log('💡 Nếu muốn seed lại, hãy xóa dữ liệu hiện tại trước.')
  }
}

const seedWarehouseParts = () => {
  const existingParts = db.prepare('SELECT COUNT(*) as count FROM warehouse_parts').get() as { count: number }
  
  if (existingParts.count === 0) {
    const stmt = db.prepare(`
      INSERT INTO warehouse_parts (part_number, name, category, description, manufacturer, quantity, min_quantity, unit_price, supplier)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    stmt.run('PN-MPPT-001', 'MPPT Controller', 'Electronics', 'MPPT Charge Controller 60A', 'SSE', 25, 10, 2500000, 'SS ENERGY')
    stmt.run('PN-FAN-001', 'Cooling Fan', 'Mechanical', 'DC Cooling Fan 12V', 'SSE', 50, 20, 350000, 'SS ENERGY')
    stmt.run('PN-LCD-001', 'LCD Display Module', 'Display', 'LCD Display Screen for Inverter', 'SSE', 15, 5, 1200000, 'SS ENERGY')
    stmt.run('PN-PCB-001', 'Main PCB Board', 'Electronics', 'Main Printed Circuit Board', 'SSE', 10, 5, 5000000, 'SS ENERGY')
    stmt.run('PN-CABLE-001', 'DC Cable Set', 'Cables', 'DC Cable Set 4mm²', 'SSE', 100, 30, 450000, 'SS ENERGY')

    console.log('✅ Seeded warehouse parts successfully!')
  } else {
    console.log('ℹ️  Warehouse parts already exist, skipping seed.')
  }
}

const seedTickets = () => {
  const existingTickets = db.prepare('SELECT COUNT(*) as count FROM tickets').get() as { count: number }
  
  if (existingTickets.count === 0) {
    // Get IDs
    const inverter1 = db.prepare('SELECT id FROM inverters WHERE serial_number = ?').get('INV-2024-001') as { id: number }
    const customer1 = db.prepare('SELECT id FROM customers WHERE email = ?').get('contact@abcsolar.vn') as { id: number }
    const technician = db.prepare('SELECT id FROM users WHERE email = ?').get('technician@SSE.vn') as { id: number }
    const creator = db.prepare('SELECT id FROM users WHERE email = ?').get('service@SSE.vn') as { id: number }

    if (inverter1 && customer1 && technician && creator) {
      const stmt = db.prepare(`
        INSERT INTO tickets (ticket_number, inverter_id, customer_id, title, description, priority, status, assigned_to, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      const ticketNumber = `TKT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
      stmt.run(
        ticketNumber,
        inverter1.id,
        customer1.id,
        'Inverter không khởi động',
        'Inverter MAX 10KTL3-X không khởi động sau khi mất điện. Kiểm tra và sửa chữa.',
        'high',
        'assigned',
        technician.id,
        creator.id
      )

      console.log('✅ Seeded tickets successfully!')
    }
  } else {
    console.log('ℹ️  Tickets already exist, skipping seed.')
  }
}

const seedSettings = () => {
  const existingSettings = db.prepare('SELECT COUNT(*) as count FROM settings').get() as { count: number }
  
  if (existingSettings.count === 0) {
    const stmt = db.prepare(`
      INSERT INTO settings (key, value, description)
      VALUES (?, ?, ?)
    `)

    stmt.run('sla_response_time_hours', '24', 'SLA: Thời gian phản hồi ticket (giờ)')
    stmt.run('sla_resolution_time_hours', '72', 'SLA: Thời gian giải quyết ticket (giờ)')
    stmt.run('warranty_period_years', '10', 'Thời gian bảo hành mặc định (năm)')
    stmt.run('company_name', 'Công ty TNHH SS ENERGY', 'Tên công ty')
    stmt.run('company_address', 'Số 13, ngõ Golden City 2A, đường Hải Thượng Lãn Ông, khối Yên Sơn, phường Vinh Phú, tỉnh Nghệ An', 'Địa chỉ công ty')
    stmt.run('company_phone', '', 'Số điện thoại công ty')
    stmt.run('company_email', 'ketoan.ssenergy@gmail.com', 'Email công ty')

    console.log('✅ Seeded settings successfully!')
  } else {
    console.log('ℹ️  Settings already exist, skipping seed.')
  }
}

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seed...')
    
    await seedUsers()
    seedCustomers()
    seedDistributors()
    seedInverters()
    seedWarehouseParts()
    seedTickets()
    seedSettings()

    console.log('✅ Database seeding completed successfully!')
    db.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    db.close()
    process.exit(1)
  }
}

seedDatabase()
