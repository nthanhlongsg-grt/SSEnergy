<template>
  <admin-layout>
    <div class="px-4 sm:px-0 space-y-4 sm:space-y-6 max-w-full min-w-0 overflow-x-hidden">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 min-w-0">
        <div class="min-w-0">
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('reports.title') }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ t('reports.subtitle') }}
          </p>
        </div>
      </div>

      <!-- Date Range Filter -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm min-w-0"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 min-w-0">
          <div class="min-w-0">
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
          <div class="min-w-0">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('reports.filters.fromDate') }}
            </label>
            <div class="relative min-w-0">
              <flat-pickr
                v-model="dateRange.from"
                :config="flatpickrDateConfig"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :placeholder="t('reports.filters.placeholders.fromDate')"
            />
            </div>
          </div>
          <div class="min-w-0">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('reports.filters.toDate') }}
            </label>
            <div class="relative min-w-0">
              <flat-pickr
                v-model="dateRange.to"
                :config="flatpickrDateConfig"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :placeholder="t('reports.filters.placeholders.toDate')"
              />
            </div>
          </div>
          <div class="min-w-0 sm:col-span-2 lg:col-span-1 flex items-end">
            <button
              @click="applyFilters"
              class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {{ t('reports.filters.apply') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Visual Charts -->
      <div v-if="showChartsSection && !loading" class="space-y-3">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          {{ t('reports.charts.sectionTitle') }}
        </h3>
        <p v-if="dateRange.from && dateRange.to" class="text-xs text-gray-500 dark:text-gray-400">
          {{ t('reports.charts.periodLabel', { from: formatContractDate(dateRange.from), to: formatContractDate(dateRange.to) }) }}
        </p>
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <!-- Doanh thu & HĐ ký -->
          <div
            v-if="showContractSection"
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm xl:col-span-2"
          >
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {{ t('reports.charts.revenueTrend') }}
            </h4>
            <div v-if="hasRevenueTrendData" class="min-h-[280px]">
              <apexchart type="area" height="280" :options="revenueTrendOptions" :series="revenueTrendSeries" />
            </div>
            <p v-else class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              {{ t('reports.charts.noData') }}
              <span class="block mt-1 text-xs">{{ t('reports.charts.emptyHint') }}</span>
            </p>
          </div>

          <!-- Thu vs Chi -->
          <div
            v-if="canViewContractFinance && showExpenseSection"
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
          >
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {{ t('reports.charts.cashFlow') }}
            </h4>
            <div v-if="hasCashFlowData" class="min-h-[260px]">
              <apexchart type="bar" height="260" :options="cashFlowOptions" :series="cashFlowSeries" />
            </div>
            <p v-else class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              {{ t('reports.charts.noData') }}
            </p>
          </div>

          <!-- Thanh toán HĐ -->
          <div
            v-if="canViewContractFinance && chartData.contract_payment"
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
          >
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {{ t('reports.charts.contractPayment') }}
            </h4>
            <div v-if="hasContractPaymentData" class="min-h-[260px]">
              <apexchart type="donut" height="260" :options="contractPaymentOptions" :series="contractPaymentSeries" />
            </div>
            <p v-else class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              {{ t('reports.charts.noData') }}
            </p>
          </div>

          <!-- Chi theo thời gian -->
          <div
            v-if="showExpenseSection"
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
          >
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {{ t('reports.charts.expenseTrend') }}
            </h4>
            <div v-if="hasExpenseTrendData" class="min-h-[260px]">
              <apexchart type="line" height="260" :options="expenseTrendOptions" :series="expenseTrendSeries" />
            </div>
            <p v-else class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              {{ t('reports.charts.noData') }}
            </p>
          </div>

          <!-- Chi theo hạng mục -->
          <div
            v-if="showExpenseSection"
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
          >
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {{ t('reports.charts.expenseByCategory') }}
            </h4>
            <div v-if="hasExpenseCategoryData" class="min-h-[260px]">
              <apexchart type="donut" height="260" :options="expenseCategoryOptions" :series="expenseCategorySeries" />
            </div>
            <p v-else class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              {{ t('reports.charts.noData') }}
            </p>
          </div>

          <!-- Trạng thái chi phí -->
          <div
            v-if="showExpenseSection && chartData.expense_by_status"
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
          >
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {{ t('reports.charts.expenseByStatus') }}
            </h4>
            <div v-if="hasExpenseStatusData" class="min-h-[260px]">
              <apexchart type="donut" height="260" :options="expenseStatusOptions" :series="expenseStatusSeries" />
            </div>
            <p v-else class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
              {{ t('reports.charts.noData') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Contract Report -->
      <div v-if="showContractSection && !loading" class="space-y-3">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          {{ t('reports.contracts.title') }}
        </h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('reports.contracts.signedCount') }}</p>
                <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {{ contractMetrics.signedCount }}
                </p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                <DocsIcon class="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </div>

          <div
            v-if="canViewContractFinance"
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div class="min-w-0">
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('reports.contracts.totalRevenue') }}</p>
                <p class="mt-2 text-2xl font-bold text-green-600 dark:text-green-400 truncate">
                  {{ formatCurrency(contractMetrics.totalRevenue) }}
                </p>
                <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">{{ t('reports.contracts.totalRevenueHint') }}</p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 flex-shrink-0 ml-2">
                <SuccessIcon class="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div
            v-if="canViewContractFinance"
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div class="min-w-0">
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('reports.contracts.totalDebt') }}</p>
                <p class="mt-2 text-2xl font-bold text-red-600 dark:text-red-400 truncate">
                  {{ formatCurrency(contractMetrics.totalDebt) }}
                </p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 flex-shrink-0 ml-2">
                <WarningIcon class="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
          >
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('reports.contracts.repairDevices') }}</p>
                <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  {{ contractMetrics.repairDevices }}
                </p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900">
                <BoxCubeIcon class="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ t('reports.contracts.listTitle') }}
              <span class="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">({{ reportContracts.length }})</span>
            </h4>
            <router-link to="/contracts" class="text-sm text-blue-600 dark:text-blue-400 hover:underline shrink-0">
              {{ t('reports.contracts.viewAll') }}
            </router-link>
          </div>
          <div class="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10">
                <tr>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('reports.contracts.columns.number') }}</th>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('reports.contracts.columns.customer') }}</th>
                  <th v-if="canViewContractFinance" class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('reports.contracts.columns.value') }}</th>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('reports.contracts.columns.signedDate') }}</th>
                  <th class="px-4 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('reports.contracts.columns.devices') }}</th>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('reports.contracts.columns.payment') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr
                  v-for="contract in reportContracts"
                  :key="contract.id"
                  class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  @click="router.push(`/contracts/${contract.id}`)"
                >
                  <td class="px-4 py-2.5 font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap">{{ contract.contract_number }}</td>
                  <td class="px-4 py-2.5 text-gray-900 dark:text-white truncate max-w-[200px]">{{ contract.customer_name || '—' }}</td>
                  <td v-if="canViewContractFinance" class="px-4 py-2.5 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">{{ formatCurrency(contract.value) }}</td>
                  <td class="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ formatContractDate(contract.signed_date) }}</td>
                  <td class="px-4 py-2.5 text-center text-gray-900 dark:text-white">{{ contract.device_count }}</td>
                  <td class="px-4 py-2.5 whitespace-nowrap">
                    <span
                      :class="[
                        'px-2 py-0.5 text-xs font-semibold rounded-full',
                        contract.is_unpaid
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                      ]"
                    >
                      {{ contract.is_unpaid ? t('reports.contracts.paymentUnpaid') : t('reports.contracts.paymentPaid') }}
                    </span>
                  </td>
                </tr>
                <tr v-if="reportContracts.length === 0">
                  <td :colspan="canViewContractFinance ? 6 : 5" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {{ t('reports.contracts.empty') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Expense Report -->
      <div v-if="showExpenseSection && !loading" class="space-y-3">
        <h3 class="text-base font-semibold text-gray-900 dark:text-white">
          {{ t('reports.expenses.title') }}
        </h3>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div class="flex items-center justify-between">
              <div class="min-w-0">
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('reports.expenses.totalPaid') }}</p>
                <p class="mt-2 text-2xl font-bold text-red-600 dark:text-red-400 truncate">
                  {{ formatCurrency(expenseMetrics.totalPaid) }}
                </p>
                <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">{{ t('reports.expenses.totalPaidHint') }}</p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 flex-shrink-0 ml-2">
                <SuccessIcon class="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>

          <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('reports.expenses.paidCount') }}</p>
                <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">{{ expenseMetrics.paidCount }}</p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                <DocsIcon class="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </div>

          <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div class="flex items-center justify-between">
              <div class="min-w-0">
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('reports.expenses.pendingTotal') }}</p>
                <p class="mt-2 text-xl font-bold text-amber-600 dark:text-amber-400 truncate">
                  {{ formatCurrency(expenseMetrics.pendingTotal) }}
                </p>
                <p class="mt-1 text-xs text-gray-500">{{ expenseMetrics.pendingCount }} {{ t('reports.expenses.requests') }}</p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900 flex-shrink-0 ml-2">
                <WarningIcon class="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </div>

          <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <div class="flex items-center justify-between">
              <div class="min-w-0">
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ t('reports.expenses.approvedTotal') }}</p>
                <p class="mt-2 text-xl font-bold text-blue-600 dark:text-blue-400 truncate">
                  {{ formatCurrency(expenseMetrics.approvedTotal) }}
                </p>
                <p class="mt-1 text-xs text-gray-500">{{ expenseMetrics.approvedCount }} {{ t('reports.expenses.requests') }}</p>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 flex-shrink-0 ml-2">
                <TaskIcon class="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <!-- Phân bổ theo hạng mục -->
        <div
          v-if="expenseByCategory.length > 0"
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
        >
          <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">{{ t('reports.expenses.byCategory') }}</h4>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div
              v-for="row in expenseByCategory"
              :key="row.expense_category"
              class="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/40 text-sm"
            >
              <span class="text-gray-700 dark:text-gray-300 truncate">{{ expenseCategoryLabel(row.expense_category) }}</span>
              <span class="font-semibold text-gray-900 dark:text-white whitespace-nowrap">{{ formatCurrency(row.total) }}</span>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ t('reports.expenses.listTitle') }}
              <span class="ml-2 text-xs font-normal text-gray-500 dark:text-gray-400">({{ expenseItems.length }})</span>
            </h4>
            <router-link to="/payment-requests" class="text-sm text-blue-600 dark:text-blue-400 hover:underline shrink-0">
              {{ t('reports.expenses.viewAll') }}
            </router-link>
          </div>
          <div class="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10">
                <tr>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('reports.expenses.columns.number') }}</th>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('reports.expenses.columns.date') }}</th>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('reports.expenses.columns.content') }}</th>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('reports.expenses.columns.category') }}</th>
                  <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('reports.expenses.columns.amount') }}</th>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('reports.expenses.columns.requester') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr
                  v-for="item in expenseItems"
                  :key="item.id"
                  class="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  @click="router.push(`/payment-requests/${item.id}`)"
                >
                  <td class="px-4 py-2.5 font-mono text-blue-600 dark:text-blue-400 whitespace-nowrap">{{ item.request_number }}</td>
                  <td class="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ formatExpenseDate(item) }}</td>
                  <td class="px-4 py-2.5 text-gray-900 dark:text-white truncate max-w-[200px]">{{ item.payment_content }}</td>
                  <td class="px-4 py-2.5 whitespace-nowrap">
                    <span v-if="item.expense_category" class="px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                      {{ expenseCategoryLabel(item.expense_category) }}
                    </span>
                    <span v-else class="text-gray-400">—</span>
                  </td>
                  <td class="px-4 py-2.5 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">{{ formatCurrency(item.amount) }}</td>
                  <td class="px-4 py-2.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ item.requested_by_name || '—' }}</td>
                </tr>
                <tr v-if="expenseItems.length === 0">
                  <td colspan="6" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {{ t('reports.expenses.empty') }}
                  </td>
                </tr>
              </tbody>
            </table>
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
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import {
  BoxCubeIcon,
  WarningIcon,
  TaskIcon,
  DocsIcon,
  SuccessIcon,
} from '../../../icons'
import { apiClient } from '@/services/api'
import { formatDateTime, getVietnamWeekRange, getVietnamFullMonthRange, getVietnamYearRange } from '@/utils/dateTime'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { useFlatpickrConfig } from '@/composables/useFlatpickr'
import { getUser, UserRole, hasPermission, Permission } from '@/composables/useAuth'
import { paymentRequestService } from '@/services/paymentRequestService'
import { reportService, type ReportChartsData } from '@/services/reportService'

const { t } = useI18n()
const router = useRouter()
const { dateConfig } = useFlatpickrConfig()

const flatpickrDateConfig = dateConfig

const loading = ref(false)
const error = ref('')

const showContractSection = computed(() => {
  const user = getUser.value
  if (!user) return false
  if (user.role === UserRole.END_USER || user.role === UserRole.DISTRIBUTOR) return false
  if (user.role === UserRole.TECHNICIAN || user.role === UserRole.WAREHOUSE) return false
  return true
})

const canViewContractFinance = computed(() => hasPermission(Permission.VIEW_CONTRACT_FINANCE))

const showExpenseSection = computed(() => hasPermission(Permission.REVIEW_PAYMENT_REQUEST))

const showChartsSection = computed(() => showContractSection.value || showExpenseSection.value)

const chartData = ref<ReportChartsData>({
  granularity: 'day',
  revenue_trend: [],
  expense_trend: [],
  contract_payment: null,
  expense_by_category: [],
  expense_by_status: null,
  cash_flow: { revenue: 0, expense: 0 },
})

const CHART_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16']

const formatCurrencyShort = (value: number) => {
  const abs = Math.abs(value || 0)
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(Math.round(value || 0))
}

const formatPeriodLabel = (period: string, granularity: ReportChartsData['granularity']) => {
  if (granularity === 'month' && /^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split('-')
    return `${month}/${year}`
  }
  if (granularity === 'week' && period.includes('-W')) {
    return period.replace('-W', ' W')
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    const [, month, day] = period.split('-')
    return `${day}/${month}`
  }
  return period
}

const revenueTrendCategories = computed(() =>
  chartData.value.revenue_trend.map((row) =>
    formatPeriodLabel(row.period, chartData.value.granularity),
  ),
)

const hasRevenueTrendData = computed(() =>
  chartData.value.revenue_trend.some((row) => row.revenue > 0 || row.signed_count > 0),
)

const revenueTrendSeries = computed(() => {
  const series: Array<{ name: string; type: string; data: number[] }> = []
  if (canViewContractFinance.value) {
    series.push({
      name: t('reports.charts.revenue'),
      type: 'area',
      data: chartData.value.revenue_trend.map((row) => row.revenue),
    })
  }
  series.push({
    name: t('reports.charts.signedContracts'),
    type: 'line',
    data: chartData.value.revenue_trend.map((row) => row.signed_count),
  })
  return series
})

const revenueTrendOptions = computed(() => ({
  chart: {
    type: 'area',
    toolbar: { show: false },
    fontFamily: 'inherit',
  },
  colors: ['#10B981', '#6366F1'],
  stroke: { curve: 'smooth', width: [2, 3] },
  fill: {
    type: 'gradient',
    gradient: { opacityFrom: 0.35, opacityTo: 0.05 },
  },
  dataLabels: { enabled: false },
  xaxis: {
    categories: revenueTrendCategories.value,
    labels: { rotate: -45, style: { fontSize: '11px' } },
  },
  yaxis: [
    {
      seriesName: t('reports.charts.revenue'),
      show: canViewContractFinance.value,
      labels: {
        formatter: (val: number) => formatCurrencyShort(val),
      },
      title: canViewContractFinance.value
        ? { text: t('reports.charts.revenue'), style: { fontSize: '11px' } }
        : undefined,
    },
    {
      opposite: true,
      seriesName: t('reports.charts.signedContracts'),
      labels: { formatter: (val: number) => String(Math.round(val)) },
      title: { text: t('reports.charts.signedContracts'), style: { fontSize: '11px' } },
    },
  ],
  tooltip: {
    shared: true,
    intersect: false,
    y: {
      formatter: (val: number, opts: { seriesIndex: number }) => {
        if (canViewContractFinance.value && opts.seriesIndex === 0) {
          return formatCurrency(val)
        }
        return String(Math.round(val))
      },
    },
  },
  legend: { position: 'top', horizontalAlign: 'right' },
  grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
}))

const hasCashFlowData = computed(
  () => chartData.value.cash_flow.revenue > 0 || chartData.value.cash_flow.expense > 0,
)

const cashFlowSeries = computed(() => [
  {
    name: t('reports.charts.cashFlow'),
    data: [chartData.value.cash_flow.revenue, chartData.value.cash_flow.expense],
  },
])

const cashFlowOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
  colors: ['#10B981', '#EF4444'],
  plotOptions: {
    bar: { borderRadius: 6, columnWidth: '45%', distributed: true },
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => formatCurrencyShort(val),
    style: { fontSize: '11px' },
  },
  legend: { show: false },
  xaxis: {
    categories: [t('reports.charts.cashFlowRevenue'), t('reports.charts.cashFlowExpense')],
  },
  yaxis: {
    labels: { formatter: (val: number) => formatCurrencyShort(val) },
  },
  tooltip: {
    y: { formatter: (val: number) => formatCurrency(val) },
  },
  grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
}))

const hasContractPaymentData = computed(() => {
  const p = chartData.value.contract_payment
  if (!p) return false
  return p.paid_value > 0 || p.unpaid_value > 0
})

const contractPaymentSeries = computed(() => {
  const p = chartData.value.contract_payment
  if (!p) return []
  return [p.paid_value, p.unpaid_value]
})

const contractPaymentOptions = computed(() => ({
  chart: { type: 'donut', fontFamily: 'inherit' },
  labels: [t('reports.charts.paymentPaid'), t('reports.charts.paymentUnpaid')],
  colors: ['#10B981', '#EF4444'],
  legend: { position: 'bottom' },
  dataLabels: {
    enabled: true,
    formatter: (_val: number, opts: { seriesIndex: number }) => {
      const amount = contractPaymentSeries.value[opts.seriesIndex] ?? 0
      return formatCurrencyShort(amount)
    },
  },
  tooltip: {
    y: { formatter: (val: number) => formatCurrency(val) },
  },
  plotOptions: {
    pie: { donut: { size: '62%' } },
  },
}))

const expenseTrendCategories = computed(() =>
  chartData.value.expense_trend.map((row) =>
    formatPeriodLabel(row.period, chartData.value.granularity),
  ),
)

const hasExpenseTrendData = computed(() =>
  chartData.value.expense_trend.some((row) => row.total > 0),
)

const expenseTrendSeries = computed(() => [
  {
    name: t('reports.charts.expenseAmount'),
    data: chartData.value.expense_trend.map((row) => row.total),
  },
])

const expenseTrendOptions = computed(() => ({
  chart: { type: 'line', toolbar: { show: false }, fontFamily: 'inherit' },
  colors: ['#EF4444'],
  stroke: { curve: 'smooth', width: 3 },
  dataLabels: { enabled: false },
  xaxis: {
    categories: expenseTrendCategories.value,
    labels: { rotate: -45, style: { fontSize: '11px' } },
  },
  yaxis: {
    labels: { formatter: (val: number) => formatCurrencyShort(val) },
  },
  tooltip: {
    y: { formatter: (val: number) => formatCurrency(val) },
  },
  grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
}))

const expenseCategoryLabels = computed(() =>
  chartData.value.expense_by_category.map((row) =>
    expenseCategoryLabel(row.expense_category),
  ),
)

const hasExpenseCategoryData = computed(() =>
  chartData.value.expense_by_category.some((row) => row.total > 0),
)

const expenseCategorySeries = computed(() =>
  chartData.value.expense_by_category.map((row) => row.total),
)

const expenseCategoryOptions = computed(() => ({
  chart: { type: 'donut', fontFamily: 'inherit' },
  labels: expenseCategoryLabels.value,
  colors: CHART_COLORS,
  legend: { position: 'bottom', fontSize: '12px' },
  dataLabels: {
    enabled: true,
    formatter: (_val: number, opts: { seriesIndex: number }) =>
      formatCurrencyShort(expenseCategorySeries.value[opts.seriesIndex] ?? 0),
  },
  tooltip: {
    y: { formatter: (val: number) => formatCurrency(val) },
  },
  plotOptions: {
    pie: { donut: { size: '58%' } },
  },
}))

const hasExpenseStatusData = computed(() => {
  const s = chartData.value.expense_by_status
  if (!s) return false
  return s.pending > 0 || s.approved > 0 || s.paid > 0
})

const expenseStatusSeries = computed(() => {
  const s = chartData.value.expense_by_status
  if (!s) return []
  return [s.pending, s.approved, s.paid]
})

const expenseStatusOptions = computed(() => ({
  chart: { type: 'donut', fontFamily: 'inherit' },
  labels: [
    t('reports.charts.statusPending'),
    t('reports.charts.statusApproved'),
    t('reports.charts.statusPaid'),
  ],
  colors: ['#F59E0B', '#3B82F6', '#10B981'],
  legend: { position: 'bottom' },
  dataLabels: {
    enabled: true,
    formatter: (_val: number, opts: { seriesIndex: number }) =>
      formatCurrencyShort(expenseStatusSeries.value[opts.seriesIndex] ?? 0),
  },
  tooltip: {
    y: { formatter: (val: number) => formatCurrency(val) },
  },
  plotOptions: {
    pie: { donut: { size: '58%' } },
  },
}))

interface ReportContractRow {
  id: number
  contract_number: string
  customer_name?: string | null
  value: number
  signed_date?: string | null
  status: string
  device_count: number
  is_unpaid: boolean
}

const reportContracts = ref<ReportContractRow[]>([])

const contractMetrics = ref({
  signedCount: 0,
  totalRevenue: 0,
  totalDebt: 0,
  repairDevices: 0,
})

const expenseMetrics = ref({
  totalPaid: 0,
  paidCount: 0,
  pendingCount: 0,
  approvedCount: 0,
  pendingTotal: 0,
  approvedTotal: 0,
})

const expenseByCategory = ref<Array<{ expense_category: string; count: number; total: number }>>([])
const expenseItems = ref<Array<{
  id: number
  request_number: string
  amount: number
  payment_date?: string | null
  payment_content: string
  expense_category?: string | null
  requested_by_name?: string
  expense_date?: string
}>>([])

// Date range filter
const reportType = ref<'week' | 'month' | 'year' | 'custom'>('year')
const dateRange = ref({
  from: '',
  to: '',
})

const initializeDateRange = () => {
  switch (reportType.value) {
    case 'week':
      dateRange.value = getVietnamWeekRange()
      break
    case 'month':
      dateRange.value = getVietnamFullMonthRange()
      break
    case 'year':
      dateRange.value = getVietnamYearRange()
      break
    case 'custom':
      if (!dateRange.value.from || !dateRange.value.to) {
        dateRange.value = getVietnamYearRange()
      }
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
  loadDashboardData()
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

const formatContractDate = (value?: string | null) => {
  if (!value) return '—'
  const normalized = value.includes('T') ? value : `${value}T00:00:00`
  return formatDateTime(normalized, false)
}

const expenseCategoryLabel = (cat: string) =>
  t(`paymentRequests.expenseCategory.${cat}`, cat)

const formatExpenseDate = (item: { payment_date?: string | null; expense_date?: string }) => {
  const raw = item.payment_date || item.expense_date
  if (!raw) return '—'
  return formatDateTime(raw.includes('T') ? raw : `${raw}T00:00:00`, false)
}

const loadChartData = async () => {
  if (!showChartsSection.value) {
    chartData.value = {
      granularity: 'day',
      revenue_trend: [],
      expense_trend: [],
      contract_payment: null,
      expense_by_category: [],
      expense_by_status: null,
      cash_flow: { revenue: 0, expense: 0 },
    }
    return
  }

  try {
    chartData.value = await reportService.getCharts(
      dateRange.value.from || undefined,
      dateRange.value.to || undefined,
    )
  } catch (err) {
    console.error('Error loading chart data:', err)
    chartData.value = {
      granularity: 'day',
      revenue_trend: [],
      expense_trend: [],
      contract_payment: null,
      expense_by_category: [],
      expense_by_status: null,
      cash_flow: { revenue: 0, expense: 0 },
    }
  }
}

const loadExpenseMetrics = async () => {
  if (!showExpenseSection.value) {
    expenseItems.value = []
    expenseByCategory.value = []
    return
  }

  try {
    const data = await paymentRequestService.getExpenseReport(
      dateRange.value.from || undefined,
      dateRange.value.to || undefined,
    )
    expenseMetrics.value = {
      totalPaid: data.total_paid || 0,
      paidCount: data.paid_count || 0,
      pendingCount: data.pending_count || 0,
      approvedCount: data.approved_count || 0,
      pendingTotal: data.pending_total || 0,
      approvedTotal: data.approved_total || 0,
    }
    expenseByCategory.value = data.by_category || []
    expenseItems.value = data.items || []
  } catch (err) {
    console.error('Error loading expense metrics:', err)
    expenseMetrics.value = {
      totalPaid: 0,
      paidCount: 0,
      pendingCount: 0,
      approvedCount: 0,
      pendingTotal: 0,
      approvedTotal: 0,
    }
    expenseByCategory.value = []
    expenseItems.value = []
  }
}

const loadContractMetrics = async () => {
  if (!showContractSection.value) {
    reportContracts.value = []
    return
  }

  try {
    const params: Record<string, string> = {}
    if (dateRange.value.from && dateRange.value.to) {
      params.from = dateRange.value.from
      params.to = dateRange.value.to
    }

    const queryString = new URLSearchParams(params).toString()
    const url = queryString ? `/reports/contracts?${queryString}` : '/reports/contracts'
    const response = await apiClient.get(url)
    if (response.error) {
      throw new Error(response.error)
    }

    const data = response.data as {
      signed_count?: number
      total_revenue?: number
      total_debt?: number
      repair_devices?: number
      contracts?: ReportContractRow[]
    }

    contractMetrics.value = {
      signedCount: data.signed_count || 0,
      totalRevenue: data.total_revenue || 0,
      totalDebt: data.total_debt || 0,
      repairDevices: data.repair_devices || 0,
    }
    reportContracts.value = data.contracts || []
  } catch (err) {
    console.error('Error loading contract metrics:', err)
    contractMetrics.value = {
      signedCount: 0,
      totalRevenue: 0,
      totalDebt: 0,
      repairDevices: 0,
    }
    reportContracts.value = []
  }
}

const loadDashboardData = async () => {
  loading.value = true
  error.value = ''

  try {
    await loadChartData()
    await loadContractMetrics()
    await loadExpenseMetrics()
  } catch (err) {
    console.error('Error loading report data:', err)
    error.value = err instanceof Error ? err.message : t('dashboard.alerts.loadFailed')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  reportType.value = 'year'
  initializeDateRange()
  loadDashboardData()
})
</script>
