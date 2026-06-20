<template>
  <admin-layout>
    <div class="px-4 sm:px-0 space-y-4 sm:space-y-6 overflow-x-hidden max-w-full">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('inverters.list.header.title') }}
          </h1>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm"
      >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('inverters.list.filters.search') }}
            </label>
            <input
              v-model="filters.search"
              type="text"
              :placeholder="t('inverters.list.filters.searchPlaceholder')"
              class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('inverters.list.filters.model') }}
            </label>
            <input
              v-model="filters.model"
              type="text"
              :placeholder="t('inverters.list.filters.modelPlaceholder')"
              class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
            />
          </div>
          <div class="flex items-end">
            <button
              @click="applyFilters"
              class="w-full px-4 py-2.5 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 active:bg-gray-800 transition-colors touch-manipulation min-h-[44px] sm:min-h-0 text-sm sm:text-base"
            >
              {{ t('inverters.list.filters.filter') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Table - Desktop View -->
      <div
        class="hidden md:block rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div class="overflow-x-auto overflow-y-auto max-h-[600px] w-full">
          <table class="w-full min-w-[960px] table-fixed">
            <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[13%]"
                >
                  {{ t('inverters.list.table.serialNumber') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[12%]"
                >
                  {{ t('inverters.list.table.model') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[8%]"
                >
                  Hãng
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[11%]"
                >
                  Hợp đồng
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[22%]"
                >
                  {{ t('inverters.list.table.customer') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[10%]"
                >
                  {{ t('inverters.list.table.activationDate') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[10%]"
                >
                  {{ t('inverters.list.table.warrantyUntil') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-[14%]"
                >
                  {{ t('inverters.list.table.status') }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <!-- Loading State -->
              <tr v-if="loading">
                <td colspan="8" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  {{ t('inverters.list.table.loading') }}
                </td>
              </tr>
              <!-- Error State -->
              <tr v-else-if="error">
                <td colspan="8" class="px-6 py-8 text-center text-red-500 dark:text-red-400">
                  {{ error }}
                </td>
              </tr>
              <!-- Empty State -->
              <tr v-else-if="inverters.length === 0">
                <td colspan="8" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  {{ t('inverters.list.table.noDevices') }} — thêm thiết bị trong hợp đồng
                </td>
              </tr>
              <!-- Data Rows -->
              <tr
                v-for="inverter in paginatedInverters"
                :key="inverter.id || inverter.serial_number"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                @click="inverter.id && $router.push(`/inverters/${inverter.id}`)"
              >
                <td class="px-4 py-4">
                  <span
                    class="block font-medium text-gray-900 dark:text-white font-mono text-sm truncate"
                    :title="inverter.serial_number"
                  >
                    {{ inverter.serial_number || '—' }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <span
                    class="block text-sm text-gray-500 dark:text-gray-400 truncate"
                    :title="inverter.model"
                  >
                    {{ inverter.model || '—' }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <span class="block text-sm text-gray-500 dark:text-gray-400 truncate">
                    {{ inverter.manufacturer || '—' }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <span
                    class="block text-sm text-blue-600 dark:text-blue-400 truncate"
                    :title="inverter.contract_numbers"
                  >
                    {{ inverter.contract_numbers || '—' }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <span
                    class="block text-sm text-gray-500 dark:text-gray-400 truncate"
                    :title="inverter.customer_name"
                  >
                    {{ inverter.customer_name || '—' }}
                  </span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(inverter.warranty_start_date) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {{ formatDate(inverter.warranty_end_date) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      getWarrantyStatusClass(getWarrantyStatus(inverter)),
                    ]"
                  >
                    {{ getWarrantyStatusLabel(getWarrantyStatus(inverter)) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div class="text-xs sm:text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
              {{ t('inverters.list.pagination.showing', {
                start: (currentPage - 1) * itemsPerPage + 1,
                end: Math.min(currentPage * itemsPerPage, totalItems),
                total: totalItems
              }) }}
            </div>
            <div class="flex items-center gap-2 flex-wrap justify-center">
              <button
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 touch-manipulation min-h-[44px] sm:min-h-0"
              >
                {{ t('inverters.list.pagination.previous') }}
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
                {{ t('inverters.list.pagination.next') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden space-y-3">
        <!-- Loading State -->
        <div v-if="loading" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
          {{ t('inverters.list.table.loading') }}
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="rounded-lg bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 p-6 text-center text-red-500 dark:text-red-400">
          {{ error }}
        </div>

        <!-- Empty State -->
        <div v-else-if="paginatedInverters.length === 0" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
          {{ t('inverters.list.table.noDevices') }}
        </div>

        <!-- Inverter Cards -->
        <div
          v-for="inverter in paginatedInverters"
          :key="inverter.id || inverter.serial_number"
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm active:bg-gray-50 dark:active:bg-gray-700 touch-manipulation cursor-pointer"
          @click="inverter.id && $router.push(`/inverters/${inverter.id}`)"
        >
          <div class="mb-3">
            <h3
              class="font-semibold text-gray-900 dark:text-white text-base truncate font-mono"
              :title="inverter.serial_number"
            >
              {{ inverter.serial_number || '—' }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5 truncate">
              {{ inverter.model || t('common.na') }}
              <span v-if="inverter.manufacturer" class="text-gray-400"> · {{ inverter.manufacturer }}</span>
            </p>
            <p
              v-if="inverter.contract_numbers"
              class="text-xs text-blue-600 dark:text-blue-400 mt-0.5 truncate"
            >
              {{ inverter.contract_numbers }}
            </p>
          </div>

          <!-- Customer -->
          <div class="mb-3 flex items-center gap-2">
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
              {{ inverter.customer_name || '—' }}
            </p>
          </div>

          <!-- Dates -->
          <div class="mb-3 space-y-2">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div class="flex-1 min-w-0">
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('inverters.list.table.activationDate') }}</p>
                <p class="text-xs text-gray-900 dark:text-white">{{ formatDate(inverter.warranty_start_date) }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div class="flex-1 min-w-0">
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('inverters.list.table.warrantyUntil') }}</p>
                <p class="text-xs text-gray-900 dark:text-white">{{ formatDate(inverter.warranty_end_date) }}</p>
              </div>
            </div>
          </div>

          <!-- Footer: Status -->
          <div class="flex flex-wrap items-center pt-3 border-t border-gray-200 dark:border-gray-700">
            <span
              :class="[
                'px-2 py-1 text-xs font-semibold rounded-full',
                getWarrantyStatusClass(getWarrantyStatus(inverter)),
              ]"
            >
              {{ getWarrantyStatusLabel(getWarrantyStatus(inverter)) }}
            </span>
          </div>
        </div>

        <!-- Mobile Pagination -->
        <div v-if="totalPages > 1" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex flex-col items-center justify-between gap-3">
            <div class="text-xs text-gray-700 dark:text-gray-300 text-center">
              {{ t('inverters.list.pagination.showing', {
                start: (currentPage - 1) * itemsPerPage + 1,
                end: Math.min(currentPage * itemsPerPage, totalItems),
                total: totalItems
              }) }}
            </div>
            <div class="flex items-center gap-2 w-full">
              <button
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                class="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 touch-manipulation min-h-[44px]"
              >
                {{ t('inverters.list.pagination.previous') }}
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
                {{ t('inverters.list.pagination.next') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Edit Inverter Modal -->
      <div
        v-if="showEditModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-gray-700/45 dark:bg-gray-900/65 p-4"
        @click.self="closeEditModal"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto"
        >
          <div class="p-4 sm:p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {{ editingInverter ? t('inverters.list.modal.edit.title') : t('inverters.list.modal.edit.createTitle') }}
              </h2>
              <button
                @click="closeEditModal"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Error Message -->
            <div v-if="error" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <p class="text-sm text-red-800 dark:text-red-200">{{ error }}</p>
            </div>

            <!-- Form -->
            <form @submit.prevent="saveInverter" class="space-y-3 sm:space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <!-- Serial Number -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('inverters.list.modal.edit.serialNumber') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="inverterForm.serial_number"
                    type="text"
                    required
                    class="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                </div>

                <!-- Model -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('inverters.list.modal.edit.model') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="inverterForm.model"
                    type="text"
                    required
                    class="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                </div>

                <!-- Type -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('inverters.list.modal.edit.type') }} <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="inverterForm.type"
                    required
                    class="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  >
                    <option value="">{{ t('inverters.list.modal.edit.typePlaceholder') }}</option>
                    <option v-for="type in typeOptions" :key="type.value" :value="type.value">
                      {{ type.label }}
                    </option>
                  </select>
                </div>

                <!-- Power Rating -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('inverters.list.modal.edit.powerRating') }}
                  </label>
                  <input
                    v-model="inverterForm.power_rating"
                    type="text"
                    :placeholder="t('inverters.list.modal.edit.powerPlaceholder')"
                    class="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                </div>

                <!-- Warranty Start Date -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('inverters.list.modal.edit.warrantyStart') }}
                  </label>
                  <AppDatePicker
                    v-model="inverterForm.warranty_start_date"
                    input-class="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                </div>

                <!-- Warranty End Date -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('inverters.list.modal.edit.warrantyEnd') }}
                  </label>
                  <AppDatePicker
                    v-model="inverterForm.warranty_end_date"
                    input-class="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                </div>

                <!-- Status -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('inverters.list.modal.edit.status') }}
                  </label>
                  <select
                    v-model="inverterForm.status"
                    class="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  >
                    <option v-for="status in deviceStatusOptions" :key="status.value" :value="status.value">
                      {{ status.label }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('inverters.list.modal.edit.notes') }}
                </label>
                <textarea
                  v-model="inverterForm.notes"
                  rows="3"
                  class="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation text-base sm:text-sm"
                ></textarea>
              </div>

              <!-- Actions -->
              <div class="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  @click="closeEditModal"
                  class="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  {{ t('inverters.list.modal.edit.cancel') }}
                </button>
                <button
                  type="submit"
                  :disabled="loading"
                  class="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  {{ loading ? t('inverters.list.modal.edit.saving') : t('inverters.list.modal.edit.save') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Import CSV Modal -->
      <div
        v-if="showImportModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-gray-700/45 dark:bg-gray-900/65 p-4"
        @click.self="showImportModal = false"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto"
        >
          <div class="p-4 sm:p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {{ t('inverters.list.modal.import.title') }}
              </h2>
              <button
                @click="showImportModal = false"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Success Message -->
            <div
              v-if="importSuccess"
              class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded"
            >
              <p class="text-sm text-green-800 dark:text-green-200">
                {{ t('inverters.list.modal.import.success', { count: importedCount }) }}
              </p>
            </div>

            <!-- Error Messages -->
            <div v-if="importErrors.length > 0" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded max-h-48 overflow-y-auto">
              <p class="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">{{ t('inverters.list.modal.import.errors') }}</p>
              <ul class="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                <li v-for="(error, index) in importErrors" :key="index">{{ error }}</li>
              </ul>
            </div>

            <!-- Instructions -->
            <div class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
              <p class="text-sm text-blue-800 dark:text-blue-200 mb-2">
                <strong>{{ t('inverters.list.modal.import.instructions.title') }}</strong>
              </p>
              <ul class="list-disc list-inside text-sm text-blue-700 dark:text-blue-300 space-y-1">
                <li>{{ t('inverters.list.modal.import.instructions.download') }}</li>
                <li>{{ t('inverters.list.modal.import.instructions.required') }}</li>
                <li>{{ t('inverters.list.modal.import.instructions.types') }}</li>
                <li>{{ t('inverters.list.modal.import.instructions.statuses') }}</li>
                <li>{{ t('inverters.list.modal.import.instructions.customer') }}</li>
              </ul>
            </div>

            <!-- File Input -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('inverters.list.modal.import.selectFile') }}
              </label>
              <input
                ref="csvFileInput"
                type="file"
                accept=".csv"
                @change="handleFileSelect"
                class="w-full px-3 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
              />
              <p v-if="selectedFile" class="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {{ t('inverters.list.modal.import.selectedFile', { name: selectedFile.name }) }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row gap-3 justify-between">
              <button
                @click="downloadCSVTemplate"
                class="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
              >
                {{ t('inverters.list.modal.import.downloadTemplate') }}
              </button>
              <div class="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  @click="showImportModal = false"
                  class="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  {{ t('inverters.list.modal.import.close') }}
                </button>
                <button
                  @click="processCSV"
                  :disabled="!selectedFile || importing"
                  class="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  {{ importing ? t('inverters.list.modal.import.importing') : t('inverters.list.modal.import.import') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppDatePicker from '@/components/forms/AppDatePicker.vue'
import { PlusIcon } from '../../../icons'
import { apiClient } from '@/services/api'
import { inverterService } from '@/services/inverterService'

const { t } = useI18n()

const typeOptions = computed(() => [
  { value: 'grid-tie', label: t('inverters.list.types.gridTie') },
  { value: 'hybrid', label: t('inverters.list.types.hybrid') },
  { value: 'logger', label: t('inverters.list.types.logger') },
  { value: 'meter', label: t('inverters.list.types.meter') },
  { value: 'bess', label: t('inverters.list.types.bess') },
  { value: 'other', label: t('inverters.list.types.other') },
])

const deviceStatusOptions = computed(() => [
  { value: 'active', label: t('inverters.list.deviceStatuses.active') },
  { value: 'inactive', label: t('inverters.list.deviceStatuses.inactive') },
  { value: 'maintenance', label: t('inverters.list.deviceStatuses.maintenance') },
])

const filters = ref({
  search: '',
  model: '',
  type: '',
})

const inverters = ref<any[]>([])
const currentPage = ref(1)
const itemsPerPage = 20
const totalItems = ref(0)
const loading = ref(false)
const error = ref<string | null>(null)
const selectedInverters = ref<number[]>([])
const showEditModal = ref(false)
const editingInverter = ref<any>(null)
const inverterForm = ref({
  serial_number: '',
  model: '',
  type: '',
  power_rating: '',
  warranty_start_date: '',
  warranty_end_date: '',
  status: 'active',
  notes: '',
})

// CSV Import states
const showImportModal = ref(false)
const selectedFile = ref<File | null>(null)
const csvFileInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)
const importErrors = ref<string[]>([])
const importSuccess = ref(false)
const importedCount = ref(0)

// Fetch inverters from API
const fetchInverters = async () => {
  loading.value = true
  error.value = null
  try {
    const params: any = {
      page: currentPage.value,
      limit: itemsPerPage
    }
    if (filters.value.search) params.search = filters.value.search
    if (filters.value.model) params.model = filters.value.model
    if (filters.value.type) params.type = filters.value.type
    
    const queryString = new URLSearchParams(params).toString()
    const response = await apiClient.get(`/inverters?${queryString}`)
    
    if (response.error) {
      throw new Error(response.error)
    }
    
    const apiResponse = response.data as any
    const data = apiResponse?.data || []
    const pagination = apiResponse?.pagination || {}
    
    inverters.value = Array.isArray(data) ? data : []
    totalItems.value = pagination.total || 0
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('inverters.list.messages.loadError')
    console.error('Error fetching inverters:', err)
  } finally {
    loading.value = false
  }
}

// Load inverters on mount
onMounted(() => {
  fetchInverters()
})

// Refresh when component is activated (e.g., coming back from registering)
onActivated(() => {
  fetchInverters()
})

const getWarrantyStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  }
  return classes[status] || classes.pending
}

const getWarrantyStatusLabel = (status: string) => {
  const keyMap: Record<string, string> = {
    active: 'inverters.list.warrantyStatuses.active',
    expired: 'inverters.list.warrantyStatuses.expired',
    pending: 'inverters.list.warrantyStatuses.pending',
  }
  return keyMap[status] ? t(keyMap[status]) : status
}

const getTypeClass = (type: string | null | undefined) => {
  if (!type) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  const classes: Record<string, string> = {
    'grid-tie': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    hybrid: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    logger: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    meter: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    bess: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  }
  return classes[type] || classes.other
}

const getTypeLabel = (type: string | null | undefined) => {
  if (!type) return t('common.na')
  const keyMap: Record<string, string> = {
    'grid-tie': 'inverters.list.types.gridTie',
    hybrid: 'inverters.list.types.hybrid',
    logger: 'inverters.list.types.logger',
    meter: 'inverters.list.types.meter',
    bess: 'inverters.list.types.bess',
    other: 'inverters.list.types.other',
  }
  return keyMap[type] ? t(keyMap[type]) : type
}

const formatDate = (dateString: string | Date | null | undefined) => {
  if (!dateString) return t('common.na')
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  if (isNaN(date.getTime())) return t('common.na')
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

// Calculate warranty status from dates
const getWarrantyStatus = (inverter: any) => {
  if (!inverter.warranty_start_date) return 'pending'
  if (!inverter.warranty_end_date) return 'pending'
  
  const endDate = new Date(inverter.warranty_end_date)
  const now = new Date()
  
  if (now > endDate) return 'expired'
  return 'active'
}

const filteredInverters = computed(() => inverters.value)

// Pagination computed
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage))

const paginatedInverters = computed(() => inverters.value)

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

// Select all checkbox logic
const selectAll = computed(() => {
  return paginatedInverters.value.length > 0 && 
         paginatedInverters.value.every(inv => selectedInverters.value.includes(inv.id))
})

const toggleSelectAll = () => {
  if (selectAll.value) {
    // Deselect all on current page
    const currentIds = paginatedInverters.value.map(inv => inv.id)
    selectedInverters.value = selectedInverters.value.filter(id => !currentIds.includes(id))
  } else {
    // Select all on current page
    const currentIds = paginatedInverters.value.map(inv => inv.id)
    selectedInverters.value = [...new Set([...selectedInverters.value, ...currentIds])]
  }
}

// Bulk delete inverters
const bulkDeleteInverters = async () => {
  if (selectedInverters.value.length === 0) {
    return
  }

  const confirmed = confirm(
    `Bạn có chắc chắn muốn xóa ${selectedInverters.value.length} thiết bị đã chọn?\n\nLưu ý: Thiết bị có tickets liên quan sẽ được bỏ qua.`
  )

  if (!confirmed) {
    return
  }

  try {
    loading.value = true
    error.value = null

    const response = await apiClient.post('/inverters/bulk-delete', {
      ids: selectedInverters.value,
    })

    if (response.error) {
      throw new Error(response.error)
    }

    const { deleted = 0, skipped = 0, notFound = 0 } = (response.data || {}) as { deleted?: number; skipped?: number; notFound?: number }

    // Show result message
    let message = `✅ Đã xóa ${deleted} thiết bị thành công!`
    if (skipped > 0) {
      message += `\n⚠️ Bỏ qua ${skipped} thiết bị (có tickets liên quan)`
    }
    if (notFound > 0) {
      message += `\n❌ Không tìm thấy ${notFound} thiết bị`
    }
    alert(message)

    // Clear selection and reload
    selectedInverters.value = []
    await fetchInverters()
  } catch (err) {
    console.error('Bulk delete error:', err)
    error.value = err instanceof Error ? err.message : 'Lỗi khi xóa thiết bị'
  } finally {
    loading.value = false
  }
}

// Reset to page 1 when filters change
watch([() => filters.value.search, () => filters.value.model, () => filters.value.type], () => {
  currentPage.value = 1
  selectedInverters.value = [] // Clear selection when filters change
  fetchInverters()
})

// Fetch when page changes
watch(currentPage, () => {
  fetchInverters()
})

const applyFilters = () => {
  fetchInverters()
}

// Edit inverter
const editInverter = async (inverterId: number | undefined) => {
  if (!inverterId) {
    error.value = t('inverters.list.messages.notFound')
    return
  }
  
  try {
    loading.value = true
    error.value = null
    
    const response = await apiClient.get(`/inverters/${inverterId}`)
    if (response.error) {
      throw new Error(response.error)
    }
    
    const inverter = response.data as any
    editingInverter.value = inverter
    
    // Populate form
    inverterForm.value = {
      serial_number: inverter?.serial_number || '',
      model: inverter?.model || '',
      type: inverter?.type || '',
      power_rating: inverter?.power_rating || '',
      warranty_start_date: inverter?.warranty_start_date ? String(inverter.warranty_start_date).split('T')[0] : '',
      warranty_end_date: inverter?.warranty_end_date ? String(inverter.warranty_end_date).split('T')[0] : '',
      status: inverter?.status || 'active',
      notes: inverter?.notes || '',
    }
    
    showEditModal.value = true
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('inverters.list.messages.editError')
    console.error('Error fetching inverter:', err)
  } finally {
    loading.value = false
  }
}

// Close edit modal
const closeEditModal = () => {
  showEditModal.value = false
  editingInverter.value = null
  error.value = null
  inverterForm.value = {
    serial_number: '',
    model: '',
    type: '',
    power_rating: '',
    warranty_start_date: '',
    warranty_end_date: '',
    status: 'active',
    notes: '',
  }
}

// Save inverter (create or update)
const saveInverter = async () => {
  if (!inverterForm.value.serial_number || !inverterForm.value.model || !inverterForm.value.type) {
    error.value = t('inverters.list.messages.fillRequired')
    return
  }

  loading.value = true
  error.value = null

  try {
    const inverterData = {
      serial_number: inverterForm.value.serial_number,
      model: inverterForm.value.model,
      type: inverterForm.value.type,
      power_rating: inverterForm.value.power_rating || null,
      warranty_start_date: inverterForm.value.warranty_start_date || null,
      warranty_end_date: inverterForm.value.warranty_end_date || null,
      status: inverterForm.value.status,
      notes: inverterForm.value.notes || null,
    }

    if (editingInverter.value?.id) {
      // Update existing inverter
      const response = await apiClient.put(`/inverters/${editingInverter.value.id}`, inverterData)
      if (response.error) {
        throw new Error(response.error)
      }
      
      // Update in local list
      const index = inverters.value.findIndex((inv) => inv.id === editingInverter.value.id)
      if (index !== -1) {
        inverters.value[index] = response.data
      }
    } else {
      // Create new inverter (shouldn't happen from here, but handle just in case)
      const response = await apiClient.post('/inverters', inverterData)
      if (response.error) {
        throw new Error(response.error)
      }
      inverters.value.push(response.data)
    }

    closeEditModal()
    fetchInverters() // Refresh list
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('inverters.list.messages.saveError')
    console.error('Error saving inverter:', err)
  } finally {
    loading.value = false
  }
}

// Delete inverter
const deleteInverter = async (inverterId: number | undefined, serialNumber: string) => {
  if (!inverterId) {
    error.value = t('inverters.list.messages.notFound')
    return
  }
  
  if (!confirm(t('inverters.list.messages.deleteConfirm', { serial: serialNumber }))) {
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await apiClient.delete(`/inverters/${inverterId}`)
    if (response.error) {
      throw new Error(response.error)
    }

    // Remove from local list
    inverters.value = inverters.value.filter((inv) => inv.id !== inverterId)
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('inverters.list.messages.deleteError')
    console.error('Error deleting inverter:', err)
    alert(error.value)
  } finally {
    loading.value = false
  }
}

// CSV Import functions
const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
    importErrors.value = []
    importSuccess.value = false
  }
}

const parseCSV = (csvText: string): any[] => {
  const lines = csvText.split('\n').filter((line) => line.trim())
  if (lines.length < 2) return []

  // Simple CSV parser - handles quoted values
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    
    return result
  }

  const headers = parseCSVLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase())
  const inverters: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map((v) => v.replace(/^"|"$/g, '').trim())
    if (values.length !== headers.length) continue

    const inverter: any = {}
    headers.forEach((header, index) => {
      inverter[header] = values[index]
    })
    inverters.push(inverter)
  }

  return inverters
}

const processCSV = async () => {
  if (!selectedFile.value) return

  importing.value = true
  importErrors.value = []
  importSuccess.value = false
  importedCount.value = 0

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const csvText = e.target?.result as string
      const csvInverters = parseCSV(csvText)

      if (csvInverters.length === 0) {
        importErrors.value.push(t('inverters.list.messages.invalidCSV'))
        importing.value = false
        return
      }

      // Prepare inverters for import
      const invertersToImport = csvInverters.map((csvInverter, index) => {
        const rowNumber = index + 2
        const errors: string[] = []

        // Validate required fields
        if (!csvInverter.serial_number) {
          errors.push(t('inverters.list.messages.rowError', {
            row: rowNumber,
            error: t('inverters.list.messages.missingSerial')
          }))
        }
        if (!csvInverter.model) {
          errors.push(t('inverters.list.messages.rowError', {
            row: rowNumber,
            error: t('inverters.list.messages.missingModel')
          }))
        }

        // Validate type if provided
        if (csvInverter.type) {
          const validTypes = ['grid-tie', 'hybrid', 'logger', 'meter', 'bess', 'other']
          if (!validTypes.includes(csvInverter.type.toLowerCase())) {
            errors.push(t('inverters.list.messages.rowError', {
              row: rowNumber,
              error: t('inverters.list.messages.invalidType', {
                type: csvInverter.type,
                valid: validTypes.join(', ')
              })
            }))
          }
        }

        // Validate status if provided
        if (csvInverter.status) {
          const validStatuses = ['active', 'inactive', 'maintenance']
          if (!validStatuses.includes(csvInverter.status.toLowerCase())) {
            errors.push(t('inverters.list.messages.rowError', {
              row: rowNumber,
              error: t('inverters.list.messages.invalidStatus', {
                status: csvInverter.status,
                valid: validStatuses.join(', ')
              })
            }))
          }
        }

        if (errors.length > 0) {
          importErrors.value.push(...errors)
          return null
        }

        return {
          serial_number: csvInverter.serial_number,
          model: csvInverter.model,
          type: csvInverter.type?.toLowerCase() || undefined,
          power_rating: csvInverter.power_rating || undefined,
          installation_date: csvInverter.installation_date || undefined,
          warranty_start_date: csvInverter.warranty_start_date || undefined,
          warranty_end_date: csvInverter.warranty_end_date || undefined,
          customer_email: csvInverter.customer_email || undefined,
          customer_id: csvInverter.customer_id ? parseInt(csvInverter.customer_id) : undefined,
          status: csvInverter.status?.toLowerCase() || 'active',
          notes: csvInverter.notes || undefined,
        }
      }).filter((inv) => inv !== null) as any[]

      if (importErrors.value.length > 0) {
        importing.value = false
        return
      }

      // Call API to import inverters
      const result = await inverterService.importInverters(invertersToImport)
      
      if (result.errors && result.errors.length > 0) {
        importErrors.value.push(...result.errors)
      }
      
      importedCount.value = result.success
      importSuccess.value = true
      
      // Refresh inverters list
      await fetchInverters()
      
      // Reset form
      if (csvFileInput.value) {
        csvFileInput.value.value = ''
      }
      selectedFile.value = null

      // Auto close modal after 3 seconds
      setTimeout(() => {
        if (importSuccess.value) {
          showImportModal.value = false
        }
      }, 3000)
    } catch (error) {
      importErrors.value.push(t('inverters.list.messages.importError', {
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
      console.error('Error importing inverters:', error)
    } finally {
      importing.value = false
    }
  }

  reader.readAsText(selectedFile.value, 'UTF-8')
}

const downloadCSVTemplate = () => {
  const headers = ['serial_number', 'model', 'type', 'power_rating', 'installation_date', 'warranty_start_date', 'warranty_end_date', 'customer_email', 'status', 'notes']
  const example = [
    ['GW1234567890', 'MAX 10KTL3-X', 'grid-tie', '10kW', '2024-01-15', '2024-01-15', '2034-01-15', 'contact@abcsolar.vn', 'active', 'Ghi chú mẫu 1'],
    ['GW0987654321', 'MID 15KTL3-X', 'grid-tie', '15kW', '2024-02-20', '2024-02-20', '2034-02-20', 'nguyenvana@gmail.com', 'active', 'Ghi chú mẫu 2'],
    ['GW1122334455', 'SPH 6000', 'hybrid', '6kW', '2024-03-10', '2024-03-10', '2034-03-10', '', 'active', ''],
  ]

  const csvContent = [
    headers.join(','),
    ...example.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'template_import_inverters.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>
