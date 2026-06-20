<template>
  <admin-layout>
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('tickets.new.header.title') }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          {{ t('tickets.new.header.subtitle') }}
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
        <!-- Loại ticket + Thiết bị -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              for="ticketType"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {{ t('tickets.new.ticketInfo.typeLabel') }} <span class="text-red-500">*</span>
            </label>
            <select
              id="ticketType"
              v-model="form.ticketType"
              required
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option
                v-for="option in ticketTypeOptions"
                :key="option.value || 'type-all'"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>

          <div>
            <label
              for="serialNumberSearch"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {{ t('tickets.new.device.label') }} <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                id="serialNumberSearch"
                v-model="serialNumberSearch"
                @focus="openSerialDropdown"
                @blur="handleSerialBlur"
                @input="searchSerialNumber"
                type="text"
                :placeholder="t('tickets.new.device.serialPlaceholder')"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <transition name="fade">
                <div
                  v-if="showSerialDropdown"
                  class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  <div
                    v-if="filteredSerialNumbers.length > 0"
                    v-for="inv in filteredSerialNumbers"
                    :key="inv.id"
                    @mousedown.prevent="selectInverterBySerial(inv)"
                    class="px-4 py-2 text-sm text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                    :class="{ 'bg-blue-50 dark:bg-blue-900/20': form.inverterId === inv.id.toString() }"
                  >
                    <span class="font-mono">{{ serialWithContractLabel(inv.serial_number, inv.contract_numbers) }}</span>
                    <span class="text-gray-500 dark:text-gray-400"> · {{ inv.model }}</span>
                  </div>
                  <div
                    v-if="filteredSerialNumbers.length === 0 && !loadingInverters"
                    class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center"
                  >
                    {{ serialNumberSearch.trim() ? t('tickets.new.device.noDevicesFound') : t('tickets.new.device.noDevicesInList') }}
                  </div>
                  <div
                    v-if="loadingInverters"
                    class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center"
                  >
                    {{ t('tickets.new.device.loadingDevices') }}
                  </div>
                </div>
              </transition>
            </div>

          </div>
        </div>

        <!-- Inverter Details (read-only from contract) -->
        <div v-if="selectedInverterDetails" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ t('tickets.new.device.infoTitle') }}
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.device.fields.serial') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white font-mono">
                {{ serialWithContractLabel(selectedInverterDetails.serial_number, selectedInverterDetails.contract_numbers) }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.device.fields.model') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ selectedInverterDetails.model || t('common.na') }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.device.fields.type') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ selectedInverterDetails.type || t('common.na') }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.device.fields.power') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ selectedInverterDetails.power_rating || t('common.na') }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.device.fields.warrantyStart') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ formatDate(selectedInverterDetails.warranty_start_date) }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.device.fields.warrantyEnd') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ formatDate(selectedInverterDetails.warranty_end_date) }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.device.fields.installationAddress') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ selectedInverterDetails.installation_address || t('common.na') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Customer Info (read-only from contract) -->
        <div v-if="selectedInverterDetails || (isEndUser && currentUser)" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ t('tickets.new.customer.title') }}
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.customer.name') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ isEndUser ? currentUser?.name : (selectedCustomerDetails?.name || t('tickets.new.customer.unassigned')) }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.customer.email') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ isEndUser ? currentUser?.email : (selectedCustomerDetails?.email || t('common.na')) }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.customer.phone') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ isEndUser ? (currentUser?.phone || t('common.na')) : (selectedCustomerDetails?.phone || t('common.na')) }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.customer.address') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ isEndUser ? ((currentUser as any)?.address || t('common.na')) : (selectedCustomerDetails?.address || t('common.na')) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Title -->
        <div>
          <label
            for="title"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {{ t('tickets.new.ticketInfo.titleLabel') }} <span class="text-red-500">*</span>
          </label>
          <input
            id="title"
            v-model="form.title"
            required
            type="text"
            :placeholder="t('tickets.new.ticketInfo.titlePlaceholder')"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <!-- Description -->
        <div>
          <label
            for="description"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {{ t('tickets.new.ticketInfo.descriptionLabel') }} <span class="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            v-model="form.description"
            required
            rows="5"
            :placeholder="t('tickets.new.ticketInfo.descriptionPlaceholder')"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          ></textarea>
        </div>

        <!-- Attachments (Images Only) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('tickets.new.attachments.label') }}
            <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">
              ({{ form.attachments.length }}/4)
            </span>
          </label>
          <div
            ref="attachmentZoneRef"
            class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
            :class="{ 'border-blue-400 bg-blue-50 dark:bg-blue-900/20': isDragging }"
            tabindex="0"
            @click="focusAttachmentZone"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
            @paste="handleAttachmentPaste"
          >
            <input
              ref="fileUploadInput"
              type="file"
              :multiple="form.attachments.length < 4"
              accept="image/*"
              @change="handleFileUpload"
              class="hidden"
              id="file-upload"
              :disabled="form.attachments.length >= 4"
            />
            <button
              type="button"
              @click.stop="fileUploadInput?.click()"
              class="cursor-pointer flex flex-col items-center w-full mx-auto"
              :class="{ 'cursor-not-allowed opacity-50': form.attachments.length >= 4 }"
              :disabled="form.attachments.length >= 4"
            >
              <svg
                class="w-12 h-12 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ t('tickets.new.attachments.hint') }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {{ t('tickets.new.attachments.help') }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                {{ t('common.imageUpload.pasteHint') }}
              </span>
            </button>
            <!-- Image Previews -->
            <div v-if="form.attachments.length > 0" class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                v-for="(preview, index) in form.attachmentPreviews"
                :key="index"
                class="relative group"
              >
                <img
                  :src="preview"
                  :alt="form.attachments[index]?.name"
                  class="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                />
                <button
                  type="button"
                  @click="removeFile(index)"
                  class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  :title="t('tickets.new.attachments.remove')"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div class="absolute bottom-2 left-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded truncate">
                  {{ form.attachments[index]?.name }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-4 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            @click="$router.back()"
            class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {{ t('tickets.new.actions.cancel') }}
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? t('tickets.new.actions.submitting') : t('tickets.new.actions.submit') }}
          </button>
        </div>
      </form>

      <!-- Modal: Create New Inverter -->
      <div
        v-if="showNewInverterModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-gray-700/45 dark:bg-gray-900/65"
        @click.self="closeNewInverterModal"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ t('tickets.new.modal.title') }}
              </h2>
              <button
                @click="closeNewInverterModal"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form @submit.prevent="createNewInverter" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('tickets.new.modal.serialLabel') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="newInverterForm.serial_number"
                    type="text"
                    required
                    :placeholder="t('tickets.new.modal.serialPlaceholder')"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('tickets.new.modal.modelLabel') }} <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <!-- Searchable Model Dropdown -->
                    <div class="relative">
                    <input
                        v-model="modelSearchQuery"
                        @focus="showModelDropdown = true"
                        @blur="handleModelBlur"
                      type="text"
                        :placeholder="t('inverters.register.form.searchModel')"
                        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <transition name="fade">
                        <div
                          v-if="showModelDropdown"
                          class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                          <div
                            v-if="filteredModels.length === 0"
                            class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center"
                          >
                            {{ t('inverters.register.form.noModelsFound') }}
                  </div>
                          <div
                            v-for="model in filteredModels"
                            :key="model.id"
                            @mousedown.prevent="selectModel(model)"
                            class="px-4 py-2 text-sm text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                            :class="{ 'bg-blue-50 dark:bg-blue-900/20': newInverterForm.model === model.name }"
                          >
                            {{ model.name }} {{ model.manufacturer ? `(${model.manufacturer})` : '' }}
                </div>
                          <div
                            @mousedown.prevent="selectNewModel"
                            class="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700"
                          >
                            + {{ t('tickets.new.modal.modelCreate') }}
                </div>
                        </div>
                      </transition>
                    </div>
                    <!-- Selected Model Display -->
                    <div v-if="newInverterForm.model && newInverterForm.model !== '__NEW__'" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {{ t('tickets.new.modal.modelLabel') }}: <span class="font-medium text-gray-900 dark:text-white">{{ newInverterForm.model }}</span>
                    </div>
                    <!-- New Model Input -->
                  <input
                      v-if="newInverterForm.model === '__NEW__'"
                      v-model="newModelName"
                    type="text"
                      required
                      :placeholder="t('tickets.new.modal.modelNewPlaceholder')"
                      class="mt-2 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  </div>
                </div>
              </div>
              
              <!-- Installation Address -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('tickets.new.modal.addressLabel') }}
                </label>
                <input
                  v-model="newInverterForm.installation_address"
                  type="text"
                  :placeholder="t('tickets.new.modal.addressPlaceholder')"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div v-if="error" class="text-red-600 dark:text-red-400 text-sm">
                {{ error }}
              </div>

              <div class="flex gap-4 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  @click="closeNewInverterModal"
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {{ t('tickets.new.modal.cancel') }}
                </button>
                <button
                  type="submit"
                  :disabled="creatingInverter"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {{ creatingInverter ? t('tickets.new.modal.submitting') : t('tickets.new.modal.submit') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { ticketService } from '@/services/ticketService'
import { apiClient } from '@/services/api'
import { useAuth, UserRole } from '@/composables/useAuth'
import { formatDate } from '@/utils/dateTime'
import { serialWithContractLabel } from '@/utils/inverterDisplay'
import { useToast } from '@/composables/useToast'
import { compressImage, filterImageFiles, readFileAsDataUrl } from '@/utils/imageUpload'
import { useImagePaste } from '@/composables/useImagePaste'

const { showSuccess } = useToast()

const router = useRouter()
const route = useRoute()
const { t } = useI18n()
const { getUser } = useAuth()
const currentUser = computed(() => getUser.value)
const isEndUser = computed(() => currentUser.value?.role === UserRole.END_USER)

const form = ref({
  customerId: '',
  inverterId: '',
  ticketType: '',
  title: '',
  description: '',
  attachments: [] as File[],
  attachmentPreviews: [] as string[], // Base64 previews for images
})

const allInverters = ref<any[]>([])
const filteredInverters = ref<any[]>([])
const selectedInverter = ref<any>(null)
const selectedInverterDetails = ref<any>(null)
const selectedCustomerDetails = ref<any>(null)
const serialNumberSearch = ref<string>('')
const showSerialDropdown = ref<boolean>(false)
const filteredSerialNumbers = ref<any[]>([])
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const isDragging = ref(false)
const compressingImages = ref(false)
const loadingInverters = ref(false)
const showNewInverterModal = ref(false)
const creatingInverter = ref(false)
const contractIdFromQuery = ref<number | null>(null)

const newInverterForm = ref({
  serial_number: '',
  model: '',
  installation_address: '',
})

const availableModels = ref<any[]>([])
const newModelName = ref<string>('')
const loadingModels = ref(false)
const modelSearchQuery = ref<string>('')
const showModelDropdown = ref<boolean>(false)
const attachmentZoneRef = ref<HTMLElement | null>(null)
const fileUploadInput = ref<HTMLInputElement | null>(null)

const ticketTypeOptions = computed(() => [
  { value: '', label: t('tickets.new.ticketInfo.typePlaceholder') },
  { value: 'repair', label: t('tickets.new.ticketInfo.types.repair') },
  { value: 'warranty', label: t('tickets.new.ticketInfo.types.warranty') },
  { value: 'other', label: t('tickets.new.ticketInfo.types.other') },
])

const filterInvertersForSearch = (query: string) => {
  const q = query.toLowerCase().trim()
  const list = !q
    ? allInverters.value
    : allInverters.value.filter((inv) => {
        const sn = inv.serial_number?.toLowerCase() || ''
        const model = inv.model?.toLowerCase() || ''
        const contracts = inv.contract_numbers?.toLowerCase() || ''
        const label = serialWithContractLabel(inv.serial_number, inv.contract_numbers).toLowerCase()
        return sn.includes(q) || model.includes(q) || contracts.includes(q) || label.includes(q)
      })
  return list.slice(0, 50)
}

const openSerialDropdown = () => {
  showSerialDropdown.value = true
  filteredSerialNumbers.value = filterInvertersForSearch(serialNumberSearch.value)
}

const deviceTypeOptions = computed(() => [
  { value: '', label: t('tickets.new.modal.typePlaceholder') },
  { value: 'Hòa lưới', label: t('tickets.new.modal.types.grid') },
  { value: 'Hybrid', label: t('tickets.new.modal.types.hybrid') },
  { value: 'Logger', label: t('tickets.new.modal.types.logger') },
  { value: 'Meter', label: t('tickets.new.modal.types.meter') },
  { value: 'BESS', label: t('tickets.new.modal.types.bess') },
  { value: 'Khác', label: t('tickets.new.modal.types.other') },
])

// Auto-fill customer info for END_USER
const customerInfo = computed(() => {
  if (isEndUser.value && currentUser.value) {
    return {
      id: currentUser.value.id,
      name: currentUser.value.name,
      email: currentUser.value.email,
      phone: currentUser.value.phone || '',
    }
  }
  return null
})

// Computed: Get unique models from inverters
const uniqueModels = computed(() => {
  const models = new Set<string>()
  allInverters.value.forEach((inv) => {
    if (inv.model) {
      models.add(inv.model)
    }
  })
  return Array.from(models).sort()
})

// Load data on mount
onMounted(async () => {
  await loadAllInverters()
  await loadModels()
  await applyRoutePrefill()
})

async function applyRoutePrefill() {
  const q = route.query
  if (q.customer_id) {
    form.value.customerId = String(q.customer_id)
  }
  if (q.contract_id) {
    const cid = parseInt(String(q.contract_id), 10)
    if (!isNaN(cid) && cid > 0) contractIdFromQuery.value = cid
  }
  if (q.category && typeof q.category === 'string') {
    form.value.ticketType = q.category
  }
  if (q.inverter_id) {
    const invId = parseInt(String(q.inverter_id), 10)
    if (!isNaN(invId) && invId > 0) {
      form.value.inverterId = String(invId)
      const inv = allInverters.value.find((i) => i.id === invId)
      if (inv) {
        serialNumberSearch.value = serialWithContractLabel(inv.serial_number, inv.contract_numbers)
      }
      await onInverterSelected()
    }
  }
}

const loadModels = async () => {
  loadingModels.value = true
  try {
    const response = await apiClient.get('/models?status=active')
    if (response.error) {
      throw new Error(response.error)
    }
    availableModels.value = Array.isArray(response.data) ? response.data : []
  } catch (err) {
    console.error('Error loading models:', err)
  } finally {
    loadingModels.value = false
  }
}

const filteredModels = computed(() => {
  if (!modelSearchQuery.value) {
    return availableModels.value.filter(m => m.status === 'active')
  }
  const query = modelSearchQuery.value.toLowerCase()
  return availableModels.value.filter(
    (model) =>
      model.status === 'active' &&
      (model.name?.toLowerCase().includes(query) ||
        model.manufacturer?.toLowerCase().includes(query) ||
        model.type?.toLowerCase().includes(query))
  )
})

const selectModel = (model: any) => {
  newInverterForm.value.model = model.name
  modelSearchQuery.value = model.name
  showModelDropdown.value = false
    newModelName.value = ''
}

const selectNewModel = () => {
  newInverterForm.value.model = '__NEW__'
  modelSearchQuery.value = ''
  showModelDropdown.value = false
  newModelName.value = ''
}

const closeNewInverterModal = () => {
  showNewInverterModal.value = false
  modelSearchQuery.value = ''
  showModelDropdown.value = false
  newInverterForm.value = { serial_number: '', model: '', installation_address: '' }
  newModelName.value = ''
}

const onModelSelected = () => {
  if (newInverterForm.value.model === '__NEW__') {
    newModelName.value = ''
    return
  }
  newModelName.value = ''
}

const loadAllInverters = async () => {
  loadingInverters.value = true
  try {
    // Backend will automatically filter by user for END_USER
    const response = await apiClient.get('/inverters?limit=1000')
    if (response.error) {
      throw new Error(response.error)
    }
    const data = response.data as any
    allInverters.value = Array.isArray(data) ? data : (data?.data || [])
    filteredInverters.value = allInverters.value
    filteredSerialNumbers.value = filterInvertersForSearch(serialNumberSearch.value)
  } catch (err) {
    console.error('Error loading inverters:', err)
    error.value = t('tickets.new.messages.loadDevicesError')
  } finally {
    loadingInverters.value = false
  }
}

const createNewInverter = async () => {
  if (!newInverterForm.value.serial_number) {
    error.value = t('tickets.new.messages.serialRequired')
    return
  }

  let finalModel = newInverterForm.value.model

  // If user selected "Create new model", create it first
  if (newInverterForm.value.model === '__NEW__') {
    if (!newModelName.value.trim()) {
      error.value = t('tickets.new.messages.newModelNameRequired')
      return
    }

    creatingInverter.value = true
    error.value = null

    try {
      // Create new model
      const modelResponse = await apiClient.post('/models', {
        name: newModelName.value.trim(),
        manufacturer: 'SSE',
        type: null, // Type will be set based on model selection
      })

      if (modelResponse.error) {
        throw new Error(modelResponse.error)
      }

      const newModel = modelResponse.data as any
      finalModel = newModel.name

      // Reload models list
      await loadModels()
    } catch (err) {
      console.error('Error creating model:', err)
      error.value = err instanceof Error ? err.message : t('tickets.new.messages.createModelError')
      creatingInverter.value = false
      return
    }
  }

  if (!finalModel) {
    error.value = t('tickets.new.messages.modelRequired')
    return
  }

  creatingInverter.value = true
  error.value = null

  try {
    const inverterData: any = {
      serial_number: newInverterForm.value.serial_number,
      model: finalModel,
      installation_address: newInverterForm.value.installation_address || null,
    }
    
    // Get type from selected model if available
    const selectedModel = availableModels.value.find(m => m.name === finalModel)
    if (selectedModel?.type) {
      inverterData.type = selectedModel.type
    }

    // For non-END_USER: link to selected customer
    if (!isEndUser.value && form.value.customerId) {
      inverterData.customer_id = parseInt(form.value.customerId)
    }
    // For END_USER: backend will auto-link to user's customer record

    const response = await apiClient.post('/inverters', inverterData)
    if (response.error) {
      throw new Error(response.error)
    }

    // Reload inverters list
    await loadAllInverters()

    // Auto-select the newly created inverter
    const newInverter = response.data as any
    if (newInverter) {
      await loadAllInverters() // Reload to include the new inverter
      form.value.inverterId = newInverter.id.toString()
      serialNumberSearch.value = newInverter.serial_number || newInverterForm.value.serial_number
      await onInverterSelected()
    }

    closeNewInverterModal()
  } catch (err) {
    console.error('Error creating inverter:', err)
    error.value = err instanceof Error ? err.message : t('tickets.new.messages.createDeviceError')
  } finally {
    creatingInverter.value = false
  }
}

// Handle inverter selection - Load full details from API
const onInverterSelected = async () => {
  if (!form.value.inverterId) {
    selectedInverter.value = null
    selectedInverterDetails.value = null
    selectedCustomerDetails.value = null
    form.value.customerId = ''
    return
  }

  const inverter = allInverters.value.find(
    (inv) => inv.id === parseInt(form.value.inverterId)
  )

  if (inverter) {
    selectedInverter.value = inverter
    
    // Load full inverter details from API
    try {
      const response = await apiClient.get(`/inverters/${inverter.id}`)
      if (response.error) {
        throw new Error(response.error)
      }
      selectedInverterDetails.value = response.data as any
      
      // Extract customer information from inverter details
      if (selectedInverterDetails.value?.customer_id) {
        form.value.customerId = selectedInverterDetails.value.customer_id.toString()
        
        // Load customer details
        selectedCustomerDetails.value = {
          customer_id: selectedInverterDetails.value.customer_id,
          name: selectedInverterDetails.value.customer_name || '',
          email: selectedInverterDetails.value.customer_email || '',
          phone: selectedInverterDetails.value.customer_phone || '',
          address: selectedInverterDetails.value.customer_address || '',
        }
      } else {
        // For END_USER: Auto-assign personal info to device if not assigned
        if (isEndUser.value && currentUser.value) {
          await autoAssignEndUserToInverter()
        } else {
          selectedCustomerDetails.value = null
          form.value.customerId = ''
        }
      }
      
    } catch (err) {
      console.error('Error loading inverter details:', err)
      error.value = err instanceof Error ? err.message : t('tickets.new.messages.loadDetailsError')
    }
  }
}

// Format date helper

// Search serial number
const searchSerialNumber = () => {
  filteredSerialNumbers.value = filterInvertersForSearch(serialNumberSearch.value)
  if (!serialNumberSearch.value.trim()) {
    form.value.inverterId = ''
    selectedInverterDetails.value = null
    selectedCustomerDetails.value = null
  }
}

// Select inverter by serial number
const selectInverterBySerial = (inverter: any) => {
  form.value.inverterId = inverter.id.toString()
  serialNumberSearch.value = serialWithContractLabel(inverter.serial_number, inverter.contract_numbers)
  showSerialDropdown.value = false
  onInverterSelected()
}

// Handle blur events with delay
const handleSerialBlur = () => {
  setTimeout(() => {
    showSerialDropdown.value = false
  }, 200)
}

const handleModelBlur = () => {
  setTimeout(() => {
    showModelDropdown.value = false
  }, 200)
}

// Auto-assign END_USER personal info to inverter
const autoAssignEndUserToInverter = async () => {
  if (!isEndUser.value || !currentUser.value || !selectedInverterDetails.value?.id) return
  
  // If inverter already has customer, skip
  if (selectedInverterDetails.value?.customer_id) {
    // Load customer details if exists
    selectedCustomerDetails.value = {
      customer_id: selectedInverterDetails.value.customer_id,
      name: selectedInverterDetails.value.customer_name || '',
      email: selectedInverterDetails.value.customer_email || '',
      phone: selectedInverterDetails.value.customer_phone || '',
      address: selectedInverterDetails.value.customer_address || '',
    }
    form.value.customerId = selectedInverterDetails.value.customer_id.toString()
    return
  }
  
  try {
    // The backend will handle finding or creating customer record from user's email/phone
    const updateData: any = {
      customer_id: currentUser.value.id, // Send user ID, backend will resolve to customer
    }

    const response = await apiClient.put(`/inverters/${selectedInverterDetails.value.id}`, updateData)
    if (response.error) {
      throw new Error(response.error)
    }

    // Reload inverter details to refresh customer info (only once)
    const reloadResponse = await apiClient.get(`/inverters/${selectedInverterDetails.value.id}`)
    if (reloadResponse.error) {
      throw new Error(reloadResponse.error)
    }
    
    selectedInverterDetails.value = reloadResponse.data as any
    
    // Extract customer information from reloaded data
    if (selectedInverterDetails.value?.customer_id) {
      form.value.customerId = selectedInverterDetails.value.customer_id.toString()
      
      selectedCustomerDetails.value = {
        customer_id: selectedInverterDetails.value.customer_id,
        name: selectedInverterDetails.value.customer_name || currentUser.value.name || '',
        email: selectedInverterDetails.value.customer_email || currentUser.value.email || '',
        phone: selectedInverterDetails.value.customer_phone || currentUser.value.phone || '',
        address: selectedInverterDetails.value.customer_address || (currentUser.value as any).address || '',
      }
    }
  } catch (err) {
    console.error('Error auto-assigning END_USER to inverter:', err)
    // Don't show error to user, just log it
  }
}

// Add attachment files (file picker, drag-drop, clipboard)
const addAttachmentFiles = async (files: File[]) => {
  const imageFiles = filterImageFiles(files)
  if (imageFiles.length === 0) {
    error.value = t('tickets.new.messages.onlyImagesAllowed')
    return
  }

  const remainingSlots = 4 - form.value.attachments.length
  if (remainingSlots <= 0) {
    error.value = t('tickets.new.messages.maxImagesReached', { max: 4 })
    return
  }
  if (imageFiles.length > remainingSlots) {
    error.value = t('tickets.new.messages.maxImagesReached', { max: 4 })
  }

  compressingImages.value = true
  try {
    for (const file of imageFiles.slice(0, remainingSlots)) {
      if (file.size > 10 * 1024 * 1024) {
        error.value = t('tickets.new.messages.fileTooLarge', { name: file.name })
        continue
      }

      const compressedFile = await compressImage(file)
      const preview = await readFileAsDataUrl(compressedFile)
      form.value.attachments.push(compressedFile)
      form.value.attachmentPreviews.push(preview)
    }
  } catch (err) {
    console.error('Error compressing images:', err)
    error.value = err instanceof Error ? err.message : t('tickets.new.messages.compressError')
  } finally {
    compressingImages.value = false
  }
}

const { handlePaste: handleAttachmentPaste, focusZone: focusAttachmentZone } = useImagePaste(addAttachmentFiles, {
  enabled: () => form.value.attachments.length < 4,
  zoneRef: attachmentZoneRef,
  globalImagePaste: true,
})

// Handle file upload
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return
  await addAttachmentFiles(Array.from(target.files))
  target.value = ''
}

// Handle drag and drop
const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  if (!event.dataTransfer?.files) return
  await addAttachmentFiles(Array.from(event.dataTransfer.files))
}

const removeFile = (index: number) => {
  form.value.attachments.splice(index, 1)
  form.value.attachmentPreviews.splice(index, 1)
}

const handleSubmit = async () => {
  if (!form.value.inverterId) {
    error.value = t('tickets.new.messages.selectDevice')
    return
  }

  if (!form.value.title || !form.value.description) {
    error.value = t('tickets.new.messages.fillRequired')
    return
  }

  // For non-END_USER: validate customer from inverter
  if (!isEndUser.value && !form.value.customerId && !selectedCustomerDetails.value?.customer_id) {
    error.value = t('tickets.new.messages.missingCustomer')
    return
  }

  if (!form.value.ticketType) {
    error.value = t('tickets.new.messages.selectTicketType')
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    // Map form data to API format
    // Backend will auto-determine customer_id for END_USER
    const ticketData: any = {
      inverter_id: parseInt(form.value.inverterId),
      title: form.value.title,
      description: form.value.description,
      category: form.value.ticketType,
    }

    if (contractIdFromQuery.value) {
      ticketData.contract_id = contractIdFromQuery.value
    }

    // For non-END_USER: include customer_id from inverter details or form
    if (!isEndUser.value) {
      // Priority: customer from inverter details > customer from form
      if (selectedCustomerDetails.value?.customer_id) {
        ticketData.customer_id = selectedCustomerDetails.value.customer_id
      } else if (form.value.customerId) {
        ticketData.customer_id = parseInt(form.value.customerId)
      } else if (selectedInverterDetails.value?.customer_id) {
        ticketData.customer_id = selectedInverterDetails.value.customer_id
      }
    }
    // For END_USER: backend will auto-determine from user's customer record

    // Create ticket via API - server will set the timestamp
    const newTicket = await ticketService.createTicket(ticketData)

    // Upload attachments if any
    if (form.value.attachments && form.value.attachments.length > 0) {
      try {
        // Convert files to base64 and upload
        for (const file of form.value.attachments) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              // Remove data:image/...;base64, prefix if present
              const base64Data = result.includes(',') ? result.split(',')[1] : result
              resolve(base64Data)
            }
            reader.onerror = reject
            reader.readAsDataURL(file)
          })

          await ticketService.uploadAttachment(newTicket.id, {
            file: base64,
            filename: file.name,
            mime_type: file.type,
            file_size: file.size,
          })
        }
      } catch (err) {
        console.error('Error uploading attachments:', err)
        // Continue even if attachment upload fails
      }
    }

    // Success - redirect to ticket detail page to see the ticket with server timestamp
    showSuccess(t('common.messages.ticketCreated'))
    router.push(`/tickets/${newTicket.id}`)
  } catch (err) {
    console.error('Error creating ticket:', err)
    error.value = err instanceof Error ? err.message : t('tickets.new.messages.createTicketError')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
/* Slide-down animation for the inline new device form */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-8px);
}
.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 600px;
  transform: translateY(0);
}
</style>