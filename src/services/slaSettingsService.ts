import { apiClient } from './api.js'

export interface SlaSettings {
  urgent: number
  high: number
  medium: number
  low: number
}

export interface UpdateSlaSettingsDto {
  urgent?: number
  high?: number
  medium?: number
  low?: number
}

export const slaSettingsService = {
  async getSettings(): Promise<SlaSettings> {
    const response = await apiClient.get<SlaSettings>('/sla-settings')
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to fetch SLA settings')
    }
    return response.data
  },

  async updateSettings(payload: UpdateSlaSettingsDto): Promise<SlaSettings> {
    const response = await apiClient.put<SlaSettings>('/sla-settings', payload)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to update SLA settings')
    }
    return response.data
  },
}
