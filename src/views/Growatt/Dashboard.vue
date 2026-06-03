<template>
  <admin-layout>
    <div class="px-4 sm:px-0 space-y-3 sm:space-y-4 overflow-x-hidden">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('dashboard.header.title') }}
          </h1>
        </div>
      </div>

      <!-- Error Alert -->
      <div
        v-if="error"
        class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 sm:p-4"
      >
        <p class="text-sm sm:text-base text-red-800 dark:text-red-200">{{ error || t('dashboard.alerts.loadFailed') }}</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-sm sm:text-base text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</div>
      </div>

      <!-- Summary Cards -->
      <div v-if="!loading" class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- Tickets Quá hạn -->
        <button
          type="button"
          :title="t('dashboard.summaryCards.clickToFilter')"
          :class="[
            'rounded-lg bg-white dark:bg-gray-800 p-3 sm:p-4 shadow-sm text-left w-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
            ticketSlaBucket === 'overdue'
              ? 'ring-2 ring-brand-500 border border-brand-500'
              : 'border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700',
          ]"
          @click="toggleTicketSlaFilter('overdue')"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ t('dashboard.summaryCards.ticketsOverdue') }}</p>
              <p class="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
                {{ summaryStats.ticketsOverdue }}
              </p>
            </div>
            <div
              class="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 flex-shrink-0 ml-2 pointer-events-none"
            >
              <ErrorIcon class="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </button>

        <!-- Tickets Sắp hết hạn -->
        <button
          type="button"
          :title="t('dashboard.summaryCards.clickToFilter')"
          :class="[
            'rounded-lg bg-white dark:bg-gray-800 p-3 sm:p-4 shadow-sm text-left w-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
            ticketSlaBucket === 'approaching'
              ? 'ring-2 ring-brand-500 border border-brand-500'
              : 'border border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700',
          ]"
          @click="toggleTicketSlaFilter('approaching')"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ t('dashboard.summaryCards.ticketsApproaching') }}</p>
              <p class="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {{ summaryStats.ticketsApproaching }}
              </p>
            </div>
            <div
              class="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900 flex-shrink-0 ml-2 pointer-events-none"
            >
              <WarningIcon class="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </button>

        <!-- Tasks Quá hạn -->
        <button
          type="button"
          :title="t('dashboard.summaryCards.clickToFilter')"
          :class="[
            'rounded-lg bg-white dark:bg-gray-800 p-3 sm:p-4 shadow-sm text-left w-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
            taskSlaBucket === 'overdue'
              ? 'ring-2 ring-brand-500 border border-brand-500'
              : 'border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700',
          ]"
          @click="toggleTaskSlaFilter('overdue')"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ t('dashboard.summaryCards.tasksOverdue') }}</p>
              <p class="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400">
                {{ summaryStats.tasksOverdue }}
              </p>
            </div>
            <div
              class="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 flex-shrink-0 ml-2 pointer-events-none"
            >
              <TaskIcon class="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </button>

        <!-- Tasks Sắp hết hạn -->
        <button
          type="button"
          :title="t('dashboard.summaryCards.clickToFilter')"
          :class="[
            'rounded-lg bg-white dark:bg-gray-800 p-3 sm:p-4 shadow-sm text-left w-full transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
            taskSlaBucket === 'approaching'
              ? 'ring-2 ring-brand-500 border border-brand-500'
              : 'border border-yellow-200 dark:border-yellow-800 hover:border-yellow-300 dark:hover:border-yellow-700',
          ]"
          @click="toggleTaskSlaFilter('approaching')"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ t('dashboard.summaryCards.tasksApproaching') }}</p>
              <p class="mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                {{ summaryStats.tasksApproaching }}
              </p>
            </div>
            <div
              class="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900 flex-shrink-0 ml-2 pointer-events-none"
            >
              <TaskIcon class="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </button>
      </div>

      <!-- Tickets Table Section -->
      <div v-if="!loading" id="dashboard-tickets-section" class="space-y-3 scroll-mt-4">
        <!-- Tickets Table with Filters -->
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
        >
          <!-- Title -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ t('dashboard.table.title') }}
            </h3>
          </div>

          <!-- Filters -->
          <div class="px-3 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-2">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('dashboard.filters.searchLabel') }}
                </label>
                <input
                  v-model="ticketFilters.search"
                  type="text"
                  :placeholder="t('dashboard.filters.searchPlaceholder')"
                  class="w-full px-3 py-2 sm:py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0"
                  @input="applyTicketFilters"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('dashboard.filters.priorityLabel') }}
                </label>
                <select
                  v-model="ticketFilters.priority"
                  class="w-full px-3 py-2 sm:py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0"
                  @change="applyTicketFilters"
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
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('dashboard.taskFilters.technicianLabel') }}
                </label>
                <select
                  v-model="ticketFilters.technicianId"
                  class="w-full px-3 py-2 sm:py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0"
                  @change="applyTicketFilters"
                >
                  <option
                    v-for="option in ticketTechnicianFilterOptions"
                    :key="option.value || 'all'"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
              <div class="flex items-end gap-2 sm:col-span-1 xl:col-span-1">
                <button
                  @click="clearTicketFilters"
                  class="flex-1 px-3 py-2 sm:py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  {{ t('dashboard.filters.clear') }}
                </button>
              </div>
            </div>
          </div>
          <!-- Desktop Table View -->
          <div class="hidden md:block overflow-x-auto overflow-y-auto max-h-[500px]">
            <table class="w-full" style="min-width: 1000px;">
              <thead class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
                <tr>
                  <th
                    class="px-3 py-2 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider whitespace-nowrap w-[140px]"
                  >
                    {{ t('dashboard.table.columns.code') }}
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider min-w-[150px]"
                  >
                    {{ t('dashboard.table.columns.title') }}
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider whitespace-nowrap w-[140px]"
                  >
                    {{ t('dashboard.table.columns.customer') }}
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider whitespace-nowrap w-[140px]"
                  >
                    {{ t('dashboard.table.columns.modelSerial') }}
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider whitespace-nowrap w-[110px]"
                  >
                    {{ t('dashboard.table.columns.status') }}
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider whitespace-nowrap w-[100px]"
                  >
                    {{ t('dashboard.table.columns.priority') }}
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider whitespace-nowrap w-[130px]"
                  >
                    {{ t('dashboard.table.columns.technician') }}
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider whitespace-nowrap w-[120px]"
                  >
                    {{ t('dashboard.table.columns.sla') }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="ticket in sortedAndPaginatedTickets"
                  :key="ticket.id"
                  :class="[
                    'hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer',
                    isSLAOverdue(ticket) ? 'border-l-4 border-red-500 bg-red-50/50 dark:bg-red-900/10' : '',
                    isApproachingDeadline(ticket) ? 'border-l-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10' : '',
                  ]"
                  @click="$router.push(`/tickets/${ticket.id}`)"
                >
                  <td class="px-3 py-2 whitespace-nowrap">
                    <span class="text-sm font-medium text-blue-600 dark:text-blue-400 truncate block" :title="ticket.ticket_number">
                      {{ ticket.ticket_number }}
                    </span>
                  </td>
                  <td class="px-3 py-2">
                    <p class="text-sm font-medium text-gray-900 dark:text-white break-words whitespace-normal max-w-[250px]">
                      {{ ticket.title || t('common.na') }}
                    </p>
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap">
                    <div class="min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate" :title="ticket.customer_name">
                        {{ ticket.customer_name || t('common.na') }}
                      </p>
                      <p v-if="ticket.customer_email" class="text-xs text-gray-500 dark:text-gray-400 truncate" :title="ticket.customer_email">
                        {{ ticket.customer_email }}
                      </p>
                    </div>
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap">
                    <div class="min-w-0">
                      <p class="text-sm text-gray-900 dark:text-white truncate" :title="ticket.inverter_model">{{ ticket.inverter_model || t('common.na') }}</p>
                      <p v-if="ticket.inverter_serial" class="text-xs text-gray-500 dark:text-gray-400 truncate" :title="ticket.inverter_serial">
                        {{ ticket.inverter_serial }}
                      </p>
                    </div>
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap">
                    <span
                      :class="[
                        'px-2 py-1 text-xs font-semibold rounded-full inline-block',
                        getStatusClass(ticket.status),
                      ]"
                    >
                      {{ getStatusLabel(ticket.status) }}
                    </span>
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap">
                    <span
                      :class="[
                        'px-2 py-1 text-xs font-semibold rounded-full inline-block',
                        getPriorityClass(ticket.priority),
                      ]"
                    >
                      {{ getPriorityLabel(ticket.priority) }}
                    </span>
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap">
                    <span class="text-sm text-gray-500 dark:text-gray-400 truncate block" :title="ticket.assigned_to_name">
                      {{ ticket.assigned_to_name || t('dashboard.tickets.unassigned') }}
                    </span>
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap">
                    <span
                      :class="[
                        'px-2 py-1 text-xs font-semibold rounded-full inline-block',
                        getSLAStatusClass(ticket),
                      ]"
                    >
                      {{ getSLAStatusLabel(ticket) }}
                    </span>
                  </td>
                </tr>
                <tr v-if="filteredTickets.length === 0 && !loadingTickets">
                  <td colspan="8" class="px-4 py-6 text-center">
                    <div class="flex flex-col items-center justify-center gap-2 py-8">
                      <p class="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        {{ t('dashboard.table.empty') }}
                      </p>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ t('dashboard.table.emptyHint') }}
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Card View -->
          <div class="md:hidden p-3 sm:p-4 space-y-3 max-h-[500px] overflow-y-auto">
            <div v-if="filteredTickets.length === 0 && !loadingTickets" class="text-center py-8">
              <p class="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {{ t('dashboard.table.empty') }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ t('dashboard.table.emptyHint') }}
              </p>
            </div>
            <div
              v-for="ticket in sortedAndPaginatedTickets"
              :key="ticket.id"
              @click="$router.push(`/tickets/${ticket.id}`)"
              :class="[
                'rounded-lg border p-3 active:bg-gray-50 dark:active:bg-gray-700 cursor-pointer touch-manipulation',
                isSLAOverdue(ticket) ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10' : '',
                isApproachingDeadline(ticket) ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
              ]"
            >
              <!-- Header: Ticket Number and Status -->
              <div class="flex justify-between items-start mb-2">
                <div class="flex-1 min-w-0">
                  <h4 class="font-semibold text-blue-600 dark:text-blue-400 text-sm truncate">
                    {{ ticket.ticket_number }}
                  </h4>
                </div>
                <span
                  :class="[
                    'px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ml-2',
                    getStatusClass(ticket.status),
                  ]"
                >
                  {{ getStatusLabel(ticket.status) }}
                </span>
              </div>

              <!-- Title -->
              <div class="mb-2">
                <p class="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                  {{ ticket.title || t('common.na') }}
                </p>
              </div>

              <!-- Customer Info -->
              <div class="mb-2 flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-gray-900 dark:text-white truncate">{{ ticket.customer_name || t('common.na') }}</p>
                  <p v-if="ticket.customer_email" class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ ticket.customer_email }}</p>
                </div>
              </div>

              <!-- Device Info -->
              <div class="mb-2 flex items-center gap-2">
                <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
                <div class="min-w-0 flex-1">
                  <p class="text-xs text-gray-900 dark:text-white truncate">{{ ticket.inverter_model || t('common.na') }}</p>
                  <p v-if="ticket.inverter_serial" class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ ticket.inverter_serial }}</p>
                </div>
              </div>

              <!-- Footer: Priority, Technician, SLA -->
              <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <span
                  :class="[
                    'px-2 py-1 text-xs font-semibold rounded-full',
                    getPriorityClass(ticket.priority),
                  ]"
                >
                  {{ getPriorityLabel(ticket.priority) }}
                </span>
                <span class="text-xs text-gray-500 dark:text-gray-400 truncate flex-1 min-w-0">
                  {{ ticket.assigned_to_name || t('dashboard.tickets.unassigned') }}
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
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-2">
            <div class="text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
              {{
                t('dashboard.pagination.summary', {
                  from: (currentPage - 1) * pageSize + 1,
                  to: Math.min(currentPage * pageSize, totalTickets),
                  total: totalTickets,
                })
              }}
            </div>
            <div class="flex gap-2 flex-wrap justify-center">
              <button
                @click="changePage(currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ t('dashboard.pagination.prev') }}
              </button>
              <div class="flex gap-1">
                <button
                  v-for="page in visiblePages"
                  :key="page"
                  @click="changePage(page)"
                  :class="[
                    'px-3 py-2 border rounded-lg transition-colors',
                    page === currentPage
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
                  ]"
                >
                  {{ page }}
                </button>
              </div>
              <button
                @click="changePage(currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ t('dashboard.pagination.next') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Tasks Table Section -->
      <div v-if="!loading" id="dashboard-tasks-section" class="space-y-3 scroll-mt-4">
        <!-- Tasks Table with Filters -->
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
        >
          <!-- Title -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              {{ t('dashboard.tasksTable.title') }}
            </h3>
          </div>

          <!-- Task Filters -->
          <div class="px-3 sm:px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('dashboard.taskFilters.searchLabel') }}
                </label>
                <input
                  v-model="taskFilters.search"
                  type="text"
                  :placeholder="t('dashboard.taskFilters.searchPlaceholder')"
                  class="w-full px-3 py-2 sm:py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0"
                  @input="applyTaskFilters"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('dashboard.taskFilters.technicianLabel') }}
                </label>
                <select
                  v-model="taskFilters.technicianId"
                  class="w-full px-3 py-2 sm:py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0"
                  @change="applyTaskFilters"
                >
                  <option
                    v-for="option in technicianFilterOptions"
                    :key="option.value || 'all'"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
              <div class="flex items-end gap-2 sm:col-span-1 lg:col-span-1">
                <button
                  @click="clearTaskFilters"
                  class="flex-1 px-3 py-2 sm:py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  {{ t('dashboard.taskFilters.clear') }}
                </button>
              </div>
            </div>
          </div>
          <!-- Desktop Table View -->
          <div class="hidden md:block overflow-x-auto overflow-y-auto max-h-[500px]">
            <table class="w-full" style="min-width: 900px;">
              <thead class="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800">
                <tr>
                  <th
                    class="px-4 py-3 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider min-w-[200px]"
                  >
                    {{ t('dashboard.tasksTable.columns.title') }}
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider whitespace-nowrap"
                  >
                    {{ t('dashboard.tasksTable.columns.technician') }}
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider whitespace-nowrap"
                  >
                    {{ t('dashboard.tasksTable.columns.createdDate') }}
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider whitespace-nowrap"
                  >
                    {{ t('dashboard.tasksTable.columns.deadline') }}
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider whitespace-nowrap"
                  >
                    {{ t('dashboard.tasksTable.columns.daysRemaining') }}
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider whitespace-nowrap"
                  >
                    {{ t('dashboard.tasksTable.columns.assignedBy') }}
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider whitespace-nowrap"
                  >
                    {{ t('dashboard.tasksTable.columns.status') }}
                  </th>
                  <th
                    class="px-4 py-3 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider whitespace-nowrap"
                  >
                    {{ t('dashboard.tasksTable.columns.ticket') }}
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="task in sortedTasks"
                  :key="task.id"
                  :class="[
                    'cursor-pointer',
                    isTaskOverdue(task)
                      ? 'border-l-4 border-red-500 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100/50 dark:hover:bg-red-900/20'
                      : isTaskApproachingDeadline(task)
                      ? 'border-l-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10 hover:bg-yellow-100/50 dark:hover:bg-yellow-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700',
                  ]"
                  @click="$router.push(`/tasks/${task.id}`)"
                >
                  <td class="px-4 py-3">
                    <span class="text-sm font-medium text-blue-600 dark:text-blue-400 break-words">
                      {{ task.title || t('common.na') }}
                    </span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span class="max-w-xs truncate block" :title="task.technician_name">
                      {{ task.technician_name || t('common.na') }}
                    </span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {{ task.created_at ? formatDate(task.created_at) : t('common.na') }}
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <span v-if="task.schedule_date">
                      {{ formatDate(task.schedule_date) }}
                    </span>
                    <span v-else>{{ t('common.na') }}</span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span
                      v-if="calculateDaysRemaining(task) !== null"
                      :class="[
                        'px-2 py-1 text-xs font-semibold rounded-full',
                        isTaskOverdue(task)
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : calculateDaysRemaining(task)! <= 3
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                      ]"
                    >
                      {{ getDaysRemainingText(task) }}
                    </span>
                    <span v-else class="text-sm text-gray-400">{{ t('common.na') }}</span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <span class="max-w-xs truncate block" :title="task.created_by_name">
                      {{ task.created_by_name || t('common.na') }}
                    </span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span
                      :class="[
                        'px-2 py-1 text-xs font-semibold rounded-full',
                        getTaskStatusClass(task.status),
                      ]"
                    >
                      {{ getTaskStatusLabel(task.status) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap">
                    <span v-if="task.ticket_number" class="text-sm font-medium text-blue-600 dark:text-blue-400">
                      #{{ task.ticket_number }}
                    </span>
                    <span v-else class="text-sm text-gray-400">{{ t('common.na') }}</span>
                  </td>
                </tr>
                <tr v-if="sortedTasks.length === 0 && !loadingTasks">
                  <td colspan="8" class="px-4 py-6 text-center">
                    <div class="flex flex-col items-center justify-center gap-2 py-8">
                      <p class="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        {{ t('dashboard.tasksTable.empty') }}
                      </p>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ t('dashboard.tasksTable.emptyHint') }}
                      </p>
                    </div>
                  </td>
                </tr>
                <tr v-if="loadingTasks">
                  <td colspan="8" class="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    {{ t('common.loading') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile Card View -->
          <div class="md:hidden p-3 sm:p-4 space-y-3 max-h-[500px] overflow-y-auto">
            <div v-if="sortedTasks.length === 0 && !loadingTasks" class="text-center py-8">
              <p class="text-base font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {{ t('dashboard.tasksTable.empty') }}
              </p>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ t('dashboard.tasksTable.emptyHint') }}
              </p>
            </div>
            <div v-if="loadingTasks" class="text-center py-8 text-gray-500 dark:text-gray-400">
              {{ t('common.loading') }}
            </div>
            <div
              v-for="task in sortedTasks"
              :key="task.id"
              @click="$router.push(`/tasks/${task.id}`)"
              :class="[
                'rounded-lg border p-3 active:bg-gray-50 dark:active:bg-gray-700 cursor-pointer touch-manipulation',
                isTaskOverdue(task) ? 'border-red-500 bg-red-50/50 dark:bg-red-900/10' : '',
                isTaskApproachingDeadline(task) ? 'border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800',
              ]"
            >
              <!-- Header: Title and Status -->
              <div class="flex justify-between items-start mb-2">
                <h4 class="text-sm font-medium text-blue-600 dark:text-blue-400 flex-1 min-w-0 line-clamp-2">
                  {{ task.title || t('common.na') }}
                </h4>
                <span
                  :class="[
                    'px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ml-2',
                    getTaskStatusClass(task.status),
                  ]"
                >
                  {{ getTaskStatusLabel(task.status) }}
                </span>
              </div>

              <!-- Technician and Assigned By -->
              <div class="mb-2 space-y-1">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span class="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {{ task.technician_name || t('common.na') }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-xs text-gray-600 dark:text-gray-400 truncate">
                    {{ t('dashboard.tasksTable.columns.assignedBy') }}: {{ task.created_by_name || t('common.na') }}
                  </span>
                </div>
              </div>

              <!-- Dates -->
              <div class="mb-2 space-y-1">
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span class="text-xs text-gray-600 dark:text-gray-400">
                    {{ t('dashboard.tasksTable.columns.createdDate') }}: {{ task.created_at ? formatDate(task.created_at) : t('common.na') }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span class="text-xs text-gray-600 dark:text-gray-400">
                    {{ t('dashboard.tasksTable.columns.deadline') }}: {{ task.schedule_date ? formatDate(task.schedule_date) : t('common.na') }}
                  </span>
                </div>
              </div>

              <!-- Footer: Days Remaining, Ticket -->
              <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <span
                  v-if="calculateDaysRemaining(task) !== null"
                  :class="[
                    'px-2 py-1 text-xs font-semibold rounded-full',
                    isTaskOverdue(task)
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : calculateDaysRemaining(task)! <= 3
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                  ]"
                >
                  {{ getDaysRemainingText(task) }}
                </span>
                <span v-else class="text-xs text-gray-400">{{ t('common.na') }}</span>
                <span v-if="task.ticket_number" class="text-xs font-medium text-blue-600 dark:text-blue-400 ml-auto">
                  #{{ task.ticket_number }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts and Tables Row -->
      <div v-if="!loading" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useChangeDetection } from '@/composables/useChangeDetection'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import {
  ChatIcon,
  BoxCubeIcon,
  WarningIcon,
  UserCircleIcon,
  ErrorIcon,
  PlusIcon,
  CalenderIcon,
  TaskIcon,
} from '../../icons'
import { apiClient } from '@/services/api'
import { formatDateTime } from '@/utils/dateTime'
import { ticketService } from '@/services/ticketService'
import { scheduleService } from '@/services/scheduleService'
import VueApexCharts from 'vue3-apexcharts'
import { useRouter } from 'vue-router'
import { hasPermission, Permission, hasAnyRole, UserRole, getUser } from '@/composables/useAuth'
import { useSlaSettings } from '@/composables/useSlaSettings'

const { t, locale } = useI18n()
const router = useRouter()

const { getSlaHoursByPriority } = useSlaSettings()

const loading = ref(false)
const error = ref('')

const metrics = ref({
  totalTickets: 0,
  activeTickets: 0,
  totalInverters: 0,
  warrantyActive: 0,
  pendingTickets: 0,
  activeTechnicians: 0,
  techniciansOnsite: 0,
})

const topIssues = ref<Array<{ model: string | null; count: number }>>([])

const tickets = ref<any[]>([])
const loadingTickets = ref(false)
const totalTickets = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)

const tasks = ref<any[]>([])
const loadingTasks = ref(false)
const technicians = ref<any[]>([])

const taskFilters = ref({
  search: '',
  technicianId: '',
})

const ticketFilters = ref({
  search: '',
  priority: '',
  technicianId: '',
})

/** Lọc theo thẻ tổng quan SLA (click card ticket) */
const ticketSlaBucket = ref<null | 'overdue' | 'approaching'>(null)
/** Lọc theo thẻ tổng quan deadline task (click card task) */
const taskSlaBucket = ref<null | 'overdue' | 'approaching'>(null)

const ticketsByStatus = ref<Array<{ status: string; count: number }>>([])
const ticketStatusSeries = ref<number[]>([])
const ticketStatusLabels = ref<string[]>([])

const STATUS_LABEL_KEYS: Record<string, string> = {
  initialized: 'dashboard.statusLabels.initialized',
  new: 'dashboard.statusLabels.new',
  assigned: 'dashboard.statusLabels.assigned',
  in_progress: 'dashboard.statusLabels.in_progress',
  waiting_parts: 'dashboard.statusLabels.waiting_parts',
  completed: 'dashboard.statusLabels.completed',
  closed: 'dashboard.statusLabels.closed',
}

const PRIORITY_LABEL_KEYS: Record<string, string> = {
  high: 'dashboard.priorityLabels.high',
  medium: 'dashboard.priorityLabels.medium',
  low: 'dashboard.priorityLabels.low',
}

const statusFilterOptions = computed(() => [
  { value: '', label: t('dashboard.filters.statusAll') },
  { value: 'initialized', label: t('dashboard.statusLabels.initialized') },
  { value: 'in_progress', label: t('dashboard.statusLabels.in_progress') },
  { value: 'closed', label: t('dashboard.statusLabels.closed') },
])

const priorityFilterOptions = computed(() => [
  { value: '', label: t('dashboard.filters.priorityAll') },
  { value: 'high', label: t('dashboard.priorityLabels.high') },
  { value: 'medium', label: t('dashboard.priorityLabels.medium') },
  { value: 'low', label: t('dashboard.priorityLabels.low') },
])

const ticketTechnicianFilterOptions = computed(() => {
  const options = [{ value: '', label: t('dashboard.taskFilters.technicianAll') }]
  technicians.value.forEach((tech) => {
    options.push({ value: tech.id.toString(), label: tech.name })
  })
  return options
})

const technicianFilterOptions = computed(() => {
  const options = [{ value: '', label: t('dashboard.taskFilters.technicianAll') }]
  technicians.value.forEach((tech) => {
    options.push({ value: tech.id.toString(), label: tech.name })
  })
  return options
})

const taskStatusFilterOptions = computed(() => [
  { value: '', label: t('dashboard.taskFilters.statusAll') },
  { value: 'scheduled', label: t('technicians.schedule.statusOptions.scheduled') },
  { value: 'in_progress', label: t('technicians.schedule.statusOptions.inProgress') },
  { value: 'completed', label: t('technicians.schedule.statusOptions.completed') },
  { value: 'cancelled', label: t('technicians.schedule.statusOptions.cancelled') },
])

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    initialized: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    assigned: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    waiting_parts:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  }
  return classes[status] || classes.initialized
}

const getStatusLabel = (status: string) => {
  const key = STATUS_LABEL_KEYS[status]
  return key ? t(key) : status
}

const formatDate = (dateString: string | Date) => {
  return formatDateTime(dateString, false)
}

const loadDashboardData = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await apiClient.get('/dashboard/stats')
    if (response.error) {
      throw new Error(response.error)
    }

    if (response.data) {
      const data = response.data as any

      // Update metrics
      if (data.metrics) {
        metrics.value = {
          totalTickets: data.metrics.totalTickets || 0,
          activeTickets: data.metrics.activeTickets || 0,
          totalInverters: data.metrics.totalInverters || 0,
          warrantyActive: data.metrics.warrantyActive || 0,
          pendingTickets: data.metrics.pendingTickets || 0,
          activeTechnicians: data.metrics.activeTechnicians || 0,
          techniciansOnsite: data.metrics.techniciansOnsite || 0,
        }
      }

      // Update top issues (tickets by model)
      if (data.top_issues) {
        topIssues.value = data.top_issues.map((issue: any) => ({
          model: issue.model,
          count: issue.count || 0,
        }))
      }

      // Update tickets by status for chart
      if (data.tickets_by_status) {
        ticketsByStatus.value = data.tickets_by_status
        updateTicketStatusChart()
      }
    }

    // Auto-filter tickets for TECHNICIAN role
    const currentUser = getUser.value
    if (currentUser && currentUser.role === UserRole.TECHNICIAN) {
      // Automatically filter tickets to show only those assigned to this technician
      ticketFilters.value.technicianId = currentUser.id.toString()
    }

    // Load statistics data for summary cards
    await loadStatistics()
    // Load tickets separately with pagination
    await loadTickets()
    // Load technicians for task filters
    await loadTechnicians()
    // Load tasks
    await loadTasks()
  } catch (err) {
    console.error('Error loading dashboard data:', err)
    error.value = err instanceof Error ? err.message : t('dashboard.alerts.loadFailed')
  } finally {
    loading.value = false
  }
}

const loadTickets = async () => {
  loadingTickets.value = true
  
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value,
    }
    
    if (ticketFilters.value.search) params.search = ticketFilters.value.search
    if (ticketFilters.value.priority) params.priority = ticketFilters.value.priority
    if (ticketFilters.value.technicianId) params.assigned_to = ticketFilters.value.technicianId

    const response = await ticketService.getAllTickets(params)
    tickets.value = response.data || []
    
    // Get total count from pagination response
    if (response.pagination) {
      totalTickets.value = response.pagination.total || tickets.value.length
    }
  } catch (err) {
    console.error('Error loading tickets:', err)
    tickets.value = []
  } finally {
    loadingTickets.value = false
  }
}

const applyTicketFilters = () => {
  currentPage.value = 1
  loadTickets()
}

const clearTicketFilters = () => {
  ticketFilters.value = {
    search: '',
    priority: '',
    technicianId: '',
  }
  ticketSlaBucket.value = null
  applyTicketFilters()
}

const clearTaskFilters = () => {
  taskFilters.value = {
    search: '',
    technicianId: '',
  }
  taskSlaBucket.value = null
  applyTaskFilters()
}

const toggleTicketSlaFilter = (bucket: 'overdue' | 'approaching') => {
  ticketSlaBucket.value = ticketSlaBucket.value === bucket ? null : bucket
  nextTick(() => {
    document.getElementById('dashboard-tickets-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  })
}

const toggleTaskSlaFilter = (bucket: 'overdue' | 'approaching') => {
  taskSlaBucket.value = taskSlaBucket.value === bucket ? null : bucket
  nextTick(() => {
    document.getElementById('dashboard-tasks-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  })
}

const changePage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    loadTickets()
  }
}

const loadTasks = async () => {
  loadingTasks.value = true
  
  try {
    const params: any = {
      limit: 100, // Increased limit to show more incomplete tasks
      page: 1,
    }
    
    if (taskFilters.value.technicianId) {
      params.technician_id = taskFilters.value.technicianId
    }

    const response = await scheduleService.getSchedules(params)
    let filteredTasks = response.data || []
    
    // Client-side search filter
    if (taskFilters.value.search) {
      const search = taskFilters.value.search.toLowerCase()
      filteredTasks = filteredTasks.filter(
        (t) =>
          (t.title && t.title.toLowerCase().includes(search)) ||
          (t.technician_name && t.technician_name.toLowerCase().includes(search)) ||
          (t.ticket_number && t.ticket_number.toLowerCase().includes(search)) ||
          (t.created_by_name && t.created_by_name.toLowerCase().includes(search))
      )
    }
    
    tasks.value = filteredTasks
  } catch (err) {
    console.error('Error loading tasks:', err)
    tasks.value = []
  } finally {
    loadingTasks.value = false
  }
}

const loadTechnicians = async () => {
  try {
    const techs = await scheduleService.getAssignableUsers()
    technicians.value = techs || []
  } catch (err) {
    console.error('Error loading technicians:', err)
    technicians.value = []
  }
}

const applyTaskFilters = () => {
  loadTasks()
}

const sortedTasks = computed(() => {
  // Show all incomplete tasks (not completed or cancelled)
  let filteredTasks = tasks.value.filter((task) => {
    return task.status !== 'completed' && task.status !== 'cancelled'
  })

  if (taskSlaBucket.value === 'overdue') {
    filteredTasks = filteredTasks.filter((task) => isTaskOverdue(task))
  } else if (taskSlaBucket.value === 'approaching') {
    filteredTasks = filteredTasks.filter(
      (task) => isTaskApproachingDeadline(task) && !isTaskOverdue(task)
    )
  }

  // Sort: Overdue tasks first, then approaching deadline, then others
  return filteredTasks.sort((a, b) => {
    const aOverdue = isTaskOverdue(a)
    const bOverdue = isTaskOverdue(b)
    const aApproaching = isTaskApproachingDeadline(a)
    const bApproaching = isTaskApproachingDeadline(b)

    // Overdue tasks come first
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1

    // Then approaching deadline tasks
    if (aApproaching && !bApproaching && !aOverdue && !bOverdue) return -1
    if (!aApproaching && bApproaching && !aOverdue && !bOverdue) return 1

    // Within same priority group, sort by schedule_date (earlier dates first for urgency)
    if (a.schedule_date && b.schedule_date) {
      const dateA = new Date(a.schedule_date).getTime()
      const dateB = new Date(b.schedule_date).getTime()
      if (dateA !== dateB) {
        return dateA - dateB // Earlier dates first
      }
    } else if (a.schedule_date && !b.schedule_date) {
      return -1
    } else if (!a.schedule_date && b.schedule_date) {
      return 1
    }

    // If same date, sort by start_time
    if (a.start_time && b.start_time) {
      return a.start_time.localeCompare(b.start_time)
    }
    return 0
  })
})

const getTaskStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  }
  return classes[status] || classes.scheduled
}

const getTaskStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    scheduled: t('technicians.schedule.statusOptions.scheduled'),
    in_progress: t('technicians.schedule.statusOptions.inProgress'),
    completed: t('technicians.schedule.statusOptions.completed'),
    cancelled: t('technicians.schedule.statusOptions.cancelled'),
  }
  return labels[status] || status
}

/**
 * Calculate days remaining or overdue based on deadline (schedule_date)
 * Returns positive number for days remaining, negative for days overdue, null if no deadline
 */
const calculateDaysRemaining = (task: any): number | null => {
  if (!task.schedule_date) return null
  
  // If task is completed, don't show as overdue
  if (task.status === 'completed') {
    return null
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const deadline = new Date(task.schedule_date)
  deadline.setHours(0, 0, 0, 0)
  
  // Calculate difference in days
  const diffMs = deadline.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Check if task is overdue
 */
const isTaskOverdue = (task: any): boolean => {
  const daysRemaining = calculateDaysRemaining(task)
  return daysRemaining !== null && daysRemaining < 0
}

/**
 * Check if task is approaching deadline (less than 2 days remaining but not overdue)
 */
const isTaskApproachingDeadline = (task: any): boolean => {
  const daysRemaining = calculateDaysRemaining(task)
  return daysRemaining !== null && daysRemaining >= 0 && daysRemaining < 2
}

/**
 * Get formatted text for days remaining/overdue
 */
const getDaysRemainingText = (task: any): string => {
  const days = calculateDaysRemaining(task)
  if (days === null) return t('common.na')
  
  if (days < 0) {
    return t('dashboard.tasksTable.daysOverdueText', { count: Math.abs(days) })
  } else {
    return t('dashboard.tasksTable.daysRemainingText', { count: days })
  }
}

const isSLAOverdue = (ticket: any) => {
  if (!ticket.sla_deadline) return false
  return new Date() > new Date(ticket.sla_deadline) && ticket.status !== 'closed' && ticket.status !== 'completed'
}

const isApproachingDeadline = (ticket: any) => {
  // Use backend flag if available
  if (ticket.is_approaching_deadline !== undefined) {
    return ticket.is_approaching_deadline
  }
  
  // Calculate locally if backend flag not available
  if (!ticket.sla_deadline) return false
  if (ticket.status === 'closed' || ticket.status === 'completed') return false
  
  const deadline = new Date(ticket.sla_deadline)
  const now = new Date()
  const diffMs = deadline.getTime() - now.getTime()
  const diffDays = diffMs / (1000 * 60 * 60 * 24)
  
  // Less than 2 days remaining and not overdue
  return diffDays > 0 && diffDays < 2
}

const getSLAStatusClass = (ticket: any) => {
  if (!ticket.sla_deadline) {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  const now = new Date()
  const deadline = new Date(ticket.sla_deadline)
  const diffMs = deadline.getTime() - now.getTime()

  // Quá hạn
  if (diffMs < 0 && ticket.status !== 'closed' && ticket.status !== 'completed') {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  // Đã đóng hoặc hoàn thành
  if (ticket.status === 'closed' || ticket.status === 'completed') {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }

  const diffHours = diffMs / (1000 * 60 * 60)
  const totalHours = getSlaHoursByPriority(ticket.priority)
  const remainingPercent = (diffHours / totalHours) * 100

  // Sắp hết hạn (còn dưới 20% thời gian)
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


const getPriorityClass = (priority: string) => {
  const classes: Record<string, string> = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }
  return classes[priority] || classes.medium
}

const getPriorityLabel = (priority: string) => {
  const key = PRIORITY_LABEL_KEYS[priority]
  return key ? t(key) : priority
}

const filteredTickets = computed(() => {
  let result = tickets.value

  // Show all incomplete tickets (not completed or closed)
  result = result.filter((ticket) => {
    return ticket.status !== 'completed' && ticket.status !== 'closed'
  })

  if (ticketSlaBucket.value === 'overdue') {
    result = result.filter((ticket) => isSLAOverdue(ticket))
  } else if (ticketSlaBucket.value === 'approaching') {
    result = result.filter(
      (ticket) => isApproachingDeadline(ticket) && !isSLAOverdue(ticket)
    )
  }

  // Client-side filtering (API already filters, but keep for consistency)
  if (ticketFilters.value.search) {
    const search = ticketFilters.value.search.toLowerCase()
    result = result.filter(
      (t) =>
        (t.ticket_number && t.ticket_number.toLowerCase().includes(search)) ||
        (t.customer_name && t.customer_name.toLowerCase().includes(search)) ||
        (t.title && t.title?.toLowerCase().includes(search)) ||
        (t.inverter_serial && t.inverter_serial.toLowerCase().includes(search)) ||
        (t.inverter_model && t.inverter_model.toLowerCase().includes(search))
    )
  }

  return result
})

const sortedAndPaginatedTickets = computed(() => {
  // Sort: Overdue tickets first, then approaching deadline, then others
  const sorted = [...filteredTickets.value].sort((a, b) => {
    const aOverdue = isSLAOverdue(a)
    const bOverdue = isSLAOverdue(b)
    const aApproaching = isApproachingDeadline(a)
    const bApproaching = isApproachingDeadline(b)

    // Overdue tickets come first
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1

    // Then approaching deadline tickets
    if (aApproaching && !bApproaching && !aOverdue && !bOverdue) return -1
    if (!aApproaching && bApproaching && !aOverdue && !bOverdue) return 1

    // Within same priority group, sort by created_at descending (newer first)
    const dateA = new Date(a.created_at).getTime()
    const dateB = new Date(b.created_at).getTime()
    return dateB - dateA
  })

  // Pagination is handled by API, so just return sorted tickets
  return sorted
})

const totalPages = computed(() => {
  return Math.ceil(totalTickets.value / pageSize.value)
})

// Statistics for Summary Cards - Calculate from all tickets/tasks
const statisticsData = ref({
  allTickets: [] as any[],
  allTasks: [] as any[],
})

// Load statistics data (all tickets and tasks with high limit)
const loadStatistics = async () => {
  try {
    // Load all tickets (approaching deadline or overdue)
    const ticketsResponse = await ticketService.getAllTickets({
      limit: 500,
      page: 1,
    })
    statisticsData.value.allTickets = ticketsResponse.data || []
    
    // Load all tasks
    const tasksResponse = await scheduleService.getSchedules({
      limit: 500,
      page: 1,
    })
    statisticsData.value.allTasks = tasksResponse.data || []
  } catch (err) {
    console.error('Error loading statistics:', err)
  }
}

// Summary Cards Statistics
const summaryStats = computed(() => {
  const allTickets = statisticsData.value.allTickets
  const allTasks = statisticsData.value.allTasks
  
  // Calculate ticket statistics
  const ticketsOverdue = allTickets.filter((ticket) => isSLAOverdue(ticket)).length
  const ticketsApproaching = allTickets.filter((ticket) => isApproachingDeadline(ticket)).length
  
  // Calculate task statistics
  const tasksOverdue = allTasks.filter((task) => isTaskOverdue(task)).length
  const tasksApproaching = allTasks.filter((task) => isTaskApproachingDeadline(task)).length
  
  return {
    ticketsOverdue,
    ticketsApproaching,
    tasksOverdue,
    tasksApproaching,
  }
})

const updateTicketStatusChart = () => {
  // Group tickets by status categories
  let initialized = 0
  let inProgress = 0
  let closed = 0
  let total = 0

  ticketsByStatus.value.forEach((item) => {
    const count = item.count || 0
    total += count

    // Map statuses to categories
    if (item.status === 'initialized' || item.status === 'new') {
      initialized += count
    } else if (
      item.status === 'in_progress' ||
      item.status === 'assigned' ||
      item.status === 'waiting_parts'
    ) {
      inProgress += count
    } else if (item.status === 'closed' || item.status === 'completed') {
      closed += count
    }
  })

  // Calculate percentages
  const labels: string[] = []
  const series: number[] = []

  if (initialized > 0) {
    labels.push(t('dashboard.ticketStatusChart.categories.initialized'))
    series.push(initialized)
  }
  if (inProgress > 0) {
    labels.push(t('dashboard.ticketStatusChart.categories.inProgress'))
    series.push(inProgress)
  }
  if (closed > 0) {
    labels.push(t('dashboard.ticketStatusChart.categories.closed'))
    series.push(closed)
  }

  ticketStatusLabels.value = labels
  ticketStatusSeries.value = series
}

const ticketStatusChartOptions = computed(() => {
  const total = ticketStatusSeries.value.reduce((sum, val) => sum + val, 0)

  return {
    chart: {
      fontFamily: 'Arial, sans-serif',
      type: 'pie',
      toolbar: {
        show: false,
      },
    },
    labels: ticketStatusLabels.value,
    colors: ['#3B82F6', '#8B5CF6', '#10B981'], // Blue, Purple, Green
    legend: {
      show: true,
      position: 'bottom',
      fontSize: '14px',
      fontFamily: 'Arial, sans-serif',
      labels: {
        colors: '#6B7280',
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: number) {
        return val.toFixed(1) + '%'
      },
      style: {
        fontSize: '12px',
        fontWeight: 600,
      },
      dropShadow: {
        enabled: false,
      },
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          const count = Math.round(val)
          const percentage = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0'
          return t('dashboard.ticketStatusChart.tooltip', { count, percentage })
        },
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
        },
        expandOnClick: false,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 200,
          },
          legend: {
            position: 'bottom',
          },
        },
      },
    ],
  }
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

watch(locale, () => {
  updateTicketStatusChart()
})

watch(
  ticketsByStatus,
  () => {
    updateTicketStatusChart()
  },
  { deep: true },
)

onMounted(() => {
  loadDashboardData()
})

// Auto-refresh when tickets or users change (polls /api/sync/changes every 5s)
useChangeDetection({
  onTicketChange: () => {
    loadTickets()
    loadDashboardData()
  },
  onUserChange: () => {
    loadTechnicians()
  },
})
</script>
