import { ref, computed } from 'vue'
import { slaSettingsService } from '@/services/slaSettingsService'

// Default fallback values
const DEFAULT_SLA_HOURS = {
  urgent: 24,
  high: 48,
  medium: 72,
  low: 96,
}

interface SlaHours {
  urgent: number
  high: number
  medium: number
  low: number
}

// Singleton state – shared across all component instances
const slaHours = ref<SlaHours>({ ...DEFAULT_SLA_HOURS })
let loaded = false
let loadingPromise: Promise<void> | null = null

const loadSettings = async () => {
  if (loaded) return
  if (loadingPromise) return loadingPromise

  loadingPromise = slaSettingsService
    .getSettings()
    .then((settings) => {
      slaHours.value = {
        urgent: settings.urgent ?? DEFAULT_SLA_HOURS.urgent,
        high: settings.high ?? DEFAULT_SLA_HOURS.high,
        medium: settings.medium ?? DEFAULT_SLA_HOURS.medium,
        low: settings.low ?? DEFAULT_SLA_HOURS.low,
      }
      loaded = true
    })
    .catch(() => {
      // Silently fall back to defaults
      loaded = true
    })
    .finally(() => {
      loadingPromise = null
    })

  return loadingPromise
}

// Force re-fetch (called after saving in SlaSettings page)
const reloadSettings = async () => {
  loaded = false
  loadingPromise = null
  await loadSettings()
}

export const useSlaSettings = () => {
  // Trigger load on first use
  loadSettings()

  const getSlaHoursByPriority = (priority?: string | null): number => {
    const p = priority as keyof typeof DEFAULT_SLA_HOURS
    return slaHours.value[p] ?? DEFAULT_SLA_HOURS.medium
  }

  const getSlaLabel = (priority?: string | null): string => {
    const hours = getSlaHoursByPriority(priority)
    return hours < 24 ? `${hours}h` : `${hours}h`
  }

  return {
    slaHours: computed(() => slaHours.value),
    getSlaHoursByPriority,
    getSlaLabel,
    reloadSettings,
  }
}
