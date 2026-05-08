/**
 * Database synchronization for ticket and task counts
 * This module handles caching and updating ticket/task counts for users
 */

import db from './db.js'

/**
 * Add cached count columns to users table if they don't exist
 */
export function initCountColumns() {
  try {
    // Check if columns exist and add them if not
    const tableInfo = db.prepare('PRAGMA table_info(users)').all() as Array<{ name: string }>
    const columnNames = tableInfo.map(col => col.name)

    if (!columnNames.includes('cached_active_tickets')) {
      db.prepare(`
        ALTER TABLE users 
        ADD COLUMN cached_active_tickets INTEGER DEFAULT 0
      `).run()
      console.log('✅ Added cached_active_tickets column to users table')
    }

    if (!columnNames.includes('cached_today_tasks')) {
      db.prepare(`
        ALTER TABLE users 
        ADD COLUMN cached_today_tasks INTEGER DEFAULT 0
      `).run()
      console.log('✅ Added cached_today_tasks column to users table')
    }

    // Create index for better performance
    try {
      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_users_cached_tickets 
        ON users(cached_active_tickets)
      `).run()
    } catch (err) {
      // Index might already exist, ignore
    }

    try {
      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_users_cached_tasks 
        ON users(cached_today_tasks)
      `).run()
    } catch (err) {
      // Index might already exist, ignore
    }
  } catch (error: any) {
    console.error('Error initializing count columns:', error.message)
    // If columns already exist, that's fine
    if (!error.message.includes('duplicate column')) {
      throw error
    }
  }
}

/**
 * Calculate and update active tickets count for a specific user
 */
export function syncUserActiveTickets(userId: number): number {
  const result = db.prepare(`
    SELECT COUNT(*) as count
    FROM tickets
    WHERE assigned_to = ? 
      AND status IN ('initialized', 'in_progress', 'new', 'assigned', 'waiting_parts')
  `).get(userId) as { count: number }

  const count = result.count || 0

  db.prepare(`
    UPDATE users 
    SET cached_active_tickets = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(count, userId)

  return count
}

/**
 * Calculate and update today's tasks count for a specific user
 */
export function syncUserTodayTasks(userId: number): number {
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
  
  const result = db.prepare(`
    SELECT COUNT(*) as count
    FROM technician_schedules
    WHERE technician_id = ? 
      AND schedule_date = ?
  `).get(userId, today) as { count: number }

  const count = result.count || 0

  db.prepare(`
    UPDATE users 
    SET cached_today_tasks = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(count, userId)

  return count
}

/**
 * Sync counts for a specific user (both tickets and tasks)
 */
export function syncUserCounts(userId: number) {
  const tickets = syncUserActiveTickets(userId)
  const tasks = syncUserTodayTasks(userId)
  return { tickets, tasks }
}

/**
 * Sync counts for all users (useful for bulk updates)
 */
export function syncAllUsersCounts() {
  const users = db.prepare(`
    SELECT id FROM users WHERE status = 'active'
  `).all() as Array<{ id: number }>

  let synced = 0
  for (const user of users) {
    syncUserCounts(user.id)
    synced++
  }

  console.log(`✅ Synced counts for ${synced} users`)
  return synced
}

/**
 * Sync counts when ticket status or assigned_to changes
 * Call this after ticket updates
 */
export function syncTicketRelatedCounts(ticketId?: number, oldAssignedTo?: number, newAssignedTo?: number) {
  const userIdsToSync = new Set<number>()

  if (oldAssignedTo) {
    userIdsToSync.add(oldAssignedTo)
  }
  if (newAssignedTo) {
    userIdsToSync.add(newAssignedTo)
  }

  // If we have ticketId, we can also sync based on current assignment
  if (ticketId) {
    const ticket = db.prepare(`
      SELECT assigned_to FROM tickets WHERE id = ?
    `).get(ticketId) as { assigned_to: number | null } | undefined

    if (ticket?.assigned_to) {
      userIdsToSync.add(ticket.assigned_to)
    }
  }

  // Sync counts for affected users
  for (const userId of userIdsToSync) {
    syncUserActiveTickets(userId)
  }
}

/**
 * Sync counts when schedule is created/updated/deleted
 * Call this after schedule updates
 */
export function syncScheduleRelatedCounts(technicianId: number) {
  syncUserTodayTasks(technicianId)
}



