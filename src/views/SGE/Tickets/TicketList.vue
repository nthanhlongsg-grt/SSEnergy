<template>
  <admin-layout>
    <div class="px-4 sm:px-0 space-y-4 sm:space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('tickets.list.header.title') }}
          </h1>
          <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            {{ t('tickets.list.header.subtitle') }}
          </p>
        </div>
        <div class="hidden md:flex flex-wrap gap-2">
          <!-- Bulk Delete Button (Dev only) -->
          <button
            v-if="isDev && selectedTickets.length > 0"
            @click="handleBulkDelete"
            class="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors touch-manipulation min-h-[44px] sm:min-h-0 text-sm sm:text-base"
            :disabled="deleting"
          >
            <span v-if="deleting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            <span v-else>
              <svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </span>
            <span class="hidden sm:inline">{{ t('tickets.list.actions.delete') }} ({{ selectedTickets.length }})</span>
            <span class="sm:hidden">{{ t('tickets.list.actions.delete') }}</span>
          </button>

          <button
            @click="showImportModal = true"
            class="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors touch-manipulation min-h-[44px] sm:min-h-0 text-sm sm:text-base"
          >
            <svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span class="hidden sm:inline">{{ t('tickets.list.actions.import') }}</span>
          </button>
          <button
            @click="downloadCSVTemplate"
            class="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 active:bg-purple-800 transition-colors touch-manipulation min-h-[44px] sm:min-h-0 text-sm sm:text-base"
          >
            <svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span class="hidden sm:inline">{{ t('tickets.list.actions.downloadTemplate') }}</span>
            <span class="sm:hidden">{{ t('tickets.list.actions.downloadTemplate').split(' ')[0] }}</span>
          </button>
          <router-link
            to="/tickets/new"
            class="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation min-h-[44px] sm:min-h-0 text-sm sm:text-base"
          >
            <PlusIcon class="h-4 w-4 sm:h-5 sm:w-5" />
            <span>{{ t('tickets.list.actions.create') }}</span>
          </router-link>
        </div>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 sm:p-4"
      >
        <p class="text-sm sm:text-base text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading && tickets.length === 0" class="flex justify-center items-center py-12">
        <div class="text-sm sm:text-base text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</div>
      </div>

      <!-- Stats Cards -->
      <div v-if="!loading || tickets.length > 0" class="hidden md:grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-5">
        <!-- Stats Card Components -->
        <div
          @click="filters.status = 'initialized'"
          :class="[
            'rounded-lg p-3 sm:p-4 border cursor-pointer transition-colors touch-manipulation active:scale-95',
            filters.status === 'initialized'
              ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ t('tickets.list.metrics.initialized') }}</p>
              <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.initialized }}
              </p>
            </div>
            <div class="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0 ml-2">
              <span class="text-blue-600 dark:text-blue-400 text-xs sm:text-sm font-bold">
                {{ t('tickets.list.metrics.badges.initialized') }}
              </span>
            </div>
          </div>
        </div>
        <div
          @click="filters.status = 'in_progress'"
          :class="[
            'rounded-lg p-3 sm:p-4 border cursor-pointer transition-colors touch-manipulation active:scale-95',
            filters.status === 'in_progress'
              ? 'bg-purple-50 border-purple-200 dark:bg-purple-900/20 dark:border-purple-800'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ t('tickets.list.metrics.inProgress') }}</p>
              <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.in_progress }}
              </p>
            </div>
            <div class="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0 ml-2">
              <span class="text-purple-600 dark:text-purple-400 text-xs sm:text-sm font-bold">
                {{ t('tickets.list.metrics.badges.inProgress') }}
              </span>
            </div>
          </div>
        </div>
        <div
          @click="filters.status = 'pending'"
          :class="[
            'rounded-lg p-3 sm:p-4 border cursor-pointer transition-colors touch-manipulation active:scale-95',
            filters.status === 'pending'
              ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ t('tickets.list.metrics.pending') }}</p>
              <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.pending }}
              </p>
            </div>
            <div class="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center flex-shrink-0 ml-2">
              <span class="text-yellow-600 dark:text-yellow-400 text-xs sm:text-sm font-bold">
                {{ t('tickets.list.metrics.badges.pending') }}
              </span>
            </div>
          </div>
        </div>
        <div
          @click="filters.status = 'closed'"
          :class="[
            'rounded-lg p-3 sm:p-4 border cursor-pointer transition-colors touch-manipulation active:scale-95',
            filters.status === 'closed'
              ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ t('tickets.list.metrics.closed') }}</p>
              <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.closed }}
              </p>
            </div>
            <div class="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0 ml-2">
              <span class="text-green-600 dark:text-green-400 text-xs sm:text-sm font-bold">
                {{ t('tickets.list.metrics.badges.closed') }}
              </span>
            </div>
          </div>
        </div>
        <div
          @click="filters.status = ''"
          :class="[
            'rounded-lg p-3 sm:p-4 border cursor-pointer transition-colors touch-manipulation active:scale-95',
            filters.status === ''
              ? 'bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-800'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ t('tickets.list.metrics.all') }}</p>
              <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.total }}
              </p>
            </div>
            <div class="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-100 dark:bg-gray-900 flex items-center justify-center flex-shrink-0 ml-2">
              <span class="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-bold">
                {{ t('tickets.list.metrics.badges.all') }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm"
      >
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3 sm:gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('tickets.list.filters.searchLabel') }}
            </label>
            <input
              v-model="filters.search"
              type="text"
              :placeholder="t('tickets.list.filters.searchPlaceholder')"
              class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
              @input="applyFilters"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('tickets.list.filters.statusLabel') }}
            </label>
            <select
              v-model="filters.status"
              class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
              @change="applyFilters"
            >
              <option
                v-for="option in statusFilterOptions"
                :key="option.value || 'all'"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('tickets.list.filters.priorityLabel') }}
            </label>
            <select
              v-model="filters.priority"
              class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
              @change="applyFilters"
            >
              <option
                v-for="option in priorityFilterOptions"
                :key="option.value || 'all'"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('tickets.list.filters.slaStatusLabel') }}
            </label>
            <select
              v-model="filters.slaStatus"
              class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
              @change="applyFilters"
            >
              <option
                v-for="option in slaStatusFilterOptions"
                :key="option.value || 'all'"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
          </div>
          <div class="flex items-end gap-2">
            <button
              @click="clearFilters"
              class="flex-1 px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors touch-manipulation min-h-[44px] sm:min-h-0 text-sm sm:text-base"
            >
              {{ t('tickets.list.filters.clear') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tickets Table - Desktop View -->
      <div
        class="hidden md:block rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div class="overflow-y-auto max-h-[600px] overflow-x-hidden">
          <table class="w-full" style="table-layout: fixed; width: 100%;">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <!-- Checkbox Header -->
                <th v-if="isDev" class="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    v-model="selectAll"
                    class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('tickets.list.table.columns.code') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('tickets.list.table.columns.title') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('tickets.list.table.columns.createdDate') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('tickets.list.table.columns.customer') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('tickets.list.table.columns.modelSerial') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('tickets.list.table.columns.status') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('tickets.list.table.columns.priority') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('tickets.list.table.columns.technician') }}
                </th>
                <th
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {{ t('tickets.list.table.columns.sla') }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                v-for="ticket in tickets"
                :key="ticket.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                @click="$router.push(`/tickets/${ticket.id}`)"
              >
                <!-- Checkbox Cell -->
                <td v-if="isDev" class="px-4 py-4" @click.stop>
                  <input
                    type="checkbox"
                    v-model="selectedTickets"
                    :value="ticket.id"
                    class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                </td>
                <td class="px-4 py-4 break-words">
                  <span class="font-medium text-blue-600 dark:text-blue-400">
                    {{ ticket.ticket_number }}
                  </span>
                </td>
                <td class="px-4 py-4 break-words">
                  <p class="text-sm font-medium text-gray-900 dark:text-white" :title="ticket.title">
                    {{ ticket.title }}
                  </p>
                </td>
                <td class="px-4 py-4 break-words text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {{ ticket.created_at ? formatDate(ticket.created_at) : 'N/A' }}
                </td>
                <td class="px-4 py-4 break-words">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ ticket.customer_name || t('common.na') }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ ticket.customer_email || '' }}
                    </p>
                  </div>
                </td>
                <td class="px-4 py-4 break-words">
                  <div>
                    <p class="text-sm text-gray-900 dark:text-white">{{ ticket.inverter_model || t('common.na') }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ ticket.inverter_serial || '' }}
                    </p>
                  </div>
                </td>
                <td class="px-4 py-4 break-words">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      getStatusClass(ticket.status),
                    ]"
                  >
                    {{ getStatusLabel(ticket.status) }}
                  </span>
                </td>
                <td class="px-4 py-4 break-words">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      getPriorityClass(ticket.priority),
                    ]"
                  >
                    {{ getPriorityLabel(ticket.priority) }}
                  </span>
                </td>
                <td class="px-4 py-4 break-words text-sm text-gray-500 dark:text-gray-400">
                  {{ ticket.assigned_to_name || t('tickets.list.unassigned') }}
                </td>
                <td class="px-4 py-4 break-words">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      getSLAStatusClass(ticket),
                    ]"
                  >
                    {{ getSLAStatusLabel(ticket) }}
                  </span>
                </td>
                <td class="px-4 py-4 break-words text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                  {{ ticket.created_at ? formatDateTime(ticket.created_at) : 'N/A' }}
                </td>
              </tr>
              <tr v-if="tickets.length === 0 && !loading">
                <td :colspan="isDev ? 10 : 9" class="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  {{ t('tickets.list.table.empty') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div class="text-xs sm:text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
              {{
                t('tickets.list.pagination.summary', {
                  from: (currentPage - 1) * itemsPerPage + 1,
                  to: Math.min(currentPage * itemsPerPage, totalItems),
                  total: totalItems,
                })
              }}
            </div>
            <div class="flex items-center gap-2 flex-wrap justify-center">
              <button
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 touch-manipulation min-h-[44px] sm:min-h-0"
              >
                {{ t('tickets.list.pagination.prev') }}
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
                {{ t('tickets.list.pagination.next') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden space-y-3">
        <!-- Loading State -->
        <div v-if="loading && tickets.length === 0" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
          {{ t('common.loading') }}
        </div>

        <!-- Empty State -->
        <div v-else-if="tickets.length === 0 && !loading" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
          {{ t('tickets.list.table.empty') }}
        </div>

        <!-- Ticket Cards -->
        <div
          v-for="ticket in tickets"
          :key="ticket.id"
          @click="$router.push(`/tickets/${ticket.id}`)"
          :class="[
            'rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm active:bg-gray-50 dark:active:bg-gray-700 cursor-pointer touch-manipulation',
            isSLAOverdue(ticket) ? 'border-l-4 border-l-red-500' : '',
            isApproachingDeadline(ticket) ? 'border-l-4 border-l-yellow-500' : '',
          ]"
        >
          <!-- Header: Ticket Number, Status, Checkbox -->
          <div class="flex justify-between items-start mb-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-semibold text-blue-600 dark:text-blue-400 text-base truncate">
                  {{ ticket.ticket_number }}
                </h3>
                <span
                  :class="[
                    'px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap',
                    getStatusClass(ticket.status),
                  ]"
                >
                  {{ getStatusLabel(ticket.status) }}
                </span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ ticket.created_at ? formatDate(ticket.created_at) : 'N/A' }}
              </p>
            </div>
            <div v-if="isDev" class="ml-2 flex-shrink-0" @click.stop>
              <input
                type="checkbox"
                v-model="selectedTickets"
                :value="ticket.id"
                class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 w-5 h-5 touch-manipulation"
              />
            </div>
          </div>

          <!-- Title -->
          <div class="mb-3">
            <p class="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
              {{ ticket.title }}
            </p>
          </div>

          <!-- Customer Info -->
          <div class="mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-gray-900 dark:text-white truncate">{{ ticket.customer_name || t('common.na') }}</p>
              <p v-if="ticket.customer_email" class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ ticket.customer_email }}</p>
            </div>
          </div>

          <!-- Device Info -->
          <div class="mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-gray-900 dark:text-white truncate">{{ ticket.inverter_model || t('common.na') }}</p>
              <p v-if="ticket.inverter_serial" class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ ticket.inverter_serial }}</p>
            </div>
          </div>

          <!-- Footer: Priority, Technician, SLA -->
          <div class="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <span
              :class="[
                'px-2 py-1 text-xs font-semibold rounded-full',
                getPriorityClass(ticket.priority),
              ]"
            >
              {{ getPriorityLabel(ticket.priority) }}
            </span>
            <span class="text-xs text-gray-500 dark:text-gray-400 truncate flex-1 min-w-0">
              {{ ticket.assigned_to_name || t('tickets.list.unassigned') }}
            </span>
            <span
              :class="[
                'px-2 py-1 text-xs font-semibold rounded-full',
                getSLAStatusClass(ticket),
              ]"
            >
              {{ getSLAStatusLabel(ticket) }}
            </span>
          </div>
        </div>

        <!-- Mobile Pagination -->
        <div v-if="totalPages > 1" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex flex-col items-center justify-between gap-3">
            <div class="text-xs text-gray-700 dark:text-gray-300 text-center">
              {{
                t('tickets.list.pagination.summary', {
                  from: (currentPage - 1) * itemsPerPage + 1,
                  to: Math.min(currentPage * itemsPerPage, totalItems),
                  total: totalItems,
                })
              }}
            </div>
            <div class="flex items-center gap-2 w-full">
              <button
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                class="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 touch-manipulation min-h-[44px]"
              >
                {{ t('tickets.list.pagination.prev') }}
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
                {{ t('tickets.list.pagination.next') }}
              </button>
            </div>
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
              <h2 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {{ t('tickets.list.importModal.title') }}
              </h2>
              <button
                @click="showImportModal = false"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('tickets.list.importModal.fileLabel') }}
              </label>
              <input
                ref="csvFileInput"
                type="file"
                accept=".csv"
                @change="handleFileSelect"
                class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
              />
              <p class="mt-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                {{ t('tickets.list.importModal.fileHelp') }}
              </p>
            </div>
            <div v-if="importErrors.length > 0" class="mb-4 p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h3 class="font-medium text-red-800 dark:text-red-200 mb-2 text-sm sm:text-base">{{ t('tickets.list.importModal.errorsTitle') }}:</h3>
              <ul class="list-disc list-inside text-xs sm:text-sm text-red-700 dark:text-red-300 max-h-40 overflow-y-auto">
                <li v-for="(error, index) in importErrors" :key="index">{{ error }}</li>
              </ul>
            </div>
            <div v-if="importSuccess" class="mb-4 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p class="text-sm sm:text-base text-green-800 dark:text-green-200">
                {{ t('tickets.list.importModal.success', { count: importedCount }) }}
              </p>
            </div>
            <div class="flex flex-col sm:flex-row justify-end gap-3">
              <button
                @click="showImportModal = false"
                class="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 active:bg-gray-400 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:active:bg-gray-500 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
              >
                {{ t('tickets.list.importModal.close') }}
              </button>
              <button
                @click="processCSV"
                :disabled="!selectedFile || importing"
                class="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
              >
                {{ importing ? t('tickets.list.importModal.submitting') : t('tickets.list.importModal.submit') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, onActivated } from 'vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useChangeDetection } from '@/composables/useChangeDetection'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { PlusIcon } from '../../../icons'
import { ticketService } from '@/services/ticketService'
import { useAuth, UserRole } from '@/composables/useAuth'
import { useSlaSettings } from '@/composables/useSlaSettings'
import { formatDate, formatDateTime } from '@/utils/dateTime'

const filters = ref({
  search: '',
  status: '',
  priority: '',
  slaStatus: '',
})

const showImportModal = ref(false)
const selectedFile = ref<File | null>(null)
const csvFileInput = ref<HTMLInputElement | null>(null)
const importErrors = ref<string[]>([])
const importSuccess = ref(false)
const importedCount = ref(0)
const importing = ref(false)
const { getSlaHoursByPriority } = useSlaSettings()

const loading = ref(false)
const deleting = ref(false)
const error = ref<string | null>(null)
const router = useRouter()
const { t } = useI18n()
const { hasRole } = useAuth()

const stats = ref<{
  total: number
  initialized: number
  in_progress: number
  pending: number
  closed: number
}>({
  total: 0,
  initialized: 0,
  in_progress: 0,
  pending: 0,
  closed: 0,
})

const tickets = ref<any[]>([])
const currentPage = ref(1)
const itemsPerPage = 20
const totalItems = ref(0)
const selectedTickets = ref<number[]>([])

// Check if user is DEV
const isDev = computed(() => {
  try {
    return hasRole(UserRole.DEV)
  } catch {
    return false
  }
})

// Select All computed property
const selectAll = computed({
  get: () => tickets.value.length > 0 && tickets.value.every(t => selectedTickets.value.includes(t.id)),
  set: (value) => {
    if (value) {
      const newIds = tickets.value.map(t => t.id)
      selectedTickets.value = [...new Set([...selectedTickets.value, ...newIds])]
    } else {
      const pageIds = tickets.value.map(t => t.id)
      selectedTickets.value = selectedTickets.value.filter(id => !pageIds.includes(id))
    }
  }
})

// Handle bulk delete
const handleBulkDelete = async () => {
  if (selectedTickets.value.length === 0) return
  
  if (!confirm(t('common.deleteConfirm') || `Bạn có chắc chắn muốn xóa ${selectedTickets.value.length} ticket đã chọn?`)) {
    return
  }

  deleting.value = true
  error.value = null

  try {
    await ticketService.bulkDeleteTickets(selectedTickets.value)
    selectedTickets.value = []
    await fetchTickets()
    await fetchStats()
  } catch (err) {
    console.error('Error bulk deleting tickets:', err)
    error.value = err instanceof Error ? err.message : 'Lỗi khi xóa ticket'
  } finally {
    deleting.value = false
  }
}

// Fetch tickets from API
const fetchTickets = async () => {
  loading.value = true
  error.value = null
  try {
    const params: any = {
      page: currentPage.value,
      limit: itemsPerPage
    }
    if (filters.value.status) params.status = filters.value.status
    if (filters.value.priority) params.priority = filters.value.priority
    if (filters.value.search) params.search = filters.value.search
    if (filters.value.slaStatus) params.sla_status = filters.value.slaStatus

    const response = await ticketService.getAllTickets(params)
    // Backend already sorts by created_at DESC, so we use tickets as-is
    tickets.value = response.data
    
    // Update pagination info
    if (response.pagination) {
      totalItems.value = response.pagination.total
    } else {
      // Fallback if pagination info not present (should not happen with updated backend)
      totalItems.value = tickets.value.length
    }
    
    // Clear selection on page change if needed, or keep it (keeping it is often better UX)
    // But here we uncheck selectAll visually if not all items on new page are selected
    
    // Fetch stats separately for accurate counts
    await fetchStats()
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('tickets.list.messages.fetchError')
    console.error('Error fetching tickets:', err)
  } finally {
    loading.value = false
  }
}

// Fetch stats from API
const fetchStats = async () => {
  try {
    const statsData = await ticketService.getTicketStats()
    // Map API response to expected stats structure
    stats.value = {
      total: statsData.total || 0,
      initialized: statsData.new || 0,
      in_progress: statsData.in_progress || 0,
      pending: statsData.assigned || 0, // Use 'assigned' as pending
      closed: statsData.closed || 0,
    }
  } catch (err) {
    console.error('Error fetching ticket stats:', err)
  }
}

// Pagination computed
const totalPages = computed(() => Math.ceil(totalItems.value / itemsPerPage))

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

// Watch for page change
watch(currentPage, () => {
  fetchTickets()
})

// Reset to page 1 when filters change
watch([() => filters.value.search, () => filters.value.status, () => filters.value.priority, () => filters.value.slaStatus], () => {
  currentPage.value = 1
  fetchTickets()
})

// Debounce search separately is handled by the generic watch above, but let's be specific for search input delay
let searchTimeout: any = null
const onSearchInput = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchTickets()
  }, 500)
}

// Check if user can delete tickets (dev only)
const canDelete = computed(() => {
  try {
    return hasRole(UserRole.DEV)
  } catch {
    return false
  }
})

// Confirm and delete ticket
const confirmDeleteTicket = (ticket: any) => {
  if (!ticket) return
  if (confirm(t('tickets.list.messages.confirmDelete', { code: ticket.ticket_number }))) {
    deleteTicket(ticket)
  }
}

// Delete ticket
const deleteTicket = async (ticket: any) => {
  if (!ticket) return

  deleting.value = true
  error.value = null

  try {
    await ticketService.deleteTicket(ticket.id)
    await fetchTickets()
    await fetchStats()
  } catch (err) {
    console.error('Error deleting ticket:', err)
    error.value = err instanceof Error ? err.message : t('tickets.list.messages.deleteError')
  } finally {
    deleting.value = false
  }
}

const getStatusClass = (status: string) => {
  const classes = {
    initialized: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    closed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    // Support old statuses for backward compatibility
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    assigned: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    waiting_parts: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }
  return classes[status as keyof typeof classes] || classes.initialized
}

const STATUS_LABEL_KEYS: Record<string, string> = {
  initialized: 'tickets.list.statusLabels.initialized',
  in_progress: 'tickets.list.statusLabels.in_progress',
  pending: 'tickets.list.statusLabels.pending',
  closed: 'tickets.list.statusLabels.closed',
  new: 'tickets.list.statusLabels.new',
  assigned: 'tickets.list.statusLabels.in_progress', // Map assigned to in_progress
  waiting_parts: 'tickets.list.statusLabels.in_progress', // Map waiting_parts to in_progress
  completed: 'tickets.list.statusLabels.closed', // Map completed to closed
}

const PRIORITY_LABEL_KEYS: Record<string, string> = {
  high: 'tickets.list.priorityLabels.high',
  medium: 'tickets.list.priorityLabels.medium',
  low: 'tickets.list.priorityLabels.low',
}

const statusFilterOptions = computed(() => [
  { value: '', label: t('tickets.list.filters.all') },
  { value: 'initialized', label: t('tickets.list.statusOptions.initialized') },
  { value: 'in_progress', label: t('tickets.list.statusOptions.in_progress') },
  { value: 'pending', label: t('tickets.list.statusOptions.pending') },
  { value: 'closed', label: t('tickets.list.statusOptions.closed') },
])

const priorityFilterOptions = computed(() => [
  { value: '', label: t('tickets.list.filters.all') },
  { value: 'high', label: t('tickets.list.priorityOptions.high') },
  { value: 'medium', label: t('tickets.list.priorityOptions.medium') },
  { value: 'low', label: t('tickets.list.priorityOptions.low') },
])

const slaStatusFilterOptions = computed(() => [
  { value: '', label: t('tickets.list.filters.all') },
  { value: 'overdue', label: t('tickets.list.filters.slaStatus.overdue') },
  { value: 'on_time', label: t('tickets.list.filters.slaStatus.remaining') },
  { value: 'completed', label: t('tickets.list.filters.slaStatus.completed') },
])

const getStatusLabel = (status: string) => {
  const key = STATUS_LABEL_KEYS[status] || STATUS_LABEL_KEYS.initialized
  return t(key)
}

const getPriorityClass = (priority: string) => {
  const classes: Record<string, string> = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }
  return classes[priority] || classes.medium
}

const getPriorityLabel = (priority: string) => {
  const key = PRIORITY_LABEL_KEYS[priority] || PRIORITY_LABEL_KEYS.medium
  return t(key)
}

const getSLAStatusClass = (ticket: any) => {
  if (!ticket.sla_deadline) {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  const now = new Date()
  const deadline = new Date(ticket.sla_deadline)
  const diffMs = deadline.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  // Quá hạn
  if (diffMs < 0 && ticket.status !== 'closed' && ticket.status !== 'completed') {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  // Đã đóng hoặc hoàn thành
  if (ticket.status === 'closed' || ticket.status === 'completed') {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }

  // Sắp hết hạn (còn dưới 20% thời gian, ít nhất 4 giờ)
  const totalHours = getSlaHoursByPriority(ticket.priority)
  const remainingPercent = (diffHours / totalHours) * 100
  
  if (remainingPercent <= 20 && diffHours > 0) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  }

  // Trong thời gian
  return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
}

const getSLAStatusLabel = (ticket: any) => {
  if (!ticket.sla_deadline) {
    return t('dashboard.sla.notAvailable')
  }

  const now = new Date()
  const deadline = new Date(ticket.sla_deadline)
  const diffMs = deadline.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  // Quá hạn
  if (diffMs < 0 && ticket.status !== 'closed' && ticket.status !== 'completed') {
    const overdueHours = Math.abs(diffHours)
    if (overdueHours < 24) {
      return t('dashboard.sla.overdueHours', { value: Math.round(overdueHours) })
    }
    return t('dashboard.sla.overdueDays', { value: Math.round(overdueHours / 24) })
  }

  // Đã đóng hoặc hoàn thành
  if (ticket.status === 'closed' || ticket.status === 'completed') {
    return t('dashboard.sla.completed')
  }

  // Sắp hết hạn
  const totalHours = getSlaHoursByPriority(ticket.priority)
  const remainingPercent = (diffHours / totalHours) * 100
  
  if (remainingPercent <= 20 && diffHours > 0) {
    if (diffHours < 24) {
      return t('dashboard.sla.remainingHours', { value: Math.round(diffHours) })
    }
    return t('dashboard.sla.remainingDays', { value: Math.round(diffHours / 24) })
  }

  // Trong thời gian
  if (diffHours < 24) {
    return t('dashboard.sla.remainingHours', { value: Math.round(diffHours) })
  }
  return t('dashboard.sla.remainingDays', { value: Math.round(diffHours / 24) })
}


const isSLAOverdue = (ticket: any) => {
  if (!ticket.sla_deadline) return false
  const now = new Date()
  const deadline = new Date(ticket.sla_deadline)
  return deadline.getTime() < now.getTime() && ticket.status !== 'closed' && ticket.status !== 'completed'
}

const isApproachingDeadline = (ticket: any) => {
  if (!ticket.sla_deadline) return false
  if (ticket.status === 'closed' || ticket.status === 'completed') return false
  
  const now = new Date()
  const deadline = new Date(ticket.sla_deadline)
  const diffMs = deadline.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  
  if (diffMs < 0) return false // Already overdue
  
  const totalHours = getSlaHoursByPriority(ticket.priority)
  const remainingPercent = (diffHours / totalHours) * 100
  
  return remainingPercent <= 20 && diffHours > 0
}

// Get SLA category for filtering and sorting
const getSLACategory = (ticket: any): 'overdue' | 'remaining' | 'completed' | 'no_sla' => {
  if (!ticket.sla_deadline) {
    return 'no_sla'
  }
  
  // Đã đóng hoặc hoàn thành
  if (ticket.status === 'closed' || ticket.status === 'completed') {
    return 'completed'
  }
  
  const now = new Date()
  const deadline = new Date(ticket.sla_deadline)
  const diffMs = deadline.getTime() - now.getTime()
  
  // Quá hạn
  if (diffMs < 0) {
    return 'overdue'
  }
  
  // Còn hạn
  return 'remaining'
}


const applyFilters = () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    fetchTickets()
  }, 500)
}

const clearFilters = () => {
  filters.value = {
    search: '',
    status: '',
    priority: '',
    slaStatus: '',
  }
  // Watchers will trigger fetch
}

// File handling and CSV Import functions (kept as is)
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
  const tickets: any[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]).map((v) => v.replace(/^"|"$/g, '').trim())
    if (values.length !== headers.length) continue

    const ticket: any = {}
    headers.forEach((header, index) => {
      ticket[header] = values[index]
    })
    tickets.push(ticket)
  }

  return tickets
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
      const csvTickets = parseCSV(csvText)

      if (csvTickets.length === 0) {
        importErrors.value.push(t('tickets.list.importErrors.noData'))
        importing.value = false
        return
      }

      // Prepare tickets for import
      const ticketsToImport = csvTickets.map((csvTicket, index) => {
        const rowNumber = index + 2
        const errors: string[] = []

        // Validate required fields
        if (!csvTicket.customer_email && !csvTicket.customer_id) {
          errors.push(t('tickets.list.importErrors.missingCustomer', { row: rowNumber }))
        }
        if (!csvTicket.title) {
          errors.push(t('tickets.list.importErrors.missingTitle', { row: rowNumber }))
        }

        // Validate priority
        if (csvTicket.priority && !['urgent', 'high', 'medium', 'low'].includes(csvTicket.priority.toLowerCase())) {
          errors.push(t('tickets.list.importErrors.invalidPriority', { row: rowNumber }))
        }

        if (errors.length > 0) {
          importErrors.value.push(...errors)
          return null
        }

        return {
          customer_email: csvTicket.customer_email,
          customer_id: csvTicket.customer_id ? parseInt(csvTicket.customer_id) : undefined,
          title: csvTicket.title,
          description: csvTicket.description || '',
          priority: (csvTicket.priority || 'medium').toLowerCase(),
          category: csvTicket.category || '',
          inverter_serial: csvTicket.inverter_serial,
        }
      }).filter((t) => t !== null) as any[]

      if (importErrors.value.length > 0) {
        importing.value = false
        return
      }

      // Call API to import tickets
      const result = await ticketService.importTickets(ticketsToImport)
      
      if (result.errors && result.errors.length > 0) {
        importErrors.value.push(...result.errors)
      }
      
      importedCount.value = result.success
      importSuccess.value = true
      
      // Refresh tickets list and stats
      await fetchTickets()
      
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
        const message = error instanceof Error ? error.message : 'Unknown error'
        importErrors.value.push(t('tickets.list.importErrors.generic', { message }))
      console.error('Error importing tickets:', error)
    } finally {
      importing.value = false
    }
  }

  reader.readAsText(selectedFile.value, 'UTF-8')
}

const downloadCSVTemplate = () => {
  const headers = ['customer_email', 'title', 'description', 'priority', 'category', 'inverter_serial']
  const example = [
    ['customer1@SGE.vn', 'Inverter không khởi động', 'Inverter không khởi động sau khi mất điện', 'high', 'Bảo hành', 'INV-2024-001'],
    ['customer2@SGE.vn', 'Lỗi hiển thị LCD', 'Màn hình LCD không hiển thị thông tin', 'medium', 'Sửa chữa', 'INV-2024-002'],
    ['customer3@SGE.vn', 'Quạt làm mát không chạy', 'Quạt làm mát không hoạt động, inverter quá nóng', 'urgent', 'Bảo hành', 'INV-2024-003'],
  ]

  const csvContent = [
    headers.join(','),
    ...example.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', 'ticket_import_template.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Load tickets on component mount and when filters change
onMounted(() => {
  fetchTickets()
})

// Refresh when component is activated (e.g., coming back from creating ticket)
onActivated(() => {
  fetchTickets()
})

// Fallback polling mỗi 30s (dự phòng nếu change detection miss)
const { stop: stopAutoRefresh } = useAutoRefresh({
  interval: 30000,
  fetchFn: async () => {
    if (!loading.value) await fetchTickets()
  },
  pauseWhenHidden: true,
})

onUnmounted(() => {
  stopAutoRefresh()
})

// Change detection: refresh ngay khi có ticket mới/cập nhật (poll 5s nhẹ)
useChangeDetection({
  onTicketChange: async () => {
    if (!loading.value) await fetchTickets()
  },
})
</script>
