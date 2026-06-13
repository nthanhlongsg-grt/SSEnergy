import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, requireSystemAdmin } from '../middleware/auth.js'
import { UserRole } from '../types/index.js'

const router = Router()

const SLA_SETTING_KEYS = {
  urgent: 'sla_hours_urgent',
  high: 'sla_hours_high',
  medium: 'sla_hours_medium',
  low: 'sla_hours_low',
} as const

const DEFAULT_SLA_HOURS = {
  urgent: 24,
  high: 48,
  medium: 72,
  low: 96,
} as const

type SlaPriority = keyof typeof SLA_SETTING_KEYS
type SlaSettings = Record<SlaPriority, number>

const loadSlaSettings = (): SlaSettings => {
  const rows = db
    .prepare(
      `
      SELECT key, value
      FROM settings
      WHERE key IN (?, ?, ?, ?)
    `
    )
    .all(
      SLA_SETTING_KEYS.urgent,
      SLA_SETTING_KEYS.high,
      SLA_SETTING_KEYS.medium,
      SLA_SETTING_KEYS.low
    ) as Array<{ key: string; value: string | null }>

  const parsed: Partial<SlaSettings> = {}
  for (const row of rows) {
    const value = Number(row.value)
    if (!Number.isInteger(value) || value <= 0) continue

    if (row.key === SLA_SETTING_KEYS.urgent) parsed.urgent = value
    if (row.key === SLA_SETTING_KEYS.high) parsed.high = value
    if (row.key === SLA_SETTING_KEYS.medium) parsed.medium = value
    if (row.key === SLA_SETTING_KEYS.low) parsed.low = value
  }

  return {
    urgent: parsed.urgent ?? DEFAULT_SLA_HOURS.urgent,
    high: parsed.high ?? DEFAULT_SLA_HOURS.high,
    medium: parsed.medium ?? DEFAULT_SLA_HOURS.medium,
    low: parsed.low ?? DEFAULT_SLA_HOURS.low,
  }
}

// Get current SLA settings
router.get('/', authenticateToken, (req, res) => {
  try {
    const settings = loadSlaSettings()
    res.json(settings)
  } catch (error) {
    console.error('Get SLA settings error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Update SLA settings (admin/dev only)
router.put(
  '/',
  authenticateToken,
  requireSystemAdmin(UserRole.ADMIN, UserRole.DEV),
  (req, res) => {
    try {
      const { urgent, high, medium, low } = req.body as Partial<SlaSettings>
      const updates: Array<{ key: string; value: number; description: string }> = []

      const validateAndPush = (priority: SlaPriority, value: unknown) => {
        if (value === undefined) return

        if (!Number.isInteger(value) || (value as number) <= 0) {
          throw new Error(`${priority} must be a positive integer`)
        }

        updates.push({
          key: SLA_SETTING_KEYS[priority],
          value: value as number,
          description: `SLA hours for ${priority} priority tickets`,
        })
      }

      validateAndPush('urgent', urgent)
      validateAndPush('high', high)
      validateAndPush('medium', medium)
      validateAndPush('low', low)

      if (updates.length === 0) {
        return res
          .status(400)
          .json({ error: 'At least one field is required: urgent, high, medium, low' })
      }

      const upsertStmt = db.prepare(`
        INSERT INTO settings (key, value, description, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          description = excluded.description,
          updated_at = CURRENT_TIMESTAMP
      `)

      const transaction = db.transaction(() => {
        for (const update of updates) {
          upsertStmt.run(update.key, String(update.value), update.description)
        }
      })

      transaction()
      res.json(loadSlaSettings())
    } catch (error: any) {
      if (error?.message?.includes('must be a positive integer')) {
        return res.status(400).json({ error: error.message })
      }

      console.error('Update SLA settings error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
