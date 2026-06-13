/**
 * Quy tắc dữ liệu chuẩn — một nguồn sự thật, tránh nhầm ID.
 *
 * customers.id     → hồ sơ khách hàng (CRM), dùng trên hợp đồng / ticket / báo cáo
 * users.id         → tài khoản đăng nhập (staff hoặc portal)
 * customers.user_id → liên kết portal (optional): user đại diện KH này
 *
 * inverters.customer_id → CHÍNH: thiết bị thuộc khách hàng nào
 * inverters.user_id     → CHỈ mirror customers.user_id (portal), không dùng để tra cứu staff
 * inverters.distributor_id → NPP quản lý (nếu có)
 *
 * tickets.customer_id / inverter_id → FK chuẩn; *_name / *_serial là snapshot (trigger tự cập nhật)
 */

import type Database from 'better-sqlite3'

/** SQL: thiết bị thuộc một customer (trực tiếp hoặc qua hợp đồng) */
export const CUSTOMER_INVERTERS_SQL = `
  SELECT DISTINCT i.*
  FROM inverters i
  WHERE i.customer_id = ?
     OR i.id IN (
       SELECT ci.inverter_id
       FROM contract_inverters ci
       INNER JOIN contracts ct ON ct.id = ci.contract_id
       WHERE ct.customer_id = ?
     )
`

export const CUSTOMER_INVERTERS_WITH_MODEL_SQL = `
  SELECT DISTINCT i.*, m.capacity AS model_capacity
  FROM inverters i
  LEFT JOIN models m ON i.model = m.name
  WHERE i.customer_id = ?
     OR i.id IN (
       SELECT ci.inverter_id
       FROM contract_inverters ci
       INNER JOIN contracts ct ON ct.id = ci.contract_id
       WHERE ct.customer_id = ?
     )
`

/** Luôn ưu tiên customers.id; chỉ map users.id → customers qua user_id khi không có CRM record */
export function resolveCustomerId(db: Database.Database, rawId: number): number | null {
  const direct = db.prepare('SELECT id FROM customers WHERE id = ?').get(rawId) as { id: number } | undefined
  if (direct) return direct.id

  const linked = db
    .prepare('SELECT id FROM customers WHERE user_id = ? LIMIT 1')
    .get(rawId) as { id: number } | undefined
  return linked?.id ?? null
}

/** inverters.user_id chỉ mirror customers.user_id */
export function portalUserIdForCustomer(db: Database.Database, customerId: number): number | null {
  const row = db
    .prepare('SELECT user_id FROM customers WHERE id = ?')
    .get(customerId) as { user_id: number | null } | undefined
  return row?.user_id ?? null
}
