import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  TICKET_STATUS_BADGE_CLASS,
  TICKET_STATUS_I18N_KEY,
  TICKET_STATUS_ORDER,
  isTicketActive,
  isTicketClosed,
  normalizeTicketStatus,
  type TicketStatusValue,
} from '@/constants/ticketStatus'

export function useTicketStatus() {
  const { t } = useI18n()

  const getStatusLabel = (status?: string | null) => {
    const normalized = normalizeTicketStatus(status) as TicketStatusValue
    const key = TICKET_STATUS_I18N_KEY[normalized]
    if (!key) return status || ''
    const translated = t(key)
    return translated !== key ? translated : (status || '')
  }

  const getStatusClass = (status?: string | null) => {
    const normalized = normalizeTicketStatus(status) as TicketStatusValue
    return TICKET_STATUS_BADGE_CLASS[normalized] || TICKET_STATUS_BADGE_CLASS.new
  }

  const statusOptions = computed(() =>
    TICKET_STATUS_ORDER.map((value) => ({
      value,
      label: t(TICKET_STATUS_I18N_KEY[value]),
    })),
  )

  const statusFilterOptions = computed(() => [
    { value: '', label: t('tickets.list.filters.all') },
    ...statusOptions.value,
  ])

  return {
    getStatusLabel,
    getStatusClass,
    statusOptions,
    statusFilterOptions,
    isTicketClosed,
    isTicketActive,
    normalizeTicketStatus,
    TICKET_STATUS_ORDER,
  }
}
