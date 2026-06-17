import bcrypt from 'bcryptjs'
import db from '../src/database/db.js'

const email = process.argv[2] || 'admin@demo.local'
const password = process.argv[3] || 'admin123'

const hash = await bcrypt.hash(password, 10)
const result = db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hash, email)

if (result.changes === 0) {
  console.error(`❌ No user found: ${email}`)
  process.exit(1)
}

console.log(`✅ Password reset for ${email}`)
console.log(`   Email:    ${email}`)
console.log(`   Password: ${password}`)

db.close()
