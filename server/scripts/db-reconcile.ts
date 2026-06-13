/**
 * Đối soát dữ liệu — chạy sau deploy hoặc khi nghi ngờ lệch dữ liệu.
 * npm run db:reconcile
 */
import db from '../src/database/db.js'
import { applySchemaSync } from '../src/database/schemaSync.js'
import { reconcileDataIntegrity, detectIntegrityIssues } from '../src/database/dataIntegrity.js'

console.log('🔄 Database reconcile\n')

applySchemaSync(db)

const report = reconcileDataIntegrity(db)

console.log('✅ Reconcile results:')
console.log(`   • Inverters linked from contracts: ${report.invertersLinkedFromContracts}`)
console.log(`   • Inverter user_id synced: ${report.invertersUserIdSynced}`)
console.log(`   • Inverter user_id cleared (orphan): ${report.invertersUserIdCleared}`)
console.log(`   • Ticket snapshots backfilled: ${report.ticketSnapshotsBackfilled}`)

const remaining = detectIntegrityIssues(db)
if (remaining.length === 0) {
  console.log('\n✅ No remaining integrity warnings')
} else {
  console.log('\n⚠️  Remaining issues (manual review):')
  for (const issue of remaining) {
    console.log(`   • ${issue}`)
  }
}

db.close()
console.log('\n✅ Done')
