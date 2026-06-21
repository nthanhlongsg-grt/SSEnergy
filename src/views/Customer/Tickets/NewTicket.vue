<template>
  <customer-layout>
    <div class="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      <!-- Header -->
      <div>
      <router-link
        to="/customer/tickets"
        class="text-sm sm:text-base text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-3 sm:mb-4 inline-block"
      >
        ← {{ t('customers.tickets.new.header.back') }}
      </router-link>
      <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('customers.tickets.new.header.title') }}
      </h1>
      <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
        {{ t('customers.tickets.new.header.subtitle') }}
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
      <!-- Priority and Category - Moved to top -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            {{ t('customers.tickets.new.fields.priority') }}
          </label>
          <div class="relative" ref="prioritySelectRef">
            <div
              @click="togglePriorityDropdown"
              class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white cursor-pointer flex items-center justify-between bg-white"
          >
              <div class="flex-1 min-w-0">
                <div class="font-medium text-gray-900 dark:text-white truncate">
                  {{ t(`customers.tickets.new.priority.${form.priority}`) }}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 italic mt-0.5 line-clamp-1">
                  {{ t(`customers.tickets.new.priority.descriptions.${form.priority}`) }}
                </div>
              </div>
              <svg
                class="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform ml-2 flex-shrink-0"
                :class="{ 'rotate-180': isPriorityDropdownOpen }"
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
                v-if="isPriorityDropdownOpen"
                class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 sm:max-h-80 overflow-y-auto"
              >
                <div
                  v-for="priorityOption in priorityOptions"
                  :key="priorityOption.value"
                  @click="selectPriority(priorityOption.value)"
                  class="px-3 sm:px-4 py-2.5 sm:py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                  :class="{ 'bg-blue-50 dark:bg-blue-900/20': form.priority === priorityOption.value }"
                >
                  <div class="font-medium text-sm sm:text-base text-gray-900 dark:text-white">
                    {{ t(`customers.tickets.new.priority.${priorityOption.value}`) }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400 italic mt-1 leading-relaxed">
                    {{ t(`customers.tickets.new.priority.descriptions.${priorityOption.value}`) }}
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <div>
          <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
            {{ t('customers.tickets.new.fields.category') }} <span class="text-red-500">*</span>
          </label>
          <select
            v-model="form.category"
            required
            class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">{{ t('customers.tickets.new.fields.categoryPlaceholder') }}</option>
            <option value="warranty">{{ t('customers.tickets.new.categories.warranty') }}</option>
            <option value="technical_support">{{ t('customers.tickets.new.categories.technical_support') }}</option>
            <option value="product_consultation">{{ t('customers.tickets.new.categories.product_consultation') }}</option>
            <option value="other">{{ t('customers.tickets.new.categories.other') }}</option>
          </select>
        </div>
      </div>

      <div>
        <label id="serialNumberField" class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
          {{ t('customers.tickets.new.fields.serialNumber') }} <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <input
            type="text"
            v-model="serialNumberSearch"
            @focus="showSerialDropdown = true"
            @input="searchSerialNumber"
            @blur="handleSerialBlur"
            :placeholder="t('customers.tickets.new.fields.serialNumberPlaceholder')"
            required
            class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <!-- Dropdown list -->
          <div
            v-if="showSerialDropdown"
            class="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 sm:max-h-60 overflow-y-auto"
          >
            <ul v-if="filteredSerialNumbers && filteredSerialNumbers.length > 0">
              <li
                v-for="inverter in filteredSerialNumbers"
                :key="inverter.id"
                @click="selectInverter(inverter)"
                class="px-3 sm:px-4 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-xs sm:text-sm"
              >
                <span class="font-medium">{{ inverter.serial_number }}</span>
                <span class="text-gray-500 dark:text-gray-400 ml-2">- {{ inverter.model }}</span>
              </li>
            </ul>
            <p v-else class="px-3 sm:px-4 py-2 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
              {{ t('customers.tickets.new.device.notFound') }}
            </p>
          </div>
        </div>
        <!-- Thiết bị đã được chọn -->
        <p v-if="form.inverter_id" class="mt-1.5 sm:mt-1 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ t('customers.tickets.new.device.selected') }} {{ getSelectedInverterDisplay() }}
        </p>

        <!-- Cảnh báo: SN đã nhập nhưng không tìm thấy trong hệ thống -->
        <div
          v-if="serialNumberSearch.trim() && !form.inverter_id && !showSerialDropdown"
          class="mt-2 flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700"
        >
          <svg class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <div class="text-xs text-amber-800 dark:text-amber-300">
            <p class="font-medium">
              Số SN <span class="font-mono font-bold">{{ serialNumberSearch.trim() }}</span> chưa được đăng ký trong hệ thống.
            </p>
            <p class="mt-0.5">
              Vui lòng đăng ký thiết bị trước khi tạo yêu cầu hỗ trợ.
              <router-link
                to="/devices/register"
                class="underline font-semibold text-amber-900 dark:text-amber-200 hover:text-amber-700 ml-1"
              >
                {{ t('customers.tickets.new.messages.deviceNotRegisteredLink') }}
              </router-link>
            </p>
          </div>
        </div>
      </div>

      <div>
        <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
          {{ t('customers.tickets.new.fields.title') }} <span class="text-red-500">*</span>
        </label>
        <input
          v-model="form.title"
          type="text"
          required
          class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
      </div>

      <div>
        <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
          {{ t('customers.tickets.new.fields.description') }} <span class="text-red-500">*</span>
        </label>
        <textarea
          v-model="form.description"
          rows="5"
          required
          class="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-y"
        ></textarea>
      </div>

      <!-- Image Upload Section -->
      <div>
        <label class="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
          {{ t('customers.tickets.new.fields.images') }} <span class="text-red-500">*</span>
          <span class="text-xs text-gray-500 dark:text-gray-400 ml-1 sm:ml-2">{{ t('customers.tickets.new.fields.imagesMax') }}</span>
        </label>
        <div
          ref="imageUploadZoneRef"
          class="space-y-2 sm:space-y-3 rounded-lg border border-transparent p-2 -m-2 outline-none focus:ring-2 focus:ring-blue-400"
          tabindex="0"
          @click="focusImageUploadZone"
          @paste="handleImagePaste"
        >
          <!-- File Input (Hidden) -->
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            multiple
            @change="handleFileSelect"
            class="hidden"
          />
          
          <!-- Select Button and Preview -->
          <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <button
              type="button"
              @click="fileInput?.click()"
              :disabled="selectedImages && selectedImages.length >= 4"
              class="flex items-center gap-2 px-3 sm:px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
            >
              <svg class="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{{ t('customers.tickets.new.images.select') }}</span>
            </button>
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
              <span v-if="selectedImages && selectedImages.length > 0" class="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {{ t('customers.tickets.new.images.selected', { count: selectedImages.length }) }}
              </span>
              <span v-if="selectedImages && selectedImages.length >= 4" class="text-xs sm:text-sm text-red-500 dark:text-red-400">
                {{ t('customers.tickets.new.images.limitReached') }}
              </span>
            </div>
          </div>

          <!-- Image Previews -->
          <div v-if="selectedImages && selectedImages.length > 0" class="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div
              v-for="(image, index) in selectedImages"
              :key="index"
              class="relative group"
            >
              <img
                :src="image.preview"
                :alt="image.name"
                class="w-full h-20 sm:h-24 object-cover rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                @click="openImageModal(image.preview)"
              />
              <button
                type="button"
                @click="removeImage(index)"
                class="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center opacity-75 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-red-600 text-sm sm:text-base"
              >
                ×
              </button>
            </div>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ t('customers.tickets.new.images.pasteHint') }}
          </p>
        </div>
      </div>

      <div class="flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
        <router-link
          to="/customer/tickets"
          class="px-4 sm:px-6 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center"
        >
          {{ t('customers.tickets.new.actions.cancel') }}
        </router-link>
        <button
          type="submit"
          :disabled="submitting"
          class="px-4 sm:px-6 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span v-if="submitting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          {{ submitting ? t('customers.tickets.new.actions.submitting') : t('customers.tickets.new.actions.submit') }}
        </button>
      </div>
    </form>
    
    <!-- Image Modal -->
    <div
      v-if="selectedImageModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-2 sm:p-4"
      @click="selectedImageModal = null"
    >
      <div class="max-w-4xl max-h-[95vh] sm:max-h-[90vh] relative" @click.stop>
        <img
          :src="selectedImageModal"
          alt="Preview"
          class="max-w-full max-h-[95vh] sm:max-h-[90vh] rounded-lg"
        />
        <button
          @click="selectedImageModal = null"
          class="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white text-gray-800 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center hover:bg-gray-100 transition-colors text-lg sm:text-xl"
        >
          ×
        </button>
      </div>
    </div>
    </div>
  </customer-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import CustomerLayout from '@/components/layout/CustomerLayout.vue'
import { ticketService } from '@/services/ticketService'
import { inverterService } from '@/services/inverterService'
import { useAuth } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'
import { compressImage as compressImageFile, filterImageFiles } from '@/utils/imageUpload'
import { useImagePaste } from '@/composables/useImagePaste'

const { showSuccess } = useToast()

const { t } = useI18n()

const router = useRouter()
const route = useRoute()
const { getUser } = useAuth()

const submitting = ref(false)
const error = ref<string | null>(null)
const inverters = ref<any[]>([])
const form = ref({
  inverter_id: null as number | null,
  title: '',
  description: '',
  priority: 'medium',
  category: '',
})
const selectedImages = ref<Array<{ file: File; preview: string; name: string }>>([])
const fileInput = ref<HTMLInputElement | null>(null)
const imageUploadZoneRef = ref<HTMLElement | null>(null)
const selectedImageModal = ref<string | null>(null)

// Search functionality
const serialNumberSearch = ref('')
const showSerialDropdown = ref(false)
const filteredSerialNumbers = ref<any[]>([])

// Priority dropdown
const prioritySelectRef = ref<HTMLElement | null>(null)
const isPriorityDropdownOpen = ref(false)
const priorityOptions = [
  { value: 'low' },
  { value: 'medium' },
  { value: 'high' },
  { value: 'urgent' },
]

const loadInverters = async () => {
  try {
    const response = await inverterService.getAllInverters({ limit: 100, page: 1 })
    inverters.value = response.data || []
    filteredSerialNumbers.value = inverters.value
    
    // Nếu có inverter_id từ query, set vào form
    if (route.query.inverter_id) {
      const invId = parseInt(route.query.inverter_id as string)
      form.value.inverter_id = invId
      const selectedInv = inverters.value.find(i => i.id === invId)
      if (selectedInv) {
        serialNumberSearch.value = `${selectedInv.serial_number} - ${selectedInv.model}`
      }
    }
  } catch (err) {
    console.error('Error loading inverters:', err)
  }
}

const searchSerialNumber = () => {
  showSerialDropdown.value = true // Ensure dropdown shows when typing
  if (!serialNumberSearch.value.trim()) {
    filteredSerialNumbers.value = inverters.value || []
    return
  }
  const query = serialNumberSearch.value.toLowerCase().trim()
  filteredSerialNumbers.value = (inverters.value || []).filter(
    (inv) => 
      inv.serial_number?.toLowerCase().includes(query) ||
      inv.model?.toLowerCase().includes(query)
  )
}

const selectInverter = (inverter: any) => {
  form.value.inverter_id = inverter.id
  serialNumberSearch.value = `${inverter.serial_number} - ${inverter.model}`
  showSerialDropdown.value = false
}

const handleSerialBlur = () => {
  // Delay to allow click event on dropdown item to trigger
  setTimeout(() => {
    showSerialDropdown.value = false
  }, 200)
}

const togglePriorityDropdown = () => {
  isPriorityDropdownOpen.value = !isPriorityDropdownOpen.value
}

const selectPriority = (value: string) => {
  form.value.priority = value
  isPriorityDropdownOpen.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  if (prioritySelectRef.value && !prioritySelectRef.value.contains(event.target as Node)) {
    isPriorityDropdownOpen.value = false
  }
}

const getSelectedInverterDisplay = () => {
  if (!form.value.inverter_id) return ''
  const inv = inverters.value.find(i => i.id === form.value.inverter_id)
  return inv ? `${inv.serial_number} - ${inv.model}` : ''
}

const addSelectedImages = async (files: File[]) => {
  const imageFiles = filterImageFiles(files)
  if (imageFiles.length === 0) return

  const currentCount = selectedImages.value?.length || 0
  const remainingSlots = 4 - currentCount
  if (remainingSlots <= 0) {
    error.value = t('customers.tickets.new.messages.imageLimit')
    return
  }

  const filesToAdd = imageFiles.slice(0, remainingSlots)
  if (imageFiles.length > remainingSlots) {
    error.value = t('customers.tickets.new.messages.imageLimitPartial', { count: remainingSlots })
  }

  for (const file of filesToAdd) {
    try {
      const compressedFile = await compressImageFile(file, 1920, 1920, 0.7, file.type || 'image/jpeg')
      const reader = new FileReader()
      reader.onload = (e) => {
        selectedImages.value.push({
          file: compressedFile,
          preview: e.target?.result as string,
          name: compressedFile.name,
        })
      }
      reader.readAsDataURL(compressedFile)
    } catch (err) {
      console.error('Error compressing image:', err)
      const reader = new FileReader()
      reader.onload = (e) => {
        selectedImages.value.push({
          file,
          preview: e.target?.result as string,
          name: file.name,
        })
      }
      reader.readAsDataURL(file)
    }
  }
}

const { handlePaste: handleImagePaste, focusZone: focusImageUploadZone } = useImagePaste(addSelectedImages, {
  enabled: () => (selectedImages.value?.length || 0) < 4,
  zoneRef: imageUploadZoneRef,
  globalImagePaste: true,
})

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    await addSelectedImages(Array.from(target.files))
    target.value = ''
  }
}

const removeImage = (index: number) => {
  selectedImages.value.splice(index, 1)
}

const openImageModal = (imageSrc: string) => {
  selectedImageModal.value = imageSrc
}

const handleSubmit = async () => {
  try {
    submitting.value = true
    error.value = null

    // Validate required category
    if (!form.value.category || form.value.category.trim() === '') {
      error.value = t('customers.tickets.new.messages.categoryRequired')
      submitting.value = false
      return
    }

    // Validate required serial number (inverter_id)
    if (!form.value.inverter_id) {
      if (serialNumberSearch.value.trim()) {
        // User typed a SN but it's not registered in the system
        error.value = `Số SN "${serialNumberSearch.value.trim()}" chưa được đăng ký trong hệ thống. Vui lòng đăng ký thiết bị trước khi tạo yêu cầu hỗ trợ.`
      } else {
        // User didn't enter anything
        error.value = t('customers.tickets.new.messages.serialNumberRequired')
      }
      submitting.value = false
      // Scroll to the SN field
      document.getElementById('serialNumberField')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }

    // Validate required images
    if (!selectedImages.value || selectedImages.value.length === 0) {
      error.value = t('customers.tickets.new.messages.imageRequired')
      submitting.value = false
      return
    }

    // Get customer_id from inverter or user
    let customerId: number | undefined
    if (form.value.inverter_id) {
      const selectedInverter = inverters.value.find(i => i.id === form.value.inverter_id)
      customerId = selectedInverter?.customer_id
    }
    // If no customer_id from inverter, use current user's id (backend will resolve to customer)
    if (!customerId && getUser.value) {
      customerId = getUser.value.id
    }
    
    if (!customerId) {
      error.value = t('customers.tickets.new.messages.customerNotFound')
      submitting.value = false
      return
    }

    // Create ticket first
    const newTicket = await ticketService.createTicket({
      ...form.value,
      inverter_id: form.value.inverter_id || undefined,
      customer_id: customerId,
      priority: form.value.priority as 'urgent' | 'high' | 'medium' | 'low',
    })
    
    // Upload images if any
    if (selectedImages.value && selectedImages.value.length > 0 && newTicket.id) {
      for (const image of selectedImages.value) {
        try {
          // Convert file to base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              // Remove data:image/...;base64, prefix
              const base64Data = result.includes(',') ? result.split(',')[1] : result
              resolve(base64Data)
            }
            reader.onerror = reject
            reader.readAsDataURL(image.file)
          })

          await ticketService.uploadAttachment(newTicket.id, {
            file: base64,
            filename: image.name,
            mime_type: image.file.type,
            file_size: image.file.size,
          })
        } catch (uploadErr) {
          console.error('Error uploading image:', uploadErr)
          // Continue with other images even if one fails
        }
      }
    }
    
    showSuccess(t('common.messages.ticketCreated'))
    router.push('/customer/tickets')
  } catch (err: any) {
    console.error('Error creating ticket:', err)
    error.value = err.message || t('customers.tickets.new.messages.createError')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadInverters()
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
