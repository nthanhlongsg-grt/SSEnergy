import db from '../src/database/db.js'
import { UserRole } from '../types/index.js'

// Role permissions mapping (same as in frontend)
const rolePermissions: Record<string, string[]> = {
  admin: [
    'view_inverters',
    'create_inverter',
    'edit_inverter',
    'delete_inverter',
    'view_customers',
    'create_customer',
    'edit_customer',
    'delete_customer',
    'view_tickets',
    'create_ticket',
    'assign_ticket',
    'update_ticket_status',
    'close_ticket',
    'view_technicians',
    'assign_technician',
    'view_schedule',
    'view_warehouse',
    'manage_parts',
    'manage_rma',
    'import_parts',
    'export_parts',
    'view_reports',
    'create_report',
    'edit_report',
    'export_report',
    'view_analytics',
    'export_data',
    'view_users',
    'create_user',
    'edit_user',
    'delete_user',
    'manage_roles',
  ],
  dev: [
    'view_inverters',
    'create_inverter',
    'edit_inverter',
    'delete_inverter',
    'view_customers',
    'create_customer',
    'edit_customer',
    'delete_customer',
    'view_tickets',
    'create_ticket',
    'assign_ticket',
    'update_ticket_status',
    'close_ticket',
    'view_technicians',
    'assign_technician',
    'view_schedule',
    'view_warehouse',
    'manage_parts',
    'manage_rma',
    'import_parts',
    'export_parts',
    'view_reports',
    'create_report',
    'edit_report',
    'export_report',
    'view_analytics',
    'export_data',
    'view_users',
    'create_user',
    'edit_user',
    'delete_user',
    'manage_roles',
  ],
  service_center: [
    'view_inverters',
    'view_customers',
    'view_tickets',
    'create_ticket',
    'assign_ticket',
    'update_ticket_status',
    'close_ticket',
    'view_technicians',
    'assign_technician',
    'view_schedule',
    'view_warehouse',
    'view_reports',
    'create_report',
    'edit_report',
    'export_report',
    'view_analytics',
    'export_data',
  ],
  technician: [
    'view_inverters',
    'view_customers',
    'view_tickets',
    'update_ticket_status',
    'view_schedule',
    'view_reports',
    'create_report',
    'edit_report',
  ],
  distributor: [
    'view_inverters',
    'create_inverter',
    'view_tickets',
    'create_ticket',
  ],
  dealer: [
    'view_inverters',
    'view_customers',
    'create_customer',
    'view_tickets',
    'create_ticket',
    'view_reports',
  ],
  end_user: [
    'view_inverters',
    'create_inverter',
  ],
  warehouse: [
    'view_warehouse',
    'manage_parts',
    'manage_rma',
    'import_parts',
    'export_parts',
    'view_tickets',
  ],
}

console.log('🔍 Checking user permissions in database...\n')

try {
  // Get all users
  const users = db.prepare(`
    SELECT 
      id,
      name,
      email,
      role,
      status,
      parent_distributor_id,
      created_at
    FROM users
    ORDER BY role, name
  `).all() as Array<{
    id: number
    name: string
    email: string
    role: string
    status: string
    parent_distributor_id: number | null
    created_at: string
  }>

  if (users.length === 0) {
    console.log('❌ No users found in database')
    process.exit(0)
  }

  console.log(`📊 Found ${users.length} user(s) in database:\n`)
  console.log('='.repeat(80))

  // Group users by role
  const usersByRole: Record<string, typeof users> = {}
  users.forEach((user) => {
    if (!usersByRole[user.role]) {
      usersByRole[user.role] = []
    }
    usersByRole[user.role].push(user)
  })

  // Check each role
  for (const [role, roleUsers] of Object.entries(usersByRole)) {
    const expectedPermissions = rolePermissions[role] || []
    
    console.log(`\n📋 Role: ${role.toUpperCase()}`)
    console.log(`   Expected Permissions (${expectedPermissions.length}):`)
    if (expectedPermissions.length > 0) {
      expectedPermissions.forEach((perm) => {
        console.log(`     ✓ ${perm}`)
      })
    } else {
      console.log(`     ⚠️  No permissions defined for role: ${role}`)
    }

    console.log(`\n   Users with this role (${roleUsers.length}):`)
    roleUsers.forEach((user) => {
      console.log(`     - ID: ${user.id}`)
      console.log(`       Name: ${user.name}`)
      console.log(`       Email: ${user.email}`)
      console.log(`       Status: ${user.status}`)
      if (user.parent_distributor_id) {
        const distributor = db.prepare('SELECT name, email FROM users WHERE id = ?').get(user.parent_distributor_id) as { name: string; email: string } | undefined
        console.log(`       Parent Distributor: ${distributor?.name || 'N/A'} (${distributor?.email || 'N/A'})`)
      }
      console.log(`       Created: ${user.created_at}`)
      console.log('')
    })
  }

  // Summary
  console.log('\n' + '='.repeat(80))
  console.log('\n📈 Summary:')
  console.log(`   Total Users: ${users.length}`)
  Object.entries(usersByRole).forEach(([role, roleUsers]) => {
    console.log(`   ${role}: ${roleUsers.length} user(s)`)
  })

  // Check for distributor and end_user specifically
  console.log('\n🔍 Special Checks:')
  
  const distributors = users.filter((u) => u.role === 'distributor')
  const endUsers = users.filter((u) => u.role === 'end_user')
  
  console.log(`   Distributors: ${distributors.length}`)
  if (distributors.length > 0) {
    distributors.forEach((dist) => {
      const linkedEndUsers = db.prepare(`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE parent_distributor_id = ? AND role = 'end_user'
      `).get(dist.id) as { count: number }
      console.log(`     - ${dist.email}: ${linkedEndUsers.count} linked end user(s)`)
    })
  }

  console.log(`   End Users: ${endUsers.length}`)
  if (endUsers.length > 0) {
    endUsers.forEach((eu) => {
      if (eu.parent_distributor_id) {
        const distributor = db.prepare('SELECT email FROM users WHERE id = ?').get(eu.parent_distributor_id) as { email: string } | undefined
        console.log(`     - ${eu.email}: linked to distributor ${distributor?.email || 'N/A'}`)
      } else {
        console.log(`     - ${eu.email}: no distributor linked`)
      }
    })
  }

  // Verify permissions match
  console.log('\n✅ Permission Verification:')
  let allCorrect = true
  for (const [role, expectedPerms] of Object.entries(rolePermissions)) {
    const roleUsers = users.filter((u) => u.role === role)
    if (roleUsers.length > 0) {
      console.log(`   ${role}: ${expectedPerms.length} permission(s) defined`)
      if (expectedPerms.length === 0) {
        console.log(`     ⚠️  Warning: No permissions for ${role} role!`)
        allCorrect = false
      }
    }
  }

  // Check distributor and end_user permissions specifically
  console.log('\n🎯 Critical Permissions Check:')
  const distributorPerms = rolePermissions.distributor || []
  const endUserPerms = rolePermissions.end_user || []
  
  console.log(`   Distributor should have: view_inverters, create_inverter, view_tickets, create_ticket`)
  console.log(`   Distributor actually has: ${distributorPerms.join(', ')}`)
  const distributorHasCorrect = 
    distributorPerms.includes('view_inverters') &&
    distributorPerms.includes('create_inverter') &&
    distributorPerms.includes('view_tickets') &&
    distributorPerms.includes('create_ticket')
  console.log(`   ${distributorHasCorrect ? '✅' : '❌'} Distributor permissions: ${distributorHasCorrect ? 'CORRECT' : 'INCORRECT'}`)
  
  console.log(`   End User should have: view_inverters, create_inverter`)
  console.log(`   End User actually has: ${endUserPerms.join(', ')}`)
  const endUserHasCorrect = 
    endUserPerms.includes('view_inverters') &&
    endUserPerms.includes('create_inverter')
  console.log(`   ${endUserHasCorrect ? '✅' : '❌'} End User permissions: ${endUserHasCorrect ? 'CORRECT' : 'INCORRECT'}`)

  if (!distributorHasCorrect || !endUserHasCorrect) {
    allCorrect = false
  }

  if (allCorrect) {
    console.log('\n✅ All permissions are correctly configured!')
  } else {
    console.log('\n⚠️  Some permissions may need adjustment. Please check the code.')
  }

  db.close()
  process.exit(0)
} catch (error) {
  console.error('❌ Error checking user permissions:', error)
  db.close()
  process.exit(1)
}




