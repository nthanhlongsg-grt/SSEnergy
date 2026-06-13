<template>
  <admin-layout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
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
              Biên bản Dịch vụ #{{ report?.reportNumber }}
            </h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">
              Ticket: #{{ report?.ticketNumber }} - {{ report?.customerName }}
            </p>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            @click="exportPDF"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Xuất PDF
          </button>
          <button
            v-if="canEdit"
            @click="saveReport"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Lưu
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Form -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Service Information -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Thông tin Dịch vụ
            </h2>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngày thực hiện <span class="text-red-500">*</span>
                </label>
                <AppDatePicker
                  v-model="form.serviceDate"
                  input-class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thời gian bắt đầu
                </label>
                <input
                  v-model="form.startTime"
                  type="time"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Thời gian kết thúc
                </label>
                <input
                  v-model="form.endTime"
                  type="time"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tổng thời gian (giờ)
                </label>
                <input
                  v-model="form.totalHours"
                  type="number"
                  step="0.5"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          <!-- Error Analysis -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Phân tích Lỗi
            </h2>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nguyên nhân lỗi <span class="text-red-500">*</span>
                </label>
                <textarea
                  v-model="form.errorCause"
                  required
                  rows="4"
                  placeholder="Mô tả chi tiết nguyên nhân gây ra lỗi..."
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Giải pháp xử lý <span class="text-red-500">*</span>
                </label>
                <textarea
                  v-model="form.solution"
                  required
                  rows="4"
                  placeholder="Mô tả chi tiết giải pháp đã thực hiện..."
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>
            </div>
          </div>

          <!-- Parts Replaced -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                Linh kiện Thay thế
              </h2>
              <button
                @click="addPart"
                class="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Thêm linh kiện
              </button>
            </div>
            <div class="space-y-3">
              <div
                v-for="(part, index) in form.partsReplaced"
                :key="index"
                class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Mã linh kiện
                    </label>
                    <input
                      v-model="part.code"
                      type="text"
                      placeholder="GW-MB-001"
                      class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tên linh kiện
                    </label>
                    <input
                      v-model="part.name"
                      type="text"
                      placeholder="Mainboard"
                      class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Số lượng
                    </label>
                    <input
                      v-model.number="part.quantity"
                      type="number"
                      min="1"
                      class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div class="flex items-end">
                    <button
                      @click="removePart(index)"
                      class="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
              <div v-if="form.partsReplaced.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400">
                Chưa có linh kiện nào được thay thế
              </div>
            </div>
          </div>

          <!-- Photos -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Hình ảnh
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Before Photos -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ảnh trước khi sửa
                </label>
                <div
                  class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center outline-none focus:ring-2 focus:ring-blue-400"
                  tabindex="0"
                  @paste="handleBeforePhotosPaste"
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    @change="handleBeforePhotos"
                    class="hidden"
                    id="before-photos"
                  />
                  <label
                    for="before-photos"
                    class="cursor-pointer flex flex-col items-center"
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
                      Nhấn để chọn ảnh
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-500 mt-1 block">
                      Hoặc dán từ clipboard (Ctrl+V)
                    </span>
                  </label>
                  <div v-if="form.beforePhotos.length > 0" class="mt-4 grid grid-cols-2 gap-2">
                    <div
                      v-for="(photo, index) in form.beforePhotos"
                      :key="index"
                      class="relative"
                    >
                      <img
                        :src="photo.preview"
                        :alt="`Before ${index + 1}`"
                        class="w-full h-24 object-cover rounded"
                      />
                      <button
                        @click="removeBeforePhoto(index)"
                        class="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full text-xs"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- After Photos -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ảnh sau khi sửa
                </label>
                <div
                  class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center outline-none focus:ring-2 focus:ring-blue-400"
                  tabindex="0"
                  @paste="handleAfterPhotosPaste"
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    @change="handleAfterPhotos"
                    class="hidden"
                    id="after-photos"
                  />
                  <label
                    for="after-photos"
                    class="cursor-pointer flex flex-col items-center"
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
                      Nhấn để chọn ảnh
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-500 mt-1 block">
                      Hoặc dán từ clipboard (Ctrl+V)
                    </span>
                  </label>
                  <div v-if="form.afterPhotos.length > 0" class="mt-4 grid grid-cols-2 gap-2">
                    <div
                      v-for="(photo, index) in form.afterPhotos"
                      :key="index"
                      class="relative"
                    >
                      <img
                        :src="photo.preview"
                        :alt="`After ${index + 1}`"
                        class="w-full h-24 object-cover rounded"
                      />
                      <button
                        @click="removeAfterPhoto(index)"
                        class="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full text-xs"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Signatures -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Chữ ký Xác nhận
            </h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Technician Signature -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chữ ký Kỹ thuật viên
                </label>
                <div
                  class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 h-32 flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  @click="showTechSignatureModal = true"
                >
                  <div v-if="form.technicianSignature" class="text-center">
                    <img
                      :src="form.technicianSignature"
                      alt="Technician Signature"
                      class="max-h-24 mx-auto"
                    />
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {{ form.technicianName }}
                    </p>
                  </div>
                  <div v-else class="text-center">
                    <svg
                      class="w-12 h-12 text-gray-400 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                      Nhấn để ký
                    </span>
                  </div>
                </div>
              </div>

              <!-- Customer Signature -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Chữ ký Khách hàng
                </label>
                <div
                  class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 h-32 flex items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  @click="showCustomerSignatureModal = true"
                >
                  <div v-if="form.customerSignature" class="text-center">
                    <img
                      :src="form.customerSignature"
                      alt="Customer Signature"
                      class="max-h-24 mx-auto"
                    />
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {{ form.customerName }}
                    </p>
                  </div>
                  <div v-else class="text-center">
                    <svg
                      class="w-12 h-12 text-gray-400 mx-auto mb-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                      Nhấn để ký
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Device Info -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Thông tin Thiết bị
            </h2>
            <div class="space-y-3">
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Model
                </label>
                <p class="text-gray-900 dark:text-white">{{ report?.model }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Serial Number
                </label>
                <p class="text-gray-900 dark:text-white">{{ report?.serialNumber }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Khách hàng
                </label>
                <p class="text-gray-900 dark:text-white">{{ report?.customerName }}</p>
              </div>
            </div>
          </div>

          <!-- Technician Info -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Kỹ thuật viên
            </h2>
            <div class="space-y-3">
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tên
                </label>
                <p class="text-gray-900 dark:text-white">{{ report?.technician }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Mã NV
                </label>
                <p class="text-gray-900 dark:text-white">{{ report?.technicianCode || 'N/A' }}</p>
              </div>
            </div>
          </div>

          <!-- Status -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Trạng thái
            </h2>
            <div>
              <span
                :class="[
                  'px-3 py-2 text-sm font-semibold rounded-lg inline-block',
                  getStatusClass(report?.status),
                ]"
              >
                {{ getStatusLabel(report?.status) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppDatePicker from '@/components/forms/AppDatePicker.vue'
import { addFilesToImageList, readFileAsDataUrl } from '@/utils/imageUpload'
import { useImagePaste } from '@/composables/useImagePaste'

const route = useRoute()

const showTechSignatureModal = ref(false)
const showCustomerSignatureModal = ref(false)

const report = ref<any>(null)

const form = ref({
  serviceDate: '',
  startTime: '',
  endTime: '',
  totalHours: 0,
  errorCause: '',
  solution: '',
  partsReplaced: [] as any[],
  beforePhotos: [] as any[],
  afterPhotos: [] as any[],
  technicianSignature: null as string | null,
  technicianName: '',
  customerSignature: null as string | null,
  customerName: '',
})

const canEdit = ref(true)

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    pending_signature:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    signed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }
  return classes[status] || classes.draft
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'Bản nháp',
    pending_signature: 'Chờ ký',
    signed: 'Đã ký',
    completed: 'Hoàn thành',
  }
  return labels[status] || status
}

const addPart = () => {
  form.value.partsReplaced.push({
    code: '',
    name: '',
    quantity: 1,
  })
}

const removePart = (index: number) => {
  form.value.partsReplaced.splice(index, 1)
}

const pushBeforePhotos = async (files: File[]) => {
  for (const file of files.filter((f) => f.type.startsWith('image/'))) {
    const preview = await readFileAsDataUrl(file)
    form.value.beforePhotos.push({ file, preview })
  }
}

const handleBeforePhotos = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    await pushBeforePhotos(Array.from(target.files))
    target.value = ''
  }
}

const { handlePaste: handleBeforePhotosPaste } = useImagePaste(pushBeforePhotos)

const pushAfterPhotos = async (files: File[]) => {
  for (const file of files.filter((f) => f.type.startsWith('image/'))) {
    const preview = await readFileAsDataUrl(file)
    form.value.afterPhotos.push({ file, preview })
  }
}

const handleAfterPhotos = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    await pushAfterPhotos(Array.from(target.files))
    target.value = ''
  }
}

const { handlePaste: handleAfterPhotosPaste } = useImagePaste(pushAfterPhotos)

const removeBeforePhoto = (index: number) => {
  form.value.beforePhotos.splice(index, 1)
}

const removeAfterPhoto = (index: number) => {
  form.value.afterPhotos.splice(index, 1)
}

const saveReport = async () => {
  // TODO: Implement save report API
  console.log('Saving report:', form.value)
  alert('Lưu biên bản thành công!')
}

const exportPDF = () => {
  // TODO: Implement PDF export
  console.log('Exporting PDF for report:', report.value?.id)
  alert('Tính năng xuất PDF đang được phát triển...')
}

onMounted(() => {
  // TODO: Load report data from API
  const reportId = route.params.id
  console.log('Loading report:', reportId)

  // Mock data
  report.value = {
    id: reportId,
    reportNumber: 'BB-2024-001',
    ticketId: 1,
    ticketNumber: 'TK-2024-001',
    customerName: 'Nguyễn Văn A',
    model: 'MAX 10KTL3-X',
    serialNumber: 'GW1234567890',
    technician: 'Trần Văn B',
    technicianCode: 'KT001',
    status: 'draft',
  }

  // Load form data if exists
  form.value.serviceDate = new Date().toISOString().split('T')[0]
  form.value.technicianName = report.value.technician
  form.value.customerName = report.value.customerName
})
</script>