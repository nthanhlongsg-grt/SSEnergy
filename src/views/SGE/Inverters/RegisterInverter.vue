<template>
  <admin-layout>
    <div class="max-w-3xl mx-auto space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('inverters.register.header.title') }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          {{ t('inverters.register.header.subtitle') }}
        </p>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
      >
        <p class="text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Form -->
      <form
        @submit.prevent="handleSubmit"
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-6"
      >
        <!-- Serial Number -->
        <div>
          <label
            for="serialNumber"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {{ t('inverters.register.form.serialNumber') }} <span class="text-red-500">*</span>
          </label>
          <input
            id="serialNumber"
            v-model="form.serialNumber"
            type="text"
            required
            :placeholder="t('inverters.register.form.serialNumberPlaceholder')"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <!-- Model -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label
              for="model"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {{ t('inverters.register.form.model') }} <span class="text-red-500">*</span>
            </label>
            <router-link
              to="/inverters/models"
              class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {{ t('inverters.register.form.createNewModel') }}
            </router-link>
          </div>
          <div class="relative" ref="modelSelectRef">
            <div
              @click="toggleModelDropdown"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer flex items-center justify-between"
            >
              <span :class="form.model ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-400'">
                {{ form.model || t('inverters.register.form.selectModel') }}
              </span>
              <svg
                class="w-5 h-5 text-gray-400 transition-transform"
                :class="{ 'rotate-180': isModelDropdownOpen }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="transform scale-95 opacity-0"
              enter-to-class="transform scale-100 opacity-100"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="transform scale-100 opacity-100"
              leave-to-class="transform scale-95 opacity-0"
            >
              <div
                v-if="isModelDropdownOpen"
                class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-hidden"
              >
                <!-- Search Input -->
                <div class="p-2 border-b border-gray-200 dark:border-gray-700">
                  <input
                    v-model="modelSearchQuery"
                    type="text"
                    :placeholder="t('inverters.register.form.searchModel')"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    @click.stop
                    @input.stop
                  />
                </div>
                <!-- Options List -->
                <div class="overflow-y-auto max-h-48">
                  <div
                    v-if="filteredModels.length === 0"
                    class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center"
                  >
                    {{ t('inverters.register.form.noModelsFound') }}
                  </div>
                  <div
                    v-for="model in filteredModels"
                    :key="model.id"
                    @click="selectModel(model)"
                    class="px-4 py-2 text-sm text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    :class="{ 'bg-blue-50 dark:bg-blue-900/20': form.model === model.name }"
                  >
                    {{ model.name }}
                  </div>
                </div>
              </div>
            </transition>
          </div>
          
          <!-- Model Info Display -->
          <div
            v-if="selectedModelInfo"
            class="mt-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4"
          >
            <p class="text-sm font-medium text-green-900 dark:text-green-200 mb-2">{{ t('inverters.register.form.selectedModelInfo') }}</p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div v-if="selectedModelInfo.type">
                <span class="text-gray-600 dark:text-gray-400">{{ t('inverters.register.form.type') }}:</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ selectedModelInfo.type }}</span>
              </div>
              <div v-if="selectedModelInfo.capacity">
                <span class="text-gray-600 dark:text-gray-400">{{ t('inverters.register.form.capacity') }}:</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ selectedModelInfo.capacity }} kW</span>
              </div>
              <div v-if="selectedModelInfo.manufacturer">
                <span class="text-gray-600 dark:text-gray-400">{{ t('inverters.register.form.manufacturer') }}:</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ selectedModelInfo.manufacturer }}</span>
              </div>
              <div v-if="selectedModelInfo.description" class="md:col-span-2">
                <span class="text-gray-600 dark:text-gray-400">{{ t('inverters.register.form.description') }}:</span>
                <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ selectedModelInfo.description }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Installation Date -->
        <div>
          <label
            for="installationDate"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {{ t('inverters.register.form.installationDate') }}
          </label>
          <div class="relative">
            <flat-pickr
              id="installationDate"
              v-model="form.installationDate"
              :config="flatpickrDateConfig"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <!-- Warranty End Date -->
        <div>
          <label
            for="warrantyEndDate"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {{ t('inverters.register.form.warrantyEndDate') }}
          </label>
          <div class="relative">
            <flat-pickr
              id="warrantyEndDate"
              v-model="form.warrantyEndDate"
              :config="flatpickrDateConfig"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <p v-if="form.installationDate && !isWarrantyManuallyEdited" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{ t('inverters.register.form.warrantyAutoCalculated') }}
          </p>
        </div>

        <!-- Installation Address -->
        <div>
          <label
            for="installationAddress"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {{ t('inverters.register.form.installationAddress') }}
          </label>
          <input
            id="installationAddress"
            v-model="form.installationAddress"
            type="text"
            :placeholder="t('inverters.register.form.installationAddressPlaceholder')"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <!-- Customer Selection / User Info Display -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label
              :for="isEndUserOrDistributor ? 'userInfo' : 'customerId'"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {{ t('inverters.register.form.customer') }} 
              <span v-if="isEndUserOrDistributor" class="text-red-500">*</span>
              <span v-else class="text-gray-400 text-xs">(Tùy chọn)</span>
            </label>
            <router-link
              v-if="!isEndUserOrDistributor"
              to="/customers"
              target="_blank"
              class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {{ t('inverters.register.form.viewCustomerList') }}
            </router-link>
          </div>

          <!-- For END_USER and DISTRIBUTOR: Show user info (customer auto-linked) -->
          <div
            v-if="isEndUserOrDistributor && safeCurrentUser"
            class="space-y-3"
          >
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                type="text"
                :value="`${safeCurrentUser.name} (${safeCurrentUser.role === 'distributor' ? 'Đại lý' : 'Khách hàng'})`"
                disabled
                class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 sm:text-sm"
              />
            </div>
            
            <div class="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 px-1">
              <div v-if="safeCurrentUser.email" class="flex items-center gap-1">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {{ safeCurrentUser.email }}
              </div>
              <div v-if="safeCurrentUser.phone" class="flex items-center gap-1">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {{ safeCurrentUser.phone }}
              </div>
            </div>
            <p class="text-xs text-blue-600 dark:text-blue-400 italic flex items-center gap-1">
              <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Thiết bị này sẽ được đăng ký dưới tên tài khoản của bạn
            </p>
          </div>

          <!-- For ADMIN/SERVICE_CENTER: Show Searchable Customer Dropdown -->
          <template v-else>
            <div class="relative" ref="customerSelectRef">
              <div
                @click="toggleCustomerDropdown"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer flex items-center justify-between bg-white"
              >
                <span :class="form.customerId ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-400'">
                  {{ form.customerId ? customerSearchQuery : t('inverters.register.form.selectCustomer') }}
                </span>
                <svg
                  class="w-5 h-5 text-gray-400 transition-transform"
                  :class="{ 'rotate-180': showCustomerDropdown }"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              <!-- Dropdown Menu -->
              <transition
                enter-active-class="transition duration-100 ease-out"
                enter-from-class="transform scale-95 opacity-0"
                enter-to-class="transform scale-100 opacity-100"
                leave-active-class="transition duration-75 ease-in"
                leave-from-class="transform scale-100 opacity-100"
                leave-to-class="transform scale-95 opacity-0"
              >
                <div
                  v-if="showCustomerDropdown"
                  class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-hidden"
                >
                  <!-- Search Input inside dropdown -->
                  <div class="p-2 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
                    <input
                      v-model="customerSearchQuery"
                      type="text"
                      :placeholder="t('inverters.register.form.searchCustomerPlaceholder') || 'Tìm tên, email, sđt...'"
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      @click.stop
                      autofocus
                    />
                  </div>

                  <!-- List -->
                  <div class="overflow-y-auto max-h-48">
                    <div
                      v-if="loadingCustomers"
                      class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center"
                    >
                      {{ t('inverters.register.form.loadingCustomers') }}
                    </div>
                    <div
                      v-else-if="filteredCustomers.length === 0"
                      class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center"
                    >
                      {{ t('inverters.register.form.noCustomers') }}
                    </div>
                    <div
                      v-else
                      v-for="customer in filteredCustomers"
                      :key="customer.id"
                      @click="selectCustomer(customer)"
                      class="px-4 py-2 text-sm text-gray-900 dark:text-white cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 flex flex-col border-b border-gray-100 dark:border-gray-700 last:border-0"
                      :class="{ 'bg-blue-50 dark:bg-blue-900/20': form.customerId === customer.id }"
                    >
                      <span class="font-medium">{{ customer.name }}</span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">
                        {{ customer.email }} {{ customer.phone ? `• ${customer.phone}` : '' }}
                      </span>
                    </div>
                  </div>
                </div>
              </transition>
            </div>
            
            <p v-if="!loadingCustomers && customers.length > 0" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {{ t('inverters.register.form.totalCustomers', { count: customers.length }) }}
            </p>
            
            <!-- Customer Info Display -->
            <div
              v-if="selectedCustomerInfo"
              class="mt-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4"
            >
              <p class="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">{{ t('inverters.register.form.selectedCustomerInfo') }}</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div v-if="selectedCustomerInfo.email">
                  <span class="text-gray-600 dark:text-gray-400">{{ t('inverters.register.form.email') }}</span>
                  <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ selectedCustomerInfo.email }}</span>
                </div>
                <div v-if="selectedCustomerInfo.phone">
                  <span class="text-gray-600 dark:text-gray-400">{{ t('inverters.register.form.phone') }}</span>
                  <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ selectedCustomerInfo.phone }}</span>
                </div>
                <div v-if="selectedCustomerInfo.address" class="md:col-span-2">
                  <span class="text-gray-600 dark:text-gray-400">{{ t('inverters.register.form.address') }}</span>
                  <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ selectedCustomerInfo.address }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Notes -->
        <div>
          <label
            for="notes"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {{ t('inverters.register.form.notes') }}
          </label>
          <textarea
            id="notes"
            v-model="form.notes"
            rows="4"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          ></textarea>
        </div>

        <!-- Actions -->
        <div class="flex gap-4 justify-end">
          <button
            type="button"
            @click="$router.back()"
            class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {{ t('inverters.register.actions.cancel') }}
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? t('inverters.register.actions.registering') : t('inverters.register.actions.register') }}
          </button>
        </div>
      </form>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { apiClient } from '@/services/api'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { useFlatpickrConfig } from '@/composables/useFlatpickr'
import { useAuth, UserRole } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

const { showSuccess } = useToast()

const { t } = useI18n()

const router = useRouter()
const { getUser, getUserRole } = useAuth()

// Check if user is END_USER or DISTRIBUTOR (customer will be auto-linked)
const isEndUserOrDistributor = computed(() => {
  try {
    if (!getUserRole || !getUserRole.value) {
      return false
    }
    const role = getUserRole.value
    return role === UserRole.END_USER || role === UserRole.DISTRIBUTOR
  } catch (error) {
    console.error('Error checking user role:', error)
    return false
  }
})

// Safe current user reference
const safeCurrentUser = computed(() => {
  try {
    return getUser.value || null
  } catch (error) {
    console.error('Error accessing current user:', error)
    return null
  }
})

const form = ref({
  serialNumber: '',
  model: '',
  type: '',
  installationDate: '',
  warrantyEndDate: '',
  installationAddress: '',
  customerId: '',
  notes: '',
})

const isWarrantyManuallyEdited = ref(false)

const { dateConfig } = useFlatpickrConfig()

const flatpickrDateConfig = computed(() => ({
  ...dateConfig,
  placeholder: t('common.IN18'),
  altInputPlaceholder: t('common.IN18'),
}))

const isSubmitting = ref(false)
const error = ref<string | null>(null)
const availableModels = ref<any[]>([])
const loadingModels = ref(false)
const customerSearchQuery = ref('')
const showCustomerDropdown = ref(false)
const customerSelectRef = ref<HTMLElement | null>(null)

const filteredCustomers = computed(() => {
  if (!customerSearchQuery.value) return customers.value
  const query = customerSearchQuery.value.toLowerCase()
  return customers.value.filter(c => 
    (c.name && c.name.toLowerCase().includes(query)) ||
    (c.email && c.email.toLowerCase().includes(query)) ||
    (c.phone && c.phone.includes(query))
  )
})

const selectCustomer = (customer: any) => {
  form.value.customerId = customer.id
  customerSearchQuery.value = `${customer.name} ${customer.email ? `(${customer.email})` : ''}`
  showCustomerDropdown.value = false
}

const toggleCustomerDropdown = () => {
  if (loadingCustomers.value) return
  showCustomerDropdown.value = !showCustomerDropdown.value
  // If opening and input is empty but value exists, populate input
  if (showCustomerDropdown.value && form.value.customerId) {
    const c = customers.value.find(cust => cust.id === Number(form.value.customerId))
    if (c) {
      customerSearchQuery.value = `${c.name} ${c.email ? `(${c.email})` : ''}`
    }
  } else if (showCustomerDropdown.value) {
    customerSearchQuery.value = '' // Clear search on open to show all
  }
}

// Close dropdown when clicking outside
const handleClickOutsideCustomer = (event: MouseEvent) => {
  if (customerSelectRef.value && !customerSelectRef.value.contains(event.target as Node)) {
    showCustomerDropdown.value = false
    // Reset display name if valid selection exists
    if (form.value.customerId) {
      const c = customers.value.find(cust => cust.id === Number(form.value.customerId))
      if (c) {
        customerSearchQuery.value = `${c.name} ${c.email ? `(${c.email})` : ''}`
      }
    } else {
      customerSearchQuery.value = ''
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutsideCustomer)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutsideCustomer)
})

const customers = ref<any[]>([])
const loadingCustomers = ref(false)
const isModelDropdownOpen = ref(false)
const modelSearchQuery = ref('')
const modelSelectRef = ref<HTMLElement | null>(null)

const loadModels = async () => {
  loadingModels.value = true
  try {
    const response = await apiClient.get('/models?status=active&limit=1000')
    if (response.error) {
      throw new Error(response.error)
    }
    const responseData = response.data as any
    if (responseData && responseData.data) {
      availableModels.value = Array.isArray(responseData.data) ? responseData.data : []
    } else {
      // Fallback for old response format
      availableModels.value = Array.isArray(responseData) ? responseData : []
    }
  } catch (err) {
    console.error('Error loading models:', err)
    error.value = err instanceof Error ? err.message : t('inverters.register.messages.loadModelsError')
  } finally {
    loadingModels.value = false
  }
}

const loadCustomers = async () => {
  try {
    // Skip loading customers for END_USER and DISTRIBUTOR (customer will be auto-linked)
    if (isEndUserOrDistributor.value) {
      return
    }
  } catch (error) {
    // If there's an error checking role, still try to load customers (fallback)
    console.warn('Error checking user role, loading customers anyway:', error)
  }
  
  loadingCustomers.value = true
  try {
    const response = await apiClient.get('/customers?limit=1000')
    if (response.error) {
      throw new Error(response.error)
    }
    const data = response.data as any
    customers.value = Array.isArray(data) ? data : (data?.data || [])
  } catch (err) {
    console.error('Error loading customers:', err)
    error.value = t('inverters.register.messages.loadCustomersError')
  } finally {
    loadingCustomers.value = false
  }
}

// Selected model info computed
const selectedModelInfo = computed(() => {
  if (!form.value.model) {
    return null
  }
  const model = availableModels.value.find(m => m.name === form.value.model)
  return model || null
})

// Filtered models based on search query
const filteredModels = computed(() => {
  if (!modelSearchQuery.value.trim()) {
    return availableModels.value
  }
  const query = modelSearchQuery.value.toLowerCase().trim()
  return availableModels.value.filter(model =>
    model.name.toLowerCase().includes(query) ||
    (model.manufacturer && model.manufacturer.toLowerCase().includes(query)) ||
    (model.type && model.type.toLowerCase().includes(query))
  )
})

// Toggle model dropdown
const toggleModelDropdown = () => {
  isModelDropdownOpen.value = !isModelDropdownOpen.value
  if (isModelDropdownOpen.value) {
    modelSearchQuery.value = ''
  }
}

// Select model
const selectModel = (model: any) => {
  form.value.model = model.name
  isModelDropdownOpen.value = false
  modelSearchQuery.value = ''
  onModelSelected()
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (modelSelectRef.value && !modelSelectRef.value.contains(event.target as Node)) {
    isModelDropdownOpen.value = false
  }
}

const onModelSelected = () => {
  if (form.value.model && selectedModelInfo.value) {
    // Auto-fill type from model
    if (selectedModelInfo.value.type) {
      form.value.type = selectedModelInfo.value.type
    } else {
      // If model doesn't have type, set default value
      form.value.type = 'Khác'
    }
  } else {
    form.value.type = ''
  }
}

// Selected customer info computed
const selectedCustomerInfo = computed(() => {
  if (!form.value.customerId) {
    return null
  }
  const customer = customers.value.find(c => c.id === parseInt(form.value.customerId))
  if (customer) {
    return {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    }
  }
  return null
})

// Handle customer selection (only for ADMIN/SERVICE_CENTER)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const onCustomerSelected = () => {
  // Logic moved to selectCustomer and watch
}

// Auto-fill installation address from user address for END_USER/DISTRIBUTOR
watch(() => safeCurrentUser.value, (user) => {
  try {
    if (isEndUserOrDistributor.value && user && user.address && !form.value.installationAddress) {
      form.value.installationAddress = user.address
    }
  } catch (error) {
    console.error('Error auto-filling address:', error)
  }
}, { immediate: true })

// Watch form.customerId change to sync search query (useful when resetting form)
watch(() => form.value.customerId, (newId) => {
  if (!newId) {
    customerSearchQuery.value = ''
  } else {
    const c = customers.value.find(cust => cust.id === Number(newId))
    if (c) {
      customerSearchQuery.value = `${c.name} ${c.email ? `(${c.email})` : ''}`
      // Auto-fill address
      if (c.address && !form.value.installationAddress) {
        form.value.installationAddress = c.address
      }
    }
  }
})

// Watch installation date and auto-calculate warranty end date
watch(() => form.value.installationDate, (newDate) => {
  if (newDate && !isWarrantyManuallyEdited.value) {
    // Calculate warranty end date: installation date + 5 years
    const installationDate = new Date(newDate)
    const warrantyEndDate = new Date(installationDate)
    warrantyEndDate.setFullYear(warrantyEndDate.getFullYear() + 5)
    
    // Format as YYYY-MM-DD
    const year = warrantyEndDate.getFullYear()
    const month = String(warrantyEndDate.getMonth() + 1).padStart(2, '0')
    const day = String(warrantyEndDate.getDate()).padStart(2, '0')
    form.value.warrantyEndDate = `${year}-${month}-${day}`
  }
})

// Watch warranty end date to detect manual edits
watch(() => form.value.warrantyEndDate, () => {
  if (form.value.installationDate && form.value.warrantyEndDate) {
    // Check if warranty date matches auto-calculated value
    const installationDate = new Date(form.value.installationDate)
    const expectedWarrantyDate = new Date(installationDate)
    expectedWarrantyDate.setFullYear(expectedWarrantyDate.getFullYear() + 5)
    
    const warrantyDate = new Date(form.value.warrantyEndDate)
    const yearDiff = warrantyDate.getFullYear() - expectedWarrantyDate.getFullYear()
    const monthDiff = warrantyDate.getMonth() - expectedWarrantyDate.getMonth()
    const dayDiff = warrantyDate.getDate() - expectedWarrantyDate.getDate()
    
    // If difference is more than 1 day, consider it manually edited
    if (yearDiff !== 0 || monthDiff !== 0 || Math.abs(dayDiff) > 1) {
      isWarrantyManuallyEdited.value = true
    }
  }
})

onMounted(async () => {
  try {
    await loadModels()
    await loadCustomers()
    document.addEventListener('click', handleClickOutside)
    
    // Check if serial number is passed via query params
    const query = router.currentRoute.value.query
    if (query.serial) {
      form.value.serialNumber = query.serial as string
    }
  } catch (err) {
    console.error('Error in onMounted:', err)
    error.value = err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải trang. Vui lòng thử lại.'
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

const handleSubmit = async () => {
  if (!form.value.serialNumber || !form.value.model) {
    error.value = t('inverters.register.messages.fillRequired')
    return
  }

  // Validate customer_id only for ADMIN/SERVICE_CENTER (not for END_USER/DISTRIBUTOR)
  // Customer is OPTIONAL for ADMIN/DEV/SERVICE_CENTER
  if (!isEndUserOrDistributor.value) {
    if (form.value.customerId) {
      // Convert to number if it's a string
      const customerIdStr = String(form.value.customerId).trim()
      if (customerIdStr === '' || customerIdStr === '0') {
        // Empty customer is OK, set to null
        form.value.customerId = ''
      } else {
        const customerIdNum = parseInt(customerIdStr)
        if (isNaN(customerIdNum) || customerIdNum <= 0) {
          error.value = t('inverters.register.messages.invalidCustomer')
          return
        }
        // Verify customer exists
        const customerExists = customers.value.find(c => c.id === customerIdNum)
        if (!customerExists) {
          error.value = t('inverters.register.messages.customerNotFound')
          return
        }
      }
    }
    // If customer_id is empty, that's OK - inverter will have no customer
  }

  // Ensure type is auto-filled from model
  if (!form.value.type && form.value.model) {
    const selectedModel = availableModels.value.find(m => m.name === form.value.model)
    if (selectedModel?.type) {
      form.value.type = selectedModel.type
    } else {
      form.value.type = 'Khác'
    }
  }

  isSubmitting.value = true
  error.value = null

  try {
    // Parse customer_id safely (only for ADMIN/SERVICE_CENTER)
    // For END_USER/DISTRIBUTOR, backend will auto-create/link customer from user info
    let customerIdValue: number | null = null
    
    console.log('🔍 [RegisterInverter] Form customer_id:', form.value.customerId, 'Type:', typeof form.value.customerId)
    console.log('🔍 [RegisterInverter] Is end user or distributor:', isEndUserOrDistributor.value)
    
    if (!isEndUserOrDistributor.value && form.value.customerId) {
      const customerIdStr = String(form.value.customerId).trim()
      console.log('   Parsed customer_id string:', customerIdStr)
      
      if (customerIdStr !== '' && customerIdStr !== '0') {
        const parsed = parseInt(customerIdStr)
        console.log('   Parsed customer_id number:', parsed)
        
        if (!isNaN(parsed) && parsed > 0) {
          customerIdValue = parsed
          console.log('   ✅ Final customer_id:', customerIdValue)
        }
      }
    }
    // For END_USER/DISTRIBUTOR, don't send customer_id - backend will auto-link

    const inverterData = {
      serial_number: form.value.serialNumber,
      model: form.value.model,
      type: form.value.type,
      warranty_start_date: form.value.installationDate || null,
      warranty_end_date: form.value.warrantyEndDate || null,
      installation_address: form.value.installationAddress || null,
      customer_id: customerIdValue, // null for END_USER/DISTRIBUTOR, backend will auto-link
      notes: form.value.notes || null,
      status: 'active',
    }

    console.log('📤 [RegisterInverter] Sending inverter data:', inverterData)

    const response = await apiClient.post('/inverters', inverterData)
    
    if (response.error) {
      throw new Error(response.error)
    }
    
    // Success - redirect to inverter list (will auto-refresh)
    showSuccess(t('common.messages.inverterRegistered'))
    router.push('/inverters')
  } catch (err) {
    console.error('Error registering inverter:', err)
    error.value = err instanceof Error ? err.message : t('inverters.register.messages.registerError')
  } finally {
    isSubmitting.value = false
  }
}
</script>
