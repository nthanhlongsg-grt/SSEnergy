import db from '../src/database/db.js'

try {
  console.log('🔄 Đồng bộ danh sách thiết bị với Database...')
  
  // Get all inverters from database
  const inverters = db.prepare('SELECT * FROM inverters ORDER BY created_at DESC').all() as Array<any>
  
  console.log(`\n📊 Tổng số thiết bị trong database: ${inverters.length}\n`)
  
  if (inverters.length === 0) {
    console.log('ℹ️  Chưa có thiết bị nào trong database.')
    console.log('💡 Chạy lệnh: npm run db:seed:full để tạo dữ liệu mẫu')
  } else {
    console.log('Danh sách thiết bị:')
    console.log('─'.repeat(100))
    console.log(
      'ID'.padEnd(5) +
      'Serial Number'.padEnd(20) +
      'Model'.padEnd(20) +
      'Type'.padEnd(15) +
      'Customer'.padEnd(20) +
      'Status'
    )
    console.log('─'.repeat(100))
    
    inverters.forEach((inv) => {
      const customerName = inv.customer_name || 'Chưa gắn'
      console.log(
        String(inv.id).padEnd(5) +
        (inv.serial_number || 'N/A').padEnd(20) +
        (inv.model || 'N/A').padEnd(20) +
        (inv.type || 'N/A').padEnd(15) +
        customerName.substring(0, 18).padEnd(20) +
        (inv.status || 'N/A')
      )
    })
    
    console.log('─'.repeat(100))
  }
  
  // Check for missing type field
  const invertersWithoutType = inverters.filter((inv) => !inv.type)
  if (invertersWithoutType.length > 0) {
    console.log(`\n⚠️  Có ${invertersWithoutType.length} thiết bị chưa có loại (type).`)
    console.log('💡 Cập nhật loại cho các thiết bị này trong giao diện hoặc database.')
  }
  
  console.log('\n✅ Đồng bộ hoàn tất!')
} catch (error) {
  console.error('❌ Lỗi khi đồng bộ:', error)
  process.exit(1)
}


