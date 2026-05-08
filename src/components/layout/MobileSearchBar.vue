<template>
  <div class="lg:hidden px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
    <form @submit.prevent="handleSearch" class="flex gap-2">
      <div class="relative flex-1">
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="t('search.placeholder')"
          ref="searchInput"
          class="w-full h-12 pl-4 pr-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 touch-manipulation"
          @mousedown.stop
          @keyup.enter="handleSearch"
        />
      </div>
      <button
        type="submit"
        @click="handleSearch"
        class="px-2 py-2 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors touch-manipulation min-h-[48px] min-w-[40px] flex items-center justify-center rounded-lg"
      >
        <svg
          class="fill-current text-gray-600 dark:text-gray-400"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
            fill=""
          />
        </svg>
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()
const searchInput = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')

const handleSearch = () => {
  if (!searchQuery.value.trim()) return
  
  // Navigate to search results page
  const isCustomerRoute = router.currentRoute.value.path.startsWith('/customer')
  const searchPath = isCustomerRoute ? '/customer/search' : '/search'
  router.push({
    path: searchPath,
    query: { q: searchQuery.value.trim() }
  })
}
</script>

