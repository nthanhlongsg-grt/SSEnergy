import db from '../src/database/db.js'

const addImagesColumns = () => {
  console.log('🔧 Adding before_images and after_images columns to service_reports table...')
  
  try {
    // Check if columns already exist by trying to add them
    try {
      db.prepare('ALTER TABLE service_reports ADD COLUMN before_images TEXT').run()
      console.log('  ✓ Added before_images column')
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('  ℹ️ before_images column already exists')
      } else {
        throw error
      }
    }

    try {
      db.prepare('ALTER TABLE service_reports ADD COLUMN after_images TEXT').run()
      console.log('  ✓ Added after_images column')
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('  ℹ️ after_images column already exists')
      } else {
        throw error
      }
    }

    // Also ensure replacement_parts field exists (parts_used already exists)
    try {
      db.prepare('ALTER TABLE service_reports ADD COLUMN replacement_parts TEXT').run()
      console.log('  ✓ Added replacement_parts column')
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('  ℹ️ replacement_parts column already exists')
      } else {
        throw error
      }
    }

    console.log('✅ Service reports images columns setup completed!')
  } catch (error: any) {
    console.error('❌ Error adding columns:', error.message)
    process.exit(1)
  } finally {
    db.close()
  }
}

addImagesColumns()

