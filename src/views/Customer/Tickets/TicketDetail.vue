<template>
  <admin-layout>
    <div class="space-y-6">
      <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('customers.tickets.detail.header.title') }}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        {{ ticket?.ticket_number || t('customers.tickets.detail.header.loading') }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="text-gray-500 dark:text-gray-400">{{ t('customers.tickets.detail.loading') }}</div>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
    >
      <p class="text-red-800 dark:text-red-200">{{ error }}</p>
    </div>

    <!-- Content -->
    <div v-else-if="ticket" class="space-y-6">
      <!-- Ticket Info and Device Info Side by Side -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Ticket Info -->
        <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ t('customers.tickets.detail.sections.ticketInfo') }}
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.tickets.detail.fields.ticketNumber') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white font-medium">{{ ticket.ticket_number }}</p>
            </div>
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.tickets.detail.fields.status') }}</label>
              <p class="mt-1">
                <span
                  :class="[
                    'px-2 py-1 text-xs rounded-full',
                    getStatusColor(ticket.status)
                  ]"
                >
                  {{ getStatusLabel(ticket.status) }}
                </span>
              </p>
            </div>
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.tickets.detail.fields.title') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white">{{ ticket.title }}</p>
            </div>
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.tickets.detail.fields.priority') }}</label>
              <p class="mt-1">
                <span
                  :class="[
                    'px-2 py-1 text-xs rounded-full',
                    getPriorityColor(ticket.priority)
                  ]"
                >
                  {{ getPriorityLabel(ticket.priority) }}
                </span>
              </p>
            </div>
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.tickets.detail.fields.createdDate') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white">{{ formatDate(ticket.created_at) }}</p>
            </div>
          </div>
          <div class="mt-4">
            <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.tickets.detail.fields.description') }}</label>
            <p class="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">{{ ticket.description }}</p>
          </div>
        </div>

        <!-- Device Info -->
        <div v-if="ticket.inverter_id" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ t('customers.tickets.detail.sections.deviceInfo') }}
          </h2>
          <div class="grid grid-cols-1 gap-4">
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.tickets.detail.fields.serialNumber') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white font-medium">{{ ticket.inverter_serial || '-' }}</p>
            </div>
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.tickets.detail.fields.model') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white">{{ ticket.inverter_model || '-' }}</p>
            </div>
            <div>
              <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.tickets.detail.fields.warrantyStatus') }}</label>
              <p class="mt-1">
                <span
                  :class="[
                    'px-2 py-1 text-xs rounded-full',
                    getWarrantyStatusColor(ticket.inverter_warranty_end_date)
                  ]"
                >
                  {{ getWarrantyStatus(ticket.inverter_warranty_end_date) }}
                </span>
              </p>
            </div>
            <div v-if="ticket.inverter_warranty_end_date">
              <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.tickets.detail.fields.warrantyEndDate') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white">{{ formatDate(ticket.inverter_warranty_end_date) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Support Person Info -->
      <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ t('customers.tickets.detail.sections.supportPerson') }}
        </h2>
        <div v-if="ticket.assigned_to && ticket.assigned_to_name" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.tickets.detail.fields.supportPersonName') }}</label>
            <p class="mt-1 text-gray-900 dark:text-white font-medium">{{ ticket.assigned_to_name }}</p>
          </div>
          <div v-if="ticket.assigned_to_email">
            <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.tickets.detail.fields.supportPersonEmail') }}</label>
            <p class="mt-1 text-gray-900 dark:text-white">{{ ticket.assigned_to_email }}</p>
          </div>
          <div v-if="ticket.assigned_to_phone">
            <label class="text-sm text-gray-500 dark:text-gray-400">{{ t('customers.tickets.detail.fields.supportPersonPhone') }}</label>
            <p class="mt-1 text-gray-900 dark:text-white">{{ ticket.assigned_to_phone }}</p>
          </div>
        </div>
        <div v-else class="text-gray-500 dark:text-gray-400">
          {{ t('customers.tickets.detail.fields.noSupportPerson') }}
        </div>
      </div>

      <!-- Attachments -->
      <div v-if="ticket.attachments && ticket.attachments.length > 0" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ t('customers.tickets.detail.sections.attachments') || 'File đính kèm' }}
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="(file, index) in ticket.attachments"
            :key="index"
            class="relative group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            :class="isImageFile(file) ? 'cursor-pointer' : ''"
            @click="isImageFile(file) && openAttachmentImage(file)"
          >
            <!-- Image Preview -->
            <div v-if="isImageFile(file)" class="aspect-square bg-gray-100 dark:bg-gray-700 relative">
              <img
                :src="getAttachmentUrl(file)"
                :alt="file.filename || file.name"
                class="w-full h-full object-cover"
                @error="handleImageError($event)"
                loading="lazy"
              />
              <div v-if="!getAttachmentUrl(file)" class="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                Không thể tải hình ảnh
              </div>
            </div>
            <!-- File Icon -->
            <div v-else class="p-4 bg-gray-50 dark:bg-gray-700">
              <div class="flex items-center gap-2">
                <svg
                  class="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ file.filename || file.name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatFileSize(file.file_size || file.size || 0) }}
                  </p>
                </div>
              </div>
            </div>
            <!-- File Name Overlay for Images -->
            <div
              v-if="isImageFile(file)"
              class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2"
            >
              <p class="text-xs text-white truncate">
                {{ file.filename || file.name }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Comments -->
      <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ t('customers.tickets.detail.sections.comments') }}
        </h2>
        <div v-if="publicComments && publicComments.length > 0" class="space-y-4">
          <div
            v-for="comment in publicComments"
            :key="comment.id"
            class="border-l-4 border-blue-500 pl-4 py-2"
          >
            <div class="flex justify-between items-start">
              <div>
                <p class="font-bold text-gray-900 dark:text-white">{{ comment.user_name }}</p>
                <p class="text-sm italic text-gray-400 dark:text-gray-500 mt-1">{{ formatDate(comment.created_at) }}</p>
              </div>
            </div>
            <p class="mt-2 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ comment.comment }}</p>
            
            <!-- Display images if available -->
            <div v-if="comment.images && comment.images.length > 0" class="mt-3 grid grid-cols-4 gap-2">
              <div
                v-for="(imageSrc, imgIndex) in comment.images"
                :key="imgIndex"
                class="relative group"
              >
                <img 
                  :src="imageSrc" 
                  alt="Comment image" 
                  class="w-full h-24 object-cover rounded border border-gray-300 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                  @click="openImageModal({ file_path: imageSrc, filename: `image-${imgIndex + 1}.jpg` })"
                />
              </div>
            </div>
          </div>
        </div>
        <div v-else class="text-gray-500 dark:text-gray-400 text-center py-8">
          {{ t('customers.tickets.detail.comments.empty') }}
        </div>

        <!-- Add Comment -->
        <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Thêm trao đổi
          </h3>
          <div class="relative">
            <textarea
              v-model="newComment"
              rows="3"
              :placeholder="t('customers.tickets.detail.comments.placeholder')"
              class="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            ></textarea>
            <!-- Image Upload Icon -->
            <input
              type="file"
              ref="fileInput"
              @change="handleFileSelect"
              accept="image/*"
              multiple
              class="hidden"
            />
            <button
              type="button"
              @click="fileInput?.click()"
              class="absolute right-2 bottom-2 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
              :title="t('customers.tickets.detail.comments.insertImage')"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>
          
          <!-- Preview selected images -->
          <div v-if="selectedImages.length > 0" class="mt-3 flex flex-wrap gap-3">
            <div
              v-for="(image, index) in selectedImages"
              :key="index"
              class="relative group"
            >
              <img
                :src="image.preview"
                :alt="image.name"
                class="w-24 h-24 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
              />
              <button
                @click="removeImage(index)"
                class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          </div>
          
          <div class="mt-3 flex items-center justify-between">
            <span v-if="selectedImages.length > 0" class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('customers.tickets.detail.comments.selectedImages', { count: selectedImages.length }) }}
            </span>
            <button
              @click="addComment"
              :disabled="(!newComment.trim() && selectedImages.length === 0) || submittingComment"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ submittingComment ? t('customers.tickets.detail.comments.sending') : t('customers.tickets.detail.comments.send') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
    
    <!-- Image Modal -->
    <div
      v-if="selectedImageModal"
      ref="imageModalRef"
      class="fixed inset-0 z-[100000] flex items-center justify-center bg-black bg-opacity-90 p-4"
      @click="closeImageModal"
      @keydown="handleImageModalKeydown"
      tabindex="0"
    >
      <div class="relative max-w-6xl max-h-[95vh] w-full flex flex-col" @click.stop>
        <!-- Close Button -->
        <button
          @click="closeImageModal"
          class="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full text-white transition-colors"
          :title="t('customers.tickets.detail.images.clickToClose') || 'Nhấn để đóng'"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <!-- Image -->
        <div 
          class="flex-1 flex items-center justify-center overflow-hidden"
          :class="isPngFile(selectedImageModal) ? 'bg-white' : ''"
        >
          <img
            :src="getImageModalSrc(selectedImageModal)"
            :alt="selectedImageModal?.filename || 'Image'"
            class="max-w-full max-h-full object-contain"
            @click.stop
          />
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { ticketService } from '@/services/ticketService'
import { getApiBaseUrlWithoutApi } from '@/utils/apiUrl'

const { t } = useI18n()

const route = useRoute()
const loading = ref(true)
const error = ref<string | null>(null)
const ticket = ref<any>(null)
const newComment = ref('')
const submittingComment = ref(false)
const selectedImages = ref<Array<{ file: File; preview: string; name: string }>>([])
const fileInput = ref<HTMLInputElement | null>(null)
const selectedImageModal = ref<any>(null)
const currentImageIndex = ref<number>(-1)
const imageModalRef = ref<HTMLElement | null>(null)

// Get all images from comments and attachments for navigation
const allImages = computed(() => {
  const images: Array<{ file_path: string; filename: string; source: 'comment' | 'attachment' }> = []
  
  // Add images from comments
  if (publicComments.value) {
    publicComments.value.forEach((comment: any) => {
      if (comment.images && comment.images.length > 0) {
        comment.images.forEach((imgSrc: string, idx: number) => {
          images.push({
            file_path: imgSrc,
            filename: `comment-image-${idx + 1}.jpg`,
            source: 'comment'
          })
        })
      }
    })
  }
  
  // Add images from attachments
  if (ticket.value?.attachments) {
    ticket.value.attachments.forEach((file: any) => {
      if (isImageFile(file)) {
        images.push({
          file_path: file.file_path || '',
          filename: file.filename || file.name || 'image.jpg',
          source: 'attachment',
          ...file // Keep original file data for getAttachmentUrl
        })
      }
    })
  }
  
  return images
})

// Filter out internal comments for customer view and add images
const publicComments = computed(() => {
  if (!ticket.value?.comments) return []
  const filtered = ticket.value.comments.filter((comment: any) => {
    // Filter out comments where is_internal is true or 1
    return !comment.is_internal && comment.is_internal !== 1
  })
  
  // Add images from sessionStorage for comments with image markers
  return filtered.map((comment: any) => {
    const commentText = comment.comment || comment.content || ''
    let images: string[] = []
    
    // Check if comment has image marker
    if (commentText.includes('📷') && commentText.includes('Đã đính kèm')) {
      try {
        const storedImagesData = sessionStorage.getItem(`ticket_${ticket.value.id}_images`)
        if (storedImagesData) {
          const imagesArray = JSON.parse(storedImagesData)
          const commentTime = new Date(comment.created_at).getTime()
          
          // Find images that match this comment's timestamp (within 30 seconds)
          const sortedImages = imagesArray
            .filter((imgData: any) => imgData.ticketId === ticket.value.id)
            .sort((a: any, b: any) => Math.abs(a.commentTimestamp - commentTime) - Math.abs(b.commentTimestamp - commentTime))
          
          const matchedImages = sortedImages.find((imgData: any) => {
            const imgTime = imgData.commentTimestamp || imgData.timestamp
            return Math.abs(imgTime - commentTime) < 30000 // Within 30 seconds
          })
          
          if (matchedImages && matchedImages.images) {
            images = matchedImages.images
          }
        }
      } catch (e) {
        console.warn('Failed to parse stored images:', e)
      }
    }
    
    return {
      ...comment,
      images
    }
  })
})

const loadTicket = async () => {
  try {
    loading.value = true
    error.value = null

    const id = parseInt(route.params.id as string)
    const data = await ticketService.getTicketById(id)
    ticket.value = data
    // Ensure attachments array exists
    if (!ticket.value.attachments) {
      ticket.value.attachments = []
    }
  } catch (err: any) {
    console.error('Error loading ticket:', err)
    error.value = err.message || t('customers.tickets.detail.messages.loadError')
  } finally {
    loading.value = false
  }
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    Array.from(target.files).forEach((file) => {
      if (file.type.startsWith('image/')) {
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
    })
  }
  // Reset input
  if (target) {
    target.value = ''
  }
}

const removeImage = (index: number) => {
  selectedImages.value.splice(index, 1)
}

const getAttachmentUrl = (attachment: any): string => {
  if (!attachment) return ''
  
  const filePath = attachment.file_path || ''
  
  // Priority 1: If file_path is a base64 data URI, return it directly
  if (filePath && typeof filePath === 'string') {
    if (filePath.startsWith('data:image/')) {
      return filePath
    }
    
    // Priority 2: If it's a long string without data: prefix, might be base64
    // Check if it looks like base64 (alphanumeric, long, no slashes)
    const looksLikeBase64 = filePath.length > 50 && 
                            /^[A-Za-z0-9+/=]+$/.test(filePath) && 
                            !filePath.includes('/') && 
                            !filePath.includes('\\') && 
                            !filePath.startsWith('http')
    
    if (looksLikeBase64) {
      const filename = (attachment.filename || '').toLowerCase()
      const mimeType = attachment.mime_type || 'image/jpeg'
      
      let finalMimeType = mimeType
      if (!mimeType.startsWith('image/')) {
        if (filename.endsWith('.png')) finalMimeType = 'image/png'
        else if (filename.endsWith('.gif')) finalMimeType = 'image/gif'
        else if (filename.endsWith('.webp')) finalMimeType = 'image/webp'
        else if (filename.endsWith('.svg')) finalMimeType = 'image/svg+xml'
        else if (filename.endsWith('.jpg') || filename.endsWith('.jpeg')) finalMimeType = 'image/jpeg'
        else finalMimeType = 'image/jpeg'
      }
      
      return `data:${finalMimeType};base64,${filePath}`
    }
  }
  
  // Priority 3: Try to construct API URL using attachment ID
  if (attachment.id && ticket.value?.id) {
    const baseApiUrl = getApiBaseUrlWithoutApi()
    // Construct URL
    const url = `${baseApiUrl}/api/tickets/${ticket.value.id}/attachments/${attachment.id}`
    return url
  }
  
  // Priority 4: Fallback - try to use file_path as URL if it looks like a URL
  if (filePath && (filePath.startsWith('http') || filePath.startsWith('/'))) {
    return filePath
  }
  
  console.warn('Could not construct URL for attachment:', attachment)
  return ''
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  console.error('Failed to load image:', img.src)
}

const getImageModalSrc = (image: any): string => {
  if (image?.file_path?.startsWith('data:')) {
    return image.file_path
  }
  return getAttachmentUrl(image)
}

const openImageModal = (attachment: any) => {
  // Find index in allImages
  const index = allImages.value.findIndex(img => {
    if (attachment.file_path) {
      return img.file_path === attachment.file_path || 
             (attachment.file_path.startsWith('data:') && img.file_path === attachment.file_path)
    }
    return img.filename === attachment.filename
  })
  
  currentImageIndex.value = index >= 0 ? index : -1
  selectedImageModal.value = attachment
  
  // Focus modal for keyboard events
  setTimeout(() => {
    if (imageModalRef.value) {
      imageModalRef.value.focus()
    }
  }, 100)
}

// Open image from comment (sessionStorage base64)
const openImageFromComment = (imageSrc: string) => {
  // Find index in allImages
  const index = allImages.value.findIndex(img => img.file_path === imageSrc)
  
  currentImageIndex.value = index >= 0 ? index : -1
  selectedImageModal.value = {
    file_path: imageSrc,
    filename: 'comment-image.jpg'
  }
  
  // Focus modal for keyboard events
  setTimeout(() => {
    if (imageModalRef.value) {
      imageModalRef.value.focus()
    }
  }, 100)
}

const closeImageModal = () => {
  selectedImageModal.value = null
  currentImageIndex.value = -1
}

const handleImageModalKeydown = (event: KeyboardEvent) => {
  if (!selectedImageModal.value) return
  
  switch (event.key) {
    case 'Escape':
      closeImageModal()
      break
    case 'ArrowUp':
      event.preventDefault()
      navigateImage(-1)
      break
    case 'ArrowDown':
      event.preventDefault()
      navigateImage(1)
      break
  }
}

const navigateImage = (direction: number) => {
  if (allImages.value.length === 0) return
  
  let newIndex = currentImageIndex.value + direction
  
  // Wrap around
  if (newIndex < 0) {
    newIndex = allImages.value.length - 1
  } else if (newIndex >= allImages.value.length) {
    newIndex = 0
  }
  
  currentImageIndex.value = newIndex
  const nextImage = allImages.value[newIndex]
  
  if (nextImage.source === 'comment') {
    selectedImageModal.value = {
      file_path: nextImage.file_path,
      filename: nextImage.filename
    }
  } else {
    selectedImageModal.value = nextImage
  }
}

// Helper functions for attachments
const isImageFile = (file: any): boolean => {
  if (!file) return false
  
  const filename = (file.filename || file.name || '').toLowerCase()
  const mimeType = (file.mime_type || file.type || '').toLowerCase()
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']
  const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/x-icon']
  
  // Check by extension
  if (imageExtensions.some(ext => filename.endsWith(ext))) {
    return true
  }
  
  // Check by MIME type
  if (imageMimeTypes.includes(mimeType)) {
    return true
  }
  
  return false
}

const isPngFile = (file: any): boolean => {
  if (!file) return false
  
  const filename = (file.filename || file.name || '').toLowerCase()
  const mimeType = (file.mime_type || file.type || '').toLowerCase()
  
  // Check by extension
  if (filename && filename.endsWith('.png')) {
    return true
  }
  
  // Check by MIME type
  if (mimeType && (mimeType === 'image/png' || mimeType.includes('png'))) {
    return true
  }
  
  // Check if file_path is a data URI with PNG MIME type
  if (file.file_path && typeof file.file_path === 'string') {
    if (file.file_path.startsWith('data:image/png')) {
      return true
    }
  }
  
  return false
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const openAttachmentImage = (file: any) => {
  // Find index in allImages
  const index = allImages.value.findIndex(img => {
    if (file.file_path) {
      return img.file_path === file.file_path
    }
    return img.filename === (file.filename || file.name)
  })
  
  currentImageIndex.value = index >= 0 ? index : -1
  selectedImageModal.value = file
  
  // Focus modal for keyboard events
  setTimeout(() => {
    if (imageModalRef.value) {
      imageModalRef.value.focus()
    }
  }, 100)
}

const addComment = async () => {
  if (!newComment.value.trim() && selectedImages.value.length === 0) return

  try {
    submittingComment.value = true
    const id = parseInt(route.params.id as string)
    const commentText = newComment.value.trim()
    const imagesToSave = [...selectedImages.value.map(img => img.preview)] // Save preview URLs
    const imageFilesToSave = [...selectedImages.value] // Save files for upload
    
    // Build comment text with image marker
    let finalCommentText = commentText
    if (imageFilesToSave.length > 0) {
      if (finalCommentText) {
        finalCommentText += '\n\n📷 Đã đính kèm ' + imageFilesToSave.length + ' hình ảnh'
      } else {
        finalCommentText = '📷 Đã đính kèm ' + imageFilesToSave.length + ' hình ảnh'
      }
    }
    
    // Add comment first
    await ticketService.addComment(id, finalCommentText || t('customers.tickets.detail.comments.defaultMessage'))
    
    // Store images in sessionStorage for display in comments only
    // Note: Images from comments are NOT uploaded to server attachments
    // They are only stored in sessionStorage for display in the comment section
    if (imagesToSave.length > 0) {
      const timestamp = Date.now()
      const imagesData = {
        ticketId: id,
        images: imagesToSave,
        timestamp: timestamp,
        commentTimestamp: timestamp
      }
      
      const existingImages = JSON.parse(sessionStorage.getItem(`ticket_${id}_images`) || '[]')
      existingImages.push(imagesData)
      const recentImages = existingImages.slice(-50) // Keep last 50 entries
      sessionStorage.setItem(`ticket_${id}_images`, JSON.stringify(recentImages))
    }
    
    // Reset form
    newComment.value = ''
    selectedImages.value = []
    
    // Reload ticket to show new comment and images
    await loadTicket()
  } catch (err: any) {
    console.error('Error adding comment:', err)
    alert(err.message || t('customers.tickets.detail.messages.addCommentError'))
  } finally {
    submittingComment.value = false
  }
}

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    initialized: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  }
  return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    initialized: t('customers.tickets.detail.status.initialized'),
    in_progress: t('customers.tickets.detail.status.in_progress'),
    completed: t('customers.tickets.detail.status.completed'),
    closed: t('customers.tickets.detail.status.closed'),
  }
  return labels[status] || status
}

const getPriorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    high: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return colors[priority] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    low: t('customers.tickets.detail.priority.low'),
    medium: t('customers.tickets.detail.priority.medium'),
    high: t('customers.tickets.detail.priority.high'),
    urgent: t('customers.tickets.detail.priority.urgent'),
  }
  return labels[priority] || priority
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getWarrantyStatus = (warrantyEndDate: string | null | undefined) => {
  if (!warrantyEndDate) return '-'
  const endDate = new Date(warrantyEndDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)
  
  if (endDate >= today) {
    return t('customers.tickets.detail.fields.warrantyActive')
  } else {
    return t('customers.tickets.detail.fields.warrantyExpired')
  }
}

const getWarrantyStatusColor = (warrantyEndDate: string | null | undefined) => {
  if (!warrantyEndDate) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  const endDate = new Date(warrantyEndDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)
  
  if (endDate >= today) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  } else {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }
}

onMounted(() => {
  loadTicket()
})

// Auto-refresh every 15 seconds to pick up new comments/status changes
const { stop: stopAutoRefresh } = useAutoRefresh({
  interval: 15000,
  fetchFn: async () => {
    if (!loading.value) await loadTicket()
  },
  pauseWhenHidden: true,
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

