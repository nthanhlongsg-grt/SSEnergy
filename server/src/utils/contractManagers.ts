import db from '../database/db.js'
import { UserRole } from '../types/index.js'

/** Chỉ người dùng cuối (portal) được gán quản lý thiết bị & ticket theo hợp đồng */
export const CONTRACT_MANAGER_ROLES: UserRole[] = [UserRole.END_USER]

export interface ContractManagerRow {
  id: number
  name: string
  email: string | null
  phone: string | null
  role: string
  function: string | null
  created_at: string
}

export function isContractManager(userId: number, contractId: number | string): boolean {
  const row = db
    .prepare('SELECT 1 FROM contract_managers WHERE contract_id = ? AND user_id = ?')
    .get(contractId, userId)
  return !!row
}

export function fetchContractManagers(contractId: number | string): ContractManagerRow[] {
  return db
    .prepare(`
      SELECT u.id, u.name, u.email, u.phone, u.role, u.function, cm.created_at
      FROM contract_managers cm
      JOIN users u ON u.id = cm.user_id
      WHERE cm.contract_id = ?
      ORDER BY u.name COLLATE NOCASE
    `)
    .all(contractId) as ContractManagerRow[]
}

export function setContractManagers(contractId: number | string, userIds: number[]): ContractManagerRow[] {
  const uniqueIds = [...new Set(userIds.filter((id) => Number.isFinite(id) && id > 0))]

  for (const userId of uniqueIds) {
    const user = db
      .prepare(`SELECT id, status, role FROM users WHERE id = ?`)
      .get(userId) as { id: number; status: string; role: string } | undefined
    if (!user || user.status !== 'active') {
      throw new Error(`Người dùng #${userId} không hợp lệ hoặc không hoạt động`)
    }
    if (!CONTRACT_MANAGER_ROLES.includes(user.role as UserRole)) {
      throw new Error('Chỉ người dùng cuối mới có thể được gán quản lý hợp đồng')
    }
  }

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM contract_managers WHERE contract_id = ?').run(contractId)
    const insert = db.prepare(
      'INSERT INTO contract_managers (contract_id, user_id) VALUES (?, ?)',
    )
    for (const userId of uniqueIds) {
      insert.run(contractId, userId)
    }
  })
  tx()

  return fetchContractManagers(contractId)
}

/** Technician / warehouse may view contract detail only when assigned as manager */
export function canViewContractRestrictedStaff(
  user: { id: number; role: string },
  contractId: number | string,
): boolean {
  if (user.role !== UserRole.TECHNICIAN && user.role !== UserRole.WAREHOUSE) return true
  return isContractManager(user.id, contractId)
}

/** SQL fragment: ticket visible because user manages its contract (alias `t`) */
export const contractManagerTicketExistsSql = `
  EXISTS (
    SELECT 1 FROM contract_managers cm
    WHERE cm.user_id = ?
    AND (
      (t.contract_id IS NOT NULL AND cm.contract_id = t.contract_id)
      OR EXISTS (
        SELECT 1 FROM contract_inverters ci
        WHERE ci.contract_id = cm.contract_id AND ci.inverter_id = t.inverter_id
      )
    )
  )
`

export function userCanAccessTicketViaContractManager(
  userId: number,
  ticket: { contract_id?: number | null; inverter_id?: number | null },
): boolean {
  const row = db
    .prepare(`
      SELECT 1
      FROM contract_managers cm
      WHERE cm.user_id = ?
        AND (
          (? IS NOT NULL AND cm.contract_id = ?)
          OR EXISTS (
            SELECT 1 FROM contract_inverters ci
            WHERE ci.contract_id = cm.contract_id AND ci.inverter_id = ?
          )
        )
      LIMIT 1
    `)
    .get(userId, ticket.contract_id ?? null, ticket.contract_id ?? null, ticket.inverter_id ?? null)
  return !!row
}
