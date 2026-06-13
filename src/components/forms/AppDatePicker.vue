<script setup lang="ts">
import flatPickr from 'vue-flatpickr-component'
import { useFlatpickrConfig } from '@/composables/useFlatpickr'

const modelValue = defineModel<string>({ default: '' })

const props = withDefaults(
  defineProps<{
    placeholder?: string
    inputClass?: string
    disabled?: boolean
  }>(),
  {
    placeholder: 'dd/mm/yyyy',
  },
)

const { dateConfig } = useFlatpickrConfig()

const defaultClass =
  'w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
</script>

<template>
  <flat-pickr
    v-model="modelValue"
    :config="dateConfig"
    :placeholder="placeholder"
    :class="props.inputClass || defaultClass"
    :disabled="disabled"
  />
</template>
