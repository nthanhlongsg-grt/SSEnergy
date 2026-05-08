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
  avatar?: string
  status: UserStatus
  created_at: string
  updated_at: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  user: User
}

export const authService = {
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Login failed')
    }
    
    // Store token
    localStorage.setItem('token', response.data.token)
    
    return response.data
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me')
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('User not found')
    }
    return response.data
  },

  logout(): void {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  },

  getToken(): string | null {
    return localStorage.getItem('token')
  },

  isAuthenticated(): boolean {
    return !!this.getToken()
  },
}
