<template>
  <customer-layout>
    <div class="space-y-4 sm:space-y-6 overflow-x-hidden">
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
        class="flex items-center gap-2 px-3 sm:px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors text-sm sm:text-base whitespace-nowrap w-full sm:w-auto justify-center touch-manipulation"
      >
        <PlusIcon class="h-4 w-4 sm:h-5 sm:w-5" />
        <span>{{ t('customers.tickets.list.actions.createNew') }}</span>
      </router-link>
    </div>

    <!-- Filters -->
    <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm">
      <div class="flex flex-col lg:flex-row lg:flex-wrap lg:items-end gap-3 sm:gap-4">
        <div class="w-full lg:flex-1 lg:min-w-[12rem]">
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            {{ t('customers.tickets.list.filters.search') }}
          </label>
          <input
            v-model="filters.search"
            type="text"
            :placeholder="t('customers.tickets.list.filters.searchPlaceholder')"
            class="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div class="w-full sm:w-auto sm:min-w-[10rem]">
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            {{ t('customers.tickets.list.filters.period') }}
          </label>
          <select
            v-model="datePeriodType"
            class="w-full px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            @change="onDatePeriodChange"
          >
            <option value="">{{ t('reports.filters.types.all') }}</option>
            <option value="month">{{ t('reports.filters.types.month') }}</option>
            <option value="year">{{ t('reports.filters.types.year') }}</option>
            <option value="custom">{{ t('reports.filters.types.custom') }}</option>
          </select>
        </div>
        <template v-if="datePeriodType">
          <div class="w-full sm:w-auto sm:min-w-[9rem]">
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              {{ t('reports.filters.placeholders.fromDate') }}
            </label>
            <flat-pickr
              v-model="dateRange.from"
              :config="datePickerConfig"
              class="w-full sm:w-[9rem] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="t('reports.filters.placeholders.fromDate')"
            />
          </div>
          <div class="w-full sm:w-auto sm:min-w-[9rem]">
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              {{ t('reports.filters.placeholders.toDate') }}
            </label>
            <flat-pickr
              v-model="dateRange.to"
              :config="datePickerConfig"
              class="w-full sm:w-[9rem] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              :placeholder="t('reports.filters.placeholders.toDate')"
            />
          </div>
          <div class="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              type="button"
              class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
              :disabled="!dateRange.from || !dateRange.to"
              @click="applyDateFilter"
            >
              {{ t('reports.filters.apply') }}
            </button>
            <button
              v-if="dateFilterActive"
              type="button"
              class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              @click="clearDateFilter"
            >
              {{ t('dashboard.filters.clear') }}
            </button>
          </div>
        </template>
      </div>
    </div>

    <!-- Table -->
    <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
      <!-- Desktop Table View -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full text-xs" style="table-layout: fixed; width: 100%;">
          <colgroup>
            <col class="w-[14%]" />
            <col class="w-[18%]" />
            <col class="w-[16%]" />
            <col class="w-[14%]" />
            <col class="w-[10%]" />
            <col class="w-[10%]" />
            <col class="w-[10%]" />
          </colgroup>
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-2 py-2 text-left text-[11px] font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.tickets.list.table.columns.ticketNumber') }}
              </th>
              <th class="px-2 py-2 text-left text-[11px] font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.tickets.list.table.columns.title') }}
              </th>
              <th class="px-2 py-2 text-left text-[11px] font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.tickets.list.table.columns.deviceInfo') }}
              </th>
              <th class="px-2 py-2 text-left text-[11px] font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.tickets.list.table.columns.supportPerson') }}
              </th>
              <th class="px-2 py-2 text-left text-[11px] font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.tickets.list.table.columns.status') }}
              </th>
              <th class="px-2 py-2 text-left text-[11px] font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.tickets.list.table.columns.priority') }}
              </th>
              <th class="px-2 py-2 text-left text-[11px] font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.tickets.list.table.columns.createdDate') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="loading">
              <td colspan="7" class="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                {{ t('customers.tickets.list.table.loading') }}
              </td>
            </tr>
            <tr v-else-if="error">
              <td colspan="7" class="px-3 py-6 text-center text-red-500 dark:text-red-400">
                {{ error }}
              </td>
            </tr>
            <tr v-else-if="tickets.length === 0">
              <td colspan="7" class="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                {{ t('customers.tickets.list.table.empty') }} <router-link to="/customer/tickets/new" class="text-blue-600 hover:underline">{{ t('customers.tickets.list.table.createNow') }}</router-link>
              </td>
            </tr>
            <tr
              v-for="ticket in tickets"
              :key="ticket.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              @click="router.push(`/customer/tickets/${ticket.id}`)"
            >
              <td class="px-2 py-2 align-middle min-w-0">
                <span
                  class="block font-medium text-blue-600 dark:text-blue-400 font-mono truncate"
                  :title="ticket.ticket_number"
                >
                  {{ ticket.ticket_number }}
                </span>
              </td>
              <td class="px-2 py-2 align-middle min-w-0">
                <span class="block truncate text-gray-900 dark:text-white" :title="ticket.title">
                  {{ ticket.title }}
                </span>
              </td>
              <td class="px-2 py-2 align-middle min-w-0">
                <p
                  class="truncate font-medium text-gray-900 dark:text-white font-mono"
                  :title="ticket.inverter_serial || undefined"
                >
                  {{ ticket.inverter_serial || '-' }}
                </p>
                <p
                  v-if="ticket.inverter_model"
                  class="truncate text-[11px] text-gray-500 dark:text-gray-400"
                  :title="ticket.inverter_model"
                >
                  {{ ticket.inverter_model }}
                </p>
              </td>
              <td class="px-2 py-2 align-middle min-w-0 text-gray-900 dark:text-white">
                <span class="block truncate" :title="ticket.assigned_to_name || '-'">
                  {{ ticket.assigned_to_name || '-' }}
                </span>
              </td>
              <td class="px-2 py-2 align-middle">
                <span
                  :class="[
                    'inline-block max-w-full truncate px-1.5 py-0.5 text-[10px] font-semibold rounded-full',
                    getStatusColor(ticket.status)
                  ]"
                  :title="getStatusLabel(ticket.status)"
                >
                  {{ getStatusLabel(ticket.status) }}
                </span>
              </td>
              <td class="px-2 py-2 align-middle">
                <span
                  :class="[
                    'inline-block max-w-full truncate px-1.5 py-0.5 text-[10px] font-semibold rounded-full',
                    getPriorityColor(ticket.priority)
                  ]"
                  :title="getPriorityLabel(ticket.priority)"
                >
                  {{ getPriorityLabel(ticket.priority) }}
                </span>
              </td>
              <td class="px-2 py-2 align-middle whitespace-nowrap text-gray-500 dark:text-gray-400">
                {{ formatDate(ticket.created_at) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden space-y-3 p-3 sm:p-0">
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
          class="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm active:bg-gray-50 dark:active:bg-gray-700/50 cursor-pointer touch-manipulation"
          @click="router.push(`/customer/tickets/${ticket.id}`)"
        >
          <div class="flex items-start justify-between gap-2 mb-1.5">
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white truncate" :title="ticket.title">{{ ticket.title }}</h4>
              <p class="text-xs text-blue-600 dark:text-blue-400 font-mono truncate mt-0.5" :title="ticket.ticket_number">{{ ticket.ticket_number }}</p>
            </div>
            <div class="flex flex-col items-end gap-1 flex-shrink-0">
              <span
                :class="[
                  'px-1.5 py-0.5 text-[10px] font-semibold rounded-full whitespace-nowrap max-w-[5.5rem] truncate',
                  getStatusColor(ticket.status)
                ]"
                :title="getStatusLabel(ticket.status)"
              >
                {{ getStatusLabel(ticket.status) }}
              </span>
              <span
                :class="[
                  'px-1.5 py-0.5 text-[10px] font-semibold rounded-full whitespace-nowrap max-w-[5.5rem] truncate',
                  getPriorityColor(ticket.priority)
                ]"
                :title="getPriorityLabel(ticket.priority)"
              >
                {{ getPriorityLabel(ticket.priority) }}
              </span>
            </div>
          </div>
          <div class="space-y-1 mt-1.5">
            <div class="flex items-center gap-2 text-xs min-w-0">
              <span class="text-gray-500 dark:text-gray-400 flex-shrink-0">{{ t('customers.tickets.list.table.columns.deviceInfo') }}:</span>
              <span class="text-gray-900 dark:text-white truncate min-w-0" :title="[ticket.inverter_serial, ticket.inverter_model].filter(Boolean).join(' / ')">
                <span class="font-mono font-medium">{{ ticket.inverter_serial || '-' }}</span>
                <span v-if="ticket.inverter_model" class="text-gray-500 dark:text-gray-400"> / {{ ticket.inverter_model }}</span>
              </span>
            </div>
            <div class="flex items-center gap-2 text-xs min-w-0">
              <span class="text-gray-500 dark:text-gray-400 flex-shrink-0">{{ t('customers.tickets.list.table.columns.supportPerson') }}:</span>
              <span class="text-gray-900 dark:text-white truncate min-w-0" :title="ticket.assigned_to_name || '-'">{{ ticket.assigned_to_name || '-' }}</span>
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
  </customer-layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { POLL } from '@/utils/pollInterval'
import { useChangeDetection } from '@/composables/useChangeDetection'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { useFlatpickrConfig } from '@/composables/useFlatpickr'
import { getVietnamFullMonthRange, getVietnamYearRange } from '@/utils/dateTime'
import CustomerLayout from '@/components/layout/CustomerLayout.vue'
import PlusIcon from '@/icons/PlusIcon.vue'
import { ticketService } from '@/services/ticketService'

const router = useRouter()

const { t } = useI18n()
const { dateConfig } = useFlatpickrConfig()
const datePickerConfig = dateConfig

const loading = ref(true)
const error = ref<string | null>(null)
const tickets = ref<any[]>([])
const filters = ref({
  search: '',
})

type DatePeriodType = '' | 'month' | 'year' | 'custom'
const datePeriodType = ref<DatePeriodType>('')
const dateRange = reactive({ from: '', to: '' })
const appliedDateRange = reactive({ from: '', to: '' })
const dateFilterActive = computed(() => Boolean(appliedDateRange.from && appliedDateRange.to))

const initializeDateRange = () => {
  switch (datePeriodType.value) {
    case 'month':
      Object.assign(dateRange, getVietnamFullMonthRange())
      break
    case 'year':
      Object.assign(dateRange, getVietnamYearRange())
      break
    case 'custom':
      if (!dateRange.from || !dateRange.to) {
        Object.assign(dateRange, getVietnamYearRange())
      }
      break
    default:
      dateRange.from = ''
      dateRange.to = ''
  }
}

const onDatePeriodChange = () => {
  if (!datePeriodType.value) {
    clearDateFilter()
    return
  }
  initializeDateRange()
  if (datePeriodType.value !== 'custom') {
    applyDateFilter()
  }
}

const applyDateFilter = () => {
  if (!datePeriodType.value || !dateRange.from || !dateRange.to) return
  appliedDateRange.from = dateRange.from
  appliedDateRange.to = dateRange.to
  loadTickets()
}

const clearDateFilter = () => {
  datePeriodType.value = ''
  dateRange.from = ''
  dateRange.to = ''
  appliedDateRange.from = ''
  appliedDateRange.to = ''
  loadTickets()
}

const loadTickets = async () => {
  try {
    loading.value = true
    error.value = null

    const response = await ticketService.getAllTickets({
      search: filters.value.search || undefined,
      from: appliedDateRange.from || undefined,
      to: appliedDateRange.to || undefined,
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

let searchDebounce: ReturnType<typeof setTimeout> | null = null
watch(() => filters.value.search, () => {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(() => loadTickets(), 300)
})

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
  interval: POLL.listRefresh(),
  fetchFn: async () => {
    if (!loading.value) await loadTickets()
  },
  pauseWhenHidden: true,
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

