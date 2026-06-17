<template>
  <admin-layout>
    <div class="space-y-5">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('cashFlow.report.title') }}
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ t('cashFlow.report.subtitle') }}</p>
        </div>
      </div>

      <!-- Filter bar -->
      <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 shadow-sm">
        <div class="flex flex-wrap gap-2 items-center">
          <select
            v-model="periodType"
            class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            @change="onPeriodChange"
          >
            <option value="month">{{ t('reports.filters.types.month') }}</option>
            <option value="quarter">{{ t('cashFlow.report.quarter') }}</option>
            <option value="year">{{ t('reports.filters.types.year') }}</option>
            <option value="custom">{{ t('reports.filters.types.custom') }}</option>
          </select>
          <template v-if="periodType === 'custom'">
            <AppDatePicker v-model="dateRange.from" :placeholder="t('reports.filters.placeholders.fromDate')"
              input-class="w-[8.5rem] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <AppDatePicker v-model="dateRange.to" :placeholder="t('reports.filters.placeholders.toDate')"
              input-class="w-[8.5rem] px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </template>
          <button @click="load" class="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
            {{ t('reports.filters.apply') }}
          </button>
          <span v-if="dateRange.from && dateRange.to" class="text-xs text-gray-400 dark:text-gray-500">
            {{ formatDate(dateRange.from) }} – {{ formatDate(dateRange.to) }}
          </span>
        </div>
      </div>

      <!-- Summary cards -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div class="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
          <p class="text-xs font-medium text-green-600 dark:text-green-400">{{ t('cashFlow.report.totalIn') }}</p>
          <p class="text-xl font-bold text-green-700 dark:text-green-300 mt-1 tabular-nums">{{ fmtCur(stats.total_in) }}</p>
        </div>
        <div class="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
          <p class="text-xs font-medium text-red-600 dark:text-red-400">{{ t('cashFlow.report.totalOut') }}</p>
          <p class="text-xl font-bold text-red-700 dark:text-red-300 mt-1 tabular-nums">{{ fmtCur(stats.total_out) }}</p>
        </div>
        <div class="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-4">
          <p class="text-xs font-medium text-orange-600 dark:text-orange-400">{{ t('cashFlow.report.pending') }}</p>
          <p class="text-xl font-bold text-orange-700 dark:text-orange-300 mt-1 tabular-nums">{{ fmtCur(stats.pending_out) }}</p>
        </div>
        <div class="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
          <p class="text-xs font-medium text-blue-600 dark:text-blue-400">{{ t('cashFlow.report.balance') }}</p>
          <p class="text-xl font-bold mt-1 tabular-nums" :class="netBalance >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-red-700 dark:text-red-300'">
            {{ netBalance >= 0 ? '+' : '' }}{{ fmtCur(netBalance) }}
          </p>
        </div>
      </div>

      <div v-if="loading" class="py-16 text-center text-gray-500 dark:text-gray-400 text-sm">{{ t('common.loading') }}</div>

      <template v-else>
        <!-- Charts row -->
        <div class="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <!-- Bar chart: monthly receipt vs expense -->
          <div class="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm xl:col-span-2">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">{{ t('cashFlow.report.monthlyChart') }}</h3>
            <div v-if="hasMonthlyData" class="min-h-[280px]">
              <apexchart type="bar" height="280" :options="monthlyChartOptions" :series="monthlySeries" />
            </div>
            <p v-else class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">{{ t('reports.charts.noData') }}</p>
          </div>

          <!-- Donut: expenses by category -->
          <div class="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">{{ t('cashFlow.report.byCategory') }}</h3>
            <div v-if="hasCategoryData" class="min-h-[260px]">
              <apexchart type="donut" height="260" :options="categoryChartOptions" :series="categorySeries" />
            </div>
            <p v-else class="py-12 text-center text-sm text-gray-500 dark:text-gray-400">{{ t('reports.charts.noData') }}</p>
          </div>

          <!-- Category breakdown table -->
          <div class="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">{{ t('cashFlow.report.categoryBreakdown') }}</h3>
            <div v-if="hasCategoryData" class="space-y-2">
              <div v-for="cat in stats.by_category" :key="cat.category" class="flex items-center gap-3">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{{ categoryLabel(cat.category) }}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">{{ cat.count }} {{ t('cashFlow.report.items') }}</span>
                  </div>
                  <div class="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div class="h-full rounded-full bg-red-500 transition-all" :style="{ width: catPercent(cat.total) + '%' }" />
                  </div>
                </div>
                <span class="text-sm font-semibold text-red-600 dark:text-red-400 whitespace-nowrap tabular-nums">{{ fmtCur(cat.total) }}</span>
              </div>
            </div>
            <p v-else class="py-6 text-center text-sm text-gray-500 dark:text-gray-400">{{ t('reports.charts.noData') }}</p>
          </div>
        </div>

        <!-- Monthly table -->
        <div class="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ t('cashFlow.report.monthlyTable') }}</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[480px] text-sm">
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
                <tr v-for="m in mergedMonths" :key="m.month" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 font-medium text-gray-900 dark:text-white">{{ fmtMonth(m.month) }}</td>
                  <td class="px-4 py-3 text-right text-green-700 dark:text-green-400 tabular-nums">{{ fmtCur(m.in) }}</td>
                  <td class="px-4 py-3 text-right text-red-600 dark:text-red-400 tabular-nums">{{ fmtCur(m.out) }}</td>
                  <td class="px-4 py-3 text-right font-medium tabular-nums" :class="m.net >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    {{ m.net >= 0 ? '+' : '' }}{{ fmtCur(m.net) }}
                  </td>
                  <td class="px-4 py-3 text-right font-semibold text-blue-700 dark:text-blue-300 tabular-nums">{{ fmtCur(m.cumulative) }}</td>
                </tr>
                <tr v-if="!mergedMonths.length">
                  <td colspan="5" class="px-4 py-10 text-center text-gray-500 dark:text-gray-400 text-sm">{{ t('cashFund.report.empty') }}</td>
                </tr>
              </tbody>
              <tfoot v-if="mergedMonths.length" class="bg-gray-50 dark:bg-gray-700/50 border-t-2 border-gray-200 dark:border-gray-600">
                <tr>
                  <td class="px-4 py-3 font-bold text-gray-900 dark:text-white text-xs uppercase">{{ t('cashFund.report.total') }}</td>
                  <td class="px-4 py-3 text-right font-bold text-green-700 dark:text-green-400 tabular-nums">{{ fmtCur(stats.total_in) }}</td>
                  <td class="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400 tabular-nums">{{ fmtCur(stats.total_out) }}</td>
                  <td class="px-4 py-3 text-right font-bold tabular-nums" :class="netBalance >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                    {{ netBalance >= 0 ? '+' : '' }}{{ fmtCur(netBalance) }}
                  </td>
                  <td class="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <!-- Expense transactions -->
        <div class="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ t('cashFlow.report.expenseList') }}</h3>
            <div class="flex items-center gap-2">
              <select v-model="expenseCategory" @change="loadExpenses"
                class="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                <option value="">{{ t('cashFlow.report.allCategories') }}</option>
                <option v-for="c in CATEGORIES" :key="c.value" :value="c.value">{{ c.label }}</option>
              </select>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[480px] text-sm">
              <thead class="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('cashFlow.report.expDate') }}</th>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('cashFlow.report.expContent') }}</th>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 hidden sm:table-cell">{{ t('cashFlow.report.expCategory') }}</th>
                  <th class="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('cashFlow.report.expAmount') }}</th>
                  <th class="px-4 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">{{ t('cashFlow.report.expPayer') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-for="e in expenses" :key="e.id" class="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td class="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ e.payment_date ? formatDate(e.payment_date) : '—' }}</td>
                  <td class="px-4 py-3 text-gray-800 dark:text-gray-200">
                    <p class="truncate max-w-[200px] text-xs sm:text-sm">{{ e.payment_content }}</p>
                    <span class="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{{ e.request_number }}</span>
                  </td>
                  <td class="px-4 py-3 hidden sm:table-cell">
                    <span class="inline-flex px-2 py-0.5 text-[11px] rounded-full font-medium" :class="catBadgeClass(e.expense_category)">
                      {{ categoryLabel(e.expense_category) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right font-semibold text-red-600 dark:text-red-400 whitespace-nowrap tabular-nums text-xs sm:text-sm">
                    {{ fmtCur(e.amount) }}
                  </td>
                  <td class="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">{{ e.payer_name || e.requester_name || '—' }}</td>
                </tr>
                <tr v-if="!expenses.length && !expLoading">
                  <td colspan="5" class="px-4 py-10 text-center text-gray-500 dark:text-gray-400 text-sm">{{ t('cashFlow.report.noExpenses') }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="expTotalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ expTotal }} {{ t('cashFund.records') }}</p>
            <div class="flex gap-2">
              <button :disabled="expPage <= 1" @click="changeExpPage(expPage - 1)" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50">{{ t('common.prev') }}</button>
              <button :disabled="expPage >= expTotalPages" @click="changeExpPage(expPage + 1)" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50">{{ t('common.next') }}</button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import AppDatePicker from '@/components/forms/AppDatePicker.vue'
import { getApiBaseUrl } from '@/utils/apiUrl'
import { getVietnamFullMonthRange, getVietnamYearRange } from '@/utils/dateTime'

const { t } = useI18n()

const BASE = `${getApiBaseUrl()}/api/cash-fund`
const authHdr = (): HeadersInit => {
  const tk = localStorage.getItem('token')
  return tk ? { Authorization: `Bearer ${tk}` } : {}
}

const CATEGORIES = [
  { value: 'tools', label: 'Công cụ / dụng cụ' },
  { value: 'materials', label: 'Vật tư / linh kiện' },
  { value: 'external_labor', label: 'Nhân công ngoài' },
  { value: 'transport', label: 'Vận chuyển' },
  { value: 'business_travel', label: 'Công tác phí' },
  { value: 'office', label: 'Văn phòng phẩm' },
  { value: 'entertainment', label: 'Tiếp khách' },
  { value: 'other', label: 'Khác' },
]

const categoryLabel = (v: string | null) => CATEGORIES.find(c => c.value === (v || 'other'))?.label ?? 'Khác'
const catPercent = (v: number) => stats.value.total_out > 0 ? Math.round((v / stats.value.total_out) * 100) : 0
const catBadgeClass = (c: string | null) => {
  const map: Record<string, string> = {
    tools: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    materials: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    external_labor: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    transport: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    business_travel: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    office: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    entertainment: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    other: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  }
  return map[c || 'other'] ?? map.other
}

// Filters
type PeriodType = 'month' | 'quarter' | 'year' | 'custom'
const periodType = ref<PeriodType>('year')
const dateRange = reactive({ from: '', to: '' })

const onPeriodChange = () => {
  const yr = getVietnamYearRange()
  const mo = getVietnamFullMonthRange()
  if (periodType.value === 'month') Object.assign(dateRange, mo)
  else if (periodType.value === 'year') Object.assign(dateRange, yr)
  else if (periodType.value === 'quarter') {
    const now = new Date()
    const q = Math.floor(now.getMonth() / 3)
    const from = new Date(now.getFullYear(), q * 3, 1)
    const to = new Date(now.getFullYear(), q * 3 + 3, 0)
    dateRange.from = from.toISOString().slice(0, 10)
    dateRange.to = to.toISOString().slice(0, 10)
  }
  load()
}

// Stats
interface StatsData {
  receipts_monthly: Array<{ month: string; total: number }>
  expenses_monthly: Array<{ month: string; total: number }>
  by_category: Array<{ category: string; total: number; count: number }>
  total_in: number
  total_out: number
  pending_out: number
}
const loading = ref(false)
const stats = ref<StatsData>({ receipts_monthly: [], expenses_monthly: [], by_category: [], total_in: 0, total_out: 0, pending_out: 0 })
const netBalance = computed(() => stats.value.total_in - stats.value.total_out)

const load = async () => {
  loading.value = true
  try {
    const q = new URLSearchParams()
    if (dateRange.from) q.set('from', dateRange.from)
    if (dateRange.to) q.set('to', dateRange.to)
    const res = await fetch(`${BASE}/stats?${q}`, { headers: authHdr() })
    if (res.ok) stats.value = await res.json()
    await loadExpenses()
  } finally { loading.value = false }
}

// Merge monthly data
const mergedMonths = computed(() => {
  const map: Record<string, { month: string; in: number; out: number }> = {}
  for (const r of stats.value.receipts_monthly) map[r.month] = { month: r.month, in: r.total, out: 0 }
  for (const e of stats.value.expenses_monthly) {
    if (!map[e.month]) map[e.month] = { month: e.month, in: 0, out: 0 }
    map[e.month].out = e.total
  }
  const months = Object.values(map).sort((a, b) => a.month.localeCompare(b.month))
  let cum = 0
  return months.map(m => { cum += m.in - m.out; return { ...m, net: m.in - m.out, cumulative: cum } })
})

// Charts
const hasMonthlyData = computed(() => mergedMonths.value.some(m => m.in > 0 || m.out > 0))
const hasCategoryData = computed(() => stats.value.by_category.length > 0)

const CHART_COLORS = ['#EF4444','#F97316','#EAB308','#84CC16','#10B981','#06B6D4','#6366F1','#EC4899']
const isDark = () => document.documentElement.classList.contains('dark')

const monthlyChartOptions = computed(() => ({
  chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit', background: 'transparent' },
  colors: ['#10B981', '#EF4444'],
  plotOptions: { bar: { borderRadius: 4, columnWidth: '55%', grouped: true } },
  dataLabels: { enabled: false },
  xaxis: {
    categories: mergedMonths.value.map(m => fmtMonth(m.month)),
    labels: { rotate: -35, style: { fontSize: '11px', colors: isDark() ? '#9CA3AF' : '#6B7280' } },
    axisBorder: { show: false },
  },
  yaxis: { labels: { formatter: (v: number) => fmtShort(v), style: { fontSize: '11px', colors: isDark() ? '#9CA3AF' : '#6B7280' } } },
  legend: { position: 'top', horizontalAlign: 'right', fontSize: '12px', labels: { colors: isDark() ? '#D1D5DB' : '#374151' } },
  tooltip: { shared: true, intersect: false, y: { formatter: (v: number) => fmtCur(v) } },
  grid: { borderColor: isDark() ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
  theme: { mode: isDark() ? 'dark' : 'light' },
}))

const monthlySeries = computed(() => [
  { name: t('cashFlow.report.totalIn'), data: mergedMonths.value.map(m => m.in) },
  { name: t('cashFlow.report.totalOut'), data: mergedMonths.value.map(m => m.out) },
])

const categoryChartOptions = computed(() => ({
  chart: { type: 'donut', fontFamily: 'inherit', background: 'transparent' },
  labels: stats.value.by_category.map(c => categoryLabel(c.category)),
  colors: CHART_COLORS,
  legend: { position: 'bottom', fontSize: '12px', labels: { colors: isDark() ? '#D1D5DB' : '#374151' } },
  dataLabels: {
    enabled: true,
    formatter: (_v: number, opts: { seriesIndex: number }) => {
      const v = stats.value.by_category[opts.seriesIndex]?.total ?? 0
      return fmtShort(v)
    },
    style: { fontSize: '11px' },
  },
  tooltip: { y: { formatter: (v: number) => fmtCur(v) } },
  plotOptions: { pie: { donut: { size: '60%' } } },
  theme: { mode: isDark() ? 'dark' : 'light' },
}))

const categorySeries = computed(() => stats.value.by_category.map(c => c.total))

// Expenses list
interface ExpenseRow {
  id: number
  request_number: string
  payment_date: string
  payment_content: string
  amount: number
  expense_category: string | null
  payer_name: string | null
  requester_name: string | null
}
const expenses = ref<ExpenseRow[]>([])
const expTotal = ref(0)
const expPage = ref(1)
const expLoading = ref(false)
const expenseCategory = ref('')
const EXP_LIMIT = 15
const expTotalPages = computed(() => Math.ceil(expTotal.value / EXP_LIMIT))

const loadExpenses = async () => {
  expLoading.value = true
  try {
    const q = new URLSearchParams()
    if (dateRange.from) q.set('from', dateRange.from)
    if (dateRange.to) q.set('to', dateRange.to)
    if (expenseCategory.value) q.set('category', expenseCategory.value)
    q.set('page', String(expPage.value)); q.set('limit', String(EXP_LIMIT))
    const res = await fetch(`${BASE}/expenses?${q}`, { headers: authHdr() })
    if (res.ok) { const d = await res.json(); expenses.value = d.data; expTotal.value = d.pagination.total }
  } finally { expLoading.value = false }
}

const changeExpPage = (p: number) => { expPage.value = p; loadExpenses() }

// Formatters
const fmtCur = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v ?? 0)
const fmtShort = (v: number) => {
  if (v >= 1e9) return (v / 1e9).toFixed(1) + ' tỷ'
  if (v >= 1e6) return (v / 1e6).toFixed(1) + ' tr'
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'k'
  return String(Math.round(v))
}
const formatDate = (d: string) => d ? new Date(d.slice(0, 10) + 'T00:00:00').toLocaleDateString('vi-VN') : '—'
const fmtMonth = (m: string) => { const [y, mo] = m.split('-'); return `T${parseInt(mo)}/${y}` }

onMounted(() => {
  Object.assign(dateRange, getVietnamYearRange())
  load()
})
</script>
