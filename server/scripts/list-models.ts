import db from '../src/database/db.js'

console.log('📋 Danh sách tất cả Models trong database:\n')

const models = db.prepare('SELECT * FROM models ORDER BY type, name').all() as any[]

console.log(`Tổng số models: ${models.length}\n`)

// Group by type
const groupedByType = models.reduce((acc: any, model: any) => {
  if (!acc[model.type]) {
    acc[model.type] = []
  }
  acc[model.type].push(model)
  return acc
}, {})

Object.keys(groupedByType).sort().forEach((type: string) => {
  console.log(`\n=== ${type} Inverters (${groupedByType[type].length}) ===\n`)
  
  groupedByType[type].forEach((model: any, index: number) => {
    console.log(`${index + 1}. ${model.name}`)
    console.log(`   ID: ${model.id}`)
    console.log(`   Manufacturer: ${model.manufacturer}`)
    console.log(`   Description: ${model.description}`)
    console.log(`   Status: ${model.status}`)
    console.log(`   Created: ${model.created_at}`)
    console.log('')
  })
})

// Summary
console.log('\n=== SUMMARY ===')
Object.keys(groupedByType).sort().forEach((type: string) => {
  console.log(`${type}: ${groupedByType[type].length} models`)
})
console.log(`\nTotal: ${models.length} models`)




