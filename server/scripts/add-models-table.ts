import db from '../src/database/db.js'

const addModelsTable = () => {
  try {
    console.log('🔧 Creating models table...')
    
    // Check if table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='models'
    `).get() as { name: string } | undefined

    if (!tableExists) {
      // Create models table
      db.exec(`
        CREATE TABLE IF NOT EXISTS models (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          manufacturer TEXT,
          type TEXT,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_models_name ON models(name);
        CREATE INDEX IF NOT EXISTS idx_models_status ON models(status);
      `)

      // Insert default models
      const defaultModels = [
        { name: 'MAX 10KTL3-X', manufacturer: 'Growatt', type: 'Hòa lưới' },
        { name: 'MAX 15KTL3-X', manufacturer: 'Growatt', type: 'Hòa lưới' },
        { name: 'MAX 20KTL3-X', manufacturer: 'Growatt', type: 'Hòa lưới' },
        { name: 'MID 15KTL3-X', manufacturer: 'Growatt', type: 'Hòa lưới' },
        { name: 'SPH 6000', manufacturer: 'Growatt', type: 'Hybrid' },
        { name: 'SPH 8000', manufacturer: 'Growatt', type: 'Hybrid' },
        { name: 'MIN 3000TL-XE', manufacturer: 'Growatt', type: 'Hòa lưới' },
        { name: 'MIN 5000TL-XE', manufacturer: 'Growatt', type: 'Hòa lưới' },
      ]

      const stmt = db.prepare(`
        INSERT INTO models (name, manufacturer, type)
        VALUES (?, ?, ?)
      `)

      for (const model of defaultModels) {
        try {
          stmt.run(model.name, model.manufacturer, model.type)
          console.log(`  ✓ Inserted model: ${model.name}`)
        } catch (err) {
          // Skip if already exists
          console.log(`  ↻ Model already exists: ${model.name}`)
        }
      }

      console.log('✅ Models table created successfully!')
    } else {
      console.log('ℹ️  Models table already exists')
    }

    db.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error creating models table:', error)
    db.close()
    process.exit(1)
  }
}

addModelsTable()

