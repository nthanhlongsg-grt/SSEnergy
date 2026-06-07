/**
 * Seed Models Data
 * Thêm các model thiết bị inverter mặc định
 */

import db from '../src/database/db.js'

console.log('🌱 Seeding models data...\n')

const models = [
  // On-Grid Inverters
  { name: 'MIN 2500TL-X', manufacturer: 'SGE', type: 'On-Grid', description: 'Single Phase On-Grid Inverter 2.5kW' },
  { name: 'MIN 3000TL-X', manufacturer: 'SGE', type: 'On-Grid', description: 'Single Phase On-Grid Inverter 3kW' },
  { name: 'MIN 3600TL-X', manufacturer: 'SGE', type: 'On-Grid', description: 'Single Phase On-Grid Inverter 3.6kW' },
  { name: 'MIN 4200TL-X', manufacturer: 'SGE', type: 'On-Grid', description: 'Single Phase On-Grid Inverter 4.2kW' },
  { name: 'MIN 5000TL-X', manufacturer: 'SGE', type: 'On-Grid', description: 'Single Phase On-Grid Inverter 5kW' },
  { name: 'MIN 6000TL-X', manufacturer: 'SGE', type: 'On-Grid', description: 'Single Phase On-Grid Inverter 6kW' },
  { name: 'MID 15KTL3-X', manufacturer: 'SGE', type: 'On-Grid', description: 'Three Phase On-Grid Inverter 15kW' },
  { name: 'MID 20KTL3-X', manufacturer: 'SGE', type: 'On-Grid', description: 'Three Phase On-Grid Inverter 20kW' },
  { name: 'MID 25KTL3-X', manufacturer: 'SGE', type: 'On-Grid', description: 'Three Phase On-Grid Inverter 25kW' },
  { name: 'MID 30KTL3-X', manufacturer: 'SGE', type: 'On-Grid', description: 'Three Phase On-Grid Inverter 30kW' },
  
  // Hybrid Inverters
  { name: 'SPH 3000', manufacturer: 'SGE', type: 'Hybrid', description: 'Hybrid Inverter 3kW with Battery Storage' },
  { name: 'SPH 4000', manufacturer: 'SGE', type: 'Hybrid', description: 'Hybrid Inverter 4kW with Battery Storage' },
  { name: 'SPH 5000', manufacturer: 'SGE', type: 'Hybrid', description: 'Hybrid Inverter 5kW with Battery Storage' },
  { name: 'SPH 6000', manufacturer: 'SGE', type: 'Hybrid', description: 'Hybrid Inverter 6kW with Battery Storage' },
  { name: 'SPH 8000', manufacturer: 'SGE', type: 'Hybrid', description: 'Hybrid Inverter 8kW with Battery Storage' },
  { name: 'SPH 10000', manufacturer: 'SGE', type: 'Hybrid', description: 'Hybrid Inverter 10kW with Battery Storage' },
  
  // Off-Grid Inverters
  { name: 'SPF 3000T', manufacturer: 'SGE', type: 'Off-Grid', description: 'Off-Grid Inverter 3kW' },
  { name: 'SPF 5000T', manufacturer: 'SGE', type: 'Off-Grid', description: 'Off-Grid Inverter 5kW' },
  
  // Other Manufacturers (examples)
  { name: 'SUN2000-3KTL-L1', manufacturer: 'Huawei', type: 'On-Grid', description: 'Huawei Smart String Inverter 3kW' },
  { name: 'SUN2000-5KTL-L1', manufacturer: 'Huawei', type: 'On-Grid', description: 'Huawei Smart String Inverter 5kW' },
]

try {
  let inserted = 0
  let skipped = 0

  for (const model of models) {
    try {
      // Check if model already exists
      const existing = db.prepare('SELECT id FROM models WHERE name = ?').get(model.name) as { id: number } | undefined

      if (existing) {
        console.log(`  ⏭️  Model already exists: ${model.name}`)
        skipped++
        continue
      }

      // Insert model
      db.prepare(`
        INSERT INTO models (name, manufacturer, type, description, status)
        VALUES (?, ?, ?, ?, 'active')
      `).run(
        model.name,
        model.manufacturer,
        model.type,
        model.description
      )

      console.log(`  ✓ Inserted model: ${model.name} (${model.manufacturer})`)
      inserted++
    } catch (error: any) {
      console.error(`  ✗ Error inserting model ${model.name}:`, error.message)
    }
  }

  console.log(`\n✅ Seeded models successfully!`)
  console.log(`   Inserted: ${inserted}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Total: ${inserted + skipped}`)

  process.exit(0)
} catch (error) {
  console.error('❌ Error seeding models:', error)
  process.exit(1)
}

