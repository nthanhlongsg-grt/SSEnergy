/**
 * Sync All Users to Customers and Distributors
 * 
 * Chạy sync cho tất cả users hiện có để đảm bảo customers và distributors được tạo/cập nhật
 */

import db from '../src/database/db.js'
import { syncUserData } from '../src/database/sync.js'

console.log('🔄 Bắt đầu đồng bộ tất cả users với customers và distributors...\n')

try {
  // Lấy tất cả users cần sync
  const users = db.prepare(`
    SELECT id, name, email, role 
    FROM users 
    WHERE role IN ('end_user', 'distributor', 'dealer')
      AND status = 'active'
    ORDER BY id
  `).all() as Array<{
    id: number
    name: string
    email: string
    role: string
  }>

  console.log(`📋 Tìm thấy ${users.length} users cần sync\n`)

  let syncedCustomers = 0
  let syncedDistributors = 0
  let errors = 0

  for (const user of users) {
    try {
      console.log(`🔄 Syncing user ${user.id} (${user.name}, ${user.role})...`)
      
      // Sync user to customers (nếu là end_user, distributor, dealer)
      if (['end_user', 'distributor', 'dealer'].includes(user.role)) {
        syncUserData(user.id)
        syncedCustomers++
      }
      
      // Sync user to distributors (nếu là distributor)
      if (user.role === 'distributor') {
        syncedDistributors++
      }
      
      console.log(`   ✅ Completed user ${user.id}\n`)
    } catch (error: any) {
      console.error(`   ❌ Error syncing user ${user.id}:`, error.message)
      errors++
    }
  }

  // Thống kê
  console.log('\n📊 Thống kê:')
  console.log(`   ✅ Đã sync ${syncedCustomers} users → customers`)
  console.log(`   ✅ Đã sync ${syncedDistributors} users → distributors`)
  if (errors > 0) {
    console.log(`   ⚠️  ${errors} lỗi`)
  }

  // Kiểm tra kết quả
  const customersCount = db.prepare('SELECT COUNT(*) as count FROM customers WHERE user_id IS NOT NULL').get() as { count: number }
  const distributorsCount = db.prepare('SELECT COUNT(*) as count FROM distributors WHERE user_id IS NOT NULL').get() as { count: number }

  console.log(`\n📈 Sau khi sync:`)
  console.log(`   - Customers có user_id: ${customersCount.count}`)
  console.log(`   - Distributors có user_id: ${distributorsCount.count}`)

  console.log('\n✅ Hoàn tất đồng bộ!')

} catch (error: any) {
  console.error('❌ Lỗi khi đồng bộ:', error.message)
  console.error(error)
  process.exit(1)
} finally {
  db.close()
  process.exit(0)
}




