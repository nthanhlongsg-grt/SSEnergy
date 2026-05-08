/**
 * Seed Customers Data
 * Tạo dữ liệu khách hàng mẫu
 */

import db from '../src/database/db.js'

console.log('🌱 Seeding customers data...\n')

const customers = [
  {
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@gmail.com',
    phone: '0901234567',
    address: 'Quận 1, TP.HCM',
    customer_type: 'residential',
    organization: null,
    tax_code: null,
    contact_person: null,
    notes: 'Khách hàng cá nhân',
  },
  {
    name: 'Trần Thị B',
    email: 'tranthib@gmail.com',
    phone: '0902345678',
    address: 'Quận 3, TP.HCM',
    customer_type: 'residential',
    organization: null,
    tax_code: null,
    contact_person: null,
    notes: 'Khách hàng cá nhân',
  },
  {
    name: 'Công ty TNHH ABC',
    email: 'contact@abc.com',
    phone: '0283456789',
    address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    customer_type: 'enterprise',
    organization: 'Công ty TNHH ABC',
    tax_code: '0123456789',
    contact_person: 'Lê Văn C',
    notes: 'Doanh nghiệp vừa và nhỏ',
  },
  {
    name: 'Công ty CP XYZ',
    email: 'info@xyz.com.vn',
    phone: '0284567890',
    address: '456 Lê Lợi, Quận 1, TP.HCM',
    customer_type: 'enterprise',
    organization: 'Công ty Cổ phần XYZ',
    tax_code: '0987654321',
    contact_person: 'Phạm Thị D',
    notes: 'Doanh nghiệp lớn',
  },
  {
    name: 'Hoàng Minh E',
    email: 'hoangminhe@yahoo.com',
    phone: '0905678901',
    address: 'Quận Thủ Đức, TP.HCM',
    customer_type: 'residential',
    organization: null,
    tax_code: null,
    contact_person: null,
    notes: 'Khách hàng cá nhân - Khu vực phía Đông',
  },
]

try {
  let inserted = 0
  let skipped = 0

  for (const customer of customers) {
    try {
      // Check if customer already exists (by email or phone)
      const existing = db.prepare(
        'SELECT id FROM customers WHERE email = ? OR phone = ?'
      ).get(customer.email, customer.phone) as { id: number } | undefined

      if (existing) {
        console.log(`  ⏭️  Customer already exists: ${customer.name} (${customer.email})`)
        skipped++
        continue
      }

      // Insert customer
      db.prepare(`
        INSERT INTO customers (
          name, email, phone, address, customer_type, 
          organization, tax_code, contact_person, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        customer.name,
        customer.email,
        customer.phone,
        customer.address,
        customer.customer_type,
        customer.organization,
        customer.tax_code,
        customer.contact_person,
        customer.notes
      )

      console.log(`  ✓ Inserted customer: ${customer.name} (${customer.customer_type})`)
      inserted++
    } catch (error: any) {
      console.error(`  ✗ Error inserting customer ${customer.name}:`, error.message)
    }
  }

  console.log(`\n✅ Seeded customers successfully!`)
  console.log(`   Inserted: ${inserted}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Total: ${inserted + skipped}`)

  process.exit(0)
} catch (error) {
  console.error('❌ Error seeding customers:', error)
  process.exit(1)
}




