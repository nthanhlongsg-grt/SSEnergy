/**
 * User Groups Management
 * 
 * Phân chia người dùng thành các nhóm với giao diện riêng
 */

import { UserRole } from '@/composables/useAuth'

/**
 * User Group Types
 */
export enum UserGroup {
  // Nhóm khách hàng (Customer Group)
  CUSTOMER = 'customer',
  // Nhóm quản lý (Management/Staff Group)
  MANAGEMENT = 'management',
}

/**
 * Customer roles - có giao diện riêng
 */
export const CUSTOMER_ROLES: UserRole[] = [
  UserRole.END_USER,
  UserRole.DISTRIBUTOR,
]

/**
 * Management roles - mỗi role có giao diện riêng
 */
export const MANAGEMENT_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.DEV,
  UserRole.SERVICE_CENTER,
  UserRole.TECHNICIAN,
  UserRole.WAREHOUSE,
  UserRole.DEALER,
  UserRole.ACCOUNTING,
]

/**
 * Kiểm tra role có thuộc nhóm Customer không
 */
export const isCustomerRole = (role: UserRole | string | null | undefined): boolean => {
  if (!role) return false
  return CUSTOMER_ROLES.includes(role as UserRole)
}

/**
 * Kiểm tra role có thuộc nhóm Management không
 */
export const isManagementRole = (role: UserRole | string | null | undefined): boolean => {
  if (!role) return false
  return MANAGEMENT_ROLES.includes(role as UserRole)
}

/**
 * Lấy user group từ role
 */
export const getUserGroup = (role: UserRole | string | null | undefined): UserGroup | null => {
  if (!role) return null
  
  if (isCustomerRole(role)) {
    return UserGroup.CUSTOMER
  }
  
  if (isManagementRole(role)) {
    return UserGroup.MANAGEMENT
  }
  
  return null
}

/**
 * Lấy base route theo user group
 */
export const getDefaultRouteByGroup = (group: UserGroup | null, authenticated = false): string => {
  switch (group) {
    case UserGroup.CUSTOMER:
      return '/customer/dashboard'
    case UserGroup.MANAGEMENT:
      return '/'
    default:
      return authenticated ? '/' : '/signin'
  }
}

/**
 * Lấy default route theo role
 */
export const getDefaultRouteByRole = (
  role: UserRole | string | null | undefined,
  authenticated = false,
): string => {
  const group = getUserGroup(role)
  return getDefaultRouteByGroup(group, authenticated)
}

/**
 * Lấy layout name theo role
 */
export const getLayoutByRole = (role: UserRole | string | null | undefined): string => {
  if (isCustomerRole(role)) {
    return 'CustomerLayout'
  }
  
  // Management roles dùng layout riêng theo role
  switch (role) {
    case UserRole.ADMIN:
    case UserRole.DEV:
      return 'AdminLayout'
    case UserRole.TECHNICIAN:
      return 'TechnicianLayout'
    case UserRole.WAREHOUSE:
      return 'WarehouseLayout'
    case UserRole.SERVICE_CENTER:
      return 'ServiceCenterLayout'
    case UserRole.DEALER:
      return 'DealerLayout'
    case UserRole.ACCOUNTING:
      return 'AdminLayout'
    default:
      return 'AdminLayout' // Default layout
  }
}

/**
 * Kiểm tra route có thuộc customer group không
 */
export const isCustomerRoute = (path: string): boolean => {
  return path.startsWith('/customer')
}

/**
 * Kiểm tra route có thuộc management group không
 */
export const isManagementRoute = (path: string): boolean => {
  return !isCustomerRoute(path) && path !== '/signin' && path !== '/signup' && path !== '/reset-password'
}




