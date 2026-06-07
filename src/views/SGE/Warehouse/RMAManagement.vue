<template>
  <admin-layout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý RMA (Return Merchandise Authorization)
          </h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Quản lý RMA gửi về Trung Quốc - Trung tâm dịch vụ SGE
          </p>
        </div>
        <button
          @click="showNewRMAModal = true"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusIcon class="h-5 w-5" />
          <span>Tạo RMA mới</span>
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-5">
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Tổng RMA</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.total }}
              </p>
            </div>
            <DocsIcon class="h-10 w-10 text-blue-500" />
          </div>
        </div>
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Chờ gửi</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.pending }}
              </p>
            </div>
            <WarningIcon class="h-10 w-10 text-yellow-500" />
          </div>
        </div>
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Đang vận chuyển</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.in_transit }}
              </p>
            </div>
            <BoxIcon class="h-10 w-10 text-orange-500" />
          </div>
        </div>
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Đã nhận</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.received }}
              </p>
            </div>
            <CheckIcon class="h-10 w-10 text-green-500" />
          </div>
        </div>
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Đã hoàn thành</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.completed }}
              </p>
            </div>
            <SuccessIcon class="h-10 w-10 text-blue-500" />
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
              placeholder="Mã RMA, mã linh kiện..."
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Trạng thái
            </label>
            <select
              v-model="filters.status"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tất cả</option>
              <option value="pending">Chờ gửi</option>
              <option value="in_transit">Đang vận chuyển</option>
              <option value="received">Đã nhận</option>
              <option value="processing">Đang xử lý</option>
              <option value="completed">Hoàn thành</option>
              <option value="rejected">Từ chối</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ngày tạo
            </label>
            <input
              v-model="filters.dateFrom"
              type="date"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
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

      <!-- RMA Table -->
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
                  Mã RMA
                </th>
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
                  Số lượng
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Lý do
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Ticket liên quan
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Ngày tạo
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
                v-for="rma in filteredRMAs"
                :key="rma.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                @click="viewRMA(rma.id)"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="font-medium text-blue-600 dark:text-blue-400">
                    #{{ rma.rmaNumber }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm text-gray-900 dark:text-white">
                    {{ rma.partCode }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm text-gray-900 dark:text-white">
                    {{ rma.partName }}
                  </p>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-center">
                  <span class="text-sm text-gray-900 dark:text-white">
                    {{ rma.quantity }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm text-gray-900 dark:text-white">
                    {{ rma.reason }}
                  </p>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <router-link
                    v-if="rma.ticketNumber"
                    :to="`/tickets/${rma.ticketId}`"
                    @click.stop
                    class="text-sm text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    #{{ rma.ticketNumber }}
                  </router-link>
                  <span v-else class="text-sm text-gray-500 dark:text-gray-400">
                    N/A
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(rma.createdAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      getStatusClass(rma.status),
                    ]"
                  >
                    {{ getStatusLabel(rma.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm" @click.stop>
                  <div class="flex gap-2">
                    <button
                      @click="viewRMA(rma.id)"
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Xem
                    </button>
                    <button
                      v-if="rma.status === 'pending'"
                      @click="updateRMAStatus(rma.id, 'in_transit')"
                      class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 font-medium"
                    >
                      Gửi
                    </button>
                    <button
                      v-if="canPrint(rma.status)"
                      @click="printRMAForm(rma.id)"
                      class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300 font-medium"
                    >
                      In
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredRMAs.length === 0">
                <td colspan="9" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  Không có RMA nào
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
  DocsIcon,
  WarningIcon,
  BoxIcon,
  CheckIcon,
  SuccessIcon,
} from '../../../icons'

const showNewRMAModal = ref(false)

const stats = ref({
  total: 45,
  pending: 8,
  in_transit: 5,
  received: 12,
  completed: 20,
})

const filters = ref({
  search: '',
  status: '',
  dateFrom: '',
})

const rmas = ref([
  {
    id: 1,
    rmaNumber: 'RMA-2024-001',
    partCode: 'GW-MB-001',
    partName: 'Mainboard MAX 10KTL3-X',
    quantity: 2,
    reason: 'Lỗi DOA (Dead on Arrival)',
    ticketNumber: 'TK-2024-001',
    ticketId: 1,
    status: 'pending',
    createdAt: new Date('2024-11-20'),
    trackingNumber: null,
    shippedDate: null,
    receivedDate: null,
  },
  {
    id: 2,
    rmaNumber: 'RMA-2024-002',
    partCode: 'GW-MPPT-002',
    partName: 'MPPT Board MAX Series',
    quantity: 1,
    reason: 'Lỗi sau 3 tháng sử dụng',
    ticketNumber: 'TK-2024-003',
    ticketId: 3,
    status: 'in_transit',
    createdAt: new Date('2024-11-15'),
    trackingNumber: 'SF1234567890',
    shippedDate: new Date('2024-11-18'),
    receivedDate: null,
  },
  {
    id: 3,
    rmaNumber: 'RMA-2024-003',
    partCode: 'GW-FAN-003',
    partName: 'Fan Module 12V',
    quantity: 5,
    reason: 'Lỗi do quá nhiệt',
    ticketNumber: null,
    ticketId: null,
    status: 'received',
    createdAt: new Date('2024-11-10'),
    trackingNumber: 'SF0987654321',
    shippedDate: new Date('2024-11-12'),
    receivedDate: new Date('2024-11-22'),
  },
  {
    id: 4,
    rmaNumber: 'RMA-2024-004',
    partCode: 'GW-LCD-004',
    partName: 'LCD Display Board',
    quantity: 1,
    reason: 'Lỗi màn hình không hiển thị',
    ticketNumber: 'TK-2024-005',
    ticketId: 5,
    status: 'completed',
    createdAt: new Date('2024-10-25'),
    trackingNumber: 'SF1122334455',
    shippedDate: new Date('2024-10-28'),
    receivedDate: new Date('2024-11-05'),
    completedDate: new Date('2024-11-15'),
  },
])

const filteredRMAs = computed(() => {
  let result = rmas.value

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(
      (r) =>
        r.rmaNumber.toLowerCase().includes(search) ||
        r.partCode.toLowerCase().includes(search) ||
        r.partName.toLowerCase().includes(search)
    )
  }

  if (filters.value.status) {
    result = result.filter((r) => r.status === filters.value.status)
  }

  if (filters.value.dateFrom) {
    const dateFrom = new Date(filters.value.dateFrom)
    result = result.filter((r) => new Date(r.createdAt) >= dateFrom)
  }

  return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
})

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    in_transit:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    received: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    processing:
      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return classes[status] || classes.pending
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Chờ gửi',
    in_transit: 'Đang vận chuyển',
    received: 'Đã nhận',
    processing: 'Đang xử lý',
    completed: 'Hoàn thành',
    rejected: 'Từ chối',
  }
  return labels[status] || status
}

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

const canPrint = (status: string) => {
  return ['pending', 'in_transit', 'received'].includes(status)
}

const clearFilters = () => {
  filters.value = {
    search: '',
    status: '',
    dateFrom: '',
  }
}

const viewRMA = (rmaId: number) => {
  // TODO: Show RMA detail modal
  console.log('View RMA:', rmaId)
}

const updateRMAStatus = (rmaId: number, newStatus: string) => {
  // TODO: Update RMA status via API
  const rma = rmas.value.find((r) => r.id === rmaId)
  if (rma) {
    rma.status = newStatus
    if (newStatus === 'in_transit') {
      rma.shippedDate = new Date()
    }
  }
}

const printRMAForm = (rmaId: number) => {
  // TODO: Generate and print RMA form PDF
  console.log('Print RMA form:', rmaId)
  alert('Tính năng in RMA form đang được phát triển...')
}
</script>