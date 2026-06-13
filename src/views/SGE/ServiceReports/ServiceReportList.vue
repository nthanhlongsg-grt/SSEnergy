<template>
  <admin-layout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Biên bản Dịch vụ
          </h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            Quản lý lịch sử sửa chữa và biên bản dịch vụ bảo hành
          </p>
        </div>
        <div class="flex gap-2">
          <button
            @click="exportReports"
            class="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <DocsIcon class="h-5 w-5" />
            <span>Xuất Excel</span>
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
              <p class="text-sm text-gray-500 dark:text-gray-400">Tổng Biên bản</p>
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
              <p class="text-sm text-gray-500 dark:text-gray-400">Tháng này</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.thisMonth }}
              </p>
            </div>
            <CalenderIcon class="h-10 w-10 text-green-500" />
          </div>
        </div>
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Chờ ký</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.pendingSignature }}
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
              <p class="text-sm text-gray-500 dark:text-gray-400">Đã hoàn thành</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.completed }}
              </p>
            </div>
            <CheckIcon class="h-10 w-10 text-purple-500" />
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
              placeholder="Mã biên bản, ticket, khách hàng..."
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
              <option value="draft">Bản nháp</option>
              <option value="pending_signature">Chờ ký</option>
              <option value="signed">Đã ký</option>
              <option value="completed">Hoàn thành</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Từ ngày
            </label>
            <AppDatePicker
              v-model="filters.dateFrom"
              input-class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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

      <!-- Reports Table -->
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
                  Mã Biên bản
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Ticket
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Khách hàng
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Model / Serial
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  Kỹ thuật viên
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
                v-for="report in filteredReports"
                :key="report.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                @click="$router.push(`/service-reports/${report.id}`)"
              >
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="font-medium text-blue-600 dark:text-blue-400">
                    #{{ report.reportNumber }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <router-link
                    :to="`/tickets/${report.ticketId}`"
                    @click.stop
                    class="text-sm text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    #{{ report.ticketNumber }}
                  </router-link>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <p class="text-sm text-gray-900 dark:text-white">
                    {{ report.customerName }}
                  </p>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <p class="text-sm text-gray-900 dark:text-white">{{ report.model }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ report.serialNumber }}
                    </p>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ report.technician }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(report.createdAt) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      getStatusClass(report.status),
                    ]"
                  >
                    {{ getStatusLabel(report.status) }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm" @click.stop>
                  <div class="flex gap-2">
                    <router-link
                      :to="`/service-reports/${report.id}`"
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                    >
                      Xem
                    </router-link>
                    <button
                      @click="exportPDF(report.id)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 font-medium"
                    >
                      PDF
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="filteredReports.length === 0">
                <td colspan="8" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  Không có biên bản nào
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
import AppDatePicker from '@/components/forms/AppDatePicker.vue'
import {
  DocsIcon,
  CalenderIcon,
  WarningIcon,
  CheckIcon,
} from '../../../icons'

const stats = ref({
  total: 180,
  thisMonth: 32,
  pendingSignature: 8,
  completed: 165,
})

const filters = ref({
  search: '',
  status: '',
  dateFrom: '',
})

const reports = ref([
  {
    id: 1,
    reportNumber: 'BB-2024-001',
    ticketId: 1,
    ticketNumber: 'TK-2024-001',
    customerName: 'Nguyễn Văn A',
    model: 'MAX 10KTL3-X',
    serialNumber: 'GW1234567890',
    technician: 'Trần Văn B',
    status: 'signed',
    createdAt: new Date('2024-11-20'),
  },
  {
    id: 2,
    reportNumber: 'BB-2024-002',
    ticketId: 2,
    ticketNumber: 'TK-2024-002',
    customerName: 'Lê Thị C',
    model: 'MID 15KTL3-X',
    serialNumber: 'GW0987654321',
    technician: 'Nguyễn Văn E',
    status: 'pending_signature',
    createdAt: new Date('2024-11-22'),
  },
  {
    id: 3,
    reportNumber: 'BB-2024-003',
    ticketId: 3,
    ticketNumber: 'TK-2024-003',
    customerName: 'Phạm Văn D',
    model: 'SPH 6000',
    serialNumber: 'GW1122334455',
    technician: 'Lê Văn G',
    status: 'draft',
    createdAt: new Date('2024-11-23'),
  },
])

const filteredReports = computed(() => {
  let result = reports.value

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(
      (r) =>
        r.reportNumber.toLowerCase().includes(search) ||
        r.ticketNumber.toLowerCase().includes(search) ||
        r.customerName.toLowerCase().includes(search) ||
        r.serialNumber.toLowerCase().includes(search)
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
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    pending_signature:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    signed: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }
  return classes[status] || classes.draft
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'Bản nháp',
    pending_signature: 'Chờ ký',
    signed: 'Đã ký',
    completed: 'Hoàn thành',
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

const clearFilters = () => {
  filters.value = {
    search: '',
    status: '',
    dateFrom: '',
  }
}

const exportPDF = (reportId: number) => {
  // TODO: Implement PDF export
  console.log('Export PDF for report:', reportId)
  alert('Tính năng xuất PDF đang được phát triển...')
}

const exportReports = () => {
  // TODO: Implement Excel export
  console.log('Export reports to Excel')
  alert('Tính năng xuất Excel đang được phát triển...')
}
</script>