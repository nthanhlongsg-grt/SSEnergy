<template>
  <admin-layout>
    <div class="px-4 sm:px-0 space-y-4 sm:space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('inverters.models.header.title') }}
          </h1>
          <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            {{ t('inverters.models.header.subtitle') }}
          </p>
        </div>
        <div class="hidden md:flex gap-2">
          <!-- Bulk Delete Button -->
          <button
            v-if="selectedIds.length > 0"
            @click="handleBulkDelete"
            :disabled="deleting"
            class="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[44px]"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            <span>{{ deleting ? 'Đang xóa...' : `Xóa ${selectedIds.length} models` }}</span>
          </button>
          <button
            @click="downloadTemplate"
            class="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors touch-manipulation min-h-[44px]"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{{ t('inverters.models.actions.downloadTemplate') }}</span>
          </button>
          <button
            @click="showImportModal = true"
            class="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors touch-manipulation min-h-[44px]"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>{{ t('inverters.models.actions.importCSV') }}</span>
          </button>
        <button
          @click="openAddModal"
          class="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation min-h-[44px]"
        >
          <PlusIcon class="h-5 w-5" />
          <span>{{ t('inverters.models.actions.addNew') }}</span>
        </button>
        </div>
        <!-- Mobile: Only Add New Button -->
        <div class="md:hidden">
          <button
            @click="openAddModal"
            class="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation min-h-[44px]"
          >
            <PlusIcon class="h-5 w-5" />
            <span>{{ t('inverters.models.actions.addNew') }}</span>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm"
      >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('inverters.models.filters.search') }}
            </label>
            <input
              v-model="filters.search"
              type="text"
              :placeholder="t('inverters.models.filters.searchPlaceholder')"
              @input="loadModels(1)"
              class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('inverters.models.filters.type') }}
            </label>
            <select
              v-model="filters.type"
              @change="loadModels(1)"
              class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
            >
              <option value="">{{ t('inverters.models.filters.all') }}</option>
              <option value="Hòa lưới">{{ t('inverters.models.types.gridTie') }}</option>
              <option value="Hybrid">{{ t('inverters.models.types.hybrid') }}</option>
              <option value="Logger">{{ t('inverters.models.types.logger') }}</option>
              <option value="Meter">{{ t('inverters.models.types.meter') }}</option>
              <option value="BESS">{{ t('inverters.models.types.bess') }}</option>
              <option value="Khác">{{ t('inverters.models.types.other') }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('inverters.models.filters.status') }}
            </label>
            <select
              v-model="filters.status"
              @change="loadModels(1)"
              class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
            >
              <option value="active">{{ t('inverters.models.status.active') }}</option>
              <option value="inactive">{{ t('inverters.models.status.inactive') }}</option>
              <option value="">{{ t('inverters.models.filters.all') }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Table - Desktop View -->
      <div
        class="hidden md:block rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div class="overflow-y-auto max-h-[600px]">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-6 py-3 w-12">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    @change="toggleSelectAll"
                    class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('inverters.models.table.modelName') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('inverters.models.table.type') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('inverters.models.table.description') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('inverters.models.table.capacity') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('inverters.models.table.status') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('inverters.models.table.createdDate') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('inverters.models.table.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr v-if="loading" class="text-center">
                <td colspan="8" class="px-6 py-4 text-gray-500 dark:text-gray-400">
                  {{ t('inverters.models.table.loading') }}
                </td>
              </tr>
              <tr v-else-if="models.length === 0" class="text-center">
                <td colspan="8" class="px-6 py-4 text-gray-500 dark:text-gray-400">
                  {{ t('inverters.models.table.noData') }}
                </td>
              </tr>
              <tr
                v-else
                v-for="model in models"
                :key="model.id"
                :class="[
                  'hover:bg-gray-50 dark:hover:bg-gray-700',
                  selectedIds.includes(model.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                ]"
              >
                <td class="px-6 py-4 w-12">
                  <input
                    type="checkbox"
                    :value="model.id"
                    v-model="selectedIds"
                    class="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ model.name }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="getTypeClass(model.type)"
                    class="px-2 py-1 text-xs font-medium rounded-full"
                  >
                    {{ getTypeLabel(model.type) }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                    {{ model.description || '-' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ model.capacity ? `${model.capacity} kW` : '-' }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span
                    :class="
                      model.status === 'active'
                        ? 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    "
                  >
                    {{ model.status === 'active' ? t('inverters.models.status.active') : t('inverters.models.status.inactive') }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(model.created_at) }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex gap-2">
                    <button
                      @click="editModel(model)"
                      class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {{ t('inverters.models.table.edit') }}
                    </button>
                    <button
                      v-if="model.status === 'active'"
                      @click="deleteModel(model)"
                      class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      {{ t('inverters.models.table.delete') }}
                    </button>
                    <button
                      v-else
                      @click="restoreModel(model)"
                      class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    >
                      {{ t('inverters.models.table.restore') }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div class="text-xs sm:text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
              {{ t('inverters.models.pagination.showing', {
                start: (currentPage - 1) * pageSize + 1,
                end: Math.min(currentPage * pageSize, total),
                total: total
              }) }}
            </div>
            <div class="flex items-center gap-2 flex-wrap justify-center">
              <button
                @click="loadModels(currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 touch-manipulation min-h-[44px] sm:min-h-0"
              >
                {{ t('inverters.models.pagination.previous') }}
              </button>
              <div class="flex gap-1">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="loadModels(page)"
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
                @click="loadModels(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 touch-manipulation min-h-[44px] sm:min-h-0"
              >
                {{ t('inverters.models.pagination.next') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden space-y-3">
        <!-- Loading State -->
        <div v-if="loading" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
          {{ t('inverters.models.table.loading') }}
        </div>

        <!-- Empty State -->
        <div v-else-if="models.length === 0" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
          {{ t('inverters.models.table.noData') }}
        </div>

        <!-- Model Cards -->
        <div
          v-for="model in models"
          :key="model.id"
          :class="[
            'rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm active:bg-gray-50 dark:active:bg-gray-700 touch-manipulation',
            selectedIds.includes(model.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''
          ]"
        >
          <!-- Header: Model Name, Checkbox -->
          <div class="flex justify-between items-start mb-3">
            <div class="flex-1 min-w-0">
              <h3 class="font-semibold text-gray-900 dark:text-white text-base truncate">
                {{ model.name }}
              </h3>
            </div>
            <div class="ml-2 flex-shrink-0" @click.stop>
              <input
                type="checkbox"
                :value="model.id"
                v-model="selectedIds"
                class="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 touch-manipulation"
              />
            </div>
          </div>

          <!-- Type and Status -->
          <div class="mb-3 flex items-center gap-2 flex-wrap">
            <span
              :class="getTypeClass(model.type)"
              class="px-2 py-1 text-xs font-medium rounded-full"
            >
              {{ getTypeLabel(model.type) }}
            </span>
            <span
              :class="
                model.status === 'active'
                  ? 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
              "
            >
              {{ model.status === 'active' ? t('inverters.models.status.active') : t('inverters.models.status.inactive') }}
            </span>
          </div>

          <!-- Description -->
          <div v-if="model.description" class="mb-3">
            <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
              {{ model.description }}
            </p>
          </div>

          <!-- Capacity and Created Date -->
          <div class="mb-3 space-y-2">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('inverters.models.table.capacity') }}</p>
              <p class="text-xs text-gray-900 dark:text-white">{{ model.capacity ? `${model.capacity} kW` : '-' }}</p>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('inverters.models.table.createdDate') }}</p>
              <p class="text-xs text-gray-900 dark:text-white">{{ formatDate(model.created_at) }}</p>
            </div>
          </div>

          <!-- Footer: Actions -->
          <div class="flex gap-2 pt-3 border-t border-gray-200 dark:border-gray-700" @click.stop>
            <button
              @click="editModel(model)"
              class="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 touch-manipulation min-h-[32px] flex items-center justify-center"
            >
              {{ t('inverters.models.table.edit') }}
            </button>
            <button
              v-if="model.status === 'active'"
              @click="deleteModel(model)"
              class="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 touch-manipulation min-h-[32px] flex items-center justify-center"
            >
              {{ t('inverters.models.table.delete') }}
            </button>
            <button
              v-else
              @click="restoreModel(model)"
              class="flex-1 px-3 py-1.5 text-xs font-medium text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 touch-manipulation min-h-[32px] flex items-center justify-center"
            >
              {{ t('inverters.models.table.restore') }}
            </button>
          </div>
        </div>

        <!-- Mobile Pagination -->
        <div v-if="totalPages > 1" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex flex-col items-center justify-between gap-3">
            <div class="text-xs text-gray-700 dark:text-gray-300 text-center">
              {{ t('inverters.models.pagination.showing', {
                start: (currentPage - 1) * pageSize + 1,
                end: Math.min(currentPage * pageSize, total),
                total: total
              }) }}
            </div>
            <div class="flex items-center gap-2 w-full">
              <button
                @click="loadModels(currentPage - 1)"
                :disabled="currentPage === 1"
                class="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 touch-manipulation min-h-[44px]"
              >
                {{ t('inverters.models.pagination.previous') }}
              </button>
              <div class="flex gap-1">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="loadModels(page)"
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
                @click="loadModels(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 touch-manipulation min-h-[44px]"
              >
                {{ t('inverters.models.pagination.next') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Import CSV Modal -->
      <div
        v-if="showImportModal"
        class="fixed inset-0 z-50 flex items-start justify-center bg-gray-700/45 dark:bg-gray-900/65 overflow-y-auto pt-4 pb-4 sm:pt-8 sm:pb-8 overflow-x-hidden p-4"
        @click.self="closeImportModal"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-w-[min(100vw-2rem,48rem)] mx-4 my-4 sm:my-8">
          <div class="p-4 sm:p-6 max-h-[calc(100vh-2rem)] sm:max-h-[85vh] overflow-y-auto overflow-x-hidden">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {{ t('inverters.models.modal.import.title') }}
              </h2>
              <button
                @click="closeImportModal"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Instructions -->
            <div class="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 class="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                {{ t('inverters.models.modal.import.instructions.title') }}
              </h3>
              <ul class="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>{{ t('inverters.models.modal.import.instructions.download') }}</li>
                <li>{{ t('inverters.models.modal.import.instructions.required') }}</li>
                <li>{{ t('inverters.models.modal.import.instructions.optional') }}</li>
                <li>{{ t('inverters.models.modal.import.instructions.statuses') }}</li>
                <li>{{ t('inverters.models.modal.import.instructions.types') }}</li>
              </ul>
            </div>

            <!-- File Input -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('inverters.models.modal.import.selectFile') }}
              </label>
              <input
                ref="csvFileInput"
                type="file"
                accept=".csv"
                @change="handleFileSelect"
                class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
              />
              <p v-if="selectedFileName" class="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {{ t('inverters.models.modal.import.selectedFile', { name: selectedFileName }) }}
              </p>
            </div>

            <!-- Download Template Button -->
            <div class="mb-4">
              <button
                @click="downloadTemplate"
                type="button"
                class="w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
              >
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>{{ t('inverters.models.modal.import.downloadTemplate') }}</span>
              </button>
            </div>

            <!-- Error Messages -->
            <div v-if="importErrors.length > 0" class="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h3 class="font-semibold text-red-900 dark:text-red-200 mb-2">
                {{ t('inverters.models.modal.import.errors') }}
              </h3>
              <ul class="text-sm text-red-800 dark:text-red-300 space-y-1 list-disc list-inside max-h-40 overflow-y-auto">
                <li v-for="(err, index) in importErrors" :key="index">{{ err }}</li>
              </ul>
            </div>

            <!-- Success Message -->
            <div v-if="importSuccessMessage" class="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p class="text-sm text-green-800 dark:text-green-200">
                {{ importSuccessMessage }}
              </p>
            </div>

            <!-- Actions -->
            <div class="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                @click="closeImportModal"
                type="button"
                class="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
              >
                {{ t('inverters.models.modal.import.close') }}
              </button>
              <button
                @click="processCSV"
                :disabled="!selectedFile || isImporting"
                type="button"
                class="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
              >
                {{ isImporting ? t('inverters.models.modal.import.importing') : t('inverters.models.modal.import.import') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div
        v-if="showModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-gray-700/45 dark:bg-gray-900/65 p-4"
        @click.self="closeModal"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div class="p-4 sm:p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {{ editingModel ? t('inverters.models.modal.titleEdit') : t('inverters.models.modal.titleAdd') }}
              </h2>
              <button
                @click="closeModal"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form @submit.prevent="saveModel" class="space-y-3 sm:space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('inverters.models.modal.name') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="modelForm.name"
                    type="text"
                    required
                    :disabled="editingModel"
                    :placeholder="t('inverters.models.modal.namePlaceholder')"
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('inverters.models.modal.type') }}
                  </label>
                  <select
                    v-model="modelForm.type"
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  >
                    <option value="">{{ t('inverters.models.modal.selectType') }}</option>
                    <option value="Hòa lưới">{{ t('inverters.models.types.gridTie') }}</option>
                    <option value="Hybrid">{{ t('inverters.models.types.hybrid') }}</option>
                    <option value="Logger">{{ t('inverters.models.types.logger') }}</option>
                    <option value="Meter">{{ t('inverters.models.types.meter') }}</option>
                    <option value="BESS">{{ t('inverters.models.types.bess') }}</option>
                    <option value="Khác">{{ t('inverters.models.types.other') }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('inverters.models.modal.capacity') }}
                  </label>
                  <input
                    v-model="modelForm.capacity"
                    type="number"
                    step="0.1"
                    min="0"
                    :placeholder="t('inverters.models.modal.capacityPlaceholder')"
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                </div>
                <div v-if="editingModel">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('inverters.models.modal.status') }}
                  </label>
                  <select
                    v-model="modelForm.status"
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  >
                    <option value="active">{{ t('inverters.models.status.active') }}</option>
                    <option value="inactive">{{ t('inverters.models.status.inactive') }}</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('inverters.models.modal.description') }}
                </label>
                <textarea
                  v-model="modelForm.description"
                  rows="3"
                  :placeholder="t('inverters.models.modal.descriptionPlaceholder')"
                  class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation text-base sm:text-sm"
                ></textarea>
              </div>

              <div v-if="error" class="text-sm sm:text-base text-red-600 dark:text-red-400">
                {{ error }}
              </div>

              <div class="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  @click="closeModal"
                  class="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  {{ t('inverters.models.modal.cancel') }}
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  {{ saving ? (editingModel ? t('inverters.models.modal.updating') : t('inverters.models.modal.creating')) : t('inverters.models.modal.save') }}
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
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { apiClient } from '@/services/api'
import { PlusIcon } from '@/icons'

const { t, locale } = useI18n()

const models = ref<any[]>([])
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const showModal = ref(false)
const editingModel = ref<any>(null)
const showImportModal = ref(false)
const selectedFile = ref<File | null>(null)
const selectedFileName = ref<string>('')
const csvFileInput = ref<HTMLInputElement | null>(null)
const isImporting = ref(false)
const importErrors = ref<string[]>([])
const importSuccessMessage = ref<string>('')

// Bulk delete
const selectedIds = ref<number[]>([])
const deleting = ref(false)

const currentPage = ref(1)
const totalPages = ref(1)
const total = ref(0)
const pageSize = 20

const filters = ref({
  search: '',
  type: '',
  status: 'active',
})

const modelForm = ref({
  name: '',
  manufacturer: '',
  type: '',
  description: '',
  capacity: null as number | null,
  status: 'active',
})

// Computed for select all checkbox
const isAllSelected = computed(() => {
  return models.value.length > 0 && selectedIds.value.length === models.value.length
})

// Toggle select all
const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = []
  } else {
    selectedIds.value = models.value.map(m => m.id)
  }
}

// Handle bulk delete
const handleBulkDelete = async () => {
  if (selectedIds.value.length === 0) return

  const confirmed = confirm(
    `Bạn có chắc muốn xóa ${selectedIds.value.length} models?\n\nLưu ý: Models sẽ được set thành "inactive" và có thể khôi phục sau.`
  )

  if (!confirmed) return

  try {
    deleting.value = true
    error.value = null

    const response = await apiClient.post('/models/bulk-delete', {
      ids: selectedIds.value
    })

    if (response.error) {
      throw new Error(response.error)
    }

    const result = response.data as any
    
    // Show success message
    alert(`Đã xóa thành công ${result.deleted} models!`)

    // Clear selection
    selectedIds.value = []

    // Reload data
    await loadModels(currentPage.value)
  } catch (err) {
    console.error('Bulk delete error:', err)
    error.value = err instanceof Error ? err.message : 'Không thể xóa models'
    alert(error.value)
  } finally {
    deleting.value = false
  }
}

const loadModels = async (page: number = 1) => {
  loading.value = true
  error.value = null
  currentPage.value = page
  try {
    const params = new URLSearchParams()
    if (filters.value.search) {
      params.append('search', filters.value.search)
    }
    if (filters.value.type) {
      params.append('type', filters.value.type)
    }
    if (filters.value.status) {
      params.append('status', filters.value.status)
    }
    params.append('page', page.toString())
    params.append('limit', pageSize.toString())

    const response = await apiClient.get(`/models?${params.toString()}`)
    if (response.error) {
      throw new Error(response.error)
    }
    
    const responseData = response.data as any
    if (responseData && responseData.data) {
      models.value = Array.isArray(responseData.data) ? responseData.data : []
      if (responseData.pagination) {
        currentPage.value = responseData.pagination.page || page
        totalPages.value = responseData.pagination.totalPages || 1
        total.value = responseData.pagination.total || 0
      }
    } else {
      // Fallback for old response format
      models.value = Array.isArray(responseData) ? responseData : []
    }
    
    // Clear selection when loading new page
    selectedIds.value = []
  } catch (err) {
    console.error('Error loading models:', err)
    error.value = err instanceof Error ? err.message : t('inverters.models.messages.loadError')
  } finally {
    loading.value = false
  }
}

const openAddModal = () => {
  editingModel.value = null
  modelForm.value = {
    name: '',
    manufacturer: '',
    type: '',
    description: '',
    capacity: null,
    status: 'active',
  }
  showModal.value = true
  error.value = null
}

const editModel = (model: any) => {
  editingModel.value = model
  modelForm.value = {
    name: model.name,
    manufacturer: model.manufacturer || '',
    type: model.type || '',
    description: model.description || '',
    capacity: model.capacity || null,
    status: model.status || 'active',
  }
  showModal.value = true
  error.value = null
}

const closeModal = () => {
  showModal.value = false
  editingModel.value = null
  modelForm.value = {
    name: '',
    manufacturer: '',
    type: '',
    description: '',
    capacity: null,
    status: 'active',
  }
  error.value = null
}

const saveModel = async () => {
  saving.value = true
  error.value = null

  try {
    if (editingModel.value) {
      // Update
      const response = await apiClient.put(`/models/${editingModel.value.id}`, modelForm.value)
      if (response.error) {
        throw new Error(response.error)
      }
    } else {
      // Create
      const response = await apiClient.post('/models', modelForm.value)
      if (response.error) {
        throw new Error(response.error)
      }
    }

    await loadModels(currentPage.value)
    closeModal()
  } catch (err) {
    console.error('Error saving model:', err)
    error.value = err instanceof Error ? err.message : t('inverters.models.messages.saveError')
  } finally {
    saving.value = false
  }
}

const deleteModel = async (model: any) => {
  if (!confirm(t('inverters.models.messages.deleteConfirm', { name: model.name }))) {
    return
  }

  try {
    const response = await apiClient.delete(`/models/${model.id}`)
    if (response.error) {
      throw new Error(response.error)
    }
    await loadModels(currentPage.value)
  } catch (err) {
    console.error('Error deleting model:', err)
    error.value = err instanceof Error ? err.message : t('inverters.models.messages.deleteError')
  }
}

const restoreModel = async (model: any) => {
  try {
    const response = await apiClient.put(`/models/${model.id}`, { status: 'active' })
    if (response.error) {
      throw new Error(response.error)
    }
    await loadModels(currentPage.value)
  } catch (err) {
    console.error('Error restoring model:', err)
    error.value = err instanceof Error ? err.message : t('inverters.models.messages.restoreError')
  }
}

const getTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    'Hòa lưới': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'Hybrid': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    'Logger': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Meter': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'BESS': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    'Khác': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  }
  return classes[type] || classes['Khác']
}

const getTypeLabel = (type: string) => {
  if (!type) return '-'
  const typeMap: Record<string, string> = {
    'Hòa lưới': t('inverters.models.types.gridTie'),
    'Hybrid': t('inverters.models.types.hybrid'),
    'Logger': t('inverters.models.types.logger'),
    'Meter': t('inverters.models.types.meter'),
    'BESS': t('inverters.models.types.bess'),
    'Khác': t('inverters.models.types.other'),
  }
  return typeMap[type] || type
}

const formatDate = (date: string) => {
  if (!date) return '-'
  const localeMap: Record<string, string> = {
    vi: 'vi-VN',
    en: 'en-US',
  }
  return new Date(date).toLocaleDateString(localeMap[locale.value] || 'vi-VN')
}

const visiblePages = computed(() => {
  const pages: number[] = []
  const maxVisible = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2))
  let end = Math.min(totalPages.value, start + maxVisible - 1)
  
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    selectedFile.value = file
    selectedFileName.value = file.name
    importErrors.value = []
    importSuccessMessage.value = ''
  }
}

const closeImportModal = () => {
  showImportModal.value = false
  selectedFile.value = null
  selectedFileName.value = ''
  if (csvFileInput.value) {
    csvFileInput.value.value = ''
  }
  importErrors.value = []
  importSuccessMessage.value = ''
}

const downloadTemplate = () => {
  const headers = ['name', 'type', 'description', 'manufacturer', 'capacity', 'status']
  const exampleRow = ['MAX 10KTL3-X', 'Hòa lưới', 'Grid-tie inverter 10kW', 'Growatt', '10', 'active']
  
  const csvContent = [
    headers.join(','),
    exampleRow.join(','),
  ].join('\n')
  
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'model_template.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

interface CsvModelRow {
  name?: string
  type?: string
  description?: string
  manufacturer?: string
  capacity?: string
  status?: string
}

const parseCSVLine = (line: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

const parseCSV = (csvText: string): CsvModelRow[] => {
  // Remove BOM if present and normalize line endings
  const cleanedCsvText = csvText.charCodeAt(0) === 0xFEFF ? csvText.slice(1) : csvText
  const lines = cleanedCsvText.split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return [] // Need at least header + 1 data row
  
  const headers = parseCSVLine(lines[0]).map((h) => h.replace(/^"|"$/g, '').trim().toLowerCase())
  const models: CsvModelRow[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map((v) => v.replace(/^"|"$/g, '').trim())
    // If values are fewer than headers, pad with empty strings
    while (values.length < headers.length) {
      values.push('')
    }
    if (values.length !== headers.length) continue // Should not happen with padding
    
    const model: CsvModelRow = {}
    headers.forEach((header, index) => {
      model[header as keyof CsvModelRow] = values[index]
    })
    models.push(model)
  }
  
  return models
}

const processCSV = async () => {
  if (!selectedFile.value) return
  
  isImporting.value = true
  importErrors.value = []
  importSuccessMessage.value = ''
  
  try {
    const text = await selectedFile.value.text()
    const csvModels = parseCSV(text)
    
    if (csvModels.length === 0) {
      importErrors.value.push(t('inverters.models.messages.csvFormat'))
      isImporting.value = false
      return
    }
    
    let successCount = 0
    const errors: string[] = []
    
    for (let i = 0; i < csvModels.length; i++) {
      const csvModel = csvModels[i]
      const rowNumber = i + 2 // +2 because row 1 is header
      const name = csvModel.name?.trim()
      
      if (!name) {
        errors.push(t('inverters.models.messages.csvRowError', { row: rowNumber }))
        continue
      }
      
      const modelData: any = {
        name,
        type: csvModel.type?.trim() || null,
        description: csvModel.description?.trim() || null,
        manufacturer: csvModel.manufacturer?.trim() || null,
        capacity: csvModel.capacity?.trim() ? parseFloat(csvModel.capacity.trim()) : null,
        status: csvModel.status?.trim().toLowerCase() || 'active',
      }
      
      // Validate status
      if (modelData.status && !['active', 'inactive'].includes(modelData.status)) {
        modelData.status = 'active'
      }
      
      // Validate capacity
      if (modelData.capacity !== null && (isNaN(modelData.capacity) || modelData.capacity < 0)) {
        modelData.capacity = null
      }
      
      try {
        const response = await apiClient.post('/models', modelData)
        if (response.error) {
          errors.push(t('inverters.models.messages.csvApiError', { row: rowNumber, error: response.error }))
        } else {
          successCount++
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error'
        errors.push(t('inverters.models.messages.csvApiError', { row: rowNumber, error: errorMessage }))
      }
    }
    
    importErrors.value = errors
    
    if (successCount > 0) {
      importSuccessMessage.value = t('inverters.models.messages.importSuccess', { count: successCount })
      await loadModels(1) // Reset to page 1 after import
    }
    
    if (errors.length > 0 && successCount > 0) {
      importSuccessMessage.value += ' ' + t('inverters.models.messages.importErrors', { errorCount: errors.length })
    }
  } catch (err) {
    console.error('Error processing CSV:', err)
    importErrors.value.push(t('inverters.models.messages.importError'))
  } finally {
    isImporting.value = false
  }
}

onMounted(() => {
  loadModels()
})
</script>

