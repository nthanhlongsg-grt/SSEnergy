<template>
  <admin-layout>
    <div class="space-y-5">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('cashFund.title') }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ t('cashFund.subtitle') }}</p>
        </div>
        <button
          v-if="canManage"
          type="button"
          @click="openCreateModal()"
          class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          {{ t('cashFund.actions.create') }}
        </button>
      </div>

      <!-- Balance cards -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
          <p class="text-xs font-medium text-green-600 dark:text-green-400">{{ t('cashFund.balance.totalIn') }}</p>
          <p class="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">{{ formatCurrency(balance.receipts) }}</p>
        </div>
        <div class="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <p class="text-xs font-medium text-red-600 dark:text-red-400">{{ t('cashFund.balance.totalOut') }}</p>
          <p class="text-2xl font-bold text-red-700 dark:text-red-300 mt-1">{{ formatCurrency(balance.expenses) }}</p>
        </div>
        <div class="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
          <p class="text-xs font-medium text-blue-600 dark:text-blue-400">{{ t('cashFund.balance.current') }}</p>
          <p class="text-2xl font-bold mt-1" :class="balance.balance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'">
            {{ formatCurrency(balance.balance) }}
          </p>
        </div>
      </div>

      <!-- Tab: List / Report -->
      <div class="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          v-for="tab in tabs" :key="tab.key"
          @click="activeTab = tab.key"
          class="px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
          :class="activeTab === tab.key
            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
        >
          {{ tab.label }}
        </button>
      </div>

      <!-- TAB: Danh sách phiếu thu -->
      <template v-if="activeTab === 'list'">
        <!-- Filters -->
        <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
          <div class="grid grid-cols-2 sm:flex sm:flex-wrap xl:flex-nowrap gap-2 items-center">
            <div class="col-span-2 sm:flex-1 min-w-[180px]">
              <input
                v-model="filters.search"
                type="text"
                :placeholder="t('cashFund.filters.searchPlaceholder')"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                @keyup.enter="applyFilters"
              />
            </div>
            <select
              v-model="dateReportType"
              class="w-full sm:w-auto sm:shrink-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              @change="onDateTypeChange"
            >
              <option value="">{{ t('reports.filters.types.all') }}</option>
              <option value="week">{{ t('reports.filters.types.week') }}</option>
              <option value="month">{{ t('reports.filters.types.month') }}</option>
              <option value="year">{{ t('reports.filters.types.year') }}</option>
              <option value="custom">{{ t('reports.filters.types.custom') }}</option>
            </select>
            <template v-if="dateReportType">
              <AppDatePicker v-model="dateRange.from" :disabled="!dateReportType" :placeholder="t('reports.filters.placeholders.fromDate')"
                input-class="w-full sm:w-[8.5rem] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
              <AppDatePicker v-model="dateRange.to" :disabled="!dateReportType" :placeholder="t('reports.filters.placeholders.toDate')"
                input-class="w-full sm:w-[8.5rem] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </template>
            <button @click="applyFilters" class="w-full sm:w-auto px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              {{ t('cashFund.filters.apply') }}
            </button>
            <button @click="clearFilters" class="w-full sm:w-auto px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              {{ t('cashFund.filters.clear') }}
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div v-if="loading" class="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">{{ t('common.loading') }}</div>
          <div v-else-if="error" class="p-4 text-red-600 dark:text-red-400 text-sm">{{ error }}</div>
          <template v-else>
            <div class="overflow-x-auto">
              <table class="w-full min-w-[480px] text-sm">
                <thead class="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('cashFund.columns.date') }}</th>
                    <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('cashFund.columns.content') }}</th>
                    <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 whitespace-nowrap">{{ t('cashFund.columns.amount') }}</th>
                    <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">{{ t('cashFund.columns.notes') }}</th>
                    <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">{{ t('cashFund.columns.managedBy') }}</th>
                    <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">{{ t('cashFund.columns.createdBy') }}</th>
                    <th v-if="canManage" class="px-4 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 w-16"></th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  <tr v-for="item in items" :key="item.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td class="px-4 py-3 whitespace-nowrap text-gray-700 dark:text-gray-300 text-xs">{{ formatDate(item.receipt_date) }}</td>
                    <td class="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[200px]">
                      <p class="truncate">{{ item.content }}</p>
                    </td>
                    <td class="px-4 py-3 text-right font-semibold text-green-700 dark:text-green-400 whitespace-nowrap">
                      +{{ formatCurrency(item.amount) }}
                    </td>
                    <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs hidden sm:table-cell max-w-[160px] truncate">{{ item.notes || '—' }}</td>
                    <td class="px-4 py-3 text-gray-700 dark:text-gray-300 text-xs hidden md:table-cell whitespace-nowrap">{{ item.managed_by_name || '—' }}</td>
                    <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs hidden lg:table-cell whitespace-nowrap">{{ item.created_by_name || '—' }}</td>
                    <td v-if="canManage" class="px-4 py-3 text-center">
                      <div class="flex items-center justify-center gap-2">
                        <button @click="openEditModal(item)" class="text-blue-500 hover:text-blue-700">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                        </button>
                        <button v-if="canDelete" @click="confirmDelete(item)" class="text-red-500 hover:text-red-700">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="items.length === 0">
                    <td :colspan="canManage ? 7 : 6" class="px-4 py-10 text-center text-gray-500 dark:text-gray-400">{{ t('cashFund.empty') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <!-- Pagination -->
            <div v-if="totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ total }} {{ t('cashFund.records') }}</p>
              <div class="flex gap-2">
                <button :disabled="page <= 1" @click="changePage(page - 1)" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50">{{ t('common.prev') }}</button>
                <button :disabled="page >= totalPages" @click="changePage(page + 1)" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50">{{ t('common.next') }}</button>
              </div>
            </div>
          </template>
        </div>
      </template>

      <!-- TAB: Báo cáo tháng -->
      <template v-if="activeTab === 'report'">
        <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
          <div class="flex flex-wrap gap-3 items-center">
            <select v-model="reportPeriod" @change="loadReport" class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="year">{{ t('reports.filters.types.year') }}</option>
              <option value="all">{{ t('reports.filters.types.all') }}</option>
            </select>
          </div>
        </div>

        <div v-if="reportLoading" class="py-12 text-center text-gray-500 dark:text-gray-400 text-sm">{{ t('common.loading') }}</div>
        <div v-else-if="report" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[560px] text-sm">
              <thead class="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('cashFund.report.month') }}</th>
                  <th class="px-4 py-2.5 text-right text-xs font-medium text-green-600 dark:text-green-400">{{ t('cashFund.report.receipts') }}</th>
                  <th class="px-4 py-2.5 text-right text-xs font-medium text-red-600 dark:text-red-400">{{ t('cashFund.report.expenses') }}</th>
                  <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('cashFund.report.net') }}</th>
                  <th class="px-4 py-2.5 text-right text-xs font-medium text-blue-600 dark:text-blue-400">{{ t('cashFund.report.cumulative') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-for="m in report.months" :key="m.month" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ formatMonth(m.month) }}</td>
                  <td class="px-4 py-3 text-right text-green-700 dark:text-green-400 font-medium">{{ formatCurrency(m.receipts) }}</td>
                  <td class="px-4 py-3 text-right text-red-600 dark:text-red-400">{{ formatCurrency(m.expenses) }}</td>
                  <td class="px-4 py-3 text-right font-medium" :class="m.net >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    {{ m.net >= 0 ? '+' : '' }}{{ formatCurrency(m.net) }}
                  </td>
                  <td class="px-4 py-3 text-right font-semibold text-blue-700 dark:text-blue-300">{{ formatCurrency(m.cumulative) }}</td>
                </tr>
                <tr v-if="!report.months.length">
                  <td colspan="5" class="px-4 py-10 text-center text-gray-500 dark:text-gray-400">{{ t('cashFund.report.empty') }}</td>
                </tr>
              </tbody>
              <tfoot class="bg-gray-50 dark:bg-gray-700/50 border-t-2 border-gray-200 dark:border-gray-600">
                <tr>
                  <td class="px-4 py-3 font-bold text-gray-900 dark:text-white text-xs uppercase">{{ t('cashFund.report.total') }}</td>
                  <td class="px-4 py-3 text-right font-bold text-green-700 dark:text-green-400">{{ formatCurrency(report.total_receipts) }}</td>
                  <td class="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">{{ formatCurrency(report.total_expenses) }}</td>
                  <td class="px-4 py-3 text-right font-bold" :class="report.net >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    {{ report.net >= 0 ? '+' : '' }}{{ formatCurrency(report.net) }}
                  </td>
                  <td class="px-4 py-3 text-right font-bold text-blue-700 dark:text-blue-300">{{ formatCurrency(report.net) }}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </template>
    </div>

    <!-- Create/Edit Modal -->
    <div v-if="showModal" class="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50" @click.self="closeModal">
      <div class="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md p-5 sm:p-6">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">
            {{ editingItem ? t('cashFund.modal.editTitle') : t('cashFund.modal.createTitle') }}
          </h3>
          <button @click="closeModal" class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <form @submit.prevent="submitModal" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('cashFund.form.date') }} <span class="text-red-500">*</span></label>
            <AppDatePicker v-model="form.receipt_date" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('cashFund.form.amount') }} <span class="text-red-500">*</span></label>
            <input
              v-model="amountDisplay"
              type="text"
              inputmode="numeric"
              :placeholder="t('cashFund.form.amountPlaceholder')"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              @input="onAmountInput"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('cashFund.form.content') }} <span class="text-red-500">*</span></label>
            <input v-model="form.content" type="text" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('cashFund.form.managedBy') }}</label>
            <select v-model="form.managed_by" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
              <option :value="null">— {{ t('cashFund.form.noManager') }} —</option>
              <option v-for="m in managers" :key="m.id" :value="m.id">{{ m.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ t('cashFund.form.notes') }}</label>
            <textarea v-model="form.notes" rows="2" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none" />
          </div>
          <p v-if="formError" class="text-sm text-red-600 dark:text-red-400">{{ formError }}</p>
          <div class="flex gap-3 pt-1">
            <button type="button" @click="closeModal" class="flex-1 px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
              {{ t('common.cancel') }}
            </button>
            <button type="submit" :disabled="saving" class="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              {{ saving ? t('common.saving') : t('common.save') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppDatePicker from '@/components/forms/AppDatePicker.vue'
import { hasPermission, Permission } from '@/composables/useAuth'
import { cashFundService, type CashReceipt, type CashManager, type CashFundBalance, type CashFundReport } from '@/services/cashFundService'
import { getVietnamWeekRange, getVietnamFullMonthRange, getVietnamYearRange } from '@/utils/dateTime'

const { t } = useI18n()

const canManage = computed(() => hasPermission(Permission.MANAGE_CASH_FUND))
const canDelete = computed(() => hasPermission(Permission.MANAGE_CASH_FUND))

const tabs = computed(() => [
  { key: 'list', label: t('cashFund.tabs.list') },
  { key: 'report', label: t('cashFund.tabs.report') },
])
const activeTab = ref<'list' | 'report'>('list')

// Balance
const balance = ref<CashFundBalance>({ receipts: 0, expenses: 0, balance: 0 })

// List state
const items = ref<CashReceipt[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = 20
const loading = ref(false)
const error = ref('')
const totalPages = computed(() => Math.ceil(total.value / pageSize))

const filters = ref({ search: '' })
type DateReportType = '' | 'week' | 'month' | 'year' | 'custom'
const dateReportType = ref<DateReportType>('')
const dateRange = reactive({ from: '', to: '' })
const appliedDateRange = reactive({ from: '', to: '' })

const onDateTypeChange = () => {
  if (!dateReportType.value) { applyDateClear(); return }
  if (dateReportType.value === 'week') Object.assign(dateRange, getVietnamWeekRange())
  else if (dateReportType.value === 'month') Object.assign(dateRange, getVietnamFullMonthRange())
  else if (dateReportType.value === 'year') Object.assign(dateRange, getVietnamYearRange())
  else if (dateReportType.value === 'custom' && !dateRange.from) Object.assign(dateRange, getVietnamYearRange())
  if (dateReportType.value !== 'custom') applyFilters()
}

watch([() => dateRange.from, () => dateRange.to], () => {
  if (dateReportType.value !== 'custom' || !dateRange.from || !dateRange.to) return
  const a = new Date(`${dateRange.from}T00:00:00`), b = new Date(`${dateRange.to}T00:00:00`)
  if (a > b) { const tmp = dateRange.from; dateRange.from = dateRange.to; dateRange.to = tmp }
})

const applyFilters = () => {
  if (dateReportType.value && dateRange.from && dateRange.to) {
    appliedDateRange.from = dateRange.from; appliedDateRange.to = dateRange.to
  }
  page.value = 1; loadItems()
}

const applyDateClear = () => {
  dateReportType.value = ''; dateRange.from = ''; dateRange.to = ''
  appliedDateRange.from = ''; appliedDateRange.to = ''
  page.value = 1; loadItems()
}

const clearFilters = () => {
  filters.value.search = ''
  applyDateClear()
}

const loadItems = async () => {
  loading.value = true; error.value = ''
  try {
    const res = await cashFundService.list({
      search: filters.value.search || undefined,
      from: appliedDateRange.from || undefined,
      to: appliedDateRange.to || undefined,
      page: page.value, limit: pageSize,
    })
    items.value = res.data; total.value = res.pagination.total
  } catch (e) {
    error.value = e instanceof Error ? e.message : t('cashFund.errors.loadFailed')
  } finally {
    loading.value = false
  }
}

const loadBalance = async () => {
  try { balance.value = await cashFundService.balance() } catch {}
}

const changePage = (p: number) => { page.value = p; loadItems() }

// Report
const reportLoading = ref(false)
const report = ref<CashFundReport | null>(null)
const reportPeriod = ref<'year' | 'all'>('year')

const loadReport = async () => {
  reportLoading.value = true
  try {
    const yearRange = getVietnamYearRange()
    const from = reportPeriod.value === 'year' ? yearRange.from : undefined
    const to = reportPeriod.value === 'year' ? yearRange.to : undefined
    report.value = await cashFundService.report(from, to)
  } catch {} finally { reportLoading.value = false }
}

watch(activeTab, (tab) => { if (tab === 'report' && !report.value) loadReport() })

// Modal
const showModal = ref(false)
const editingItem = ref<CashReceipt | null>(null)
const saving = ref(false)
const formError = ref('')
const amountDisplay = ref('')
const managers = ref<CashManager[]>([])
const form = reactive({ receipt_date: '', amount: 0, content: '', notes: '', managed_by: null as number | null })

const onAmountInput = (e: Event) => {
  const raw = (e.target as HTMLInputElement).value.replace(/\D/g, '')
  form.amount = Number(raw)
  amountDisplay.value = raw ? Number(raw).toLocaleString('vi-VN') : ''
}

const openCreateModal = () => {
  editingItem.value = null
  const today = new Date().toISOString().slice(0, 10)
  Object.assign(form, { receipt_date: today, amount: 0, content: '', notes: '', managed_by: null })
  amountDisplay.value = ''
  formError.value = ''
  showModal.value = true
  if (!managers.value.length) cashFundService.getManagers().then(r => { managers.value = r }).catch(() => {})
}

const openEditModal = (item: CashReceipt) => {
  editingItem.value = item
  Object.assign(form, { receipt_date: item.receipt_date?.slice(0, 10) || '', amount: item.amount, content: item.content, notes: item.notes || '', managed_by: item.managed_by ?? null })
  amountDisplay.value = item.amount > 0 ? item.amount.toLocaleString('vi-VN') : ''
  formError.value = ''
  showModal.value = true
  if (!managers.value.length) cashFundService.getManagers().then(r => { managers.value = r }).catch(() => {})
}

const closeModal = () => { showModal.value = false }

const submitModal = async () => {
  formError.value = ''
  if (!form.receipt_date || !form.amount || !form.content.trim()) {
    formError.value = t('cashFund.errors.required'); return
  }
  saving.value = true
  try {
    if (editingItem.value) {
      await cashFundService.update(editingItem.value.id, { receipt_date: form.receipt_date, amount: form.amount, content: form.content, notes: form.notes || undefined, managed_by: form.managed_by })
    } else {
      await cashFundService.create({ receipt_date: form.receipt_date, amount: form.amount, content: form.content, notes: form.notes || undefined, managed_by: form.managed_by })
    }
    closeModal(); loadItems(); loadBalance()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : t('cashFund.errors.saveFailed')
  } finally { saving.value = false }
}

const confirmDelete = async (item: CashReceipt) => {
  if (!confirm(t('cashFund.confirmDelete', { content: item.content }))) return
  try { await cashFundService.remove(item.id); loadItems(); loadBalance() } catch {}
}

// Formatters
const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v ?? 0)
const formatDate = (d: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('vi-VN') : '—'
const formatMonth = (m: string) => {
  const [y, mo] = m.split('-')
  return `Tháng ${parseInt(mo)}/${y}`
}

onMounted(() => { loadItems(); loadBalance() })
</script>
