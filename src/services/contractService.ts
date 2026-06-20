import { getApiBaseUrl } from '@/utils/apiUrl'

const BASE = `${getApiBaseUrl()}/api/contracts`

const authHeaders = () => {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export interface ContractItem {
  description: string
  unit: string
  quantity: number
  unit_price: number
}

export interface ContractPaperwork {
  invoice_date?: string | null
  payment_received_date?: string | null
  paper_sent_date?: string | null
  shipping_carrier?: string | null
  tracking_number?: string | null
  contract_returned_date?: string | null
  verification_date?: string | null
}

export interface Contract {
  id: number
  contract_number: string
  customer_id: number
  customer_name?: string
  customer_phone?: string
  customer_email?: string
  title: string
  contract_type: 'service' | 'economic' | 'other'
  start_date: string
  end_date: string
  value: number
  status: 'draft' | 'active' | 'expired' | 'cancelled'
  description?: string
  notes?: string
  signed_date?: string
  paperwork?: ContractPaperwork
  delivery_days?: number
  warranty_months?: number
  items?: ContractItem[]
  vat_rate?: number
  created_by: number
  created_by_name?: string
  created_at: string
  updated_at: string
  inverters?: { id: number; serial_number: string; model: string; power_rating?: string; status: string }[]
  inverter_ids?: number[]
}

export interface ContractStats {
  total: number
  draft: number
  active: number
  expired: number
  cancelled: number
  expiring_soon: number
  active_unpaid: number
}

export interface ContractListParams {
  status?: string
  customer_id?: number
  search?: string
  contract_type?: string
  unpaid?: boolean
  from?: string
  to?: string
  page?: number
  limit?: number
}

export const contractService = {
  async list(params: ContractListParams = {}) {
    const query = new URLSearchParams()
    if (params.status) query.set('status', params.status)
    if (params.contract_type) query.set('contract_type', params.contract_type)
    if (params.customer_id) query.set('customer_id', String(params.customer_id))
    if (params.search) query.set('search', params.search)
    if (params.unpaid) query.set('unpaid', '1')
    if (params.from) query.set('from', params.from)
    if (params.to) query.set('to', params.to)
    if (params.page) query.set('page', String(params.page))
    if (params.limit) query.set('limit', String(params.limit))

    const res = await fetch(`${BASE}?${query}`, { headers: authHeaders() })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi tải danh sách hợp đồng')
    return res.json() as Promise<{ contracts: Contract[]; total: number; page: number; limit: number }>
  },

  async stats() {
    const res = await fetch(`${BASE}/stats`, { headers: authHeaders() })
    if (!res.ok) throw new Error('Lỗi tải thống kê hợp đồng')
    return res.json() as Promise<ContractStats>
  },

  async get(id: number) {
    const res = await fetch(`${BASE}/${id}`, { headers: authHeaders() })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi tải hợp đồng')
    return res.json() as Promise<Contract>
  },

  async create(data: Partial<Contract>) {
    const res = await fetch(BASE, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi tạo hợp đồng')
    return res.json() as Promise<Contract>
  },

  async update(id: number, data: Partial<Contract>) {
    const res = await fetch(`${BASE}/${id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi cập nhật hợp đồng')
    return res.json() as Promise<Contract>
  },

  async updatePaperwork(id: number, data: Record<string, unknown>) {
    const res = await fetch(`${BASE}/${id}/paperwork`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Lỗi cập nhật hồ sơ giấy tờ')
    return res.json() as Promise<Contract>
  },

  async remove(id: number) {
    const res = await fetch(`${BASE}/${id}`, { method: 'DELETE', headers: authHeaders() })
    if (!res.ok) throw new Error('Lỗi xóa hợp đồng')
  },
}
