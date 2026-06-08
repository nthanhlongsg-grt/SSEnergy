<template>
  <div class="min-h-screen xl:flex bg-gray-50">
    <app-sidebar />
    <Backdrop />
    <div
      class="flex-1 flex flex-col transition-all duration-300 ease-in-out min-h-screen"
      :class="['bg-gray-50', isExpanded || isHovered ? 'lg:ml-[290px]' : 'lg:ml-[90px]']"
    >
      <app-header />
      <div class="flex-1 p-4 mx-auto w-full max-w-full md:p-6 overflow-x-hidden">
        <slot></slot>
      </div>
      <!-- Footer -->
      <footer class="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div class="px-4 py-5 md:px-6">
          <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div class="space-y-1">
              <p class="text-sm font-semibold text-gray-800 dark:text-white">
                CÔNG TY TNHH THƯƠNG MẠI VÀ DỊCH VỤ SGE
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                MST: <span class="font-mono">3703455937</span>
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                12E1 đường số 4, KDC Vĩnh Phú 1, Phường Bình Hòa, TP Hồ Chí Minh, Việt Nam
              </p>
            </div>
            <div class="space-y-1.5 md:text-right">
              <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 md:justify-end">
                <svg class="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                <a href="mailto:sge.company2026@gmail.com" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  sge.company2026@gmail.com
                </a>
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 md:justify-end">
                <svg class="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
                </svg>
                TK: <span class="font-mono font-medium text-gray-700 dark:text-gray-300 mx-1">67852068</span>
                – MB Bank (CN Thuận An)
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
    <AppToast />
  </div>
</template>

<script setup lang="ts">
import { useSidebar } from '@/composables/useSidebar'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import Backdrop from './Backdrop.vue'
import MobileSearchBar from './MobileSearchBar.vue'
import AppToast from '@/components/common/AppToast.vue'
const { isExpanded, isHovered } = useSidebar()
</script>
