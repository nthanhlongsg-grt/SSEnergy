import bcrypt from 'bcryptjs'
import db from '../src/database/db.js'
import { requireSeedPassword } from '../src/utils/seedPassword.js'

const addDeveloperAccount = async () => {
  try {
    const password = requireSeedPassword()
    const email = process.env.DEV_SEED_EMAIL || 'developer@local.dev'
    const legacyEmail = 'developer@legacy.local'
    const name = 'developer'
    const role = 'dev'

    console.log('🔧 Adding developer account...')

    const existingUser = db
      .prepare('SELECT id FROM users WHERE email IN (?, ?) OR name = ?')
      .get(email, legacyEmail, name) as { id: number } | undefined

    const hashedPassword = await bcrypt.hash(password, 10)

    if (existingUser) {
      db.prepare(`
        UPDATE users
        SET password = ?, role = ?, status = 'active'
        WHERE id = ?
      `).run(hashedPassword, role, existingUser.id)
      const row = db.prepare('SELECT email FROM users WHERE id = ?').get(existingUser.id) as { email: string }
      console.log(`  ↻ Updated developer account: ${row.email}`)
    } else {
      db.prepare(`
        INSERT INTO users (name, email, password, code, role, organization, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(name, email, hashedPassword, 'DEV001', role, 'SGE Development', 'active')
      console.log(`  ✓ Created developer account: ${email}`)
    }

    console.log('✅ Developer account setup completed (password from DEV_SEED_PASSWORD).')
    db.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error adding developer account:', error)
    db.close()
    process.exit(1)
  }
}

addDeveloperAccount()
