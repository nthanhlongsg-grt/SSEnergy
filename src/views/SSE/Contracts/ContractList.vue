<template>
  <admin-layout>
    <div class="px-4 sm:px-0 space-y-4 sm:space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý Hợp đồng
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Danh sách hợp đồng bảo trì, bảo hành và dịch vụ
          </p>
        </div>
        <button
          v-if="canManageContracts"
          @click="openCreate"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Tạo hợp đồng mới
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div class="rounded-xl p-3 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <p class="text-xs text-gray-500 dark:text-gray-400">Tổng cộng</p>
          <p class="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{{ stats.total ?? 0 }}</p>
        </div>
        <div
          class="rounded-xl p-3 border cursor-pointer transition-all hover:border-rose-300 dark:hover:border-rose-600"
          :class="filters.unpaid
            ? 'bg-rose-100 dark:bg-rose-900/30 border-transparent'
            : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700'"
          @click="toggleActiveUnpaidFilter"
        >
          <p class="text-xs text-rose-600 dark:text-rose-400">Chưa thanh toán</p>
          <p class="text-2xl font-bold mt-1 text-rose-700 dark:text-rose-300">{{ stats.active_unpaid ?? 0 }}</p>
        </div>
        <div class="rounded-xl p-3 border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700">
          <p class="text-xs text-amber-600 dark:text-amber-400">Sắp hết hạn (30 ngày)</p>
          <p class="text-2xl font-bold mt-1 text-amber-700 dark:text-amber-300">{{ stats.expiring_soon ?? 0 }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-2 sm:flex sm:flex-wrap xl:flex-nowrap gap-2 items-center">
        <!-- Search: full width on mobile -->
        <div class="col-span-2 sm:flex-1 sm:min-w-[180px] relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
          </svg>
          <input
            v-model="filters.search"
            @input="debouncedLoad"
            type="text"
            placeholder="Tìm theo số HĐ, tiêu đề, khách hàng..."
            class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <!-- Contract type: half on mobile -->
        <select
          v-model="filters.contract_type"
          @change="loadContracts"
          class="w-full sm:w-auto sm:shrink-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Tất cả loại</option>
          <option value="service">Dịch vụ</option>
          <option value="economic">Kinh tế</option>
          <option value="other">Khác</option>
        </select>
        <!-- Date period: half on mobile -->
        <select
          v-model="dateReportType"
          class="w-full sm:w-auto sm:shrink-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          @change="onDateReportTypeChange"
        >
          <option value="">{{ t('reports.filters.types.all') }}</option>
          <option value="week">{{ t('reports.filters.types.week') }}</option>
          <option value="month">{{ t('reports.filters.types.month') }}</option>
          <option value="year">{{ t('reports.filters.types.year') }}</option>
          <option value="custom">{{ t('reports.filters.types.custom') }}</option>
        </select>
        <!-- Date pickers: visible only when period selected -->
        <template v-if="dateReportType">
          <flat-pickr
            v-model="dateRange.from"
            :config="datePickerConfig"
            :disabled="!dateReportType"
            class="w-full sm:w-[8.5rem] sm:shrink-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            :placeholder="t('reports.filters.placeholders.fromDate')"
          />
          <flat-pickr
            v-model="dateRange.to"
            :config="datePickerConfig"
            :disabled="!dateReportType"
            class="w-full sm:w-[8.5rem] sm:shrink-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            :placeholder="t('reports.filters.placeholders.toDate')"
          />
          <button
            type="button"
            :disabled="!dateReportType"
            class="w-full sm:w-auto sm:shrink-0 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            @click="applyDateFilter"
          >
            {{ t('reports.filters.apply') }}
          </button>
          <button
            v-if="dateFilterActive"
            type="button"
            class="w-full sm:w-auto sm:shrink-0 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            @click="clearDateFilter"
          >
            {{ t('dashboard.filters.clear') }}
          </button>
        </template>
      </div>

      <!-- Error -->
      <div v-if="error" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
        <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Loading -->
      <div v-if="loading && contracts.length === 0" class="flex justify-center py-12">
        <div class="text-gray-500 dark:text-gray-400 text-sm">Đang tải dữ liệu...</div>
      </div>

      <!-- Table -->
      <div v-else class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Số HĐ</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Khách hàng</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Người liên hệ</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell whitespace-nowrap w-[5.5rem]">Loại</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden lg:table-cell">Ngày ký HĐ</th>
                <th v-if="canViewContractFinance" class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase hidden lg:table-cell">Giá trị</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Thanh toán</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr
                v-for="c in contracts"
                :key="c.id"
                @click="router.push(`/contracts/${c.id}`)"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer"
              >
                <td class="px-4 py-3 font-mono text-blue-600 dark:text-blue-400 font-medium">{{ c.contract_number }}</td>
                <td class="px-4 py-3">
                  <p class="font-medium text-gray-900 dark:text-white line-clamp-1">{{ c.customer_name }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 sm:hidden">{{ (c as any).customer_contact || '—' }}</p>
                </td>
                <td class="px-4 py-3 hidden sm:table-cell text-gray-700 dark:text-gray-300">{{ (c as any).customer_contact || '—' }}</td>
                <td class="px-4 py-3 hidden md:table-cell whitespace-nowrap">
                  <span :class="typeClass(c.contract_type)" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                    {{ typeLabel(c.contract_type) }}
                  </span>
                </td>
                <td class="px-4 py-3 hidden lg:table-cell text-gray-600 dark:text-gray-400 text-xs">
                  {{ c.signed_date ? formatDate(c.signed_date) : '—' }}
                </td>
                <td v-if="canViewContractFinance" class="px-4 py-3 hidden lg:table-cell text-right font-medium text-gray-900 dark:text-white">
                  {{ formatCurrency(c.value) }}
                </td>
                <td class="px-4 py-3 text-center">
                  <span :class="paymentStatusClass(isContractPaid(c))" class="px-2 py-0.5 rounded-full text-xs font-medium">
                    {{ getPaymentStatusLabel(c) }}
                  </span>
                </td>
              </tr>
              <tr v-if="!loading && contracts.length === 0">
                <td :colspan="tableColSpan" class="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                  Không có hợp đồng nào
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="total > filters.limit" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-600">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Hiển thị {{ (filters.page - 1) * filters.limit + 1 }}–{{ Math.min(filters.page * filters.limit, total) }} / {{ total }} hợp đồng
          </p>
          <div class="flex gap-2">
            <button
              @click="filters.page--; loadContracts()"
              :disabled="filters.page <= 1"
              class="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
            >Trước</button>
            <button
              @click="filters.page++; loadContracts()"
              :disabled="filters.page * filters.limit >= total"
              class="px-3 py-1 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700"
            >Sau</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <teleport to="body">
      <div v-if="showModal" class="fixed inset-0 z-[100000] flex items-start justify-center pt-20 px-4 pb-4 lg:pl-[290px] bg-black/50 overflow-y-auto">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">
              {{ editingContract ? 'Chỉnh sửa hợp đồng' : 'Tạo hợp đồng mới' }}
            </h2>
            <button @click="showModal = false" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg class="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form @submit.prevent="saveContract" class="p-6 space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Customer -->
              <div class="sm:col-span-2">
                <div class="flex items-center justify-between mb-1">
                  <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Khách hàng <span class="text-red-500">*</span>
                  </label>
                  <router-link
                    :to="{ path: '/customers', query: { new: '1' } }"
                    target="_blank"
                    class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + Công ty mới
                  </router-link>
                </div>

                <!-- Chọn khách hàng có sẵn (search + autocomplete) -->
                <div class="relative customer-search-wrapper">
                  <!-- Đã chọn -->
                  <div v-if="form.customer_id" class="flex items-center gap-2 px-3 py-2 border border-blue-400 dark:border-blue-500 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <svg class="h-4 w-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    <span class="text-sm font-medium text-gray-900 dark:text-white flex-1">{{ selectedCustomerName }}</span>
                    <button type="button" @click="clearCustomer" class="text-gray-400 hover:text-red-500 transition-colors">
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>

                  <!-- Search input -->
                  <div v-else>
                    <div class="relative">
                      <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
                      </svg>
                      <input
                        v-model="customerSearch"
                        @input="onCustomerSearch"
                        @focus="showCustomerDropdown = true"
                        type="text"
                        placeholder="Tìm tên công ty, email, SĐT..."
                        class="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <!-- Dropdown kết quả -->
                    <div
                      v-if="showCustomerDropdown && filteredCustomerOptions.length"
                      class="absolute z-20 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-48 overflow-y-auto"
                    >
                      <button
                        v-for="cust in filteredCustomerOptions"
                        :key="cust.id"
                        type="button"
                        @click="selectCustomer(cust)"
                        class="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <div class="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span class="text-xs font-bold text-blue-600 dark:text-blue-400">{{ cust.name.charAt(0).toUpperCase() }}</span>
                        </div>
                        <div class="min-w-0">
                          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ cust.name }}</p>
                          <p v-if="cust.phone || cust.email" class="text-xs text-gray-400 dark:text-gray-500 truncate">
                            {{ cust.phone }}{{ cust.phone && cust.email ? ' · ' : '' }}{{ cust.email }}
                          </p>
                        </div>
                      </button>
                      <div v-if="filteredCustomerOptions.length === 0 && customerSearch" class="px-4 py-3 text-sm text-gray-400 text-center">
                        Không tìm thấy khách hàng
                      </div>
                    </div>
                    <div v-if="!form.customer_id" class="mt-1 text-xs text-red-400 hidden peer-invalid:block">Vui lòng chọn khách hàng</div>
                  </div>
                </div>
              </div>

              <!-- Số HĐ / Loại -->
              <div class="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Contract number -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số HĐ <span class="text-red-500">*</span></label>
                  <input v-model="form.contract_number" required type="text" placeholder="Nhập số hợp đồng" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>

                <!-- Type -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loại hợp đồng</label>
                  <select v-model="form.contract_type" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="service">Dịch vụ</option>
                    <option value="economic">Kinh tế</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
              </div>

              <!-- Ngày ký hợp đồng — chỉ khi chỉnh sửa -->
              <template v-if="editingContract">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ngày ký hợp đồng</label>
                  <flat-pickr v-model="form.signed_date" :config="datePickerConfig" placeholder="dd/mm/yyyy" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </template>

            </div>

            <!-- Nội dung hợp đồng (hạng mục) — chỉ kế toán/admin -->
            <div v-if="canViewContractFinance" class="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
              <div class="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                  </svg>
                  Nội dung hợp đồng
                  <span class="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full">{{ form.items.length }}</span>
                </h3>
                <button
                  type="button"
                  @click="addItemRow"
                  class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Thêm hạng mục
                </button>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full text-sm min-w-[680px]">
                  <thead>
                    <tr class="bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                      <th class="px-3 py-2 text-center w-10">STT</th>
                      <th class="px-3 py-2 text-left">Hạng mục</th>
                      <th class="px-3 py-2 text-center w-20">ĐVT</th>
                      <th class="px-3 py-2 text-right w-20">Số lượng</th>
                      <th class="px-3 py-2 text-right w-32">Đơn giá</th>
                      <th class="px-3 py-2 text-right w-32">Thành tiền</th>
                      <th class="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                    <tr v-if="!form.items.length">
                      <td colspan="7" class="px-3 py-4 text-center text-gray-400 text-xs">Chưa có hạng mục. Bấm "Thêm hạng mục" để thêm.</td>
                    </tr>
                    <tr v-for="(it, idx) in form.items" :key="idx">
                      <td class="px-3 py-2 text-center text-gray-500">{{ idx + 1 }}</td>
                      <td class="px-2 py-1.5">
                        <textarea
                          v-model="it.description"
                          rows="3"
                          placeholder="VD: Sửa chữa main board SG110CX
- Dịch vụ giám sát..."
                          class="w-full min-h-[4.5rem] px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y whitespace-pre-wrap"
                        />
                      </td>
                      <td class="px-2 py-1.5">
                        <input v-model="it.unit" type="text" placeholder="Cái" class="w-full px-2 py-1.5 text-sm text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </td>
                      <td class="px-2 py-1.5">
                        <input v-model.number="it.quantity" type="number" min="0" step="1" class="w-full px-2 py-1.5 text-sm text-right border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </td>
                      <td class="px-2 py-1.5">
                        <input v-model.number="it.unit_price" type="number" min="0" step="1000" class="w-full px-2 py-1.5 text-sm text-right border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </td>
                      <td class="px-3 py-2 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">{{ formatCurrency(lineAmount(it)) }}</td>
                      <td class="px-2 py-2 text-center">
                        <button type="button" @click="removeItemRow(idx)" class="text-gray-400 hover:text-red-500 transition-colors">
                          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Tổng kết -->
              <div class="border-t border-gray-200 dark:border-gray-600 px-4 py-3 bg-gray-50 dark:bg-gray-700/30">
                <div class="ml-auto w-full sm:w-80 space-y-1.5 text-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Tổng cộng:</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(itemsSubtotal) }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      Thuế GTGT (
                      <input v-model.number="form.vat_rate" type="number" min="0" max="100" step="1" class="w-12 px-1 py-0.5 text-center text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      %):
                    </span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(itemsVat) }}</span>
                  </div>
                  <div class="flex items-center justify-between pt-1.5 border-t border-gray-200 dark:border-gray-600">
                    <span class="font-semibold text-gray-900 dark:text-white">Tổng cộng thanh toán:</span>
                    <span class="font-bold text-blue-600 dark:text-blue-400">{{ formatCurrency(itemsTotal) }}</span>
                  </div>
                  <p class="text-xs italic text-gray-500 dark:text-gray-400 pt-1">Bằng chữ: {{ itemsTotalInWords }}</p>
                </div>
              </div>
            </div>

            <!-- Thời gian giao hàng & bảo hành -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian giao hàng (ngày)</label>
                <input
                  v-model.number="form.delivery_days"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="7"
                  class="w-full max-w-[8rem] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thời gian bảo hành (tháng)</label>
                <input
                  v-model.number="form.warranty_months"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="12"
                  class="w-full max-w-[8rem] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <!-- Ghi chú nội bộ (chỉ nhân viên) -->
            <div v-if="isStaff">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ghi chú nội bộ
                <span class="text-xs font-normal text-gray-400">(chỉ nhân viên xem được)</span>
              </label>
              <textarea v-model="form.notes" rows="2" placeholder="Ghi chú nội bộ..." class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"></textarea>
            </div>

            <!-- Danh sách thiết bị liên kết -->
            <div class="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
              <div class="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V9l-6-6zM9 3v6h6"/>
                  </svg>
                  Thiết bị liên kết
                  <span class="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full">{{ form.existing_devices.length + form.new_devices.length }}</span>
                </h3>
                <button
                  type="button"
                  @click="addDeviceRow"
                  class="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                >
                  <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  {{ t('contractList.linkedDevices.addDevice') }}
                </button>
              </div>

              <!-- Header cột -->
              <div v-if="form.existing_devices.length || form.new_devices.length" :class="['grid gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700', DEVICE_GRID]">
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('contractList.linkedDevices.manufacturer') }}</span>
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('contractList.linkedDevices.model') }} <span class="text-red-400">*</span></span>
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('contractList.linkedDevices.serialNumber') }} <span class="text-red-400">*</span></span>
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('contractList.linkedDevices.project') }}</span>
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('contractList.linkedDevices.warrantyStart') }}</span>
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('contractList.linkedDevices.warrantyMonths') }}</span>
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('contractList.linkedDevices.notes') }}</span>
                <span></span>
              </div>

              <!-- Rows -->
              <div class="divide-y divide-gray-100 dark:divide-gray-700 max-h-72 overflow-y-auto">
                <!-- Thiết bị đã liên kết (chỉnh sửa được) -->
                <div
                  v-for="(dev, idx) in form.existing_devices"
                  :key="'ex-' + dev.id"
                  :class="['grid gap-2 px-4 py-2.5 items-center', DEVICE_GRID]"
                >
                  <input
                    v-model="dev.manufacturer"
                    type="text"
                    list="manufacturer-options"
                    :placeholder="t('contractList.linkedDevices.manufacturer')"
                    class="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full min-w-0"
                  />
                  <input
                    v-model="dev.model"
                    type="text"
                    placeholder="VD: MAX-10K"
                    required
                    class="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full min-w-0"
                  />
                  <input
                    v-model="dev.serial_number"
                    type="text"
                    placeholder="VD: SN20250001"
                    required
                    class="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full min-w-0 font-mono"
                  />
                  <input
                    v-model="dev.project_name"
                    type="text"
                    placeholder="VD: NMT 500kWp"
                    class="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full min-w-0"
                  />
                  <input
                    v-model="dev.warranty_start_date"
                    type="text"
                    inputmode="numeric"
                    placeholder="dd/mm/yyyy"
                    class="w-full min-w-0 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <input
                    v-model.number="dev.warranty_months"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="12"
                    class="px-2.5 py-1.5 text-sm text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full min-w-0"
                  />
                  <input
                    v-model="dev.notes"
                    type="text"
                    :placeholder="t('contractList.linkedDevices.notes')"
                    class="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full min-w-0"
                  />
                  <div class="flex items-center justify-end gap-0.5">
                    <button
                      type="button"
                      @click="duplicateExistingDevice(idx)"
                      class="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                      :title="t('contractList.linkedDevices.duplicate')"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      @click="removeExistingDevice(idx)"
                      class="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      :title="t('contractList.linkedDevices.unlink')"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Thiết bị mới thêm -->
                <div
                  v-for="(dev, idx) in form.new_devices"
                  :key="'new-' + idx"
                  :class="['grid gap-2 px-4 py-2.5 items-center', DEVICE_GRID]"
                >
                  <input
                    v-model="dev.manufacturer"
                    type="text"
                    list="manufacturer-options"
                    :placeholder="t('contractList.linkedDevices.manufacturer')"
                    class="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full min-w-0"
                  />
                  <input
                    v-model="dev.model"
                    type="text"
                    placeholder="VD: MAX-10K"
                    required
                    class="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full min-w-0"
                  />
                  <input
                    v-model="dev.serial_number"
                    type="text"
                    placeholder="VD: SN20250001"
                    required
                    class="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full min-w-0 font-mono"
                  />
                  <input
                    v-model="dev.project_name"
                    type="text"
                    placeholder="VD: NMT 500kWp"
                    class="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full min-w-0"
                  />
                  <input
                    v-model="dev.warranty_start_date"
                    type="text"
                    inputmode="numeric"
                    placeholder="dd/mm/yyyy"
                    class="w-full min-w-0 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <input
                    v-model.number="dev.warranty_months"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="12"
                    class="px-2.5 py-1.5 text-sm text-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full min-w-0"
                  />
                  <input
                    v-model="dev.notes"
                    type="text"
                    :placeholder="t('contractList.linkedDevices.notes')"
                    class="px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full min-w-0"
                  />
                  <div class="flex items-center justify-end gap-0.5">
                    <button
                      type="button"
                      @click="duplicateNewDeviceRow(idx)"
                      class="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                      :title="t('contractList.linkedDevices.duplicate')"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                      </svg>
                    </button>
                    <button
                      type="button"
                      @click="removeDeviceRow(idx)"
                      class="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      :title="t('contractList.linkedDevices.remove')"
                    >
                      <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <!-- Empty state -->
                <div v-if="!form.existing_devices.length && !form.new_devices.length" class="px-4 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
                  {{ t('contractList.linkedDevices.empty', { action: t('contractList.linkedDevices.addDevice') }) }}
                </div>
              </div>
            </div>

            <!-- Danh sách hãng gợi ý cho thiết bị -->
            <datalist id="manufacturer-options">
              <option v-for="m in MANUFACTURER_OPTIONS" :key="m" :value="m" />
            </datalist>

            <!-- Form error -->
            <div v-if="formError" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p class="text-sm text-red-700 dark:text-red-300">{{ formError }}</p>
            </div>

            <div class="flex gap-3 justify-end pt-2">
              <button type="button" @click="showModal = false" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Hủy
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-2"
              >
                <span v-if="saving" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                {{ saving ? 'Đang lưu...' : (editingContract ? 'Cập nhật' : 'Tạo mới') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </teleport>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { contractService, type Contract } from '@/services/contractService'
import { getApiBaseUrl } from '@/utils/apiUrl'
import { amountToVietnameseWords } from '@/utils/numberToWords'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { useFlatpickrConfig } from '@/composables/useFlatpickr'
import { useAuth, UserRole } from '@/composables/useAuth'
import { isContractPaid, getPaymentStatusLabel, paymentStatusClass } from '@/utils/contractPaperwork'
import { getVietnamWeekRange, getVietnamFullMonthRange, getVietnamYearRange, formatIsoToDdMmYyyy, parseDdMmYyyyToIso } from '@/utils/dateTime'
import { useToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'

const DEVICE_GRID = 'grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_9rem_5rem_minmax(0,1fr)_4.5rem]'

const router = useRouter()
const route = useRoute()
const { getUserRole, canViewContractFinance, canManageContracts } = useAuth()
const { t } = useI18n()
const { showSuccess } = useToast()
const isStaff = computed(() => getUserRole.value !== UserRole.END_USER)
const tableColSpan = computed(() => (canViewContractFinance.value ? 7 : 6))

const { dateConfig } = useFlatpickrConfig()
const datePickerConfig = dateConfig

const contracts = ref<Contract[]>([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const showModal = ref(false)
const saving = ref(false)
const formError = ref('')
const editingContract = ref<Contract | null>(null)
const stats = ref({ total: 0, draft: 0, active: 0, expired: 0, cancelled: 0, expiring_soon: 0, active_unpaid: 0 })
const customers = ref<{ id: number; name: string; phone?: string; email?: string }[]>([])
const availableInverters = ref<{ id: number; serial_number: string; model: string; manufacturer: string; power_rating?: string; status: string }[]>([])
const loadingInverters = ref(false)

// Customer search
const customerSearch = ref('')
const showCustomerDropdown = ref(false)
const filteredCustomerOptions = ref<{ id: number; name: string; phone?: string; email?: string }[]>([])
const selectedCustomerName = ref('')

const filters = reactive({
  search: '',
  contract_type: '',
  unpaid: false,
  page: 1,
  limit: 20,
})

type DateReportType = '' | 'week' | 'month' | 'year' | 'custom'
const dateReportType = ref<DateReportType>('')
const dateRange = reactive({ from: '', to: '' })
const appliedDateRange = reactive({ from: '', to: '' })

const dateFilterActive = computed(() => Boolean(appliedDateRange.from && appliedDateRange.to))

const initializeDateRange = () => {
  switch (dateReportType.value) {
    case 'week':
      Object.assign(dateRange, getVietnamWeekRange())
      break
    case 'month':
      Object.assign(dateRange, getVietnamFullMonthRange())
      break
    case 'year':
      Object.assign(dateRange, getVietnamYearRange())
      break
    case 'custom':
      if (!dateRange.from || !dateRange.to) {
        Object.assign(dateRange, getVietnamYearRange())
      }
      return
    default:
      dateRange.from = ''
      dateRange.to = ''
  }
}

const onDateReportTypeChange = () => {
  if (!dateReportType.value) {
    clearDateFilter()
    return
  }
  if (dateReportType.value !== 'custom') {
    initializeDateRange()
    applyDateFilter()
  } else {
    initializeDateRange()
  }
}

const applyDateFilter = () => {
  if (!dateReportType.value || !dateRange.from || !dateRange.to) return
  appliedDateRange.from = dateRange.from
  appliedDateRange.to = dateRange.to
  filters.page = 1
  loadContracts()
}

const clearDateFilter = () => {
  dateReportType.value = ''
  dateRange.from = ''
  dateRange.to = ''
  appliedDateRange.from = ''
  appliedDateRange.to = ''
  filters.page = 1
  loadContracts()
}

watch([() => dateRange.from, () => dateRange.to], () => {
  if (!dateReportType.value) return
  if (dateReportType.value !== 'custom') return
  if (dateRange.from && dateRange.to) {
    const fromDate = new Date(`${dateRange.from}T00:00:00`)
    const toDate = new Date(`${dateRange.to}T00:00:00`)
    if (fromDate > toDate) {
      const temp = dateRange.from
      dateRange.from = dateRange.to
      dateRange.to = temp
    }
  }
})

interface NewDevice {
  manufacturer: string
  model: string
  serial_number: string
  project_name: string
  warranty_start_date: string
  warranty_months: number
  notes: string
}

interface ExistingDevice {
  id: number
  manufacturer: string
  model: string
  serial_number: string
  project_name: string
  warranty_start_date: string
  warranty_months: number
  notes: string
}

interface ContractItem {
  description: string
  unit: string
  quantity: number
  unit_price: number
}

const MANUFACTURER_OPTIONS = ['Sungrow', 'Huawei', 'Growatt', 'GoodWe', 'Solis', 'SMA']

const DEFAULT_DELIVERY_DAYS = 7
const DEFAULT_WARRANTY_MONTHS = 12

const emptyForm = () => ({
  customer_id: '' as any,
  contract_number: '',
  title: '',
  contract_type: 'service' as Contract['contract_type'],
  start_date: '',
  end_date: '',
  value: 0,
  vat_rate: 8,
  status: 'draft' as Contract['status'],
  description: '',
  notes: '',
  delivery_days: DEFAULT_DELIVERY_DAYS,
  warranty_months: DEFAULT_WARRANTY_MONTHS,
  signed_date: '',
  items: [] as ContractItem[],
  inverter_ids: [] as number[],
  existing_devices: [] as ExistingDevice[],
  new_devices: [] as NewDevice[],
})

const form = reactive(emptyForm())

const itemsSubtotal = computed(() =>
  form.items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0)
)
const itemsVat = computed(() => Math.round(itemsSubtotal.value * (Number(form.vat_rate) || 0) / 100))
const itemsTotal = computed(() => itemsSubtotal.value + itemsVat.value)
const itemsTotalInWords = computed(() => amountToVietnameseWords(itemsTotal.value))

watch(itemsTotal, (v) => {
  if (canViewContractFinance.value) form.value = v
})

function addItemRow() {
  form.items.push({ description: '', unit: '', quantity: 1, unit_price: 0 })
}
function removeItemRow(idx: number) {
  form.items.splice(idx, 1)
}
function lineAmount(it: ContractItem) {
  return (Number(it.quantity) || 0) * (Number(it.unit_price) || 0)
}

let debounceTimer: ReturnType<typeof setTimeout>
const debouncedLoad = () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => { filters.page = 1; loadContracts() }, 400)
}

async function loadContracts() {
  loading.value = true
  error.value = ''
  try {
    const res = await contractService.list({
      contract_type: filters.contract_type || undefined,
      search: filters.search || undefined,
      unpaid: filters.unpaid || undefined,
      from: appliedDateRange.from || undefined,
      to: appliedDateRange.to || undefined,
      page: filters.page,
      limit: filters.limit,
    })
    contracts.value = res.contracts
    total.value = res.total
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function toggleActiveUnpaidFilter() {
  filters.unpaid = !filters.unpaid
  filters.page = 1
  loadContracts()
}

async function loadStats() {
  try {
    stats.value = await contractService.stats()
  } catch {}
}

async function loadCustomers() {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${getApiBaseUrl()}/api/customers?limit=500`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    customers.value = (data.customers || data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
    }))
  } catch {}
}

function onCustomerSearch() {
  const q = customerSearch.value.toLowerCase().trim()
  if (!q) {
    filteredCustomerOptions.value = customers.value.slice(0, 20)
  } else {
    filteredCustomerOptions.value = customers.value
      .filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
      )
      .slice(0, 20)
  }
  showCustomerDropdown.value = true
}

function selectCustomer(cust: { id: number; name: string }) {
  form.customer_id = cust.id
  selectedCustomerName.value = cust.name
  customerSearch.value = ''
  showCustomerDropdown.value = false
  loadAvailableInverters(cust.id)
}

function clearCustomer() {
  form.customer_id = ''
  selectedCustomerName.value = ''
  customerSearch.value = ''
  form.inverter_ids = []
  availableInverters.value = []
}

async function loadAvailableInverters(customerId: number | string) {
  if (!customerId) { availableInverters.value = []; return }
  loadingInverters.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${getApiBaseUrl()}/api/contracts/customer-inverters?customer_id=${customerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    availableInverters.value = await res.json()
  } catch {
    availableInverters.value = []
  } finally {
    loadingInverters.value = false
  }
}

watch(() => form.customer_id, (newId) => {
  form.inverter_ids = []
  loadAvailableInverters(newId)
})

function toggleInverter(id: number) {
  const idx = form.inverter_ids.indexOf(id)
  if (idx === -1) form.inverter_ids.push(id)
  else form.inverter_ids.splice(idx, 1)
}

function computeWarrantyEnd(startDateIso: string, months: number): string | undefined {
  if (!startDateIso?.trim() || months <= 0) return undefined
  const parts = startDateIso.slice(0, 10).split('-').map(Number)
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return undefined
  const end = new Date(parts[0], parts[1] - 1, parts[2])
  end.setMonth(end.getMonth() + months)
  return end.toISOString().slice(0, 10)
}

function createEmptyDevice(): NewDevice {
  return {
    manufacturer: '',
    model: '',
    serial_number: '',
    project_name: '',
    warranty_start_date: '',
    warranty_months: Number(form.warranty_months) || DEFAULT_WARRANTY_MONTHS,
    notes: '',
  }
}

function addDeviceRow() {
  form.new_devices.push(createEmptyDevice())
}

function removeDeviceRow(idx: number) {
  form.new_devices.splice(idx, 1)
}

function duplicateNewDeviceRow(idx: number) {
  const src = form.new_devices[idx]
  if (!src) return
  form.new_devices.splice(idx + 1, 0, {
    ...src,
    serial_number: '',
  })
}

function duplicateExistingDevice(idx: number) {
  const src = form.existing_devices[idx]
  if (!src) return
  form.new_devices.push({
    manufacturer: src.manufacturer,
    model: src.model,
    serial_number: '',
    project_name: src.project_name,
    warranty_start_date: src.warranty_start_date || '',
    warranty_months: src.warranty_months,
    notes: src.notes,
  })
}

function openCreate() {
  editingContract.value = null
  Object.assign(form, emptyForm())
  formError.value = ''
  customerSearch.value = ''
  selectedCustomerName.value = ''
  showModal.value = true
  filteredCustomerOptions.value = customers.value.slice(0, 20)
}

async function openEdit(c: Contract) {
  editingContract.value = c
  Object.assign(form, {
    customer_id: c.customer_id,
    contract_number: (c as any).contract_number ?? '',
    title: c.title,
    contract_type: c.contract_type,
    start_date: c.start_date?.slice(0, 10) ?? '',
    end_date: c.end_date?.slice(0, 10) ?? '',
    value: c.value,
    vat_rate: (c as any).vat_rate ?? 8,
    status: c.status,
    description: c.description ?? '',
    notes: c.notes ?? '',
    delivery_days: Number((c as any).delivery_days) || DEFAULT_DELIVERY_DAYS,
    warranty_months: Number((c as any).warranty_months) || DEFAULT_WARRANTY_MONTHS,
    signed_date: c.signed_date?.slice(0, 10) ?? '',
    items: Array.isArray((c as any).items)
      ? (c as any).items.map((it: any) => ({
          description: it.description ?? '',
          unit: it.unit ?? '',
          quantity: Number(it.quantity) || 0,
          unit_price: Number(it.unit_price) || 0,
        }))
      : [],
    inverter_ids: [],
    existing_devices: [],
    new_devices: [],
  })
  formError.value = ''
  showModal.value = true
  // Load thiết bị của khách hàng và pre-select
  await loadAvailableInverters(c.customer_id)
  try {
    const detail = await contractService.get(c.id)
    const invs = (detail as any).inverters ?? []
    form.inverter_ids = invs.map((i: any) => i.id)
    form.delivery_days = Number((detail as any).delivery_days) || DEFAULT_DELIVERY_DAYS
    form.warranty_months = Number((detail as any).warranty_months) || DEFAULT_WARRANTY_MONTHS
    form.existing_devices = invs.map((i: any) => ({
      id: i.id,
      manufacturer: i.manufacturer ?? '',
      model: i.model ?? '',
      serial_number: i.serial_number ?? '',
      project_name: i.project_name ?? '',
      warranty_start_date: i.warranty_start_date ? formatIsoToDdMmYyyy(String(i.warranty_start_date).slice(0, 10)) : '',
      warranty_months: Number(i.warranty_months) || 0,
      notes: i.notes ?? '',
    }))
  } catch {}
}

function removeExistingDevice(idx: number) {
  const dev = form.existing_devices[idx]
  if (dev) {
    const i = form.inverter_ids.indexOf(dev.id)
    if (i !== -1) form.inverter_ids.splice(i, 1)
  }
  form.existing_devices.splice(idx, 1)
}

async function saveContract() {
  saving.value = true
  formError.value = ''
  const isCreate = !editingContract.value
  try {
    // Validate devices
    for (const d of [...form.existing_devices, ...form.new_devices]) {
      if (!d.model.trim() || !d.serial_number.trim()) {
        formError.value = 'Vui lòng nhập đầy đủ Model và Số SN cho tất cả thiết bị'
        saving.value = false
        return
      }
    }

    if (!form.customer_id) {
      formError.value = 'Vui lòng chọn khách hàng'
      saving.value = false
      return
    }

    if (!form.contract_number.trim()) {
      formError.value = 'Vui lòng nhập số hợp đồng'
      saving.value = false
      return
    }

    // Dùng số hợp đồng làm tiêu đề khi chưa có tiêu đề riêng
    if (!form.title.trim()) form.title = form.contract_number.trim()

    let contractId: number

    if (editingContract.value) {
      // Lưu chỉnh sửa các thiết bị đã liên kết trước (để hợp đồng đồng bộ BH theo số tháng mới)
      const token = localStorage.getItem('token')
      for (const d of form.existing_devices) {
        const months = Number(d.warranty_months) || 0
        const startDate = parseDdMmYyyyToIso(d.warranty_start_date) || ''
        const warrantyEnd = startDate ? computeWarrantyEnd(startDate, months) : undefined
        try {
          await fetch(`${getApiBaseUrl()}/api/inverters/${d.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              serial_number: d.serial_number.trim(),
              model: d.model.trim(),
              manufacturer: d.manufacturer.trim() || undefined,
              project_name: d.project_name.trim() || undefined,
              notes: d.notes.trim() || undefined,
              warranty_months: months || undefined,
              warranty_start_date: startDate || null,
              warranty_end_date: startDate && months > 0 ? warrantyEnd : null,
            }),
          })
        } catch {}
      }
      const updated = await contractService.update(editingContract.value.id, form)
      contractId = (updated as any).id ?? editingContract.value.id
    } else {
      const created = await contractService.create(form)
      contractId = (created as any).id
    }

    // Tạo thiết bị mới và liên kết vào hợp đồng
    if (form.new_devices.length && contractId) {
      const token = localStorage.getItem('token')
      const newInverterIds: number[] = []

      for (const d of form.new_devices) {
        const months = Number(d.warranty_months) || 0
        const startDate = parseDdMmYyyyToIso(d.warranty_start_date) || ''
        let warrantyStart: string | undefined
        let warrantyEnd: string | undefined
        if (startDate) {
          warrantyStart = startDate
          if (months > 0) warrantyEnd = computeWarrantyEnd(startDate, months)
        }
        try {
          const res = await fetch(`${getApiBaseUrl()}/api/inverters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
              serial_number: d.serial_number.trim(),
              model: d.model.trim(),
              manufacturer: d.manufacturer.trim() || undefined,
              project_name: d.project_name.trim() || undefined,
              notes: d.notes.trim() || undefined,
              customer_id: form.customer_id,
              warranty_months: months || undefined,
              warranty_start_date: warrantyStart,
              warranty_end_date: warrantyEnd,
              status: 'active',
            }),
          })
          if (res.ok) {
            const inv = await res.json()
            if (inv?.id) newInverterIds.push(inv.id)
          }
        } catch {}
      }

      // Link all new inverters to contract
      if (newInverterIds.length) {
        await fetch(`${getApiBaseUrl()}/api/contracts/${contractId}/inverters`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ inverter_ids: [...form.inverter_ids, ...newInverterIds] }),
        })
      }
    }

    showModal.value = false
    showSuccess(
      editingContract.value
        ? t('common.messages.contractUpdated')
        : t('common.messages.contractCreated')
    )
    await Promise.all([loadContracts(), loadStats()])
    if (isCreate && contractId) {
      router.push(`/contracts/${contractId}`)
    }
  } catch (e: any) {
    formError.value = e.message
  } finally {
    saving.value = false
  }
}

function typeLabel(t: string) {
  const map: Record<string, string> = {
    service: 'Dịch vụ',
    economic: 'Kinh tế',
    other: 'Khác',
  }
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

function formatDate(d?: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN')
}

function formatCurrency(v: number) {
  if (!v) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v)
}

onMounted(async () => {
  loadContracts()
  loadStats()
  loadCustomers()
  document.addEventListener('click', (e) => {
    if (!(e.target as Element)?.closest('.customer-search-wrapper')) {
      showCustomerDropdown.value = false
    }
  })

  // Mở sẵn form chỉnh sửa khi điều hướng từ trang chi tiết (?edit=<id>)
  const editId = route.query.edit
  if (editId) {
    try {
      const c = await contractService.get(Number(editId))
      await openEdit(c as any)
    } catch {}
    router.replace({ query: {} })
  }
})
</script>

<style>
/* Đảm bảo lịch flatpickr hiển thị phía trên modal (z-[100000]) */
.flatpickr-calendar {
  z-index: 100001 !important;
}
</style>

