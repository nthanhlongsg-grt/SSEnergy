import bcrypt from 'bcryptjs'
import db from '../src/database/db.js'

const addDeveloperAccount = async () => {
  try {
    console.log('🔧 Adding developer account...')
    
    // Canonical email matches production DB (growattvietnam.com). Legacy .vn kept for lookup only.
    const email = 'developer@growattvietnam.com'
    const legacyEmail = 'developer@growatt.vn'
    const password = 'Growatt2025'
    const name = 'developer'
    const role = 'dev'
    
    // Exact name match avoids picking "Developer" (capital D) when collations are case-insensitive
    const existingUser = db
      .prepare('SELECT id FROM users WHERE email IN (?, ?) OR name = ?')
      .get(email, legacyEmail, name) as { id: number } | undefined
    
    if (existingUser) {
      // Update existing developer account
      const hashedPassword = await bcrypt.hash(password, 10)
      db.prepare(`
        UPDATE users 
        SET password = ?, role = ?, status = 'active'
        WHERE id = ?
      `).run(hashedPassword, role, existingUser.id)
      const row = db.prepare('SELECT email FROM users WHERE id = ?').get(existingUser.id) as { email: string }
      console.log(`  ↻ Updated developer account: ${row.email}`)
      console.log(`     Password: ${password}`)
    } else {
      // Insert new developer account
      const hashedPassword = await bcrypt.hash(password, 10)
      const result = db.prepare(`
        INSERT INTO users (name, email, password, code, role, organization, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        name,
        email,
        hashedPassword,
        'DEV001',
        role,
        'Growatt Development',
        'active'
      )
      console.log(`  ✓ Created developer account: ${email}`)
      console.log(`     Name: ${name}`)
      console.log(`     Password: ${password}`)
      console.log(`     Role: ${role}`)
    }
    
    console.log('✅ Developer account setup completed!')
    db.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error adding developer account:', error)
    db.close()
    process.exit(1)
  }
}

addDeveloperAccount()

