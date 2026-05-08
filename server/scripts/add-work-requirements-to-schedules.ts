import db from '../src/database/db.js'

const addWorkRequirementsColumn = () => {
  console.log('🔧 Adding work_requirements column to technician_schedules table...')
  
  try {
    // Check if column already exists by trying to add it
    try {
      db.prepare('ALTER TABLE technician_schedules ADD COLUMN work_requirements TEXT').run()
      console.log('  ✓ Added work_requirements column')
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('  ℹ️ work_requirements column already exists')
      } else {
        throw error
      }
    }

    console.log('✅ Work requirements column setup completed!')
  } catch (error: any) {
    console.error('❌ Error adding column:', error.message)
    process.exit(1)
  } finally {
    db.close()
  }
}

addWorkRequirementsColumn()

