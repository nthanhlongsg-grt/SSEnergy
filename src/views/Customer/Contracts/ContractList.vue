<template>
  <admin-layout>
    <div class="space-y-6 px-4 sm:px-0">
      <div>
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Hợp đồng của tôi</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Theo dõi chi tiết hợp đồng</p>
      </div>

      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <input
            v-model="filters.search"
            @input="debouncedLoad"
            type="text"
            placeholder="Tìm theo số hợp đồng..."
            class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div v-if="error" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
        <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <div v-if="loading && contracts.length === 0" class="flex justify-center py-12 text-gray-500 dark:text-gray-400 text-sm">
        Đang tải...
      </div>

      <div v-else class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Số HĐ</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Loại</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">Ngày ký</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden lg:table-cell">Giá trị</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Thanh toán</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr
                v-for="c in contracts"
                :key="c.id"
                @click="router.push(`/customer/contracts/${c.id}`)"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
              >
                <td class="px-4 py-3">
                  <p class="font-mono text-blue-600 dark:text-blue-400 font-medium">{{ c.contract_number }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 sm:hidden mt-0.5">{{ typeLabel(c.contract_type) }}</p>
                </td>
                <td class="px-4 py-3 hidden sm:table-cell">
                  <span :class="typeClass(c.contract_type)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                    {{ typeLabel(c.contract_type) }}
                  </span>
                </td>
                <td class="px-4 py-3 hidden md:table-cell text-gray-600 dark:text-gray-400">
                  {{ c.signed_date ? formatDate(c.signed_date) : '—' }}
                </td>
                <td class="px-4 py-3 hidden lg:table-cell text-right font-medium text-gray-900 dark:text-white">
                  {{ formatCurrency(c.value) }}
                </td>
                <td class="px-4 py-3 text-center">
                  <span :class="paymentStatusClass(isContractPaid(c))" class="px-2 py-0.5 rounded-full text-xs font-medium">
                    {{ getPaymentStatusLabel(c) }}
                  </span>
                </td>
              </tr>
              <tr v-if="!loading && contracts.length === 0">
                <td colspan="5" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                  Chưa có hợp đồng nào
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { contractService, type Contract } from '@/services/contractService'
import { isContractPaid, getPaymentStatusLabel, paymentStatusClass } from '@/utils/contractPaperwork'

const router = useRouter()
const contracts = ref<Contract[]>([])
const loading = ref(true)
const error = ref('')
const filters = ref({ search: '', page: 1, limit: 50 })

let debounceTimer: ReturnType<typeof setTimeout> | null = null

function debouncedLoad() {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    filters.value.page = 1
    loadContracts()
  }, 300)
}

async function loadContracts() {
  loading.value = true
  error.value = ''
  try {
    const res = await contractService.list({
      search: filters.value.search || undefined,
      page: filters.value.page,
      limit: filters.value.limit,
    })
    contracts.value = res.contracts
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('vi-VN')
}

function formatCurrency(v: number) {
  if (!v) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v)
}

function typeLabel(t: string) {
  const map: Record<string, string> = { service: 'Dịch vụ', economic: 'Kinh tế', other: 'Khác' }
  return map[t] ?? t
}

function typeClass(t: string) {
  const map: Record<string, string> = {
    service: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    economic: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  }
  return map[t] ?? 'bg-gray-100 text-gray-600'
}

onMounted(loadContracts)
</script>
