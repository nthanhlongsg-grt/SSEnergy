<template>
  <admin-layout>
    <div class="space-y-4 sm:space-y-6">
      <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
      <div class="flex-1 min-w-0">
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('customers.tickets.list.header.title') }}
        </h1>
        <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
          {{ t('customers.tickets.list.header.subtitle') }}
        </p>
      </div>
      <router-link
        to="/customer/tickets/new"
        class="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base whitespace-nowrap w-full sm:w-auto justify-center"
      >
        <PlusIcon class="h-4 w-4 sm:h-5 sm:w-5" />
        <span>{{ t('customers.tickets.list.actions.createNew') }}</span>
      </router-link>
    </div>

    <!-- Filters -->
    <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            {{ t('customers.tickets.list.filters.search') }}
          </label>
          <input
            v-model="filters.search"
            type="text"
            :placeholder="t('customers.tickets.list.filters.searchPlaceholder')"
            class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            {{ t('customers.tickets.list.filters.status') }}
          </label>
          <select
            v-model="filters.status"
            class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">{{ t('customers.tickets.list.filters.all') }}</option>
            <option value="initialized">{{ t('customers.tickets.list.status.initialized') }}</option>
            <option value="in_progress">{{ t('customers.tickets.list.status.in_progress') }}</option>
            <option value="completed">{{ t('customers.tickets.list.status.completed') }}</option>
            <option value="closed">{{ t('customers.tickets.list.status.closed') }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            {{ t('customers.tickets.list.filters.priority') }}
          </label>
          <select
            v-model="filters.priority"
            class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">{{ t('customers.tickets.list.filters.all') }}</option>
            <option value="low">{{ t('customers.tickets.list.priority.low') }}</option>
            <option value="medium">{{ t('customers.tickets.list.priority.medium') }}</option>
            <option value="high">{{ t('customers.tickets.list.priority.high') }}</option>
            <option value="urgent">{{ t('customers.tickets.list.priority.urgent') }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <!-- Desktop Table View -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.tickets.list.table.columns.ticketNumber') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.tickets.list.table.columns.title') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.tickets.list.table.columns.deviceInfo') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.tickets.list.table.columns.supportPerson') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.tickets.list.table.columns.status') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.tickets.list.table.columns.priority') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.tickets.list.table.columns.createdDate') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="loading">
              <td colspan="7" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                {{ t('customers.tickets.list.table.loading') }}
              </td>
            </tr>
            <tr v-else-if="error">
              <td colspan="7" class="px-6 py-8 text-center text-red-500 dark:text-red-400">
                {{ error }}
              </td>
            </tr>
            <tr v-else-if="tickets.length === 0">
              <td colspan="7" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                {{ t('customers.tickets.list.table.empty') }} <router-link to="/customer/tickets/new" class="text-blue-600 hover:underline">{{ t('customers.tickets.list.table.createNow') }}</router-link>
              </td>
            </tr>
            <tr
              v-for="ticket in tickets"
              :key="ticket.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              @click="router.push(`/customer/tickets/${ticket.id}`)"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ ticket.ticket_number }}
                </span>
              </td>
              <td class="px-6 py-4">
                <span class="text-gray-900 dark:text-white">{{ ticket.title }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm">
                  <span class="text-gray-900 dark:text-white font-medium">{{ ticket.inverter_serial || '-' }}</span>
                  <span v-if="ticket.inverter_model" class="text-gray-500 dark:text-gray-400 ml-2">/ {{ ticket.inverter_model }}</span>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-gray-900 dark:text-white text-sm">{{ ticket.assigned_to_name || '-' }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-2 py-1 text-xs rounded-full',
                    getStatusColor(ticket.status)
                  ]"
                >
                  {{ getStatusLabel(ticket.status) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-2 py-1 text-xs rounded-full',
                    getPriorityColor(ticket.priority)
                  ]"
                >
                  {{ getPriorityLabel(ticket.priority) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(ticket.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden">
        <div v-if="loading" class="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          {{ t('customers.tickets.list.table.loading') }}
        </div>
        <div v-else-if="error" class="p-6 text-center text-red-500 dark:text-red-400 text-sm">
          {{ error }}
        </div>
        <div v-else-if="tickets.length === 0" class="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          {{ t('customers.tickets.list.table.empty') }}
          <router-link to="/customer/tickets/new" class="block mt-2 text-blue-600 hover:underline">
            {{ t('customers.tickets.list.table.createNow') }}
          </router-link>
        </div>
        <div
          v-for="ticket in tickets"
          :key="ticket.id"
          class="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 active:bg-gray-50 dark:active:bg-gray-700 cursor-pointer"
          @click="router.push(`/customer/tickets/${ticket.id}`)"
        >
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ ticket.title }}</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ ticket.ticket_number }}</p>
            </div>
            <div class="flex flex-col items-end gap-1 flex-shrink-0">
              <span
                :class="[
                  'px-2 py-0.5 text-xs rounded-full whitespace-nowrap',
                  getStatusColor(ticket.status)
                ]"
              >
                {{ getStatusLabel(ticket.status) }}
              </span>
              <span
                :class="[
                  'px-2 py-0.5 text-xs rounded-full whitespace-nowrap',
                  getPriorityColor(ticket.priority)
                ]"
              >
                {{ getPriorityLabel(ticket.priority) }}
              </span>
            </div>
          </div>
          <div class="space-y-1.5 mt-2">
            <div class="flex items-center gap-2 text-xs">
              <span class="text-gray-500 dark:text-gray-400 min-w-[80px]">{{ t('customers.tickets.list.table.columns.deviceInfo') }}:</span>
              <span class="text-gray-900 dark:text-white font-medium truncate">
                {{ ticket.inverter_serial || '-' }}
                <span v-if="ticket.inverter_model" class="text-gray-500 dark:text-gray-400">/ {{ ticket.inverter_model }}</span>
              </span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="text-gray-500 dark:text-gray-400 min-w-[80px]">{{ t('customers.tickets.list.table.columns.supportPerson') }}:</span>
              <span class="text-gray-900 dark:text-white truncate">{{ ticket.assigned_to_name || '-' }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="text-gray-500 dark:text-gray-400 min-w-[80px]">{{ t('customers.tickets.list.table.columns.createdDate') }}:</span>
              <span class="text-gray-900 dark:text-white">{{ formatDate(ticket.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useChangeDetection } from '@/composables/useChangeDetection'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PlusIcon from '@/icons/PlusIcon.vue'
import { ticketService } from '@/services/ticketService'

const router = useRouter()

const { t } = useI18n()

const loading = ref(true)
const error = ref<string | null>(null)
const tickets = ref<any[]>([])
const filters = ref({
  search: '',
  status: '',
  priority: '',
})

const loadTickets = async () => {
  try {
    loading.value = true
    error.value = null

    const response = await ticketService.getAllTickets({
      search: filters.value.search || undefined,
      status: filters.value.status || undefined,
      priority: filters.value.priority || undefined,
      limit: 100,
      page: 1,
    })

    tickets.value = response.data || []
  } catch (err: any) {
    console.error('Error loading tickets:', err)
    error.value = err.message || t('customers.tickets.list.messages.loadError')
  } finally {
    loading.value = false
  }
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    initialized: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    initialized: t('customers.tickets.list.status.initialized'),
    in_progress: t('customers.tickets.list.status.in_progress'),
    completed: t('customers.tickets.list.status.completed'),
    closed: t('customers.tickets.list.status.closed'),
  }
  return labels[status] || status
}

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    high: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return colors[priority] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    low: t('customers.tickets.list.priority.low'),
    medium: t('customers.tickets.list.priority.medium'),
    high: t('customers.tickets.list.priority.high'),
    urgent: t('customers.tickets.list.priority.urgent'),
  }
  return labels[priority] || priority
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN')
}

onMounted(() => {
  loadTickets()
})

useChangeDetection({
  onTicketChange: async () => {
    if (!loading.value) await loadTickets()
  },
})

// Fallback polling every 30s
const { stop: stopAutoRefresh } = useAutoRefresh({
  interval: 30000,
  fetchFn: async () => {
    if (!loading.value) await loadTickets()
  },
  pauseWhenHidden: true,
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

