<template>
  <header class="sticky top-0 w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-50">
    <div class="max-w-1400px mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <router-link to="/customer/dashboard" class="flex items-center gap-3">
          <div class="text-xl font-bold text-gray-900 dark:text-white">
            SSE
          </div>
        </router-link>

        <!-- Navigation -->
        <nav class="hidden md:flex items-center gap-6">
          <router-link
            to="/customer/dashboard"
            class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            active-class="text-blue-600 dark:text-blue-400 font-medium"
          >
            Dashboard
          </router-link>
          <router-link
            to="/customer/inverters"
            class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            active-class="text-blue-600 dark:text-blue-400 font-medium"
          >
            Thiết bị
          </router-link>
          <router-link
            to="/customer/tickets"
            class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            active-class="text-blue-600 dark:text-blue-400 font-medium"
          >
            Yêu cầu Hỗ trợ
          </router-link>
          <router-link
            to="/customer/warranty-policy"
            class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            active-class="text-blue-600 dark:text-blue-400 font-medium"
          >
            {{ t('menu.warrantyPolicy') }}
          </router-link>
          <router-link
            to="/customer/profile"
            class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            active-class="text-blue-600 dark:text-blue-400 font-medium"
          >
            Thông tin
          </router-link>
        </nav>

        <!-- User Menu -->
        <div class="flex items-center gap-2 md:gap-4">
          <NotificationMenu />
          <UserMenu />
          <!-- Mobile Menu Button -->
          <button
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle menu"
          >
            <MenuIcon class="h-6 w-6" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div v-if="mobileMenuOpen" class="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div class="px-4 py-3 space-y-2">
        <router-link
          to="/customer/dashboard"
          @click="mobileMenuOpen = false"
          class="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          Dashboard
        </router-link>
        <router-link
          to="/customer/inverters"
          @click="mobileMenuOpen = false"
          class="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          Thiết bị
        </router-link>
        <router-link
          to="/customer/tickets"
          @click="mobileMenuOpen = false"
          class="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          Yêu cầu Hỗ trợ
        </router-link>
        <router-link
          to="/customer/warranty-policy"
          @click="mobileMenuOpen = false"
          class="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          Chính sách bảo hành
        </router-link>
        <router-link
          to="/customer/profile"
          @click="mobileMenuOpen = false"
          class="block px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          Thông tin
        </router-link>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import NotificationMenu from './header/NotificationMenu.vue'
import UserMenu from './header/UserMenu.vue'
import MenuIcon from '@/icons/MenuIcon.vue'

const { t } = useI18n()
const mobileMenuOpen = ref(false)
</script>




