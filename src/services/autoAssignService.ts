import { apiClient } from './api.js'

export type AutoAssignFunction = 'repair' | 'technicalSupport' | 'sale' | 'management'

export interface AutoAssignSettings {
  repair: number | null
  technicalSupport: number | null
  sale: number | null
  management: number | null
}

export const autoAssignService = {
  async getSettings(): Promise<AutoAssignSettings> {
    const response = await apiClient.get<AutoAssignSettings>('/auto-assign-settings')
    if (response.error) throw new Error(response.error)
    if (!response.data) throw new Error('Failed to fetch auto-assign settings')
    return response.data
  },

  async updateSettings(payload: Partial<AutoAssignSettings>): Promise<AutoAssignSettings> {
    const response = await apiClient.put<AutoAssignSettings>('/auto-assign-settings', payload)
    if (response.error) throw new Error(response.error)
    if (!response.data) throw new Error('Failed to update auto-assign settings')
    return response.data
  },
}
