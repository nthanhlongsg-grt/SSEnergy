import { apiClient } from '@/services/api'

export type ChartGranularity = 'day' | 'week' | 'month'

export interface ReportChartsData {
  granularity: ChartGranularity
  revenue_trend: Array<{ period: string; revenue: number; signed_count: number }>
  expense_trend: Array<{ period: string; total: number; count: number }>
  contract_payment: {
    paid_count: number
    unpaid_count: number
    paid_value: number
    unpaid_value: number
  } | null
  expense_by_category: Array<{ expense_category: string; total: number }>
  expense_by_status: {
    pending: number
    approved: number
    paid: number
  } | null
  cash_flow: {
    revenue: number
    expense: number
  }
  from?: string
  to?: string
}

export const reportService = {
  async getCharts(from?: string, to?: string): Promise<ReportChartsData> {
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const query = params.toString()
    const url = query ? `/reports/charts?${query}` : '/reports/charts'
    const response = await apiClient.get(url)
    if (response.error) {
      throw new Error(response.error)
    }
    return response.data as ReportChartsData
  },
}
