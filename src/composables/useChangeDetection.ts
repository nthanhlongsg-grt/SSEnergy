/**
 * useChangeDetection — Lightweight real-time change detection
 *
 * Polls /api/sync/changes every `interval` ms (default 5s).
 * The endpoint returns MAX(updated_at) timestamps and counts for key entities.
 * When a value changes the corresponding callback fires, then the caller
 * can re-fetch only the data it needs.
 */
import { onMounted, onUnmounted } from 'vue'
import { apiClient } from '@/services/api'

export interface ChangeSnapshot {
  tickets: string | null
  users: string | null
  profile: string | null
  notifications: number
  tasks: string | null
}

export interface ChangeDetectionOptions {
  /** Poll interval in ms. Default: 5000 */
  interval?: number
  /** When set, server tracks a specific ticket (comments + updated_at). */
  ticketId?: number | string | null
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
    interval = 5000,
    ticketId = null,
    onTicketChange,
    onUserChange,
    onProfileChange,
    onNotificationChange,
    onTaskChange,
    onAnyChange,
    autoStart = true,
  } = options

  let previous: ChangeSnapshot | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let running = false

  const check = async () => {
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
    if (autoStart) start()
    document.addEventListener('visibilitychange', handleVisibility)
  })

  onUnmounted(() => {
    stop()
    document.removeEventListener('visibilitychange', handleVisibility)
  })

  return { start, stop, check }
}
