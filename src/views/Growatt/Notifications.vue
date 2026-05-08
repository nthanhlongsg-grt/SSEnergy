<template>
  <admin-layout>
    <div class="px-4 sm:px-0 space-y-4 sm:space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Thông báo
          </h1>
          <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            Xem tất cả thông báo của bạn
          </p>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <button
            v-if="selectedNotifications.length > 0"
            @click="handleDeleteSelected"
            class="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors touch-manipulation min-h-[44px] sm:min-h-0 text-sm sm:text-base"
            :disabled="deleting"
          >
            <span v-if="deleting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span v-else class="whitespace-nowrap">Xóa ({{ selectedNotifications.length }})</span>
          </button>
          <button
            v-if="notifications.length > 0 && unreadCount > 0"
            @click="handleMarkAllAsRead"
            class="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation min-h-[44px] sm:min-h-0 text-sm sm:text-base"
            :disabled="markingAll"
          >
            <span v-if="markingAll" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span v-else class="whitespace-nowrap">Đánh dấu tất cả đã đọc</span>
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 sm:p-4"
      >
        <p class="text-sm sm:text-base text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading && notifications.length === 0" class="flex justify-center items-center py-12">
        <div class="text-sm sm:text-base text-gray-500 dark:text-gray-400">Đang tải...</div>
      </div>

      <!-- Notifications List -->
      <div v-if="!loading || notifications.length > 0" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <!-- Select All Header -->
        <div v-if="notifications.length > 0" class="px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <label class="flex items-center gap-2 cursor-pointer touch-manipulation">
            <input
              type="checkbox"
              :checked="allSelected"
              @change="toggleSelectAll"
              class="w-5 h-5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 touch-manipulation"
            />
            <span class="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
              Chọn tất cả ({{ selectedNotifications.length }}/{{ notifications.length }})
            </span>
          </label>
        </div>
        
        <div class="divide-y divide-gray-200 dark:divide-gray-700">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            :class="[
              'p-3 sm:p-4 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors touch-manipulation',
              !notification.is_read ? 'bg-blue-50/30 dark:bg-blue-900/10' : '',
              selectedNotifications.includes(notification.id) ? 'bg-blue-100/50 dark:bg-blue-900/20' : ''
            ]"
          >
            <div class="flex items-start gap-2 sm:gap-3">
              <input
                type="checkbox"
                :checked="selectedNotifications.includes(notification.id)"
                @change="toggleSelect(notification.id)"
                @click.stop
                class="mt-1 w-5 h-5 sm:w-4 sm:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 flex-shrink-0 touch-manipulation"
              />
              <div
                class="flex-1 min-w-0 cursor-pointer"
                @click="handleNotificationClick(notification)"
              >
                <div class="flex items-start justify-between gap-2 sm:gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                      <span
                        :class="[
                          'px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full whitespace-nowrap',
                          notification.is_read
                            ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                        ]"
                      >
                        {{ getTypeLabel(notification.type) }}
                      </span>
                      <span
                        v-if="!notification.is_read"
                        class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"
                      ></span>
                    </div>
                    <h3 class="text-sm sm:text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">
                      {{ getShortTitle(notification) }}
                    </h3>
                    <p v-if="notification.message" class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {{ getShortMessage(notification.message) }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span class="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {{ formatTimeShort(notification.created_at) }}
                    </span>
                    <button
                      v-if="!notification.is_read"
                      @click.stop="handleMarkAsRead(notification.id)"
                      class="px-2 py-1.5 sm:py-1 text-sm sm:text-xs text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 active:bg-gray-200 dark:active:bg-gray-700 rounded touch-manipulation min-h-[32px] sm:min-h-0 min-w-[32px] sm:min-w-0 flex items-center justify-center"
                      title="Đánh dấu đã đọc"
                    >
                      ✓
                    </button>
                    <button
                      @click.stop="handleDeleteSingle(notification.id)"
                      class="px-2 py-1.5 sm:py-1 text-sm sm:text-xs text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 active:bg-red-100 dark:active:bg-red-900/20 rounded touch-manipulation min-h-[32px] sm:min-h-0 min-w-[32px] sm:min-w-0 flex items-center justify-center"
                      title="Xóa"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && notifications.length === 0" class="text-center py-12 px-4">
          <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400">Không có thông báo nào</p>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { notificationService, type NotificationItem } from '@/services/notificationService'

const router = useRouter()
const notifications = ref<NotificationItem[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const markingAll = ref(false)
const deleting = ref(false)
const selectedNotifications = ref<number[]>([])

const unreadCount = computed(() => notifications.value.filter((n) => !n.is_read).length)

const allSelected = computed(() => {
  return notifications.value.length > 0 && selectedNotifications.value.length === notifications.value.length
})

const fetchNotifications = async () => {
  try {
    loading.value = true
    error.value = null
    const data = await notificationService.fetch() // Fetch all without limit
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

const formatTime = (value: string) => {
  const date = new Date(value)
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const formatTimeShort = (value: string) => {
  const date = new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Vừa xong'
  if (diffMins < 60) return `${diffMins} phút trước`
  if (diffHours < 24) return `${diffHours} giờ trước`
  if (diffDays < 7) return `${diffDays} ngày trước`
  
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getShortTitle = (notification: NotificationItem) => {
  let title = notification.title || ''
  // Rút gọn title nếu quá dài
  if (title.length > 60) {
    title = title.substring(0, 60) + '...'
  }
  return title
}

const getShortMessage = (message: string) => {
  if (!message) return ''
  // Rút gọn message, bỏ các phần lặp lại
  let short = message
  // Bỏ "ticket "1"" nếu có
  short = short.replace(/ticket\s*"1"/gi, 'ticket')
  // Rút gọn nếu quá dài
  if (short.length > 80) {
    short = short.substring(0, 80) + '...'
  }
  return short
}

const typeLabels: Record<string, string> = {
  ticket_created: 'Ticket mới',
  ticket_assigned: 'Ticket được giao',
  schedule_assigned: 'Công việc',
}

const getTypeLabel = (type: string) => typeLabels[type] || 'Thông báo'

const handleNotificationClick = async (notification: NotificationItem) => {
  await handleMarkAsRead(notification.id)

  if (notification.entity_type === 'ticket' && notification.entity_id) {
    router.push(`/tickets/${notification.entity_id}`)
  } else if (notification.entity_type === 'schedule' && notification.entity_id) {
    router.push(`/tasks/${notification.entity_id}`)
  } else if (notification.entity_type === 'schedule') {
    router.push('/calendar')
  }
}

const handleMarkAsRead = async (id: number) => {
  try {
    await notificationService.markAsRead(id)
    notifications.value = notifications.value.map((item) =>
      item.id === id ? { ...item, is_read: true } : item
    )
  } catch (err) {
    console.error('Mark notification as read error:', err)
  }
}

const handleMarkAllAsRead = async () => {
  try {
    markingAll.value = true
    await notificationService.markAllAsRead()
    notifications.value = notifications.value.map((item) => ({ ...item, is_read: true }))
  } catch (err) {
    console.error('Mark all notifications as read error:', err)
  } finally {
    markingAll.value = false
  }
}

const toggleSelect = (id: number) => {
  const index = selectedNotifications.value.indexOf(id)
  if (index > -1) {
    selectedNotifications.value.splice(index, 1)
  } else {
    selectedNotifications.value.push(id)
  }
}

const toggleSelectAll = () => {
  if (allSelected.value) {
    selectedNotifications.value = []
  } else {
    selectedNotifications.value = notifications.value.map(n => n.id)
  }
}

const handleDeleteSingle = async (id: number) => {
  if (!confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
    return
  }

  try {
    deleting.value = true
    await notificationService.delete(id)
    notifications.value = notifications.value.filter(n => n.id !== id)
    selectedNotifications.value = selectedNotifications.value.filter(selectedId => selectedId !== id)
  } catch (err) {
    console.error('Delete notification error:', err)
    alert('Không thể xóa thông báo')
  } finally {
    deleting.value = false
  }
}

const handleDeleteSelected = async () => {
  if (selectedNotifications.value.length === 0) return
  
  if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedNotifications.value.length} thông báo đã chọn?`)) {
    return
  }

  try {
    deleting.value = true
    await notificationService.deleteMultiple(selectedNotifications.value)
    notifications.value = notifications.value.filter(n => !selectedNotifications.value.includes(n.id))
    selectedNotifications.value = []
  } catch (err) {
    console.error('Delete notifications error:', err)
    alert('Không thể xóa thông báo')
  } finally {
    deleting.value = false
  }
}

onMounted(() => {
  fetchNotifications()
})
</script>

