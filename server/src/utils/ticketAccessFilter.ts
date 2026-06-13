import db from '../database/db.js'
import { UserRole } from '../types/index.js'

export interface TicketAccessFilter {
  whereClause: string
  params: unknown[]
}

/** Build WHERE clause for tickets visible to the current user (alias `t`). */
export function buildTicketAccessFilter(user: {
  id: number
  role: string
}): TicketAccessFilter {
  let whereClause = ''
  const params: unknown[] = []

  if (user.role === UserRole.END_USER) {
    whereClause =
      'WHERE (t.created_by = ? OR t.assigned_to = ? OR EXISTS (SELECT 1 FROM inverters i WHERE i.id = t.inverter_id AND i.user_id = ?) OR EXISTS (SELECT 1 FROM ticket_watchers tw WHERE tw.ticket_id = t.id AND tw.user_id = ?))'
    params.push(user.id, user.id, user.id, user.id)
  } else if (user.role === UserRole.TECHNICIAN) {
    whereClause =
      'WHERE (t.assigned_to = ? OR t.created_by = ? OR EXISTS (SELECT 1 FROM ticket_watchers tw WHERE tw.ticket_id = t.id AND tw.user_id = ?))'
    params.push(user.id, user.id, user.id)
  } else if (user.role === UserRole.DISTRIBUTOR) {
    const linkedEndUsers = db
      .prepare(`
        SELECT id FROM users
        WHERE parent_distributor_id = ? AND role = ?
      `)
      .all(user.id, UserRole.END_USER) as Array<{ id: number }>

    if (linkedEndUsers.length > 0) {
      const endUserIds = linkedEndUsers.map((u) => u.id)
      const allUserIds = [user.id, ...endUserIds]
      whereClause = `WHERE (t.created_by IN (${allUserIds.map(() => '?').join(',')}) OR t.assigned_to = ? OR EXISTS (SELECT 1 FROM inverters i WHERE i.id = t.inverter_id AND i.user_id IN (${allUserIds.map(() => '?').join(',')})) OR EXISTS (SELECT 1 FROM ticket_watchers tw WHERE tw.ticket_id = t.id AND tw.user_id = ?))`
      params.push(...allUserIds, user.id, ...allUserIds, user.id)
    } else {
      whereClause =
        'WHERE (t.created_by = ? OR t.assigned_to = ? OR EXISTS (SELECT 1 FROM inverters i WHERE i.id = t.inverter_id AND i.user_id = ?) OR EXISTS (SELECT 1 FROM ticket_watchers tw WHERE tw.ticket_id = t.id AND tw.user_id = ?))'
      params.push(user.id, user.id, user.id, user.id)
    }
  }

  return { whereClause, params }
}
