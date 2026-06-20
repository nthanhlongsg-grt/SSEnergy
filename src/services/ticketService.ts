import { apiClient } from './api.js'

export interface Ticket {
  id: number
  ticket_number: string
  inverter_id?: number
  customer_id: number
  title: string
  description?: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  status: string
  category?: string
  assigned_to?: number
  created_by: number
  resolved_at?: string
  closed_at?: string
  sla_deadline?: string
  created_at: string
  updated_at: string
  customer_name?: string
  customer_email?: string
  inverter_serial?: string
  inverter_model?: string
  assigned_to_name?: string
  assigned_to_role?: string
  created_by_name?: string
  notes?: string
}

export interface CreateTicketDto {
  inverter_id?: number
  customer_id: number
  title: string
  description?: string
  priority?: 'urgent' | 'high' | 'medium' | 'low'
  category?: string
}

export interface ImportTicketDto {
  customer_email?: string
  customer_id?: number
  title: string
  description?: string
  priority?: 'urgent' | 'high' | 'medium' | 'low'
  category?: string
  inverter_serial?: string
}

export const ticketService = {
  async getAllTickets(params?: {
    search?: string
    status?: string
    priority?: string
    sla_status?: string
    assigned_to?: string | number
    from?: string
    to?: string
    page?: number
    limit?: number
  }): Promise<{ data: Ticket[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const queryParams = new URLSearchParams()
    if (params?.search) queryParams.append('search', params.search)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.priority) queryParams.append('priority', params.priority)
    if (params?.sla_status) queryParams.append('sla_status', params.sla_status)
    if (params?.assigned_to) queryParams.append('assigned_to', params.assigned_to.toString())
    if (params?.from) queryParams.append('from', params.from)
    if (params?.to) queryParams.append('to', params.to)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())

    const queryString = queryParams.toString()
    const endpoint = queryString ? `/tickets?${queryString}` : '/tickets'

    const response = await apiClient.get<{ data: Ticket[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(endpoint)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to fetch tickets')
    }
    return response.data
  },

  async getTicketById(id: number): Promise<Ticket> {
    const response = await apiClient.get<Ticket>(`/tickets/${id}`)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Ticket not found')
    }
    return response.data
  },

  async createTicket(ticketData: CreateTicketDto): Promise<Ticket> {
    const response = await apiClient.post<Ticket>('/tickets', ticketData)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to create ticket')
    }
    return response.data
  },

  async importTickets(tickets: ImportTicketDto[]): Promise<{ success: number; errors: string[] }> {
    const response = await apiClient.post<{ success: number; errors: string[] }>('/tickets/import', { tickets })
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to import tickets')
    }
    return response.data
  },

  async getTicketStats(): Promise<{
    total: number
    new: number
    assigned: number
    machine_received: number
    in_progress: number
    waiting_parts: number
    waiting_delivery: number
    delivered: number
    completed: number
    closed: number
  }> {
    const response = await apiClient.get<{
      total: number
      new: number
      assigned: number
      machine_received: number
      in_progress: number
      waiting_parts: number
      waiting_delivery: number
      delivered: number
      completed: number
      closed: number
    }>('/tickets/stats')
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to fetch ticket stats')
    }
    return response.data
  },

  async addComment(ticketId: number, comment: string, isInternal?: boolean): Promise<any> {
    const response = await apiClient.post<any>(`/tickets/${ticketId}/comments`, { 
      comment,
      is_internal: isInternal || false
    })
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to add comment')
    }
    return response.data
  },

  async assignTechnician(ticketId: number, technicianId: number): Promise<Ticket> {
    const response = await apiClient.put<Ticket>(`/tickets/${ticketId}`, {
      assigned_to: technicianId,
    })
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to assign technician')
    }
    return response.data
  },

  async updateTicketStatus(ticketId: number, payload: { status: string }): Promise<Ticket> {
    const response = await apiClient.put<Ticket>(`/tickets/${ticketId}`, payload)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to update ticket status')
    }
    return response.data
  },

  async updateTicket(ticketId: number, payload: Partial<{ title: string; description: string; priority: string; status: string; category: string; customer_id: number; inverter_id: number | null; created_at: string }>): Promise<Ticket> {
    const response = await apiClient.put<Ticket>(`/tickets/${ticketId}`, payload)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to update ticket')
    }
    return response.data
  },

  async deleteTicket(ticketId: number): Promise<void> {
    const response = await apiClient.delete(`/tickets/${ticketId}`)
    if (response.error) {
      throw new Error(response.error)
    }
  },

  async bulkDeleteTickets(ids: number[]): Promise<{ success: boolean; count: number; message: string }> {
    const response = await apiClient.post<{ success: boolean; count: number; message: string }>('/tickets/bulk-delete', { ids })
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to bulk delete tickets')
    }
    return response.data
  },

  async uploadAttachment(ticketId: number, attachmentData: { file: string; filename: string; mime_type?: string; file_size?: number; comment_id?: number }): Promise<any> {
    const response = await apiClient.post<any>(`/tickets/${ticketId}/attachments`, attachmentData)
    if (response.error) {
      throw new Error(response.error)
    }
    if (!response.data) {
      throw new Error('Failed to upload attachment')
    }
    return response.data
  },
}

