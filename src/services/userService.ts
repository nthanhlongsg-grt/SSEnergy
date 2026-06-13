import { apiClient } from './api.js'
import { UserRole, UserStatus } from '@/composables/useAuth'

export interface User {
  id: number
  name: string
  email: string
  code?: string
  role: UserRole
  organization?: string
  phone?: string
  address?: string
  bank_account?: string
  bank_name?: string
  bank_account_name?: string
  avatar?: string
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
  organization?: string
  phone?: string
  address?: string
  bank_account?: string
  bank_name?: string
  bank_account_name?: string
  status?: UserStatus
  parent_distributor_id?: number
}

export interface UpdateUserDto {
  name?: string
  email?: string
  password?: string
  code?: string
  role?: UserRole
  organization?: string
  phone?: string
  address?: string
  bank_account?: string
  bank_name?: string
  bank_account_name?: string
  status?: UserStatus
  parent_distributor_id?: number
}

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const response = await apiClient.get<User[]>('/users')
    if (response.error) {
      throw new Error(response.error)
    }
    return response.data || []
  },

  async getUserById(id: number): Promise<User> {
    const response = await apiClient.get<User>(`/users/${id}`)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('User not found')
    }
    return response.data
  },

  async createUser(userData: CreateUserDto): Promise<User> {
    const response = await apiClient.post<User>('/users', userData)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to create user')
    }
    return response.data
  },

  async updateUser(id: number, userData: UpdateUserDto): Promise<User> {
    const response = await apiClient.put<User>(`/users/${id}`, userData)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to update user')
    }
    return response.data
  },

  async updateMyProfile(userData: UpdateUserDto & { phone?: string; address?: string }): Promise<User> {
    const response = await apiClient.put<User>('/users/me', userData)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to update profile')
    }
    return response.data
  },

  async deleteUser(id: number): Promise<void> {
    const response = await apiClient.delete(`/users/${id}`)
    if (response.error) {
      throw new Error(response.error)
    }
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const response = await apiClient.put<{ message: string }>('/users/me/password', {
      oldPassword,
      newPassword,
    })
    if (response.error) {
      throw new Error(response.error)
    }
  },

  async uploadAvatar(avatar: string): Promise<{ message: string; avatar: string }> {
    const response = await apiClient.post<{ message: string; avatar: string }>('/users/me/avatar', {
      avatar,
    })
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to upload avatar')
    }
    return response.data
  },

  async deleteAvatar(): Promise<void> {
    const response = await apiClient.delete<{ message: string }>('/users/me/avatar')
    if (response.error) {
      throw new Error(response.error)
    }
  },
}
