import db from '../src/database/db.js'

const email = process.argv[2] || 'demo2@gmail.com'

console.log(`🔍 Đang tìm kiếm user với email: ${email}\n`)
console.log('='.repeat(80))

try {
  // Query user from users table
  const user = db.prepare(`
    SELECT 
      id,
      name,
      email,
      code,
      role,
      function,
      organization,
      status,
      phone,
      address,
      parent_distributor_id,
      created_at,
      updated_at
    FROM users
    WHERE email = ?
  `).get(email) as any

  if (!user) {
    console.log(`❌ Không tìm thấy user với email: ${email}`)
    db.close()
    process.exit(1)
  }

  console.log('\n📋 THÔNG TIN USER:')
  console.log('='.repeat(80))
  console.log(`  ID: ${user.id}`)
  console.log(`  Tên: ${user.name}`)
  console.log(`  Email: ${user.email}`)
  console.log(`  Mã: ${user.code || 'N/A'}`)
  console.log(`  Vai trò: ${user.role}`)
  console.log(`  Chức năng: ${user.function || 'N/A'}`)
  console.log(`  Tổ chức: ${user.organization || 'N/A'}`)
  console.log(`  Trạng thái: ${user.status}`)
  console.log(`  Số điện thoại: ${user.phone || 'N/A'}`)
  console.log(`  Địa chỉ: ${user.address || 'N/A'}`)
  console.log(`  Parent Distributor ID: ${user.parent_distributor_id || 'N/A'}`)
  console.log(`  Ngày tạo: ${user.created_at}`)
  console.log(`  Ngày cập nhật: ${user.updated_at}`)

  // Check if linked to customer
  const customer = db.prepare(`
    SELECT id, name, email, customer_type, user_id
    FROM customers
    WHERE user_id = ?
  `).get(user.id) as any

  if (customer) {
    console.log('\n📦 LIÊN KẾT VỚI CUSTOMER:')
    console.log('='.repeat(80))
    console.log(`  Customer ID: ${customer.id}`)
    console.log(`  Tên: ${customer.name}`)
    console.log(`  Email: ${customer.email || 'N/A'}`)
    console.log(`  Loại: ${customer.customer_type}`)
    console.log(`  User ID: ${customer.user_id}`)
  }

  // Check if linked to distributor
  const distributor = db.prepare(`
    SELECT id, name, code, email, user_id
    FROM distributors
    WHERE user_id = ?
  `).get(user.id) as any

  if (distributor) {
    console.log('\n🏢 LIÊN KẾT VỚI DISTRIBUTOR:')
    console.log('='.repeat(80))
    console.log(`  Distributor ID: ${distributor.id}`)
    console.log(`  Tên: ${distributor.name}`)
    console.log(`  Mã: ${distributor.code || 'N/A'}`)
    console.log(`  Email: ${distributor.email || 'N/A'}`)
    console.log(`  User ID: ${distributor.user_id}`)
  }

  // Count related data
  console.log('\n📊 DỮ LIỆU LIÊN QUAN:')
  console.log('='.repeat(80))
  
  const inverterCount = db.prepare('SELECT COUNT(*) as count FROM inverters WHERE user_id = ?').get(user.id) as { count: number }
  console.log(`  Inverters: ${inverterCount.count}`)
  
  const ticketCount = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE created_by = ?').get(user.id) as { count: number }
  console.log(`  Tickets (đã tạo): ${ticketCount.count}`)
  
  const notificationCount = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?').get(user.id) as { count: number }
  console.log(`  Notifications: ${notificationCount.count}`)

  // If distributor, show linked end users
  if (user.role === 'distributor') {
    const linkedEndUsers = db.prepare(`
      SELECT id, email, name, phone
      FROM users
      WHERE parent_distributor_id = ? AND role = 'end_user'
    `).all(user.id) as Array<{ id: number; email: string; name: string; phone: string | null }>
    
    console.log(`  End Users được link: ${linkedEndUsers.length}`)
    if (linkedEndUsers.length > 0) {
      console.log('\n  Danh sách End Users:')
      linkedEndUsers.forEach((eu, index) => {
        console.log(`    ${index + 1}. ${eu.name} (${eu.email}) - ID: ${eu.id}`)
      })
    }
  }

  // If end_user, show parent distributor
  if (user.role === 'end_user' && user.parent_distributor_id) {
    const parentDistributor = db.prepare(`
      SELECT id, name, email
      FROM users
      WHERE id = ?
    `).get(user.parent_distributor_id) as { id: number; name: string; email: string } | undefined
    
    if (parentDistributor) {
      console.log(`\n  Parent Distributor: ${parentDistributor.name} (${parentDistributor.email}) - ID: ${parentDistributor.id}`)
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ Hoàn thành!')
  
  db.close()
  process.exit(0)
} catch (error) {
  console.error('❌ Lỗi:', error)
  db.close()
  process.exit(1)
}




