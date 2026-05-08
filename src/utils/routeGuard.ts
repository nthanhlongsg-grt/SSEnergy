/**
 * Route Guard Utilities
 * Kiểm tra quyền truy cập route dựa trên user group và role
 */

import type { RouteLocationNormalized } from 'vue-router'
import { getUserRole, isAuthenticated } from '@/composables/useAuth'
import { isCustomerRole, isManagementRole, getUserGroup, getDefaultRouteByRole } from './userGroups'

/**
 * Kiểm tra user có quyền truy cập route không
 */
export const canAccessRoute = (route: RouteLocationNormalized): boolean => {
  if (!isAuthenticated.value) {
    return !route.meta.requiresAuth
  }

  const userRole = getUserRole.value
  
  if (!userRole) {
    return false
  }

  // Kiểm tra user group
  const routeUserGroup = route.meta.userGroup as string | undefined
  if (routeUserGroup) {
    const userGroup = getUserGroup(userRole)
    
    if (routeUserGroup === 'customer' && !isCustomerRole(userRole)) {
      return false
    }
    
    if (routeUserGroup === 'management' && !isManagementRole(userRole)) {
      return false
    }
  }

  // Kiểm tra allowed roles
  const allowedRoles = route.meta.allowedRoles as string[] | undefined
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return false
  }

  // Kiểm tra permission (nếu có)
  if (route.meta.requiresPermission) {
    // Permission check sẽ được xử lý trong router guard
    return true
  }

  return true
}

/**
 * Lấy route redirect khi không có quyền truy cập
 */
export const getRedirectRoute = (userRole: string | null | undefined): string => {
  if (!userRole) {
    return '/signin'
  }

  return getDefaultRouteByRole(userRole)
}

