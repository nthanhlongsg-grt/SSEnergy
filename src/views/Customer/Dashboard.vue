<template>
  <admin-layout>
    <!-- Error Alert -->
    <div
      v-if="error"
      class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 sm:p-4"
    >
      <p class="text-sm sm:text-base text-red-800 dark:text-red-200">{{ error }}</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-8 sm:py-12">
      <div class="text-sm sm:text-base text-gray-500 dark:text-gray-400">{{ t('customers.dashboard.loading') }}</div>
    </div>

    <!-- Metrics Cards -->
    <div v-if="!loading" class="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4 mt-4 sm:mt-6 md:mt-8">
      <!-- Tổng Thiết bị -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ t('customers.dashboard.metrics.totalInverters') }}</p>
            <p class="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {{ metrics.totalInverters }}
            </p>
          </div>
          <div
            class="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 flex-shrink-0 ml-2"
          >
            <BoxCubeIcon class="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
          </div>
        </div>
      </div>

      <!-- Tổng Ticket -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ t('customers.dashboard.metrics.totalTickets') }}</p>
            <p class="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {{ metrics.totalTickets }}
            </p>
          </div>
          <div
            class="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0 ml-2"
          >
            <ChatIcon class="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <div class="mt-3 sm:mt-4 flex items-center text-xs sm:text-sm">
          <span class="text-green-600 dark:text-green-400">
            {{ metrics.activeTickets }} {{ t('customers.dashboard.metrics.activeTickets') }}
          </span>
        </div>
      </div>

      <!-- Ticket Chờ xử lý -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ t('customers.dashboard.metrics.pendingTickets') }}</p>
            <p class="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {{ metrics.pendingTickets }}
            </p>
          </div>
          <div
            class="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900 flex-shrink-0 ml-2"
          >
            <WarningIcon class="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>
      </div>

      <!-- Ticket Đã hoàn thành -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm"
      >
        <div class="flex items-center justify-between">
          <div class="flex-1 min-w-0">
            <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ t('customers.dashboard.metrics.completedTickets') }}</p>
            <p class="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {{ metrics.completedTickets }}
            </p>
          </div>
          <div
            class="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 flex-shrink-0 ml-2"
          >
            <CheckIcon class="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Tickets -->
    <div v-if="!loading" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mt-4 sm:mt-6 md:mt-8">
      <div class="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
            {{ t('customers.dashboard.recentTickets.title') }}
          </h3>
          <router-link
            to="/customer/tickets"
            class="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {{ t('customers.dashboard.recentTickets.viewAll') }}
          </router-link>
        </div>
      </div>

      <div class="px-3 sm:px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <router-link
          to="/customer/tickets/new"
          class="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <PlusIcon class="h-4 w-4 sm:h-5 sm:w-5" />
          <span>{{ t('customers.dashboard.quickActions.createTicket.title') }}</span>
        </router-link>
      </div>
      
      <!-- Desktop Table View -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.dashboard.recentTickets.columns.ticketNumber') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.dashboard.recentTickets.columns.title') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.dashboard.recentTickets.columns.deviceInfo') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.dashboard.recentTickets.columns.supportPerson') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.dashboard.recentTickets.columns.status') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.dashboard.recentTickets.columns.priority') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.dashboard.recentTickets.columns.createdDate') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="recentTickets.length === 0">
              <td colspan="7" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                {{ t('customers.dashboard.recentTickets.empty') }}
              </td>
            </tr>
            <tr
            v-for="ticket in recentTickets"
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
        <div v-if="recentTickets.length === 0" class="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          {{ t('customers.dashboard.recentTickets.empty') }}
        </div>
        <div
          v-for="ticket in recentTickets"
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
              <span class="text-gray-500 dark:text-gray-400 min-w-[80px]">{{ t('customers.dashboard.recentTickets.columns.deviceInfo') }}:</span>
              <span class="text-gray-900 dark:text-white font-medium truncate">
                {{ ticket.inverter_serial || '-' }}
                <span v-if="ticket.inverter_model" class="text-gray-500 dark:text-gray-400">/ {{ ticket.inverter_model }}</span>
              </span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="text-gray-500 dark:text-gray-400 min-w-[80px]">{{ t('customers.dashboard.recentTickets.columns.supportPerson') }}:</span>
              <span class="text-gray-900 dark:text-white truncate">{{ ticket.assigned_to_name || '-' }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="text-gray-500 dark:text-gray-400 min-w-[80px]">{{ t('customers.dashboard.recentTickets.columns.createdDate') }}:</span>
              <span class="text-gray-900 dark:text-white">{{ formatDate(ticket.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Expiring Warranty Devices -->
    <div v-if="!loading" class="rounded-lg bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800/50 shadow-sm overflow-hidden mt-4 sm:mt-6 md:mt-8">
      <div class="p-3 sm:p-4 border-b border-amber-100 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-900/10">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <div>
            <h3 class="text-sm sm:text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <WarningIcon class="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              {{ t('customers.dashboard.expiringWarranty.title') }}
              <span
                v-if="expiringWarrantyDevices.length"
                class="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 rounded-full"
              >
                {{ expiringWarrantyDevices.length }}
              </span>
            </h3>
            <p class="text-xs text-amber-700 dark:text-amber-300 mt-1">
              {{ t('customers.dashboard.expiringWarranty.hint', { days: WARRANTY_WARNING_DAYS }) }}
            </p>
          </div>
          <router-link
            to="/customer/inverters"
            class="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            {{ t('customers.dashboard.expiringWarranty.viewAll') }}
          </router-link>
        </div>
      </div>

      <!-- Desktop Table -->
      <div class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.dashboard.expiringWarranty.columns.serialNumber') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.dashboard.expiringWarranty.columns.model') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.dashboard.expiringWarranty.columns.warrantyEndDate') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.dashboard.expiringWarranty.columns.daysRemaining') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.dashboard.expiringWarranty.columns.warning') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="expiringWarrantyDevices.length === 0">
              <td colspan="5" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                {{ t('customers.dashboard.expiringWarranty.empty') }}
              </td>
            </tr>
            <tr
              v-for="device in expiringWarrantyDevices"
              :key="device.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              @click="router.push(`/customer/inverters/${device.id}`)"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-mono font-medium text-gray-900 dark:text-white">{{ device.serial_number }}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                {{ device.model }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                {{ formatDisplayDate(device.warranty_end_date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="warrantyDaysClass(device.daysRemaining)" class="text-sm font-semibold">
                  {{ t('customers.dashboard.expiringWarranty.daysRemaining', { count: device.daysRemaining }) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="warrantyBadgeClass(device.daysRemaining)" class="px-2 py-1 text-xs rounded-full font-medium">
                  {{ warrantyBadgeLabel(device.daysRemaining) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="md:hidden">
        <div v-if="expiringWarrantyDevices.length === 0" class="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          {{ t('customers.dashboard.expiringWarranty.empty') }}
        </div>
        <div
          v-for="device in expiringWarrantyDevices"
          :key="device.id"
          class="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 active:bg-gray-50 dark:active:bg-gray-700 cursor-pointer"
          @click="router.push(`/customer/inverters/${device.id}`)"
        >
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="min-w-0 flex-1">
              <p class="font-mono text-sm font-semibold text-gray-900 dark:text-white">{{ device.serial_number }}</p>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{{ device.model }}</p>
            </div>
            <span :class="warrantyBadgeClass(device.daysRemaining)" class="px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0">
              {{ warrantyBadgeLabel(device.daysRemaining) }}
            </span>
          </div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span class="text-gray-500 dark:text-gray-400">
              {{ t('customers.dashboard.expiringWarranty.columns.warrantyEndDate') }}:
              <span class="text-gray-900 dark:text-white font-medium">{{ formatDisplayDate(device.warranty_end_date) }}</span>
            </span>
            <span :class="warrantyDaysClass(device.daysRemaining)" class="font-semibold">
              {{ t('customers.dashboard.expiringWarranty.daysRemaining', { count: device.daysRemaining }) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useChangeDetection } from '@/composables/useChangeDetection'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import BoxCubeIcon from '@/icons/BoxCubeIcon.vue'
import ChatIcon from '@/icons/ChatIcon.vue'
import WarningIcon from '@/icons/WarningIcon.vue'
import CheckIcon from '@/icons/CheckIcon.vue'
import PlusIcon from '@/icons/PlusIcon.vue'
import { ticketService } from '@/services/ticketService'
import { inverterService, type Inverter } from '@/services/inverterService'
import { isTicketActive, isTicketClosed } from '@/constants/ticketStatus'
import { useTicketStatus } from '@/composables/useTicketStatus'
import { formatDate as formatDisplayDate, getVietnamDateString } from '@/utils/dateTime'

const WARRANTY_WARNING_DAYS = 45
const WARRANTY_CRITICAL_DAYS = 14

interface ExpiringWarrantyDevice extends Inverter {
  daysRemaining: number
}

const { t } = useI18n()

const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const metrics = ref({
  totalInverters: 0,
  totalTickets: 0,
  activeTickets: 0,
  pendingTickets: 0,
  completedTickets: 0,
})
const recentTickets = ref<any[]>([])
const expiringWarrantyDevices = ref<ExpiringWarrantyDevice[]>([])

function getDaysUntilWarrantyEnd(endDate?: string | null): number | null {
  if (!endDate) return null
  const endStr = endDate.slice(0, 10)
  const todayStr = getVietnamDateString()
  const end = new Date(`${endStr}T00:00:00`)
  const today = new Date(`${todayStr}T00:00:00`)
  if (Number.isNaN(end.getTime()) || Number.isNaN(today.getTime())) return null
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function buildExpiringWarrantyList(inverters: Inverter[]): ExpiringWarrantyDevice[] {
  return inverters
    .map((inv) => ({
      ...inv,
      daysRemaining: getDaysUntilWarrantyEnd(inv.warranty_end_date),
    }))
    .filter(
      (inv): inv is ExpiringWarrantyDevice =>
        inv.daysRemaining !== null &&
        inv.daysRemaining >= 0 &&
        inv.daysRemaining <= WARRANTY_WARNING_DAYS,
    )
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
}

const warrantyDaysClass = (days: number) =>
  days <= WARRANTY_CRITICAL_DAYS
    ? 'text-red-600 dark:text-red-400'
    : 'text-amber-700 dark:text-amber-300'

const warrantyBadgeClass = (days: number) =>
  days <= WARRANTY_CRITICAL_DAYS
    ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'

const warrantyBadgeLabel = (days: number) =>
  days <= WARRANTY_CRITICAL_DAYS
    ? t('customers.dashboard.expiringWarranty.warningCritical')
    : t('customers.dashboard.expiringWarranty.warningSoon')

const loadDashboardData = async () => {
  try {
    loading.value = true
    error.value = null

    // Load inverters
    const invertersResponse = await inverterService.getAllInverters({ limit: 500, page: 1 })
    const inverters = invertersResponse.data || []
    metrics.value.totalInverters = (invertersResponse.pagination as { total?: number })?.total ?? inverters.length
    expiringWarrantyDevices.value = buildExpiringWarrantyList(inverters)

    // Load tickets stats
    const ticketsResponse = await ticketService.getAllTickets({ limit: 100, page: 1 })
    const tickets = ticketsResponse.data || []
    
    metrics.value.totalTickets = tickets.length
    metrics.value.activeTickets = tickets.filter((t: any) => isTicketActive(t.status)).length
    metrics.value.pendingTickets = tickets.filter((t: any) =>
      ['new', 'initialized', 'machine_received', 'assigned'].includes(t.status),
    ).length
    metrics.value.completedTickets = tickets.filter((t: any) => isTicketClosed(t.status)).length

    const openTickets = tickets.filter((t: any) => !isTicketClosed(t.status))
    recentTickets.value = openTickets.slice(0, 5)
  } catch (err: any) {
    console.error('Error loading dashboard:', err)
    error.value = err.message || t('customers.dashboard.error')
  } finally {
    loading.value = false
  }
}

const { getStatusLabel, getStatusClass } = useTicketStatus()
const getStatusColor = getStatusClass

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
    low: t('customers.dashboard.recentTickets.priority.low'),
    medium: t('customers.dashboard.recentTickets.priority.medium'),
    high: t('customers.dashboard.recentTickets.priority.high'),
    urgent: t('customers.dashboard.recentTickets.priority.urgent'),
  }
  return labels[priority] || priority
}

const formatDate = (dateString: string) => formatDisplayDate(dateString) === 'N/A' ? '-' : formatDisplayDate(dateString)

onMounted(() => {
  loadDashboardData()
})

useChangeDetection({
  onTicketChange: () => loadDashboardData(),
})
</script>

