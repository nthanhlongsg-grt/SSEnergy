<template>
  <admin-layout>
    <div class="space-y-4 overflow-x-hidden">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('reports.title') }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            {{ t('reports.subtitle') }}
          </p>
        </div>
      </div>

      <!-- Date Range Filter -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
      >
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('reports.filters.reportType') }}
            </label>
            <select
              v-model="reportType"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              @change="onReportTypeChange"
            >
              <option value="week">{{ t('reports.filters.types.week') }}</option>
              <option value="month">{{ t('reports.filters.types.month') }}</option>
              <option value="year">{{ t('reports.filters.types.year') }}</option>
              <option value="custom">{{ t('reports.filters.types.custom') }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('reports.filters.fromDate') }}
            </label>
            <div class="relative">
              <flat-pickr
                v-model="dateRange.from"
                :config="flatpickrDateConfig"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :placeholder="t('reports.filters.placeholders.fromDate')"
            />
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('reports.filters.toDate') }}
            </label>
            <div class="relative">
              <flat-pickr
                v-model="dateRange.to"
                :config="flatpickrDateConfig"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :placeholder="t('reports.filters.placeholders.toDate')"
              />
            </div>
          </div>
          <div class="flex items-end">
            <button
              @click="applyFilters"
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {{ t('reports.filters.apply') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Error Alert -->
      <div
        v-if="error"
        class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
      >
        <p class="text-red-800 dark:text-red-200">{{ error || t('dashboard.alerts.loadFailed') }}</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</div>
      </div>

      <!-- Metrics Cards -->
      <div v-if="!loading" class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- Tổng Ticket -->
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
            <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.metrics.totalTickets') }}</p>
              <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {{ metrics.totalTickets }}
              </p>
              </div>
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900"
            >
              <ChatIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
          <div class="mt-4 flex items-center text-sm">
            <span class="text-green-600 dark:text-green-400">
              {{ t('dashboard.metrics.activeProcessing', { count: metrics.activeTickets }) }}
            </span>
            </div>
          </div>

        <!-- Tổng Thiết bị -->
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
            <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.metrics.totalInverters') }}</p>
              <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {{ metrics.totalInverters }}
              </p>
              </div>
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900"
            >
              <BoxCubeIcon class="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
          <div class="mt-4 flex items-center text-sm">
            <span class="text-gray-600 dark:text-gray-400">
              {{ t('dashboard.metrics.warrantyActive', { count: metrics.warrantyActive }) }}
            </span>
            </div>
          </div>

        <!-- Ticket Chờ xử lý -->
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
            <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('dashboard.metrics.pendingTickets') }}</p>
              <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {{ metrics.pendingTickets }}
              </p>
              </div>
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900"
            >
              <WarningIcon class="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                </div>
              </div>
          <div class="mt-4 flex items-center text-sm">
            <span class="text-yellow-600 dark:text-yellow-400">
              {{ t('dashboard.metrics.pendingHighlight') }}
            </span>
            </div>
          </div>

        <!-- Tổng Task -->
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
            <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('reports.metrics.totalTasks') }}</p>
              <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                {{ metrics.totalTasks }}
              </p>
              </div>
            <div
              class="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900"
            >
              <TaskIcon class="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
          <div class="mt-4 flex items-center text-sm">
            <span class="text-gray-600 dark:text-gray-400">
              {{ metrics.completedTasks }} {{ t('reports.metrics.completedTasks') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Tickets Table Section -->
      <div v-if="!loading" class="space-y-3">
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
          <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('dashboard.filters.searchLabel') }}
                </label>
                <input
                  v-model="ticketFilters.search"
                  type="text"
                  :placeholder="t('dashboard.filters.searchPlaceholder')"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  @input="applyTicketFilters"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('dashboard.filters.statusLabel') }}
                </label>
                <select
                  v-model="ticketFilters.status"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  @change="applyTicketFilters"
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
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('dashboard.filters.priorityLabel') }}
                </label>
                <select
                  v-model="ticketFilters.priority"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                  {{ t('dashboard.filters.slaStatusLabel') }}
                </label>
                <select
                  v-model="ticketFilters.slaStatus"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  @change="applyTicketFilters"
                >
                  <option
                    v-for="option in slaFilterOptions"
                    :key="option.value || 'all'"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </div>
              <div class="flex items-end gap-2">
                <button
                  @click="clearTicketFilters"
                  class="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {{ t('dashboard.filters.clear') }}
                </button>
              </div>
            </div>
          </div>
          <div class="overflow-x-auto overflow-y-auto max-h-[500px]">
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
                    class="px-3 py-2 text-left text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider whitespace-nowrap w-[120px]"
                  >
                    {{ t('reports.table.columns.category') }}
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
                        getCategoryClass(ticket.category),
                      ]"
                    >
                      {{ getCategoryLabel(ticket.category) }}
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
                  <td colspan="8" class="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    {{ t('dashboard.table.empty') }}
                </td>
              </tr>
            </tbody>
          </table>
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
      <div v-if="!loading" class="space-y-3">
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
          <div class="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('dashboard.taskFilters.searchLabel') }}
                </label>
                <input
                  v-model="taskFilters.search"
                  type="text"
                  :placeholder="t('dashboard.taskFilters.searchPlaceholder')"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  @input="applyTaskFilters"
                />
                </div>
                <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('dashboard.taskFilters.technicianLabel') }}
                </label>
                <select
                  v-model="taskFilters.technicianId"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('dashboard.taskFilters.statusLabel') }}
                </label>
                <select
                  v-model="taskFilters.status"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  @change="applyTaskFilters"
                >
                  <option
                    v-for="option in taskStatusFilterOptions"
                    :key="option.value || 'all'"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
                </div>
              <div class="flex items-end gap-2">
                <button
                  @click="clearTaskFilters"
                  class="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {{ t('dashboard.taskFilters.clear') }}
                </button>
              </div>
            </div>
          </div>
          <div class="overflow-x-auto overflow-y-auto max-h-[500px]">
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
                      v-if="task.status === 'completed'"
                      class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                    >
                      {{ t('reports.tasks.remaining.completed') }}
                    </span>
                    <span
                      v-else-if="calculateDaysRemaining(task) !== null"
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
                <tr v-if="tasks.length === 0 && !loadingTasks">
                  <td colspan="8" class="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                    {{ t('dashboard.tasksTable.empty') }}
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
        </div>
      </div>

      <!-- Charts and Tables Row -->
      <div v-if="!loading" class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <!-- Ticket Status Chart -->
      <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
      >
          <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">
            {{ t('dashboard.charts.statusTitle') }}
        </h3>
          <div id="ticket-status-chart">
            <VueApexCharts
              v-if="ticketStatusSeries.length > 0"
              type="pie"
              height="280"
              :options="ticketStatusChartOptions"
              :series="ticketStatusSeries"
            />
            <div v-else class="flex items-center justify-center h-[280px] text-gray-500 dark:text-gray-400">
              {{ t('common.loading') }}
        </div>
        </div>
        </div>

        <!-- Top Tickets by Model -->
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-3">
            {{ t('dashboard.charts.ticketByModelTitle') }}
          </h3>
          <div class="space-y-3">
            <div
              v-for="(issue, index) in topIssues"
              :key="index"
              class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700"
            >
                  <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ issue.model || t('common.na') }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ t('dashboard.charts.issueCount', { count: issue.count }) }}
                    </p>
                  </div>
                  <span
                class="px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                {{ issue.count }}
                  </span>
            </div>
            <div v-if="topIssues.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-4">
              {{ t('dashboard.charts.noData') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Statistics Section -->
      <div v-if="!loading" class="space-y-4">
        <!-- Tickets Trend Chart -->
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
        >
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ t('reports.charts.ticketsTrend') }}
          </h3>
          <div id="tickets-trend-chart">
            <VueApexCharts
              v-if="ticketsTrendSeries.length > 0"
              type="line"
              height="350"
              :options="ticketsTrendChartOptions"
              :series="ticketsTrendSeries"
            />
            <div v-else class="flex items-center justify-center h-[350px] text-gray-500 dark:text-gray-400">
              {{ t('common.loading') }}
            </div>
          </div>
        </div>

        <!-- Work Type Statistics -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- Work Type Distribution -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('reports.charts.workTypeDistribution') }}
            </h3>
            <div id="work-type-chart">
              <VueApexCharts
                v-if="workTypeSeries.length > 0"
                type="donut"
                height="300"
                :options="workTypeChartOptions"
                :series="workTypeSeries"
              />
              <div v-else class="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                {{ t('common.loading') }}
              </div>
        </div>
      </div>

          <!-- Technician Performance -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
      >
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('reports.charts.technicianPerformance') }}
        </h3>
            <div id="technician-performance-chart">
              <VueApexCharts
                v-if="technicianPerformanceSeries.length > 0"
                type="bar"
                height="300"
                :options="technicianPerformanceChartOptions"
                :series="technicianPerformanceSeries"
              />
              <div v-else class="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                {{ t('common.loading') }}
              </div>
            </div>
          </div>
        </div>

        <!-- SLA Compliance and Priority Statistics -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- SLA Compliance -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('reports.charts.slaCompliance') }}
            </h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('reports.charts.onTime') }}</p>
                  <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {{ slaStats.onTime }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('reports.charts.rate') }}</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {{ slaComplianceRate }}%
                  </p>
                </div>
              </div>
              <div class="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('reports.charts.overdue') }}</p>
                  <p class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {{ slaStats.overdue }}
                  </p>
                </div>
                <div class="text-right">
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('reports.charts.rate') }}</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {{ slaOverdueRate }}%
                  </p>
                </div>
              </div>
        </div>
      </div>

          <!-- Priority Distribution -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('reports.charts.priorityDistribution') }}
            </h3>
            <div id="priority-chart">
              <VueApexCharts
                v-if="prioritySeries.length > 0"
                type="bar"
                height="300"
                :options="priorityChartOptions"
                :series="prioritySeries"
              />
              <div v-else class="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                {{ t('common.loading') }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import {
  ChatIcon,
  BoxCubeIcon,
  WarningIcon,
  TaskIcon,
} from '../../../icons'
import { apiClient } from '@/services/api'
import { formatDateTime } from '@/utils/dateTime'
import { ticketService } from '@/services/ticketService'
import { scheduleService } from '@/services/scheduleService'
import VueApexCharts from 'vue3-apexcharts'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { useFlatpickrConfig } from '@/composables/useFlatpickr'
import { useSlaSettings } from '@/composables/useSlaSettings'

const { t, locale } = useI18n()
const { dateConfig } = useFlatpickrConfig()
const { getSlaHoursByPriority } = useSlaSettings()

const flatpickrDateConfig = {
  ...dateConfig,
  dateFormat: 'Y-m-d',
  altInput: true,
  altFormat: 'd/m/Y',
  locale: {
    firstDayOfWeek: 1, // Monday
  },
}

const loading = ref(false)
const error = ref('')

const metrics = ref({
  totalTickets: 0,
  activeTickets: 0,
  totalInverters: 0,
  warrantyActive: 0,
  pendingTickets: 0,
  totalTasks: 0,
  completedTasks: 0,
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
  status: '',
})

const ticketFilters = ref({
  search: '',
  status: '',
  priority: '',
  slaStatus: '',
})

// Date range filter
const reportType = ref<'week' | 'month' | 'year' | 'custom'>('week')
const dateRange = ref({
  from: '',
  to: '',
})

// Calculate current week (Monday to Sunday)
const getCurrentWeek = () => {
  const today = new Date()
  const day = today.getDay()
  const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
  const monday = new Date(today.getFullYear(), today.getMonth(), diff)
  monday.setHours(0, 0, 0, 0)
  
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  sunday.setHours(23, 59, 59, 999)
  
  return {
    from: monday.toISOString().split('T')[0],
    to: sunday.toISOString().split('T')[0],
  }
}

// Initialize date range based on report type
const initializeDateRange = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  
  switch (reportType.value) {
    case 'week':
      const week = getCurrentWeek()
      dateRange.value = week
      break
    case 'month':
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      dateRange.value = {
        from: firstDay.toISOString().split('T')[0],
        to: lastDay.toISOString().split('T')[0],
      }
      break
    case 'year':
      dateRange.value = {
        from: `${year}-01-01`,
        to: `${year}-12-31`,
      }
      break
    case 'custom':
      // Keep current dates or set default to current week
      if (!dateRange.value.from || !dateRange.value.to) {
        const week = getCurrentWeek()
        dateRange.value = week
      }
      // Don't auto-update, let user choose freely
      return
  }
}

const onReportTypeChange = () => {
  // Only auto-update date range if not custom
  if (reportType.value !== 'custom') {
    initializeDateRange()
  }
  // If custom, keep current dates and allow user to select freely
}

// Watch for date changes
watch([() => dateRange.value.from, () => dateRange.value.to], () => {
  // When user manually changes dates, switch to custom
  if (reportType.value !== 'custom') {
    reportType.value = 'custom'
  }
  // Validate date range
  if (dateRange.value.from && dateRange.value.to) {
    const fromDate = new Date(dateRange.value.from)
    const toDate = new Date(dateRange.value.to)
    if (fromDate > toDate) {
      // Swap dates if from > to
      const temp = dateRange.value.from
      dateRange.value.from = dateRange.value.to
      dateRange.value.to = temp
    }
  }
})

const applyFilters = () => {
  // Reset pagination to first page
  currentPage.value = 1
  
  // Reload all data with new date range
  loadDashboardData()
}

const ticketsByStatus = ref<Array<{ status: string; count: number }>>([])
const ticketStatusSeries = ref<number[]>([])
const ticketStatusLabels = ref<string[]>([])

// Additional statistics data
const ticketsTrendSeries = ref<any[]>([])
const ticketsTrendLabels = ref<string[]>([])

const workTypeSeries = ref<number[]>([])
const workTypeLabels = ref<string[]>([])

const technicianPerformanceSeries = ref<any[]>([])
const technicianPerformanceLabels = ref<string[]>([])

const prioritySeries = ref<any[]>([])
const priorityLabels = ref<string[]>([])

const slaStats = ref({
  onTime: 0,
  overdue: 0,
  total: 0,
})

const ticketsByCategory = ref<Array<{
  category: string
  count: number
  completed_count: number
  active_count: number
  new_count: number
}>>([])

const ticketsByPriority = ref<Array<{ priority: string; count: number }>>([])

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

const slaFilterOptions = computed(() => [
  { value: '', label: t('dashboard.filters.slaStatusAll') },
  { value: 'completed', label: t('dashboard.filters.slaStatusCompleted') },
  { value: 'overdue', label: t('dashboard.filters.slaStatusOverdue') },
  { value: 'on_time', label: t('dashboard.filters.slaStatusOnTime') },
])

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
    const params: any = {}
    if (dateRange.value.from && dateRange.value.to) {
      params.from = dateRange.value.from
      params.to = dateRange.value.to
    }
    
    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `/dashboard/stats?${queryString}` : '/dashboard/stats'
    const response = await apiClient.get(url)
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
          totalTasks: 0,
          completedTasks: 0,
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

      // Update tickets by priority
      if (data.tickets_by_priority) {
        ticketsByPriority.value = data.tickets_by_priority
        updatePriorityChart()
      }

      // Update tickets by category
      if (data.tickets_by_category) {
        ticketsByCategory.value = data.tickets_by_category
        updateWorkTypeChart()
      }
    }

    // Load tickets separately with pagination
    await loadTickets()
    // Load technicians for task filters
    await loadTechnicians()
    // Load tasks
    await loadTasks()
    // Load task statistics
    await loadTaskStatistics()
    // Load additional statistics (after tickets are loaded)
    await loadAdditionalStatistics()
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
    
    if (dateRange.value.from && dateRange.value.to) {
      params.from = dateRange.value.from
      params.to = dateRange.value.to
    }
    
    if (ticketFilters.value.search) params.search = ticketFilters.value.search
    if (ticketFilters.value.status) params.status = ticketFilters.value.status
    if (ticketFilters.value.priority) params.priority = ticketFilters.value.priority
    if (ticketFilters.value.slaStatus) params.sla_status = ticketFilters.value.slaStatus

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
    status: '',
    priority: '',
    slaStatus: '',
  }
  applyTicketFilters()
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
      limit: 20,
      page: 1,
    }
    
    if (dateRange.value.from && dateRange.value.to) {
      params.from = dateRange.value.from
      params.to = dateRange.value.to
    }
    
    if (taskFilters.value.technicianId) {
      params.technician_id = taskFilters.value.technicianId
    }
    if (taskFilters.value.status) {
      params.status = taskFilters.value.status
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

const loadTaskStatistics = async () => {
  try {
    const params: any = { limit: 1000, page: 1 }
    
    if (dateRange.value.from && dateRange.value.to) {
      params.from = dateRange.value.from
      params.to = dateRange.value.to
    }
    
    const response = await scheduleService.getSchedules(params)
    const allTasks = response.data || []
    
    metrics.value.totalTasks = allTasks.length
    metrics.value.completedTasks = allTasks.filter((t: any) => t.status === 'completed').length
  } catch (err) {
    console.error('Error loading task statistics:', err)
    metrics.value.totalTasks = 0
    metrics.value.completedTasks = 0
  }
}

const loadAdditionalStatistics = async () => {
  try {
    // Load tickets trend data
    await loadTicketsTrend()
    
    // Load technician performance
    await loadTechnicianPerformance()
    
    // Calculate SLA stats
    await calculateSLAStats()
  } catch (err) {
    console.error('Error loading additional statistics:', err)
  }
}

const loadTicketsTrend = async () => {
  try {
    if (!dateRange.value.from || !dateRange.value.to) return
    
    // Generate date range array
    const fromDate = new Date(dateRange.value.from)
    const toDate = new Date(dateRange.value.to)
    const days = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    const labels: string[] = []
    const series: number[] = []
    
    // Group by day if range <= 30 days, otherwise by week
    const groupByWeek = days > 30
    
    for (let i = 0; i < days; i++) {
      const currentDate = new Date(fromDate)
      currentDate.setDate(fromDate.getDate() + i)
      
      if (groupByWeek) {
        // Group by week
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1)
        const weekKey = weekStart.toISOString().split('T')[0]
        
        if (!labels.includes(weekKey)) {
          labels.push(weekKey)
          series.push(0)
        }
      } else {
        // Group by day
        labels.push(currentDate.toISOString().split('T')[0])
        series.push(0)
      }
    }
    
    // Load tickets and count by date
    const params: any = {
      limit: 10000,
      page: 1,
    }
    
    if (dateRange.value.from && dateRange.value.to) {
      params.from = dateRange.value.from
      params.to = dateRange.value.to
    }
    
    const response = await ticketService.getAllTickets(params)
    const allTickets = response.data || []
    
    // Count tickets by date
    allTickets.forEach((ticket: any) => {
      const ticketDate = new Date(ticket.created_at || ticket.updated_at)
      const dateKey = ticketDate.toISOString().split('T')[0]
      
      if (groupByWeek) {
        const weekStart = new Date(ticketDate)
        weekStart.setDate(ticketDate.getDate() - ticketDate.getDay() + 1)
        const weekKey = weekStart.toISOString().split('T')[0]
        const index = labels.indexOf(weekKey)
        if (index >= 0) {
          series[index]++
        }
      } else {
        const index = labels.indexOf(dateKey)
        if (index >= 0) {
          series[index]++
        }
      }
    })
    
    ticketsTrendLabels.value = labels.map((label) => {
      const date = new Date(label)
      return groupByWeek 
        ? `${t('reports.charts.week')} ${date.getDate()}/${date.getMonth() + 1}`
        : `${date.getDate()}/${date.getMonth() + 1}`
    })
    ticketsTrendSeries.value = [{
      name: t('reports.charts.tickets'),
      data: series,
    }]
  } catch (err) {
    console.error('Error loading tickets trend:', err)
    ticketsTrendSeries.value = []
    ticketsTrendLabels.value = []
  }
}

const loadTechnicianPerformance = async () => {
  try {
    const params: any = {
      limit: 10000,
      page: 1,
    }
    
    if (dateRange.value.from && dateRange.value.to) {
      params.from = dateRange.value.from
      params.to = dateRange.value.to
    }
    
    const response = await ticketService.getAllTickets(params)
    const allTickets = response.data || []
    
    // Group by technician
    const techMap = new Map<string, { name: string; completed: number; total: number }>()
    
    allTickets.forEach((ticket: any) => {
      if (ticket.assigned_to_name) {
        const techName = ticket.assigned_to_name
        if (!techMap.has(techName)) {
          techMap.set(techName, { name: techName, completed: 0, total: 0 })
        }
        const tech = techMap.get(techName)!
        tech.total++
        if (ticket.status === 'completed' || ticket.status === 'closed') {
          tech.completed++
        }
      }
    })
    
    const techArray = Array.from(techMap.values())
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 10) // Top 10
    
    technicianPerformanceLabels.value = techArray.map(t => t.name)
    technicianPerformanceSeries.value = [{
      name: t('reports.charts.completed'),
      data: techArray.map(t => t.completed),
    }, {
      name: t('reports.charts.total'),
      data: techArray.map(t => t.total),
    }]
  } catch (err) {
    console.error('Error loading technician performance:', err)
    technicianPerformanceSeries.value = []
    technicianPerformanceLabels.value = []
  }
}

const calculateSLAStats = async () => {
  try {
    // Load all tickets for SLA calculation
    const params: any = {
      limit: 10000,
      page: 1,
    }
    
    if (dateRange.value.from && dateRange.value.to) {
      params.from = dateRange.value.from
      params.to = dateRange.value.to
    }
    
    const response = await ticketService.getAllTickets(params)
    const allTickets = response.data || []
    
    let onTime = 0
    let overdue = 0
    let total = 0
    
    allTickets.forEach((ticket: any) => {
      if (ticket.sla_deadline && (ticket.status === 'completed' || ticket.status === 'closed')) {
        total++
        const deadline = new Date(ticket.sla_deadline)
        const completedAt = new Date(ticket.updated_at || ticket.created_at)
        if (completedAt <= deadline) {
          onTime++
    } else {
          overdue++
        }
      }
    })
    
    slaStats.value = {
      onTime,
      overdue,
      total,
    }
  } catch (err) {
    console.error('Error calculating SLA stats:', err)
    slaStats.value = {
      onTime: 0,
      overdue: 0,
      total: 0,
    }
  }
}

const updatePriorityChart = () => {
  const labels: string[] = []
  const series: number[] = []
  
  ticketsByPriority.value.forEach((item) => {
    const label = PRIORITY_LABEL_KEYS[item.priority] 
      ? t(PRIORITY_LABEL_KEYS[item.priority])
      : item.priority
    labels.push(label)
    series.push(item.count || 0)
  })
  
  priorityLabels.value = labels
  prioritySeries.value = [{
    name: t('reports.charts.total'),
    data: series,
  }]
}

const updateWorkTypeChart = () => {
  const labels: string[] = []
  const series: number[] = []
  
  const categoryMap: Record<string, string> = {
    warranty: t('reports.charts.workTypes.warranty'),
    repair: t('reports.charts.workTypes.repair'),
    technical_support: t('reports.charts.workTypes.technicalSupport'),
    consultation: t('reports.charts.workTypes.technicalSupport'),
  }
  
  ticketsByCategory.value.forEach((item) => {
    const label = categoryMap[item.category] || item.category || t('reports.charts.workTypes.other')
    if (!labels.includes(label)) {
      labels.push(label)
      series.push(item.count || 0)
    } else {
      const index = labels.indexOf(label)
      series[index] += item.count || 0
    }
  })
  
  workTypeLabels.value = labels
  workTypeSeries.value = series
}

const applyTaskFilters = () => {
  loadTasks()
}

const clearTaskFilters = () => {
  taskFilters.value = {
    search: '',
    technicianId: '',
    status: '',
  }
  applyTaskFilters()
}

const sortedTasks = computed(() => {
  // Sort by schedule_date descending, then by start_time
  return [...tasks.value].sort((a, b) => {
    const dateA = new Date(a.schedule_date).getTime()
    const dateB = new Date(b.schedule_date).getTime()
    if (dateB !== dateA) {
      return dateB - dateA // Newer dates first
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

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  warranty: 'reports.table.categories.warranty',
  repair: 'reports.table.categories.repair',
  technical_support: 'reports.table.categories.technical_support',
  consultation: 'reports.table.categories.consultation',
}

const getCategoryClass = (category: string | null | undefined) => {
  const classes: Record<string, string> = {
    warranty: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    repair: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    technical_support: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    consultation: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  }
  return classes[category || 'other'] || classes.other
}

const getCategoryLabel = (category: string | null | undefined) => {
  if (!category) return t('reports.table.categories.other')
  const key = CATEGORY_LABEL_KEYS[category]
  return key ? t(key) : category
}

const filteredTickets = computed(() => {
  let result = tickets.value

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
  // Sort: SLA overdue tickets first, then by created_at descending
  const sorted = [...filteredTickets.value].sort((a, b) => {
    const aOverdue = isSLAOverdue(a)
    const bOverdue = isSLAOverdue(b)

    // SLA overdue tickets come first
    if (aOverdue && !bOverdue) return -1
    if (!aOverdue && bOverdue) return 1

    // Then sort by created_at descending
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
      type: 'pie' as const,
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

// Chart options for additional statistics
const ticketsTrendChartOptions = computed(() => ({
  chart: {
    type: 'line' as const,
    toolbar: { show: false },
    fontFamily: 'Arial, sans-serif',
  },
  xaxis: {
    categories: ticketsTrendLabels.value,
    labels: {
      style: {
        fontSize: '12px',
      },
    },
  },
  yaxis: {
    title: {
      text: t('reports.charts.quantity'),
    },
  },
  colors: ['#3B82F6'],
  stroke: {
    curve: 'smooth',
    width: 2,
  },
  markers: {
    size: 4,
  },
  tooltip: {
    y: {
      formatter: (val: number) => `${val} ${t('reports.charts.tickets')}`,
    },
  },
  legend: {
    show: false,
  },
}))

const workTypeChartOptions = computed(() => ({
  chart: {
    type: 'donut' as const,
    toolbar: { show: false },
    fontFamily: 'Arial, sans-serif',
  },
  labels: workTypeLabels.value,
  colors: ['#3B82F6', '#EF4444', '#8B5CF6', '#10B981'],
  legend: {
    position: 'bottom',
    fontSize: '14px',
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => val.toFixed(1) + '%',
  },
  tooltip: {
    y: {
      formatter: (val: number) => `${val} ${t('reports.charts.tickets')}`,
    },
  },
}))

const technicianPerformanceChartOptions = computed(() => ({
  chart: {
    type: 'bar' as const,
    toolbar: { show: false },
    fontFamily: 'Arial, sans-serif',
  },
  xaxis: {
    categories: technicianPerformanceLabels.value,
    labels: {
      style: {
        fontSize: '11px',
      },
      rotate: -45,
      rotateAlways: true,
    },
  },
  yaxis: {
    title: {
      text: t('reports.charts.total'),
    },
  },
  colors: ['#10B981', '#3B82F6'],
  plotOptions: {
    bar: {
      horizontal: false,
      columnWidth: '55%',
    },
  },
  legend: {
    position: 'top',
  },
  tooltip: {
    y: {
      formatter: (val: number) => `${val} ${t('reports.charts.tickets')}`,
    },
  },
}))

const priorityChartOptions = computed(() => ({
  chart: {
    type: 'bar' as const,
    toolbar: { show: false },
    fontFamily: 'Arial, sans-serif',
  },
  xaxis: {
    categories: priorityLabels.value,
    labels: {
      style: {
        fontSize: '12px',
      },
    },
  },
  yaxis: {
    title: {
      text: t('reports.charts.total'),
    },
  },
  colors: ['#F59E0B', '#EF4444', '#10B981'],
  plotOptions: {
    bar: {
      horizontal: true,
    },
  },
  legend: {
    show: false,
  },
  tooltip: {
    y: {
      formatter: (val: number) => `${val} ${t('reports.charts.tickets')}`,
    },
  },
}))

const slaComplianceRate = computed(() => {
  if (slaStats.value.total === 0) return 0
  return Math.round((slaStats.value.onTime / slaStats.value.total) * 100)
})

const slaOverdueRate = computed(() => {
  if (slaStats.value.total === 0) return 0
  return Math.round((slaStats.value.overdue / slaStats.value.total) * 100)
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
  // Reset to week when page loads/reloads
  reportType.value = 'week'
  initializeDateRange()
  loadDashboardData()
})
</script>
