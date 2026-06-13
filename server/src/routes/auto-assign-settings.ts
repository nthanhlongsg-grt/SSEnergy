import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, requireSystemAdmin } from '../middleware/auth.js'
import { UserRole } from '../types/index.js'
import {
  resolveStaffFunction,
  AUTO_ASSIGN_STAFF_ROLES,
  type AutoAssignFunction,
} from '../utils/staffFunction.js'

const router = Router()

export const AUTO_ASSIGN_KEYS = {
  repair: 'auto_assign_repair',
  technicalSupport: 'auto_assign_technicalSupport',
  sale: 'auto_assign_sale',
  management: 'auto_assign_management',
} as const

export interface AutoAssignSettings {
  repair: number | null
  technicalSupport: number | null
  sale: number | null
  management: number | null
}

export const loadAutoAssignSettings = (): AutoAssignSettings => {
  const rows = db
    .prepare(
      `SELECT key, value FROM settings WHERE key IN (?, ?, ?, ?)`
    )
    .all(
      AUTO_ASSIGN_KEYS.repair,
      AUTO_ASSIGN_KEYS.technicalSupport,
      AUTO_ASSIGN_KEYS.sale,
      AUTO_ASSIGN_KEYS.management
    ) as Array<{ key: string; value: string | null }>

  const parsed: Partial<AutoAssignSettings> = {}
  for (const row of rows) {
    const value = row.value ? Number(row.value) : null
    if (value !== null && !Number.isInteger(value)) continue

    if (row.key === AUTO_ASSIGN_KEYS.repair) parsed.repair = value
    if (row.key === AUTO_ASSIGN_KEYS.technicalSupport) parsed.technicalSupport = value
    if (row.key === AUTO_ASSIGN_KEYS.sale) parsed.sale = value
    if (row.key === AUTO_ASSIGN_KEYS.management) parsed.management = value
  }

  return {
    repair: parsed.repair ?? null,
    technicalSupport: parsed.technicalSupport ?? null,
    sale: parsed.sale ?? null,
    management: parsed.management ?? null,
  }
}

// GET /api/auto-assign-settings — all authenticated users
router.get('/', authenticateToken, (req, res) => {
  try {
    res.json(loadAutoAssignSettings())
  } catch (error) {
    console.error('Get auto-assign settings error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/auto-assign-settings — admin/dev only
router.put(
  '/',
  authenticateToken,
  requireSystemAdmin(UserRole.ADMIN, UserRole.DEV),
  (req, res) => {
    try {
      const body = req.body as Partial<Record<AutoAssignFunction, number | null>>

      const upsert = db.prepare(`
        INSERT INTO settings (key, value, description, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(key) DO UPDATE SET
          value = excluded.value,
          description = excluded.description,
          updated_at = CURRENT_TIMESTAMP
      `)

      const validate = (fn: AutoAssignFunction, value: unknown) => {
        if (value === undefined) return

        if (value === null) {
          upsert.run(AUTO_ASSIGN_KEYS[fn], null, `Auto-assign staff for function: ${fn}`)
          return
        }

        const numVal = Number(value)
        if (!Number.isInteger(numVal) || numVal <= 0) {
          throw new Error(`${fn}: user ID must be a positive integer or null`)
        }

        const rolePlaceholders = AUTO_ASSIGN_STAFF_ROLES.map(() => '?').join(', ')
        const user = db.prepare(
          `SELECT id, role, function FROM users WHERE id = ? AND status = 'active' AND role IN (${rolePlaceholders})`
        ).get(numVal, ...AUTO_ASSIGN_STAFF_ROLES) as { id: number; role: string; function: string | null } | undefined

        if (!user) {
          throw new Error(`${fn}: user not found or not an active staff member`)
        }

        const effectiveFn = resolveStaffFunction(user.role, user.function)
        if (effectiveFn !== fn) {
          throw new Error(`${fn}: user function does not match (expected "${fn}", got "${effectiveFn ?? user.function}")`)
        }

        upsert.run(AUTO_ASSIGN_KEYS[fn], String(numVal), `Auto-assign staff for function: ${fn}`)
      }

      const transaction = db.transaction(() => {
        for (const fn of Object.keys(AUTO_ASSIGN_KEYS) as AutoAssignFunction[]) {
          if (fn in body) {
            validate(fn, body[fn])
          }
        }
      })

      transaction()
      res.json(loadAutoAssignSettings())
    } catch (error: any) {
      if (error?.message) {
        return res.status(400).json({ error: error.message })
      }
      console.error('Update auto-assign settings error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export default router
