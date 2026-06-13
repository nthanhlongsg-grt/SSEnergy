import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import customerRoutes from './routes/customers.js'
import inverterRoutes from './routes/inverters.js'
import ticketRoutes from './routes/tickets.js'
import serviceReportRoutes from './routes/service-reports.js'
import warehouseRoutes from './routes/warehouse.js'
import scheduleRoutes from './routes/schedules.js'
import dashboardRoutes from './routes/dashboard.js'
import modelRoutes from './routes/models.js'
import technicianRoutes from './routes/technicians.js'
import notificationRoutes from './routes/notifications.js'
import syncRoutes from './routes/sync.js'
import distributorRoutes from './routes/distributors.js'
import reportRoutes from './routes/reports.js'
import slaSettingsRoutes from './routes/sla-settings.js'
import autoAssignSettingsRoutes from './routes/auto-assign-settings.js'
import contractRoutes from './routes/contracts.js'
import quotationRoutes from './routes/quotation.js'
import paymentRequestRoutes from './routes/payment-requests.js'
import { formatTimestampsInResponse } from './utils/dateTime.js'
import { maskSystemData } from './utils/systemUser.js'
import './database/db.js' // Initialize database
import { initCountColumns, syncAllUsersCounts } from './database/syncCounts.js'
import db from './database/db.js'

// Load .env file (must be before reading process.env values below)
dotenv.config()

// Ensure TZ is set correctly for date formatting throughout the app.
// On Linux, set TZ=Asia/Ho_Chi_Minh in your environment or .env file
// so it takes effect before Node.js starts. This line acts as a fallback.
if (!process.env.TZ) {
  process.env.TZ = 'Asia/Ho_Chi_Minh'
}

const app = express()
const PORT = parseInt(process.env.PORT || '3000', 10)
const NODE_ENV = process.env.NODE_ENV || 'development'
const IS_PRODUCTION = NODE_ENV === 'production'
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173'
const explicitCorsOrigins = CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const PRODUCTION_ORIGIN_PATTERNS = [
  /^https:\/\/([a-z0-9-]+\.)*sgesolartech\.vn$/,
]

if (IS_PRODUCTION) {
  app.set('trust proxy', 1)
}

// Middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})

// Allow CORS from localhost, LAN, and configured production origins
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true)

    const allowedOrigins: Array<string | RegExp> = [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      /^http:\/\/192\.168\.\d+\.\d+:5173$/,
      /^http:\/\/10\.\d+\.\d+\.\d+:5173$/,
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:5173$/,
      ...explicitCorsOrigins,
      ...PRODUCTION_ORIGIN_PATTERNS,
    ]

    const isAllowed = allowedOrigins.some((allowed) => {
      if (typeof allowed === 'string') {
        return origin === allowed
      }
      return allowed.test(origin)
    })

    if (isAllowed) {
      callback(null, true)
    } else if (!IS_PRODUCTION) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
}))
// Increase body size limit for file uploads (50MB for base64 encoded files)
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Middleware to format timestamps in responses to Vietnam timezone
app.use((req, res, next) => {
  const originalJson = res.json.bind(res)
  res.json = function(data: any) {
    // Only format if data exists and is not an error-only response
    if (data && (typeof data === 'object' || Array.isArray(data))) {
      const formattedData = formatTimestampsInResponse(data)
      const sanitizedData = maskSystemData(formattedData)
      return originalJson(sanitizedData)
    }
    return originalJson(data)
  }
  next()
})

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SGE API is running' })
})
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'SGE API is running' })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/inverters', inverterRoutes)
app.use('/api/tickets', ticketRoutes)
app.use('/api/service-reports', serviceReportRoutes)
app.use('/api/warehouse', warehouseRoutes)
app.use('/api/schedules', scheduleRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/models', modelRoutes)
app.use('/api/technicians', technicianRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/sync', syncRoutes)
app.use('/api/distributors', distributorRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/sla-settings', slaSettingsRoutes)
app.use('/api/auto-assign-settings', autoAssignSettingsRoutes)
app.use('/api/contracts', contractRoutes)
app.use('/api/quotation', quotationRoutes)
app.use('/api/payment-requests', paymentRequestRoutes)

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Initialize count columns and sync counts before starting server
initCountColumns()

const server = app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server is running (${NODE_ENV}) on port ${PORT}`)
  if (!IS_PRODUCTION) {
    console.log(`🌐 LAN: http://<your-ip>:${PORT}`)
  }
  console.log(`📡 CORS: ${CORS_ORIGIN}`)
  console.log(`⏰ Timezone: ${process.env.TZ}`)

  // Sync all user counts on server start
  try {
    console.log('🔄 Syncing ticket and task counts...')
    const synced = syncAllUsersCounts()
    console.log(`✅ Synced counts for ${synced} users`)
  } catch (error) {
    console.error('⚠️  Error syncing counts on startup:', error)
  }
})

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
// Required on Linux (cPanel / PM2) so SQLite WAL is flushed and connections
// are closed cleanly when the process receives SIGTERM or SIGINT.
function gracefulShutdown(signal: string) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`)
  server.close(() => {
    try {
      db.close()
      console.log('✅ Database connection closed.')
    } catch (err) {
      console.error('⚠️  Error closing database:', err)
    }
    console.log('👋 Server stopped.')
    process.exit(0)
  })

  // Force exit after 10 seconds if server hasn't closed
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout.')
    process.exit(1)
  }, 10_000).unref()
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT',  () => gracefulShutdown('SIGINT'))

// Log uncaught errors instead of crashing silently
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err)
})
process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason)
})
