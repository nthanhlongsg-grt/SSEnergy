import bcrypt from 'bcryptjs'
import db from '../src/database/db.js'

const MOCK_USERS = [
  {
    name: 'SGE Developer',
    email: 'deverloper@SGEvietnam.com',
    password: 'Tl16081995*',
    code: 'DEV001',
    role: 'dev',
    organization: 'SGE Vietnam',
    phone: '0900000000',
  },
]

async function seedMockUsers() {
  console.log('🌱 Seeding mock users into database...')
  
  try {
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
        // Update existing user (preserve password hash if same)
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
        console.log(`  ↻ Updated user: ${user.email} (${user.name})`)
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
        console.log(`  ✓ Inserted user: ${user.email} (${user.name})`)
      }
    }

    console.log(`\n✅ Successfully seeded mock users!`)
    console.log(`   - Inserted: ${insertedCount}`)
    console.log(`   - Updated: ${updatedCount}`)
    console.log(`\n📝 You can now login with these accounts:`)
    MOCK_USERS.forEach((user) => {
    console.log(`   - ${user.email} / ${user.password}`)
    })
    
    db.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding mock users:', error)
    db.close()
    process.exit(1)
  }
}

seedMockUsers()

