<template>
  <admin-layout v-if="isManagementRoute">
    <div class="px-4 sm:px-0 space-y-6">
      <!-- Search Bar - Mobile -->
      <div class="lg:hidden -mx-4 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <form @submit.prevent="handleNewSearch" class="flex gap-2">
          <div class="relative flex-1">
            <input
              v-model="newSearchQuery"
              type="text"
              :placeholder="t('search.placeholder')"
              ref="searchInput"
              class="w-full h-12 pl-4 pr-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 touch-manipulation"
              @mousedown.stop
              @keyup.enter="handleNewSearch"
            />
          </div>
          <button
            type="submit"
            @click="handleNewSearch"
            class="px-2 py-2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors touch-manipulation min-h-[48px] min-w-[40px] flex items-center justify-center rounded-lg"
          >
            <svg
              class="fill-current text-gray-600 dark:text-gray-400"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                fill=""
              />
            </svg>
          </button>
        </form>
      </div>

      <!-- Search Bar - Desktop -->
      <div class="hidden lg:block">
        <form @submit.prevent="handleNewSearch" class="max-w-2xl">
          <div class="relative">
            <button
              type="button"
              class="absolute -translate-y-1/2 left-4 top-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              @click="handleNewSearch"
            >
              <svg
                class="fill-current"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                  fill=""
                />
              </svg>
            </button>
            <input
              v-model="newSearchQuery"
              type="text"
              :placeholder="t('search.placeholder')"
              ref="desktopSearchInput"
              class="w-full h-11 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-12 pr-4 text-sm text-gray-800 dark:text-white/90 shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              @keyup.enter="handleNewSearch"
            />
          </div>
        </form>
      </div>

      <!-- Header -->
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Kết quả tìm kiếm: "{{ searchQuery }}"
        </h1>
        <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
          Tìm thấy {{ totalResults }} kết quả
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="text-gray-500 dark:text-gray-400">Đang tìm kiếm...</div>
      </div>

      <!-- Error State -->
      <div v-if="error" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
        <p class="text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Results -->
      <div v-if="!loading && !error" class="space-y-6">
        <!-- Tickets Section -->
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tickets ({{ tickets.length }})
          </h2>
          <div v-if="tickets.length === 0" class="text-sm text-gray-500 dark:text-gray-400 py-4">
            Không tìm thấy ticket nào
          </div>
          <div v-else class="space-y-3">
            <router-link
              v-for="ticket in tickets"
              :key="ticket.id"
              :to="`/tickets/${ticket.id}`"
              class="block rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600 touch-manipulation"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-sm font-semibold text-gray-900 dark:text-white">
                      {{ ticket.ticket_number }}
                    </span>
                    <span
                      :class="[
                        'px-2 py-0.5 text-xs font-medium rounded-full',
                        getStatusClass(ticket.status),
                      ]"
                    >
                      {{ getStatusLabel(ticket.status) }}
                    </span>
                  </div>
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">
                    {{ ticket.title }}
                  </h3>
                  <p v-if="ticket.inverter_serial" class="text-xs text-gray-500 dark:text-gray-400">
                    SN: {{ ticket.inverter_serial }}
                  </p>
                  <p v-if="ticket.customer_name" class="text-xs text-gray-500 dark:text-gray-400">
                    Khách hàng: {{ ticket.customer_name }}
                  </p>
                </div>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Devices Section -->
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Thiết bị ({{ devices.length }})
          </h2>
          <div v-if="devices.length === 0" class="text-sm text-gray-500 dark:text-gray-400 py-4">
            Không tìm thấy thiết bị nào
          </div>
          <div v-else class="space-y-3">
            <router-link
              v-for="device in devices"
              :key="device.id"
              :to="`/inverters/${device.id}`"
              class="block rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600 touch-manipulation"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-sm font-semibold text-gray-900 dark:text-white">
                      {{ device.serial_number }}
                    </span>
                    <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {{ device.model }}
                    </span>
                  </div>
                  <p v-if="device.customer_name" class="text-xs text-gray-500 dark:text-gray-400">
                    Khách hàng: {{ device.customer_name }}
                  </p>
                  <p v-if="device.type" class="text-xs text-gray-500 dark:text-gray-400">
                    Loại: {{ device.type }}
                  </p>
                </div>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Customers Section -->
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Khách hàng ({{ customers.length }})
          </h2>
          <div v-if="customers.length === 0" class="text-sm text-gray-500 dark:text-gray-400 py-4">
            Không tìm thấy khách hàng nào
          </div>
          <div v-else class="space-y-3">
            <router-link
              v-for="customer in customers"
              :key="customer.id"
              :to="`/customers/${customer.id}`"
              class="block rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600 touch-manipulation"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                    {{ customer.name }}
                  </h3>
                  <p v-if="customer.email" class="text-xs text-gray-500 dark:text-gray-400">
                    Email: {{ customer.email }}
                  </p>
                  <p v-if="customer.phone" class="text-xs text-gray-500 dark:text-gray-400">
                    Điện thoại: {{ customer.phone }}
                  </p>
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>

  <customer-layout v-else>
    <div class="px-4 sm:px-0 space-y-6">
      <!-- Search Bar - Mobile -->
      <div class="lg:hidden -mx-4 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <form @submit.prevent="handleNewSearch" class="flex gap-2">
          <div class="relative flex-1">
            <input
              v-model="newSearchQuery"
              type="text"
              :placeholder="t('search.placeholder')"
              ref="searchInput"
              class="w-full h-12 pl-4 pr-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 touch-manipulation"
              @mousedown.stop
              @keyup.enter="handleNewSearch"
            />
          </div>
          <button
            type="submit"
            @click="handleNewSearch"
            class="px-2 py-2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors touch-manipulation min-h-[48px] min-w-[40px] flex items-center justify-center rounded-lg"
          >
            <svg
              class="fill-current text-gray-600 dark:text-gray-400"
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                fill=""
              />
            </svg>
          </button>
        </form>
      </div>

      <!-- Search Bar - Desktop -->
      <div class="hidden lg:block">
        <form @submit.prevent="handleNewSearch" class="max-w-2xl">
          <div class="relative">
            <button
              type="button"
              class="absolute -translate-y-1/2 left-4 top-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              @click="handleNewSearch"
            >
              <svg
                class="fill-current"
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
                  fill=""
                />
              </svg>
            </button>
            <input
              v-model="newSearchQuery"
              type="text"
              :placeholder="t('search.placeholder')"
              ref="desktopSearchInput"
              class="w-full h-11 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-2.5 pl-12 pr-4 text-sm text-gray-800 dark:text-white/90 shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400"
              @keyup.enter="handleNewSearch"
            />
          </div>
        </form>
      </div>

      <!-- Header -->
      <div>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          Kết quả tìm kiếm: "{{ searchQuery }}"
        </h1>
        <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
          Tìm thấy {{ totalResults }} kết quả
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="text-gray-500 dark:text-gray-400">Đang tìm kiếm...</div>
      </div>

      <!-- Error State -->
      <div v-if="error" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
        <p class="text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Results -->
      <div v-if="!loading && !error" class="space-y-6">
        <!-- Tickets Section -->
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Tickets ({{ tickets.length }})
          </h2>
          <div v-if="tickets.length === 0" class="text-sm text-gray-500 dark:text-gray-400 py-4">
            Không tìm thấy ticket nào
          </div>
          <div v-else class="space-y-3">
            <router-link
              v-for="ticket in tickets"
              :key="ticket.id"
              :to="`/customer/tickets/${ticket.id}`"
              class="block rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600 touch-manipulation"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-sm font-semibold text-gray-900 dark:text-white">
                      {{ ticket.ticket_number }}
                    </span>
                    <span
                      :class="[
                        'px-2 py-0.5 text-xs font-medium rounded-full',
                        getStatusClass(ticket.status),
                      ]"
                    >
                      {{ getStatusLabel(ticket.status) }}
                    </span>
                  </div>
                  <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-1 line-clamp-2">
                    {{ ticket.title }}
                  </h3>
                  <p v-if="ticket.inverter_serial" class="text-xs text-gray-500 dark:text-gray-400">
                    SN: {{ ticket.inverter_serial }}
                  </p>
                </div>
              </div>
            </router-link>
          </div>
        </div>

        <!-- Devices Section -->
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Thiết bị ({{ devices.length }})
          </h2>
          <div v-if="devices.length === 0" class="text-sm text-gray-500 dark:text-gray-400 py-4">
            Không tìm thấy thiết bị nào
          </div>
          <div v-else class="space-y-3">
            <router-link
              v-for="device in devices"
              :key="device.id"
              :to="`/customer/inverters/${device.id}`"
              class="block rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors active:bg-gray-100 dark:active:bg-gray-600 touch-manipulation"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="text-sm font-semibold text-gray-900 dark:text-white">
                      {{ device.serial_number }}
                    </span>
                    <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      {{ device.model }}
                    </span>
                  </div>
                  <p v-if="device.type" class="text-xs text-gray-500 dark:text-gray-400">
                    Loại: {{ device.type }}
                  </p>
                </div>
              </div>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </customer-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import CustomerLayout from '@/components/layout/CustomerLayout.vue'
import { ticketService, type Ticket } from '@/services/ticketService'
import { inverterService, type Inverter } from '@/services/inverterService'
import { apiClient } from '@/services/api'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const searchQuery = ref('')
const newSearchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const desktopSearchInput = ref<HTMLInputElement | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const tickets = ref<Ticket[]>([])
const devices = ref<Inverter[]>([])
const customers = ref<any[]>([])

const isManagementRoute = computed(() => {
  return !route.path.startsWith('/customer')
})

const totalResults = computed(() => {
  return tickets.value.length + devices.value.length + customers.value.length
})

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    initialized: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    new: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    assigned: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    waiting_parts: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    closed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }
  return classes[status] || classes.initialized
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    initialized: 'Khởi tạo',
    new: 'Khởi tạo',
    in_progress: 'Đang xử lý',
    assigned: 'Đang xử lý',
    waiting_parts: 'Chờ linh kiện',
    pending: 'Chờ xử lý',
    completed: 'Hoàn thành',
    closed: 'Đã đóng',
  }
  return labels[status] || status
}

const searchAll = async () => {
  if (!searchQuery.value.trim()) {
    tickets.value = []
    devices.value = []
    customers.value = []
    return
  }

  loading.value = true
  error.value = null

  try {
    // Search tickets
    try {
      const ticketsResult = await ticketService.getAllTickets({
        search: searchQuery.value,
        limit: 50,
      })
      tickets.value = ticketsResult.data || []
    } catch (err) {
      console.error('Error searching tickets:', err)
      tickets.value = []
    }

    // Search devices (inverters)
    try {
      const devicesResult = await inverterService.getAllInverters({
        search: searchQuery.value,
        limit: 50,
      })
      devices.value = devicesResult.data || []
    } catch (err) {
      console.error('Error searching devices:', err)
      devices.value = []
    }

    // Search customers (only for management route)
    if (isManagementRoute.value) {
      try {
        const customersResponse = await apiClient.get(`/customers?search=${encodeURIComponent(searchQuery.value)}`)
        if (customersResponse.error) {
          throw new Error(customersResponse.error)
        }
        customers.value = Array.isArray(customersResponse.data) ? customersResponse.data : []
      } catch (err) {
        console.error('Error searching customers:', err)
        customers.value = []
      }
    } else {
      customers.value = []
    }
  } catch (err) {
    console.error('Search error:', err)
    error.value = err instanceof Error ? err.message : 'Không thể thực hiện tìm kiếm'
  } finally {
    loading.value = false
  }
}

const handleNewSearch = () => {
  if (!newSearchQuery.value.trim()) return
  
  // Update route with new search query
  router.push({
    path: route.path,
    query: { q: newSearchQuery.value.trim() }
  })
}

// Watch for route query changes to reload search results
watch(
  () => route.query.q,
  (newQuery) => {
    if (newQuery) {
      const queryString = typeof newQuery === 'string' ? newQuery : (Array.isArray(newQuery) ? newQuery[0] : String(newQuery || ''))
      if (queryString) {
        searchQuery.value = queryString
        newSearchQuery.value = queryString
        searchAll()
      }
    }
  },
  { immediate: true }
)

onMounted(() => {
  const query = route.query.q as string
  if (query) {
    searchQuery.value = query
    newSearchQuery.value = query
    searchAll()
  }
})
</script>

