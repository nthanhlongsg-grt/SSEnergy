<template>
  <admin-layout>
    <div class="space-y-4 sm:space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div class="min-w-0">
          <router-link
            to="/customer/inverters"
            class="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <span aria-hidden="true" class="mr-1">←</span>
            {{ t('customers.inverters.detail.header.back') }}
          </router-link>
          <div class="mt-2 flex flex-wrap items-center gap-2">
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {{ t('customers.inverters.detail.header.title') }}
            </h1>
            <span
              v-if="inverter && !loading"
              :class="[
                'px-2.5 py-0.5 text-xs font-semibold rounded-full',
                warrantyStatusClass,
              ]"
            >
              {{ warrantyStatusLabel }}
            </span>
          </div>
          <p class="mt-1 text-sm font-mono text-gray-500 dark:text-gray-400 truncate">
            {{ inverter?.serial_number || t('customers.inverters.detail.header.loading') }}
          </p>
        </div>
        <router-link
          v-if="inverter"
          :to="`/customer/tickets/new?inverter_id=${inverter.id}`"
          class="shrink-0 inline-flex items-center justify-center px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {{ t('customers.inverters.detail.actions.createTicket') }}
        </router-link>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-12">
        <div class="text-gray-500 dark:text-gray-400">
          {{ t('customers.inverters.detail.messages.loading') }}
        </div>
      </div>

      <!-- Error -->
      <div
        v-else-if="error"
        class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
      >
        <p class="text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Content -->
      <div v-else-if="inverter" class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <!-- Main -->
        <div class="lg:col-span-2 space-y-4 sm:space-y-6">
          <!-- Device -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm"
          >
            <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('customers.inverters.detail.sections.deviceInfo') }}
            </h2>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt class="text-gray-500 dark:text-gray-400">
                  {{ t('customers.inverters.detail.fields.serialNumber') }}
                </dt>
                <dd class="mt-1 font-mono font-medium text-gray-900 dark:text-white">
                  {{ inverter.serial_number }}
                </dd>
              </div>
              <div>
                <dt class="text-gray-500 dark:text-gray-400">
                  {{ t('customers.inverters.detail.fields.model') }}
                </dt>
                <dd class="mt-1 text-gray-900 dark:text-white">
                  {{ inverter.model || t('common.na') }}
                </dd>
              </div>
              <div>
                <dt class="text-gray-500 dark:text-gray-400">
                  {{ t('customers.inverters.detail.fields.manufacturer') }}
                </dt>
                <dd class="mt-1 text-gray-900 dark:text-white">
                  {{ inverter.manufacturer || t('common.na') }}
                </dd>
              </div>
              <div>
                <dt class="text-gray-500 dark:text-gray-400">
                  {{ t('customers.inverters.detail.fields.installationDate') }}
                </dt>
                <dd class="mt-1 text-gray-900 dark:text-white">
                  {{ formatDisplayDate(inverter.installation_date) }}
                </dd>
              </div>
              <div v-if="inverter.project_name" class="sm:col-span-2">
                <dt class="text-gray-500 dark:text-gray-400">
                  {{ t('customers.inverters.detail.fields.project') }}
                </dt>
                <dd class="mt-1 text-gray-900 dark:text-white">
                  {{ inverter.project_name }}
                </dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="text-gray-500 dark:text-gray-400">
                  {{ t('customers.inverters.detail.fields.installationAddress') }}
                </dt>
                <dd class="mt-1 text-gray-900 dark:text-white">
                  {{ inverter.installation_address || t('common.na') }}
                </dd>
              </div>
              <div v-if="inverter.notes" class="sm:col-span-2">
                <dt class="text-gray-500 dark:text-gray-400">
                  {{ t('customers.inverters.detail.fields.notes') }}
                </dt>
                <dd class="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">
                  {{ inverter.notes }}
                </dd>
              </div>
            </dl>
          </div>

          <!-- Warranty -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm"
          >
            <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                {{ t('customers.inverters.detail.sections.warrantyInfo') }}
              </h2>
              <span
                v-if="warrantyDaysRemaining !== null && warrantyStatus === 'active'"
                :class="['text-sm font-medium', warrantyDaysTextClass]"
              >
                {{ t('customers.inverters.detail.fields.daysRemaining', { days: warrantyDaysRemaining }) }}
              </span>
            </div>

            <div
              v-if="showWarrantyAlert"
              class="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200"
            >
              {{ t('customers.inverters.detail.alerts.warrantyExpiringSoon', { days: warrantyDaysRemaining }) }}
            </div>

            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt class="text-gray-500 dark:text-gray-400">
                  {{ t('customers.inverters.detail.fields.warrantyStartDate') }}
                </dt>
                <dd class="mt-1 text-gray-900 dark:text-white">
                  {{ formatDisplayDate(inverter.warranty_start_date) }}
                </dd>
              </div>
              <div>
                <dt class="text-gray-500 dark:text-gray-400">
                  {{ t('customers.inverters.detail.fields.warrantyEndDate') }}
                </dt>
                <dd class="mt-1 text-gray-900 dark:text-white">
                  {{ formatDisplayDate(inverter.warranty_end_date) }}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-4 sm:space-y-6">
          <!-- Contract -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm"
          >
            <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('customers.inverters.detail.sections.contractInfo') }}
            </h2>
            <div v-if="displayContracts.length" class="space-y-3">
              <div
                v-for="contract in displayContracts"
                :key="contract.id"
                class="flex items-center justify-between gap-2"
              >
                <div class="min-w-0">
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ t('customers.inverters.detail.fields.contract') }}
                  </p>
                  <p class="mt-0.5 font-medium text-gray-900 dark:text-white truncate">
                    {{ contract.contract_number }}
                  </p>
                  <p
                    v-if="contract.customer_name"
                    class="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate"
                  >
                    {{ contract.customer_name }}
                  </p>
                </div>
                <router-link
                  :to="`/customer/contracts/${contract.id}`"
                  class="shrink-0 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 whitespace-nowrap"
                >
                  {{ t('customers.inverters.detail.actions.viewContract') }}
                </router-link>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('customers.inverters.detail.messages.noContract') }}
            </p>
          </div>

          <!-- Support contact -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm"
          >
            <h2 class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('customers.inverters.detail.sections.supportInfo') }}
            </h2>
            <div v-if="hasSupportContact" class="space-y-3 text-sm">
              <div v-if="inverter.customer_name">
                <p class="text-gray-500 dark:text-gray-400">
                  {{ t('customers.inverters.detail.fields.organization') }}
                </p>
                <p class="mt-1 text-gray-900 dark:text-white">{{ inverter.customer_name }}</p>
              </div>
              <div v-if="inverter.contact_user_name">
                <p class="text-gray-500 dark:text-gray-400">
                  {{ t('customers.inverters.detail.fields.supportPerson') }}
                </p>
                <p class="mt-1 font-medium text-gray-900 dark:text-white">
                  {{ inverter.contact_user_name }}
                </p>
                <p
                  v-if="inverter.contact_user_email"
                  class="mt-1 text-gray-600 dark:text-gray-300 break-all"
                >
                  {{ inverter.contact_user_email }}
                </p>
                <p
                  v-if="inverter.contact_user_phone"
                  class="mt-0.5 text-gray-600 dark:text-gray-300"
                >
                  {{ inverter.contact_user_phone }}
                </p>
              </div>
            </div>
            <p v-else class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('customers.inverters.detail.messages.noSupportPerson') }}
            </p>
          </div>
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
import { inverterService } from '@/services/inverterService'
import { formatDate, getVietnamDateString } from '@/utils/dateTime'

const WARRANTY_WARNING_DAYS = 45
const WARRANTY_CRITICAL_DAYS = 14

interface LinkedContract {
  id: number
  contract_number: string
  customer_name?: string
}

interface CustomerInverterDetail {
  id: number
  serial_number: string
  model?: string
  manufacturer?: string
  project_name?: string
  installation_date?: string
  installation_address?: string
  notes?: string
  warranty_start_date?: string
  warranty_end_date?: string
  customer_name?: string
  contact_user_name?: string
  contact_user_email?: string
  contact_user_phone?: string
  contract_id?: number
  contract_number?: string
  contracts?: LinkedContract[]
}

const { t } = useI18n()
const route = useRoute()

const loading = ref(true)
const error = ref<string | null>(null)
const inverter = ref<CustomerInverterDetail | null>(null)

const contractIdFromQuery = computed(() => {
  const raw = route.query.contract_id
  if (!raw) return undefined
  const parsed = parseInt(String(raw), 10)
  return Number.isNaN(parsed) ? undefined : parsed
})

const displayContracts = computed((): LinkedContract[] => {
  if (!inverter.value) return []
  if (inverter.value.contracts?.length) {
    return inverter.value.contracts
  }
  if (inverter.value.contract_id && inverter.value.contract_number) {
    return [
      {
        id: inverter.value.contract_id,
        contract_number: inverter.value.contract_number,
        customer_name: inverter.value.customer_name,
      },
    ]
  }
  return []
})

const hasSupportContact = computed(
  () =>
    Boolean(
      inverter.value?.contact_user_name ||
        inverter.value?.contact_user_email ||
        inverter.value?.contact_user_phone,
    ),
)

function getDaysUntilWarrantyEnd(endDate?: string | null): number | null {
  if (!endDate) return null
  const endStr = endDate.slice(0, 10)
  const todayStr = getVietnamDateString()
  const end = new Date(`${endStr}T00:00:00`)
  const today = new Date(`${todayStr}T00:00:00`)
  if (Number.isNaN(end.getTime()) || Number.isNaN(today.getTime())) return null
  return Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

const warrantyStatus = computed(() => {
  if (!inverter.value?.warranty_start_date || !inverter.value?.warranty_end_date) {
    return 'pending'
  }
  const days = getDaysUntilWarrantyEnd(inverter.value.warranty_end_date)
  if (days === null) return 'pending'
  return days < 0 ? 'expired' : 'active'
})

const warrantyDaysRemaining = computed(() => {
  if (!inverter.value?.warranty_end_date) return null
  return getDaysUntilWarrantyEnd(inverter.value.warranty_end_date)
})

const warrantyStatusLabel = computed(() => {
  const key = warrantyStatus.value
  return t(`customers.inverters.detail.warrantyStatus.${key}`)
})

const warrantyStatusClass = computed(() => {
  if (warrantyStatus.value === 'active') {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }
  if (warrantyStatus.value === 'expired') {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
  return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200'
})

const warrantyDaysTextClass = computed(() => {
  const days = warrantyDaysRemaining.value
  if (days === null) return ''
  if (days < 0) return 'text-red-600 dark:text-red-400'
  if (days <= WARRANTY_CRITICAL_DAYS) return 'text-red-600 dark:text-red-400'
  if (days <= WARRANTY_WARNING_DAYS) return 'text-amber-700 dark:text-amber-300'
  return 'text-green-700 dark:text-green-300'
})

const showWarrantyAlert = computed(() => {
  const days = warrantyDaysRemaining.value
  return (
    warrantyStatus.value === 'active' &&
    days !== null &&
    days >= 0 &&
    days <= WARRANTY_WARNING_DAYS
  )
})

const formatDisplayDate = (dateString?: string | null) => {
  if (!dateString) return t('common.na')
  return formatDate(dateString)
}

const loadInverter = async () => {
  try {
    loading.value = true
    error.value = null

    const id = parseInt(route.params.id as string)
    const data = await inverterService.getInverterById(id, {
      contractId: contractIdFromQuery.value,
    })
    inverter.value = data as CustomerInverterDetail
  } catch (err: unknown) {
    console.error('Error loading inverter:', err)
    const message = err instanceof Error ? err.message : t('customers.inverters.detail.messages.loadError')
    error.value = message
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadInverter()
})
</script>
