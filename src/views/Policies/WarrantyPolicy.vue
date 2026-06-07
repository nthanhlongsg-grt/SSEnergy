<template>
  <admin-layout>
    <div class="w-full pb-8">
      <!-- Hero -->
      <div class="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-6 sm:p-8 dark:border-blue-900/40 dark:from-blue-950/40 dark:to-gray-900 mb-6">
        <div class="flex items-start gap-4">
          <div class="hidden sm:flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              {{ t('warrantyPolicy.company') }}
            </p>
            <h1 class="mt-1 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
              {{ t('warrantyPolicy.pageTitle') }}
            </h1>
            <p class="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              {{ t('warrantyPolicy.effectiveNote') }}
            </p>
          </div>
        </div>
      </div>

      <article class="space-y-6">
          <section class="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-700 dark:bg-gray-800">
            <div class="flex items-center gap-3 mb-4">
              <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">a</span>
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                {{ t('warrantyPolicy.sections.scope.title') }}
              </h2>
            </div>
            <ul class="space-y-3">
              <li
                v-for="(item, idx) in scopeItems"
                :key="idx"
                class="flex gap-3 text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed"
              >
                <span class="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500"/>
                <span>{{ item }}</span>
              </li>
            </ul>
          </section>

          <section class="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-700 dark:bg-gray-800">
            <div class="flex items-center gap-3 mb-5">
              <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-sm font-bold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">b</span>
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                {{ t('warrantyPolicy.sections.exclusions.title') }}
              </h2>
            </div>

            <div class="mb-6">
              <h3 class="text-sm font-semibold uppercase tracking-wide text-red-700 dark:text-red-400 mb-2">
                {{ t('warrantyPolicy.sections.exclusions.voidTitle') }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {{ t('warrantyPolicy.sections.exclusions.voidIntro') }}
              </p>
              <ul class="space-y-2.5">
                <li
                  v-for="(item, idx) in voidItems"
                  :key="`void-${idx}`"
                  class="flex gap-3 rounded-lg bg-red-50/80 px-3 py-2.5 text-sm text-gray-800 dark:bg-red-950/20 dark:text-gray-200"
                >
                  <span class="font-semibold text-red-600 dark:text-red-400 flex-shrink-0">+</span>
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>

            <div class="mb-6">
              <h3 class="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300 mb-2">
                {{ t('warrantyPolicy.sections.exclusions.notCoveredTitle') }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {{ t('warrantyPolicy.sections.exclusions.notCoveredIntro') }}
              </p>
              <ol class="space-y-2.5">
                <li
                  v-for="(item, idx) in notCoveredItems"
                  :key="`nc-${idx}`"
                  class="flex gap-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
                >
                  <span class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                    {{ idx + 1 }}
                  </span>
                  <span class="pt-0.5">{{ item }}</span>
                </li>
              </ol>
            </div>

            <div class="rounded-lg border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-800/50 dark:bg-amber-950/20">
              <h3 class="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">
                {{ t('warrantyPolicy.sections.exclusions.maintenanceTitle') }}
              </h3>
              <p class="text-sm text-amber-900/90 dark:text-amber-100/90 leading-relaxed">
                {{ t('warrantyPolicy.sections.exclusions.maintenanceText') }}
              </p>
            </div>
          </section>

          <div class="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-5 py-4 dark:border-gray-600 dark:bg-gray-800/50">
            <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic">
              {{ t('warrantyPolicy.footerNote') }}
            </p>
          </div>
        </article>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'

const { t, tm } = useI18n()

const asStringArray = (key: string): string[] => {
  const value = tm(key)
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === 'string' ? item : String(item)))
  }
  return []
}

const scopeItems = computed(() => asStringArray('warrantyPolicy.sections.scope.items'))
const voidItems = computed(() => asStringArray('warrantyPolicy.sections.exclusions.voidItems'))
const notCoveredItems = computed(() => asStringArray('warrantyPolicy.sections.exclusions.notCoveredItems'))
</script>
