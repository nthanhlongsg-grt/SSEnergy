/**
 * Add user_id column to inverters table
 * For linking inverters directly to users (end_user, distributor)
 */

import db from '../src/database/db.js'

console.log('🔧 Adding user_id column to inverters table...\n')

try {
  // Check if column already exists
  const tableInfo = db.prepare('PRAGMA table_info(inverters)').all() as Array<{ name: string }>
  const hasUserId = tableInfo.some(col => col.name === 'user_id')

  if (hasUserId) {
    console.log('✅ Column user_id already exists in inverters table')
  } else {
    // Add user_id column
    db.prepare('ALTER TABLE inverters ADD COLUMN user_id INTEGER').run()
    console.log('✅ Added user_id column to inverters table')

    // Add foreign key index
    db.prepare('CREATE INDEX IF NOT EXISTS idx_inverters_user_id ON inverters(user_id)').run()
    console.log('✅ Added index on inverters.user_id')

    // Add unique constraint index for one-user-per-inverter
    db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_inverters_user_id_unique ON inverters(user_id, serial_number)').run()
    console.log('✅ Added unique index on inverters(user_id, serial_number)')

    // Link existing inverters to users based on customer/distributor relationships
    console.log('\n📋 Linking existing inverters to users...')
    
    // Link inverters to end users via customer_id -> user_id
    const linkedViaCustomers = db.prepare(`
      UPDATE inverters
      SET user_id = (
        SELECT c.user_id 
        FROM customers c 
        WHERE c.id = inverters.customer_id 
          AND c.user_id IS NOT NULL
      )
      WHERE customer_id IS NOT NULL
        AND user_id IS NULL
        AND EXISTS (
          SELECT 1 FROM customers c 
          WHERE c.id = inverters.customer_id 
            AND c.user_id IS NOT NULL
        )
    `).run()
    console.log(`   ✓ Linked ${linkedViaCustomers.changes} inverters via customer records`)

    // Link inverters to distributors via distributor_id
    const linkedViaDistributors = db.prepare(`
      UPDATE inverters
      SET user_id = distributor_id
      WHERE distributor_id IS NOT NULL
        AND user_id IS NULL
    `).run()
    console.log(`   ✓ Linked ${linkedViaDistributors.changes} inverters via distributor_id`)

    // Summary
    const totalLinked = linkedViaCustomers.changes + linkedViaDistributors.changes
    const totalInverters = (db.prepare('SELECT COUNT(*) as count FROM inverters').get() as any).count
    const unlinked = totalInverters - totalLinked

    console.log(`\n📊 Summary:`)
    console.log(`   Total inverters: ${totalInverters}`)
    console.log(`   Linked to users: ${totalLinked}`)
    console.log(`   Unlinked: ${unlinked}`)

    if (unlinked > 0) {
      console.log(`\n⚠️  ${unlinked} inverters are not linked to any user`)
      console.log(`   These may need manual linking or can be managed by admins`)
    }
  }

  console.log('\n✅ Migration completed successfully!')
  process.exit(0)
} catch (error) {
  console.error('❌ Migration failed:', error)
  process.exit(1)
}
