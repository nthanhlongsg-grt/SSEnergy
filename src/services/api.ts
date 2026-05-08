import { getApiBaseUrl } from '@/utils/apiUrl'

const API_BASE_URL = getApiBaseUrl() + '/api'

export interface ApiResponse<T> {
  data?: T
  error?: string
}

class ApiClient {
  private baseURL: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('token')
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      })

      // Handle 204 No Content responses (e.g., DELETE requests)
      if (response.status === 204 || response.status === 201 && !response.headers.get('content-length')) {
        if (!response.ok) {
          return {
            error: 'An error occurred',
          }
        }
        return { data: undefined as T }
      }

      // Check if response has content
      const contentType = response.headers.get('content-type')
      const hasJsonContent = contentType && contentType.includes('application/json')
      
      let data: any = null
      
      // Only parse JSON if content type indicates JSON and response has body
      if (hasJsonContent) {
        try {
          const text = await response.text()
          if (text) {
            data = JSON.parse(text)
          }
        } catch (parseError) {
          // If JSON parsing fails but response is OK, return empty data
          if (response.ok) {
            return { data: undefined as T }
          }
          throw parseError
        }
      }

      if (!response.ok) {
        return {
          error: data?.error || 'An error occurred',
        }
      }

      return { data }
    } catch (error) {
      // Better error message for connection refused
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        return {
          error: 'Không thể kết nối đến server. Vui lòng đảm bảo backend server đang chạy.',
        }
      }
      // Handle JSON parse errors specifically
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return {
          error: 'Invalid response from server',
        }
      }
      return {
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)
