/**
 * useChangeDetection — Lightweight real-time change detection
 *
 * Polls /api/sync/changes every `interval` ms (default 5s dev / 20s production).
 * The endpoint returns MAX(updated_at) timestamps and counts for key entities.
 * When a value changes the corresponding callback fires, then the caller
 * can re-fetch only the data it needs.
 */
import { onMounted, onUnmounted, watch } from 'vue'
import { apiClient } from '@/services/api'
import { POLL } from '@/utils/pollInterval'
import { isAuthenticated } from '@/composables/useAuth'

export interface ChangeSnapshot {
  tickets: string | null
  users: string | null
  profile: string | null
  notifications: number
  tasks: string | null
}

export interface ChangeDetectionOptions {
  /** Poll interval in ms. Default: 5s dev, 20s production */
  interval?: number
  /** When set, server tracks a specific ticket (comments + updated_at). */
  ticketId?: number | string | string[] | null
  /** Called when any ticket is created/updated */
  onTicketChange?: () => void
  /** Called when any user is created/updated (admin/dev only) */
  onUserChange?: () => void
  /** Called when the signed-in user's profile/role may have changed */
  onProfileChange?: () => void
  /** Called when unread notification count changes */
  onNotificationChange?: (count: number) => void
  /** Called when tasks/schedules change */
  onTaskChange?: () => void
  /** Called when anything changes */
  onAnyChange?: () => void
  /** Start immediately on mount. Default: true */
  autoStart?: boolean
}

export function useChangeDetection(options: ChangeDetectionOptions = {}) {
  const {
    interval = POLL.changeDetection(),
    ticketId: rawTicketId = null,
    onTicketChange,
    onUserChange,
    onProfileChange,
    onNotificationChange,
    onTaskChange,
    onAnyChange,
    autoStart = true,
  } = options

  const ticketId = Array.isArray(rawTicketId) ? rawTicketId[0] : rawTicketId

  let previous: ChangeSnapshot | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let running = false

  const check = async () => {
    if (!localStorage.getItem('token')) return

    try {
      const query =
        ticketId !== null && ticketId !== undefined && ticketId !== ''
          ? `?ticket_id=${encodeURIComponent(String(ticketId))}`
          : ''
      const res = await apiClient.get<ChangeSnapshot>(`/sync/changes${query}`)
      if (!res.data) return

      const current = res.data

      if (previous !== null) {
        let anyChanged = false

        if (current.tickets !== previous.tickets) {
          onTicketChange?.()
          anyChanged = true
        }

        if (current.users !== null && current.users !== previous.users) {
          onUserChange?.()
          anyChanged = true
        }

        if (current.profile !== null && current.profile !== previous.profile) {
          onProfileChange?.()
          anyChanged = true
        }

        if (current.notifications !== previous.notifications) {
          onNotificationChange?.(current.notifications)
          anyChanged = true
        }

        if (current.tasks !== null && current.tasks !== previous.tasks) {
          onTaskChange?.()
          anyChanged = true
        }

        if (anyChanged) {
          onAnyChange?.()
        }
      }

      previous = current
    } catch {
      // Silently ignore — network errors shouldn't break the page
    }
  }

  const start = () => {
    if (running) return
    if (!localStorage.getItem('token')) return
    running = true
    check()
    timer = setInterval(check, interval)
  }

  const stop = () => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
    running = false
  }

  const handleVisibility = () => {
    if (document.hidden) {
      stop()
    } else {
      previous = null
      start()
    }
  }

  onMounted(() => {
    if (autoStart && localStorage.getItem('token')) start()
    document.addEventListener('visibilitychange', handleVisibility)

    // Resume polling after login (App.vue stays mounted across signin → dashboard)
    watch(isAuthenticated, (authed) => {
      if (authed) {
        previous = null
        start()
      } else {
        stop()
        previous = null
      }
    })
  })

  onUnmounted(() => {
    stop()
    document.removeEventListener('visibilitychange', handleVisibility)
  })

  return { start, stop, check }
}
