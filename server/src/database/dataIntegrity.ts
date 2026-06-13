import type Database from 'better-sqlite3'

export interface IntegrityReport {
  invertersLinkedFromContracts: number
  invertersUserIdSynced: number
  invertersUserIdCleared: number
  ticketSnapshotsBackfilled: number
  issues: string[]
}

function tableExists(db: Database.Database, table: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table) as { name: string } | undefined
  return !!row
}

function tableColumns(db: Database.Database, table: string): Set<string> {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>
  return new Set(cols.map((c) => c.name))
}

/**
 * Gán customer_id cho inverter từ hợp đồng khi còn trống.
 */
export function linkInvertersFromContracts(db: Database.Database): number {
  if (!tableExists(db, 'inverters') || !tableExists(db, 'contract_inverters')) return 0

  const result = db.prepare(`
    UPDATE inverters
    SET customer_id = (
      SELECT ct.customer_id
      FROM contract_inverters ci
      INNER JOIN contracts ct ON ct.id = ci.contract_id
      WHERE ci.inverter_id = inverters.id
        AND ct.customer_id IS NOT NULL
      ORDER BY ct.updated_at DESC, ct.id DESC
      LIMIT 1
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE customer_id IS NULL
      AND id IN (
        SELECT ci.inverter_id
        FROM contract_inverters ci
        INNER JOIN contracts ct ON ct.id = ci.contract_id
        WHERE ct.customer_id IS NOT NULL
      )
  `).run()

  return result.changes
}

/**
 * inverters.user_id chỉ mirror customers.user_id — không dùng làm ownership độc lập.
 */
export function syncInverterPortalUserIds(db: Database.Database): { synced: number; cleared: number } {
  if (!tableExists(db, 'inverters')) return { synced: 0, cleared: 0 }

  const cols = tableColumns(db, 'inverters')
  if (!cols.has('user_id') || !cols.has('customer_id')) return { synced: 0, cleared: 0 }

  const synced = db.prepare(`
    UPDATE inverters
    SET user_id = (
      SELECT c.user_id FROM customers c WHERE c.id = inverters.customer_id
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE customer_id IS NOT NULL
      AND (
        user_id IS NOT NULL AND user_id != COALESCE(
          (SELECT c.user_id FROM customers c WHERE c.id = inverters.customer_id), -1
        )
        OR (
          user_id IS NOT NULL
          AND (SELECT c.user_id FROM customers c WHERE c.id = inverters.customer_id) IS NULL
        )
      )
  `).run().changes

  const cleared = db.prepare(`
    UPDATE inverters
    SET user_id = NULL,
        updated_at = CURRENT_TIMESTAMP
    WHERE customer_id IS NULL
      AND user_id IS NOT NULL
      AND distributor_id IS NULL
  `).run().changes

  return { synced, cleared }
}

export function backfillTicketSnapshots(db: Database.Database): number {
  if (!tableExists(db, 'tickets')) return 0

  const cols = tableColumns(db, 'tickets')
  let total = 0

  if (cols.has('customer_name')) {
    total += db.prepare(`
      UPDATE tickets SET
        customer_name = (SELECT c.name FROM customers c WHERE c.id = tickets.customer_id),
        customer_email = (SELECT c.email FROM customers c WHERE c.id = tickets.customer_id),
        customer_phone = (SELECT c.phone FROM customers c WHERE c.id = tickets.customer_id),
        customer_address = (SELECT c.address FROM customers c WHERE c.id = tickets.customer_id)
      WHERE customer_id IS NOT NULL
        AND (
          customer_name IS NULL
          OR customer_email IS NULL
          OR customer_phone IS NULL
          OR customer_address IS NULL
          OR customer_name != (SELECT c.name FROM customers c WHERE c.id = tickets.customer_id)
        )
    `).run().changes
  }

  if (cols.has('inverter_serial')) {
    total += db.prepare(`
      UPDATE tickets SET
        inverter_serial = (SELECT i.serial_number FROM inverters i WHERE i.id = tickets.inverter_id),
        inverter_model = (SELECT i.model FROM inverters i WHERE i.id = tickets.inverter_id)
      WHERE inverter_id IS NOT NULL
        AND (
          inverter_serial IS NULL
          OR inverter_model IS NULL
          OR inverter_serial != (SELECT i.serial_number FROM inverters i WHERE i.id = tickets.inverter_id)
        )
    `).run().changes
  }

  return total
}

/** Phát hiện xung đột phổ biến (chỉ báo cáo, không tự sửa) */
export function detectIntegrityIssues(db: Database.Database): string[] {
  const issues: string[] = []

  if (!tableExists(db, 'inverters') || !tableExists(db, 'customers')) return issues

  const orphanInverters = db.prepare(`
    SELECT COUNT(*) AS c FROM inverters
    WHERE customer_id IS NULL
      AND id NOT IN (SELECT inverter_id FROM contract_inverters)
  `).get() as { c: number }
  if (orphanInverters.c > 0) {
    issues.push(`${orphanInverters.c} inverter(s) không có customer_id và không gắn hợp đồng`)
  }

  const mismatchedUser = db.prepare(`
    SELECT COUNT(*) AS c FROM inverters i
    INNER JOIN customers c ON c.id = i.customer_id
    WHERE i.user_id IS NOT NULL
      AND c.user_id IS NOT NULL
      AND i.user_id != c.user_id
  `).get() as { c: number }
  if (mismatchedUser.c > 0) {
    issues.push(`${mismatchedUser.c} inverter(s) có user_id khác customers.user_id`)
  }

  const duplicateSerial = db.prepare(`
    SELECT serial_number, COUNT(*) AS c FROM inverters
    GROUP BY serial_number HAVING c > 1
  `).all() as Array<{ serial_number: string; c: number }>
  for (const row of duplicateSerial) {
    issues.push(`Serial trùng: ${row.serial_number} (${row.c} bản ghi)`)
  }

  return issues
}

export function reconcileDataIntegrity(db: Database.Database): IntegrityReport {
  const invertersLinkedFromContracts = linkInvertersFromContracts(db)
  const { synced: invertersUserIdSynced, cleared: invertersUserIdCleared } =
    syncInverterPortalUserIds(db)
  const ticketSnapshotsBackfilled = backfillTicketSnapshots(db)
  const issues = detectIntegrityIssues(db)

  return {
    invertersLinkedFromContracts,
    invertersUserIdSynced,
    invertersUserIdCleared,
    ticketSnapshotsBackfilled,
    issues,
  }
}
