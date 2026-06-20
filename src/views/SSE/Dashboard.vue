<template>
  <admin-layout>
    <div class="px-4 sm:px-0 space-y-6 sm:space-y-8 overflow-x-hidden">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('dashboard.header.title') }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ t('dashboard.header.subtitle') }}
          </p>
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

      <template v-if="!loading">
        <!-- Contracts -->
        <section
          v-if="showContractSection"
          class="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
        >
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">
                {{ t('dashboard.sections.contracts') }}
              </h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {{ t('dashboard.contracts.summaryHint') }}
              </p>
            </div>
            <router-link
              to="/contracts"
              class="text-sm text-blue-600 dark:text-blue-400 hover:underline shrink-0"
            >
              {{ t('dashboard.contracts.viewAll') }}
            </router-link>
          </div>

          <div v-if="contractLoading" class="flex items-center justify-center py-10">
            <div class="text-sm text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</div>
          </div>

          <template v-else>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
              <button
                type="button"
                :class="[
                  'rounded-lg p-3 sm:p-4 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  contractTab === 'unpaid'
                    ? 'bg-white dark:bg-gray-800 ring-2 ring-red-500 border border-red-200 dark:border-red-800 shadow-sm'
                    : 'bg-white/80 dark:bg-gray-800/80 border border-red-100 dark:border-red-900/50 hover:border-red-200',
                ]"
                @click="contractTab = 'unpaid'"
              >
                <div class="flex items-center justify-between gap-2">
                  <div class="min-w-0">
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('dashboard.contracts.unpaidDebt') }}</p>
                    <p v-if="canViewContractFinance" class="mt-1 text-lg sm:text-xl font-bold text-red-600 dark:text-red-400 truncate">
                      {{ formatContractCurrency(contractMetrics.totalDebt) }}
                    </p>
                    <p v-else class="mt-1 text-lg sm:text-xl font-bold text-red-600 dark:text-red-400">
                      {{ contractMetrics.unpaidCount }}
                    </p>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {{ t('dashboard.contracts.contractCount', { count: contractMetrics.unpaidCount }) }}
                    </p>
                  </div>
                  <WarningIcon class="h-5 w-5 text-red-500 shrink-0" />
                </div>
              </button>

              <button
                type="button"
                :class="[
                  'rounded-lg p-3 sm:p-4 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                  contractTab === 'draft'
                    ? 'bg-white dark:bg-gray-800 ring-2 ring-gray-400 border border-gray-300 dark:border-gray-600 shadow-sm'
                    : 'bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 hover:border-gray-300',
                ]"
                @click="contractTab = 'draft'"
              >
                <div class="flex items-center justify-between gap-2">
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('dashboard.contracts.draftCount') }}</p>
                    <p class="mt-1 text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                      {{ contractMetrics.draftCount }}
                    </p>
                    <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {{ t('dashboard.contracts.draftHint') }}
                    </p>
                  </div>
                  <DocsIcon class="h-5 w-5 text-gray-500 shrink-0" />
                </div>
              </button>
            </div>

            <div class="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 px-4 sm:px-5">
              <button
                type="button"
                :class="[
                  'px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                  contractTab === 'unpaid'
                    ? 'border-red-500 text-red-600 dark:text-red-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                ]"
                @click="contractTab = 'unpaid'"
              >
                {{ t('dashboard.contracts.unpaidList') }}
                <span class="ml-1 text-xs opacity-75">({{ unpaidContractsTotal }})</span>
              </button>
              <button
                type="button"
                :class="[
                  'px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                  contractTab === 'draft'
                    ? 'border-gray-500 text-gray-900 dark:text-white'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
                ]"
                @click="contractTab = 'draft'"
              >
                {{ t('dashboard.contracts.draftList') }}
                <span class="ml-1 text-xs opacity-75">({{ draftContractsTotal }})</span>
              </button>
            </div>

            <div class="overflow-x-auto max-h-[320px] overflow-y-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10">
                  <tr>
                    <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('dashboard.contracts.columns.number') }}</th>
                    <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('dashboard.contracts.columns.customer') }}</th>
                    <th v-if="canViewContractFinance" class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('dashboard.contracts.columns.value') }}</th>
                    <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ activeContractDateLabel }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  <tr
                    v-for="contract in activeContractList"
                    :key="contract.id"
                    class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    @click="router.push(`/contracts/${contract.id}`)"
                  >
                    <td class="px-4 py-2.5 font-mono text-blue-600 dark:text-blue-400">{{ contract.contract_number }}</td>
                    <td class="px-4 py-2.5 text-gray-900 dark:text-white truncate max-w-[200px]">{{ contract.customer_name || '—' }}</td>
                    <td v-if="canViewContractFinance" class="px-4 py-2.5 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">{{ formatContractCurrency(contract.value) }}</td>
                    <td class="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ contractDateForRow(contract) }}</td>
                  </tr>
                  <tr v-if="activeContractList.length === 0">
                    <td :colspan="canViewContractFinance ? 4 : 3" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {{ activeContractEmptyText }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </template>
        </section>

        <!-- SLA Summary — chỉ hiển thị với role quản lý -->
        <section v-if="!isLimitedStaff" class="space-y-3">
          <h2 class="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            {{ t('dashboard.sections.actionRequired') }}
          </h2>
          <div class="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <!-- Tickets QuÃ¡ háº¡n -->
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

            <!-- Tickets Sáº¯p háº¿t háº¡n -->
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

            <!-- Tasks QuÃ¡ háº¡n -->
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

            <!-- Tasks Sáº¯p háº¿t háº¡n -->
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
        </section>

        <!-- Tickets & Tasks -->
        <section
          id="dashboard-operations-section"
          class="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden scroll-mt-4"
        >
          <div class="flex flex-col gap-3 p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700 sm:flex-row sm:items-center sm:justify-between">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white shrink-0">
              {{ t('dashboard.sections.operations') }}
            </h2>
            <div class="flex flex-wrap items-center gap-2 min-w-0">
              <input
                v-if="operationsTab === 'tickets'"
                v-model="ticketFilters.search"
                type="text"
                :placeholder="t('dashboard.filters.searchPlaceholder')"
                class="flex-1 min-w-[140px] max-w-xs px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                @input="applyTicketFilters"
              />
              <input
                v-else
                v-model="taskFilters.search"
                type="text"
                :placeholder="t('dashboard.taskFilters.searchPlaceholder')"
                class="flex-1 min-w-[140px] max-w-xs px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                @input="applyTaskFilters"
              />
              <select
                v-if="operationsTab === 'tickets'"
                v-model="ticketFilters.technicianId"
                class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
              <select
                v-else
                v-model="taskFilters.technicianId"
                class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
              <button
                type="button"
                class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                @click="operationsTab === 'tickets' ? clearTicketFilters() : clearTaskFilters()"
              >
                {{ t('dashboard.filters.clear') }}
              </button>
              <router-link
                :to="operationsTab === 'tickets' ? '/tickets' : '/technicians/schedule'"
                class="text-sm text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
              >
                {{ t('dashboard.operations.viewAll') }}
              </router-link>
            </div>
          </div>

          <div class="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 px-4 sm:px-5">
            <button
              type="button"
              id="dashboard-tickets-section"
              :class="[
                'px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                operationsTab === 'tickets'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              ]"
              @click="operationsTab = 'tickets'"
            >
              {{ t('dashboard.table.title') }}
            </button>
            <button
              type="button"
              id="dashboard-tasks-section"
              :class="[
                'px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors',
                operationsTab === 'tasks'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300',
              ]"
              @click="operationsTab = 'tasks'"
            >
              {{ t('dashboard.tasksTable.title') }}
            </button>
          </div>

          <div v-show="operationsTab === 'tickets'" class="overflow-x-auto max-h-[360px] overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10">
                <tr>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('dashboard.table.columns.code') }}</th>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('dashboard.table.columns.title') }}</th>
                  <th class="hidden sm:table-cell px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('dashboard.table.columns.customer') }}</th>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('dashboard.table.columns.sla') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr
                  v-for="ticket in sortedAndPaginatedTickets"
                  :key="ticket.id"
                  :class="[
                    'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30',
                    isSLAOverdue(ticket) ? 'border-l-4 border-red-500 bg-red-50/50 dark:bg-red-900/10' : '',
                    isApproachingDeadline(ticket) ? 'border-l-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10' : '',
                  ]"
                  @click="router.push(`/tickets/${ticket.id}`)"
                >
                  <td class="px-4 py-2.5 font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">{{ ticket.ticket_number }}</td>
                  <td class="px-4 py-2.5 text-gray-900 dark:text-white">
                    <p class="line-clamp-1" :title="ticket.title">{{ ticket.title || t('common.na') }}</p>
                    <p class="sm:hidden text-xs text-gray-500 dark:text-gray-400 truncate">{{ ticket.customer_name || t('common.na') }}</p>
                  </td>
                  <td class="hidden sm:table-cell px-4 py-2.5 text-gray-900 dark:text-white truncate max-w-[180px]">{{ ticket.customer_name || t('common.na') }}</td>
                  <td class="px-4 py-2.5 whitespace-nowrap">
                    <span :class="['px-2 py-0.5 text-xs font-semibold rounded-full', getSLAStatusClass(ticket)]">
                      {{ getSLAStatusLabel(ticket) }}
                    </span>
                  </td>
                </tr>
                <tr v-if="loadingTickets">
                  <td colspan="4" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</td>
                </tr>
                <tr v-else-if="filteredTickets.length === 0">
                  <td colspan="4" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{{ t('dashboard.table.empty') }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            v-if="operationsTab === 'tickets' && totalPages > 1"
            class="px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2 text-sm"
          >
            <span class="text-gray-500 dark:text-gray-400">
              {{ t('dashboard.pagination.summary', { from: (currentPage - 1) * pageSize + 1, to: Math.min(currentPage * pageSize, totalTickets), total: totalTickets }) }}
            </span>
            <div class="flex gap-1">
              <button
                type="button"
                :disabled="currentPage === 1"
                class="px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                @click="changePage(currentPage - 1)"
              >
                {{ t('dashboard.pagination.prev') }}
              </button>
              <button
                type="button"
                :disabled="currentPage === totalPages"
                class="px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50"
                @click="changePage(currentPage + 1)"
              >
                {{ t('dashboard.pagination.next') }}
              </button>
            </div>
          </div>

          <div v-show="operationsTab === 'tasks'" class="overflow-x-auto max-h-[360px] overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10">
                <tr>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('dashboard.tasksTable.columns.title') }}</th>
                  <th class="hidden sm:table-cell px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('dashboard.tasksTable.columns.technician') }}</th>
                  <th class="hidden md:table-cell px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('dashboard.tasksTable.columns.deadline') }}</th>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('dashboard.tasksTable.columns.daysRemaining') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr
                  v-for="task in sortedTasks"
                  :key="task.id"
                  :class="[
                    'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30',
                    isTaskOverdue(task) ? 'border-l-4 border-red-500 bg-red-50/50 dark:bg-red-900/10' : '',
                    isTaskApproachingDeadline(task) ? 'border-l-4 border-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10' : '',
                  ]"
                  @click="router.push(`/tasks/${task.id}`)"
                >
                  <td class="px-4 py-2.5">
                    <p class="font-medium text-blue-600 dark:text-blue-400 line-clamp-1" :title="task.title">{{ task.title || t('common.na') }}</p>
                    <p class="sm:hidden text-xs text-gray-500 dark:text-gray-400">{{ task.technician_name || t('common.na') }}</p>
                  </td>
                  <td class="hidden sm:table-cell px-4 py-2.5 text-gray-600 dark:text-gray-400 truncate max-w-[120px]">{{ task.technician_name || t('common.na') }}</td>
                  <td class="hidden md:table-cell px-4 py-2.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {{ task.schedule_date ? formatDate(task.schedule_date) : t('common.na') }}
                  </td>
                  <td class="px-4 py-2.5 whitespace-nowrap">
                    <span
                      v-if="calculateDaysRemaining(task) !== null"
                      :class="[
                        'px-2 py-0.5 text-xs font-semibold rounded-full',
                        isTaskOverdue(task)
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : calculateDaysRemaining(task)! <= 3
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                      ]"
                    >
                      {{ getDaysRemainingText(task) }}
                    </span>
                    <span v-else class="text-gray-400">{{ t('common.na') }}</span>
                  </td>
                </tr>
                <tr v-if="loadingTasks">
                  <td colspan="4" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</td>
                </tr>
                <tr v-else-if="sortedTasks.length === 0">
                  <td colspan="4" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">{{ t('dashboard.tasksTable.empty') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </template>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import {
  ChatIcon,
  WarningIcon,
  UserCircleIcon,
  ErrorIcon,
  PlusIcon,
  CalenderIcon,
  TaskIcon,
  DocsIcon,
} from '../../icons'
import { apiClient } from '@/services/api'
import { formatDateTime } from '@/utils/dateTime'
import {
  TICKET_STATUS_I18N_KEY,
  TICKET_STATUS_ORDER,
  isTicketClosed,
  normalizeTicketStatus,
} from '@/constants/ticketStatus'
import { useTicketStatus } from '@/composables/useTicketStatus'
import { useChangeDetection } from '@/composables/useChangeDetection'
import { ticketService } from '@/services/ticketService'
import { scheduleService } from '@/services/scheduleService'
import { contractService, type Contract } from '@/services/contractService'
import { useRouter } from 'vue-router'
import { hasPermission, Permission, hasAnyRole, UserRole, getUser } from '@/composables/useAuth'
import { useSlaSettings } from '@/composables/useSlaSettings'

const { t, locale } = useI18n()
const router = useRouter()

const { getSlaHoursByPriority } = useSlaSettings()

const loading = ref(false)
const error = ref('')

const showContractSection = computed(() => {
  const user = getUser.value
  if (!user) return false
  if (user.role === UserRole.END_USER || user.role === UserRole.DISTRIBUTOR) return false
  // Technician và Warehouse chỉ thấy ticket/task của mình
  if (user.role === UserRole.TECHNICIAN || user.role === UserRole.WAREHOUSE) return false
  return true
})

/** Nhân viên giới hạn — chỉ thấy ticket/task liên quan đến mình */
const isLimitedStaff = computed(() => {
  const role = getUser.value?.role
  return role === UserRole.TECHNICIAN || role === UserRole.WAREHOUSE
})

const canViewContractFinance = computed(() => hasPermission(Permission.VIEW_CONTRACT_FINANCE))

const contractLoading = ref(false)
const contractMetrics = ref({
  totalDebt: 0,
  unpaidCount: 0,
  draftCount: 0,
})
const unpaidContracts = ref<Contract[]>([])
const unpaidContractsTotal = ref(0)
const draftContracts = ref<Contract[]>([])
const draftContractsTotal = ref(0)

type ContractTab = 'unpaid' | 'draft'
const contractTab = ref<ContractTab>('unpaid')

type OperationsTab = 'tickets' | 'tasks'
const operationsTab = ref<OperationsTab>('tickets')

const activeContractList = computed(() => {
  if (contractTab.value === 'unpaid') return unpaidContracts.value
  return draftContracts.value
})

const activeContractEmptyText = computed(() => {
  if (contractTab.value === 'unpaid') return t('dashboard.contracts.emptyUnpaid')
  return t('dashboard.contracts.emptyDraft')
})

const activeContractDateLabel = computed(() => {
  return contractTab.value === 'draft'
    ? t('dashboard.contracts.columns.createdDate')
    : t('dashboard.contracts.columns.signedDate')
})

const formatContractCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

const formatContractDate = (value?: string | null) => {
  if (!value) return '—'
  return formatDateTime(value, false)
}

const contractDateForRow = (contract: Contract) => {
  return contractTab.value === 'draft'
    ? formatContractDate(contract.created_at)
    : formatContractDate(contract.signed_date)
}

const loadContractDashboard = async () => {
  if (!showContractSection.value) return

  contractLoading.value = true
  try {
    const [metricsRes, unpaidRes, draftRes] = await Promise.all([
      apiClient.get('/contracts/dashboard-metrics'),
      contractService.list({ unpaid: true, limit: 10, page: 1 }),
      contractService.list({ status: 'draft', limit: 10, page: 1 }),
    ])

    if (metricsRes.data) {
      const data = metricsRes.data as {
        total_unpaid_debt?: number
        unpaid_count?: number
        draft_count?: number
      }
      contractMetrics.value = {
        totalDebt: data.total_unpaid_debt || 0,
        unpaidCount: data.unpaid_count || 0,
        draftCount: data.draft_count || 0,
      }
    }

    unpaidContracts.value = unpaidRes.contracts || []
    unpaidContractsTotal.value = unpaidRes.total || 0
    draftContracts.value = draftRes.contracts || []
    draftContractsTotal.value = draftRes.total || 0
  } catch (err) {
    console.error('Error loading contract dashboard:', err)
    contractMetrics.value = {
      totalDebt: 0,
      unpaidCount: 0,
      draftCount: 0,
    }
    unpaidContracts.value = []
    unpaidContractsTotal.value = 0
    draftContracts.value = []
    draftContractsTotal.value = 0
  } finally {
    contractLoading.value = false
  }
}

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

/** Lá»c theo tháº» tá»•ng quan SLA (click card ticket) */
const ticketSlaBucket = ref<null | 'overdue' | 'approaching'>(null)
/** Lá»c theo tháº» tá»•ng quan deadline task (click card task) */
const taskSlaBucket = ref<null | 'overdue' | 'approaching'>(null)

const ticketsByStatus = ref<Array<{ status: string; count: number }>>([])
const ticketStatusSeries = ref<number[]>([])
const ticketStatusLabels = ref<string[]>([])

const { getStatusLabel, getStatusClass, statusFilterOptions } = useTicketStatus()

const PRIORITY_LABEL_KEYS: Record<string, string> = {
  high: 'dashboard.priorityLabels.high',
  medium: 'dashboard.priorityLabels.medium',
  low: 'dashboard.priorityLabels.low',
}


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

    // Limited staff thấy tất cả ticket/task — không auto-filter theo user

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
  operationsTab.value = 'tickets'
  nextTick(() => {
    document.getElementById('dashboard-operations-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  })
}

const toggleTaskSlaFilter = (bucket: 'overdue' | 'approaching') => {
  taskSlaBucket.value = taskSlaBucket.value === bucket ? null : bucket
  operationsTab.value = 'tasks'
  nextTick(() => {
    document.getElementById('dashboard-operations-section')?.scrollIntoView({
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
  return new Date() > new Date(ticket.sla_deadline) && !isTicketClosed(ticket.status)
}

const isApproachingDeadline = (ticket: any) => {
  // Use backend flag if available
  if (ticket.is_approaching_deadline !== undefined) {
    return ticket.is_approaching_deadline
  }
  
  // Calculate locally if backend flag not available
  if (!ticket.sla_deadline) return false
  if (isTicketClosed(ticket.status)) return false
  
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

  // QuÃ¡ háº¡n
  if (diffMs < 0 && !isTicketClosed(ticket.status)) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  }

  // ÄÃ£ Ä‘Ã³ng hoáº·c hoÃ n thÃ nh
  if (isTicketClosed(ticket.status)) {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }

  const diffHours = diffMs / (1000 * 60 * 60)
  const totalHours = getSlaHoursByPriority(ticket.priority)
  const remainingPercent = (diffHours / totalHours) * 100

  // Sáº¯p háº¿t háº¡n (cÃ²n dÆ°á»›i 20% thá»i gian)
  if (remainingPercent <= 20 && diffHours > 0) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  }

  // Trong thá»i gian
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

  // QuÃ¡ háº¡n
  if (diffMs < 0 && !isTicketClosed(ticket.status)) {
    const overdueHours = Math.abs(diffHours)
    if (overdueHours < 24) {
      return t('dashboard.sla.overdueHours', { value: Math.round(overdueHours) })
    }
    return t('dashboard.sla.overdueDays', { value: Math.round(overdueHours / 24) })
  }

  // ÄÃ£ Ä‘Ã³ng hoáº·c hoÃ n thÃ nh
  if (isTicketClosed(ticket.status)) {
    return t('dashboard.sla.completed')
  }

  // Sáº¯p háº¿t háº¡n
  const totalHours = getSlaHoursByPriority(ticket.priority)
  const remainingPercent = (diffHours / totalHours) * 100

  if (remainingPercent <= 20 && diffHours > 0) {
    if (diffHours < 24) {
      return t('dashboard.sla.remainingHours', { value: Math.round(diffHours) })
    }
    return t('dashboard.sla.remainingDays', { value: Math.round(diffHours / 24) })
  }

  // Trong thá»i gian
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
    return !isTicketClosed(ticket.status)
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
    const ticketsResponse = await ticketService.getAllTickets({ limit: 500, page: 1 })
    statisticsData.value.allTickets = ticketsResponse.data || []
    
    const tasksResponse = await scheduleService.getSchedules({ limit: 500, page: 1 })
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
  const counts = Object.fromEntries(TICKET_STATUS_ORDER.map((status) => [status, 0])) as Record<string, number>

  ticketsByStatus.value.forEach((item) => {
    const normalized = normalizeTicketStatus(item.status)
    if (normalized in counts) {
      counts[normalized] += item.count || 0
    }
  })

  const labels: string[] = []
  const series: number[] = []

  for (const status of TICKET_STATUS_ORDER) {
    if (counts[status] > 0) {
      labels.push(t(TICKET_STATUS_I18N_KEY[status as keyof typeof TICKET_STATUS_I18N_KEY]))
      series.push(counts[status])
    }
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
  loadContractDashboard()
  loadDashboardData()
})

useChangeDetection({
  onTicketChange: () => loadDashboardData(),
  onTaskChange: () => loadDashboardData(),
})
</script>
