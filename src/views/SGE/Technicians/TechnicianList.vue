<template>
  <admin-layout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('technicians.list.header.title') }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            {{ t('technicians.list.header.subtitle') }}
          </p>
        </div>
        <router-link
          to="/technicians/schedule"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <CalenderIcon class="h-5 w-5" />
          <span>{{ t('technicians.list.actions.viewSchedule') }}</span>
        </router-link>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('technicians.list.stats.totalTechnicians') }}</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.totalTechnicians }}
              </p>
            </div>
            <UserCircleIcon class="h-10 w-10 text-blue-500" />
          </div>
        </div>
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('technicians.list.stats.working') }}</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.activeTechnicians }}
              </p>
            </div>
            <CheckIcon class="h-10 w-10 text-green-500" />
          </div>
        </div>
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('technicians.list.stats.onsite') }}</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.onsiteTechnicians }}
              </p>
            </div>
            <BoxCubeIcon class="h-10 w-10 text-yellow-500" />
          </div>
        </div>
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('technicians.list.stats.ticketsInProgress') }}</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.activeTickets }}
              </p>
            </div>
            <TaskIcon class="h-10 w-10 text-purple-500" />
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
      >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('technicians.list.filters.search') }}
            </label>
            <input
              v-model="filters.search"
              type="text"
              :placeholder="t('technicians.list.filters.searchPlaceholder')"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('technicians.list.filters.status') }}
            </label>
            <select
              v-model="filters.status"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">{{ t('technicians.list.filters.all') }}</option>
              <option value="available">{{ t('technicians.list.statusOptions.available') }}</option>
              <option value="onsite">{{ t('technicians.list.statusOptions.onsite') }}</option>
              <option value="busy">{{ t('technicians.list.statusOptions.busy') }}</option>
              <option value="offline">{{ t('technicians.list.statusOptions.offline') }}</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              @click="clearFilters"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {{ t('technicians.list.filters.clearFilters') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Technicians Table -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div class="overflow-y-auto max-h-[600px] overflow-x-hidden">
          <table class="w-full" style="table-layout: fixed; width: 100%;">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('technicians.list.table.technician') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[120px]"
                >
                  {{ t('technicians.list.table.employeeId') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[150px]"
                >
                  {{ t('technicians.list.table.contact') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[120px]"
                >
                  {{ t('technicians.list.table.function') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[100px]"
                >
                  {{ t('technicians.list.table.status') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[100px] text-center"
                >
                  {{ t('technicians.list.table.ticketsInProgress') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[150px]"
                >
                  {{ t('technicians.list.table.todaySchedule') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[150px]"
                >
                  {{ t('technicians.list.table.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="technician in filteredTechnicians"
                :key="technician.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-4 py-4 break-words">
                  <div class="flex items-center gap-3 min-w-0">
                    <div
                      class="h-10 w-10 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center"
                    >
                      <span class="text-blue-600 dark:text-blue-400 font-bold">
                        {{ technician.name.charAt(0) }}
                      </span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {{ technician.name }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {{ technician.email }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4 break-words">
                  <span class="text-sm text-gray-900 dark:text-white font-medium">
                    {{ technician.code }}
                  </span>
                </td>
                <td class="px-4 py-4 break-words">
                  <div class="min-w-0">
                    <p class="text-sm text-gray-900 dark:text-white truncate">
                      {{ technician.phone }}
                    </p>
                  </div>
                </td>
                <td class="px-4 py-4 break-words">
                  <select
                    :value="technician.function"
                    @change="updateTechnicianFunction(technician.id, ($event.target as HTMLSelectElement).value)"
                    :class="[
                      'w-full px-3 py-1.5 text-xs font-semibold rounded-full border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 transition-all duration-200 shadow-sm hover:shadow-md',
                      getFunctionClass(technician.function),
                    ]"
                  >
                    <option
                      v-for="(label, value) in functionOptions"
                      :key="value"
                      :value="value"
                      class="rounded-full"
                    >
                      {{ label }}
                    </option>
                  </select>
                </td>
                <td class="px-4 py-4 break-words">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span
                      :class="[
                        'px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap',
                        getStatusClass(technician.status),
                      ]"
                    >
                      {{ getStatusLabel(technician.status) }}
                    </span>
                    <div
                      v-if="technician.currentLocation"
                      class="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0"
                      :title="t('technicians.list.table.currentLocation')"
                    >
                      📍
                    </div>
                  </div>
                </td>
                <td class="px-4 py-4 text-center">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ technician.activeTickets }}
                  </span>
                </td>
                <td class="px-4 py-4 break-words">
                  <div class="text-sm min-w-0">
                    <p class="text-gray-900 dark:text-white truncate">
                      {{ technician.todayTasks }} {{ t('technicians.list.table.tasks') }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {{ technician.nextTaskTime || t('technicians.list.table.noTasks') }}
                    </p>
                  </div>
                </td>
                <td class="px-4 py-4 text-sm" @click.stop>
                  <div class="flex gap-2 flex-wrap">
                    <router-link
                      :to="`/technicians/schedule?tech=${technician.id}`"
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium whitespace-nowrap"
                    >
                      {{ t('technicians.list.table.schedule') }}
                    </router-link>
                    <button
                      @click="viewTechnician(technician.id)"
                      class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 font-medium whitespace-nowrap"
                    >
                      {{ t('technicians.list.table.details') }}
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="loading">
                <td colspan="8" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  {{ t('technicians.list.table.loading') }}
                </td>
              </tr>
              <tr v-else-if="error">
                <td colspan="8" class="px-6 py-8 text-center text-red-500 dark:text-red-400">
                  {{ error }}
                </td>
              </tr>
              <tr v-else-if="filteredTechnicians.length === 0">
                <td colspan="8" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  {{ t('technicians.list.table.noTechnicians') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import {
  CalenderIcon,
  UserCircleIcon,
  CheckIcon,
  BoxCubeIcon,
  TaskIcon,
} from '../../../icons'
import { apiClient } from '@/services/api'
import { UserRole } from '@/composables/useAuth'

const { t } = useI18n()

// Function options
const functionOptions = computed(() => ({
  sale: t('technicians.list.functionOptions.sale'),
  technicalSupport: t('technicians.list.functionOptions.technicalSupport'),
  repair: t('technicians.list.functionOptions.repair'),
  management: t('technicians.list.functionOptions.management'),
}))

const stats = ref({
  totalTechnicians: 0,
  activeTechnicians: 0,
  onsiteTechnicians: 0,
  activeTickets: 0,
})

const filters = ref({
  search: '',
  status: '',
})

const technicians = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// Map API data to UI format
const mapTechnicianData = (tech: any) => {
  // Determine status based on active tickets
  let status = 'available'
  if (tech.active_tickets > 0) {
    status = tech.active_tickets >= 5 ? 'busy' : tech.today_tasks > 0 ? 'onsite' : 'available'
  }
  if (tech.status !== 'active') {
    status = 'offline'
  }

  return {
    id: tech.id,
    name: tech.name,
    code: tech.code || `KT${String(tech.id).padStart(3, '0')}`,
    email: tech.email,
    phone: tech.phone || t('common.na'),
    skillLevel: t('technicians.list.skillLevel.technician'), // Default value
    role: tech.role || UserRole.TECHNICIAN,
    function: tech.function || 'technicalSupport', // Default to technical support
    status,
    activeTickets: tech.active_tickets || 0,
    todayTasks: tech.today_tasks || 0,
    nextTaskTime: null, // Can be populated from schedules if needed
    currentLocation: null, // Can be populated from schedules if needed
  }
}

const loadTechnicians = async () => {
  loading.value = true
  error.value = null

  try {
    // Load technicians (including admins)
    const techResponse = await apiClient.get('/technicians?includeAdmins=true')
    if (techResponse.error) {
      throw new Error(techResponse.error)
    }
    const techData = Array.isArray(techResponse.data) ? techResponse.data : []
    technicians.value = techData.map(mapTechnicianData)

    // Load stats (including admins)
    const statsResponse = await apiClient.get('/technicians/stats?includeAdmins=true')
    if (statsResponse.error) {
      throw new Error(statsResponse.error)
    }
    if (statsResponse.data) {
      const data = statsResponse.data as any
      stats.value = {
        totalTechnicians: data.totalTechnicians || 0,
        activeTechnicians: data.activeTechnicians || 0,
        onsiteTechnicians: data.onsiteTechnicians || 0,
        activeTickets: data.activeTickets || 0,
      }
    }
  } catch (err) {
    console.error('Error loading technicians:', err)
    error.value = err instanceof Error ? err.message : t('technicians.list.messages.loadError')
  } finally {
    loading.value = false
  }
}

const filteredTechnicians = computed(() => {
  let result = technicians.value

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(
      (t) =>
        t.name.toLowerCase().includes(search) ||
        t.code.toLowerCase().includes(search) ||
        t.email.toLowerCase().includes(search)
    )
  }

  if (filters.value.status) {
    result = result.filter((t) => t.status === filters.value.status)
  }

  return result
})

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    available: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    onsite: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    busy: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    offline: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  }
  return classes[status] || classes.available
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    available: t('technicians.list.statusOptions.available'),
    onsite: t('technicians.list.statusOptions.onsite'),
    busy: t('technicians.list.statusOptions.busy'),
    offline: t('technicians.list.statusOptions.offline'),
  }
  return labels[status] || status
}

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    [UserRole.TECHNICIAN]: t('technicians.list.roleOptions.technician'),
    [UserRole.ADMIN]: t('technicians.list.roleOptions.admin'),
    [UserRole.DEV]: t('technicians.list.roleOptions.dev'),
    [UserRole.SERVICE_CENTER]: t('technicians.list.roleOptions.serviceCenter'),
  }
  return labels[role] || role
}

const getRoleClass = (role: string) => {
  const classes: Record<string, string> = {
    [UserRole.TECHNICIAN]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    [UserRole.ADMIN]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    [UserRole.DEV]: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    [UserRole.SERVICE_CENTER]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  }
  return classes[role] || classes[UserRole.TECHNICIAN]
}

const getFunctionClass = (functionType: string) => {
  const classes: Record<string, string> = {
    sale: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border border-green-200 dark:border-green-800',
    technicalSupport: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-200 dark:border-blue-800',
    repair: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 border border-orange-200 dark:border-orange-800',
    management: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 border border-purple-200 dark:border-purple-800',
  }
  return classes[functionType] || classes.technicalSupport
}

const updateTechnicianFunction = async (technicianId: number, functionType: string) => {
  try {
    // Update via API
    await apiClient.put(`/users/${technicianId}`, { function: functionType })
    
    // Update local state
    const technician = technicians.value.find(t => t.id === technicianId)
    if (technician) {
      technician.function = functionType
    }
  } catch (err) {
    console.error('Failed to update technician function:', err)
    error.value = t('technicians.list.messages.updateFunctionError')
  }
}

const clearFilters = () => {
  filters.value = {
    search: '',
    status: '',
  }
}

const viewTechnician = (id: number) => {
  // TODO: Navigate to technician detail or show modal
  console.log('View technician:', id)
}

onMounted(() => {
  loadTechnicians()
})

onActivated(() => {
  loadTechnicians()
})
</script>