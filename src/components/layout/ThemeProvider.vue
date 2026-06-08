<template>
  <slot></slot>
</template>

<script setup lang="ts">
import { provide, onMounted, computed } from 'vue'

const isDarkMode = computed(() => false)

onMounted(() => {
  localStorage.setItem('theme', 'light')
  document.documentElement.classList.remove('dark')
})

provide('theme', {
  isDarkMode,
})
</script>

<script lang="ts">
import { inject } from 'vue'

export function useTheme() {
  const theme = inject('theme')
  if (!theme) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return theme
}
</script>
