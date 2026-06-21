<template>
  <header class="sticky top-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50">
    <div class="max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-14 sm:h-16 gap-2">
        <router-link
          to="/customer/dashboard"
          class="flex items-center gap-2 min-w-0 touch-manipulation"
        >
          <div class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
            SSE
          </div>
        </router-link>

        <nav class="hidden lg:flex items-center gap-1">
          <router-link
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
            active-class="!text-blue-600 dark:!text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20"
          >
            {{ item.label }}
          </router-link>
        </nav>

        <div class="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <LanguageSwitcher class="hidden sm:block" />
          <NotificationMenu />
          <UserMenu />
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="lg:hidden p-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            :aria-expanded="mobileMenuOpen"
            aria-label="Toggle menu"
          >
            <MenuIcon class="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="mobileMenuOpen"
      class="lg:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
    >
      <div class="px-3 py-2 space-y-1 max-h-[70vh] overflow-y-auto">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          @click="mobileMenuOpen = false"
          class="flex items-center min-h-[44px] px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg touch-manipulation"
          active-class="!text-blue-600 dark:!text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/20"
        >
          {{ item.label }}
        </router-link>
        <div class="pt-2 border-t border-gray-200 dark:border-gray-800 sm:hidden">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import NotificationMenu from './header/NotificationMenu.vue'
import UserMenu from './header/UserMenu.vue'
import LanguageSwitcher from '../common/LanguageSwitcher.vue'
import MenuIcon from '@/icons/MenuIcon.vue'

const { t } = useI18n()
const mobileMenuOpen = ref(false)

const navItems = computed(() => [
  { to: '/customer/dashboard', label: t('customers.nav.dashboard') },
  { to: '/customer/inverters', label: t('customers.nav.devices') },
  { to: '/customer/tickets', label: t('customers.nav.tickets') },
  { to: '/customer/contracts', label: t('customers.nav.contracts') },
  { to: '/customer/warranty-policy', label: t('menu.warrantyPolicy') },
  { to: '/customer/profile', label: t('customers.nav.profile') },
])
</script>
