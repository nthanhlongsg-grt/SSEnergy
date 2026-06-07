import type Database from 'better-sqlite3'
import db from '../database/db.js'

const FALLBACK_CONTRACT = 'HĐ'

export type InverterTicketContext = {
  inverterId: number
  serialNumber: string
  contractNumber: string
}

function normalizeCodePart(value: string): string {
  return value.trim().replace(/\s+/g, '')
}

/** Tiền tố mã ticket: SN-HĐ */
export function buildTicketNumberPrefix(serialNumber: string, contractNumber: string): string {
  return `${normalizeCodePart(serialNumber)}-${normalizeCodePart(contractNumber)}-`
}

/** Hợp đồng mới nhất gắn với thiết bị (cùng logic chọn KH khi tạo ticket) */
export function getInverterTicketContext(
  inverterId: number,
  database: Database.Database = db
): InverterTicketContext | null {
  const inverter = database.prepare(`
    SELECT id, serial_number FROM inverters WHERE id = ?
  `).get(inverterId) as { id: number; serial_number: string | null } | undefined

  if (!inverter?.serial_number?.trim()) return null

  const contract = database.prepare(`
    SELECT ct.contract_number
    FROM contract_inverters ci
    JOIN contracts ct ON ct.id = ci.contract_id
    WHERE ci.inverter_id = ?
    ORDER BY ct.updated_at DESC, ci.contract_id DESC
    LIMIT 1
  `).get(inverterId) as { contract_number: string } | undefined

  return {
    inverterId: inverter.id,
    serialNumber: inverter.serial_number.trim(),
    contractNumber: contract?.contract_number?.trim() || FALLBACK_CONTRACT,
  }
}

/**
 * Mã ticket: SN + HĐ + 001 (001, 002, … theo số lần tạo ticket của thiết bị cùng SN).
 * Ví dụ: A1232322-VREC-001, A1232322-VREC-002
 */
export function generateTicketNumber(
  inverterId: number,
  database: Database.Database = db
): string {
  const ctx = getInverterTicketContext(inverterId, database)
  if (!ctx) {
    throw new Error('Không tìm thấy thiết bị hoặc số SN để tạo mã ticket')
  }

  const prefix = buildTicketNumberPrefix(ctx.serialNumber, ctx.contractNumber)

  const countRow = database.prepare(`
    SELECT COUNT(*) AS cnt
    FROM tickets t
    INNER JOIN inverters i ON i.id = t.inverter_id
    WHERE i.serial_number = ?
  `).get(ctx.serialNumber) as { cnt: number }

  let seq = (countRow?.cnt ?? 0) + 1
  let ticketNumber = `${prefix}${String(seq).padStart(3, '0')}`

  // Tránh trùng UNIQUE (ticket cũ dạng TKT-* hoặc race condition)
  while (database.prepare('SELECT 1 FROM tickets WHERE ticket_number = ?').get(ticketNumber)) {
    seq += 1
    ticketNumber = `${prefix}${String(seq).padStart(3, '0')}`
  }

  return ticketNumber
}

/** Fallback khi không có thiết bị (import / ticket không gắn máy) */
export function generateLegacyTicketNumber(): string {
  return `TKT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
}
