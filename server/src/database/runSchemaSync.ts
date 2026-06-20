/**
 * Production schema sync — runs from compiled dist without tsx/source.
 * Usage: DATABASE_PATH=./database/SSE.db node dist/database/runSchemaSync.js
 */
import db from './db.js'
import { syncAllUsersCounts } from './syncCounts.js'

console.log('🔄 Syncing database schema with application code...\n')

try {
  const synced = syncAllUsersCounts()
  console.log(`✅ Synced cached counts for ${synced} user(s)`)
} catch (err) {
  console.warn('⚠️  Could not sync user counts:', err)
}

db.close()
console.log('\n✅ Database sync completed')
