import db from '../database/db.js'
import { UserRole } from '../types/index.js'

const SYSTEM_USER_EMAILS = [
  'deverloper@sgesolartech.vn',
  'deverloper@SGEvietnam.com',
  'developer@SGE.vn',
  'developer@SGEvietnam.com',
  'developer@local.dev',
  'system@sgesolartech.vn',
  'system@SGE.vn',
]

const SYSTEM_DISPLAY_NAME = 'System'
const SYSTEM_DISPLAY_EMAIL = 'system@SGE.vn'

export const isSystemRole = (role?: string | null): boolean => role === UserRole.DEV

export const canViewSystemUsers = (requesterRole?: string | null): boolean =>
  requesterRole === UserRole.DEV

const loadSystemUserIds = (): Set<number> => {
  const emailPlaceholders = SYSTEM_USER_EMAILS.map(() => '?').join(',')
  const rows = db
    .prepare(
      `SELECT id FROM users WHERE role = ? OR LOWER(email) IN (${emailPlaceholders})`
    )
    .all(UserRole.DEV, ...SYSTEM_USER_EMAILS.map((email) => email.toLowerCase())) as Array<{ id: number }>
  return new Set(rows.map((row) => row.id))
}

let systemUserIds = loadSystemUserIds()

export const isSystemEmail = (email?: string | null): boolean => {
  if (!email) return false
  return SYSTEM_USER_EMAILS.includes(email.toLowerCase())
}

const ensureSystemUserIdCached = (id: number): boolean => {
  if (systemUserIds.has(id)) {
    return true
  }

  const row = db
    .prepare('SELECT id, role, email FROM users WHERE id = ?')
    .get(id) as { id: number; role: string; email: string } | undefined

  if (row && (isSystemRole(row.role) || isSystemEmail(row.email))) {
    systemUserIds.add(row.id)
    return true
  }

  return false
}

export const isSystemUserId = (id?: number | null): boolean => {
  if (typeof id !== 'number') return false
  return ensureSystemUserIdCached(id)
}

export const isSystemUser = (user?: { id?: number; email?: string | null; role?: string | null }): boolean => {
  if (!user) return false
  if (isSystemRole(user.role)) return true
  if (isSystemEmail(user.email)) return true
  if (typeof user.id === 'number' && isSystemUserId(user.id)) return true
  return false
}

export const maskSystemUser = <T extends Record<string, any>>(
  user: T | null | undefined,
  viewerId?: number
): T | null | undefined => {
  if (!user || !isSystemUser(user)) {
    return user
  }

  if (viewerId !== undefined && user.id === viewerId) {
    return user
  }

  const maskedUser = {
    ...user,
    name: SYSTEM_DISPLAY_NAME,
    email: SYSTEM_DISPLAY_EMAIL,
  } as T

  if ('code' in maskedUser) (maskedUser as any).code = null
  if ('organization' in maskedUser) (maskedUser as any).organization = null
  if ('phone' in maskedUser) (maskedUser as any).phone = null
  if ('address' in maskedUser) (maskedUser as any).address = null

  return maskedUser
}

type SystemFieldMapping = {
  idField: string
  nameField?: string
  emailField?: string
  phoneField?: string
  avatarField?: string
}

export const maskSystemUserFields = <T extends Record<string, any>>(
  entity: T,
  mappings: SystemFieldMapping[]
): T => {
  mappings.forEach(({ idField, nameField, emailField, phoneField, avatarField }) => {
    const id = entity[idField]
    if (isSystemUserId(id)) {
      const record = entity as Record<string, any>
      if (nameField) record[nameField] = SYSTEM_DISPLAY_NAME
      if (emailField) record[emailField] = SYSTEM_DISPLAY_EMAIL
      if (phoneField) record[phoneField] = null
      if (avatarField) record[avatarField] = null
    }
  })
  return entity
}

export const SYSTEM_USER_CONSTANTS = {
  emails: SYSTEM_USER_EMAILS,
  displayName: SYSTEM_DISPLAY_NAME,
  displayEmail: SYSTEM_DISPLAY_EMAIL,
  role: UserRole.DEV,
}

export const refreshSystemUserCache = () => {
  systemUserIds = loadSystemUserIds()
}

const applyMaskForEmailFields = (entity: Record<string, any>, keys: string[]) => {
  keys.forEach((key) => {
    if (typeof entity[key] === 'string') {
      entity[key] = SYSTEM_DISPLAY_EMAIL
    }
  })
}

const applyMaskForNameFields = (entity: Record<string, any>, keys: string[]) => {
  keys.forEach((key) => {
    if (key in entity) {
      entity[key] = SYSTEM_DISPLAY_NAME
    }
  })
}

const applyMaskForPhoneFields = (entity: Record<string, any>, keys: string[]) => {
  keys.forEach((key) => {
    if (key in entity) {
      entity[key] = null
    }
  })
}

const commonFieldSuffixes = ['name', 'email', 'phone', 'avatar']

const maskEntityByEmail = (entity: Record<string, any>) => {
  Object.keys(entity).forEach((key) => {
    if (typeof entity[key] !== 'string') return
    if (!isSystemEmail(entity[key])) return

    const lowerKey = key.toLowerCase()
    // Don't mask customer_email - customer information should not be masked
    if (lowerKey === 'customer_email' || lowerKey === 'customer_name' || lowerKey === 'customer_phone' || lowerKey === 'customer_address') {
      return
    }
    
    if (lowerKey.endsWith('_email')) {
      const base = key.slice(0, -6) // remove "_email"
      // Don't mask customer fields
      if (base === 'customer') {
        return
      }
      applyMaskForNameFields(entity, [`${base}_name`, 'name', 'user_name'])
      applyMaskForPhoneFields(entity, [`${base}_phone`, 'phone', 'user_phone'])
    } else {
      applyMaskForNameFields(entity, ['name', 'user_name'])
      applyMaskForPhoneFields(entity, ['phone', 'user_phone'])
    }
    entity[key] = SYSTEM_DISPLAY_EMAIL
  })
}

export const maskSystemData = (data: any): any => {
  if (Array.isArray(data)) {
    return data.map((item) => maskSystemData(item))
  }

  if (data && typeof data === 'object') {
    const entity = data as Record<string, any>

    Object.keys(entity).forEach((key) => {
      const value = entity[key]
      if (Array.isArray(value) || (value && typeof value === 'object')) {
        entity[key] = maskSystemData(value)
      }

      // Only mask fields related to user IDs, not customer IDs
      // Customer information should not be masked based on customer_id
      if (key.endsWith('_id') && typeof value === 'number' && isSystemUserId(value)) {
        const base = key.slice(0, -3)
        // Only mask if it's a user-related field, not customer-related
        // Skip masking for customer_id, distributor_id, etc.
        if (base === 'user' || base === 'created_by' || base === 'assigned_to' || base === 'technician' || base === 'distributor') {
          commonFieldSuffixes.forEach((suffix) => {
            const field = `${base}_${suffix}`
            if (suffix === 'name') applyMaskForNameFields(entity, [field])
            if (suffix === 'email') applyMaskForEmailFields(entity, [field])
            if (suffix === 'phone' || suffix === 'avatar') applyMaskForPhoneFields(entity, [field])
          })
        }
      }
    })

    if (isSystemEmail(entity.email)) {
      entity.name = SYSTEM_DISPLAY_NAME
      entity.email = SYSTEM_DISPLAY_EMAIL
      if ('code' in entity) entity.code = null
      if ('organization' in entity) entity.organization = null
      if ('phone' in entity) entity.phone = null
      if ('address' in entity) entity.address = null
    } else {
      maskEntityByEmail(entity)
    }

    return entity
  }

  return data
}


