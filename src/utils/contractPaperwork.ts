export interface ContractPaperwork {
  invoice_date?: string | null
  payment_received_date?: string | null
  paper_sent_date?: string | null
  shipping_carrier?: string | null
  tracking_number?: string | null
  contract_returned_date?: string | null
  verification_date?: string | null
}

export interface PaperworkCheckItem {
  id: string
  label: string
  shortLabel: string
  dateField: 'signed_date' | 'end_date' | keyof ContractPaperwork
  source: 'contract' | 'paperwork'
}

export const PAPERWORK_CHECKLIST: PaperworkCheckItem[] = [
  { id: 'signed', label: 'Ngày ký hợp đồng', shortLabel: 'Ký hợp đồng', dateField: 'signed_date', source: 'contract' },
  { id: 'invoice', label: 'Ngày xuất hóa đơn', shortLabel: 'Xuất hóa đơn', dateField: 'invoice_date', source: 'paperwork' },
  { id: 'payment', label: 'Ngày nhận thanh toán', shortLabel: 'Nhận thanh toán', dateField: 'payment_received_date', source: 'paperwork' },
  { id: 'paper_sent', label: 'Ngày gửi hợp đồng giấy đi', shortLabel: 'Gửi hợp đồng giấy đi', dateField: 'paper_sent_date', source: 'paperwork' },
  { id: 'returned', label: 'Ngày nhận lại hợp đồng', shortLabel: 'Nhận lại hợp đồng', dateField: 'contract_returned_date', source: 'paperwork' },
  { id: 'verified', label: 'Ngày xác minh hợp đồng đầy đủ', shortLabel: 'Xác minh hợp đồng đầy đủ', dateField: 'verification_date', source: 'paperwork' },
]

/** Mục giấy tờ hiển thị trên dashboard khách hàng (còn lại chỉ nội bộ) */
export const CUSTOMER_VISIBLE_PAPERWORK_IDS = [
  'payment',
  'invoice',
  'verified',
] as const

function customerVisiblePaperworkChecklist(): PaperworkCheckItem[] {
  const allowed = new Set<string>(CUSTOMER_VISIBLE_PAPERWORK_IDS)
  return PAPERWORK_CHECKLIST.filter((item) => allowed.has(item.id))
}

export type PaperworkFormValue = {
  signed_date: string
  end_date: string
  invoice_date: string
  payment_received_date: string
  paper_sent_date: string
  shipping_carrier: string
  tracking_number: string
  contract_returned_date: string
  verification_date: string
}

export function emptyPaperworkForm(): PaperworkFormValue {
  return {
    signed_date: '',
    end_date: '',
    invoice_date: '',
    payment_received_date: '',
    paper_sent_date: '',
    shipping_carrier: '',
    tracking_number: '',
    contract_returned_date: '',
    verification_date: '',
  }
}

export function hasPaperworkDate(value: unknown): boolean {
  return value !== undefined && value !== null && String(value).trim() !== ''
}

export function getPaperworkDate(
  contract: { signed_date?: string | null; end_date?: string | null; paperwork?: ContractPaperwork | null },
  item: PaperworkCheckItem
): string | null | undefined {
  if (item.source === 'contract') {
    return contract[item.dateField as 'signed_date' | 'end_date']
  }
  return contract.paperwork?.[item.dateField as keyof ContractPaperwork]
}

export function isPaperworkComplete(contract: {
  signed_date?: string | null
  end_date?: string | null
  paperwork?: ContractPaperwork | null
}): boolean {
  return PAPERWORK_CHECKLIST.every(item => hasPaperworkDate(getPaperworkDate(contract, item)))
}

export function getMissingPaperworkLabels(contract: {
  signed_date?: string | null
  end_date?: string | null
  paperwork?: ContractPaperwork | null
}): string[] {
  return PAPERWORK_CHECKLIST.filter(item => !hasPaperworkDate(getPaperworkDate(contract, item))).map(
    item => item.shortLabel
  )
}

/** Hoàn tất theo góc nhìn khách hàng (4 mục công khai) */
export function isCustomerPaperworkComplete(contract: {
  signed_date?: string | null
  end_date?: string | null
  paperwork?: ContractPaperwork | null
}): boolean {
  return customerVisiblePaperworkChecklist().every((item) => hasPaperworkDate(getPaperworkDate(contract, item)))
}

/** ID các mục thiếu giấy tờ — khách hàng được xem (dịch qua i18n ở UI) */
export function getCustomerMissingPaperworkItemIds(contract: {
  signed_date?: string | null
  end_date?: string | null
  paperwork?: ContractPaperwork | null
}): string[] {
  return customerVisiblePaperworkChecklist()
    .filter((item) => !hasPaperworkDate(getPaperworkDate(contract, item)))
    .map((item) => item.id)
}

export function isContractPaid(contract: { paperwork?: ContractPaperwork | null }): boolean {
  return hasPaperworkDate(contract.paperwork?.payment_received_date)
}

export function getPaymentStatusLabel(contract: { paperwork?: ContractPaperwork | null }): string {
  return isContractPaid(contract) ? 'Đã thanh toán' : 'Chưa thanh toán'
}

export function paymentStatusClass(paid: boolean): string {
  return paid
    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
}

/** Tổng giá trị hợp đồng — ưu tiên field value, fallback tính từ line items + VAT */
export function getContractTotalAmount(contract: {
  value?: number | null
  items?: Array<{ quantity?: number; unit_price?: number }> | null
  vat_rate?: number | null
} | null | undefined): number {
  if (!contract) return 0
  const stored = Number(contract.value) || 0
  if (stored > 0) return stored

  const subtotal = (contract.items ?? []).reduce(
    (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
    0,
  )
  if (subtotal <= 0) return 0

  const vatRate = Number(contract.vat_rate)
  const rate = Number.isFinite(vatRate) ? vatRate : 8
  return subtotal + Math.round(subtotal * rate / 100)
}
