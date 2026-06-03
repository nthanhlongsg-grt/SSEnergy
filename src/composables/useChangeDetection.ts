/**
 * useChangeDetection — Lightweight real-time change detection
 *
 * Polls /api/sync/changes every `interval` ms (default 5s).
 * The endpoint returns MAX(updated_at) timestamps and counts for key entities.
 * When a value changes the corresponding callback fires, then the caller
 * can re-fetch only the data it needs.
 *
 * Much more efficient than polling full data every 10 seconds:
 * - /api/sync/changes: ~1ms query (just MAX on indexed column)
 * - Full data fetch: only triggered when something actually changed
 *
 * @example
 * ```ts
 * useChangeDetection({
 *   onTicketChange: () => loadTickets(),
 *   onUserChange:   () => loadTechnicians(),
 * })
 * ```
 */
import { onMounted, onUnmounted } from 'vue'
import { apiClient } from '@/services/api'

export interface ChangeSnapshot {
  tickets:       string | null   // MAX(updated_at) of visible tickets
  users:         string | null   // MAX(updated_at) of active users (admin/dev only)
  notifications: number          // unread notification count
}

export interface ChangeDetectionOptions {
  /** Poll interval in ms. Default: 5000 */
  interval?: number
  /** Called when any ticket is created/updated */
  onTicketChange?: () => void
  /** Called when any user is created/updated (admin/dev only) */
  onUserChange?: () => void
  /** Called when unread notification count changes */
  onNotificationChange?: (count: number) => void
  /** Called when anything changes */
  onAnyChange?: () => void
  /** Start immediately on mount. Default: true */
  autoStart?: boolean
}

export function useChangeDetection(options: ChangeDetectionOptions = {}) {
  const {
    interval       = 5000,
    onTicketChange,
    onUserChange,
    onNotificationChange,
    onAnyChange,
    autoStart      = true,
  } = options

  let previous: ChangeSnapshot | null = null
  let timer: ReturnType<typeof setInterval> | null = null
  let running = false

  const check = async () => {
    try {
      const res = await apiClient.get<ChangeSnapshot>('/sync/changes')
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

        if (current.notifications !== previous.notifications) {
          onNotificationChange?.(current.notifications)
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
    check() // immediate first check
    timer = setInterval(check, interval)
  }

  const stop = () => {
    if (timer !== null) {
      clearInterval(timer)
      timer = null
    }
    running = false
  }

  // Pause when tab is hidden, resume when visible
  const handleVisibility = () => {
    if (document.hidden) {
      stop()
    } else {
      previous = null // force re-baseline on resume
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
