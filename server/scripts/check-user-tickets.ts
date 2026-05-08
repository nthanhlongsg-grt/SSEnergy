import db from '../src/database/db.js'

const email = process.argv[2] || 'demo2@gmail.com'

console.log(`🔍 Đang kiểm tra tickets của user: ${email}\n`)
console.log('='.repeat(80))

try {
  // Get user info
  const user = db.prepare('SELECT id, name, email, role FROM users WHERE email = ?').get(email) as any

  if (!user) {
    console.log(`❌ Không tìm thấy user với email: ${email}`)
    db.close()
    process.exit(1)
  }

  console.log(`\n👤 User: ${user.name} (${user.email}) - ID: ${user.id} - Role: ${user.role}\n`)

  // Get tickets created by this user
  console.log('📋 TICKETS ĐƯỢC TẠO BỞI USER NÀY:')
  console.log('='.repeat(80))
  
  const createdTickets = db.prepare(`
    SELECT 
      t.id,
      t.ticket_number,
      t.title,
      t.status,
      t.priority,
      t.category,
      t.created_at,
      t.updated_at,
      t.resolved_at,
      t.closed_at,
      i.serial_number as inverter_serial,
      c.name as customer_name
    FROM tickets t
    LEFT JOIN inverters i ON t.inverter_id = i.id
    LEFT JOIN customers c ON t.customer_id = c.id
    WHERE t.created_by = ?
    ORDER BY t.created_at DESC
  `).all(user.id) as any[]

  if (createdTickets.length === 0) {
    console.log('  Không có ticket nào được tạo bởi user này')
  } else {
    console.log(`  Tổng số: ${createdTickets.length} ticket(s)\n`)
    createdTickets.forEach((ticket, index) => {
      console.log(`  ${index + 1}. Ticket #${ticket.ticket_number}`)
      console.log(`     ID: ${ticket.id}`)
      console.log(`     Tiêu đề: ${ticket.title}`)
      console.log(`     Trạng thái: ${ticket.status}`)
      console.log(`     Độ ưu tiên: ${ticket.priority}`)
      console.log(`     Danh mục: ${ticket.category || 'N/A'}`)
      console.log(`     Inverter: ${ticket.inverter_serial || 'N/A'}`)
      console.log(`     Customer: ${ticket.customer_name || 'N/A'}`)
      console.log(`     Ngày tạo: ${ticket.created_at}`)
      if (ticket.resolved_at) {
        console.log(`     Ngày giải quyết: ${ticket.resolved_at}`)
      }
      if (ticket.closed_at) {
        console.log(`     Ngày đóng: ${ticket.closed_at}`)
      }
      console.log('')
    })
  }

  // Get tickets assigned to this user
  console.log('\n📋 TICKETS ĐƯỢC GÁN CHO USER NÀY:')
  console.log('='.repeat(80))
  
  const assignedTickets = db.prepare(`
    SELECT 
      t.id,
      t.ticket_number,
      t.title,
      t.status,
      t.priority,
      t.category,
      t.created_at,
      u.name as created_by_name,
      u.email as created_by_email
    FROM tickets t
    LEFT JOIN users u ON t.created_by = u.id
    WHERE t.assigned_to = ?
    ORDER BY t.created_at DESC
  `).all(user.id) as any[]

  if (assignedTickets.length === 0) {
    console.log('  Không có ticket nào được gán cho user này')
  } else {
    console.log(`  Tổng số: ${assignedTickets.length} ticket(s)\n`)
    assignedTickets.forEach((ticket, index) => {
      console.log(`  ${index + 1}. Ticket #${ticket.ticket_number}`)
      console.log(`     ID: ${ticket.id}`)
      console.log(`     Tiêu đề: ${ticket.title}`)
      console.log(`     Trạng thái: ${ticket.status}`)
      console.log(`     Độ ưu tiên: ${ticket.priority}`)
      console.log(`     Được tạo bởi: ${ticket.created_by_name} (${ticket.created_by_email})`)
      console.log(`     Ngày tạo: ${ticket.created_at}`)
      console.log('')
    })
  }

  // Get tickets related to this user's inverters (if distributor)
  if (user.role === 'distributor') {
    console.log('\n📋 TICKETS LIÊN QUAN ĐẾN INVERTERS CỦA USER NÀY:')
    console.log('='.repeat(80))
    
    const relatedTickets = db.prepare(`
      SELECT DISTINCT
        t.id,
        t.ticket_number,
        t.title,
        t.status,
        t.priority,
        t.created_at,
        i.serial_number as inverter_serial,
        u.name as created_by_name,
        u.email as created_by_email
      FROM tickets t
      INNER JOIN inverters i ON t.inverter_id = i.id
      LEFT JOIN users u ON t.created_by = u.id
      WHERE i.user_id = ?
        AND t.created_by != ?
      ORDER BY t.created_at DESC
    `).all(user.id, user.id) as any[]

    if (relatedTickets.length === 0) {
      console.log('  Không có ticket nào liên quan đến inverters của user này')
    } else {
      console.log(`  Tổng số: ${relatedTickets.length} ticket(s)\n`)
      relatedTickets.forEach((ticket, index) => {
        console.log(`  ${index + 1}. Ticket #${ticket.ticket_number}`)
        console.log(`     ID: ${ticket.id}`)
        console.log(`     Tiêu đề: ${ticket.title}`)
        console.log(`     Trạng thái: ${ticket.status}`)
        console.log(`     Inverter: ${ticket.inverter_serial}`)
        console.log(`     Được tạo bởi: ${ticket.created_by_name} (${ticket.created_by_email})`)
        console.log(`     Ngày tạo: ${ticket.created_at}`)
        console.log('')
      })
    }

    // Get tickets from linked end users
    const linkedEndUsers = db.prepare(`
      SELECT id FROM users WHERE parent_distributor_id = ? AND role = 'end_user'
    `).all(user.id) as Array<{ id: number }>

    if (linkedEndUsers.length > 0) {
      const endUserIds = linkedEndUsers.map(eu => eu.id)
      const placeholders = endUserIds.map(() => '?').join(',')
      
      console.log('\n📋 TICKETS TỪ END USERS ĐƯỢC LINK:')
      console.log('='.repeat(80))
      
      const endUserTickets = db.prepare(`
        SELECT 
          t.id,
          t.ticket_number,
          t.title,
          t.status,
          t.priority,
          t.created_at,
          u.name as created_by_name,
          u.email as created_by_email
        FROM tickets t
        LEFT JOIN users u ON t.created_by = u.id
        WHERE t.created_by IN (${placeholders})
        ORDER BY t.created_at DESC
      `).all(...endUserIds) as any[]

      if (endUserTickets.length === 0) {
        console.log('  Không có ticket nào từ end users được link')
      } else {
        console.log(`  Tổng số: ${endUserTickets.length} ticket(s)\n`)
        endUserTickets.forEach((ticket, index) => {
          console.log(`  ${index + 1}. Ticket #${ticket.ticket_number}`)
          console.log(`     ID: ${ticket.id}`)
          console.log(`     Tiêu đề: ${ticket.title}`)
          console.log(`     Trạng thái: ${ticket.status}`)
          console.log(`     Được tạo bởi: ${ticket.created_by_name} (${ticket.created_by_email})`)
          console.log(`     Ngày tạo: ${ticket.created_at}`)
          console.log('')
        })
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('📊 TÓM TẮT:')
  console.log('='.repeat(80))
  console.log(`  Tickets được tạo: ${createdTickets.length}`)
  console.log(`  Tickets được gán: ${assignedTickets.length}`)
  if (user.role === 'distributor') {
    const relatedTickets = db.prepare(`
      SELECT COUNT(DISTINCT t.id) as count
      FROM tickets t
      INNER JOIN inverters i ON t.inverter_id = i.id
      WHERE i.user_id = ? AND t.created_by != ?
    `).get(user.id, user.id) as { count: number }
    console.log(`  Tickets liên quan đến inverters: ${relatedTickets.count}`)
  }
  console.log('\n✅ Hoàn thành!')
  
  db.close()
  process.exit(0)
} catch (error) {
  console.error('❌ Lỗi:', error)
  db.close()
  process.exit(1)
}




