import { getApiBaseUrl } from '@/utils/apiUrl'

const BASE = `${getApiBaseUrl()}/api/cash-fund`

const authHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

export interface CashReceipt {
  id: number
  receipt_date: string
  amount: number
  content: string
  notes?: string
  created_by?: number
  created_by_name?: string
  created_at: string
}

export interface CashFundBalance {
  receipts: number
  expenses: number
  balance: number
}

export interface CashFundMonthSummary {
  month: string
  receipts: number
  expenses: number
  receipt_count: number
  expense_count: number
  net: number
  cumulative: number
}

export interface CashFundReport {
  months: CashFundMonthSummary[]
  total_receipts: number
  total_expenses: number
  net: number
}

export interface CashReceiptListParams {
  search?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface CreateCashReceiptDto {
  receipt_date: string
  amount: number
  content: string
  notes?: string
}

export const cashFundService = {
  async list(params: CashReceiptListParams = {}) {
    const q = new URLSearchParams()
    if (params.search) q.set('search', params.search)
    if (params.from) q.set('from', params.from)
    if (params.to) q.set('to', params.to)
    if (params.page) q.set('page', String(params.page))
    if (params.limit) q.set('limit', String(params.limit))
    const res = await fetch(`${BASE}?${q}`, { headers: authHeaders() })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi tải danh sách')
    return res.json() as Promise<{ data: CashReceipt[]; pagination: { total: number; page: number; limit: number } }>
  },

  async balance() {
    const res = await fetch(`${BASE}/balance`, { headers: authHeaders() })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi tải số dư')
    return res.json() as Promise<CashFundBalance>
  },

  async report(from?: string, to?: string) {
    const q = new URLSearchParams()
    if (from) q.set('from', from)
    if (to) q.set('to', to)
    const res = await fetch(`${BASE}/report?${q}`, { headers: authHeaders() })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi tải báo cáo')
    return res.json() as Promise<CashFundReport>
  },

  async create(dto: CreateCashReceiptDto) {
    const res = await fetch(BASE, { method: 'POST', headers: authHeaders(), body: JSON.stringify(dto) })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi tạo phiếu thu')
    return res.json() as Promise<CashReceipt>
  },

  async update(id: number, dto: Partial<CreateCashReceiptDto>) {
    const res = await fetch(`${BASE}/${id}`, { method: 'PUT', headers: authHeaders(), body: JSON.stringify(dto) })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi cập nhật')
    return res.json() as Promise<CashReceipt>
  },

  async remove(id: number) {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: authHeaders() })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi xóa')
  },
}
