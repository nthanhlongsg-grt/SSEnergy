<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-dark-900 h-10 w-10 sm:h-11 sm:w-11 hover:bg-gray-100 hover:text-gray-700 active:bg-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white dark:active:bg-gray-700 touch-manipulation"
      @click="toggleDropdown"
    >
      <span
        v-if="hasUnread"
        class="absolute -right-1 -top-1 z-10 flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-orange-500 text-[10px] font-semibold text-white shadow-sm"
        :class="{
          'px-1': unreadCountDisplay === '...',
          'px-1.5': unreadCountDisplay !== '...' && unreadCountDisplay.length > 1,
          'px-0.5': unreadCountDisplay !== '...' && unreadCountDisplay.length === 1,
        }"
      >
        {{ unreadCountDisplay }}
      </span>
      <svg class="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          fill-rule="evenodd"
          clip-rule="evenodd"
          d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
          fill=""
        />
      </svg>
    </button>

    <div
      v-if="dropdownOpen"
      class="fixed sm:absolute right-0 sm:right-auto sm:-right-[240px] lg:right-0 top-[60px] sm:top-auto sm:mt-[17px] flex max-h-[calc(100vh-5rem)] sm:h-[480px] w-[calc(100vw-1rem)] sm:w-[350px] md:w-[361px] flex-col rounded-2xl border border-gray-200 bg-white p-3 sm:p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark z-50"
    >
      <div class="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-800">
        <div class="flex-1 min-w-0">
          <h5 class="text-base sm:text-lg font-semibold text-gray-800 dark:text-white/90">Thông báo</h5>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ unreadCount }} thông báo chưa đọc
          </p>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <button
            v-if="notifications.length"
            class="text-xs text-blue-600 hover:underline dark:text-blue-400 active:text-blue-800 dark:active:text-blue-300 touch-manipulation min-h-[32px] px-2"
            @click.stop="handleMarkAll"
          >
            Đánh dấu đã đọc
          </button>
          <button @click="closeDropdown" class="text-gray-500 dark:text-gray-400 active:text-gray-700 dark:active:text-gray-200 touch-manipulation min-h-[32px] min-w-[32px] flex items-center justify-center">
            <svg class="fill-current w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                fill=""
              />
            </svg>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar">
        <ul v-if="notifications.length">
          <li
            v-for="notification in notifications"
            :key="notification.id"
            class="mb-2 last:mb-0"
          >
            <button
              class="w-full text-left active:bg-gray-50 dark:active:bg-gray-800 touch-manipulation"
              @click="handleNotificationClick(notification)"
            >
              <div
                :class="[
                  'rounded-xl border border-gray-100 p-3 sm:p-3 transition dark:border-gray-800',
                  notification.is_read ? 'bg-white dark:bg-gray-900' : 'bg-blue-50/60 dark:bg-blue-900/20',
                ]"
              >
                <div class="flex items-start justify-between gap-2 sm:gap-3">
                  <div class="flex-1 min-w-0">
                    <p class="font-semibold text-gray-900 text-sm sm:text-sm dark:text-white line-clamp-2">
                      {{ notification.title }}
                    </p>
                    <p v-if="notification.message" class="mt-1 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                      {{ notification.message }}
                    </p>
                  </div>
                  <span class="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 flex-shrink-0 whitespace-nowrap">
                    {{ formatTime(notification.created_at) }}
                  </span>
                </div>
                <div class="mt-2 flex items-center gap-2 text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 flex-wrap">
                  <span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 whitespace-nowrap">
                    {{ getTypeLabel(notification.type) }}
                  </span>
                  <span v-if="notification.data?.ticket_number" class="whitespace-nowrap">
                    #{{ notification.data.ticket_number }}
                  </span>
                </div>
              </div>
            </button>
          </li>
        </ul>

        <div v-else class="flex h-full items-center justify-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 py-8">
          Không có thông báo nào
        </div>
      </div>

      <router-link
        :to="isCustomerRoute ? '/customer/notifications' : '/notifications'"
        class="mt-3 flex justify-center rounded-lg border border-gray-300 bg-white p-3 sm:p-3 text-sm sm:text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 active:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 dark:active:bg-gray-700 touch-manipulation min-h-[44px] sm:min-h-0"
        @click="handleViewAllClick"
      >
        Xem tất cả
      </router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { useNotifications } from '@/composables/useNotifications'
import type { NotificationItem } from '@/services/notificationService'

const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)
const router = useRouter()
const route = useRoute()

const {
  notifications,
  unreadCount,
  markAsRead,
  markAllAsRead,
} = useNotifications()

const hasUnread = computed(() => unreadCount.value > 0)

const unreadCountDisplay = computed(() => {
  if (unreadCount.value > 10) {
    return '...'
  }
  return unreadCount.value.toString()
})

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
  if (!dropdownOpen.value) return
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

const formatTime = (value: string) => {
  const date = new Date(value)
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  })
}

const typeLabels: Record<string, string> = {
  ticket_created: 'Ticket mới',
  ticket_assigned: 'Ticket được giao',
  schedule_assigned: 'Công việc',
}

const getTypeLabel = (type: string) => typeLabels[type] || 'Thông báo'

// Kiểm tra xem có đang ở route customer không
const isCustomerRoute = computed(() => {
  return route.path.startsWith('/customer')
})

const handleNotificationClick = async (notification: NotificationItem) => {
  await markAsRead(notification.id)
  closeDropdown()

  if (notification.entity_type === 'ticket' && notification.entity_id) {
    // Điều hướng đến route phù hợp với context (customer hoặc admin)
    if (isCustomerRoute.value) {
      router.push(`/customer/tickets/${notification.entity_id}`)
    } else {
      router.push(`/tickets/${notification.entity_id}`)
    }
  } else if (notification.entity_type === 'schedule' && notification.entity_id) {
    router.push(`/tasks/${notification.entity_id}`)
  } else if (notification.entity_type === 'schedule') {
    router.push('/calendar')
  }
}

const handleViewAllClick = () => {
  closeDropdown()
}

const handleMarkAll = async () => {
  await markAllAsRead()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
