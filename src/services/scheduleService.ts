import { apiClient } from './api.js'

export interface TechnicianSchedule {
  id: number
  technician_id: number
  technician_name?: string
  created_by_name?: string
  ticket_id?: number | null
  ticket_number?: string | null
  ticket_title?: string | null
  customer_name?: string | null
  customer_address?: string | null
  title: string
  description?: string | null
  schedule_date: string
  start_time?: string | null
  end_time?: string | null
  location?: string | null
  work_requirements?: string | null
  status?: string | null
  notes?: string | null
  completed_at?: string | null
  created_at?: string
  updated_at?: string
  related_users?: Array<{
    id: number
    name: string
    email?: string
    phone?: string
    role?: string
  }>
  comments?: Array<{
    id: number
    task_id: number
    user_id: number
    comment: string
    created_at: string
    user_name?: string
    user_email?: string
    user_phone?: string
  }>
}

export interface SchedulePayload {
  technician_id: number
  title: string
  schedule_date: string
  start_time: string
  end_time?: string | null
  description?: string | null
  location?: string | null
  work_requirements?: string | null
  notes?: string | null
  status?: string | null
  ticket_id?: number | null
}

export const scheduleService = {
  async getAssignableUsers() {
    const response = await apiClient.get('/schedules/assignable-users')
    if (response.error) {
      throw new Error(response.error)
    }
    return Array.isArray(response.data) ? response.data : []
  },

  async getSchedule(id: number): Promise<TechnicianSchedule> {
    const response = await apiClient.get<TechnicianSchedule>(`/schedules/${id}`)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Task not found')
    }
    return response.data
  },

  async getSchedules(params?: {
    technician_id?: number | string
    date?: string
    status?: string
    from?: string
    to?: string
    page?: number
    limit?: number
  }): Promise<{ data: TechnicianSchedule[]; pagination?: { page: number; limit: number } }> {
    const query = new URLSearchParams()
    if (params?.technician_id) query.append('technician_id', String(params.technician_id))
    if (params?.date) query.append('date', params.date)
    if (params?.status) query.append('status', params.status)
    if (params?.from) query.append('from', params.from)
    if (params?.to) query.append('to', params.to)
    if (params?.page) query.append('page', String(params.page))
    if (params?.limit) query.append('limit', String(params.limit))

    const endpoint = query.toString() ? `/schedules?${query.toString()}` : '/schedules'
    const response = await apiClient.get<{ data: TechnicianSchedule[]; pagination?: { page: number; limit: number } }>(endpoint)
    if (response.error) {
      throw new Error(response.error)
    }
    return response.data || { data: [] }
  },

  async createSchedule(payload: SchedulePayload): Promise<TechnicianSchedule> {
    const response = await apiClient.post<TechnicianSchedule>('/schedules', payload)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Không thể tạo lịch làm việc')
    }
    return response.data
  },

  async updateSchedule(id: number, payload: Partial<SchedulePayload>): Promise<TechnicianSchedule> {
    const response = await apiClient.put<TechnicianSchedule>(`/schedules/${id}`, payload)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Không thể cập nhật lịch làm việc')
    }
    return response.data
  },

  async deleteSchedule(id: number): Promise<void> {
    const response = await apiClient.delete(`/schedules/${id}`)
    if (response.error) {
      throw new Error(response.error)
    }
  },

  async addComment(taskId: number, comment: string): Promise<any> {
    const response = await apiClient.post<any>(`/schedules/${taskId}/comments`, { comment })
    if (response.error) {
      throw new Error(response.error)
    }
    return response.data
  },
}

