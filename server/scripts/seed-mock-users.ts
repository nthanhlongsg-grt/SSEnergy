import bcrypt from 'bcryptjs'
import db from '../src/database/db.js'
import { requireSeedPassword } from '../src/utils/seedPassword.js'

const DEV_EMAIL = process.env.DEV_SEED_EMAIL || 'developer@local.dev'

async function seedMockUsers() {
  const plainPassword = requireSeedPassword()
  console.log('🌱 Seeding developer user into database...')

  try {
    const user = {
      name: 'SSE Developer',
      email: DEV_EMAIL,
      password: await bcrypt.hash(plainPassword, 10),
      code: 'DEV001',
      role: 'dev',
      organization: 'SS ENERGY',
      phone: '0900000000',
    }

    const insertStmt = db.prepare(`
      INSERT INTO users (name, email, password, code, role, organization, status, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const updateStmt = db.prepare(`
      UPDATE users
      SET name = ?, password = ?, code = ?, role = ?, organization = ?, status = ?, phone = ?
      WHERE email = ?
    `)

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(user.email) as { id: number } | undefined

    if (existing) {
      updateStmt.run(user.name, user.password, user.code, user.role, user.organization, 'active', user.phone, user.email)
      console.log(`  ↻ Updated user: ${user.email}`)
    } else {
      insertStmt.run(user.name, user.email, user.password, user.code, user.role, user.organization, 'active', user.phone)
      console.log(`  ✓ Inserted user: ${user.email}`)
    }

    console.log('\n✅ Done. Password was read from DEV_SEED_PASSWORD (not printed).')
    db.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding mock users:', error)
    db.close()
    process.exit(1)
  }
}

seedMockUsers()
