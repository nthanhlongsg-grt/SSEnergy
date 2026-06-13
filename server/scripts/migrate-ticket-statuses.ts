/**
 * One-time migration: map legacy ticket statuses to the new workflow.
 * Run: npx tsx server/scripts/migrate-ticket-statuses.ts
 */
import Database from 'better-sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = path.join(__dirname, '../database.sqlite')

const db = new Database(dbPath)

const migrations: Array<{ from: string[]; to: string }> = [
  { from: ['initialized', 'pending'], to: 'new' },
  { from: ['assigned'], to: 'machine_received' },
  { from: ['waiting_parts'], to: 'waiting_delivery' },
  { from: ['completed'], to: 'closed' },
]

console.log('Migrating ticket statuses...')

for (const { from, to } of migrations) {
  for (const legacyStatus of from) {
    const result = db
      .prepare('UPDATE tickets SET status = ? WHERE status = ?')
      .run(to, legacyStatus)
    if (result.changes > 0) {
      console.log(`  ${legacyStatus} -> ${to}: ${result.changes} ticket(s)`)
    }
  }
}

console.log('Done.')

db.close()
