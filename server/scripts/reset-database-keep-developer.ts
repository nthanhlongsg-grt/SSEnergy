import bcrypt from 'bcryptjs'
import db from '../src/database/db.js'
import { requireSeedPassword } from '../src/utils/seedPassword.js'

const resetDatabase = async () => {
  try {
    const devPassword = requireSeedPassword()
    const DEVELOPER_ACCOUNT = {
      name: 'developer',
      email: process.env.DEV_SEED_EMAIL || 'developer@local.dev',
      password: devPassword,
      code: 'DEV001',
      role: 'dev',
      organization: 'SGE Development',
      phone: '0900000000',
    }

    console.log('🔄 Bắt đầu reset database...')
    console.log('📋 Giữ lại tài khoản developer...\n')

    // Lưu thông tin developer account hiện tại (nếu có)
    const existingDeveloper = db.prepare('SELECT * FROM users WHERE email = ?').get(DEVELOPER_ACCOUNT.email) as any

    // Bắt đầu transaction
    db.exec('BEGIN TRANSACTION')

    try {
      // Xóa dữ liệu từ tất cả các bảng (theo thứ tự để tránh lỗi foreign key)
      console.log('🗑️  Đang xóa dữ liệu từ các bảng...')

      // Xóa các bảng có foreign key trước
      db.exec('DELETE FROM task_comments')
      console.log('  ✓ Đã xóa task_comments')

      db.exec('DELETE FROM task_related_users')
      console.log('  ✓ Đã xóa task_related_users')

      db.exec('DELETE FROM ticket_attachments')
      console.log('  ✓ Đã xóa ticket_attachments')

      db.exec('DELETE FROM ticket_watchers')
      console.log('  ✓ Đã xóa ticket_watchers')

      db.exec('DELETE FROM ticket_comments')
      console.log('  ✓ Đã xóa ticket_comments')

      db.exec('DELETE FROM service_report_parts')
      console.log('  ✓ Đã xóa service_report_parts')

      db.exec('DELETE FROM service_reports')
      console.log('  ✓ Đã xóa service_reports')

      db.exec('DELETE FROM warehouse_transactions')
      console.log('  ✓ Đã xóa warehouse_transactions')

      db.exec('DELETE FROM warehouse_parts')
      console.log('  ✓ Đã xóa warehouse_parts')

      db.exec('DELETE FROM rma_requests')
      console.log('  ✓ Đã xóa rma_requests')

      db.exec('DELETE FROM technician_schedules')
      console.log('  ✓ Đã xóa technician_schedules')

      db.exec('DELETE FROM project_inverters')
      console.log('  ✓ Đã xóa project_inverters')

      db.exec('DELETE FROM projects')
      console.log('  ✓ Đã xóa projects')

      db.exec('DELETE FROM inverter_history')
      console.log('  ✓ Đã xóa inverter_history')

      db.exec('DELETE FROM inverter_errors')
      console.log('  ✓ Đã xóa inverter_errors')

      db.exec('DELETE FROM tickets')
      console.log('  ✓ Đã xóa tickets')

      db.exec('DELETE FROM contract_inverters')
      console.log('  ✓ Đã xóa contract_inverters')

      db.exec('DELETE FROM contracts')
      console.log('  ✓ Đã xóa contracts')

      db.exec('DELETE FROM inverters')
      console.log('  ✓ Đã xóa inverters')

      db.exec('DELETE FROM customers')
      console.log('  ✓ Đã xóa customers')

      db.exec('DELETE FROM distributors')
      console.log('  ✓ Đã xóa distributors')

      db.exec('DELETE FROM models')
      console.log('  ✓ Đã xóa models')

      // Xóa notifications (nếu bảng tồn tại)
      try {
        db.exec('DELETE FROM notifications')
        console.log('  ✓ Đã xóa notifications')
      } catch (e) {
        // Bảng có thể không tồn tại, bỏ qua
      }

      // Xóa settings (giữ lại cấu trúc bảng)
      db.exec('DELETE FROM settings')
      console.log('  ✓ Đã xóa settings')

      // Xóa tất cả users trừ developer
      const deleteUsersStmt = db.prepare('DELETE FROM users WHERE email != ?')
      const deletedUsers = deleteUsersStmt.run(DEVELOPER_ACCOUNT.email)
      console.log(`  ✓ Đã xóa ${deletedUsers.changes} user(s) (trừ developer)`)

      // Đảm bảo developer account tồn tại với thông tin đúng
      const hashedPassword = await bcrypt.hash(DEVELOPER_ACCOUNT.password, 10)
      
      const checkDeveloper = db.prepare('SELECT id FROM users WHERE email = ?').get(DEVELOPER_ACCOUNT.email) as { id: number } | undefined

      if (checkDeveloper) {
        // Cập nhật developer account
        db.prepare(`
          UPDATE users 
          SET name = ?, password = ?, code = ?, role = ?, organization = ?, status = ?, phone = ?
          WHERE email = ?
        `).run(
          DEVELOPER_ACCOUNT.name,
          hashedPassword,
          DEVELOPER_ACCOUNT.code,
          DEVELOPER_ACCOUNT.role,
          DEVELOPER_ACCOUNT.organization,
          'active',
          DEVELOPER_ACCOUNT.phone,
          DEVELOPER_ACCOUNT.email
        )
        console.log('  ↻ Đã cập nhật tài khoản developer')
      } else {
        // Tạo developer account mới
        db.prepare(`
          INSERT INTO users (name, email, password, code, role, organization, status, phone)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          DEVELOPER_ACCOUNT.name,
          DEVELOPER_ACCOUNT.email,
          hashedPassword,
          DEVELOPER_ACCOUNT.code,
          DEVELOPER_ACCOUNT.role,
          DEVELOPER_ACCOUNT.organization,
          'active',
          DEVELOPER_ACCOUNT.phone
        )
        console.log('  ✓ Đã tạo tài khoản developer')
      }

      // Commit transaction
      db.exec('COMMIT')
      console.log('\n✅ Reset database thành công!')
      console.log('\n📝 Thông tin tài khoản developer:')
      console.log(`   Email: ${DEVELOPER_ACCOUNT.email}`)
      console.log(`   Role: ${DEVELOPER_ACCOUNT.role}`)
      console.log(`   Password: (giá trị DEV_SEED_PASSWORD bạn vừa set)`)

    } catch (error: any) {
      // Rollback nếu có lỗi
      db.exec('ROLLBACK')
      throw error
    }

    db.close()
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Lỗi khi reset database:', error.message)
    console.error(error)
    db.close()
    process.exit(1)
  }
}

resetDatabase()
