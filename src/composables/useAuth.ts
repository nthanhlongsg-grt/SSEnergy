import { ref, computed } from 'vue'

// User roles
export enum UserRole {
  ADMIN = 'admin',
  DEV = 'dev',
  SERVICE_CENTER = 'service_center',
  TECHNICIAN = 'technician',
  DISTRIBUTOR = 'distributor',
  DEALER = 'dealer',
  END_USER = 'end_user',
  WAREHOUSE = 'warehouse',
  ACCOUNTING = 'accounting',
}

// User status
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

// Permissions
export enum Permission {
  // Inverter Management
  VIEW_INVERTERS = 'view_inverters',
  CREATE_INVERTER = 'create_inverter',
  EDIT_INVERTER = 'edit_inverter',
  DELETE_INVERTER = 'delete_inverter',
  MANAGE_MODELS = 'manage_models',

  // Customer Management
  VIEW_CUSTOMERS = 'view_customers',
  CREATE_CUSTOMER = 'create_customer',
  EDIT_CUSTOMER = 'edit_customer',
  DELETE_CUSTOMER = 'delete_customer',

  // Ticket Management
  VIEW_TICKETS = 'view_tickets',
  CREATE_TICKET = 'create_ticket',
  ASSIGN_TICKET = 'assign_ticket',
  UPDATE_TICKET_STATUS = 'update_ticket_status',
  CLOSE_TICKET = 'close_ticket',

  // Technician Management
  VIEW_TECHNICIANS = 'view_technicians',
  ASSIGN_TECHNICIAN = 'assign_technician',
  VIEW_SCHEDULE = 'view_schedule',

  // Warehouse Management
  VIEW_WAREHOUSE = 'view_warehouse',
  MANAGE_PARTS = 'manage_parts',
  MANAGE_RMA = 'manage_rma',
  IMPORT_PARTS = 'import_parts',
  EXPORT_PARTS = 'export_parts',

  // Service Reports
  VIEW_REPORTS = 'view_reports',
  CREATE_REPORT = 'create_report',
  EDIT_REPORT = 'edit_report',
  EXPORT_REPORT = 'export_report',

  // Reports & Analytics
  VIEW_ANALYTICS = 'view_analytics',
  EXPORT_DATA = 'export_data',

  // User Management
  VIEW_USERS = 'view_users',
  CREATE_USER = 'create_user',
  EDIT_USER = 'edit_user',
  DELETE_USER = 'delete_user',
  MANAGE_ROLES = 'manage_roles',

  // Contract Management
  VIEW_CONTRACTS = 'view_contracts',
  MANAGE_CONTRACTS = 'manage_contracts',
  VIEW_CONTRACT_FINANCE = 'view_contract_finance',
}

// Permissions kế toán không có — toàn bộ mục "Cài đặt thêm"
const ACCOUNTING_DENIED_PERMISSIONS: Permission[] = [
  Permission.MANAGE_ROLES,
  Permission.VIEW_USERS,
  Permission.CREATE_USER,
  Permission.EDIT_USER,
  Permission.DELETE_USER,
  Permission.VIEW_TECHNICIANS,
]

// Role permissions mapping
const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admin has all permissions
    ...Object.values(Permission),
  ],
  [UserRole.DEV]: [
    ...Object.values(Permission),
  ],
  [UserRole.SERVICE_CENTER]: [
    Permission.VIEW_INVERTERS,
    Permission.MANAGE_MODELS,
    Permission.VIEW_CUSTOMERS,
    Permission.VIEW_TICKETS,
    Permission.CREATE_TICKET,
    Permission.ASSIGN_TICKET,
    Permission.UPDATE_TICKET_STATUS,
    Permission.CLOSE_TICKET,
    Permission.VIEW_TECHNICIANS,
    Permission.ASSIGN_TECHNICIAN,
    Permission.VIEW_SCHEDULE,
    Permission.VIEW_WAREHOUSE,
    Permission.VIEW_REPORTS,
    Permission.CREATE_REPORT,
    Permission.EDIT_REPORT,
    Permission.EXPORT_REPORT,
    Permission.VIEW_ANALYTICS,
    Permission.EXPORT_DATA,
    Permission.VIEW_CONTRACTS,
    Permission.MANAGE_CONTRACTS,
  ],
  [UserRole.TECHNICIAN]: [
    Permission.VIEW_INVERTERS,
    Permission.VIEW_TICKETS,
    Permission.CREATE_TICKET,
    Permission.UPDATE_TICKET_STATUS,
    Permission.VIEW_SCHEDULE,
    Permission.VIEW_REPORTS,
    Permission.CREATE_REPORT,
    Permission.EDIT_REPORT,
    // Không có VIEW_CUSTOMERS, VIEW_CONTRACTS — chỉ thấy thiết bị và ticket
  ],
  [UserRole.DISTRIBUTOR]: [
    Permission.VIEW_INVERTERS,
    Permission.CREATE_INVERTER,
    Permission.VIEW_TICKETS,
    Permission.CREATE_TICKET,
    Permission.VIEW_CONTRACTS,
  ],
  [UserRole.DEALER]: [
    Permission.VIEW_INVERTERS,
    Permission.VIEW_CUSTOMERS,
    Permission.CREATE_CUSTOMER,
    Permission.VIEW_TICKETS,
    Permission.CREATE_TICKET,
    Permission.VIEW_REPORTS,
  ],
  [UserRole.END_USER]: [
    Permission.VIEW_INVERTERS,
    Permission.CREATE_INVERTER,
    Permission.VIEW_TICKETS,
    Permission.CREATE_TICKET,
    Permission.VIEW_CONTRACTS,
  ],
  [UserRole.WAREHOUSE]: [
    Permission.VIEW_WAREHOUSE,
    Permission.MANAGE_PARTS,
    Permission.MANAGE_RMA,
    Permission.IMPORT_PARTS,
    Permission.EXPORT_PARTS,
    Permission.VIEW_TICKETS,
    Permission.VIEW_INVERTERS,
    // Không có VIEW_CUSTOMERS, VIEW_CONTRACTS
  ],
  [UserRole.ACCOUNTING]: Object.values(Permission).filter(
    (permission) => !ACCOUNTING_DENIED_PERMISSIONS.includes(permission),
  ),
}

// Current user state
const currentUser = ref<{
  id: number
  name: string
  email: string
  code?: string
  role: UserRole
  organization?: string
  phone?: string
  address?: string
  avatar?: string
  status?: string
  permissions: Permission[]
} | null>(null)

// Check if user is authenticated
export const isAuthenticated = computed(() => currentUser.value !== null)

// Get current user
export const getUser = computed(() => currentUser.value)

// Get user role
export const getUserRole = computed(() => currentUser.value?.role)

const isAdminLikeRole = (role?: UserRole | string | null): boolean => {
  return role === UserRole.ADMIN || role === UserRole.DEV
}

export const isStaffAdminRole = (role?: UserRole | string | null): boolean => {
  return isAdminLikeRole(role) || role === UserRole.ACCOUNTING
}

export const canViewContractFinanceRole = (role?: UserRole | string | null): boolean => {
  if (!role) return false
  if (isAdminLikeRole(role)) return true
  return String(role).toLowerCase() === UserRole.ACCOUNTING
}

// Check if user has permission
export const hasPermission = (permission: Permission): boolean => {
  if (!currentUser.value) return false
  if (isAdminLikeRole(currentUser.value.role)) return true
  return currentUser.value.permissions.includes(permission)
}

// Check if user has any of the permissions
export const hasAnyPermission = (permissions: Permission[]): boolean => {
  return permissions.some((permission) => hasPermission(permission))
}

// Check if user has all permissions
export const hasAllPermissions = (permissions: Permission[]): boolean => {
  return permissions.every((permission) => hasPermission(permission))
}

// Check if user has role
export const hasRole = (role: UserRole): boolean => {
  if (!currentUser.value) return false
  if (role === UserRole.ADMIN && isStaffAdminRole(currentUser.value.role)) return true
  return currentUser.value.role === role
}

// Check if user has any of the roles
export const hasAnyRole = (roles: UserRole[]): boolean => {
  if (!currentUser.value) return false
  if (roles.includes(UserRole.ADMIN) && isStaffAdminRole(currentUser.value.role)) return true
  return roles.includes(currentUser.value.role)
}

// Login function
export const login = async (
  email: string,
  password: string
): Promise<boolean> => {
  try {
    const { authService } = await import('@/services/authService')
    const response = await authService.login({ email, password })
    
    const authenticatedUser = {
      id: response.user.id,
      name: response.user.name,
      email: response.user.email,
      code: response.user.code,
      role: response.user.role,
      organization: response.user.organization,
      phone: response.user.phone,
      address: response.user.address,
      avatar: response.user.avatar,
      status: response.user.status,
      permissions: rolePermissions[response.user.role] || [],
    }

    currentUser.value = authenticatedUser
    localStorage.setItem('user', JSON.stringify(authenticatedUser))
    return true
  } catch (error) {
    console.error('Login error:', error)
    return false
  }
}

// Logout function
export const logout = async () => {
  try {
    const { authService } = await import('@/services/authService')
    authService.logout()
  } catch (error) {
    console.warn('API logout failed:', error)
  }
  currentUser.value = null
  localStorage.removeItem('user')
  localStorage.removeItem('token')
}

// Fetch and update user info from API
export const refreshUserInfo = async () => {
  try {
    const { authService } = await import('@/services/authService')
    const userData = await authService.getCurrentUser()
    
    const authenticatedUser = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      code: userData.code,
      role: userData.role,
      organization: userData.organization,
      phone: userData.phone,
      address: userData.address,
      avatar: userData.avatar,
      status: userData.status,
      permissions: rolePermissions[userData.role] || [],
    }

    currentUser.value = authenticatedUser
    localStorage.setItem('user', JSON.stringify(authenticatedUser))
    return authenticatedUser
  } catch (error) {
    console.error('Error refreshing user info:', error)
    // If API fails, keep existing user from localStorage
    return currentUser.value
  }
}

// Initialize auth from localStorage
export const initAuth = async () => {
  const token = localStorage.getItem('token')
  const storedUser = localStorage.getItem('user')
  
  if (token && storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser)
      
      // Set user immediately from localStorage for instant auth state
      currentUser.value = {
        ...parsedUser,
        permissions: rolePermissions[parsedUser.role as UserRole] || [],
      }
      
      // Try to refresh from API in background if token exists
      try {
        await refreshUserInfo()
      } catch (error) {
        // If API fails, keep stored user (already set above)
        console.warn('Failed to refresh user from API, using stored user:', error)
        // Token might be invalid, clear it but keep user temporarily
        // localStorage.removeItem('token')
      }
    } catch (error) {
      console.error('Error parsing stored user:', error)
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      currentUser.value = null
    }
  } else if (storedUser) {
    // If no token but has stored user, use stored user (for backward compatibility)
    try {
      const parsedUser = JSON.parse(storedUser)
      currentUser.value = {
        ...parsedUser,
        permissions: rolePermissions[parsedUser.role as UserRole] || [],
      }
    } catch (error) {
      console.error('Error parsing stored user:', error)
      localStorage.removeItem('user')
      currentUser.value = null
    }
  } else {
    // No stored data, ensure user is null
    currentUser.value = null
  }
}

// Set user (for testing or after API call)
export const setUser = (user: {
  id: number
  name: string
  email: string
  code?: string
  role: UserRole
  organization?: string
  phone?: string
  address?: string
  avatar?: string
  status?: string
}) => {
  currentUser.value = {
    ...user,
    permissions: rolePermissions[user.role] || [],
  }
  localStorage.setItem('user', JSON.stringify(currentUser.value))
}

// Composable function for components
export const useAuth = () => {
  const canViewContractFinance = computed(() =>
    canViewContractFinanceRole(getUserRole.value) ||
    hasPermission(Permission.VIEW_CONTRACT_FINANCE),
  )
  const canManageContracts = computed(() =>
    hasPermission(Permission.MANAGE_CONTRACTS),
  )

  return {
    isAuthenticated,
    getUser,
    getUserRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isStaffAdminRole,
    canViewContractFinance,
    canManageContracts,
    login,
    logout,
    setUser,
    refreshUserInfo,
  }
}

// Initialize on module load (will be awaited in router guard)
// This ensures auth state is restored from localStorage
initAuth().catch((error) => {
  console.warn('Auth initialization warning:', error)
})
