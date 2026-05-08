<template>
  <admin-layout>
    <div class="px-4 sm:px-0 space-y-4 sm:space-y-6">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('slaSettings.title') }}
          </h1>
          <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            {{ t('slaSettings.subtitle') }}
          </p>
        </div>
      </div>

      <!-- Loading -->
      <div
        v-if="loading"
        class="flex items-center justify-center py-12"
      >
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('slaSettings.loading') }}</p>
      </div>

      <template v-else>
        <!-- SLA cards -->
        <div class="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Urgent -->
          <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="flex items-center gap-3 mb-4">
              <span class="flex h-10 w-10 items-center justify-center rounded-full bg-error-50 dark:bg-error-500/10">
                <svg class="h-5 w-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </span>
              <div>
                <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">{{ t('slaSettings.fields.urgent') }}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500">{{ t('slaSettings.hint.urgent') }}</p>
              </div>
            </div>
            <input
              v-model.number="form.urgent"
              type="number"
              min="1"
              :disabled="saving"
              class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white disabled:opacity-60"
            />
          </div>

          <!-- High -->
          <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="flex items-center gap-3 mb-4">
              <span class="flex h-10 w-10 items-center justify-center rounded-full bg-warning-50 dark:bg-warning-500/10">
                <svg class="h-5 w-5 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
              <div>
                <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">{{ t('slaSettings.fields.high') }}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500">{{ t('slaSettings.hint.high') }}</p>
              </div>
            </div>
            <input
              v-model.number="form.high"
              type="number"
              min="1"
              :disabled="saving"
              class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white disabled:opacity-60"
            />
          </div>

          <!-- Medium -->
          <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="flex items-center gap-3 mb-4">
              <span class="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-500/10">
                <svg class="h-5 w-5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">{{ t('slaSettings.fields.medium') }}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500">{{ t('slaSettings.hint.medium') }}</p>
              </div>
            </div>
            <input
              v-model.number="form.medium"
              type="number"
              min="1"
              :disabled="saving"
              class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white disabled:opacity-60"
            />
          </div>

          <!-- Low -->
          <div class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="flex items-center gap-3 mb-4">
              <span class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <svg class="h-5 w-5 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">{{ t('slaSettings.fields.low') }}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500">{{ t('slaSettings.hint.low') }}</p>
              </div>
            </div>
            <input
              v-model.number="form.low"
              type="number"
              min="1"
              :disabled="saving"
              class="h-11 w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white disabled:opacity-60"
            />
          </div>
        </div>

        <!-- Feedback -->
        <div v-if="errorMessage" class="rounded-lg bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 px-4 py-3">
          <p class="text-sm text-error-600 dark:text-error-400">{{ errorMessage }}</p>
        </div>
        <div v-if="successMessage" class="rounded-lg bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/20 px-4 py-3">
          <p class="text-sm text-success-600 dark:text-success-400">{{ successMessage }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            :disabled="saving"
            @click="handleSubmit"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
          >
            <svg v-if="saving" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {{ saving ? t('slaSettings.actions.saving') : t('slaSettings.actions.save') }}
          </button>

          <button
            type="button"
            :disabled="saving"
            @click="loadSettings"
            class="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 px-5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/[0.03] transition-colors"
          >
            {{ t('slaSettings.actions.reload') }}
          </button>
        </div>
      </template>

    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { slaSettingsService } from '@/services/slaSettingsService'
import { useSlaSettings } from '@/composables/useSlaSettings'

const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const { t } = useI18n()
const { reloadSettings } = useSlaSettings()

const form = reactive({
  urgent: 24,
  high: 48,
  medium: 72,
  low: 96,
})

const loadSettings = async () => {
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const settings = await slaSettingsService.getSettings()
    form.urgent = settings.urgent
    form.high = settings.high
    form.medium = settings.medium
    form.low = settings.low
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('slaSettings.messages.loadError')
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (!Number.isInteger(form.urgent) || form.urgent <= 0) {
    errorMessage.value = t('slaSettings.validation.urgentPositiveInteger')
    return
  }
  if (!Number.isInteger(form.high) || form.high <= 0) {
    errorMessage.value = t('slaSettings.validation.highPositiveInteger')
    return
  }
  if (!Number.isInteger(form.medium) || form.medium <= 0) {
    errorMessage.value = t('slaSettings.validation.mediumPositiveInteger')
    return
  }
  if (!Number.isInteger(form.low) || form.low <= 0) {
    errorMessage.value = t('slaSettings.validation.lowPositiveInteger')
    return
  }

  saving.value = true
  try {
    const updated = await slaSettingsService.updateSettings({
      urgent: form.urgent,
      high: form.high,
      medium: form.medium,
      low: form.low,
    })
    form.urgent = updated.urgent
    form.high = updated.high
    form.medium = updated.medium
    form.low = updated.low
    successMessage.value = t('slaSettings.messages.updateSuccess')
    await reloadSettings()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('slaSettings.messages.updateError')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>
