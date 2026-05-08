/**
 * Link Customers and Distributors to Users
 * 
 * Thêm cột user_id vào bảng customers và distributors để liên kết với users table
 */

import db from '../src/database/db.js'

console.log('🔗 Bắt đầu liên kết customers và distributors với users...\n')

try {
  // 1. Thêm user_id vào bảng customers
  console.log('📝 1. Thêm user_id vào bảng customers...')
  
  const customersTableInfo = db.prepare('PRAGMA table_info(customers)').all() as Array<{ name: string }>
  const hasCustomerUserId = customersTableInfo.some(col => col.name === 'user_id')
  
  if (!hasCustomerUserId) {
    db.prepare('ALTER TABLE customers ADD COLUMN user_id INTEGER').run()
    console.log('   ✅ Đã thêm cột user_id vào bảng customers')
    
    // Thêm foreign key constraint (SQLite không hỗ trợ ALTER TABLE ADD CONSTRAINT, nên dùng trigger hoặc chỉ add index)
    db.prepare('CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id)').run()
    console.log('   ✅ Đã thêm index cho customers.user_id')
    
    // Tự động link customers với users dựa trên email hoặc phone nếu có
    console.log('   📋 Đang tự động link customers với users dựa trên email/phone...')
    const linkResult = db.prepare(`
      UPDATE customers
      SET user_id = (
        SELECT id FROM users 
        WHERE (users.email = customers.email AND customers.email IS NOT NULL AND customers.email != '')
           OR (users.phone = customers.phone AND customers.phone IS NOT NULL AND customers.phone != '')
        LIMIT 1
      )
      WHERE user_id IS NULL
        AND (
          (email IS NOT NULL AND email != '' AND EXISTS(SELECT 1 FROM users WHERE users.email = customers.email))
          OR (phone IS NOT NULL AND phone != '' AND EXISTS(SELECT 1 FROM users WHERE users.phone = customers.phone))
        )
    `).run()
    
    console.log(`   ✅ Đã tự động link ${linkResult.changes} customers với users`)
  } else {
    console.log('   ℹ️  Cột user_id đã tồn tại trong bảng customers')
  }
  
  // 2. Thêm user_id vào bảng distributors
  console.log('\n📝 2. Thêm user_id vào bảng distributors...')
  
  const distributorsTableInfo = db.prepare('PRAGMA table_info(distributors)').all() as Array<{ name: string }>
  const hasDistributorUserId = distributorsTableInfo.some(col => col.name === 'user_id')
  
  if (!hasDistributorUserId) {
    db.prepare('ALTER TABLE distributors ADD COLUMN user_id INTEGER').run()
    console.log('   ✅ Đã thêm cột user_id vào bảng distributors')
    
    // Thêm index
    db.prepare('CREATE INDEX IF NOT EXISTS idx_distributors_user_id ON distributors(user_id)').run()
    console.log('   ✅ Đã thêm index cho distributors.user_id')
    
    // Tự động link distributors với users có role = 'distributor' dựa trên email hoặc name
    console.log('   📋 Đang tự động link distributors với users có role = distributor...')
    const linkDistributorResult = db.prepare(`
      UPDATE distributors
      SET user_id = (
        SELECT id FROM users 
        WHERE users.role = 'distributor'
          AND (
            (users.email = distributors.email AND distributors.email IS NOT NULL AND distributors.email != '')
            OR (users.name = distributors.name AND distributors.name IS NOT NULL AND distributors.name != '')
          )
        LIMIT 1
      )
      WHERE user_id IS NULL
        AND (
          (email IS NOT NULL AND email != '' AND EXISTS(SELECT 1 FROM users WHERE users.role = 'distributor' AND users.email = distributors.email))
          OR (name IS NOT NULL AND name != '' AND EXISTS(SELECT 1 FROM users WHERE users.role = 'distributor' AND users.name = distributors.name))
        )
    `).run()
    
    console.log(`   ✅ Đã tự động link ${linkDistributorResult.changes} distributors với users`)
  } else {
    console.log('   ℹ️  Cột user_id đã tồn tại trong bảng distributors')
  }
  
  // 3. Tạo unique constraint để đảm bảo 1 user chỉ link với 1 customer/distributor
  console.log('\n📝 3. Tạo unique constraints...')
  
  // SQLite không hỗ trợ ALTER TABLE ADD UNIQUE CONSTRAINT trực tiếp
  // Nên sẽ tạo unique index để đảm bảo 1 user chỉ có 1 customer
  try {
    db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_user_id_unique ON customers(user_id) WHERE user_id IS NOT NULL').run()
    console.log('   ✅ Đã tạo unique index cho customers.user_id (NULL được phép, nhưng giá trị khác NULL phải unique)')
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      console.log('   ⚠️  Có duplicate user_id trong customers, cần kiểm tra và sửa thủ công')
    } else {
      console.log('   ⚠️  Lỗi khi tạo unique index:', err.message)
    }
  }
  
  try {
    db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_distributors_user_id_unique ON distributors(user_id) WHERE user_id IS NOT NULL').run()
    console.log('   ✅ Đã tạo unique index cho distributors.user_id (NULL được phép, nhưng giá trị khác NULL phải unique)')
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      console.log('   ⚠️  Có duplicate user_id trong distributors, cần kiểm tra và sửa thủ công')
    } else {
      console.log('   ⚠️  Lỗi khi tạo unique index:', err.message)
    }
  }
  
  // 4. Hiển thị thống kê
  console.log('\n📊 Thống kê liên kết:')
  
  const customersStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(user_id) as linked,
      COUNT(*) - COUNT(user_id) as unlinked
    FROM customers
  `).get() as { total: number; linked: number; unlinked: number }
  
  console.log(`   📋 Customers: ${customersStats.total} tổng cộng, ${customersStats.linked} đã link, ${customersStats.unlinked} chưa link`)
  
  const distributorsStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      COUNT(user_id) as linked,
      COUNT(*) - COUNT(user_id) as unlinked
    FROM distributors
  `).get() as { total: number; linked: number; unlinked: number }
  
  console.log(`   📋 Distributors: ${distributorsStats.total} tổng cộng, ${distributorsStats.linked} đã link, ${distributorsStats.unlinked} chưa link`)
  
  // 5. Hiển thị các records chưa được link
  if (customersStats.unlinked > 0) {
    console.log('\n   ⚠️  Customers chưa được link:')
    const unlinkedCustomers = db.prepare(`
      SELECT id, name, email, phone 
      FROM customers 
      WHERE user_id IS NULL 
      LIMIT 10
    `).all() as Array<{ id: number; name: string; email: string | null; phone: string | null }>
    
    for (const customer of unlinkedCustomers) {
      console.log(`      - ID ${customer.id}: ${customer.name} (${customer.email || customer.phone || 'no contact'})`)
    }
    if (customersStats.unlinked > 10) {
      console.log(`      ... và ${customersStats.unlinked - 10} records khác`)
    }
  }
  
  if (distributorsStats.unlinked > 0) {
    console.log('\n   ⚠️  Distributors chưa được link:')
    const unlinkedDistributors = db.prepare(`
      SELECT id, name, email 
      FROM distributors 
      WHERE user_id IS NULL 
      LIMIT 10
    `).all() as Array<{ id: number; name: string; email: string | null }>
    
    for (const distributor of unlinkedDistributors) {
      console.log(`      - ID ${distributor.id}: ${distributor.name} (${distributor.email || 'no email'})`)
    }
    if (distributorsStats.unlinked > 10) {
      console.log(`      ... và ${distributorsStats.unlinked - 10} records khác`)
    }
  }
  
  console.log('\n✅ Hoàn tất liên kết customers và distributors với users!')
  console.log('\n💡 Lưu ý:')
  console.log('   - Cột user_id đã được thêm vào cả 2 bảng')
  console.log('   - Đã tự động link các records có email/phone/name khớp')
  console.log('   - Các records chưa được link có thể link thủ công sau')
  console.log('   - Một user chỉ có thể link với 1 customer và 1 distributor (unique constraint)')
  
} catch (error: any) {
  console.error('❌ Lỗi khi liên kết:', error.message)
  console.error(error)
  process.exit(1)
} finally {
  db.close()
  process.exit(0)
}




