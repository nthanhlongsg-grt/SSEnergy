import bcrypt from 'bcryptjs'
import db from '../src/database/db.js'

const addDistributorAccount = async () => {
  try {
    console.log('🔧 Adding distributor and end user accounts...')
    
    const accounts = [
      {
        name: 'demo2',
        email: 'demo2@gmail.com',
        password: 'demo123',
        role: 'distributor',
        code: 'DIST001',
        organization: 'Demo Distributor',
        phone: '0900000001',
        status: 'active',
      },
      {
        name: 'End User Demo',
        email: 'enduser@demo.com',
        password: 'demo123',
        role: 'end_user',
        code: 'EU001',
        organization: 'Demo End User',
        phone: '0900000002',
        status: 'active',
        parent_distributor_id: null, // Will be set after distributor is created
      },
    ]
    
    for (const account of accounts) {
      // Check if account already exists
      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(account.email) as { id: number } | undefined
      
      if (existingUser) {
        // Update existing account
        const hashedPassword = await bcrypt.hash(account.password, 10)
        const updateData: any[] = [
          hashedPassword,
          account.role,
          'active',
          account.name,
          account.code,
          account.organization,
          account.phone,
          account.email,
        ]
        
        db.prepare(`
          UPDATE users 
          SET password = ?, role = ?, status = ?, name = ?, code = ?, organization = ?, phone = ?
          WHERE email = ?
        `).run(...updateData)
        
        console.log(`  ↻ Updated account: ${account.email} (${account.name})`)
        console.log(`     Password: ${account.password}`)
      } else {
        // Insert new account
        const hashedPassword = await bcrypt.hash(account.password, 10)
        const insertData: any[] = [
          account.name,
          account.email,
          hashedPassword,
          account.code,
          account.role,
          account.organization,
          'active',
          account.phone,
        ]
        
        // Add parent_distributor_id if it's an end_user and distributor exists
        if (account.role === 'end_user' && account.parent_distributor_id) {
          const distributor = db.prepare('SELECT id FROM users WHERE role = ? AND email = ?').get('distributor', 'demo2@gmail.com') as { id: number } | undefined
          if (distributor) {
            insertData.push(distributor.id)
            db.prepare(`
              INSERT INTO users (name, email, password, code, role, organization, status, phone, parent_distributor_id)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run(...insertData)
          } else {
            db.prepare(`
              INSERT INTO users (name, email, password, code, role, organization, status, phone)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(...insertData.slice(0, -1))
          }
        } else {
          db.prepare(`
            INSERT INTO users (name, email, password, code, role, organization, status, phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `).run(...insertData)
        }
        
        console.log(`  ✓ Created account: ${account.email} (${account.name})`)
        console.log(`     Password: ${account.password}`)
        console.log(`     Role: ${account.role}`)
      }
    }
    
    // Link end user to distributor if both exist
    const distributor = db.prepare('SELECT id FROM users WHERE role = ? AND email = ?').get('distributor', 'demo2@gmail.com') as { id: number } | undefined
    const endUser = db.prepare('SELECT id FROM users WHERE role = ? AND email = ?').get('end_user', 'enduser@demo.com') as { id: number } | undefined
    
    if (distributor && endUser) {
      db.prepare('UPDATE users SET parent_distributor_id = ? WHERE id = ?').run(distributor.id, endUser.id)
      console.log(`  ✓ Linked end user to distributor`)
    }
    
    console.log('\n✅ Account setup completed!')
    console.log('\n📝 Login credentials:')
    accounts.forEach((account) => {
      console.log(`   - ${account.email} / ${account.password} (${account.role})`)
    })
    
    db.close()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error adding accounts:', error)
    db.close()
    process.exit(1)
  }
}

addDistributorAccount()




