import { Router } from 'express'
import db from '../database/db.js'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

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

const serializeNotification = (notification: any) => ({
  ...notification,
  data: notification.data ? JSON.parse(notification.data) : null,
  is_read: Boolean(notification.is_read),
})

router.get('/', authenticateToken, (req, res) => {
  try {
    const authUser = (req as AuthRequest).user!
    const { limit = '20', unreadOnly } = req.query

    let query = `
      SELECT *
      FROM notifications
      WHERE user_id = ?
    `
    const params: any[] = [authUser.id]

    if (unreadOnly === 'true') {
      query += ' AND is_read = 0'
    }

    query += ' ORDER BY created_at DESC LIMIT ?'
    params.push(parseInt(limit as string, 10))

    const notifications = db.prepare(query).all(...params) as any[]
    res.json(notifications.map(serializeNotification))
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/read-all', authenticateToken, (req, res) => {
  try {
    const authUser = (req as AuthRequest).user!
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(authUser.id)
    res.json({ success: true })
  } catch (error) {
    console.error('Read all notifications error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/:id/read', authenticateToken, (req, res) => {
  try {
    const authUser = (req as AuthRequest).user!
    const notificationId = parseInt(req.params.id, 10)

    const notification = db
      .prepare('SELECT id FROM notifications WHERE id = ? AND user_id = ?')
      .get(notificationId, authUser.id) as { id: number } | undefined

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(notificationId)
    res.json({ success: true })
  } catch (error) {
    console.error('Read notification error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const authUser = (req as AuthRequest).user!
    const notificationId = parseInt(req.params.id, 10)

    const notification = db
      .prepare('SELECT id FROM notifications WHERE id = ? AND user_id = ?')
      .get(notificationId, authUser.id) as { id: number } | undefined

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }

    db.prepare('DELETE FROM notifications WHERE id = ?').run(notificationId)
    res.json({ success: true })
  } catch (error) {
    console.error('Delete notification error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/delete-multiple', authenticateToken, (req, res) => {
  try {
    const authUser = (req as AuthRequest).user!
    const { ids } = req.body

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid notification IDs' })
    }

    const placeholders = ids.map(() => '?').join(',')
    const query = `DELETE FROM notifications WHERE id IN (${placeholders}) AND user_id = ?`
    const params = [...ids.map((id: any) => parseInt(id, 10)), authUser.id]

    db.prepare(query).run(...params)
    res.json({ success: true, deleted: ids.length })
  } catch (error) {
    console.error('Delete multiple notifications error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router

