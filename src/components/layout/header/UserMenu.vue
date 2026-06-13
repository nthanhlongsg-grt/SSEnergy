<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="flex items-center text-gray-700 dark:text-gray-400"
      @click.prevent="toggleDropdown"
    >
      <span class="mr-3 overflow-hidden rounded-full h-11 w-11 bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
        <img
          v-if="user?.avatar"
          :src="user.avatar"
          :alt="user?.name || 'Avatar'"
          class="w-full h-full object-cover"
        />
        <span v-else-if="user?.name" class="text-blue-600 dark:text-blue-400 font-bold text-lg">
          {{ user.name.charAt(0).toUpperCase() }}
        </span>
        <img v-else src="/images/user/owner.jpg" alt="User" class="w-full h-full object-cover" />
      </span>

      <span class="block mr-1 font-medium text-theme-sm">{{ user?.name || 'User' }}</span>

      <ChevronDownIcon :class="{ 'rotate-180': dropdownOpen }" />
    </button>

    <!-- Dropdown Start -->
    <div
      v-if="dropdownOpen"
      class="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
    >
      <div>
        <span class="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
          {{ user?.name || 'User' }}
        </span>
        <span
          v-if="user?.role"
          class="mt-1 inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
        >
          {{ getRoleLabel(user.role) }}
        </span>
      </div>

      <ul class="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200 dark:border-gray-800">
        <li v-for="item in menuItems" :key="item.href">
          <router-link
            :to="item.href"
            class="flex items-center gap-3 px-3 py-2 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
          >
            <!-- SVG icon would go here -->
            <component
              :is="item.icon"
              class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
            />
            {{ item.text }}
          </router-link>
        </li>
      </ul>
      <button
        @click.prevent="signOut"
        class="flex w-full items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
      >
        <LogoutIcon
          class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
        />
        Sign out
      </button>
    </div>
    <!-- Dropdown End -->
  </div>
</template>

<script setup lang="ts">
import { ChevronDownIcon, InfoCircleIcon, LogoutIcon, UserCircleIcon } from '@/icons'
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuth, UserRole } from '@/composables/useAuth'

const router = useRouter()
const { getUser, logout: authLogout } = useAuth()

const user = computed(() => getUser.value)

const dropdownOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

const menuItems = [
  { href: '/profile', icon: UserCircleIcon, text: 'Chỉnh sửa hồ sơ' },
  { href: '/support', icon: InfoCircleIcon, text: 'Hỗ trợ' },
]

const getRoleLabel = (role: UserRole | string) => {
  const labels: Record<string, string> = {
    [UserRole.ADMIN]: 'Admin',
    [UserRole.DEV]: 'System',
    [UserRole.SERVICE_CENTER]: 'Service Center',
    [UserRole.TECHNICIAN]: 'Kỹ thuật viên',
    [UserRole.DISTRIBUTOR]: 'Đại lý',
    [UserRole.DEALER]: 'Nhà phân phối',
    [UserRole.END_USER]: 'Khách hàng cuối',
    [UserRole.WAREHOUSE]: 'Kho',
    [UserRole.ACCOUNTING]: 'Kế toán',
  }
  return labels[role] || role
}

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const signOut = async () => {
  closeDropdown()
  await authLogout()
  // Directly redirect to signin page without going through router
  // This avoids any intermediate redirects from router guards
  window.location.href = '/signin'
}

const handleClickOutside = (event: Event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
