import db from '../database/db.js'
import { UserRole } from '../types/index.js'

const ensureNotificationsTable = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      entity_type TEXT,
      entity_id INTEGER,
      data TEXT,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at);
  `)
}

ensureNotificationsTable()

export interface NotificationPayload {
  type: string
  title: string
  message?: string | null
  entityType?: string | null
  entityId?: number | null
  data?: Record<string, any> | null
}

const normalizePayload = (payload: NotificationPayload) => {
  return {
    ...payload,
    message: payload.message || null,
    entityType: payload.entityType || null,
    entityId: payload.entityId ?? null,
    data: payload.data ? JSON.stringify(payload.data) : null,
  }
}

export const createNotification = (userId: number, payload: NotificationPayload) => {
  const normalized = normalizePayload(payload)
  db.prepare(
    `
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      entity_type,
      entity_id,
      data
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `
  ).run(
    userId,
    normalized.type,
    normalized.title,
    normalized.message,
    normalized.entityType,
    normalized.entityId,
    normalized.data
  )
}

interface NotifyOptions {
  excludeIds?: number[]
}

export const notifyUsers = (userIds: number[], payload: NotificationPayload, options?: NotifyOptions) => {
  const excludeSet = new Set(options?.excludeIds ?? [])
  const uniqueIds = Array.from(new Set(userIds.filter((id) => typeof id === 'number' && !excludeSet.has(id))))
  uniqueIds.forEach((userId) => createNotification(userId, payload))
}

export const notifyUsersByRoles = (roles: UserRole[], payload: NotificationPayload, options?: NotifyOptions) => {
  if (!roles.length) return

  const placeholders = roles.map(() => '?').join(', ')
  const users = db
    .prepare(
      `
      SELECT id
      FROM users
      WHERE role IN (${placeholders}) AND status = 'active'
    `
    )
    .all(...roles) as { id: number }[]

  if (!users.length) return

  notifyUsers(
    users.map((u) => u.id),
    payload,
    options
  )
}

