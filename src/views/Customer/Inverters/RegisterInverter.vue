<template>
  <customer-layout>
    <div class="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <!-- Header -->
      <div>
        <router-link
          to="/customer/inverters"
          class="text-sm sm:text-base text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-3 sm:mb-4 inline-block"
        >
          ← {{ t('customers.inverters.register.header.back') }}
        </router-link>
        <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('customers.inverters.register.header.title') }}
        </h1>
        <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
          {{ t('customers.inverters.register.header.subtitle') }}
        </p>
      </div>

      <!-- Error -->
      <div
        v-if="error"
        class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 sm:p-4"
      >
        <p class="text-sm sm:text-base text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Form -->
      <form
        @submit.prevent="handleSubmit"
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-6 shadow-sm space-y-4 sm:space-y-6"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              {{ t('customers.inverters.register.fields.serialNumber') }} <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.serial_number"
              type="text"
              required
              class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              {{ t('customers.inverters.register.fields.model') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative" ref="modelSelectRef">
              <div
                @click="toggleModelDropdown"
                class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer flex items-center justify-between bg-white"
              >
                <span :class="form.model ? 'text-gray-900 dark:text-white truncate' : 'text-gray-400 dark:text-gray-400'">
                  {{ form.model || t('customers.inverters.register.fields.modelPlaceholder') }}
                </span>
                <svg
                  class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform flex-shrink-0 ml-2"
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
                  class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 sm:max-h-60 overflow-hidden"
                >
                  <!-- Search Input -->
                  <div class="p-2 border-b border-gray-200 dark:border-gray-700">
                    <input
                      v-model="modelSearchQuery"
                      type="text"
                      :placeholder="t('customers.inverters.register.model.searchPlaceholder')"
                      class="w-full px-3 py-2 text-xs sm:text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      @click.stop
                      @input.stop
                    />
                  </div>
                  <!-- Options List -->
                  <div class="overflow-y-auto max-h-40 sm:max-h-48">
                    <div
                      v-if="loadingModels"
                      class="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center"
                    >
                      {{ t('customers.inverters.register.model.loading') }}
                    </div>
                    <div
                      v-else-if="filteredModels.length === 0"
                      class="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center"
                    >
                      {{ t('customers.inverters.register.model.notFound') }}
                    </div>
                    <div
                      v-else
                      v-for="model in filteredModels"
                      :key="model.id"
                      @click="selectModel(model)"
                      class="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 truncate"
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
              class="mt-2 sm:mt-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 sm:p-4"
            >
              <p class="text-xs sm:text-sm font-medium text-green-900 dark:text-green-200 mb-2">{{ t('customers.inverters.register.model.info') }}</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                <div v-if="selectedModelInfo.type">
                  <span class="text-gray-600 dark:text-gray-400">{{ t('customers.inverters.register.model.type') }}</span>
                  <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ selectedModelInfo.type }}</span>
                </div>
                <div v-if="selectedModelInfo.manufacturer">
                  <span class="text-gray-600 dark:text-gray-400">{{ t('customers.inverters.register.model.manufacturer') }}</span>
                  <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ selectedModelInfo.manufacturer }}</span>
                </div>
                <div v-if="selectedModelInfo.description" class="md:col-span-2">
                  <span class="text-gray-600 dark:text-gray-400">{{ t('customers.inverters.register.model.description') }}</span>
                  <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ selectedModelInfo.description }}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              {{ t('customers.inverters.register.fields.installationDate') }}
            </label>
            <flat-pickr
              v-model="form.installation_date"
              :config="flatpickrDateConfig"
              class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              :placeholder="t('common.IN18')"
            />
          </div>

          <div>
            <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
              {{ t('customers.inverters.register.fields.installationAddress') }}
            </label>
            <input
              v-model="form.installation_address"
              type="text"
              class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div>
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            {{ t('customers.inverters.register.fields.notes') }}
          </label>
          <textarea
            v-model="form.notes"
            rows="4"
            class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-y"
          ></textarea>
        </div>

        <div class="flex flex-col-reverse sm:flex-row gap-3 justify-end">
          <router-link
            to="/customer/inverters"
            class="px-4 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
          >
            {{ t('customers.inverters.register.actions.cancel') }}
          </router-link>
          <button
            type="submit"
            :disabled="submitting"
            class="px-4 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span v-if="submitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {{ submitting ? t('customers.inverters.register.actions.submitting') : t('customers.inverters.register.actions.submit') }}
          </button>
        </div>
      </form>
    </div>
  </customer-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CustomerLayout from '@/components/layout/CustomerLayout.vue'
import { inverterService } from '@/services/inverterService'
import { apiClient } from '@/services/api'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { useFlatpickrConfig } from '@/composables/useFlatpickr'

const { t } = useI18n()

const router = useRouter()

const { dateConfig } = useFlatpickrConfig()

// Detect mobile device - use touch device detection
const isMobile = ref(false)

const checkMobile = (): void => {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    // Check for touch device or small screen
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
    const isSmallScreen = window.innerWidth < 768
    const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    
    isMobile.value = (hasTouch && isSmallScreen) || isMobileUserAgent
  }
}

const getMaxDate = (): string => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Initialize mobile detection immediately
if (typeof window !== 'undefined') {
  checkMobile()
}

const flatpickrDateConfig = computed(() => ({
  ...dateConfig,
  placeholder: t('common.IN18') || 'Chọn ngày',
  altInputPlaceholder: t('common.IN18') || 'Chọn ngày',
  allowInput: false,
  clickOpens: true,
  enableTime: false,
  dateFormat: 'Y-m-d',
  altFormat: 'd/m/Y',
  mode: 'single' as const,
  static: false,
  inline: false,
  // Enable native mobile picker - flatpickr will automatically use native date input on mobile
  disableMobile: false,
  // Vietnamese locale configuration
  locale: {
    firstDayOfWeek: 1, // Monday
    weekdays: {
      shorthand: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
      longhand: ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'],
    },
    months: {
      shorthand: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T11', 'T12'],
      longhand: [
        'Tháng 1',
        'Tháng 2',
        'Tháng 3',
        'Tháng 4',
        'Tháng 5',
        'Tháng 6',
        'Tháng 7',
        'Tháng 8',
        'Tháng 9',
        'Tháng 10',
        'Tháng 11',
        'Tháng 12',
      ],
    },
  } as any,
}))

const submitting = ref(false)
const error = ref<string | null>(null)
const form = ref({
  serial_number: '',
  model: '',
  type: '',
  power_rating: '',
  installation_date: '',
  installation_address: '',
  notes: '',
})

// Model selection
const availableModels = ref<any[]>([])
const loadingModels = ref(false)
const isModelDropdownOpen = ref(false)
const modelSearchQuery = ref('')
const modelSelectRef = ref<HTMLElement | null>(null)

// Load models from API
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
    error.value = err instanceof Error ? err.message : t('customers.inverters.register.messages.loadModelsError')
  } finally {
    loadingModels.value = false
  }
}

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

// Selected model info
const selectedModelInfo = computed(() => {
  if (!form.value.model) {
    return null
  }
  const model = availableModels.value.find(m => m.name === form.value.model)
  if (model) {
    return {
      name: model.name,
      type: model.type,
      manufacturer: model.manufacturer,
      description: model.description,
    }
  }
  return null
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
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  if (modelSelectRef.value && !modelSelectRef.value.contains(event.target as Node)) {
    isModelDropdownOpen.value = false
  }
}

const handleSubmit = async () => {
  try {
    submitting.value = true
    error.value = null

    // Validation
    if (!form.value.serial_number || !form.value.serial_number.trim()) {
      error.value = t('customers.inverters.register.messages.serialNumberRequired') || 'Serial number is required'
      submitting.value = false
      return
    }

    if (!form.value.model || !form.value.model.trim()) {
      error.value = t('customers.inverters.register.messages.modelRequired') || 'Model is required'
      submitting.value = false
      return
    }

    // Get model info to auto-fill type and power_rating
    const selectedModel = availableModels.value.find(m => m.name === form.value.model)
    
    // Prepare submit data
    const submitData: any = {
      serial_number: form.value.serial_number.trim(),
      model: form.value.model.trim(),
      type: selectedModel?.type || form.value.type || null,
      power_rating: selectedModel?.capacity ? `${selectedModel.capacity} kW` : form.value.power_rating || null,
      installation_date: form.value.installation_date || null,
      installation_address: form.value.installation_address?.trim() || null,
      notes: form.value.notes?.trim() || null,
      status: 'active',
    }

    // If installation_date is provided, use it as warranty_start_date
    if (form.value.installation_date) {
      submitData.warranty_start_date = form.value.installation_date
    }

    console.log('Submitting inverter data:', submitData)

    await inverterService.createInverter(submitData)
    
    router.push('/customer/inverters')
  } catch (err: any) {
    console.error('Error creating inverter:', err)
    error.value = err.message || t('customers.inverters.register.messages.registerError') || 'Failed to register inverter'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  loadModels()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  document.removeEventListener('click', handleClickOutside)
})
</script>
