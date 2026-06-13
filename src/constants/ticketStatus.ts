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

/** Map legacy DB values to the current workflow statuses. */
export const LEGACY_TICKET_STATUS_MAP: Record<string, TicketStatusValue> = {
  initialized: TicketStatus.NEW,
  pending: TicketStatus.NEW,
  assigned: TicketStatus.MACHINE_RECEIVED,
  waiting_parts: TicketStatus.WAITING_DELIVERY,
  completed: TicketStatus.CLOSED,
}

/** DB statuses that belong to each canonical filter value. */
export const TICKET_STATUS_FILTER_VALUES: Record<TicketStatusValue, string[]> = {
  new: ['new', 'initialized', 'pending'],
  machine_received: ['machine_received', 'assigned'],
  in_progress: ['in_progress'],
  waiting_delivery: ['waiting_delivery', 'waiting_parts'],
  delivered: ['delivered'],
  closed: ['closed', 'completed'],
}

export const TICKET_STATUS_I18N_KEY: Record<TicketStatusValue, string> = {
  new: 'tickets.status.new',
  machine_received: 'tickets.status.machineReceived',
  in_progress: 'tickets.status.inProgress',
  waiting_delivery: 'tickets.status.waitingDelivery',
  delivered: 'tickets.status.delivered',
  closed: 'tickets.status.closed',
}

export const TICKET_STATUS_BADGE_CLASS: Record<TicketStatusValue, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  machine_received: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  waiting_delivery: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  delivered: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  closed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
}

export const TICKET_STATUS_METRIC_THEME: Record<
  TicketStatusValue,
  { active: string; badge: string; text: string }
> = {
  new: {
    active: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
    badge: 'bg-blue-100 dark:bg-blue-900',
    text: 'text-blue-600 dark:text-blue-400',
  },
  machine_received: {
    active: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800',
    badge: 'bg-cyan-100 dark:bg-cyan-900',
    text: 'text-cyan-600 dark:text-cyan-400',
  },
  in_progress: {
    active: 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800',
    badge: 'bg-purple-100 dark:bg-purple-900',
    text: 'text-purple-600 dark:text-purple-400',
  },
  waiting_delivery: {
    active: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800',
    badge: 'bg-amber-100 dark:bg-amber-900',
    text: 'text-amber-600 dark:text-amber-400',
  },
  delivered: {
    active: 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800',
    badge: 'bg-indigo-100 dark:bg-indigo-900',
    text: 'text-indigo-600 dark:text-indigo-400',
  },
  closed: {
    active: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    badge: 'bg-green-100 dark:bg-green-900',
    text: 'text-green-600 dark:text-green-400',
  },
}

export const TICKET_STATUS_METRIC_BADGE: Record<TicketStatusValue, string> = {
  new: 'N',
  machine_received: 'M',
  in_progress: 'X',
  waiting_delivery: 'C',
  delivered: 'G',
  closed: 'D',
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

export function isTicketActive(status?: string | null): boolean {
  return !isTicketClosed(status)
}

export function expandStatusFilter(status: string): string[] {
  const normalized = normalizeTicketStatus(status)
  if (TICKET_STATUS_FILTER_VALUES[normalized as TicketStatusValue]) {
    return TICKET_STATUS_FILTER_VALUES[normalized as TicketStatusValue]
  }
  return [status]
}
