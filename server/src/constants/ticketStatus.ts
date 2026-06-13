export const TicketStatus = {
  NEW: 'new',
  MACHINE_RECEIVED: 'machine_received',
  IN_PROGRESS: 'in_progress',
  WAITING_DELIVERY: 'waiting_delivery',
  DELIVERED: 'delivered',
  CLOSED: 'closed',
} as const

export type TicketStatusValue = (typeof TicketStatus)[keyof typeof TicketStatus]

export const TICKET_STATUS_ORDER: TicketStatusValue[] = [
  TicketStatus.NEW,
  TicketStatus.MACHINE_RECEIVED,
  TicketStatus.IN_PROGRESS,
  TicketStatus.WAITING_DELIVERY,
  TicketStatus.DELIVERED,
  TicketStatus.CLOSED,
]

export const LEGACY_TICKET_STATUS_MAP: Record<string, TicketStatusValue> = {
  initialized: TicketStatus.NEW,
  pending: TicketStatus.NEW,
  assigned: TicketStatus.MACHINE_RECEIVED,
  waiting_parts: TicketStatus.WAITING_DELIVERY,
  completed: TicketStatus.CLOSED,
}

export const TICKET_STATUS_FILTER_VALUES: Record<TicketStatusValue, string[]> = {
  new: ['new', 'initialized', 'pending'],
  machine_received: ['machine_received', 'assigned'],
  in_progress: ['in_progress'],
  waiting_delivery: ['waiting_delivery', 'waiting_parts'],
  delivered: ['delivered'],
  closed: ['closed', 'completed'],
}

export const TICKET_STATUS_LABELS_VI: Record<TicketStatusValue, string> = {
  new: 'Tạo mới',
  machine_received: 'Đã nhận được máy',
  in_progress: 'Đang xử lý',
  waiting_delivery: 'Chờ giao máy',
  delivered: 'Giao máy',
  closed: 'Đóng',
}

export function normalizeTicketStatus(status?: string | null): TicketStatusValue | string {
  if (!status) return TicketStatus.NEW
  if (TICKET_STATUS_ORDER.includes(status as TicketStatusValue)) {
    return status as TicketStatusValue
  }
  return LEGACY_TICKET_STATUS_MAP[status] || status
}

export function isTicketClosed(status?: string | null): boolean {
  return normalizeTicketStatus(status) === TicketStatus.CLOSED
}

export function isValidTicketStatus(status: string): boolean {
  return (
    TICKET_STATUS_ORDER.includes(status as TicketStatusValue) ||
    Object.prototype.hasOwnProperty.call(LEGACY_TICKET_STATUS_MAP, status)
  )
}

export function expandStatusFilter(status: string): string[] {
  const normalized = normalizeTicketStatus(status)
  if (TICKET_STATUS_FILTER_VALUES[normalized as TicketStatusValue]) {
    return TICKET_STATUS_FILTER_VALUES[normalized as TicketStatusValue]
  }
  return [status]
}

export function getTicketStatusLabel(status?: string | null): string {
  const normalized = normalizeTicketStatus(status) as TicketStatusValue
  return TICKET_STATUS_LABELS_VI[normalized] || String(status || '')
}

export const ACTIVE_TICKET_STATUSES = TICKET_STATUS_ORDER.filter((s) => s !== TicketStatus.CLOSED)
