<template>
  <admin-layout>
    <div class="px-4 sm:px-0 space-y-4 sm:space-y-6 overflow-x-hidden max-w-full">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 min-w-0">
        <div class="min-w-0">
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('customers.list.header.title') }}
          </h1>
          <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            {{ t('customers.list.header.subtitle') }}
          </p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Bulk delete (dev only) -->
          <button
            v-if="isDev && selectedIds.length > 0"
            @click="showBulkDeleteConfirm = true"
            class="flex items-center gap-2 px-4 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            Xóa {{ selectedIds.length }} khách hàng
          </button>
          <button
            @click="showAddModal = true"
            class="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors whitespace-nowrap touch-manipulation min-h-[44px] sm:min-h-0"
          >
            <PlusIcon class="h-5 w-5" />
            <span>{{ t('customers.list.actions.addNew') }}</span>
          </button>
        </div>
      </div>

      <!-- Stats Card -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Tổng khách hàng</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ stats.totalCustomers }}</p>
          </div>
          <UserCircleIcon class="h-10 w-10 text-blue-500 flex-shrink-0" />
        </div>
        <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Hợp đồng đang hiệu lực</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ stats.activeContracts ?? 0 }}</p>
          </div>
          <PageIcon class="h-10 w-10 text-green-500 flex-shrink-0" />
        </div>
        <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Ticket đang xử lý</p>
            <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ stats.openTickets ?? 0 }}</p>
          </div>
          <ChatIcon class="h-10 w-10 text-orange-500 flex-shrink-0" />
        </div>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <!-- Tên công ty -->
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Tên công ty..."
            class="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm bg-white dark:bg-gray-800"
          />
        </div>
        <!-- MST -->
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
          </svg>
          <input
            v-model="filters.tax_code"
            type="text"
            placeholder="Mã số thuế..."
            class="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm bg-white dark:bg-gray-800"
          />
        </div>
        <!-- Người liên hệ -->
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <input
            v-model="filters.contact"
            type="text"
            placeholder="Người liên hệ, email, SĐT..."
            class="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm bg-white dark:bg-gray-800"
          />
        </div>
      </div>

      <!-- Customers Table - Desktop View -->
      <div
        class="hidden md:block rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div class="overflow-x-auto overflow-y-auto max-h-[600px] w-full">
          <table class="w-full min-w-[820px] table-fixed">
            <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                <!-- Checkbox col (dev only) -->
                <th v-if="isDev" class="w-10 px-3 py-3 text-center">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    :indeterminate="selectedIds.length > 0 && !isAllSelected"
                    @change="toggleSelectAll"
                    class="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[32%]">Tên công ty</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[11%]">MST</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[14%]">Địa chỉ</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[12%]">Người liên hệ</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[10%]">SĐT</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[12%]">Email</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[150px]">Hành động</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <!-- Loading State -->
              <tr v-if="loading">
                <td :colspan="isDev ? 8 : 7" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  {{ t('customers.list.table.loading') }}
                </td>
              </tr>
              <!-- Error State -->
              <tr v-else-if="error">
                <td :colspan="isDev ? 8 : 7" class="px-4 py-8 text-center text-red-500 dark:text-red-400">
                  {{ error }}
                </td>
              </tr>
              <!-- Empty State -->
              <tr v-else-if="filteredCustomers.length === 0">
                <td :colspan="isDev ? 8 : 7" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  {{ t('customers.list.table.noCustomers') }}
                </td>
              </tr>
              <!-- Data Rows -->
              <tr
                v-else
                v-for="customer in paginatedCustomers"
                :key="customer.id"
                :class="['hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors', selectedIds.includes(customer.id) ? 'bg-red-50 dark:bg-red-900/10' : '']"
                @click="$router.push(`/customers/${customer.id}`)"
              >
                <!-- Checkbox (dev only) -->
                <td v-if="isDev" class="px-3 py-3 text-center" @click.stop>
                  <input
                    type="checkbox"
                    :value="customer.id"
                    v-model="selectedIds"
                    class="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                </td>
                <!-- Tên công ty -->
                <td class="px-4 py-3">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white break-words" :title="customer.name">
                    {{ customer.name }}
                  </p>
                  <p v-if="customer.organization && customer.organization !== customer.name" class="text-xs text-gray-400 dark:text-gray-500 break-words mt-0.5">
                    {{ customer.organization }}
                  </p>
                </td>
                <!-- MST -->
                <td class="px-4 py-3">
                  <span class="block text-sm font-mono text-gray-700 dark:text-gray-300 truncate" :title="customer.tax_code || customer.taxCode || ''">
                    {{ customer.tax_code || customer.taxCode || '—' }}
                  </span>
                </td>
                <!-- Địa chỉ -->
                <td class="px-4 py-3">
                  <p class="text-sm text-gray-600 dark:text-gray-400 truncate" :title="customer.address">
                    {{ customer.address || '—' }}
                  </p>
                </td>
                <!-- Người liên hệ -->
                <td class="px-4 py-3">
                  <p class="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {{ customer.contact_name || customer.contact_person || '—' }}
                  </p>
                </td>
                <!-- SĐT người liên hệ -->
                <td class="px-4 py-3">
                  <a
                    v-if="customer.contact_phone"
                    :href="`tel:${customer.contact_phone}`"
                    @click.stop
                    class="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate block"
                  >{{ customer.contact_phone }}</a>
                  <span v-else class="text-sm text-gray-400">—</span>
                </td>
                <!-- Email -->
                <td class="px-4 py-3">
                  <a
                    v-if="customer.email"
                    :href="`mailto:${customer.email}`"
                    @click.stop
                    :title="customer.email"
                    class="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate block"
                  >{{ customer.email }}</a>
                  <span v-else class="text-sm text-gray-400">—</span>
                </td>
                <!-- Hành động -->
                <td class="px-2 py-3 text-center whitespace-nowrap" @click.stop>
                  <div class="flex items-center justify-center gap-1.5">
                    <router-link
                      :to="`/customers/${customer.id}`"
                      class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 border border-blue-200 dark:border-blue-700 hover:border-blue-400 rounded-lg transition-colors"
                    >
                      Chi tiết
                    </router-link>
                    <button
                      v-if="canDelete"
                      @click.stop="deletingCustomer = customer; deleteError = ''"
                      class="inline-flex items-center px-2.5 py-1.5 text-xs font-medium text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200 border border-red-200 dark:border-red-700 hover:border-red-400 rounded-lg transition-colors"
                      title="Xóa khách hàng"
                    >
                      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div class="text-xs sm:text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
              {{ t('customers.list.pagination.showing', { 
                start: (currentPage - 1) * itemsPerPage + 1, 
                end: Math.min(currentPage * itemsPerPage, filteredCustomers.length),
                total: filteredCustomers.length 
              }) }}
            </div>
            <div class="flex flex-wrap items-center gap-2 justify-center">
              <button
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 touch-manipulation min-h-[44px] sm:min-h-0"
              >
                {{ t('customers.list.pagination.previous') }}
              </button>
              <div class="flex gap-1">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="currentPage = page"
                  :class="[
                    'px-3 py-2 text-sm rounded-lg touch-manipulation min-h-[44px] sm:min-h-0',
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 text-gray-700 dark:text-gray-300'
                  ]"
                >
                  {{ page }}
                </button>
              </div>
              <button
                @click="currentPage = Math.min(totalPages, currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 touch-manipulation min-h-[44px] sm:min-h-0"
              >
                {{ t('customers.list.pagination.next') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden space-y-3">
        <!-- Loading State -->
        <div v-if="loading" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
          {{ t('customers.list.table.loading') }}
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="rounded-lg bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 p-6 text-center text-red-500 dark:text-red-400">
          {{ error }}
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredCustomers.length === 0" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
          {{ t('customers.list.table.noCustomers') }}
        </div>

        <!-- Customer Cards -->
        <div
          v-for="customer in paginatedCustomers"
          :key="customer.id"
          @click="$router.push(`/customers/${customer.id}`)"
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm active:bg-gray-50 dark:active:bg-gray-700 cursor-pointer touch-manipulation"
        >
          <!-- Header: Name, Source Badge -->
          <div class="flex justify-between items-start mb-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-semibold text-gray-900 dark:text-white text-base truncate">
                  {{ customer.name }}
                </h3>
                <span
                  :class="[
                    'px-1.5 py-0.5 text-xs font-semibold rounded flex-shrink-0',
                    getSourceClass(customer.source || 'customer'),
                  ]"
                  :title="customer.source === 'user' ? t('customers.list.source.accountTooltip') : t('customers.list.source.customerTooltip')"
                >
                  {{ customer.source === 'user' ? '👤' : '📋' }}
                </span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ customer.email || t('common.na') }}
              </p>
            </div>
          </div>

          <!-- MST -->
          <p v-if="customer.tax_code" class="text-xs text-gray-500 dark:text-gray-400 mb-2">
            MST: <span class="font-mono text-gray-700 dark:text-gray-300">{{ customer.tax_code }}</span>
          </p>

          <!-- Địa chỉ -->
          <p v-if="customer.address" class="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{{ customer.address }}</p>

          <!-- Người liên hệ -->
          <p v-if="customer.contact_name || customer.contact_person" class="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Liên hệ: <span class="text-gray-700 dark:text-gray-300">{{ customer.contact_name || customer.contact_person }}</span>
            <span v-if="customer.contact_phone" class="ml-1">· {{ customer.contact_phone }}</span>
          </p>

          <!-- Footer -->
          <div class="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-400">{{ customer.email || '—' }}</p>
            <router-link
              :to="`/customers/${customer.id}`"
              @click.stop
              class="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-900 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 touch-manipulation min-h-[32px] flex items-center"
            >
              Xem chi tiết
            </router-link>
          </div>
        </div>

        <!-- Mobile Pagination -->
        <div v-if="totalPages > 1" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex flex-col items-center justify-between gap-3">
            <div class="text-xs text-gray-700 dark:text-gray-300 text-center">
              {{ t('customers.list.pagination.showing', { 
                start: (currentPage - 1) * itemsPerPage + 1, 
                end: Math.min(currentPage * itemsPerPage, filteredCustomers.length),
                total: filteredCustomers.length 
              }) }}
            </div>
            <div class="flex items-center gap-2 w-full">
              <button
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                class="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 touch-manipulation min-h-[44px]"
              >
                {{ t('customers.list.pagination.previous') }}
              </button>
              <div class="flex gap-1">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="currentPage = page"
                  :class="[
                    'px-3 py-2.5 text-sm rounded-lg touch-manipulation min-h-[44px]',
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 text-gray-700 dark:text-gray-300'
                  ]"
                >
                  {{ page }}
                </button>
              </div>
              <button
                @click="currentPage = Math.min(totalPages, currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 touch-manipulation min-h-[44px]"
              >
                {{ t('customers.list.pagination.next') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Delete Confirm Modal -->
      <teleport to="body">
        <div v-if="deletingCustomer" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div class="flex items-start gap-4 mb-4">
              <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <svg class="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">Xác nhận xóa khách hàng</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Bạn có chắc muốn xóa khách hàng <strong class="text-gray-900 dark:text-white">{{ deletingCustomer.name }}</strong>?
                  <br/>Hành động này không thể hoàn tác và sẽ xóa toàn bộ dữ liệu liên quan.
                </p>
              </div>
            </div>
            <div v-if="deleteError" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              {{ deleteError }}
            </div>
            <div class="flex gap-3 justify-end">
              <button
                @click="deletingCustomer = null; deleteError = ''"
                :disabled="deleting"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                @click="confirmDelete"
                :disabled="deleting"
                class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg flex items-center gap-2 transition-colors"
              >
                <span v-if="deleting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                {{ deleting ? 'Đang xóa...' : 'Xóa khách hàng' }}
              </button>
            </div>
          </div>
        </div>
      </teleport>

      <!-- Bulk Delete Confirm Modal -->
      <teleport to="body">
        <div v-if="showBulkDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div class="flex items-start gap-4 mb-4">
              <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <svg class="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">Xóa hàng loạt</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Bạn có chắc muốn xóa <strong class="text-red-600">{{ selectedIds.length }} khách hàng</strong> đã chọn?
                  <br/>Hành động này không thể hoàn tác.
                </p>
              </div>
            </div>
            <div v-if="bulkDeleteError" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              {{ bulkDeleteError }}
            </div>
            <div v-if="bulkDeleteProgress" class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-sm text-blue-700 dark:text-blue-300">
              {{ bulkDeleteProgress }}
            </div>
            <div class="flex gap-3 justify-end">
              <button @click="showBulkDeleteConfirm = false; bulkDeleteError = ''; bulkDeleteProgress = ''" :disabled="deleting" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">Hủy</button>
              <button @click="confirmBulkDelete" :disabled="deleting" class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg flex items-center gap-2 transition-colors">
                <span v-if="deleting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                {{ deleting ? 'Đang xóa...' : `Xóa ${selectedIds.length} khách hàng` }}
              </button>
            </div>
          </div>
        </div>
      </teleport>

      <!-- Add Customer Modal -->
      <div
        v-if="showAddModal"
        class="fixed inset-0 z-50 flex items-start justify-center bg-gray-700/45 dark:bg-gray-900/65 overflow-y-auto pt-4 pb-4 sm:pt-8 sm:pb-8 overflow-x-hidden p-4"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-[min(100vw-2rem,42rem)] mx-4 my-4 sm:my-8"
        >
          <div class="p-4 sm:p-6 max-h-[calc(100vh-2rem)] sm:max-h-[85vh] overflow-y-auto overflow-x-hidden">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {{ t('customers.list.modal.title') }}
              </h2>
              <button
                @click="closeAddModal"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form @submit.prevent="saveCustomer">
              <!-- Error -->
              <div v-if="addError" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p class="text-sm text-red-800 dark:text-red-200">{{ addError }}</p>
              </div>
              <!-- Success -->
              <div v-if="addSuccessMessage" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p class="text-sm text-green-800 dark:text-green-200">{{ addSuccessMessage }}</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Tên công ty -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tên công ty <span class="text-red-500">*</span></label>
                  <input v-model="customerForm.name" type="text" required placeholder="Nhập tên công ty / cá nhân" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
                </div>
                <!-- Người đại diện -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Người đại diện <span class="text-red-500">*</span></label>
                  <input v-model="customerForm.representative_name" type="text" required placeholder="Họ tên người đại diện" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
                </div>
                <!-- Chức vụ -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Chức vụ <span class="text-red-500">*</span></label>
                  <input v-model="customerForm.representative_position" type="text" required placeholder="VD: Giám đốc" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
                </div>
                <!-- Ủy nhiệm -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Ủy nhiệm
                    <span class="text-xs font-normal text-gray-400 dark:text-gray-500">(nếu người đại diện không phải là giám đốc)</span>
                  </label>
                  <input v-model="customerForm.authorization_doc" type="text" placeholder="Số / nội dung văn bản ủy quyền" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
                </div>
                <!-- MST -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mã số thuế (MST) <span class="text-red-500">*</span></label>
                  <input v-model="customerForm.tax_code" type="text" required placeholder="VD: 0123456789" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
                </div>
                <!-- Email -->
                <div>
                  <div class="flex items-center justify-between mb-1.5">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email <span class="text-red-500">*</span></label>
                    <span class="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                      <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                      Email nhận hóa đơn
                    </span>
                  </div>
                  <input v-model="customerForm.email" type="email" required placeholder="example@company.com" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
                </div>
                <!-- Địa chỉ -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Địa chỉ công ty <span class="text-red-500">*</span></label>
                  <input v-model="customerForm.address" type="text" required placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
                </div>
                <!-- Người liên hệ — nhập tay, có thể tìm để điền sẵn -->
                <div class="md:col-span-2 relative contact-search-box">
                  <div class="flex items-center justify-between mb-1.5">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Người liên hệ</label>
                    <span v-if="selectedContactId" class="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                      Đã điền từ danh bạ
                    </span>
                  </div>

                  <!-- Tìm để điền nhanh -->
                  <div class="relative mb-3">
                    <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/>
                    </svg>
                    <input
                      v-model="contactSearch"
                      @input="onContactSearch"
                      @focus="showContactDropdown = true"
                      type="text"
                      placeholder="Tìm người liên hệ có sẵn để điền nhanh..."
                      class="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    />
                    <!-- Dropdown -->
                    <div
                      v-if="showContactDropdown && contactResults.length"
                      class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-44 overflow-y-auto"
                    >
                      <button
                        v-for="u in contactResults"
                        :key="u.id"
                        type="button"
                        @click="selectContact(u)"
                        class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <div class="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                          <span class="text-xs font-bold text-blue-600 dark:text-blue-400">{{ u.name?.charAt(0)?.toUpperCase() }}</span>
                        </div>
                        <div class="min-w-0">
                          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ u.name }}</p>
                          <p class="text-xs text-gray-400 dark:text-gray-500">{{ u.email }}{{ u.phone ? ' · ' + u.phone : '' }}</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <!-- Thông tin người liên hệ (điền tay, có thể đã điền sẵn) -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Tên người liên hệ</label>
                      <input v-model="customerForm.contact_person" @input="onContactFieldEdit" type="text" placeholder="Họ tên người liên hệ" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">SĐT người liên hệ</label>
                      <input v-model="customerForm.contact_phone" @input="onContactFieldEdit" type="tel" placeholder="VD: 0901234567" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email người liên hệ</label>
                      <input v-model="customerForm.contact_email" @input="onContactFieldEdit" type="email" placeholder="email@congty.com" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
                    </div>
                    <div>
                      <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Địa chỉ người liên hệ</label>
                      <input v-model="customerForm.contact_address" @input="onContactFieldEdit" type="text" placeholder="Địa chỉ người liên hệ" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
                    </div>
                  </div>
                </div>
                <!-- Người nhận hợp đồng -->
                <div class="md:col-span-2 pt-2 mt-1 border-t border-gray-100 dark:border-gray-700">
                  <div class="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <svg class="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                      </svg>
                      Người nhận hợp đồng
                    </h3>
                    <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        v-model="recipientSameAsContact"
                        @change="toggleRecipientSameAsContact"
                        class="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      Giống người liên hệ
                    </label>
                  </div>
                  <p v-if="recipientSameAsContact && !customerForm.contact_person" class="-mt-1 mb-2 text-xs text-amber-600 dark:text-amber-400">
                    Hãy nhập/chọn người liên hệ bên trên để tự động điền thông tin người nhận.
                  </p>
                </div>
                <!-- Tên người nhận -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Người nhận</label>
                  <input v-model="customerForm.recipient_name" type="text" :readonly="recipientSameAsContact" placeholder="Họ tên người nhận hợp đồng" :class="['w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm', recipientSameAsContact ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-gray-500 dark:text-gray-400' : '']" />
                </div>
                <!-- SĐT người nhận -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">SĐT người nhận</label>
                  <input v-model="customerForm.recipient_phone" type="tel" :readonly="recipientSameAsContact" placeholder="VD: 0901234567" :class="['w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm', recipientSameAsContact ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-gray-500 dark:text-gray-400' : '']" />
                </div>
                <!-- Địa chỉ người nhận -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Địa chỉ người nhận</label>
                  <input v-model="customerForm.recipient_address" type="text" :readonly="recipientSameAsContact" placeholder="Địa chỉ nhận hợp đồng" :class="['w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm', recipientSameAsContact ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed text-gray-500 dark:text-gray-400' : '']" />
                </div>
              </div>
              <div class="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  type="button"
                  @click="closeAddModal"
                  class="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 active:bg-gray-400 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:active:bg-gray-500 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  {{ t('customers.list.modal.cancel') }}
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  {{ saving ? t('customers.list.modal.creating') : t('customers.list.modal.create') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { PlusIcon, UserCircleIcon, PageIcon, ChatIcon } from '../../../icons'
import { apiClient } from '@/services/api'
import { useAuth, UserRole } from '@/composables/useAuth'
import { useToast } from '@/composables/useToast'

const { showSuccess } = useToast()

const { t } = useI18n()
const route = useRoute()
const { getUserRole } = useAuth()
const canDelete = computed(() =>
  getUserRole.value === UserRole.ADMIN || getUserRole.value === UserRole.DEV
)
const isDev = computed(() => getUserRole.value === UserRole.DEV)

// Bulk delete state
const selectedIds = ref<number[]>([])
const showBulkDeleteConfirm = ref(false)
const bulkDeleteError = ref('')
const bulkDeleteProgress = ref('')

const isAllSelected = computed(() =>
  paginatedCustomers.value?.length > 0 &&
  paginatedCustomers.value.every((c: any) => selectedIds.value.includes(c.id))
)

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = selectedIds.value.filter(
      (id: number) => !paginatedCustomers.value.some((c: any) => c.id === id)
    )
  } else {
    const pageIds = paginatedCustomers.value.map((c: any) => c.id)
    selectedIds.value = [...new Set([...selectedIds.value, ...pageIds])]
  }
}

const confirmBulkDelete = async () => {
  deleting.value = true
  bulkDeleteError.value = ''
  bulkDeleteProgress.value = ''
  let success = 0
  let failed = 0
  for (const id of selectedIds.value) {
    try {
      const res = await apiClient.delete(`/customers/${id}`)
      if (res.error) failed++
      else success++
    } catch { failed++ }
    bulkDeleteProgress.value = `Đã xóa ${success}/${selectedIds.value.length}...`
  }
  deleting.value = false
  if (failed > 0) {
    bulkDeleteError.value = `${success} xóa thành công, ${failed} thất bại (có dữ liệu liên quan).`
  } else {
    showBulkDeleteConfirm.value = false
    bulkDeleteProgress.value = ''
    selectedIds.value = []
    await fetchCustomers()
  }
}

const showAddModal = ref(false)
const deletingCustomer = ref<any>(null)
const deleteError = ref('')
const deleting = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const addError = ref<string | null>(null)
const addSuccessMessage = ref<string | null>(null)

const customerForm = ref({
  name: '',
  email: '',
  phone: '',
  tax_code: '',
  contact_person: '',
  contact_phone: '',
  contact_email: '',
  contact_address: '',
  address: '',
  representative_name: '',
  representative_position: 'Giám đốc',
  authorization_doc: '',
  recipient_name: '',
  recipient_address: '',
  recipient_phone: '',
})
const selectedUserId = ref<number | null>(null)
const userSearchQuery = ref('')
const showUserDropdown = ref(false)
const userSearchResults = ref<any[]>([])
const allUsers = ref<any[]>([])
const endUsers = computed(() =>
  allUsers.value.filter(u => u.role === 'end_user' && u.status === 'active')
)

// Contact person search
const contactSearch = ref('')
const showContactDropdown = ref(false)
const contactResults = ref<any[]>([])
const selectedContactId = ref<number | null>(null)

// Người nhận hợp đồng giống người liên hệ
const recipientSameAsContact = ref(false)

const applyRecipientFromContact = () => {
  if (!recipientSameAsContact.value) return
  customerForm.value.recipient_name = customerForm.value.contact_person || ''
  customerForm.value.recipient_phone = customerForm.value.contact_phone || ''
  customerForm.value.recipient_address = customerForm.value.contact_address || ''
}

// Khi sửa tay thông tin người liên hệ → bỏ liên kết tài khoản đã chọn
const onContactFieldEdit = () => {
  selectedContactId.value = null
  applyRecipientFromContact()
}

const toggleRecipientSameAsContact = () => {
  if (recipientSameAsContact.value) {
    applyRecipientFromContact()
  }
}

const onContactSearch = () => {
  const q = contactSearch.value.toLowerCase().trim()
  if (!q) { contactResults.value = endUsers.value.slice(0, 10); return }
  contactResults.value = endUsers.value
    .filter(u => u.name?.toLowerCase().includes(q) || u.phone?.includes(q) || u.email?.toLowerCase().includes(q))
    .slice(0, 10)
  showContactDropdown.value = true
}

const selectContact = async (u: any) => {
  showContactDropdown.value = false
  contactSearch.value = ''
  // Fetch đầy đủ thông tin từ API
  let full: any = u
  try {
    const res = await apiClient.get(`/users/${u.id}`)
    full = (res.data as any) || u
  } catch {
    full = u
  }
  selectedContactId.value = u.id
  customerForm.value.contact_person = full.name || u.name || ''
  customerForm.value.contact_phone = full.phone || u.phone || ''
  customerForm.value.contact_email = full.email || u.email || ''
  customerForm.value.contact_address = full.address || u.address || ''
  applyRecipientFromContact()
}

const clearContact = () => {
  selectedContactId.value = null
  customerForm.value.contact_person = ''
  customerForm.value.contact_phone = ''
  customerForm.value.contact_email = ''
  customerForm.value.contact_address = ''
  contactSearch.value = ''
  if (recipientSameAsContact.value) {
    customerForm.value.recipient_name = ''
    customerForm.value.recipient_phone = ''
    customerForm.value.recipient_address = ''
  }
}
void clearContact

const stats = ref({
  totalCustomers: 0,
  activeContracts: 0,
  openTickets: 0,
})

const filters = ref({
  search: '',    // tên công ty
  tax_code: '',  // MST
  contact: '',   // người liên hệ
})

const customers = ref<any[]>([])
const distributors = ref<any[]>([])
const currentPage = ref(1)
const itemsPerPage = 20

const confirmDelete = async () => {
  if (!deletingCustomer.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    const res = await apiClient.delete(`/customers/${deletingCustomer.value.id}`)
    if (res.error) throw new Error(res.error)
    deletingCustomer.value = null
    await fetchCustomers()
  } catch (err: any) {
    deleteError.value = err?.message || 'Không thể xóa khách hàng. Có thể còn dữ liệu liên quan.'
  } finally {
    deleting.value = false
  }
}

const closeAddModal = () => {
  showAddModal.value = false
  addError.value = null
  addSuccessMessage.value = null
  customerForm.value = { name: '', email: '', phone: '', tax_code: '', contact_person: '', contact_phone: '', contact_email: '', contact_address: '', address: '', representative_name: '', representative_position: 'Giám đốc', authorization_doc: '', recipient_name: '', recipient_address: '', recipient_phone: '' }
  selectedUserId.value = null
  userSearchQuery.value = ''
  showUserDropdown.value = false
  userSearchResults.value = []
  selectedContactId.value = null
  contactSearch.value = ''
  showContactDropdown.value = false
  recipientSameAsContact.value = false
}

// Load toàn bộ users để search
const loadAllUsers = async () => {
  try {
    const response = await apiClient.get('/users?limit=1000')
    allUsers.value = (response.data as any[]) || []
  } catch {}
}

const onUserSearch = () => {
  const q = userSearchQuery.value.toLowerCase().trim()
  if (!q) { userSearchResults.value = []; return }
  userSearchResults.value = allUsers.value
    .filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.includes(q)
    )
    .slice(0, 8)
  showUserDropdown.value = true
}

const selectUser = (u: any) => {
  selectedUserId.value = u.id
  // Chỉ gán tên người dùng vào trường Người liên hệ
  customerForm.value.contact_person = u.name || ''
  // Các trường còn lại giữ nguyên để nhập thủ công
  userSearchQuery.value = ''
  showUserDropdown.value = false
}

const clearSelectedUser = () => {
  selectedUserId.value = null
  customerForm.value.contact_person = ''
}

const saveCustomer = async () => {
  saving.value = true
  addError.value = null
  addSuccessMessage.value = null

  try {
    if (!customerForm.value.name.trim()) {
      addError.value = 'Vui lòng nhập tên công ty'
      saving.value = false
      return
    }
    if (!customerForm.value.representative_name.trim()) {
      addError.value = 'Vui lòng nhập người đại diện'
      saving.value = false
      return
    }
    if (!customerForm.value.representative_position.trim()) {
      addError.value = 'Vui lòng nhập chức vụ người đại diện'
      saving.value = false
      return
    }

    // Lưu thông tin khách hàng (công ty) vào bảng customers
    // contact_user_id = ID người liên hệ từ bảng users
    const response = await apiClient.post('/customers', {
      name: customerForm.value.name,
      email: customerForm.value.email || undefined,
      address: customerForm.value.address || undefined,
      tax_code: customerForm.value.tax_code || undefined,
      contact_person: customerForm.value.contact_person || undefined,
      contact_phone: customerForm.value.contact_phone || undefined,
      contact_email: customerForm.value.contact_email || undefined,
      contact_address: customerForm.value.contact_address || undefined,
      representative_name: customerForm.value.representative_name || undefined,
      representative_position: customerForm.value.representative_position || undefined,
      authorization_doc: customerForm.value.authorization_doc || undefined,
      recipient_name: customerForm.value.recipient_name || undefined,
      recipient_address: customerForm.value.recipient_address || undefined,
      recipient_phone: customerForm.value.recipient_phone || undefined,
      contact_user_id: selectedContactId.value || undefined,
      customer_type: 'end_user',
    })
    if (response.error) throw new Error(response.error)

    addSuccessMessage.value = t('customers.list.messages.createSuccess')
    showSuccess(t('common.messages.customerCreated'))
    
    // Refresh customer list
    await fetchCustomers()
    
    // Close modal after 1.5 seconds
    setTimeout(() => {
      closeAddModal()
    }, 1500)
  } catch (err: any) {
    console.error('Error creating customer:', err)
    addError.value = err?.message || t('customers.list.messages.createError')
  } finally {
    saving.value = false
  }
}

// Fetch distributors from distributors table
const fetchDistributors = async () => {
  try {
    const response = await apiClient.get('/distributors?status=active')
    if (response.error) {
      throw new Error(response.error)
    }
    const data = response.data as any[]
    distributors.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Error fetching distributors:', err)
    distributors.value = []
  }
}

// Fetch customers from API
const fetchCustomers = async () => {
  loading.value = true
  error.value = null
  try {
    const response = await apiClient.get('/customers?limit=1000')
    if (response.error) throw new Error(response.error)

    const apiResponse = response.data as any
    const data = apiResponse?.customers || apiResponse?.data || apiResponse || []
    customers.value = Array.isArray(data) ? data : []
    updateStats()
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('customers.list.messages.loadError')
    console.error('Error fetching customers:', err)
  } finally {
    loading.value = false
  }
}

// Update statistics
const updateStats = async () => {
  stats.value.totalCustomers = customers.value.length
  // Hợp đồng đang hiệu lực
  try {
    const res = await apiClient.get('/contracts/stats')
    stats.value.activeContracts = (res.data as any)?.active ?? 0
  } catch { stats.value.activeContracts = 0 }
  // Ticket đang xử lý
  try {
    const res = await apiClient.get('/tickets/stats')
    const s = res.data as any
    stats.value.openTickets = (s?.initialized ?? 0) + (s?.in_progress ?? 0)
  } catch { stats.value.openTickets = 0 }
}

const filteredCustomers = computed(() => {
  let result = customers.value

  if (filters.value.search.trim()) {
    const q = filters.value.search.toLowerCase()
    result = result.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    )
  }

  if (filters.value.tax_code.trim()) {
    const q = filters.value.tax_code.trim()
    result = result.filter(c => c.tax_code?.includes(q) || c.code?.includes(q))
  }

  if (filters.value.contact.trim()) {
    const q = filters.value.contact.toLowerCase()
    result = result.filter(c =>
      c.contact_person?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      (c.email?.toLowerCase().includes(q) && c.source !== 'customer')
    )
  }

  return result
})

// Pagination computed
const totalPages = computed(() => Math.ceil(filteredCustomers.value.length / itemsPerPage))

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredCustomers.value.slice(start, end)
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

// Reset to page 1 when filters change
watch([() => filters.value.search, () => filters.value.tax_code, () => filters.value.contact], () => {
  currentPage.value = 1
})

const getTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    end_user: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    distributor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    dealer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }
  return classes[type] || classes.end_user
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    end_user: t('customers.list.typeOptions.endUser'),
    distributor: t('customers.list.typeOptions.distributor'),
    dealer: t('customers.list.typeOptions.dealer'),
  }
  return labels[type] || type
}

const getSourceLabel = (source: string) => {
  return source === 'user' ? t('customers.list.source.account') : t('customers.list.source.customer')
}

const getSourceClass = (source: string) => {
  return source === 'user' 
    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
    : 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
}

const clearFilters = () => {
  filters.value = {
    search: '',
    tax_code: '',
    contact: '',
  }
  fetchCustomers()
}

// Load customers on mount
onMounted(() => {
  fetchCustomers()
  loadAllUsers()
  if (route.query.new) {
    showAddModal.value = true
  }
  document.addEventListener('click', (e) => {
    if (!(e.target as Element)?.closest('.user-search-box')) showUserDropdown.value = false
    if (!(e.target as Element)?.closest('.contact-search-box')) showContactDropdown.value = false
  })
})

// Refresh when component is activated
onActivated(() => {
  fetchCustomers()
})
</script>
