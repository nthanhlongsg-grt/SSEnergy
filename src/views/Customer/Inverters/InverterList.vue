<template>
  <admin-layout>
    <div class="space-y-4 sm:space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
      <div class="flex-1 min-w-0">
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('customers.inverters.list.header.title') }}
        </h1>
        <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
          {{ t('customers.inverters.list.header.subtitle') }}
        </p>
      </div>
      <router-link
        to="/customer/inverters/register"
        class="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base whitespace-nowrap w-full sm:w-auto justify-center"
      >
        <PlusIcon class="h-4 w-4 sm:h-5 sm:w-5" />
        <span>{{ t('customers.inverters.list.actions.registerNew') }}</span>
      </router-link>
    </div>

    <!-- Filters -->
    <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        <div>
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            {{ t('customers.inverters.list.filters.search') }}
          </label>
          <input
            v-model="filters.search"
            type="text"
            :placeholder="t('customers.inverters.list.filters.searchPlaceholder')"
            class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            {{ t('customers.inverters.list.filters.model') }}
          </label>
          <input
            v-model="filters.model"
            type="text"
            :placeholder="t('customers.inverters.list.filters.modelPlaceholder')"
            class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            {{ t('customers.inverters.list.filters.status') }}
          </label>
          <select
            v-model="filters.status"
            class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">{{ t('customers.inverters.list.filters.all') }}</option>
            <option value="active">{{ t('customers.inverters.list.status.active') }}</option>
            <option value="inactive">{{ t('customers.inverters.list.status.inactive') }}</option>
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
                {{ t('customers.inverters.list.table.columns.serialNumber') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.inverters.list.table.columns.model') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.inverters.list.table.columns.installationDate') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.inverters.list.table.columns.installationAddress') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.inverters.list.table.columns.warrantyEndDate') }}
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                {{ t('customers.inverters.list.table.columns.status') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-if="loading">
              <td colspan="6" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                {{ t('customers.inverters.list.table.loading') }}
              </td>
            </tr>
            <tr v-else-if="error">
              <td colspan="6" class="px-6 py-8 text-center text-red-500 dark:text-red-400">
                {{ error }}
              </td>
            </tr>
            <tr v-else-if="inverters.length === 0">
              <td colspan="6" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                {{ t('customers.inverters.list.table.empty') }} <router-link to="/customer/inverters/register" class="text-blue-600 hover:underline">{{ t('customers.inverters.list.table.registerNow') }}</router-link>
              </td>
            </tr>
            <tr
              v-for="inverter in inverters"
              :key="inverter.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
              @click="router.push(`/customer/inverters/${inverter.id}`)"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ inverter.serial_number }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ inverter.model }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(inverter.installation_date) }}
              </td>
              <td class="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                {{ inverter.installation_address || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(inverter.warranty_end_date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'px-2 py-1 text-xs rounded-full',
                    inverter.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                  ]"
                >
                  {{ inverter.status === 'active' ? t('customers.inverters.list.status.active') : t('customers.inverters.list.status.inactive') }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden">
        <div v-if="loading" class="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          {{ t('customers.inverters.list.table.loading') }}
        </div>
        <div v-else-if="error" class="p-6 text-center text-red-500 dark:text-red-400 text-sm">
          {{ error }}
        </div>
        <div v-else-if="inverters.length === 0" class="p-6 text-center text-gray-500 dark:text-gray-400 text-sm">
          {{ t('customers.inverters.list.table.empty') }}
          <router-link to="/customer/inverters/register" class="block mt-2 text-blue-600 hover:underline">
            {{ t('customers.inverters.list.table.registerNow') }}
          </router-link>
        </div>
        <div
          v-for="inverter in inverters"
          :key="inverter.id"
          class="p-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0 active:bg-gray-50 dark:active:bg-gray-700 cursor-pointer"
          @click="router.push(`/customer/inverters/${inverter.id}`)"
        >
          <div class="flex items-start justify-between gap-2 mb-2">
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ inverter.serial_number }}</h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ inverter.model }}</p>
            </div>
            <div class="flex-shrink-0">
              <span
                :class="[
                  'px-2 py-0.5 text-xs rounded-full whitespace-nowrap',
                  inverter.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                ]"
              >
                {{ inverter.status === 'active' ? t('customers.inverters.list.status.active') : t('customers.inverters.list.status.inactive') }}
              </span>
            </div>
          </div>
          <div class="space-y-1.5 mt-2">
            <div class="flex items-center gap-2 text-xs">
              <span class="text-gray-500 dark:text-gray-400 min-w-[100px]">{{ t('customers.inverters.list.table.columns.installationDate') }}:</span>
              <span class="text-gray-900 dark:text-white">{{ formatDate(inverter.installation_date) }}</span>
            </div>
            <div class="flex items-start gap-2 text-xs">
              <span class="text-gray-500 dark:text-gray-400 min-w-[100px]">{{ t('customers.inverters.list.table.columns.installationAddress') }}:</span>
              <span class="text-gray-900 dark:text-white flex-1">{{ inverter.installation_address || '-' }}</span>
            </div>
            <div class="flex items-center gap-2 text-xs">
              <span class="text-gray-500 dark:text-gray-400 min-w-[100px]">{{ t('customers.inverters.list.table.columns.warrantyEndDate') }}:</span>
              <span class="text-gray-900 dark:text-white">{{ formatDate(inverter.warranty_end_date) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PlusIcon from '@/icons/PlusIcon.vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { inverterService } from '@/services/inverterService'

const { t } = useI18n()
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const inverters = ref<any[]>([])
const filters = ref({
  search: '',
  model: '',
  status: '',
})

const loadInverters = async () => {
  try {
    loading.value = true
    error.value = null

    const response = await inverterService.getAllInverters({
      search: filters.value.search || undefined,
      model: filters.value.model || undefined,
      status: filters.value.status || undefined,
      limit: 100,
      page: 1,
    })

    inverters.value = response.data || []
  } catch (err: any) {
    console.error('Error loading inverters:', err)
    error.value = err.message || t('customers.inverters.list.messages.loadError')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN')
}

onMounted(() => {
  loadInverters()
})
</script>

