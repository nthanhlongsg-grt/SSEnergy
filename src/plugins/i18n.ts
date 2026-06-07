import { createI18n } from 'vue-i18n'
import en from '@/locales/en'
import vi from '@/locales/vi'

export const LANGUAGE_STORAGE_KEY = 'SGE:language'
export const SUPPORTED_LOCALES = ['vi', 'en'] as const
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

const isSupportedLocale = (value: string | null): value is SupportedLocale => {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale)
}

const detectLocale = (): SupportedLocale => {
  if (typeof window !== 'undefined') {
    const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY)
    if (isSupportedLocale(stored)) {
      return stored
    }

    const browserLang = window.navigator.language.slice(0, 2).toLowerCase()
    if (isSupportedLocale(browserLang)) {
      return browserLang
    }
  }

  return 'vi'
}

const initialLocale = detectLocale()

if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('lang', initialLocale)
}

const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: 'vi',
  messages: {
    en,
    vi,
  },
})

export default i18n




