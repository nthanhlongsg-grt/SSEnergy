<template>
  <admin-layout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <div class="flex items-center gap-3">
          <button
            @click="$router.back()"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg
              class="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ customer?.name || t('customers.detail.loading') }}
            </h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">
              {{ customer ? getTypeLabel(customer?.type) : '' }}
            </p>
          </div>
        </div>
        <button
          v-if="customer"
          @click="openEditModal"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Chỉnh sửa
        </button>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
      >
        <p class="text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400">{{ t('customers.detail.loading') }}</p>
      </div>

      <div v-if="!loading && customer" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Customer Info -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('customers.detail.customerInfo') }}
            </h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('customers.detail.fields.name') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white">{{ customer?.name }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('customers.detail.fields.type') }}
                </label>
                <p class="mt-1">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      getTypeClass(customer?.type),
                    ]"
                  >
                    {{ getTypeLabel(customer?.type) }}
                  </span>
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('customers.detail.fields.email') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white">{{ customer?.email }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('customers.detail.fields.phone') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white">{{ customer?.phone }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('customers.detail.fields.contactPerson') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white">
                  {{ customer?.contactPerson || t('common.na') }}
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('customers.detail.fields.distributor') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white">
                  {{ customer?.distributor || t('common.na') }}
                </p>
              </div>
              <div class="col-span-2">
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('customers.detail.fields.address') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white">
                  {{ customer?.address || t('common.na') }}{{ customer?.province ? `, ${customer.province}` : '' }}
                </p>
              </div>
              <div v-if="customer?.organization" class="col-span-2">
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('customers.detail.fields.organization') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white">
                  {{ customer.organization }}
                </p>
              </div>
            </div>
          </div>

          <!-- Projects -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ t('customers.detail.projects.title') }} ({{ projects.length }})
              </h2>
              <button
                @click="showAddProjectModal = true"
                class="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + {{ t('customers.detail.projects.add') }}
              </button>
            </div>
            <div class="space-y-3">
              <div
                v-for="project in projects"
                :key="project.id"
                class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                @click="viewProject(project.id)"
              >
                <div class="flex justify-between items-start">
                  <div>
                    <p class="font-medium text-gray-900 dark:text-white">
                      {{ project.name }}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {{ project.address }}
                    </p>
                    <div class="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{{ project.inverterCount }} {{ t('customers.detail.projects.deviceCount') }}</span>
                      <span>{{ project.capacity }} kWp</span>
                      <span>{{ t('customers.detail.projects.installedDate') }} {{ formatDate(project.installedDate) }}</span>
                    </div>
                  </div>
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      project.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
                    ]"
                  >
                    {{ project.status === 'active' ? t('customers.detail.projects.statusActive') : t('customers.detail.projects.statusInactive') }}
                  </span>
                </div>
              </div>
              <div v-if="projects.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
                {{ t('customers.detail.projects.empty') }}
              </div>
            </div>
          </div>

          <!-- Inverters -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('customers.detail.inverters.title') }} ({{ inverters.length }})
            </h2>
            <div class="overflow-y-auto max-h-[500px]">
              <table class="w-full">
                <thead class="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      {{ t('customers.detail.inverters.columns.serial') }}
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      {{ t('customers.detail.inverters.columns.model') }}
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      {{ t('customers.detail.inverters.columns.project') }}
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      {{ t('customers.detail.inverters.columns.warranty') }}
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      {{ t('customers.detail.inverters.columns.status') }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr
                    v-for="inverter in inverters"
                    :key="inverter.id"
                    class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    @click="$router.push(`/inverters/${inverter.id}`)"
                  >
                    <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {{ inverter.serialNumber }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {{ inverter.model }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {{ inverter.projectName }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {{ formatDate(inverter.warrantyExpiry) }}
                    </td>
                    <td class="px-4 py-3">
                      <span
                        :class="[
                          'px-2 py-1 text-xs font-semibold rounded-full',
                          getWarrantyStatusClass(inverter.warrantyStatus),
                        ]"
                      >
                        {{ getWarrantyStatusLabel(inverter.warrantyStatus) }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="inverters.length === 0">
                    <td colspan="5" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {{ t('customers.detail.inverters.empty') }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Tickets History -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('customers.detail.tickets.title') }} ({{ tickets.length }})
            </h2>
            <div class="space-y-2">
              <div
                v-for="ticket in tickets"
                :key="ticket.id"
                class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                @click="$router.push(`/tickets/${ticket.id}`)"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    #{{ ticket.ticketNumber }} - {{ ticket.title || ticket.errorType }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ formatDate(ticket.createdAt) }}
                  </p>
                </div>
                <span
                  :class="[
                    'px-2 py-1 text-xs font-semibold rounded-full',
                    getTicketStatusClass(ticket.status),
                  ]"
                >
                  {{ getTicketStatusLabel(ticket.status) }}
                </span>
              </div>
              <div v-if="tickets.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400">
                {{ t('customers.detail.tickets.empty') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Summary Stats -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('customers.detail.stats.title') }}
            </h2>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('customers.detail.stats.totalProjects') }}
                </label>
                <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {{ projects.length }}
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('customers.detail.stats.totalDevices') }}
                </label>
                <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {{ inverters.length }}
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('customers.detail.stats.totalCapacity') }}
                </label>
                <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {{ totalCapacity }} kWp
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('customers.detail.stats.activeTickets') }}
                </label>
                <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {{ activeTicketsCount }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Customer Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 z-50 flex items-start justify-center bg-gray-700/45 dark:bg-gray-900/65 overflow-y-auto pt-8 pb-8"
      @click.self="showEditModal = false"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8"
      >
        <div class="p-6 max-h-[85vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ t('customers.detail.editModal.title') }}
            </h2>
            <button
              @click="closeEditModal"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form @submit.prevent="saveCustomer">
            <!-- Error Message -->
            <div v-if="editError" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p class="text-sm text-red-800 dark:text-red-200">{{ editError }}</p>
            </div>
            
            <!-- Success Message -->
            <div v-if="editSuccessMessage" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p class="text-sm text-green-800 dark:text-green-200">{{ editSuccessMessage }}</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('customers.detail.editModal.name') }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="editForm.name"
                  type="text"
                  required
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('customers.detail.editModal.email') }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="editForm.email"
                  type="email"
                  required
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('customers.detail.editModal.phone') }}
                </label>
                <input
                  v-model="editForm.phone"
                  type="tel"
                  placeholder="0901234567"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('customers.detail.editModal.organization') }}
                </label>
                <input
                  v-model="editForm.organization"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('customers.detail.editModal.address') }}
                </label>
                <input
                  v-model="editForm.address"
                  type="text"
                  :placeholder="t('customers.detail.editModal.addressPlaceholder')"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div v-if="customer?.source === 'user'" class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('customers.detail.editModal.role') }}
                </label>
                <select
                  v-model="editForm.role"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  disabled
                >
                  <option value="end_user">{{ t('customers.detail.editModal.roleOptions.endUser') }}</option>
                  <option value="distributor">{{ t('customers.detail.editModal.roleOptions.distributor') }}</option>
                  <option value="dealer">{{ t('customers.detail.editModal.roleOptions.dealer') }}</option>
                </select>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('customers.detail.editModal.roleCannotChange') }}</p>
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button
                type="button"
                @click="closeEditModal"
                class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                {{ t('customers.detail.editModal.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ saving ? t('customers.detail.editModal.saving') : t('customers.detail.editModal.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { apiClient } from '@/services/api'

const route = useRoute()
const { t } = useI18n()
const showEditModal = ref(false)
const showAddProjectModal = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const editError = ref<string | null>(null)
const editSuccessMessage = ref<string | null>(null)

const customer = ref<any>(null)
const projects = ref<any[]>([])
const inverters = ref<any[]>([])
const tickets = ref<any[]>([])

const editForm = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  organization: '',
  role: '',
})

const totalCapacity = computed(() => {
  // Calculate from inverters instead of projects
  return inverters.value.reduce((sum, inv) => {
    // Use capacity from model (model_capacity) or fallback to power_rating
    const capacity = inv.capacity || inv.powerRating || 0
    return sum + (typeof capacity === 'number' ? capacity : parseFloat(String(capacity)) || 0)
  }, 0)
})

const activeTicketsCount = computed(() => {
  return tickets.value.filter(
    (t) => t.status !== 'completed' && t.status !== 'closed' && t.status !== 'initialized'
  ).length
})

const getTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    end_user: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    distributor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    dealer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }
  return classes[type] || classes.end_user
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    end_user: t('customers.list.typeOptions.endUser'),
    distributor: t('customers.list.typeOptions.distributor'),
    dealer: t('customers.list.typeOptions.dealer'),
  }
  return labels[type] || type
}

const getWarrantyStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  }
  return classes[status] || classes.pending
}

const getWarrantyStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: t('tickets.detail.labels.warrantyStatus.active'),
    expired: t('tickets.detail.labels.warrantyStatus.expired'),
    pending: t('tickets.detail.labels.warrantyStatus.pending'),
  }
  return labels[status] || status
}

const getTicketStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    initialized: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    // Legacy statuses
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    assigned: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    waiting_parts: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }
  return classes[status] || classes.initialized
}

const getTicketStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    initialized: t('tickets.list.statusLabels.initialized'),
    in_progress: t('tickets.list.statusLabels.in_progress'),
    closed: t('tickets.list.statusLabels.closed'),
    // Legacy statuses
    new: t('tickets.list.statusLabels.new'),
    assigned: t('tickets.list.statusLabels.assigned'),
    waiting_parts: t('tickets.list.statusLabels.waiting_parts'),
    completed: t('tickets.list.statusLabels.completed'),
  }
  return labels[status] || status
}

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return t('common.na')
  const dateObj = date instanceof Date ? date : new Date(date)
  if (isNaN(dateObj.getTime())) return t('common.na')
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj)
}

const viewProject = (projectId: number) => {
  // TODO: Navigate to project detail
  console.log('View project:', projectId)
}

const loadCustomer = async () => {
  loading.value = true
  error.value = null
  try {
    const customerId = route.params.id as string
    const response = await apiClient.get(`/customers/${customerId}`)
    
    if (response.error) {
      throw new Error(response.error)
    }

    const data = response.data as any
    customer.value = {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      type: data.type || data.customer_type,
      organization: data.organization,
      code: data.code,
      contactPerson: data.contact_person,
      distributor: data.distributor,
      province: data.province,
    }

    // Process inverters from API
    inverters.value = (data.inverters || []).map((inv: any) => ({
      id: inv.id,
      serialNumber: inv.serial_number,
      model: inv.model,
      type: inv.type,
      powerRating: inv.power_rating,
      capacity: inv.model_capacity || inv.capacity || inv.power_rating || 0, // Get capacity from model or fallback to power_rating
      projectName: inv.project_name || 'N/A',
      warrantyExpiry: inv.warranty_end_date ? new Date(inv.warranty_end_date) : null,
      warrantyStatus: getWarrantyStatus(inv.warranty_end_date),
    }))

    // Process tickets from API
    tickets.value = (data.tickets || []).map((ticket: any) => ({
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      errorType: ticket.category || ticket.error_type || 'N/A',
      status: ticket.status,
      createdAt: ticket.created_at ? new Date(ticket.created_at) : null,
      title: ticket.title,
    }))

    // Projects are not yet in the API, keep empty for now
    projects.value = []
  } catch (err) {
    console.error('Error loading customer:', err)
    error.value = err instanceof Error ? err.message : t('customers.detail.messages.loadError')
  } finally {
    loading.value = false
  }
}

const getWarrantyStatus = (warrantyEndDate: string | null | undefined): string => {
  if (!warrantyEndDate) return 'pending'
  const endDate = new Date(warrantyEndDate)
  const today = new Date()
  if (endDate < today) return 'expired'
  return 'active'
}

const openEditModal = () => {
  if (customer.value) {
    editForm.value = {
      name: customer.value.name || '',
      email: customer.value.email || '',
      phone: customer.value.phone || '',
      address: customer.value.address || '',
      organization: customer.value.organization || '',
      role: customer.value.type || customer.value.customer_type || '',
    }
    editError.value = null
    editSuccessMessage.value = null
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editError.value = null
  editSuccessMessage.value = null
  editForm.value = {
    name: '',
    email: '',
    phone: '',
    address: '',
    organization: '',
    role: '',
  }
}

const saveCustomer = async () => {
  if (!customer.value) return
  
  saving.value = true
  editError.value = null
  editSuccessMessage.value = null
  
  try {
    const customerId = route.params.id as string
    
    // Determine if customer is from users table or customers table
    const isUserSource = customer.value.source === 'user' || !customer.value.source
    
    if (isUserSource) {
      // Update user in users table
      const response = await apiClient.put(`/users/${customerId}`, {
        name: editForm.value.name,
        email: editForm.value.email,
        phone: editForm.value.phone || null,
        address: editForm.value.address || null,
        organization: editForm.value.organization || null,
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
    } else {
      // Update customer in customers table
      const response = await apiClient.put(`/customers/${customerId}`, {
        name: editForm.value.name,
        email: editForm.value.email,
        phone: editForm.value.phone || null,
        address: editForm.value.address || null,
        organization: editForm.value.organization || null,
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
    }
    
    editSuccessMessage.value = t('customers.detail.editModal.success')
    
    // Reload customer data after a short delay
    setTimeout(() => {
      loadCustomer()
      setTimeout(() => {
        closeEditModal()
      }, 1500)
    }, 500)
  } catch (err) {
    console.error('Error updating customer:', err)
    editError.value = err instanceof Error ? err.message : t('customers.detail.messages.updateError')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadCustomer()
})
</script>