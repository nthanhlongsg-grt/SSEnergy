import { UserRole } from '../types/index.js'

export const VALID_AUTO_ASSIGN_FUNCTIONS = [
  'repair',
  'technicalSupport',
  'sale',
  'management',
] as const

export type AutoAssignFunction = (typeof VALID_AUTO_ASSIGN_FUNCTIONS)[number]

/** Effective function for auto-assign when DB `function` is null. */
export function resolveStaffFunction(
  role: string,
  fn: string | null | undefined
): AutoAssignFunction | null {
  if (fn && (VALID_AUTO_ASSIGN_FUNCTIONS as readonly string[]).includes(fn)) {
    return fn as AutoAssignFunction
  }
  if (role === UserRole.TECHNICIAN || role === UserRole.SERVICE_CENTER) {
    return 'technicalSupport'
  }
  if (role === UserRole.ADMIN || role === UserRole.DEV) {
    return 'management'
  }
  return null
}

export const AUTO_ASSIGN_STAFF_ROLES = [
  UserRole.TECHNICIAN,
  UserRole.ADMIN,
  UserRole.DEV,
  UserRole.SERVICE_CENTER,
] as const
