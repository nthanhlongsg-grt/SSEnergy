import { apiClient } from './api.js'

export interface NotificationItem {
  id: number
  user_id: number
  type: string
  title: string
  message?: string | null
  entity_type?: string | null
  entity_id?: number | null
  data?: Record<string, any> | null
  is_read: boolean
  created_at: string
}

export const notificationService = {
  async fetch(options?: { unreadOnly?: boolean; limit?: number }): Promise<NotificationItem[]> {
    const params = new URLSearchParams()
    if (options?.unreadOnly) params.append('unreadOnly', 'true')
    if (options?.limit) params.append('limit', options.limit.toString())
    const query = params.toString()
    const endpoint = query ? `/notifications?${query}` : '/notifications'
    const response = await apiClient.get<NotificationItem[]>(endpoint)
    if (response.error) {
      throw new Error(response.error)
    }
    return response.data || []
  },

  async markAsRead(id: number) {
    const response = await apiClient.post<{ success: boolean }>(`/notifications/${id}/read`)
    if (response.error) {
      throw new Error(response.error)
    }
    return response.data
  },

  async markAllAsRead() {
    const response = await apiClient.post<{ success: boolean }>(`/notifications/read-all`)
    if (response.error) {
      throw new Error(response.error)
    }
    return response.data
  },

  async delete(id: number) {
    const response = await apiClient.delete<{ success: boolean }>(`/notifications/${id}`)
    if (response.error) {
      throw new Error(response.error)
    }
    return response.data
  },

  async deleteMultiple(ids: number[]) {
    const response = await apiClient.post<{ success: boolean; deleted: number }>(`/notifications/delete-multiple`, { ids })
    if (response.error) {
      throw new Error(response.error)
    }
    return response.data
  },
}








