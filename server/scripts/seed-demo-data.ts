/**
 * Comprehensive demo data seed script
 * Run: npm run db:seed:demo
 *
 * Creates realistic Vietnamese mock data:
 *  - 10 users (admin, service_center, technicians, distributors, end_users)
 *  - 8 customers (enterprise + residential)
 *  - 5 inverter models
 *  - 12 inverters
 *  - 20 tickets (various statuses & priorities)
 *  - 10 warehouse parts
 *  - 8 technician schedules
 *  - 6 service reports
 *  - SLA settings
 */

import bcrypt from 'bcryptjs'
import db from '../src/database/db.js'

// ─── helpers ────────────────────────────────────────────────────────────────

const upsertUser = db.prepare(`
  INSERT INTO users (name, email, password, code, role, function, organization, phone, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
  ON CONFLICT(email) DO UPDATE SET
    name = excluded.name, role = excluded.role,
    function = excluded.function, organization = excluded.organization,
    phone = excluded.phone, status = 'active'
`)

const log = (msg: string) => console.log(msg)

// ─── 1. USERS ───────────────────────────────────────────────────────────────

const seedUsers = async () => {
  log('\n👥 Seeding users...')

  const raw = [
    { name: 'Developer', email: 'developer@SGEvietnam.com', pw: 'SGE2025', code: 'DEV001', role: 'dev', fn: 'management', org: 'SGE Vietnam' },
    { name: 'Admin Trần Minh', email: 'admin@SGEvietnam.com', pw: 'SGE2025', code: 'ADM001', role: 'admin', fn: 'management', org: 'SGE Vietnam' },
    { name: 'Trung tâm Dịch vụ', email: 'service@SGEvietnam.com', pw: 'SGE2025', code: 'SVC001', role: 'service_center', fn: 'management', org: 'SGE Vietnam' },
    { name: 'KTV Nguyễn Văn An', email: 'an.kythuatbaohanh@SGEvietnam.com', pw: 'SGE2025', code: 'KTV001', role: 'technician', fn: 'repair', org: 'SGE Vietnam', phone: '0901111111' },
    { name: 'KTV Lê Thị Bảo', email: 'bao.hotrokythuat@SGEvietnam.com', pw: 'SGE2025', code: 'KTV002', role: 'technician', fn: 'technicalSupport', org: 'SGE Vietnam', phone: '0902222222' },
    { name: 'KTV Phạm Quốc Cường', email: 'cuong.sale@SGEvietnam.com', pw: 'SGE2025', code: 'KTV003', role: 'technician', fn: 'sale', org: 'SGE Vietnam', phone: '0903333333' },
    { name: 'Nhà PP Năng Lượng Xanh', email: 'npp.nangluongxanh@gmail.com', pw: 'SGE2025', code: 'NPP001', role: 'distributor', fn: null, org: 'Năng Lượng Xanh Co.', phone: '0281234567' },
    { name: 'Đại lý Solar Miền Nam', email: 'dl.solarmiemnam@gmail.com', pw: 'SGE2025', code: 'DL001', role: 'distributor', fn: null, org: 'Solar Miền Nam', phone: '0289876543' },
    { name: 'Công ty ABC Solar', email: 'contact@abcsolar.vn', pw: 'SGE2025', code: 'END001', role: 'end_user', fn: null, org: 'ABC Solar Co.' },
    { name: 'Nguyễn Văn Hùng', email: 'hung.nguyen@gmail.com', pw: 'SGE2025', code: 'END002', role: 'end_user', fn: null, org: null, phone: '0912345678' },
  ]

  for (const u of raw) {
    const hashed = await bcrypt.hash(u.pw, 10)
    upsertUser.run(u.name, u.email, hashed, u.code, u.role, u.fn ?? null, u.org ?? null, u.phone ?? null)
    log(`  ✓ ${u.role.padEnd(14)} ${u.email}`)
  }
}

// ─── 2. MODELS ──────────────────────────────────────────────────────────────

const seedModels = () => {
  log('\n📦 Seeding inverter models...')
  const insert = db.prepare(`
    INSERT INTO models (name, manufacturer, type, description, status)
    VALUES (?, 'SGE', ?, ?, 'active')
    ON CONFLICT(name) DO NOTHING
  `)
  const models = [
    ['MAX 10KTL3-X', 'grid-tie', 'Biến tần hòa lưới 3 pha 10kW dòng MAX'],
    ['MID 15KTL3-X', 'grid-tie', 'Biến tần hòa lưới 3 pha 15kW dòng MID'],
    ['SPH 6000', 'hybrid', 'Biến tần hybrid 6kW tích hợp bộ quản lý pin'],
    ['SPF 5000TL HVM', 'grid-tie', 'Biến tần off-grid 5kW dòng SPF'],
    ['MIN 6000TL-X', 'grid-tie', 'Biến tần hòa lưới 1 pha 6kW dòng MIN'],
  ]
  for (const [name, type, desc] of models) {
    insert.run(name, type, desc)
    log(`  ✓ ${name}`)
  }
}

// ─── 3. CUSTOMERS ───────────────────────────────────────────────────────────

const seedCustomers = () => {
  log('\n🏢 Seeding customers...')
  const insert = db.prepare(`
    INSERT OR IGNORE INTO customers (name, email, phone, address, customer_type, organization, tax_code, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const abcUser = db.prepare(`SELECT id FROM users WHERE email = ?`).get('contact@abcsolar.vn') as any
  const hungUser = db.prepare(`SELECT id FROM users WHERE email = ?`).get('hung.nguyen@gmail.com') as any

  const customers = [
    ['Công ty ABC Solar', 'contact@abcsolar.vn', '0281234567', '123 Nguyễn Huệ, Q1, TP.HCM', 'enterprise', 'ABC Solar Co.', '1234567890', abcUser?.id ?? null],
    ['Nguyễn Văn Hùng', 'hung.nguyen@gmail.com', '0912345678', '456 Lê Lợi, Q3, TP.HCM', 'residential', null, null, hungUser?.id ?? null],
    ['Trường THPT Nguyễn Du', 'admin@thptnguyendu.edu.vn', '0287654321', '789 Trần Hưng Đạo, Q5, TP.HCM', 'enterprise', 'THPT Nguyễn Du', '9876543210', null],
    ['Chung cư Vinhomes Q9', 'management@vinhomesq9.com', '0288888888', '321 Võ Văn Tần, Q3, TP.HCM', 'enterprise', 'Vinhomes Management', '1122334455', null],
    ['Hộ Gia Đình Trần Thị Mai', 'mai.tran@gmail.com', '0933445566', '55 Pasteur, Q1, TP.HCM', 'residential', null, null, null],
    ['Công ty Năng Lượng Phú Mỹ', 'info@phumyenergy.vn', '0284455667', '10 Đinh Tiên Hoàng, Bình Thạnh, TP.HCM', 'enterprise', 'Phú Mỹ Energy', '5566778899', null],
    ['Hộ Kinh Doanh Lê Văn Tài', 'tai.le.kd@gmail.com', '0977112233', '88 Cộng Hòa, Tân Bình, TP.HCM', 'residential', null, null, null],
    ['Nhà Máy Dệt Thuận Phát', 'thuanphat.factory@gmail.com', '0274334455', 'KCN Tân Bình, Bình Dương', 'enterprise', 'Thuận Phát Textile', '3344556677', null],
  ]
  for (const c of customers) {
    insert.run(...c)
    log(`  ✓ ${c[0]}`)
  }
}

// ─── 4. DISTRIBUTORS ────────────────────────────────────────────────────────

const seedDistributors = () => {
  log('\n🏪 Seeding distributors...')
  const insert = db.prepare(`
    INSERT OR IGNORE INTO distributors (name, code, contact_person, email, phone, address, tax_code, status, user_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?)
  `)

  const nppUser = db.prepare(`SELECT id FROM users WHERE email = ?`).get('npp.nangluongxanh@gmail.com') as any
  const dlUser = db.prepare(`SELECT id FROM users WHERE email = ?`).get('dl.solarmiemnam@gmail.com') as any

  insert.run('Năng Lượng Xanh Co.', 'NPP-NLX-001', 'Nguyễn Thị Thu', 'npp.nangluongxanh@gmail.com', '0281234567', '200 Nam Kỳ Khởi Nghĩa, Q3, TP.HCM', '2223334445', nppUser?.id ?? null)
  insert.run('Solar Miền Nam', 'DL-SMN-001', 'Trần Văn Sơn', 'dl.solarmiemnam@gmail.com', '0289876543', '100 Pasteur, Q3, TP.HCM', '1112223334', dlUser?.id ?? null)
  log(`  ✓ 2 distributors seeded`)
}

// ─── 5. INVERTERS ───────────────────────────────────────────────────────────

const seedInverters = () => {
  log('\n⚡ Seeding inverters...')
  const existing = (db.prepare('SELECT COUNT(*) as c FROM inverters').get() as any).c
  if (existing >= 12) { log('  ℹ️  Already seeded, skipping'); return }

  const insert = db.prepare(`
    INSERT OR IGNORE INTO inverters
      (serial_number, model, type, power_rating, installation_date,
       warranty_start_date, warranty_end_date, warranty_type,
       customer_id, status, installation_address)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'standard', ?, 'active', ?)
  `)

  const cust = (email: string) => (db.prepare('SELECT id FROM customers WHERE email = ?').get(email) as any)?.id

  const today = new Date()
  const d = (offset: number) => {
    const dt = new Date(today)
    dt.setMonth(dt.getMonth() + offset)
    return dt.toISOString().split('T')[0]
  }

  const data = [
    ['GW-2024-MAX-001', 'MAX 10KTL3-X', 'grid-tie', '10kW', d(-6), d(-6), d(114), cust('contact@abcsolar.vn'), '123 Nguyễn Huệ, Q1'],
    ['GW-2024-MAX-002', 'MAX 10KTL3-X', 'grid-tie', '10kW', d(-4), d(-4), d(116), cust('contact@abcsolar.vn'), '123 Nguyễn Huệ, Q1'],
    ['GW-2024-MID-001', 'MID 15KTL3-X', 'grid-tie', '15kW', d(-8), d(-8), d(112), cust('admin@thptnguyendu.edu.vn'), '789 Trần Hưng Đạo, Q5'],
    ['GW-2024-MID-002', 'MID 15KTL3-X', 'grid-tie', '15kW', d(-5), d(-5), d(115), cust('admin@thptnguyendu.edu.vn'), '789 Trần Hưng Đạo, Q5'],
    ['GW-2024-SPH-001', 'SPH 6000', 'hybrid', '6kW', d(-3), d(-3), d(117), cust('hung.nguyen@gmail.com'), '456 Lê Lợi, Q3'],
    ['GW-2024-SPH-002', 'SPH 6000', 'hybrid', '6kW', d(-2), d(-2), d(118), cust('mai.tran@gmail.com'), '55 Pasteur, Q1'],
    ['GW-2024-MIN-001', 'MIN 6000TL-X', 'grid-tie', '6kW', d(-1), d(-1), d(119), cust('tai.le.kd@gmail.com'), '88 Cộng Hòa, Tân Bình'],
    ['GW-2024-SPF-001', 'SPF 5000TL HVM', 'grid-tie', '5kW', d(-10), d(-10), d(110), cust('thuanphat.factory@gmail.com'), 'KCN Tân Bình, Bình Dương'],
    ['GW-2024-SPF-002', 'SPF 5000TL HVM', 'grid-tie', '5kW', d(-9), d(-9), d(111), cust('thuanphat.factory@gmail.com'), 'KCN Tân Bình, Bình Dương'],
    ['GW-2024-MAX-003', 'MAX 10KTL3-X', 'grid-tie', '10kW', d(-7), d(-7), d(113), cust('info@phumyenergy.vn'), '10 Đinh Tiên Hoàng, Bình Thạnh'],
    ['GW-2024-MAX-004', 'MAX 10KTL3-X', 'grid-tie', '10kW', d(-12), d(-12), d(108), cust('management@vinhomesq9.com'), '321 Võ Văn Tần, Q3'],
    ['GW-2024-MID-003', 'MID 15KTL3-X', 'grid-tie', '15kW', d(-11), d(-11), d(109), cust('management@vinhomesq9.com'), '321 Võ Văn Tần, Q3'],
  ]
  for (const row of data) {
    insert.run(...row)
    log(`  ✓ ${row[0]}`)
  }
}

// ─── 6. TICKETS ─────────────────────────────────────────────────────────────

const seedTickets = () => {
  log('\n🎫 Seeding tickets...')
  const existing = (db.prepare('SELECT COUNT(*) as c FROM tickets').get() as any).c
  if (existing >= 20) { log('  ℹ️  Already seeded, skipping'); return }

  const devUser = db.prepare('SELECT id FROM users WHERE role = ?').get('dev') as any
  const adminUser = db.prepare('SELECT id FROM users WHERE role = ?').get('admin') as any
  const svcUser = db.prepare('SELECT id FROM users WHERE role = ?').get('service_center') as any
  const techRepair = db.prepare("SELECT id FROM users WHERE function = 'repair'").get() as any
  const techSupport = db.prepare("SELECT id FROM users WHERE function = 'technicalSupport'").get() as any

  const inv = (serial: string) => (db.prepare('SELECT id FROM inverters WHERE serial_number = ?').get(serial) as any)?.id
  const cust = (email: string) => (db.prepare('SELECT id FROM customers WHERE email = ?').get(email) as any)?.id

  const creatorId = svcUser?.id ?? devUser?.id ?? 1

  const insert = db.prepare(`
    INSERT OR IGNORE INTO tickets
      (ticket_number, inverter_id, customer_id, title, description,
       priority, status, category, assigned_to, created_by, sla_deadline, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const now = new Date()
  const dt = (daysOffset: number, hoursOffset = 0) => {
    const d = new Date(now)
    d.setDate(d.getDate() + daysOffset)
    d.setHours(d.getHours() + hoursOffset)
    return d.toISOString()
  }

  const tickets = [
    // Urgent - overdue
    ['TKT-2025-000001', inv('GW-2024-MAX-001'), cust('contact@abcsolar.vn'), 'Inverter mất kết nối hoàn toàn', 'Máy bị mất kết nối sau cơn bão, không hiển thị thông số gì trên màn hình.', 'urgent', 'in_progress', 'warranty', techRepair?.id, creatorId, dt(-2), dt(-3)],
    ['TKT-2025-000002', inv('GW-2024-SPF-001'), cust('thuanphat.factory@gmail.com'), '3 thiết bị nhà máy ngừng hoạt động', 'Toàn bộ hệ thống nhà máy không phát điện. Ảnh hưởng nghiêm trọng sản xuất.', 'urgent', 'assigned', 'warranty', techRepair?.id, creatorId, dt(-1), dt(-2)],
    // High - in progress
    ['TKT-2025-000003', inv('GW-2024-MID-001'), cust('admin@thptnguyendu.edu.vn'), 'Lỗi E021 - Overtemperature', 'Máy liên tục báo lỗi E021 vào buổi trưa. Đã vệ sinh quạt tản nhiệt nhưng không cải thiện.', 'high', 'in_progress', 'warranty', techRepair?.id, creatorId, dt(1), dt(-4)],
    ['TKT-2025-000004', inv('GW-2024-MAX-002'), cust('contact@abcsolar.vn'), 'Sản lượng thấp hơn thiết kế 30%', 'Theo dõi 2 tuần thấy sản lượng chỉ đạt 70% so với thiết kế trong cùng điều kiện thời tiết.', 'high', 'waiting_parts', 'technical_support', techSupport?.id, creatorId, dt(2), dt(-5)],
    ['TKT-2025-000005', inv('GW-2024-MAX-004'), cust('management@vinhomesq9.com'), 'Không giao tiếp được với Shine App', 'Tất cả inverter tòa nhà mất kết nối Shine App sau khi nâng cấp WiFi router.', 'high', 'assigned', 'technical_support', techSupport?.id, creatorId, dt(1), dt(-3)],
    // Medium - various
    ['TKT-2025-000006', inv('GW-2024-SPH-001'), cust('hung.nguyen@gmail.com'), 'Hỏi về cấu hình Zero Export', 'Cần hỗ trợ cài đặt tính năng Zero Export để tránh phát điện lên lưới.', 'medium', 'assigned', 'technical_support', techSupport?.id, creatorId, dt(3), dt(-2)],
    ['TKT-2025-000007', inv('GW-2024-MIN-001'), cust('tai.le.kd@gmail.com'), 'Màn hình LCD mờ và nhấp nháy', 'Màn hình hiển thị yếu, các chữ số bị mờ và nhấp nháy sau 6 tháng sử dụng.', 'medium', 'in_progress', 'warranty', techRepair?.id, creatorId, dt(2), dt(-6)],
    ['TKT-2025-000008', inv('GW-2024-SPH-002'), cust('mai.tran@gmail.com'), 'Pin không sạc đầy qua đêm', 'Pin hybrid chỉ sạc đến 80% rồi dừng. Đã thay thế không giải quyết được.', 'medium', 'pending', 'warranty', null, creatorId, dt(4), dt(-1)],
    ['TKT-2025-000009', inv('GW-2024-MID-002'), cust('admin@thptnguyendu.edu.vn'), 'Yêu cầu kiểm tra định kỳ', 'Bảo dưỡng định kỳ theo hợp đồng bảo trì 6 tháng một lần.', 'medium', 'initialized', 'technical_support', null, creatorId, dt(5), dt(0)],
    ['TKT-2025-000010', inv('GW-2024-MAX-003'), cust('info@phumyenergy.vn'), 'Tư vấn nâng cấp công suất hệ thống', 'Khách hàng muốn tư vấn bổ sung thêm 2 inverter và tăng tổng công suất lên 30kW.', 'medium', 'initialized', 'product_consultation', null, creatorId, dt(6), dt(0)],
    // Low - new/initialized
    ['TKT-2025-000011', inv('GW-2024-SPF-002'), cust('thuanphat.factory@gmail.com'), 'Cập nhật firmware máy biến tần', 'Yêu cầu cập nhật firmware lên phiên bản mới nhất theo thông báo của SGE.', 'low', 'initialized', 'technical_support', null, creatorId, dt(10), dt(-1)],
    ['TKT-2025-000012', null, cust('contact@abcsolar.vn'), 'Đăng ký bảo hành thiết bị mới', 'Công ty vừa lắp thêm 2 inverter mới, cần đăng ký bảo hành chính hãng.', 'low', 'initialized', 'warranty', null, creatorId, dt(12), dt(0)],
    // Completed
    ['TKT-2025-000013', inv('GW-2024-MAX-001'), cust('contact@abcsolar.vn'), 'Thay thế quạt tản nhiệt', 'Quạt tản nhiệt hỏng gây quá nhiệt. Đã thay thế thành công.', 'high', 'completed', 'warranty', techRepair?.id, creatorId, dt(-30), dt(-60)],
    ['TKT-2025-000014', inv('GW-2024-MID-001'), cust('admin@thptnguyendu.edu.vn'), 'Cài đặt lại thông số hệ thống', 'Hệ thống cần cài đặt lại sau khi thay thế bộ điều khiển.', 'medium', 'closed', 'technical_support', techSupport?.id, creatorId, dt(-45), dt(-90)],
    ['TKT-2025-000015', inv('GW-2024-SPH-001'), cust('hung.nguyen@gmail.com'), 'Kết nối lại Shine App', 'Mất kết nối Shine App sau khi đổi nhà mạng. Đã kết nối lại thành công.', 'low', 'completed', 'technical_support', techSupport?.id, creatorId, dt(-20), dt(-40)],
    ['TKT-2025-000016', inv('GW-2024-SPF-001'), cust('thuanphat.factory@gmail.com'), 'Bảo dưỡng định kỳ tháng 9', 'Bảo dưỡng theo hợp đồng. Vệ sinh panel, kiểm tra đấu nối, cập nhật firmware.', 'medium', 'closed', 'technical_support', techRepair?.id, creatorId, dt(-90), dt(-120)],
    // Assigned - new batch
    ['TKT-2025-000017', inv('GW-2024-MID-003'), cust('management@vinhomesq9.com'), 'Lỗi GFCI - Ground Fault', 'Hệ thống báo lỗi GFCI liên tục. Nghi ngờ cáp DC bị hở cách điện.', 'high', 'in_progress', 'warranty', techRepair?.id, creatorId, dt(1), dt(-2)],
    ['TKT-2025-000018', inv('GW-2024-SPH-002'), cust('mai.tran@gmail.com'), 'Tư vấn thêm pin lưu trữ', 'Muốn bổ sung thêm 1 cụm pin 5kWh để tăng thời gian dự phòng điện.', 'low', 'assigned', 'product_consultation', techSupport?.id, creatorId, dt(15), dt(-1)],
    ['TKT-2025-000019', inv('GW-2024-MAX-003'), cust('info@phumyenergy.vn'), 'Kiểm tra điện áp đầu vào bất thường', 'Máy ghi nhận điện áp đầu vào dao động mạnh từ 380V đến 420V.', 'high', 'waiting_parts', 'technical_support', techSupport?.id, creatorId, dt(2), dt(-3)],
    ['TKT-2025-000020', inv('GW-2024-MIN-001'), cust('tai.le.kd@gmail.com'), 'Hỗ trợ xuất báo cáo sản lượng', 'Cần hướng dẫn cách xuất báo cáo sản lượng tháng từ ứng dụng Shine.', 'low', 'completed', 'technical_support', techSupport?.id, creatorId, dt(-10), dt(-15)],
  ]

  for (const row of tickets) {
    insert.run(...row)
    log(`  ✓ ${row[0]} [${row[5]}/${row[6]}]`)
  }
}

// ─── 7. WAREHOUSE PARTS ─────────────────────────────────────────────────────

const seedWarehouseParts = () => {
  log('\n🏭 Seeding warehouse parts...')
  const existing = (db.prepare('SELECT COUNT(*) as c FROM warehouse_parts').get() as any).c
  if (existing >= 10) { log('  ℹ️  Already seeded, skipping'); return }

  const insert = db.prepare(`
    INSERT OR IGNORE INTO warehouse_parts
      (part_number, name, category, description, manufacturer, quantity, min_quantity, unit_price, unit, supplier, status)
    VALUES (?, ?, ?, ?, 'SGE', ?, ?, ?, ?, 'SGE Vietnam', 'active')
  `)
  const parts = [
    ['PN-MPPT-001', 'Bộ điều khiển MPPT', 'Electronics', 'MPPT Controller 60A cho biến tần MAX', 25, 10, 2500000, 'pcs'],
    ['PN-FAN-001', 'Quạt làm mát DC', 'Mechanical', 'DC Cooling Fan 12V 0.5A', 50, 20, 350000, 'pcs'],
    ['PN-LCD-001', 'Module màn hình LCD', 'Display', 'LCD Display Screen 128x64 cho biến tần', 15, 5, 1200000, 'pcs'],
    ['PN-PCB-001', 'Bảng mạch PCB chính', 'Electronics', 'Main PCB cho MAX 10KTL3-X', 10, 5, 5000000, 'pcs'],
    ['PN-CABLE-DC', 'Bộ cáp DC 4mm²', 'Cables', 'Cáp DC 2x4mm² dài 10m, đầu MC4', 100, 30, 450000, 'set'],
    ['PN-CABLE-AC', 'Bộ cáp AC 3 pha', 'Cables', 'Cáp AC 3 pha 4mm² cho đấu nối lưới', 60, 20, 380000, 'set'],
    ['PN-FUSE-001', 'Cầu chì DC 15A', 'Protection', 'Cầu chì DC 15A 1000V loại string', 200, 50, 45000, 'pcs'],
    ['PN-SURGE-001', 'Thiết bị chống sét SPD', 'Protection', 'Surge Protection Device 1000V DC type II', 30, 10, 850000, 'pcs'],
    ['PN-RELAY-001', 'Relay AC 10A', 'Electronics', 'AC Relay 10A 250V cho mạch điều khiển', 40, 15, 120000, 'pcs'],
    ['PN-WIFI-001', 'Module WiFi Shine-GPRS-X', 'Communication', 'Wifi datalogger SGE Shine-GPRS-X', 20, 8, 950000, 'pcs'],
  ]
  for (const p of parts) {
    insert.run(...p)
    log(`  ✓ ${p[0]} - ${p[1]} (SL: ${p[4]})`)
  }
}

// ─── 8. TECHNICIAN SCHEDULES ────────────────────────────────────────────────

const seedSchedules = () => {
  log('\n📅 Seeding technician schedules...')
  const existing = (db.prepare('SELECT COUNT(*) as c FROM technician_schedules').get() as any).c
  if (existing >= 8) { log('  ℹ️  Already seeded, skipping'); return }

  const techRepair = db.prepare("SELECT id FROM users WHERE function = 'repair'").get() as any
  const techSupport = db.prepare("SELECT id FROM users WHERE function = 'technicalSupport'").get() as any
  const tk = (num: string) => (db.prepare('SELECT id FROM tickets WHERE ticket_number = ?').get(num) as any)?.id

  const insert = db.prepare(`
    INSERT INTO technician_schedules
      (technician_id, ticket_id, title, description, schedule_date, start_time, end_time, location, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const now = new Date()
  const day = (offset: number) => {
    const d = new Date(now); d.setDate(d.getDate() + offset)
    return d.toISOString().split('T')[0]
  }

  const schedules = [
    [techRepair?.id, tk('TKT-2025-000001'), 'Kiểm tra và sửa chữa tại ABC Solar', 'Kiểm tra tổng thể, thay thế linh kiện hỏng sau sự cố', day(0), '08:00', '12:00', '123 Nguyễn Huệ, Q1, TP.HCM', 'in_progress'],
    [techRepair?.id, tk('TKT-2025-000003'), 'Xử lý lỗi Overtemperature THPT Nguyễn Du', 'Vệ sinh hệ thống tản nhiệt, kiểm tra quạt và luồng khí', day(1), '09:00', '11:30', '789 Trần Hưng Đạo, Q5', 'scheduled'],
    [techRepair?.id, tk('TKT-2025-000007'), 'Thay thế màn hình LCD', 'Thay LCD mới theo yêu cầu bảo hành', day(2), '14:00', '16:00', '88 Cộng Hòa, Tân Bình', 'scheduled'],
    [techRepair?.id, tk('TKT-2025-000017'), 'Kiểm tra lỗi GFCI Vinhomes Q9', 'Kiểm tra cách điện cáp DC, tìm điểm rò rỉ', day(1), '08:30', '12:30', '321 Võ Văn Tần, Q3', 'scheduled'],
    [techSupport?.id, tk('TKT-2025-000006'), 'Hỗ trợ cài đặt Zero Export', 'Hướng dẫn và cài đặt tính năng Zero Export qua remote', day(0), '14:00', '15:30', 'Remote/Điện thoại', 'scheduled'],
    [techSupport?.id, tk('TKT-2025-000005'), 'Khắc phục lỗi kết nối Shine App Vinhomes', 'Reconfigure WiFi datalogger sau khi đổi router', day(1), '13:00', '15:00', '321 Võ Văn Tần, Q3', 'scheduled'],
    [techRepair?.id, null, 'Bảo dưỡng định kỳ Nhà máy Thuận Phát', 'Vệ sinh toàn bộ panel, kiểm tra đấu nối, đo công suất', day(3), '07:30', '12:00', 'KCN Tân Bình, Bình Dương', 'scheduled'],
    [techSupport?.id, tk('TKT-2025-000019'), 'Đo điện áp đầu vào Phú Mỹ Energy', 'Đo và ghi log điện áp 3 pha, kiểm tra bộ bù điện áp', day(2), '09:00', '11:00', '10 Đinh Tiên Hoàng, Bình Thạnh', 'scheduled'],
  ]

  for (const s of schedules) {
    insert.run(...s)
    log(`  ✓ ${s[2]} (${s[8]})`)
  }
}

// ─── 9. SERVICE REPORTS ─────────────────────────────────────────────────────

const seedServiceReports = () => {
  log('\n📋 Seeding service reports...')
  const existing = (db.prepare('SELECT COUNT(*) as c FROM service_reports').get() as any).c
  if (existing >= 6) { log('  ℹ️  Already seeded, skipping'); return }

  const techRepair = db.prepare("SELECT id FROM users WHERE function = 'repair'").get() as any
  const techSupport = db.prepare("SELECT id FROM users WHERE function = 'technicalSupport'").get() as any
  const tk = (num: string) => (db.prepare('SELECT id FROM tickets WHERE ticket_number = ?').get(num) as any)?.id

  const insert = db.prepare(`
    INSERT INTO service_reports
      (report_number, ticket_id, technician_id, service_date, service_type,
       description, diagnosis, actions_taken, parts_used, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const now = new Date()
  const day = (offset: number) => {
    const d = new Date(now); d.setDate(d.getDate() + offset)
    return d.toISOString().split('T')[0]
  }

  const reports = [
    ['SR-2025-000001', tk('TKT-2025-000013'), techRepair?.id, day(-30), 'repair',
     'Thay thế quạt tản nhiệt bị hỏng cho MAX 10KTL3-X',
     'Quạt tản nhiệt bị kẹt do bụi tích tụ, motor quạt bị cháy cuộn dây',
     'Tháo máy, làm sạch, thay quạt mới. Chạy thử 2 giờ ổn định.',
     'PN-FAN-001 x1', 'completed'],
    ['SR-2025-000002', tk('TKT-2025-000014'), techSupport?.id, day(-45), 'maintenance',
     'Cài đặt lại thông số hệ thống sau thay bộ điều khiển',
     'Bộ điều khiển bị lỗi firmware sau cập nhật không thành công',
     'Flash lại firmware, cài đặt thông số lưới, calibrate MPPT.',
     null, 'completed'],
    ['SR-2025-000003', tk('TKT-2025-000015'), techSupport?.id, day(-20), 'maintenance',
     'Kết nối lại Shine App cho hộ Nguyễn Văn Hùng',
     'Module WiFi không kết nối do đổi tên/mật khẩu WiFi nhà',
     'Cấu hình lại WiFi datalogger qua Shine Tool. Test gửi dữ liệu lên server.',
     null, 'completed'],
    ['SR-2025-000004', tk('TKT-2025-000016'), techRepair?.id, day(-90), 'maintenance',
     'Bảo dưỡng định kỳ nhà máy Thuận Phát tháng 9',
     'Kiểm tra tổng thể sau 12 tháng vận hành',
     'Vệ sinh panel bằng nước cất, kiểm tra đấu nối bu lông, đo cách điện cáp DC, cập nhật firmware 3.2.1.',
     null, 'completed'],
    ['SR-2025-000005', tk('TKT-2025-000003'), techRepair?.id, day(-1), 'repair',
     'Xử lý lỗi E021 Overtemperature THPT Nguyễn Du',
     'Quạt tản nhiệt chạy chậm do bụi, nhiệt độ lên 85°C gây lỗi',
     'Tháo quạt làm sạch hoàn toàn, bôi mỡ bạc đạn. Kiểm tra nhiệt độ còn 55°C.',
     null, 'draft'],
    ['SR-2025-000006', tk('TKT-2025-000020'), techSupport?.id, day(-10), 'maintenance',
     'Hướng dẫn xuất báo cáo sản lượng Shine App',
     'Khách hàng không biết cách sử dụng tính năng báo cáo trên app',
     'Hướng dẫn qua điện thoại: vào Reports > Monthly > Export PDF. Gửi video hướng dẫn.',
     null, 'completed'],
  ]

  for (const r of reports) {
    insert.run(...r)
    log(`  ✓ ${r[0]} [${r[9]}]`)
  }
}

// ─── 10. SLA SETTINGS ───────────────────────────────────────────────────────

const seedSlaSettings = () => {
  log('\n⚙️  Seeding SLA settings...')
  const upsert = db.prepare(`
    INSERT INTO settings (key, value, description, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
  `)
  upsert.run('sla_hours_urgent', '12', 'SLA hours for urgent priority tickets')
  upsert.run('sla_hours_high', '24', 'SLA hours for high priority tickets')
  upsert.run('sla_hours_medium', '72', 'SLA hours for medium priority tickets')
  upsert.run('sla_hours_low', '168', 'SLA hours for low priority tickets')
  upsert.run('company_name', 'SGE Vietnam', 'Tên công ty')
  upsert.run('company_address', 'Tầng 15, Tòa nhà Vincom Center, 72 Lê Thánh Tôn, Q.1, TP.HCM', 'Địa chỉ công ty')
  upsert.run('company_phone', '1800 6474', 'Hotline SGE Vietnam')
  upsert.run('company_email', 'service@SGEvietnam.com', 'Email dịch vụ')
  log('  ✓ SLA & company settings upserted')
}

// ─── MAIN ────────────────────────────────────────────────────────────────────

const run = async () => {
  try {
    log('🚀 Starting demo data seed...')
    log('━'.repeat(50))

    await seedUsers()
    seedModels()
    seedCustomers()
    seedDistributors()
    seedInverters()
    seedTickets()
    seedWarehouseParts()
    seedSchedules()
    seedServiceReports()
    seedSlaSettings()

    log('\n' + '━'.repeat(50))
    log('✅ Demo data seeded successfully!\n')

    log('🔑 Test accounts (password: SGE2025):')
    log('  admin@SGEvietnam.com         → Admin')
    log('  service@SGEvietnam.com       → Service Center')
    log('  an.kythuatbaohanh@SGEvietnam.com → KTV Sửa chữa')
    log('  bao.hotrokythuat@SGEvietnam.com  → KTV Hỗ trợ KT')
    log('  npp.nangluongxanh@gmail.com      → Nhà phân phối')
    log('  contact@abcsolar.vn              → End user (doanh nghiệp)')
    log('  hung.nguyen@gmail.com            → End user (cá nhân)')

    db.close()
    process.exit(0)
  } catch (err) {
    console.error('❌ Seed failed:', err)
    db.close()
    process.exit(1)
  }
}

run()
