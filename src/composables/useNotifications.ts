import { ref, computed, onMounted, onUnmounted } from 'vue'
import { notificationService, type NotificationItem } from '@/services/notificationService'

const notifications = ref<NotificationItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const initialized = ref(false)
let pollTimer: number | null = null

const unreadCount = computed(() => notifications.value.filter((n) => !n.is_read).length)

const fetchNotifications = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await notificationService.fetch({ limit: 20 })
    notifications.value = data
  } catch (err) {
    console.error('Fetch notifications error:', err)
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = 'Không thể tải thông báo'
    }
  } finally {
    loading.value = false
  }
}

const startPolling = () => {
  if (pollTimer) return
  pollTimer = window.setInterval(fetchNotifications, 30000)
}

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

const markAsRead = async (id: number) => {
  try {
    await notificationService.markAsRead(id)
    notifications.value = notifications.value.map((item) =>
      item.id === id ? { ...item, is_read: true } : item
    )
  } catch (err) {
    console.error('Mark notification as read error:', err)
  }
}

const markAllAsRead = async () => {
  try {
    await notificationService.markAllAsRead()
    notifications.value = notifications.value.map((item) => ({ ...item, is_read: true }))
  } catch (err) {
    console.error('Mark all notifications as read error:', err)
  }
}

const init = () => {
  if (initialized.value) return
  initialized.value = true
  fetchNotifications()
  startPolling()
}

export const refreshNotifications = fetchNotifications

export const useNotifications = () => {
  onMounted(() => {
    init()
  })

  onUnmounted(() => {
    // keep polling globally; do not stop to allow background updates
  })

  return {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  }
}








