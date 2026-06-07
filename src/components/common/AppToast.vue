<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-x-0 top-4 z-[100001] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6 sm:top-6"
      aria-live="polite"
      aria-relevant="additions"
    >
      <TransitionGroup
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 translate-y-2 sm:translate-y-0 sm:translate-x-2"
        enter-to-class="opacity-100 translate-y-0 sm:translate-x-0"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 translate-y-0 sm:translate-x-0"
        leave-to-class="opacity-0 translate-y-2 sm:translate-y-0 sm:translate-x-2"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm"
          :class="toastClass(toast.type)"
        >
          <component :is="iconFor(toast.type)" class="mt-0.5 h-5 w-5 flex-shrink-0" />
          <p class="flex-1 text-sm font-medium leading-snug">{{ toast.message }}</p>
          <button
            type="button"
            class="rounded p-1 opacity-70 hover:opacity-100 touch-manipulation"
            aria-label="Đóng"
            @click="dismiss(toast.id)"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { h, type FunctionalComponent } from 'vue'
import { useToast, type ToastType } from '@/composables/useToast'

const { toasts, dismiss } = useToast()

const toastClass = (type: ToastType) => {
  if (type === 'success') {
    return 'border-emerald-200 bg-emerald-50/95 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/95 dark:text-emerald-100'
  }
  if (type === 'error') {
    return 'border-red-200 bg-red-50/95 text-red-900 dark:border-red-800 dark:bg-red-950/95 dark:text-red-100'
  }
  return 'border-blue-200 bg-blue-50/95 text-blue-900 dark:border-blue-800 dark:bg-blue-950/95 dark:text-blue-100'
}

const SuccessIcon: FunctionalComponent = () =>
  h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M5 13l4 4L19 7',
    }),
  ])

const ErrorIcon: FunctionalComponent = () =>
  h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    }),
  ])

const InfoIcon: FunctionalComponent = () =>
  h('svg', { fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
    h('path', {
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      'stroke-width': '2',
      d: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    }),
  ])

const iconFor = (type: ToastType) => {
  if (type === 'success') return SuccessIcon
  if (type === 'error') return ErrorIcon
  return InfoIcon
}
</script>
