/**
 * Test Bulk Delete Models
 * Script để test tính năng xóa nhiều models
 */

import db from '../src/database/db.js'

console.log('🧪 Testing Bulk Delete Models...\n')

try {
  // 1. Create test models
  console.log('1️⃣ Creating test models...')
  const testModels = [
    { name: 'TEST-MODEL-1', manufacturer: 'Test', type: 'Test', description: 'Test model 1' },
    { name: 'TEST-MODEL-2', manufacturer: 'Test', type: 'Test', description: 'Test model 2' },
    { name: 'TEST-MODEL-3', manufacturer: 'Test', type: 'Test', description: 'Test model 3' },
  ]

  const insertedIds: number[] = []
  for (const model of testModels) {
    const result = db.prepare(`
      INSERT INTO models (name, manufacturer, type, description, status)
      VALUES (?, ?, ?, ?, 'active')
    `).run(model.name, model.manufacturer, model.type, model.description)
    
    insertedIds.push(result.lastInsertRowid as number)
    console.log(`   ✓ Created: ${model.name} (ID: ${result.lastInsertRowid})`)
  }

  // 2. Verify created models
  console.log('\n2️⃣ Verifying created models...')
  const placeholders = insertedIds.map(() => '?').join(',')
  const created = db.prepare(`SELECT * FROM models WHERE id IN (${placeholders})`).all(...insertedIds) as any[]
  console.log(`   ✓ Found ${created.length} test models`)
  console.log(`   Active models: ${created.filter((m: any) => m.status === 'active').length}`)

  // 3. Simulate bulk delete
  console.log('\n3️⃣ Simulating bulk delete...')
  const updateResult = db.prepare(`
    UPDATE models 
    SET status = 'inactive', updated_at = CURRENT_TIMESTAMP 
    WHERE id IN (${placeholders})
  `).run(...insertedIds)
  
  console.log(`   ✓ Updated ${updateResult.changes} models to inactive`)

  // 4. Verify deletion
  console.log('\n4️⃣ Verifying soft delete...')
  const after = db.prepare(`SELECT * FROM models WHERE id IN (${placeholders})`).all(...insertedIds) as any[]
  console.log(`   Total models: ${after.length}`)
  console.log(`   Active models: ${after.filter((m: any) => m.status === 'active').length}`)
  console.log(`   Inactive models: ${after.filter((m: any) => m.status === 'inactive').length}`)

  // 5. Cleanup - permanently delete test models
  console.log('\n5️⃣ Cleaning up test data...')
  const deleteResult = db.prepare(`DELETE FROM models WHERE id IN (${placeholders})`).run(...insertedIds)
  console.log(`   ✓ Deleted ${deleteResult.changes} test models`)

  console.log('\n✅ Bulk delete test completed successfully!')
  console.log('\n📝 Summary:')
  console.log(`   - Created: ${insertedIds.length} models`)
  console.log(`   - Soft deleted: ${updateResult.changes} models`)
  console.log(`   - Cleaned up: ${deleteResult.changes} models`)

  process.exit(0)
} catch (error) {
  console.error('❌ Test failed:', error)
  process.exit(1)
}




