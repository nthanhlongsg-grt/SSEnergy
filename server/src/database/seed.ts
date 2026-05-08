import bcrypt from 'bcryptjs'
import db from './db.js'

// This is a minimal seed file for quick setup
// Use seed-full.ts for complete database seeding with all sample data

// Default developer account for initial access
const MOCK_USERS = [
  {
    name: 'Growatt Developer',
    email: 'deverloper@growattvietnam.com',
    password: 'Tl16081995*',
    code: 'DEV001',
    role: 'dev',
    organization: 'Growatt Vietnam',
    phone: '0900000000',
  },
]

const seedUsers = async () => {
  console.log('🌱 Seeding mock users...')
  
  // Hash all passwords first
  const usersWithHashedPasswords = await Promise.all(
    MOCK_USERS.map(async (user) => ({
      ...user,
      password: await bcrypt.hash(user.password, 10),
    }))
  )

  const insertStmt = db.prepare(`
    INSERT INTO users (name, email, password, code, role, organization, status, phone)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const updateStmt = db.prepare(`
    UPDATE users 
    SET name = ?, password = ?, code = ?, role = ?, organization = ?, status = ?, phone = ?
    WHERE email = ?
  `)

  const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?')

  let insertedCount = 0
  let updatedCount = 0

  for (const user of usersWithHashedPasswords) {
    const existing = checkStmt.get(user.email) as { id: number } | undefined

    if (existing) {
      // Update existing user
      updateStmt.run(
        user.name,
        user.password,
        user.code,
        user.role,
        user.organization,
        'active',
        user.phone,
        user.email
      )
      updatedCount++
      console.log(`  ↻ Updated user: ${user.email}`)
    } else {
      // Insert new user
      insertStmt.run(
        user.name,
        user.email,
        user.password,
        user.code,
        user.role,
        user.organization,
        'active',
        user.phone
      )
      insertedCount++
      console.log(`  ✓ Inserted user: ${user.email}`)
    }
  }

  console.log(`✅ Seeded users successfully! (Inserted: ${insertedCount}, Updated: ${updatedCount})`)
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
