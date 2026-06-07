import { ref } from 'vue'
import { refreshNotifications } from '@/composables/useNotifications'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  message: string
  type: ToastType
}

const toasts = ref<ToastItem[]>([])
let nextId = 0

const dismiss = (id: number) => {
  toasts.value = toasts.value.filter((item) => item.id !== id)
}

const show = (message: string, type: ToastType = 'info', duration = 4000) => {
  const id = ++nextId
  toasts.value.push({ id, message, type })
  window.setTimeout(() => dismiss(id), duration)
}

export const useToast = () => ({
  toasts,
  show,
  dismiss,
  showSuccess: (message: string, options?: { refreshNotifications?: boolean }) => {
    show(message, 'success')
    if (options?.refreshNotifications !== false) {
      refreshNotifications().catch(() => {})
    }
  },
  showError: (message: string) => show(message, 'error', 5000),
  showInfo: (message: string) => show(message, 'info'),
})
