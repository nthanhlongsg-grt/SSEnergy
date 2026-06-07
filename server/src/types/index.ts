export enum UserRole {
  ADMIN = 'admin',
  DEV = 'dev',
  SERVICE_CENTER = 'service_center',
  TECHNICIAN = 'technician',
  DISTRIBUTOR = 'distributor',
  DEALER = 'dealer',
  END_USER = 'end_user',
  WAREHOUSE = 'warehouse',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface User {
  id: number
  name: string
  email: string
  password?: string
  code?: string
  role: UserRole
  function?: string
  organization?: string
  status: UserStatus
  created_at: string
  updated_at: string
}

export interface CreateUserDto {
  name: string
  email: string
  password: string
  code?: string
  role: UserRole
  function?: string
  organization?: string
  status?: UserStatus
  phone?: string
  address?: string
  parent_distributor_id?: number
}

export interface UpdateUserDto {
  name?: string
  email?: string
  password?: string
  code?: string
  role?: UserRole
  function?: string
  organization?: string
  phone?: string
  address?: string
  status?: UserStatus
  parent_distributor_id?: number
}

export interface LoginDto {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: Omit<User, 'password'>
}

export const isAdminRole = (role?: UserRole | null): boolean => {
  return role === UserRole.ADMIN || role === UserRole.DEV
}
