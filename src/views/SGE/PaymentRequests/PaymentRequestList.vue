<template>
  <admin-layout>
    <div class="px-4 sm:px-0 space-y-4 sm:space-y-6 max-w-full min-w-0 overflow-x-hidden">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 min-w-0">
        <div class="min-w-0">
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('paymentRequests.title') }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ t('paymentRequests.subtitle') }}
          </p>
        </div>
        <button
          v-if="canCreate"
          type="button"
          @click="openCreateModal()"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors min-h-[44px]"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          {{ t('paymentRequests.actions.create') }}
        </button>
      </div>

      <!-- Filters -->
      <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
        <div class="grid grid-cols-2 sm:flex sm:flex-wrap xl:flex-nowrap gap-2 items-center">
          <!-- Search: full width on mobile -->
          <div class="col-span-2 sm:flex-1 sm:min-w-[180px]">
            <input
              v-model="filters.search"
              type="text"
              :placeholder="t('paymentRequests.filters.searchPlaceholder')"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              @keyup.enter="applyFilters"
            />
          </div>
          <!-- Status: half on mobile -->
          <select
            v-model="filters.status"
            class="w-full sm:w-auto sm:shrink-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            @change="applyFilters"
          >
            <option value="">{{ t('paymentRequests.filters.allStatus') }}</option>
            <option value="pending">{{ t('paymentRequests.status.pending') }}</option>
            <option value="approved">{{ t('paymentRequests.status.approved') }}</option>
            <option value="rejected">{{ t('paymentRequests.status.rejected') }}</option>
            <option value="paid">{{ t('paymentRequests.status.paid') }}</option>
          </select>
          <!-- Date period: half on mobile -->
          <select
            v-model="dateReportType"
            class="w-full sm:w-auto sm:shrink-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <AppDatePicker
              v-model="dateRange.from"
              :disabled="!dateReportType"
              :placeholder="t('reports.filters.placeholders.fromDate')"
              input-class="w-full sm:w-[8.5rem] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
            <AppDatePicker
              v-model="dateRange.to"
              :disabled="!dateReportType"
              :placeholder="t('reports.filters.placeholders.toDate')"
              input-class="w-full sm:w-[8.5rem] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            />
          </template>
          <!-- Buttons -->
          <button
            type="button"
            @click="applyFilters"
            class="w-full sm:w-auto sm:shrink-0 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {{ t('paymentRequests.filters.apply') }}
          </button>
          <button
            type="button"
            @click="clearFilters"
            class="w-full sm:w-auto sm:shrink-0 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            {{ t('paymentRequests.filters.clear') }}
          </button>
        </div>
      </div>

      <!-- Loading / Error -->
      <div v-if="loading" class="text-center py-12 text-gray-500 dark:text-gray-400">
        {{ t('common.loading') }}
      </div>
      <div
        v-else-if="error"
        class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-red-800 dark:text-red-200"
      >
        {{ error }}
      </div>

      <!-- Table -->
      <div
        v-else
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div class="overflow-x-auto w-full">
          <table class="w-full min-w-[360px] text-sm">
            <thead class="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {{ t('paymentRequests.columns.number') }}
                </th>
                <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ t('paymentRequests.columns.content') }}
                </th>
                <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {{ t('paymentRequests.columns.amount') }}
                </th>
                <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap hidden sm:table-cell">
                  {{ t('paymentRequests.columns.source') }}
                </th>
                <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap hidden md:table-cell">
                  {{ t('paymentRequests.columns.requester') }}
                </th>
                <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {{ t('paymentRequests.columns.status') }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr
                v-for="item in items"
                :key="item.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer"
                @click="goToDetail(item.id)"
              >
                <!-- Number + date (subtext on mobile) -->
                <td class="px-4 py-2.5 whitespace-nowrap">
                  <div class="flex items-center gap-1">
                    <span class="font-mono text-blue-600 dark:text-blue-400 text-xs">{{ item.request_number }}</span>
                    <span v-if="item.has_vat" class="px-1 py-0.5 text-[10px] font-semibold rounded bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300">VAT</span>
                  </div>
                  <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                    {{ item.payment_date ? formatDate(item.payment_date) : '—' }}
                  </p>
                </td>
                <!-- Content + category badge (subtext) -->
                <td class="px-4 py-2.5 max-w-[160px] sm:max-w-[220px]">
                  <p class="text-gray-700 dark:text-gray-300 truncate text-xs sm:text-sm" :title="item.payment_content">
                    {{ item.payment_content }}
                  </p>
                  <span v-if="item.expense_category" class="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    {{ categoryLabel(item.expense_category) }}
                  </span>
                </td>
                <!-- Amount -->
                <td class="px-4 py-2.5 text-right font-semibold text-gray-900 dark:text-white whitespace-nowrap text-xs sm:text-sm">
                  {{ formatCurrency(item.amount) }}
                </td>
                <!-- Source: hidden on mobile -->
                <td class="px-4 py-2.5 whitespace-nowrap text-gray-600 dark:text-gray-400 text-xs hidden sm:table-cell">
                  {{ sourceLabel(item.payment_source) }}
                </td>
                <!-- Requester + reviewer (subtext): hidden on mobile -->
                <td class="px-4 py-2.5 whitespace-nowrap text-gray-600 dark:text-gray-400 text-xs hidden md:table-cell">
                  <p>{{ item.requested_by_name || '—' }}</p>
                  <p v-if="item.reviewed_by_name" class="text-[11px] text-gray-400 dark:text-gray-500">{{ item.reviewed_by_name }}</p>
                </td>
                <!-- Status -->
                <td class="px-4 py-2.5 whitespace-nowrap">
                  <span :class="statusClass(item.status)" class="px-2 py-0.5 text-xs font-semibold rounded-full">
                    {{ statusLabel(item.status) }}
                  </span>
                </td>
              </tr>
              <tr v-if="items.length === 0">
                <td colspan="6" class="px-4 py-10 text-center text-gray-500 dark:text-gray-400">
                  {{ t('paymentRequests.empty') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div
          v-if="totalPages > 1"
          class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700"
        >
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ t('paymentRequests.pagination', { total, page: currentPage, pages: totalPages }) }}
          </p>
          <div class="flex gap-2">
            <button
              type="button"
              :disabled="currentPage <= 1"
              @click="changePage(currentPage - 1)"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
            >
              {{ t('dashboard.pagination.prev') }}
            </button>
            <button
              type="button"
              :disabled="currentPage >= totalPages"
              @click="changePage(currentPage + 1)"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
            >
              {{ t('dashboard.pagination.next') }}
            </button>
          </div>
        </div>
      </div>

      <!-- ===== Create / Edit Modal ===== -->
      <div
        v-if="showCreateModal"
        class="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50"
        @click.self="closeCreateModal"
      >
        <div class="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6">
          <div class="flex items-center justify-between mb-5">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">
              {{ t('paymentRequests.create.title') }}
            </h3>
            <button type="button" @click="closeCreateModal" class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form class="space-y-4" @submit.prevent="submitCreate">
            <!-- Row 1: Ngày chi + Hạng mục -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('paymentRequests.create.paymentDate') }}
                </label>
                <AppDatePicker
                  v-model="createForm.payment_date"
                  input-class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('paymentRequests.create.category') }}
                </label>
                <select
                  v-model="createForm.expense_category"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">{{ t('paymentRequests.create.selectCategory') }}</option>
                  <option v-for="cat in EXPENSE_CATEGORIES" :key="cat" :value="cat">
                    {{ categoryLabel(cat) }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Nội dung chi -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('paymentRequests.create.content') }} *
              </label>
              <textarea
                v-model="createForm.payment_content"
                rows="2"
                required
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
                :placeholder="t('paymentRequests.create.contentPlaceholder')"
              />
            </div>

            <!-- Row 2: Tổng tiền (full width, nguồn tiền do admin/kế toán điền) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('paymentRequests.create.amount') }} *
              </label>
              <input
                :value="amountDisplay"
                type="text"
                inputmode="numeric"
                required
                placeholder="0"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                @input="onAmountInput"
                @blur="onAmountBlur"
              />
              <p v-if="createForm.amount > 0" class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {{ formatCurrency(createForm.amount) }}
              </p>
            </div>

            <!-- Người yêu cầu -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('paymentRequests.create.payer') }}
              </label>
              <!-- Admin/Dev/Kế toán: dropdown chọn từ danh sách nhân viên -->
              <select
                v-if="canEditRequester"
                v-model="createForm.payer_name"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="">— Chọn nhân viên —</option>
                <option v-for="u in staffList" :key="u.id" :value="u.name">
                  {{ u.name }}
                  <template v-if="u.code"> ({{ u.code }})</template>
                </option>
              </select>
              <!-- Nhân viên thường: chỉ hiển thị -->
              <input
                v-else
                :value="createForm.payer_name"
                type="text"
                readonly
                class="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg cursor-default"
              />
            </div>

            <!-- VAT checkbox -->
            <div class="flex items-center gap-2">
              <input
                id="has-vat"
                v-model="createForm.has_vat"
                type="checkbox"
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label for="has-vat" class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ t('paymentRequests.create.vat') }}
              </label>
            </div>

            <!-- Hình ảnh hóa đơn -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('paymentRequests.create.invoiceImages') }}
                </label>
                <span class="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">Ctrl+V để dán ảnh</span>
              </div>
              <div
                ref="invoiceDropZone"
                tabindex="0"
                class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 hover:border-blue-400 dark:hover:border-blue-500 focus:outline-none focus:border-blue-500 transition-colors"
                @click="invoiceFileInput?.click()"
                @dragover.prevent
                @drop.prevent="handleImageDrop"
              >
                <div v-if="invoicePreviews.length === 0" class="text-center">
                  <svg class="mx-auto w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.create.invoiceImagesHint') }}</p>
                </div>
                <div v-else class="flex flex-wrap gap-2">
                  <div
                    v-for="(preview, idx) in invoicePreviews"
                    :key="idx"
                    class="relative group"
                  >
                    <img :src="preview" class="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600" />
                    <button
                      type="button"
                      @click.stop="removeInvoiceImage(idx)"
                      class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 sm:transition-opacity sm:opacity-0 opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                  <div
                    v-if="invoicePreviews.length < 5"
                    class="w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-400 cursor-pointer hover:border-blue-400 transition-colors"
                    @click.stop="invoiceFileInput?.click()"
                  >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                  </div>
                </div>
              </div>
              <!-- Action buttons -->
              <div class="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  @click="invoiceFileInput?.click()"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                  Chọn file
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  @click="invoiceCameraInput?.click()"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Chụp ảnh
                </button>
                <span class="text-xs text-gray-400 dark:text-gray-500 ml-1">{{ invoicePreviews.length }}/5</span>
              </div>
              <!-- Hidden file inputs -->
              <input
                ref="invoiceFileInput"
                type="file"
                accept="image/*"
                multiple
                class="hidden"
                @change="handleImageSelect"
              />
              <input
                ref="invoiceCameraInput"
                type="file"
                accept="image/*"
                capture="environment"
                class="hidden"
                @change="handleImageSelect"
              />
            </div>

            <!-- Người thụ hưởng -->
            <div class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-3">
              <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
                {{ t('paymentRequests.beneficiary.section') }}
              </p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="sm:col-span-2">
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {{ t('paymentRequests.create.beneficiary') }}
                  </label>
                  <input
                    v-model="createForm.beneficiary_name"
                    type="text"
                    :placeholder="t('paymentRequests.beneficiary.namePlaceholder')"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {{ t('paymentRequests.create.bankAccount') }}
                  </label>
                  <input
                    v-model="createForm.bank_account"
                    type="text"
                    inputmode="numeric"
                    :placeholder="t('paymentRequests.beneficiary.accountPlaceholder')"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-mono"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {{ t('paymentRequests.create.bankName') }}
                  </label>
                  <select
                    v-model="createForm.bank_name"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">{{ t('paymentRequests.beneficiary.selectBank') }}</option>
                    <option v-for="b in VN_BANKS" :key="b.bin" :value="b.shortName">
                      {{ b.shortName }} ({{ b.code }})
                    </option>
                  </select>
                </div>
              </div>
              <BeneficiaryTransferQr
                v-if="createForm.bank_account && createForm.bank_name"
                :beneficiary-name="createForm.beneficiary_name"
                :bank-account="createForm.bank_account"
                :bank-name="createForm.bank_name"
                :amount="createForm.amount"
                :transfer-note="createForm.payment_content"
              />
            </div>

            <!-- Hợp đồng (tùy chọn) -->
            <details class="group">
              <summary class="text-sm font-medium text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none list-none flex items-center gap-1">
                <svg class="w-4 h-4 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
                {{ t('paymentRequests.create.contract') }}
              </summary>
              <div class="mt-3">
                <select
                  v-model="createForm.contract_id"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">{{ t('paymentRequests.create.selectContract') }}</option>
                  <option v-for="c in contractOptions" :key="c.id" :value="c.id">
                    {{ c.contract_number }} — {{ c.customer_name }} ({{ formatCurrency(c.value) }})
                  </option>
                </select>
              </div>
            </details>

            <!-- Ghi chú -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {{ t('paymentRequests.create.notes') }}
              </label>
              <textarea
                v-model="createForm.notes"
                rows="2"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

            <p v-if="createError" class="text-sm text-red-600 dark:text-red-400">{{ createError }}</p>

            <div class="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
              <button
                type="button"
                @click="closeCreateModal"
                class="px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 min-h-[44px]"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="creating"
                class="px-4 py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 min-h-[44px]"
              >
                {{ creating ? t('common.saving') : t('paymentRequests.actions.submit') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppDatePicker from '@/components/forms/AppDatePicker.vue'
import { hasPermission, Permission, getUser } from '@/composables/useAuth'
import {
  paymentRequestService,
  type PaymentRequest,
  type PaymentRequestStatus,
  type ExpenseCategory,
  type ContractOption,
} from '@/services/paymentRequestService'
import { userService } from '@/services/userService'
import { filterImageFiles, readFileAsDataUrl, compressImage } from '@/utils/imageUpload'
import { useImagePaste } from '@/composables/useImagePaste'
import BeneficiaryTransferQr from '@/components/payment/BeneficiaryTransferQr.vue'
import { VN_BANKS, matchBankSelectValue } from '@/data/vnBanks'
import { getVietnamWeekRange, getVietnamFullMonthRange, getVietnamYearRange } from '@/utils/dateTime'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const canCreate = computed(() => hasPermission(Permission.CREATE_PAYMENT_REQUEST))
const canEditRequester = computed(() => {
  const role = getUser.value?.role
  return role === 'admin' || role === 'dev' || role === 'accounting'
})

// Danh sách nhân viên nội bộ cho dropdown Người yêu cầu
const MANAGEMENT_ROLES = ['admin', 'dev', 'service_center', 'technician', 'warehouse', 'dealer', 'accounting']
const staffList = ref<{ id: number; name: string; code?: string; role: string }[]>([])

const loadStaffList = async () => {
  if (!canEditRequester.value || staffList.value.length > 0) return
  try {
    const all = await userService.getAllUsers()
    staffList.value = all
      .filter((u) => u.status === 'active' && MANAGEMENT_ROLES.includes(u.role))
      .map((u) => ({ id: u.id, name: u.name, code: u.code, role: u.role }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
  } catch {
    // silent — fallback to empty
  }
}

const loading = ref(false)
const error = ref('')
const items = ref<PaymentRequest[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = 20

const filters = ref({ search: '', status: '' as PaymentRequestStatus | '' })

type DateReportType = '' | 'week' | 'month' | 'year' | 'custom'
const dateReportType = ref<DateReportType>('')
const dateRange = reactive({ from: '', to: '' })
const appliedDateRange = reactive({ from: '', to: '' })

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
  currentPage.value = 1
  loadData()
}

const clearDateFilter = () => {
  dateReportType.value = ''
  dateRange.from = ''
  dateRange.to = ''
  appliedDateRange.from = ''
  appliedDateRange.to = ''
  currentPage.value = 1
  loadData()
}

watch([() => dateRange.from, () => dateRange.to], () => {
  if (!dateReportType.value || dateReportType.value !== 'custom') return
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

const showCreateModal = ref(false)
const creating = ref(false)
const createError = ref('')
const contractOptions = ref<ContractOption[]>([])

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'tools', 'materials', 'external_labor', 'transport',
  'business_travel', 'office', 'entertainment', 'other',
]

const createForm = ref({
  payment_date: '',
  payment_content: '',
  expense_category: '' as ExpenseCategory | '',
  amount: 0,
  payer_name: '',
  has_vat: false,
  notes: '',
  contract_id: '' as number | '',
  beneficiary_name: '',
  bank_account: '',
  bank_name: '',
})

// Invoice images state
const invoiceFileInput = ref<HTMLInputElement | null>(null)
const invoiceCameraInput = ref<HTMLInputElement | null>(null)
const invoiceDropZone = ref<HTMLElement | null>(null)
const invoicePreviews = ref<string[]>([])

// Ctrl+V paste — active only when create modal is open
useImagePaste(
  (files) => addImages(files),
  {
    enabled: () => showCreateModal.value && invoicePreviews.value.length < 5,
    globalImagePaste: true,
  },
)

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0)

const formatDate = (d: string) => {
  if (!d) return '—'
  const date = new Date(d + (d.includes('T') ? '' : 'T00:00:00'))
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const statusLabel = (status: PaymentRequestStatus) => t(`paymentRequests.status.${status}`)

const statusClass = (status: PaymentRequestStatus) => {
  const map: Record<PaymentRequestStatus, string> = {
    pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    approved: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

const categoryLabel = (cat: string) =>
  t(`paymentRequests.expenseCategory.${cat}`, cat)

const sourceLabel = (src?: string | null) =>
  src ? t(`paymentRequests.paymentSource.${src}`, src) : '—'

// ---- Amount formatting ----
const amountDisplay = ref('')

const onAmountInput = (e: Event) => {
  const raw = (e.target as HTMLInputElement).value
  // Chỉ giữ chữ số
  const digits = raw.replace(/[^\d]/g, '')
  const num = parseInt(digits, 10) || 0
  createForm.value.amount = num
  // Format ngay khi gõ
  const formatted = num > 0 ? num.toLocaleString('vi-VN') : digits
  amountDisplay.value = formatted
  // Giữ cursor ở đúng vị trí
  const input = e.target as HTMLInputElement
  input.value = formatted
}

const onAmountBlur = () => {
  const num = createForm.value.amount
  amountDisplay.value = num > 0 ? num.toLocaleString('vi-VN') : ''
}

// ---- Image helpers ----
const handleImageSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  await addImages(Array.from(input.files))
  input.value = ''
}

const handleImageDrop = async (e: DragEvent) => {
  const files = filterImageFiles(Array.from(e.dataTransfer?.files || []))
  await addImages(files)
}

const addImages = async (files: File[]) => {
  const remaining = 5 - invoicePreviews.value.length
  const toAdd = files.slice(0, remaining)
  for (const file of toAdd) {
    if (file.size > 10 * 1024 * 1024) {
      createError.value = t('paymentRequests.errors.imageTooLarge', { name: file.name })
      continue
    }
    const compressed = await compressImage(file, 1280, 1280, 0.78)
    const url = await readFileAsDataUrl(compressed)
    invoicePreviews.value.push(url)
  }
}

const removeInvoiceImage = (idx: number) => {
  invoicePreviews.value.splice(idx, 1)
}

// ---- Data ----
const loadData = async () => {
  loading.value = true
  error.value = ''
  try {
    const res = await paymentRequestService.list({
      search: filters.value.search || undefined,
      status: filters.value.status || undefined,
      from: appliedDateRange.from || undefined,
      to: appliedDateRange.to || undefined,
      page: currentPage.value,
      limit: pageSize,
    })
    items.value = res.data
    total.value = res.pagination.total
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('paymentRequests.errors.loadFailed')
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  if (dateReportType.value && dateRange.from && dateRange.to) {
    appliedDateRange.from = dateRange.from
    appliedDateRange.to = dateRange.to
  }
  currentPage.value = 1
  loadData()
}

const clearFilters = () => {
  filters.value = { search: '', status: '' }
  dateReportType.value = ''
  dateRange.from = ''
  dateRange.to = ''
  appliedDateRange.from = ''
  appliedDateRange.to = ''
  applyFilters()
}

const changePage = (page: number) => {
  currentPage.value = page
  loadData()
}

const goToDetail = (id: number) => {
  router.push(`/payment-requests/${id}`)
}

const loadContractOptions = async () => {
  try {
    contractOptions.value = await paymentRequestService.getContractOptions()
  } catch {
    contractOptions.value = []
  }
}

const applyPrefillAmount = (amount?: number) => {
  const num = Number(amount) || 0
  createForm.value.amount = num
  amountDisplay.value = num > 0 ? num.toLocaleString('vi-VN') : ''
}

const openCreateModal = async (prefillContractId?: number, prefillAmount?: number) => {
  createError.value = ''
  invoicePreviews.value = []
  const currentUser = getUser.value
  const today = new Date().toISOString().slice(0, 10)
  createForm.value = {
    payment_date: today,
    payment_content: '',
    expense_category: '',
    amount: 0,
    payer_name: currentUser?.name || '',
    has_vat: false,
    notes: '',
    contract_id: prefillContractId || '',
    beneficiary_name: currentUser?.bank_account_name || currentUser?.name || '',
    bank_account: currentUser?.bank_account || '',
    bank_name: matchBankSelectValue(currentUser?.bank_name) || '',
  }
  applyPrefillAmount(prefillAmount)
  await loadContractOptions()
  await loadStaffList()
  if (prefillContractId && !contractOptions.value.some((c) => c.id === prefillContractId)) {
    const matched = await paymentRequestService.getContractOptions('', prefillContractId)
    contractOptions.value = [
      ...contractOptions.value,
      ...matched.filter((c) => c.id === prefillContractId),
    ]
  }
  if (!createForm.value.amount && prefillContractId) {
    const matchedContract = contractOptions.value.find((c) => c.id === prefillContractId)
    if (matchedContract?.value && matchedContract.value > 0) {
      applyPrefillAmount(matchedContract.value)
    }
  }
  showCreateModal.value = true
}

const closeCreateModal = () => {
  showCreateModal.value = false
  createError.value = ''
  invoicePreviews.value = []
  amountDisplay.value = ''
}

const submitCreate = async () => {
  if (!createForm.value.payment_content.trim()) return
  creating.value = true
  createError.value = ''
  try {
    await paymentRequestService.create({
      payment_date: createForm.value.payment_date || undefined,
      payment_content: createForm.value.payment_content,
      expense_category: createForm.value.expense_category || undefined,
      amount: createForm.value.amount,
      payer_name: createForm.value.payer_name || undefined,
      has_vat: createForm.value.has_vat,
      invoice_images: invoicePreviews.value.length > 0 ? invoicePreviews.value : undefined,
      notes: createForm.value.notes || undefined,
      contract_id: createForm.value.contract_id ? Number(createForm.value.contract_id) : undefined,
      beneficiary_name: createForm.value.beneficiary_name || undefined,
      bank_account: createForm.value.bank_account || undefined,
      bank_name: createForm.value.bank_name || undefined,
    })
    closeCreateModal()
    await loadData()
  } catch (err) {
    createError.value = err instanceof Error ? err.message : t('paymentRequests.errors.createFailed')
  } finally {
    creating.value = false
  }
}

const tryOpenCreateFromQuery = async () => {
  if (!route.query.create || !canCreate.value) return

  const contractIdRaw = route.query.contract_id
  const amountRaw = route.query.amount
  const contractId = contractIdRaw ? Number(contractIdRaw) : undefined
  const amount =
    amountRaw != null && String(amountRaw).trim() !== '' ? Number(amountRaw) : undefined

  if (contractId && !Number.isNaN(contractId)) {
    await openCreateModal(
      contractId,
      amount != null && !Number.isNaN(amount) && amount > 0 ? amount : undefined,
    )
  } else {
    await openCreateModal()
  }

  const nextQuery = { ...route.query }
  delete nextQuery.create
  delete nextQuery.contract_id
  delete nextQuery.amount
  router.replace({ path: route.path, query: nextQuery })
}

watch(
  () => route.query.create,
  (createFlag) => {
    if (createFlag) void tryOpenCreateFromQuery()
  },
)

onMounted(async () => {
  await loadData()
  await tryOpenCreateFromQuery()
})
</script>
