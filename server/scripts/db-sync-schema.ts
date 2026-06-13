/**
 * Sync local/production SQLite schema with current application code.
 * Run: npm run db:sync
 */
import db from '../src/database/db.js'
import { applySchemaSync } from '../src/database/schemaSync.js'
import { syncAllUsersCounts } from '../src/database/syncCounts.js'

console.log('🔄 Syncing database schema with application code...\n')

const applied = applySchemaSync(db)

if (applied.length === 0) {
  console.log('✅ Schema already up to date — no new columns added')
} else {
  console.log(`✅ Added ${applied.length} column(s):`)
  for (const col of applied) {
    console.log(`   • ${col}`)
  }
}

try {
  const synced = syncAllUsersCounts()
  console.log(`✅ Synced cached counts for ${synced} user(s)`)
} catch (err) {
  console.warn('⚠️  Could not sync user counts:', err)
}

db.close()
console.log('\n✅ Database sync completed')
