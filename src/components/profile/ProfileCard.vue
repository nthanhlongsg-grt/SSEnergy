<template>
  <div>
    <div class="p-5 mb-6 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div class="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div class="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div class="relative">
            <div
              class="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 bg-blue-100 dark:bg-blue-900 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
              @click="openAvatarModal"
            >
              <img
                v-if="user?.avatar"
                :src="user.avatar"
                :alt="user?.name || t('profile.card.noName')"
                class="w-full h-full object-cover"
              />
              <span v-else-if="user?.name" class="text-blue-600 dark:text-blue-400 font-bold text-3xl">
                {{ user.name.charAt(0).toUpperCase() }}
              </span>
              <img v-else src="/images/user/owner.jpg" alt="user" class="w-full h-full object-cover" />
            </div>
            <button
              @click="openAvatarModal"
              class="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-colors"
              :title="t('profile.card.changeAvatar')"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
          <div class="order-3 xl:order-2">
            <h4
              class="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left"
            >
              {{ user?.name || t('profile.card.noName') }}
            </h4>
            <div
              class="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left"
            >
              <p v-if="user?.organization" class="text-sm text-gray-500 dark:text-gray-400">
                {{ user.organization }}
              </p>
              <div v-if="user?.organization && user?.code" class="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block"></div>
              <p v-if="user?.code" class="text-sm text-gray-500 dark:text-gray-400">
                {{ t('profile.card.employeeCode') }} {{ user.code }}
              </p>
            </div>
            <div class="mt-2 flex justify-center xl:justify-start">
              <span
                v-if="user?.role"
                class="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {{ getRoleLabel(user.role) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Avatar Upload Modal -->
    <Modal v-if="isAvatarModalOpen" @close="closeAvatarModal">
      <template #body>
        <div
          class="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11"
        >
          <!-- close btn -->
          <button
            @click="closeAvatarModal"
            class="transition-color absolute right-5 top-5 z-999 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-700 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-300"
          >
            <svg
              class="fill-current"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z"
                fill=""
              />
            </svg>
          </button>
          <div class="px-2 pr-14">
            <h4 class="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {{ t('profile.avatarModal.title') }}
            </h4>
            <p class="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {{ t('profile.avatarModal.description') }}
            </p>
          </div>

          <div class="px-2">
            <div v-if="errorMessage" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p class="text-sm text-red-800 dark:text-red-200">{{ errorMessage }}</p>
            </div>
            <div v-if="successMessage" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p class="text-sm text-green-800 dark:text-green-200">{{ successMessage }}</p>
            </div>

            <!-- Current Avatar Preview -->
            <div v-if="user?.avatar && !previewUrl" class="mb-4 flex justify-center">
              <div class="w-32 h-32 overflow-hidden rounded-full border-2 border-gray-300 dark:border-gray-700">
                <img :src="user.avatar" :alt="user?.name || 'Avatar'" class="w-full h-full object-cover" />
              </div>
            </div>

            <!-- New Avatar Preview -->
            <div v-if="previewUrl" class="mb-4 flex justify-center">
              <div class="w-32 h-32 overflow-hidden rounded-full border-2 border-blue-500">
                <img :src="previewUrl" alt="Preview" class="w-full h-full object-cover" />
              </div>
            </div>

            <!-- File Input -->
            <div class="mb-4">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('profile.avatarModal.selectImage') }}
              </label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                @change="handleFileSelect"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
          </div>

          <div class="flex items-center gap-3 px-2 mt-6 lg:justify-end">
            <button
              v-if="user?.avatar"
              @click="deleteAvatar"
              :disabled="uploading"
              type="button"
              class="flex w-full justify-center rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900/20 disabled:opacity-50 sm:w-auto"
            >
              {{ uploading ? t('profile.avatarModal.deleting') : t('profile.avatarModal.deleteAvatar') }}
            </button>
            <button
              @click="closeAvatarModal"
              :disabled="uploading"
              type="button"
              class="flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] disabled:opacity-50 sm:w-auto"
            >
              {{ t('profile.avatarModal.cancel') }}
            </button>
            <button
              @click="uploadAvatar"
              :disabled="!selectedFile || uploading"
              type="button"
              class="flex w-full justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto"
            >
              {{ uploading ? t('profile.avatarModal.uploading') : t('profile.avatarModal.saveAvatar') }}
            </button>
          </div>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuth, UserRole } from '@/composables/useAuth'
import { userService } from '@/services/userService'
import Modal from './Modal.vue'

const { t } = useI18n()
const { getUser, refreshUserInfo } = useAuth()
const user = computed(() => getUser.value)

const isAvatarModalOpen = ref(false)
const selectedFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const uploading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const getRoleLabel = (role: UserRole | string) => {
  const labels: Record<string, string> = {
    [UserRole.ADMIN]: t('users.management.roleOptions.admin'),
    [UserRole.DEV]: t('users.management.roleOptions.dev'),
    [UserRole.SERVICE_CENTER]: t('users.management.roleOptions.serviceCenter'),
    [UserRole.TECHNICIAN]: t('users.management.roleOptions.technician'),
    [UserRole.DISTRIBUTOR]: t('users.management.roleOptions.distributor'),
    [UserRole.DEALER]: t('users.management.roleOptions.dealer'),
    [UserRole.END_USER]: t('users.management.roleOptions.endUser'),
    [UserRole.WAREHOUSE]: t('users.management.roleOptions.warehouse'),
  }
  return labels[role] || role
}

const openAvatarModal = () => {
  isAvatarModalOpen.value = true
  selectedFile.value = null
  previewUrl.value = null
  errorMessage.value = ''
  successMessage.value = ''
}

const closeAvatarModal = () => {
  isAvatarModalOpen.value = false
  selectedFile.value = null
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  errorMessage.value = ''
  successMessage.value = ''
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) return

  // Validate file type
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
  if (!validTypes.includes(file.type)) {
    errorMessage.value = t('profile.avatarModal.errors.invalidType')
    return
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    errorMessage.value = t('profile.avatarModal.errors.fileTooLarge')
    return
  }

  selectedFile.value = file
  errorMessage.value = ''

  // Create preview
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
  previewUrl.value = URL.createObjectURL(file)
}

const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

const uploadAvatar = async () => {
  if (!selectedFile.value) {
    errorMessage.value = t('profile.avatarModal.errors.selectImage')
    return
  }

  uploading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const base64 = await convertToBase64(selectedFile.value)
    await userService.uploadAvatar(base64)
    
    // Refresh user info
    await refreshUserInfo()
    
    successMessage.value = t('profile.avatarModal.success.uploadSuccess')
    
    setTimeout(() => {
      closeAvatarModal()
    }, 1500)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('profile.avatarModal.errors.uploadError')
  } finally {
    uploading.value = false
  }
}

const deleteAvatar = async () => {
  if (!user.value?.avatar) return

  uploading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    await userService.deleteAvatar()
    
    // Refresh user info
    await refreshUserInfo()
    
    successMessage.value = t('profile.avatarModal.success.deleteSuccess')
    
    setTimeout(() => {
      closeAvatarModal()
    }, 1500)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('profile.avatarModal.errors.deleteError')
  } finally {
    uploading.value = false
  }
}
</script>
