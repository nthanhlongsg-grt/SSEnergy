import { getApiBaseUrl } from '@/utils/apiUrl'

const BASE = `${getApiBaseUrl()}/api/payment-requests`

const authHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected' | 'paid'

export type ExpenseCategory =
  | 'tools'
  | 'materials'
  | 'external_labor'
  | 'transport'
  | 'business_travel'
  | 'office'
  | 'entertainment'
  | 'other'

export type PaymentSource = 'company_account' | 'cash' | 'other'

export interface PaymentRequest {
  id: number
  request_number: string
  contract_id?: number | null
  contract_number?: string | null
  contract_title?: string | null
  contract_value?: number | null
  customer_name?: string | null
  amount: number
  payment_date?: string | null
  payment_content: string
  expense_category?: ExpenseCategory | null
  payment_source?: PaymentSource | null
  payer_name?: string | null
  has_vat: boolean
  invoice_images?: string | null
  payment_proof_images?: string | null
  notes?: string | null
  beneficiary_name?: string | null
  bank_account?: string | null
  bank_name?: string | null
  status: PaymentRequestStatus
  requested_by: number
  requested_by_name?: string
  reviewed_by?: number | null
  reviewed_by_name?: string | null
  reviewed_at?: string | null
  review_note?: string | null
  created_at: string
  updated_at: string
}

export interface ContractOption {
  id: number
  contract_number: string
  title: string
  value: number
  status: string
  customer_name?: string
}

export interface PaymentRequestListParams {
  status?: PaymentRequestStatus | ''
  contract_id?: number
  search?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface CreatePaymentRequestDto {
  contract_id?: number
  amount: number
  payment_date?: string
  payment_content: string
  expense_category?: ExpenseCategory
  payment_source?: PaymentSource
  payer_name?: string
  has_vat?: boolean
  invoice_images?: string[]
  notes?: string
  beneficiary_name?: string
  bank_account?: string
  bank_name?: string
}

export interface PaymentRequestExpenseReport {
  paid_count: number
  total_paid: number
  pending_count: number
  approved_count: number
  pending_total: number
  approved_total: number
  by_category: Array<{ expense_category: string; count: number; total: number }>
  items: Array<{
    id: number
    request_number: string
    amount: number
    payment_date?: string | null
    payment_content: string
    expense_category?: string | null
    payment_source?: string | null
    status: PaymentRequestStatus
    requested_by_name?: string
    expense_date?: string
  }>
  from: string
  to: string
}

export interface PaymentRequestDashboardSummary {
  pending_count: number
  approved_count: number
  open_count: number
  open_total_amount: number
  pending_total_amount: number
  approved_total_amount: number
  pending_list: PaymentRequest[]
  approved_list: PaymentRequest[]
}

export interface PaymentRequestComment {
  id: number
  payment_request_id: number
  user_id: number
  comment: string
  created_at: string
  user_name?: string
  user_role?: string
}

export const paymentRequestService = {
  async getDashboardSummary() {
    const res = await fetch(`${BASE}/dashboard-summary`, { headers: authHeaders() })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi tải thống kê chi phí')
    return res.json() as Promise<PaymentRequestDashboardSummary>
  },

  async getExpenseReport(from?: string, to?: string) {
    const query = new URLSearchParams()
    if (from) query.set('from', from)
    if (to) query.set('to', to)
    const apiBase = `${getApiBaseUrl()}/api/reports/expenses`
    const url = query.toString() ? `${apiBase}?${query}` : apiBase
    const res = await fetch(url, { headers: authHeaders() })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi tải thống kê chi')
    return res.json() as Promise<PaymentRequestExpenseReport>
  },

  async list(params: PaymentRequestListParams = {}) {
    const query = new URLSearchParams()
    if (params.status) query.set('status', params.status)
    if (params.contract_id) query.set('contract_id', String(params.contract_id))
    if (params.search) query.set('search', params.search)
    if (params.from) query.set('from', params.from)
    if (params.to) query.set('to', params.to)
    if (params.page) query.set('page', String(params.page))
    if (params.limit) query.set('limit', String(params.limit))

    const res = await fetch(`${BASE}?${query}`, { headers: authHeaders() })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi tải danh sách')
    return res.json() as Promise<{
      data: PaymentRequest[]
      pagination: { total: number; page: number; limit: number }
    }>
  },

  async get(id: number) {
    const res = await fetch(`${BASE}/${id}`, { headers: authHeaders() })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi tải chi tiết')
    return res.json() as Promise<PaymentRequest>
  },

  async getContractOptions(search = '', contractId?: number) {
    const query = new URLSearchParams()
    if (contractId) query.set('contract_id', String(contractId))
    else if (search) query.set('search', search)
    const res = await fetch(`${BASE}/contract-options?${query}`, { headers: authHeaders() })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi tải hợp đồng')
    return res.json() as Promise<ContractOption[]>
  },

  async create(data: CreatePaymentRequestDto) {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi tạo chi phí')
    return res.json() as Promise<PaymentRequest>
  },

  async update(id: number, data: Partial<CreatePaymentRequestDto & { payment_proof_images?: string[]; review_note?: string | null }>) {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi cập nhật chi phí')
    return res.json() as Promise<PaymentRequest>
  },

  async review(
    id: number,
    action: 'approve' | 'reject',
    data?: {
      review_note?: string
      payment_source?: PaymentSource | ''
      payer_name?: string
      payment_proof_images?: string[]
    },
  ) {
    const res = await fetch(`${BASE}/${id}/review`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({
        action,
        review_note: data?.review_note,
        payment_source: data?.payment_source || undefined,
        payer_name: data?.payer_name,
        payment_proof_images: data?.payment_proof_images?.length
          ? data.payment_proof_images
          : undefined,
      }),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi duyệt chi phí')
    return res.json() as Promise<PaymentRequest>
  },

  async markPaid(id: number, payment_proof_images?: string[]) {
    const res = await fetch(`${BASE}/${id}/mark-paid`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(
        payment_proof_images?.length ? { payment_proof_images } : {},
      ),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi xác nhận thanh toán')
    return res.json() as Promise<PaymentRequest>
  },

  async listComments(id: number) {
    const res = await fetch(`${BASE}/${id}/comments`, { headers: authHeaders() })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi tải tin nhắn')
    return res.json() as Promise<PaymentRequestComment[]>
  },

  async addComment(id: number, comment: string) {
    const res = await fetch(`${BASE}/${id}/comments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ comment }),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi gửi tin nhắn')
    return res.json() as Promise<PaymentRequestComment>
  },

  async remove(id: number) {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi xóa chi phí')
    return res.json() as Promise<{ success: boolean; id: number; request_number: string }>
  },
}
