import { ref, onMounted, onUnmounted, watch } from 'vue'

export interface AutoRefreshOptions {
  /**
   * Interval in milliseconds (default: 10000 = 10 seconds)
   */
  interval?: number
  /**
   * Whether to enable auto-refresh (default: true)
   */
  enabled?: boolean
  /**
   * Callback function to fetch data
   */
  fetchFn: () => Promise<any> | void
  /**
   * Optional callback when data changes are detected
   */
  onDataChange?: (newData: any, oldData: any) => void
  /**
   * Optional callback when refresh happens
   */
  onRefresh?: (data: any) => void
  /**
   * Function to compare old and new data to detect changes
   * Return true if data has changed
   */
  compareFn?: (oldData: any, newData: any) => boolean
  /**
   * Whether to pause refresh when page is not visible (default: true)
   */
  pauseWhenHidden?: boolean
}

/**
 * Composable for auto-refreshing data at intervals
 * 
 * @example
 * ```ts
 * const { data, isRefreshing, start, stop } = useAutoRefresh({
 *   interval: 10000, // 10 seconds
 *   fetchFn: async () => {
 *     const result = await loadTicket()
 *     return result
 *   },
 *   onDataChange: (newData, oldData) => {
 *     console.log('Data changed!', newData)
 *   }
 * })
 * ```
 */
export function useAutoRefresh<T = any>(options: AutoRefreshOptions) {
  const {
    interval = 10000, // 10 seconds default
    enabled = true,
    fetchFn,
    onDataChange,
    onRefresh,
    compareFn,
    pauseWhenHidden = true,
  } = options

  const data = ref<T | null>(null)
  const isRefreshing = ref(false)
  const lastRefreshTime = ref<Date | null>(null)
  const error = ref<string | null>(null)
  const isPaused = ref(false)

  let pollTimer: number | null = null
  let lastData: any = null

  // Default compare function: deep equality check for common cases
  const defaultCompareFn = (oldData: any, newData: any): boolean => {
    if (oldData === null || newData === null) {
      return oldData !== newData
    }
    
    // If both are objects/arrays, compare JSON stringified
    if (typeof oldData === 'object' && typeof newData === 'object') {
      try {
        return JSON.stringify(oldData) !== JSON.stringify(newData)
      } catch (e) {
        // Fallback to reference comparison
        return oldData !== newData
      }
    }
    
    return oldData !== newData
  }

  const compare = compareFn || defaultCompareFn

  const refresh = async () => {
    // Skip if paused or already refreshing
    if (isPaused.value || isRefreshing.value) {
      return
    }

    try {
      isRefreshing.value = true
      error.value = null

      const result = await fetchFn()
      
      // Check if data has changed
      const hasChanged = lastData !== null && compare(lastData, result)
      
      if (hasChanged && onDataChange) {
        onDataChange(result, lastData)
      }

      // Update data
      lastData = result
      data.value = result
      lastRefreshTime.value = new Date()

      if (onRefresh) {
        onRefresh(result)
      }
    } catch (err) {
      console.error('Auto-refresh error:', err)
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'Lỗi khi làm mới dữ liệu'
      }
    } finally {
      isRefreshing.value = false
    }
  }

  const start = () => {
    if (pollTimer) {
      stop()
    }
    
    if (!enabled) {
      return
    }

    // Initial fetch
    refresh()

    // Set up polling
    pollTimer = window.setInterval(() => {
      if (!isPaused.value) {
        refresh()
      }
    }, interval)
  }

  const stop = () => {
    if (pollTimer) {
      window.clearInterval(pollTimer)
      pollTimer = null
    }
  }

  const pause = () => {
    isPaused.value = true
  }

  const resume = () => {
    isPaused.value = false
    // Immediately refresh when resuming
    refresh()
  }

  // Handle page visibility changes
  const handleVisibilityChange = () => {
    if (pauseWhenHidden) {
      if (document.hidden) {
        pause()
      } else {
        resume()
      }
    }
  }

  onMounted(() => {
    if (enabled) {
      start()
    }
    
    if (pauseWhenHidden) {
      document.addEventListener('visibilitychange', handleVisibilityChange)
    }
  })

  onUnmounted(() => {
    stop()
    if (pauseWhenHidden) {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  })

  // Watch for enabled changes
  watch(() => enabled, (newEnabled) => {
    if (newEnabled) {
      start()
    } else {
      stop()
    }
  })

  return {
    data,
    isRefreshing,
    lastRefreshTime,
    error,
    isPaused,
    refresh,
    start,
    stop,
    pause,
    resume,
  }
}














