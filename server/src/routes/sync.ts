/**
 * API endpoints for syncing ticket and task counts
 */
import { Router } from 'express'
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth.js'
import { UserRole } from '../types/index.js'
import { syncAllUsersCounts, syncUserCounts, syncUserActiveTickets, syncUserTodayTasks } from '../database/syncCounts.js'

const router = Router()

// Sync counts for all users (Admin/Dev only)
router.post('/all', authenticateToken, requireRole(UserRole.ADMIN, UserRole.DEV), (req, res) => {
  try {
    const synced = syncAllUsersCounts()
    res.json({
      message: 'Successfully synced counts for all users',
      synced
    })
  } catch (error) {
    console.error('Sync all counts error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Sync counts for a specific user
router.post('/user/:userId', authenticateToken, requireRole(UserRole.ADMIN, UserRole.DEV), (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const counts = syncUserCounts(userId)
    res.json({
      message: 'Successfully synced counts for user',
      userId,
      counts
    })
  } catch (error) {
    console.error('Sync user counts error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Sync active tickets for a specific user
router.post('/user/:userId/tickets', authenticateToken, requireRole(UserRole.ADMIN, UserRole.DEV), (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const count = syncUserActiveTickets(userId)
    res.json({
      message: 'Successfully synced active tickets count',
      userId,
      count
    })
  } catch (error) {
    console.error('Sync user tickets error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Sync today's tasks for a specific user
router.post('/user/:userId/tasks', authenticateToken, requireRole(UserRole.ADMIN, UserRole.DEV), (req, res) => {
  try {
    const userId = parseInt(req.params.userId)
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' })
    }

    const count = syncUserTodayTasks(userId)
    res.json({
      message: 'Successfully synced today tasks count',
      userId,
      count
    })
  } catch (error) {
    console.error('Sync user tasks error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router



