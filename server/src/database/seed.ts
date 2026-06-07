import bcrypt from 'bcryptjs'
import db from './db.js'
import { requireSeedPassword } from '../utils/seedPassword.js'

// Minimal seed — developer account email only; password from DEV_SEED_PASSWORD env.
const DEV_EMAIL = process.env.DEV_SEED_EMAIL || 'developer@local.dev'

const seedUsers = async () => {
  const plainPassword = requireSeedPassword()
  console.log('🌱 Seeding developer user...')

  const hashedPassword = await bcrypt.hash(plainPassword, 10)
  const user = {
    name: 'Developer',
    email: DEV_EMAIL,
    password: hashedPassword,
    code: 'DEV001',
    role: 'dev',
    organization: 'SGE',
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

  console.log('✅ Seed completed (password was read from DEV_SEED_PASSWORD, not stored in repo).')
}

const seedDatabase = async () => {
  try {
    await seedUsers()
    db.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    db.close()
    process.exit(1)
  }
}

seedDatabase()
