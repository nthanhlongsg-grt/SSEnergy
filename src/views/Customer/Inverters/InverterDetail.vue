<template>
  <admin-layout>
    <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <router-link
        to="/customer/inverters"
        class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        ← Quay lại
      </router-link>
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('customers.inverters.detail.header.title') }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          {{ inverter?.serial_number || t('customers.inverters.detail.header.loading') }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="text-gray-500 dark:text-gray-400">{{ t('customers.inverters.detail.messages.loading') }}</div>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
    >
      <p class="text-red-800 dark:text-red-200">{{ error }}</p>
    </div>

    <!-- Content -->
    <div v-else-if="inverter" class="space-y-6">
      <!-- Basic Info -->
      <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ t('customers.inverters.detail.sections.deviceInfo') }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.inverters.detail.fields.serialNumber') }}</label>
            <p class="mt-1 text-gray-900 dark:text-white font-medium">{{ inverter.serial_number }}</p>
          </div>
          <div>
            <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.inverters.detail.fields.model') }}</label>
            <p class="mt-1 text-gray-900 dark:text-white font-medium">{{ inverter.model }}</p>
          </div>
          <div>
            <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.inverters.detail.fields.installationDate') }}</label>
            <p class="mt-1 text-gray-900 dark:text-white">{{ formatDate(inverter.installation_date) }}</p>
          </div>
          <div>
            <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.inverters.detail.fields.status') }}</label>
            <p class="mt-1">
              <span
                :class="[
                  'px-2 py-1 text-xs rounded-full',
                  inverter.status === 'active' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                ]"
              >
                {{ inverter.status === 'active' ? t('customers.inverters.detail.status.active') : t('customers.inverters.detail.status.inactive') }}
              </span>
            </p>
          </div>
        </div>
      </div>

      <!-- Warranty Info -->
      <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ t('customers.inverters.detail.sections.warrantyInfo') }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.inverters.detail.fields.warrantyStartDate') }}</label>
            <p class="mt-1 text-gray-900 dark:text-white">{{ formatDate(inverter.warranty_start_date) }}</p>
          </div>
          <div>
            <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.inverters.detail.fields.warrantyEndDate') }}</label>
            <p class="mt-1 text-gray-900 dark:text-white">{{ formatDate(inverter.warranty_end_date) }}</p>
          </div>
          <div>
            <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.inverters.detail.fields.warrantyType') }}</label>
            <p class="mt-1 text-gray-900 dark:text-white">{{ inverter.warranty_type || '-' }}</p>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex gap-3">
        <router-link
          :to="`/customer/tickets/new?inverter_id=${inverter.id}`"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {{ t('customers.inverters.detail.actions.createTicket') }}
        </router-link>
      </div>
    </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { inverterService } from '@/services/inverterService'

const { t } = useI18n()

const route = useRoute()
const loading = ref(true)
const error = ref<string | null>(null)
const inverter = ref<any>(null)

const loadInverter = async () => {
  try {
    loading.value = true
    error.value = null

    const id = parseInt(route.params.id as string)
    const data = await inverterService.getInverterById(id)
    inverter.value = data
  } catch (err: any) {
    console.error('Error loading inverter:', err)
    error.value = err.message || t('customers.inverters.detail.messages.loadError')
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
  loadInverter()
})
</script>

