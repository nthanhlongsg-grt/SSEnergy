import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { UserRole, isAdminRole, isStaffAdminRole } from '../types/index.js'
import { createNotification, notifyUsers } from '../services/notificationService.js'
import { syncScheduleRelatedCounts } from '../database/syncCounts.js'
import { isSystemEmail, isSystemRole } from '../utils/systemUser.js'

const router = Router()

// Get assignable users (ADMIN and TECHNICIAN roles, excluding System users)
// Allow ADMIN, DEV, SERVICE_CENTER, and TECHNICIAN to access this endpoint
router.get('/assignable-users', authenticateToken, (req, res) => {
  const user = (req as AuthRequest).user!
  // Only allow ADMIN, DEV, SERVICE_CENTER, and TECHNICIAN
  if (
    !isStaffAdminRole(user.role) &&
    user.role !== UserRole.SERVICE_CENTER &&
    user.role !== UserRole.TECHNICIAN
  ) {
    return res.status(403).json({ error: 'Access denied' })
  }
  try {
    const allUsers = db.prepare(`
      SELECT id, name, email, code, role, phone, status
      FROM users
      WHERE role IN (?, ?, ?) AND status = 'active'
      ORDER BY role, name ASC
    `).all(UserRole.ADMIN, UserRole.DEV, UserRole.TECHNICIAN) as Array<{ id: number; name: string; email: string; code: string | null; role: string; phone: string | null; status: string }>

    // Filter out System/dev accounts from assignment lists
    const users = allUsers.filter((row) => !isSystemRole(row.role) && !isSystemEmail(row.email))

    res.json(users)
  } catch (error) {
    console.error('Get assignable users error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get technician schedules
router.get('/', authenticateToken, (req, res) => {
  try {
    const { technician_id, date, status, from, to, page = '1', limit = '50' } = req.query

    let query = `
      SELECT ts.*,
             u.name as technician_name,
             creator.name as created_by_name,
             t.ticket_number,
             t.title as ticket_title,
             c.name as customer_name
      FROM technician_schedules ts
      LEFT JOIN users u ON ts.technician_id = u.id
      LEFT JOIN users creator ON ts.created_by = creator.id
      LEFT JOIN tickets t ON ts.ticket_id = t.id
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE 1=1
    `
    const params: any[] = []

    if (technician_id) {
      query += ' AND ts.technician_id = ?'
      params.push(parseInt(technician_id as string))
    }

    if (date) {
      query += ' AND ts.schedule_date = ?'
      params.push(date)
    }

    if (status) {
      query += ' AND ts.status = ?'
      params.push(status)
    }

    // Filter by date range (based on completed_at for completed tasks, or schedule_date for others)
    if (from && to) {
      query += ` AND (
        (ts.status = 'completed' AND ts.completed_at IS NOT NULL AND ts.completed_at >= ? AND ts.completed_at <= ?)
        OR
        (ts.status != 'completed' AND ts.schedule_date >= ? AND ts.schedule_date <= ?)
      )`
      params.push(`${from} 00:00:00`, `${to} 23:59:59`, from, to)
    }

    // Filter by user role
    const user = (req as AuthRequest).user!
    
    // Add created_by column if it doesn't exist (migration)
    try {
      const tableInfo = db.prepare('PRAGMA table_info(technician_schedules)').all() as Array<{ name: string }>
      const columnNames = tableInfo.map(col => col.name)
      if (!columnNames.includes('created_by')) {
        db.prepare('ALTER TABLE technician_schedules ADD COLUMN created_by INTEGER').run()
        console.log('✅ Added created_by column to technician_schedules table')
      }
    } catch (err: any) {
      // Column might already exist, ignore
      if (!err.message.includes('duplicate column')) {
        console.error('Error checking created_by column:', err)
      }
    }
    
    if (user.role === UserRole.TECHNICIAN || isAdminRole(user.role)) {
      // Technicians can only see their own schedules
      if (user.role === UserRole.TECHNICIAN) {
        query += ' AND ts.technician_id = ?'
        params.push(user.id)
      }
      // ADMIN can see all schedules
    }

    query += ' ORDER BY ts.schedule_date ASC, ts.start_time ASC LIMIT ? OFFSET ?'
    const limitNum = parseInt(limit as string)
    const offset = (parseInt(page as string) - 1) * limitNum
    params.push(limitNum, offset)

    const schedules = db.prepare(query).all(...params) as any[]

    // Get related users for each schedule
    const schedulesWithRelatedUsers = schedules.map((schedule) => {
      const relatedUsers = db.prepare(`
        SELECT u.id, u.name, u.email, u.phone, u.role
        FROM task_related_users tru
        JOIN users u ON tru.user_id = u.id
        WHERE tru.task_id = ?
      `).all(schedule.id) as any[]
      
      return {
        ...schedule,
        related_users: relatedUsers || [],
      }
    })

    res.json({
      data: schedulesWithRelatedUsers,
      pagination: {
        page: parseInt(page as string),
        limit: limitNum,
      },
    })
  } catch (error) {
    console.error('Get schedules error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get schedule by ID
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id)

    const schedule = db.prepare(`
      SELECT ts.*,
             u.name as technician_name,
             u.phone as technician_phone,
             creator.name as created_by_name,
             t.ticket_number,
             t.title as ticket_title,
             c.name as customer_name,
             c.address as customer_address
      FROM technician_schedules ts
      LEFT JOIN users u ON ts.technician_id = u.id
      LEFT JOIN users creator ON ts.created_by = creator.id
      LEFT JOIN tickets t ON ts.ticket_id = t.id
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE ts.id = ?
    `).get(scheduleId) as any

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' })
    }

    // Get related users
    const relatedUsers = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.role
      FROM task_related_users tru
      JOIN users u ON tru.user_id = u.id
      WHERE tru.task_id = ?
    `).all(scheduleId) as any[]

    // Get comments/activity log
    const comments = db.prepare(`
      SELECT tc.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM task_comments tc
      LEFT JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = ?
      ORDER BY tc.created_at ASC
    `).all(scheduleId) as any[]

    res.json({
      ...schedule,
      related_users: relatedUsers || [],
      comments: comments || [],
    })
  } catch (error) {
    console.error('Get schedule error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Create schedule
router.post('/', authenticateToken, requireRole(UserRole.ADMIN, UserRole.DEV, UserRole.SERVICE_CENTER), (req, res) => {
  try {
    const user = (req as AuthRequest).user!
    const {
      technician_id,
      ticket_id,
      title,
      description,
      schedule_date,
      start_time,
      end_time,
      location,
      work_requirements,
      notes,
      related_user_ids,
    } = req.body

    if (!technician_id || !schedule_date || !start_time || !title) {
      return res.status(400).json({ error: 'Người được gán, ngày lịch, thời gian bắt đầu và tên công việc là bắt buộc' })
    }

    // Check if date is in the past - only DEV can create tasks for past dates
    if (schedule_date) {
      const selectedDate = new Date(schedule_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      selectedDate.setHours(0, 0, 0, 0)
      
      // If date is in the past and user is not DEV
      if (selectedDate < today && user.role !== UserRole.DEV) {
        return res.status(400).json({ error: 'Không thể tạo công việc cho ngày đã qua. Chỉ DEV mới có quyền tạo công việc cho ngày đã qua.' })
      }
    }
    
    // Verify that the assigned user is either ADMIN or TECHNICIAN
    const assignedUser = db
      .prepare('SELECT role, name FROM users WHERE id = ?')
      .get(technician_id) as { role: string; name: string } | undefined
    if (!assignedUser) {
      return res.status(400).json({ error: 'Người dùng không tồn tại' })
    }
    if (!isAdminRole(assignedUser.role as UserRole) && assignedUser.role !== UserRole.TECHNICIAN) {
      return res.status(400).json({ error: 'Chỉ có thể gán công việc cho Admin hoặc Kỹ thuật viên' })
    }

    // Add created_by and work_requirements columns if they don't exist (migration)
    try {
      const tableInfo = db.prepare('PRAGMA table_info(technician_schedules)').all() as Array<{ name: string }>
      const columnNames = tableInfo.map(col => col.name)
      
      if (!columnNames.includes('created_by')) {
        db.prepare('ALTER TABLE technician_schedules ADD COLUMN created_by INTEGER').run()
        console.log('✅ Added created_by column to technician_schedules table')
      }
      
      if (!columnNames.includes('work_requirements')) {
        db.prepare('ALTER TABLE technician_schedules ADD COLUMN work_requirements TEXT').run()
        console.log('✅ Added work_requirements column to technician_schedules table')
      }
    } catch (err: any) {
      // Column might already exist, ignore
      if (!err.message.includes('duplicate column')) {
        console.error('Error checking columns:', err)
      }
    }
    
    const result = db.prepare(`
      INSERT INTO technician_schedules (
        technician_id, ticket_id, title, description,
        schedule_date, start_time, end_time, location, work_requirements, notes, created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      technician_id,
      ticket_id || null,
      title,
      description || null,
      schedule_date,
      start_time,
      end_time || null,
      location || null,
      work_requirements || null,
      notes || null,
      user.id
    )

    const taskId = result.lastInsertRowid

    // Add related users if provided
    if (related_user_ids && Array.isArray(related_user_ids) && related_user_ids.length > 0) {
      const insertRelatedUser = db.prepare(`
        INSERT INTO task_related_users (task_id, user_id)
        VALUES (?, ?)
      `)
      
      for (const userId of related_user_ids) {
        try {
          insertRelatedUser.run(taskId, userId)
        } catch (err: any) {
          // Ignore duplicate entries (UNIQUE constraint)
          if (!err.message.includes('UNIQUE constraint')) {
            console.error('Error adding related user:', err)
          }
        }
      }
    }

    const newSchedule = db.prepare(`
      SELECT ts.*,
             u.name as technician_name,
             creator.name as created_by_name,
             t.ticket_number,
             t.title as ticket_title,
             c.name as customer_name
      FROM technician_schedules ts
      LEFT JOIN users u ON ts.technician_id = u.id
      LEFT JOIN users creator ON ts.created_by = creator.id
      LEFT JOIN tickets t ON ts.ticket_id = t.id
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE ts.id = ?
    `).get(taskId) as any

    // Get related users
    const relatedUsers = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.role
      FROM task_related_users tru
      JOIN users u ON tru.user_id = u.id
      WHERE tru.task_id = ?
    `).all(taskId) as any[]

    const actor = db.prepare('SELECT name FROM users WHERE id = ?').get((req as AuthRequest).user!.id) as
      | { name: string }
      | undefined

    // Notify the assigned technician
    createNotification(technician_id, {
      type: 'schedule_assigned',
      title: 'Bạn được giao công việc mới',
      message: `${actor?.name || 'Hệ thống'} giao công việc "${title}" vào ngày ${schedule_date}`,
      entityType: 'schedule',
      entityId: newSchedule.id,
      data: {
        schedule_date,
        start_time,
        ticket_id: ticket_id || null,
        location: location || null,
      },
    })

    // Notify related users if any
    if (relatedUsers && relatedUsers.length > 0) {
      const relatedUserIds = relatedUsers.map(u => u.id).filter(id => id !== technician_id) // Exclude technician as they already got notified
      
      if (relatedUserIds.length > 0) {
        notifyUsers(
          relatedUserIds,
          {
            type: 'schedule_assigned',
            title: 'Bạn được thêm vào công việc liên quan',
            message: `${actor?.name || 'Hệ thống'} đã thêm bạn vào công việc "${title}" vào ngày ${schedule_date}`,
            entityType: 'schedule',
            entityId: newSchedule.id,
            data: {
              schedule_date,
              start_time,
              ticket_id: ticket_id || null,
              location: location || null,
            },
          }
        )
      }
    }

    // Sync task counts for the technician
    syncScheduleRelatedCounts(technician_id)

    res.status(201).json({
      ...newSchedule,
      related_users: relatedUsers || [],
    })
  } catch (error) {
    console.error('Create schedule error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update schedule
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id)
    const schedule = db.prepare('SELECT * FROM technician_schedules WHERE id = ?').get(scheduleId) as any

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' })
    }

    const user = (req as AuthRequest).user!

    // Permission check
    if (user.role === UserRole.TECHNICIAN && schedule.technician_id !== user.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const {
      technician_id,
      ticket_id,
      title,
      description,
      schedule_date,
      start_time,
      end_time,
      location,
      work_requirements,
      status,
      notes,
      completed_at,
      related_user_ids,
    } = req.body

    // Check if date is in the past - only DEV can update tasks to past dates
    if (schedule_date) {
      const selectedDate = new Date(schedule_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      selectedDate.setHours(0, 0, 0, 0)
      
      // If date is in the past and user is not DEV
      if (selectedDate < today && user.role !== UserRole.DEV) {
        return res.status(400).json({ error: 'Không thể cập nhật công việc cho ngày đã qua. Chỉ DEV mới có quyền cập nhật công việc cho ngày đã qua.' })
      }
    }

    let normalizedTechnicianId = technician_id
    if (technician_id !== undefined && technician_id !== null) {
      const parsed = Number(technician_id)
      if (Number.isNaN(parsed)) {
        return res.status(400).json({ error: 'technician_id không hợp lệ' })
      }
      normalizedTechnicianId = parsed
    }

    // If technician_id is being updated, verify the new user is ADMIN or TECHNICIAN
    if (normalizedTechnicianId) {
      const assignedUser = db
        .prepare('SELECT role FROM users WHERE id = ?')
        .get(normalizedTechnicianId) as { role: string } | undefined
      if (!assignedUser) {
        return res.status(400).json({ error: 'Người dùng không tồn tại' })
      }
      if (!isAdminRole(assignedUser.role as UserRole) && assignedUser.role !== UserRole.TECHNICIAN) {
        return res.status(400).json({ error: 'Chỉ có thể gán công việc cho Admin hoặc Kỹ thuật viên' })
      }
    }

    db.prepare(`
      UPDATE technician_schedules
      SET technician_id = COALESCE(?, technician_id),
          ticket_id = COALESCE(?, ticket_id),
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          schedule_date = COALESCE(?, schedule_date),
          start_time = COALESCE(?, start_time),
          end_time = COALESCE(?, end_time),
          location = COALESCE(?, location),
          work_requirements = COALESCE(?, work_requirements),
          status = COALESCE(?, status),
          completed_at = COALESCE(?, completed_at),
          notes = COALESCE(?, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      normalizedTechnicianId || null,
      ticket_id !== undefined ? ticket_id : null,
      title || null,
      description || null,
      schedule_date || null,
      start_time || null,
      end_time || null,
      location || null,
      work_requirements || null,
      status || null,
      completed_at || null,
      notes || null,
      scheduleId
    )

    // Get previous related users before update (if related_user_ids was provided)
    let previousRelatedUserIds: number[] = []
    if (related_user_ids !== undefined) {
      const previousRelatedUsers = db.prepare(`
        SELECT user_id
        FROM task_related_users
        WHERE task_id = ?
      `).all(scheduleId) as Array<{ user_id: number }>
      previousRelatedUserIds = previousRelatedUsers.map(row => row.user_id)
    }

    // Update related users if provided
    if (related_user_ids !== undefined) {
      // Remove all existing related users
      db.prepare('DELETE FROM task_related_users WHERE task_id = ?').run(scheduleId)
      
      // Add new related users if provided
      if (Array.isArray(related_user_ids) && related_user_ids.length > 0) {
        const insertRelatedUser = db.prepare(`
          INSERT INTO task_related_users (task_id, user_id)
          VALUES (?, ?)
        `)
        
        for (const userId of related_user_ids) {
          try {
            insertRelatedUser.run(scheduleId, userId)
          } catch (err: any) {
            // Ignore duplicate entries (should not happen, but just in case)
            if (!err.message.includes('UNIQUE constraint')) {
              console.error('Error adding related user:', err)
            }
          }
        }
      }
    }

    const updatedSchedule = db.prepare(`
      SELECT ts.*,
             u.name as technician_name,
             creator.name as created_by_name,
             t.ticket_number,
             t.title as ticket_title,
             c.name as customer_name
      FROM technician_schedules ts
      LEFT JOIN users u ON ts.technician_id = u.id
      LEFT JOIN users creator ON ts.created_by = creator.id
      LEFT JOIN tickets t ON ts.ticket_id = t.id
      LEFT JOIN customers c ON t.customer_id = c.id
      WHERE ts.id = ?
    `).get(scheduleId) as any

    // Get related users
    const relatedUsers = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.role
      FROM task_related_users tru
      JOIN users u ON tru.user_id = u.id
      WHERE tru.task_id = ?
    `).all(scheduleId) as any[]

    // Notify newly added related users (if related_user_ids was provided)
    if (related_user_ids !== undefined) {
      const currentRelatedUserIds = relatedUsers.map(u => u.id)
      const newlyAddedUserIds = currentRelatedUserIds.filter(id => !previousRelatedUserIds.includes(id))
      
      // Notify newly added related users
      if (newlyAddedUserIds.length > 0) {
        const actor = db.prepare('SELECT name FROM users WHERE id = ?').get(user.id) as { name: string } | undefined
        const excludeIds = [normalizedTechnicianId || schedule.technician_id].filter(Boolean) as number[]
        
        notifyUsers(
          newlyAddedUserIds.filter(id => !excludeIds.includes(id)),
          {
            type: 'schedule_assigned',
            title: 'Bạn được thêm vào công việc liên quan',
            message: `${actor?.name || 'Hệ thống'} đã thêm bạn vào công việc "${updatedSchedule.title}" vào ngày ${updatedSchedule.schedule_date}`,
            entityType: 'schedule',
            entityId: updatedSchedule.id,
            data: {
              schedule_date: updatedSchedule.schedule_date,
              start_time: updatedSchedule.start_time,
              ticket_id: updatedSchedule.ticket_id || null,
              location: updatedSchedule.location || null,
            },
          }
        )
      }
    }

    if (
      normalizedTechnicianId &&
      (schedule.technician_id === null || normalizedTechnicianId !== schedule.technician_id)
    ) {
      const actor = db.prepare('SELECT name FROM users WHERE id = ?').get(user.id) as { name: string } | undefined
      createNotification(normalizedTechnicianId, {
        type: 'schedule_assigned',
        title: 'Bạn được cập nhật công việc',
        message: `${actor?.name || 'Hệ thống'} giao công việc "${updatedSchedule.title}" cho bạn`,
        entityType: 'schedule',
        entityId: updatedSchedule.id,
        data: {
          schedule_date: updatedSchedule.schedule_date,
          start_time: updatedSchedule.start_time,
          ticket_id: updatedSchedule.ticket_id,
        },
      })
    }

    // Sync task counts for affected technicians
    syncScheduleRelatedCounts(schedule.technician_id)
    if (normalizedTechnicianId && normalizedTechnicianId !== schedule.technician_id) {
      syncScheduleRelatedCounts(normalizedTechnicianId)
    }

    res.json({
      ...updatedSchedule,
      related_users: relatedUsers || [],
    })
  } catch (error) {
    console.error('Update schedule error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Add comment to task
router.post('/:id/comments', authenticateToken, (req, res) => {
  try {
    const taskId = parseInt(req.params.id)
    const { comment } = req.body

    if (!comment) {
      return res.status(400).json({ error: 'Comment is required' })
    }

    // Check if task exists
    const task = db.prepare('SELECT id FROM technician_schedules WHERE id = ?').get(taskId) as any
    if (!task) {
      return res.status(404).json({ error: 'Task not found' })
    }

    const user = (req as AuthRequest).user!

    const result = db.prepare(`
      INSERT INTO task_comments (task_id, user_id, comment)
      VALUES (?, ?, ?)
    `).run(taskId, user.id, comment)

    const newComment = db.prepare(`
      SELECT tc.*, u.name as user_name, u.email as user_email, u.phone as user_phone
      FROM task_comments tc
      LEFT JOIN users u ON tc.user_id = u.id
      WHERE tc.id = ?
    `).get(result.lastInsertRowid) as any

    // Update task updated_at
    db.prepare('UPDATE technician_schedules SET updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(taskId)

    res.status(201).json(newComment)
  } catch (error) {
    console.error('Add comment error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Delete schedule (only DEV role)
router.delete('/:id', authenticateToken, requireRole(UserRole.DEV), (req, res) => {
  try {
    const scheduleId = parseInt(req.params.id)

    const schedule = db.prepare('SELECT id, technician_id FROM technician_schedules WHERE id = ?').get(scheduleId) as any
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' })
    }

    const technicianId = schedule.technician_id
    db.prepare('DELETE FROM technician_schedules WHERE id = ?').run(scheduleId)

    // Sync task counts for the technician
    if (technicianId) {
      syncScheduleRelatedCounts(technicianId)
    }

    res.status(204).send()
  } catch (error) {
    console.error('Delete schedule error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
