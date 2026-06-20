<template>
  <admin-layout>
    <div class="px-4 sm:px-0 space-y-4 sm:space-y-6">

      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('autoAssign.title') }}
          </h1>
          <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            {{ t('autoAssign.subtitle') }}
          </p>
        </div>
        <button
          v-if="canManage"
          :disabled="saving"
          @click="handleSave"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-brand-500 px-5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          <svg v-if="saving" class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {{ saving ? t('autoAssign.actions.saving') : t('autoAssign.actions.save') }}
        </button>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('autoAssign.loading') }}</p>
      </div>

      <template v-else>
        <!-- Function cards -->
        <div class="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="fn in functions"
            :key="fn.key"
            class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
          >
            <div class="flex items-center gap-3 mb-4">
              <span :class="['flex h-10 w-10 items-center justify-center rounded-full text-lg', fn.bg]">
                {{ fn.icon }}
              </span>
              <div>
                <p class="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  {{ t(`autoAssign.functions.${fn.key}.label`) }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500">
                  {{ t(`autoAssign.functions.${fn.key}.hint`) }}
                </p>
              </div>
            </div>

            <select
              v-model="form[fn.key]"
              :disabled="!canManage || saving"
              class="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2.5 text-sm text-gray-800 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option :value="null">{{ t('autoAssign.noConfig') }}</option>
              <option
                v-for="staff in staffByFunction[fn.key]"
                :key="staff.id"
                :value="staff.id"
              >
                {{ staff.name }} ({{ staff.code }})
              </option>
            </select>

            <p v-if="staffByFunction[fn.key].length === 0" class="mt-2 text-xs text-gray-400 dark:text-gray-500">
              {{ allStaff.length === 0 ? t('autoAssign.noStaffLoaded') : t('autoAssign.noStaff') }}
            </p>
          </div>
        </div>

        <!-- Feedback -->
        <div v-if="errorMessage" class="rounded-lg bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/20 px-4 py-3">
          <p class="text-sm text-error-600 dark:text-error-400">{{ errorMessage }}</p>
        </div>
        <div v-if="successMessage" class="rounded-lg bg-success-50 dark:bg-success-500/10 border border-success-200 dark:border-success-500/20 px-4 py-3">
          <p class="text-sm text-success-600 dark:text-success-400">{{ successMessage }}</p>
        </div>
      </template>

    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { useAuth, Permission } from '@/composables/useAuth'
import { autoAssignService } from '@/services/autoAssignService'
import { apiClient } from '@/services/api'

const { t } = useI18n()
const { hasPermission } = useAuth()

const canManage = computed(() => hasPermission(Permission.MANAGE_ROLES))

const loading = ref(true)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const form = reactive<Record<string, number | null>>({
  repair: null,
  technicalSupport: null,
  sale: null,
  management: null,
})

const allStaff = ref<any[]>([])

const functions = [
  { key: 'repair', icon: '🔧', bg: 'bg-orange-50 dark:bg-orange-500/10' },
  { key: 'technicalSupport', icon: '💡', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { key: 'sale', icon: '🛒', bg: 'bg-green-50 dark:bg-green-500/10' },
  { key: 'management', icon: '📋', bg: 'bg-purple-50 dark:bg-purple-500/10' },
] as const

const VALID_FUNCTIONS = ['repair', 'technicalSupport', 'sale', 'management'] as const

const resolveStaffFunction = (role: string, fn?: string | null) => {
  if (fn && VALID_FUNCTIONS.includes(fn as typeof VALID_FUNCTIONS[number])) {
    return fn
  }
  if (role === 'technician' || role === 'service_center') {
    return 'technicalSupport'
  }
  if (role === 'admin' || role === 'dev') {
    return 'management'
  }
  return null
}

const staffByFunction = computed(() => {
  const map: Record<string, any[]> = {
    repair: [], technicalSupport: [], sale: [], management: [],
  }
  for (const s of allStaff.value) {
    if (s.function && s.function in map) {
      map[s.function].push(s)
    }
  }
  return map
})

const loadAll = async () => {
  loading.value = true
  errorMessage.value = ''
  try {
    const [settings, staffRes] = await Promise.all([
      autoAssignService.getSettings(),
      apiClient.get<any[]>('/technicians?includeAdmins=true'),
    ])

    form.repair = settings.repair
    form.technicalSupport = settings.technicalSupport
    form.sale = settings.sale
    form.management = settings.management

    const staffData = Array.isArray(staffRes.data) ? staffRes.data : []
    allStaff.value = staffData
      .map((s: any) => {
        const fn = resolveStaffFunction(s.role, s.function)
        if (!fn) return null
        return {
          id: s.id,
          name: s.name,
          code: s.code || `KT${String(s.id).padStart(3, '0')}`,
          function: fn,
        }
      })
      .filter(Boolean) as Array<{ id: number; name: string; code: string; function: string }>
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('autoAssign.messages.loadError')
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  errorMessage.value = ''
  successMessage.value = ''
  saving.value = true
  try {
    const updated = await autoAssignService.updateSettings({
      repair: form.repair as number | null,
      technicalSupport: form.technicalSupport as number | null,
      sale: form.sale as number | null,
      management: form.management as number | null,
    })
    form.repair = updated.repair
    form.technicalSupport = updated.technicalSupport
    form.sale = updated.sale
    form.management = updated.management
    successMessage.value = t('autoAssign.messages.saveSuccess')
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : t('autoAssign.messages.saveError')
  } finally {
    saving.value = false
  }
}

onMounted(() => loadAll())
</script>
