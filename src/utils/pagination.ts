import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'

export interface PaginationOptions {
  itemsPerPage?: number
}

export function usePagination<T>(
  filteredItems: Ref<T[]> | ComputedRef<T[]>,
  options: PaginationOptions = {}
) {
  const itemsPerPage = options.itemsPerPage || 20
  const currentPage = ref(1)

  const totalPages = computed(() => Math.ceil(filteredItems.value.length / itemsPerPage))

  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredItems.value.slice(start, end)
  })

  const visiblePages = computed(() => {
    const pages: number[] = []
    const maxVisible = 5
    let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
    const end = Math.min(totalPages.value, start + maxVisible - 1)
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1)
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    return pages
  })

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
      currentPage.value = page
    }
  }

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++
    }
  }

  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--
    }
  }

  const resetPage = () => {
    currentPage.value = 1
  }

  return {
    currentPage,
    itemsPerPage,
    totalPages,
    paginatedItems,
    visiblePages,
    goToPage,
    nextPage,
    prevPage,
    resetPage,
  }
}

