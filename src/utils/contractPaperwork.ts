export interface ContractPaperwork {
  invoice_date?: string | null
  payment_received_date?: string | null
  device_delivery_date?: string | null
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
  { id: 'acceptance', label: 'Ngày ký biên bản nghiệm thu', shortLabel: 'Ký biên bản nghiệm thu', dateField: 'end_date', source: 'contract' },
  { id: 'invoice', label: 'Ngày xuất hóa đơn', shortLabel: 'Xuất hóa đơn', dateField: 'invoice_date', source: 'paperwork' },
  { id: 'payment', label: 'Ngày nhận thanh toán', shortLabel: 'Nhận thanh toán', dateField: 'payment_received_date', source: 'paperwork' },
  { id: 'device_delivery', label: 'Ngày giao máy đi', shortLabel: 'Giao máy đi', dateField: 'device_delivery_date', source: 'paperwork' },
  { id: 'paper_sent', label: 'Ngày gửi hợp đồng giấy đi', shortLabel: 'Gửi hợp đồng giấy đi', dateField: 'paper_sent_date', source: 'paperwork' },
  { id: 'returned', label: 'Ngày nhận lại hợp đồng', shortLabel: 'Nhận lại hợp đồng', dateField: 'contract_returned_date', source: 'paperwork' },
  { id: 'verified', label: 'Ngày xác minh hợp đồng đầy đủ', shortLabel: 'Xác minh hợp đồng đầy đủ', dateField: 'verification_date', source: 'paperwork' },
]

export function emptyPaperworkForm(): ContractPaperwork & { signed_date: string; end_date: string } {
  return {
    signed_date: '',
    end_date: '',
    invoice_date: '',
    payment_received_date: '',
    device_delivery_date: '',
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

export function isContractDeviceDelivered(contract: { paperwork?: ContractPaperwork | null }): boolean {
  return hasPaperworkDate(contract.paperwork?.device_delivery_date)
}

export function getDeviceDeliveryStatusLabel(contract: { paperwork?: ContractPaperwork | null }): string {
  return isContractDeviceDelivered(contract) ? 'Đã giao máy' : 'Chưa giao máy'
}

export function deviceDeliveryStatusClass(delivered: boolean): string {
  return delivered
    ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
    : 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300'
}
