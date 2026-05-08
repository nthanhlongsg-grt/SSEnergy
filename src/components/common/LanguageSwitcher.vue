<template>
  <div class="flex h-9 items-center rounded-lg border border-gray-200 p-0.5 text-xs font-semibold dark:border-gray-800 dark:bg-gray-900">
    <button
      v-for="language in languages"
      :key="language.code"
      type="button"
      class="rounded-md px-2 py-1 transition-colors flex items-center justify-center min-w-[36px]"
      :class="[
        language.code === locale
          ? 'bg-brand-500 text-white shadow-sm'
          : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
      ]"
      :title="t(language.labelKey)"
      @click="changeLanguage(language.code)"
    >
      <span v-if="language.display === 'flag'" class="text-base leading-none">{{ language.flag }}</span>
      <span v-else class="text-xs font-medium">{{ language.code.toUpperCase() }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { LANGUAGE_STORAGE_KEY, SUPPORTED_LOCALES, type SupportedLocale } from '@/plugins/i18n'

const { t, locale } = useI18n()

const languages = [
  {
    code: 'vi' as SupportedLocale,
    labelKey: 'language.short.vi',
    flag: '🇻🇳',
    display: 'flag',
  },
  {
    code: 'en' as SupportedLocale,
    labelKey: 'language.short.en',
    flag: '🇬🇧',
    display: 'text',
  },
]

const changeLanguage = (nextLocale: SupportedLocale) => {
  if (locale.value === nextLocale || !SUPPORTED_LOCALES.includes(nextLocale)) {
    return
  }

  locale.value = nextLocale

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLocale)
  }

  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('lang', nextLocale)
  }
}
</script>

