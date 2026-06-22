import db from '../database/db.js'
import { UserRole } from '../types/index.js'
import {
  contractManagerTicketExistsSqlFor,
  userCanAccessTicketViaContractManager,
} from './contractManagers.js'

export interface TicketAccessFilter {
  whereClause: string
  params: unknown[]
}

/** Ticket belongs to a customer company linked to portal user (user_id or contact_user_id). */
export const customerPortalTicketExistsSqlFor = (alias: string): string => `
  EXISTS (
    SELECT 1 FROM customers cu
    WHERE cu.id = ${alias}.customer_id
      AND (cu.user_id = ? OR cu.contact_user_id = ?)
  )
`

/** AND-clause fragment for end_user ticket visibility (pass alias: t, tickets, …). */
export function endUserTicketAccessSqlFor(alias: string): string {
  return `(
    ${alias}.created_by = ?
    OR ${alias}.assigned_to = ?
    OR EXISTS (SELECT 1 FROM inverters i WHERE i.id = ${alias}.inverter_id AND i.user_id = ?)
    OR EXISTS (SELECT 1 FROM ticket_watchers tw WHERE tw.ticket_id = ${alias}.id AND tw.user_id = ?)
    OR ${customerPortalTicketExistsSqlFor(alias)}
    OR ${contractManagerTicketExistsSqlFor(alias)}
  )`
}

export function endUserTicketAccessParams(userId: number): unknown[] {
  return [userId, userId, userId, userId, userId, userId, userId]
}

export function userCanAccessTicketViaCustomer(
  userId: number,
  customerId: number | null | undefined,
): boolean {
  if (!customerId) return false
  return !!db
    .prepare(
      `SELECT 1 FROM customers cu WHERE cu.id = ? AND (cu.user_id = ? OR cu.contact_user_id = ?)`,
    )
    .get(customerId, userId, userId)
}

export function canEndUserAccessTicket(
  userId: number,
  ticket: {
    id?: number
    created_by: number
    assigned_to?: number | null
    inverter_id?: number | null
    customer_id?: number | null
    contract_id?: number | null
  },
): boolean {
  if (ticket.created_by === userId) return true
  if (ticket.assigned_to === userId) return true
  if (
    ticket.inverter_id &&
    db.prepare('SELECT 1 FROM inverters WHERE id = ? AND user_id = ?').get(ticket.inverter_id, userId)
  ) {
    return true
  }
  if (
    ticket.id &&
    db.prepare('SELECT 1 FROM ticket_watchers WHERE ticket_id = ? AND user_id = ?').get(ticket.id, userId)
  ) {
    return true
  }
  if (userCanAccessTicketViaCustomer(userId, ticket.customer_id)) return true
  if (userCanAccessTicketViaContractManager(userId, ticket)) return true
  return false
}

/** Build WHERE clause for tickets visible to the current user (alias `t`). */
export function buildTicketAccessFilter(user: {
  id: number
  role: string
}): TicketAccessFilter {
  let whereClause = ''
  const params: unknown[] = []

  if (user.role === UserRole.END_USER) {
    whereClause = `WHERE ${endUserTicketAccessSqlFor('t')}`
    params.push(...endUserTicketAccessParams(user.id))
  } else if (user.role === UserRole.TECHNICIAN) {
    whereClause = `WHERE (t.assigned_to = ? OR t.created_by = ? OR EXISTS (SELECT 1 FROM ticket_watchers tw WHERE tw.ticket_id = t.id AND tw.user_id = ?) OR ${contractManagerTicketExistsSqlFor('t')})`
    params.push(user.id, user.id, user.id, user.id)
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
