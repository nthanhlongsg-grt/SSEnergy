<template>
  <admin-layout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý Linh kiện (Function đang phát triển, dữ liệu ở dưới chỉ để minh họa giao diện.)
          </h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Quản lý tồn kho linh kiện thay thế theo mã SGE()
          </p>
        </div>
        <div class="flex gap-2">
          <button
            @click="showImportModal = true"
            class="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <PlusIcon class="h-5 w-5" />
            <span>Nhập kho</span>
          </button>
          <button
            @click="showExportModal = true"
            class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon class="h-5 w-5" />
            <span>Xuất kho</span>
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Tổng loại linh kiện</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.totalParts }}
              </p>
            </div>
            <BoxIcon class="h-10 w-10 text-blue-500" />
          </div>
        </div>
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Tổng số lượng</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.totalQuantity }}
              </p>
            </div>
            <BoxCubeIcon class="h-10 w-10 text-green-500" />
          </div>
        </div>
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Giá trị tồn kho</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ formatCurrency(stats.totalValue) }}
              </p>
            </div>
            <PieChartIcon class="h-10 w-10 text-yellow-500" />
          </div>
        </div>
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Sắp hết hàng</p>
              <p class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {{ stats.lowStock }}
              </p>
            </div>
            <WarningIcon class="h-10 w-10 text-red-500" />
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
      >
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tìm kiếm
            </label>
            <input
              v-model="filters.search"
              type="text"
              placeholder="Mã linh kiện, tên..."
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Loại linh kiện
            </label>
            <select
              v-model="filters.category"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tất cả</option>
              <option value="mainboard">Mainboard</option>
              <option value="mppt">MPPT Board</option>
              <option value="power">Power Board</option>
              <option value="lcd">LCD Board</option>
              <option value="relay">Relay</option>
              <option value="fan">Fan Module</option>
              <option value="mcu">MCU</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trạng thái
            </label>
            <select
              v-model="filters.stockStatus"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tất cả</option>
              <option value="in_stock">Còn hàng</option>
              <option value="low_stock">Sắp hết</option>
              <option value="out_of_stock">Hết hàng</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              @click="clearFilters"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </div>

      <!-- Parts Table -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div class="overflow-y-auto max-h-[600px]">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Mã linh kiện
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Tên linh kiện
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Loại
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Model tương thích
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Tồn kho
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Tối thiểu
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Đơn giá
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Tổng giá trị
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Trạng thái
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="part in filteredParts"
                :key="part.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ part.code }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ part.name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ part.description }}
                  </p>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      getCategoryClass(part.category),
                    ]"
                  >
                    {{ getCategoryLabel(part.category) }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="model in part.compatibleModels"
                      :key="model"
                      class="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                    >
                      {{ model }}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <span
                    :class="[
                      'text-sm font-medium',
                      getStockStatus(part) === 'low_stock'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : getStockStatus(part) === 'out_of_stock'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-900 dark:text-white',
                    ]"
                  >
                    {{ part.quantity }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500 dark:text-gray-400">
                  {{ part.minQuantity }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {{ formatCurrency(part.unitPrice) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                  {{ formatCurrency(part.quantity * part.unitPrice) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      getStockStatusClass(getStockStatus(part)),
                    ]"
                  >
                    {{ getStockStatusLabel(getStockStatus(part)) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm" @click.stop>
                  <div class="flex gap-2">
                    <button
                      @click="viewPartHistory(part.id)"
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Lịch sử
                    </button>
                    <button
                      @click="editPart(part.id)"
                      class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 font-medium"
                    >
                      Sửa
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredParts.length === 0">
                <td colspan="10" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  Không có linh kiện nào
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
import { ref, computed } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import {
  PlusIcon,
  BoxIcon,
  BoxCubeIcon,
  PieChartIcon,
  WarningIcon,
} from '../../../icons'

const showImportModal = ref(false)
const showExportModal = ref(false)

const stats = ref({
  totalParts: 45,
  totalQuantity: 1250,
  totalValue: 125000000,
  lowStock: 5,
})

const filters = ref({
  search: '',
  category: '',
  stockStatus: '',
})

const parts = ref([
  {
    id: 1,
    code: 'GW-MB-001',
    name: 'Mainboard MAX 10KTL3-X',
    description: 'Mainboard chính cho model MAX 10KTL3-X',
    category: 'mainboard',
    compatibleModels: ['MAX 10KTL3-X', 'MAX 15KTL3-X'],
    quantity: 15,
    minQuantity: 5,
    unitPrice: 3500000,
  },
  {
    id: 2,
    code: 'GW-MPPT-002',
    name: 'MPPT Board MAX Series',
    description: 'Bảng điều khiển MPPT cho MAX series',
    category: 'mppt',
    compatibleModels: ['MAX 10KTL3-X', 'MAX 15KTL3-X', 'MAX 20KTL3-X'],
    quantity: 8,
    minQuantity: 10,
    unitPrice: 2500000,
  },
  {
    id: 3,
    code: 'GW-FAN-003',
    name: 'Fan Module 12V',
    description: 'Module quạt làm mát 12V',
    category: 'fan',
    compatibleModels: ['MAX 10KTL3-X', 'MID 15KTL3-X', 'SPH 6000'],
    quantity: 2,
    minQuantity: 5,
    unitPrice: 450000,
  },
  {
    id: 4,
    code: 'GW-LCD-004',
    name: 'LCD Display Board',
    description: 'Bảng màn hình LCD hiển thị',
    category: 'lcd',
    compatibleModels: ['SPH 6000', 'SPF 5000'],
    quantity: 12,
    minQuantity: 5,
    unitPrice: 1200000,
  },
  {
    id: 5,
    code: 'GW-RELAY-005',
    name: 'Relay 30A',
    description: 'Relay điều khiển 30A',
    category: 'relay',
    compatibleModels: ['MAX Series', 'MID Series', 'MOD Series'],
    quantity: 0,
    minQuantity: 10,
    unitPrice: 350000,
  },
])

const filteredParts = computed(() => {
  let result = parts.value

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(
      (p) =>
        p.code.toLowerCase().includes(search) ||
        p.name.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
    )
  }

  if (filters.value.category) {
    result = result.filter((p) => p.category === filters.value.category)
  }

  if (filters.value.stockStatus) {
    result = result.filter((p) => getStockStatus(p) === filters.value.stockStatus)
  }

  return result
})

const getStockStatus = (part: any) => {
  if (part.quantity === 0) return 'out_of_stock'
  if (part.quantity <= part.minQuantity) return 'low_stock'
  return 'in_stock'
}

type PartCategory = 'mainboard' | 'mppt' | 'power' | 'lcd' | 'relay' | 'fan' | 'mcu' | 'other'
type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

const categoryClasses: Record<PartCategory, string> = {
  mainboard: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  mppt: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  power: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  lcd: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  relay: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  fan: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  mcu: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
}

const categoryLabels: Record<PartCategory, string> = {
  mainboard: 'Mainboard',
  mppt: 'MPPT Board',
  power: 'Power Board',
  lcd: 'LCD Board',
  relay: 'Relay',
  fan: 'Fan',
  mcu: 'MCU',
  other: 'Khác',
}

const stockStatusClasses: Record<StockStatus, string> = {
  in_stock: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  low_stock: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  out_of_stock: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

const stockStatusLabels: Record<StockStatus, string> = {
  in_stock: 'Còn hàng',
  low_stock: 'Sắp hết',
  out_of_stock: 'Hết hàng',
}

const isCategory = (value: string): value is PartCategory => {
  return value in categoryClasses
}

const isStockStatus = (value: string): value is StockStatus => {
  return value in stockStatusClasses
}

const getCategoryClass = (category: string) => {
  return isCategory(category) ? categoryClasses[category] : categoryClasses.other
}

const getCategoryLabel = (category: string) => {
  return isCategory(category) ? categoryLabels[category] : category
}

const getStockStatusClass = (status: string) => {
  return isStockStatus(status) ? stockStatusClasses[status] : stockStatusClasses.in_stock
}

const getStockStatusLabel = (status: string) => {
  return isStockStatus(status) ? stockStatusLabels[status] : status
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

const clearFilters = () => {
  filters.value = {
    search: '',
    category: '',
    stockStatus: '',
  }
}

const viewPartHistory = (partId: number) => {
  // TODO: Show part history modal
  console.log('View part history:', partId)
}

const editPart = (partId: number) => {
  // TODO: Show edit part modal
  console.log('Edit part:', partId)
}
</script>