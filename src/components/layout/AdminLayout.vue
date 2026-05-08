<template>
  <div class="min-h-screen xl:flex" :class="backgroundClass">
    <app-sidebar />
    <Backdrop />
    <div
      class="flex-1 transition-all duration-300 ease-in-out min-h-screen"
      :class="[backgroundClass, isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]']"
    >
      <app-header />
      <div class="p-4 mx-auto max-w-full md:p-6 overflow-x-hidden">
        <slot></slot>
      </div>
      <!-- Footer -->
      <footer class="p-4 mx-auto max-w-(--breakpoint-2xl) md:p-6 pt-0">
        <p class="text-sm text-center text-gray-500 dark:text-gray-400">
          Growatt VietNam
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSidebar } from '@/composables/useSidebar'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import Backdrop from './Backdrop.vue'
import MobileSearchBar from './MobileSearchBar.vue'
import { useTheme } from './ThemeProvider.vue'
import { computed, type Ref } from 'vue'

const { isExpanded, isHovered } = useSidebar()
const theme = useTheme() as { isDarkMode: Ref<boolean> }

const backgroundClass = computed(() => (theme.isDarkMode.value ? 'bg-gray-950' : 'bg-gray-50'))
</script>
