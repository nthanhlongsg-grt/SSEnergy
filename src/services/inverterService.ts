import { apiClient } from './api.js'

export interface Inverter {
  id: number
  serial_number: string
  model: string
  type?: string
  power_rating?: string
  installation_date?: string
  warranty_start_date?: string
  warranty_end_date?: string
  warranty_type?: string
  customer_id?: number
  distributor_id?: number
  installation_address?: string
  location_lat?: number
  location_lng?: number
  status?: string
  notes?: string
  created_at: string
  updated_at: string
  customer_name?: string
  customer_email?: string
  distributor_name?: string
  contract_numbers?: string
  contract_number?: string
  contract_id?: number
}

export interface CreateInverterDto {
  serial_number: string
  model: string
  type?: string
  power_rating?: string
  installation_date?: string
  warranty_start_date?: string
  warranty_end_date?: string
  warranty_type?: string
  customer_id?: number
  distributor_id?: number
  installation_address?: string
  location_lat?: number
  location_lng?: number
  status?: string
  notes?: string
}

export interface ImportInverterDto {
  serial_number: string
  model: string
  type?: string
  power_rating?: string
  installation_date?: string
  warranty_start_date?: string
  warranty_end_date?: string
  customer_email?: string
  customer_id?: number
  status?: string
  notes?: string
}

export const inverterService = {
  async getAllInverters(params?: {
    search?: string
    model?: string
    type?: string
    status?: string
    page?: number
    limit?: number
  }): Promise<{ data: Inverter[]; pagination: { page: number; limit: number } }> {
    const queryParams = new URLSearchParams()
    if (params?.search) queryParams.append('search', params.search)
    if (params?.model) queryParams.append('model', params.model)
    if (params?.type) queryParams.append('type', params.type)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const queryString = queryParams.toString()
    const endpoint = queryString ? `/inverters?${queryString}` : '/inverters'

    const response = await apiClient.get<{ data: Inverter[]; pagination: { page: number; limit: number } }>(endpoint)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to fetch inverters')
    }
    return response.data
  },

  async getInverterById(id: number, options?: { contractId?: number }): Promise<Inverter> {
    const query =
      options?.contractId != null ? `?contract_id=${options.contractId}` : ''
    const response = await apiClient.get<Inverter>(`/inverters/${id}${query}`)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Inverter not found')
    }
    return response.data
  },

  async createInverter(inverterData: CreateInverterDto): Promise<Inverter> {
    const response = await apiClient.post<Inverter>('/inverters', inverterData)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to create inverter')
    }
    return response.data
  },

  async updateInverter(id: number, inverterData: Partial<CreateInverterDto>): Promise<Inverter> {
    const response = await apiClient.put<Inverter>(`/inverters/${id}`, inverterData)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to update inverter')
    }
    return response.data
  },

  async deleteInverter(id: number): Promise<void> {
    const response = await apiClient.delete(`/inverters/${id}`)
    if (response.error) {
      throw new Error(response.error)
    }
  },

  async importInverters(inverters: ImportInverterDto[]): Promise<{ success: number; errors: string[] }> {
    const response = await apiClient.post<{ success: number; errors: string[] }>('/inverters/import', { inverters })
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to import inverters')
    }
    return response.data
  },

  async getStats(): Promise<{
    total: number
    active: number
    expired: number
    pending: number
    expiring_soon: number
  }> {
    const response = await apiClient.get<{
      total: number
      active: number
      expired: number
      pending: number
      expiring_soon: number
    }>('/inverters/stats')
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to fetch inverter stats')
    }
    return response.data
  },
}


