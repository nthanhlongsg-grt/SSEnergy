<template>
  <admin-layout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />

    <div
      class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6"
    >
      <h3 class="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
        {{ t('profile.title') }}
      </h3>
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="text-gray-500 dark:text-gray-400">{{ t('profile.loading') }}</div>
      </div>
      <div v-else-if="error" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
      </div>
      <div v-else>
        <ProfileCard />
        <PersonalInfoCard />
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '../../components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ProfileCard from '../../components/profile/ProfileCard.vue'
import PersonalInfoCard from '../../components/profile/PersonalInfoCard.vue'
import { useAuth } from '@/composables/useAuth'

const { t } = useI18n()
const currentPageTitle = computed(() => t('profile.title'))
const isLoading = ref(true)
const error = ref('')

const { getUser } = useAuth()

onMounted(async () => {
  try {
    isLoading.value = true
    error.value = ''
    
    // Wait a bit for auth to initialize
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const user = getUser.value
    if (!user) {
      error.value = t('profile.error.userNotFound')
    }
  } catch (err) {
    error.value = t('profile.error.loadError')
    console.error('Profile page error:', err)
  } finally {
    isLoading.value = false
  }
})
</script>
