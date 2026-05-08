import db from '../src/database/db.js'

/**
 * Script to retrieve admin account from database
 */

console.log('🔍 Retrieving admin account from database...\n')

try {
  // Get admin user
  const admin = db.prepare(`
    SELECT 
      id,
      name,
      email,
      code,
      role,
      organization,
      phone,
      status,
      address,
      created_at,
      updated_at
    FROM users 
    WHERE role = 'admin' 
    LIMIT 1
  `).get() as {
    id: number
    name: string
    email: string
    code: string | null
    role: string
    organization: string | null
    phone: string | null
    status: string
    address: string | null
    created_at: string
    updated_at: string
  } | undefined

  if (!admin) {
    console.log('❌ No admin account found in database')
    console.log('\n💡 You can create an admin account by running:')
    console.log('   npm run db:seed:users')
  } else {
    console.log('✅ Admin account found:\n')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`ID:              ${admin.id}`)
    console.log(`Name:            ${admin.name}`)
    console.log(`Email:           ${admin.email}`)
    console.log(`Code:            ${admin.code || 'N/A'}`)
    console.log(`Role:            ${admin.role}`)
    console.log(`Organization:    ${admin.organization || 'N/A'}`)
    console.log(`Phone:           ${admin.phone || 'N/A'}`)
    console.log(`Status:          ${admin.status}`)
    console.log(`Address:         ${admin.address || 'N/A'}`)
    console.log(`Created:         ${admin.created_at}`)
    console.log(`Updated:         ${admin.updated_at}`)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('\n📝 Login credentials:')
    console.log(`   Email:    ${admin.email}`)
    console.log(`   Password: admin123 (default)`)
    console.log('\n⚠️  Note: Password is hashed in database for security')
  }

  // Get all admin users (in case there are multiple)
  const allAdmins = db.prepare(`
    SELECT id, name, email, code, status 
    FROM users 
    WHERE role = 'admin'
  `).all() as Array<{
    id: number
    name: string
    email: string
    code: string | null
    status: string
  }>

  if (allAdmins.length > 1) {
    console.log(`\n📋 Found ${allAdmins.length} admin accounts:\n`)
    allAdmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email}) - ${admin.status}`)
    })
  }

  db.close()
  process.exit(0)
} catch (error: any) {
  console.error('❌ Error retrieving admin account:', error.message)
  db.close()
  process.exit(1)
}


