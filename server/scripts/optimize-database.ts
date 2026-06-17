/**
 * Database Optimization Script
 * 
 * Thêm các indexes cần thiết và tối ưu cấu hình SQLite để cải thiện performance
 */

import db from '../src/database/db.js'

console.log('🚀 Bắt đầu tối ưu hóa database...\n')

try {
  // 1. Tối ưu cấu hình SQLite
  console.log('📝 1. Tối ưu cấu hình SQLite...')
  
  // Enable WAL mode (Write-Ahead Logging) - tốt hơn cho concurrent reads/writes
  try {
    db.pragma('journal_mode = WAL')
    console.log('   ✅ Đã bật WAL mode')
  } catch (err: any) {
    console.log('   ⚠️  Không thể bật WAL mode:', err.message)
  }
  
  // Tăng cache size (default 2000 pages, đặt về 10000 pages ~ 40MB)
  try {
    db.pragma('cache_size = -10000') // Negative = KB, positive = pages
    console.log('   ✅ Đã tăng cache size')
  } catch (err: any) {
    console.log('   ⚠️  Lỗi khi tăng cache size:', err.message)
  }
  
  // Tối ưu synchronous (cho phép OS flush, nhanh hơn nhưng an toàn hơn NONE)
  try {
    db.pragma('synchronous = NORMAL') // NORMAL thay vì FULL cho performance tốt hơn
    console.log('   ✅ Đã đặt synchronous = NORMAL')
  } catch (err: any) {
    console.log('   ⚠️  Lỗi khi đặt synchronous:', err.message)
  }
  
  // Temp store in memory (giảm I/O cho temp tables)
  try {
    db.pragma('temp_store = MEMORY')
    console.log('   ✅ Đã đặt temp_store = MEMORY')
  } catch (err: any) {
    console.log('   ⚠️  Lỗi khi đặt temp_store:', err.message)
  }
  
  // 2. Thêm indexes cho tickets table
  console.log('\n📝 2. Thêm indexes cho bảng tickets...')
  
  const ticketIndexes = [
    { name: 'idx_tickets_created_by', sql: 'CREATE INDEX IF NOT EXISTS idx_tickets_created_by ON tickets(created_by)' },
    { name: 'idx_tickets_assigned_to', sql: 'CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assigned_to)' },
    { name: 'idx_tickets_inverter_id', sql: 'CREATE INDEX IF NOT EXISTS idx_tickets_inverter_id ON tickets(inverter_id)' },
    { name: 'idx_tickets_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at)' },
    { name: 'idx_tickets_priority', sql: 'CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority)' },
    // Composite indexes
    { name: 'idx_tickets_status_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_tickets_status_created_at ON tickets(status, created_at)' },
    { name: 'idx_tickets_assigned_status', sql: 'CREATE INDEX IF NOT EXISTS idx_tickets_assigned_status ON tickets(assigned_to, status)' },
    { name: 'idx_tickets_created_status', sql: 'CREATE INDEX IF NOT EXISTS idx_tickets_created_status ON tickets(created_by, status)' },
    { name: 'idx_tickets_status_priority', sql: 'CREATE INDEX IF NOT EXISTS idx_tickets_status_priority ON tickets(status, priority)' },
  ]
  
  for (const idx of ticketIndexes) {
    try {
      db.prepare(idx.sql).run()
      console.log(`   ✅ Đã tạo index: ${idx.name}`)
    } catch (err: any) {
      console.log(`   ⚠️  Lỗi khi tạo ${idx.name}:`, err.message)
    }
  }
  
  // 3. Thêm indexes cho inverters table
  console.log('\n📝 3. Thêm indexes cho bảng inverters...')
  
  const inverterIndexes = [
    { name: 'idx_inverters_distributor_id', sql: 'CREATE INDEX IF NOT EXISTS idx_inverters_distributor_id ON inverters(distributor_id)' },
    { name: 'idx_inverters_model', sql: 'CREATE INDEX IF NOT EXISTS idx_inverters_model ON inverters(model)' },
    { name: 'idx_inverters_status', sql: 'CREATE INDEX IF NOT EXISTS idx_inverters_status ON inverters(status)' },
    { name: 'idx_inverters_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_inverters_created_at ON inverters(created_at)' },
    { name: 'idx_inverters_user_id', sql: 'CREATE INDEX IF NOT EXISTS idx_inverters_user_id ON inverters(user_id)' },
    // Composite indexes
    { name: 'idx_inverters_distributor_status', sql: 'CREATE INDEX IF NOT EXISTS idx_inverters_distributor_status ON inverters(distributor_id, status)' },
    { name: 'idx_inverters_customer_status', sql: 'CREATE INDEX IF NOT EXISTS idx_inverters_customer_status ON inverters(customer_id, status)' },
  ]
  
  for (const idx of inverterIndexes) {
    try {
      db.prepare(idx.sql).run()
      console.log(`   ✅ Đã tạo index: ${idx.name}`)
    } catch (err: any) {
      // Ignore errors nếu column không tồn tại (như user_id có thể chưa có)
      if (!err.message.includes('no such column')) {
        console.log(`   ⚠️  Lỗi khi tạo ${idx.name}:`, err.message)
      }
    }
  }
  
  // 4. Thêm indexes cho users table
  console.log('\n📝 4. Thêm indexes cho bảng users...')
  
  const userIndexes = [
    { name: 'idx_users_role', sql: 'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)' },
    { name: 'idx_users_status', sql: 'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)' },
    { name: 'idx_users_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)' },
    // Composite indexes
    { name: 'idx_users_role_status', sql: 'CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status)' },
    { name: 'idx_users_parent_role', sql: 'CREATE INDEX IF NOT EXISTS idx_users_parent_role ON users(parent_distributor_id, role)' },
  ]
  
  for (const idx of userIndexes) {
    try {
      db.prepare(idx.sql).run()
      console.log(`   ✅ Đã tạo index: ${idx.name}`)
    } catch (err: any) {
      console.log(`   ⚠️  Lỗi khi tạo ${idx.name}:`, err.message)
    }
  }
  
  // 5. Thêm indexes cho technician_schedules table
  console.log('\n📝 5. Thêm indexes cho bảng technician_schedules...')
  
  const scheduleIndexes = [
    { name: 'idx_schedules_technician_id', sql: 'CREATE INDEX IF NOT EXISTS idx_schedules_technician_id ON technician_schedules(technician_id)' },
    { name: 'idx_schedules_status', sql: 'CREATE INDEX IF NOT EXISTS idx_schedules_status ON technician_schedules(status)' },
    { name: 'idx_schedules_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_schedules_created_at ON technician_schedules(created_at)' },
    // Composite indexes
    { name: 'idx_schedules_tech_date', sql: 'CREATE INDEX IF NOT EXISTS idx_schedules_tech_date ON technician_schedules(technician_id, schedule_date)' },
    { name: 'idx_schedules_date_status', sql: 'CREATE INDEX IF NOT EXISTS idx_schedules_date_status ON technician_schedules(schedule_date, status)' },
  ]
  
  for (const idx of scheduleIndexes) {
    try {
      db.prepare(idx.sql).run()
      console.log(`   ✅ Đã tạo index: ${idx.name}`)
    } catch (err: any) {
      console.log(`   ⚠️  Lỗi khi tạo ${idx.name}:`, err.message)
    }
  }
  
  // 6. Thêm indexes cho service_reports table
  console.log('\n📝 6. Thêm indexes cho bảng service_reports...')
  
  const serviceReportIndexes = [
    { name: 'idx_service_reports_technician_id', sql: 'CREATE INDEX IF NOT EXISTS idx_service_reports_technician_id ON service_reports(technician_id)' },
    { name: 'idx_service_reports_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_service_reports_created_at ON service_reports(created_at)' },
    { name: 'idx_service_reports_service_date', sql: 'CREATE INDEX IF NOT EXISTS idx_service_reports_service_date ON service_reports(service_date)' },
    { name: 'idx_service_reports_status', sql: 'CREATE INDEX IF NOT EXISTS idx_service_reports_status ON service_reports(status)' },
    // Composite indexes
    { name: 'idx_service_reports_tech_date', sql: 'CREATE INDEX IF NOT EXISTS idx_service_reports_tech_date ON service_reports(technician_id, service_date)' },
  ]
  
  for (const idx of serviceReportIndexes) {
    try {
      db.prepare(idx.sql).run()
      console.log(`   ✅ Đã tạo index: ${idx.name}`)
    } catch (err: any) {
      console.log(`   ⚠️  Lỗi khi tạo ${idx.name}:`, err.message)
    }
  }
  
  // 7. Thêm indexes cho các bảng khác
  console.log('\n📝 7. Thêm indexes cho các bảng khác...')
  
  const otherIndexes = [
    // Customers
    { name: 'idx_customers_phone', sql: 'CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)' },
    { name: 'idx_customers_type', sql: 'CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type)' },
    
    // Warehouse parts
    { name: 'idx_warehouse_parts_status', sql: 'CREATE INDEX IF NOT EXISTS idx_warehouse_parts_status ON warehouse_parts(status)' },
    { name: 'idx_warehouse_parts_category', sql: 'CREATE INDEX IF NOT EXISTS idx_warehouse_parts_category ON warehouse_parts(category)' },
    
    // Warehouse transactions
    { name: 'idx_warehouse_trans_part_id', sql: 'CREATE INDEX IF NOT EXISTS idx_warehouse_trans_part_id ON warehouse_transactions(part_id)' },
    { name: 'idx_warehouse_trans_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_warehouse_trans_created_at ON warehouse_transactions(created_at)' },
    { name: 'idx_warehouse_trans_type', sql: 'CREATE INDEX IF NOT EXISTS idx_warehouse_trans_type ON warehouse_transactions(transaction_type)' },
    
    // RMA requests
    { name: 'idx_rma_status', sql: 'CREATE INDEX IF NOT EXISTS idx_rma_status ON rma_requests(status)' },
    { name: 'idx_rma_customer_id', sql: 'CREATE INDEX IF NOT EXISTS idx_rma_customer_id ON rma_requests(customer_id)' },
    { name: 'idx_rma_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_rma_created_at ON rma_requests(created_at)' },
    
    // Projects
    { name: 'idx_projects_customer_id', sql: 'CREATE INDEX IF NOT EXISTS idx_projects_customer_id ON projects(customer_id)' },
    { name: 'idx_projects_status', sql: 'CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)' },
    
    // Ticket comments
    { name: 'idx_ticket_comments_ticket_id', sql: 'CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments(ticket_id)' },
    { name: 'idx_ticket_comments_user_id', sql: 'CREATE INDEX IF NOT EXISTS idx_ticket_comments_user_id ON ticket_comments(user_id)' },
    { name: 'idx_ticket_comments_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_ticket_comments_created_at ON ticket_comments(created_at)' },

    // Ticket attachments (detail + comment images)
    { name: 'idx_ticket_attachments_ticket_id', sql: 'CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_id ON ticket_attachments(ticket_id)' },
    { name: 'idx_ticket_attachments_ticket_comment', sql: 'CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket_comment ON ticket_attachments(ticket_id, comment_id)' },
    
    // Notifications
    { name: 'idx_notifications_type', sql: 'CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)' },
    { name: 'idx_notifications_created_at', sql: 'CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at)' },
  ]
  
  for (const idx of otherIndexes) {
    try {
      db.prepare(idx.sql).run()
      console.log(`   ✅ Đã tạo index: ${idx.name}`)
    } catch (err: any) {
      console.log(`   ⚠️  Lỗi khi tạo ${idx.name}:`, err.message)
    }
  }
  
  // 8. Chạy ANALYZE để update query planner statistics
  console.log('\n📝 8. Cập nhật thống kê query planner...')
  try {
    db.exec('ANALYZE')
    console.log('   ✅ Đã chạy ANALYZE để cập nhật thống kê')
  } catch (err: any) {
    console.log('   ⚠️  Lỗi khi chạy ANALYZE:', err.message)
  }
  
  // 9. Hiển thị thông tin về indexes
  console.log('\n📊 Thống kê indexes đã tạo:')
  try {
    const indexes = db.prepare(`
      SELECT 
        name, 
        tbl_name,
        sql
      FROM sqlite_master 
      WHERE type = 'index' 
        AND name NOT LIKE 'sqlite_%'
      ORDER BY tbl_name, name
    `).all() as Array<{ name: string; tbl_name: string; sql: string }>
    
    const indexesByTable: Record<string, string[]> = {}
    for (const idx of indexes) {
      if (!indexesByTable[idx.tbl_name]) {
        indexesByTable[idx.tbl_name] = []
      }
      indexesByTable[idx.tbl_name].push(idx.name)
    }
    
    for (const [table, idxNames] of Object.entries(indexesByTable)) {
      console.log(`   📋 ${table}: ${idxNames.length} indexes`)
    }
    
    console.log(`\n   Tổng cộng: ${indexes.length} indexes`)
  } catch (err: any) {
    console.log('   ⚠️  Lỗi khi lấy thống kê:', err.message)
  }
  
  console.log('\n✅ Hoàn tất tối ưu hóa database!')
  console.log('\n💡 Lưu ý:')
  console.log('   - WAL mode đã được bật để cải thiện concurrent performance')
  console.log('   - Các indexes sẽ giúp tăng tốc độ truy vấn')
  console.log('   - Nên chạy ANALYZE định kỳ sau khi có nhiều dữ liệu mới')
  
} catch (error: any) {
  console.error('❌ Lỗi khi tối ưu hóa database:', error.message)
  console.error(error)
  process.exit(1)
} finally {
  db.close()
  process.exit(0)
}




