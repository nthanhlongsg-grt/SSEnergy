<template>
  <customer-layout>
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('customers.profile.header.title') }}
      </h1>
      <p class="text-gray-500 dark:text-gray-400 mt-1">
        {{ t('customers.profile.header.subtitle') }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="text-gray-500 dark:text-gray-400">{{ t('customers.profile.messages.loading') }}</div>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
    >
      <p class="text-red-800 dark:text-red-200">{{ error }}</p>
    </div>

    <!-- Form -->
    <div v-else class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('customers.profile.fields.name') }}
          </label>
          <input
            v-model="form.name"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('customers.profile.fields.email') }}
          </label>
          <input
            v-model="form.email"
            type="email"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('customers.profile.fields.phone') }}
          </label>
          <input
            v-model="form.phone"
            type="tel"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('customers.profile.fields.address') }}
          </label>
          <input
            v-model="form.address"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <div v-if="user?.organization">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('customers.profile.fields.organization') }}
          </label>
          <input
            v-model="form.organization"
            type="text"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          @click="handleSubmit"
          :disabled="submitting"
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ submitting ? t('customers.profile.actions.saving') : t('customers.profile.actions.save') }}
        </button>
      </div>
    </div>
    </div>
  </customer-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import CustomerLayout from '@/components/layout/CustomerLayout.vue'
import { useAuth } from '@/composables/useAuth'
import { userService } from '@/services/userService'

const { t } = useI18n()

const { getUser } = useAuth()
const user = getUser

const loading = ref(true)
const submitting = ref(false)
const error = ref<string | null>(null)
const form = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  organization: '',
})

const loadUserData = async () => {
  try {
    loading.value = true
    error.value = null

    if (user.value) {
      form.value = {
        name: user.value.name || '',
        email: user.value.email || '',
        phone: user.value.phone || '',
        address: user.value.address || '',
        organization: user.value.organization || '',
      }
    }
  } catch (err: any) {
    console.error('Error loading user data:', err)
    error.value = err.message || t('customers.profile.messages.loadError')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  try {
    submitting.value = true
    error.value = null

    if (!user.value) return

    await userService.updateMyProfile(form.value)
    
    // Refresh user data
    const { refreshUserInfo } = await import('@/composables/useAuth')
    await refreshUserInfo()
    
    alert(t('customers.profile.messages.updateSuccess'))
  } catch (err: any) {
    console.error('Error updating profile:', err)
    error.value = err.message || t('customers.profile.messages.updateError')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadUserData()
})
</script>

