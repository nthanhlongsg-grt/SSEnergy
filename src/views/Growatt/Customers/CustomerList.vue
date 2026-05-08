<template>
  <admin-layout>
    <div class="px-4 sm:px-0 space-y-4 sm:space-y-6 overflow-x-hidden max-w-full">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 min-w-0">
        <div class="min-w-0">
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('customers.list.header.title') }}
          </h1>
          <p class="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
            {{ t('customers.list.header.subtitle') }}
          </p>
        </div>
        <button
          @click="showAddModal = true"
          class="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors whitespace-nowrap touch-manipulation min-h-[44px] sm:min-h-0"
        >
          <PlusIcon class="h-5 w-5" />
          <span>{{ t('customers.list.actions.addNew') }}</span>
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 min-w-0">
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm min-w-0"
        >
          <div class="flex items-center justify-between">
            <div class="min-w-0 flex-1">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ t('customers.list.stats.totalCustomers') }}</p>
              <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.totalCustomers }}
              </p>
            </div>
            <UserCircleIcon class="h-8 w-8 sm:h-10 sm:w-10 text-blue-500 flex-shrink-0 ml-2" />
          </div>
        </div>
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm min-w-0"
        >
          <div class="flex items-center justify-between">
            <div class="min-w-0 flex-1">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ t('customers.list.stats.totalProjects') }}</p>
              <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.totalProjects }}
              </p>
            </div>
            <BoxCubeIcon class="h-8 w-8 sm:h-10 sm:w-10 text-green-500 flex-shrink-0 ml-2" />
          </div>
        </div>
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm min-w-0"
        >
          <div class="flex items-center justify-between">
            <div class="min-w-0 flex-1">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ t('customers.list.stats.distributors') }}</p>
              <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.totalDistributors }}
              </p>
            </div>
            <UserGroupIcon class="h-8 w-8 sm:h-10 sm:w-10 text-purple-500 flex-shrink-0 ml-2" />
          </div>
        </div>
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm min-w-0"
        >
          <div class="flex items-center justify-between">
            <div class="min-w-0 flex-1">
              <p class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{{ t('customers.list.stats.activeDevices') }}</p>
              <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ stats.activeInverters }}
              </p>
            </div>
            <BoxIcon class="h-8 w-8 sm:h-10 sm:w-10 text-yellow-500 flex-shrink-0 ml-2" />
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm"
      >
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 min-w-0">
          <div class="min-w-0">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('customers.list.filters.search') }}
            </label>
            <input
              v-model="filters.search"
              type="text"
              :placeholder="t('customers.list.filters.searchPlaceholder')"
              class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
            />
          </div>
          <div class="min-w-0">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('customers.list.filters.type') }}
            </label>
            <select
              v-model="filters.type"
              class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
            >
              <option value="">{{ t('customers.list.filters.all') }}</option>
              <option value="end_user">{{ t('customers.list.typeOptions.endUser') }}</option>
              <option value="distributor">{{ t('customers.list.typeOptions.distributor') }}</option>
              <option value="user">{{ t('customers.list.typeOptions.registeredAccount') }}</option>
            </select>
          </div>
          <div class="min-w-0">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('customers.list.filters.province') }}
            </label>
            <select
              v-model="filters.province"
              class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
            >
              <option value="">{{ t('customers.list.filters.all') }}</option>
              <option value="hcm">{{ t('customers.list.provinces.hcm') }}</option>
              <option value="hn">{{ t('customers.list.provinces.hn') }}</option>
              <option value="dn">{{ t('customers.list.provinces.dn') }}</option>
              <option value="hp">{{ t('customers.list.provinces.hp') }}</option>
              <option value="can-tho">{{ t('customers.list.provinces.canTho') }}</option>
            </select>
          </div>
          <div class="flex items-end min-w-0">
            <button
              @click="clearFilters"
              class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors touch-manipulation min-h-[44px] sm:min-h-0 text-sm sm:text-base"
            >
              {{ t('customers.list.filters.clearFilters') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Customers Table - Desktop View -->
      <div
        class="hidden md:block rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div class="overflow-x-auto overflow-y-auto max-h-[600px] w-full">
          <table class="w-full min-w-[1000px]">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[180px]"
                >
                  {{ t('customers.list.table.customer') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]"
                >
                  {{ t('customers.list.table.source') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]"
                >
                  {{ t('customers.list.table.type') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px]"
                >
                  {{ t('customers.list.table.contact') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[150px] max-w-[200px]"
                >
                  {{ t('customers.list.table.address') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[120px] max-w-[150px]"
                >
                  {{ t('customers.list.table.distributor') }}
                </th>
                <th
                  class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[80px]"
                >
                  {{ t('customers.list.table.projects') }}
                </th>
                <th
                  class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[80px]"
                >
                  {{ t('customers.list.table.devices') }}
                </th>
                <th
                  class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider min-w-[100px]"
                >
                  {{ t('customers.list.table.actions') }}
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <!-- Loading State -->
              <tr v-if="loading">
                <td colspan="9" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  {{ t('customers.list.table.loading') }}
                </td>
              </tr>
              <!-- Error State -->
              <tr v-else-if="error">
                <td colspan="9" class="px-4 py-8 text-center text-red-500 dark:text-red-400">
                  {{ error }}
                </td>
              </tr>
              <!-- Empty State -->
              <tr v-else-if="filteredCustomers.length === 0">
                <td colspan="9" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  {{ t('customers.list.table.noCustomers') }}
                </td>
              </tr>
              <!-- Data Rows -->
              <tr
                v-else
                v-for="customer in paginatedCustomers"
                :key="customer.id"
                class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                @click="$router.push(`/customers/${customer.id}`)"
              >
                <td class="px-4 py-4">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {{ customer.name }}
                      </p>
                      <span
                        :class="[
                          'px-1.5 py-0.5 text-xs font-semibold rounded flex-shrink-0',
                          getSourceClass(customer.source || 'customer'),
                        ]"
                        :title="customer.source === 'user' ? t('customers.list.source.accountTooltip') : t('customers.list.source.customerTooltip')"
                      >
                        {{ customer.source === 'user' ? '👤' : '📋' }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {{ customer.email || t('common.na') }}
                    </p>
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      getSourceClass(customer.source || 'customer'),
                    ]"
                    :title="customer.source === 'user' ? t('customers.list.source.accountTooltip') : t('customers.list.source.customerTooltip')"
                  >
                    {{ getSourceLabel(customer.source || 'customer') }}
                  </span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      getTypeClass(customer.type),
                    ]"
                  >
                    {{ getTypeLabel(customer.type) }}
                  </span>
                </td>
                <td class="px-4 py-4">
                  <div class="min-w-0">
                    <p class="text-sm text-gray-900 dark:text-white truncate">
                      {{ customer.phone || t('common.na') }}
                    </p>
                    <p v-if="customer.contactPerson" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {{ t('customers.list.table.contactPerson') }} {{ customer.contactPerson }}
                    </p>
                  </div>
                </td>
                <td class="px-4 py-4">
                  <p class="text-sm text-gray-900 dark:text-white truncate" :title="customer.address || t('common.na')">
                    {{ customer.address || t('common.na') }}
                  </p>
                </td>
                <td class="px-4 py-4">
                  <div class="min-w-0">
                    <p v-if="customer.type === 'end_user' && customer.distributor_name" class="text-sm text-gray-900 dark:text-white truncate" :title="customer.distributor_name">
                      {{ customer.distributor_name }}
                    </p>
                    <p v-else-if="customer.type === 'distributor'" class="text-sm text-gray-500 dark:text-gray-400 truncate" :title="customer.organization || t('common.na')">
                      {{ customer.organization || t('common.na') }}
                    </p>
                    <p v-else class="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {{ t('common.na') }}
                    </p>
                    <p v-if="customer.type === 'end_user' && customer.distributor_code" class="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {{ customer.distributor_code }}
                    </p>
                  </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-center">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ customer.projectCount || 0 }}
                  </span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-center">
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ customer.inverterCount || 0 }}
                  </span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm" @click.stop>
                  <router-link
                    :to="`/customers/${customer.id}`"
                    class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                  >
                    {{ t('customers.list.table.view') }}
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div class="text-xs sm:text-sm text-gray-700 dark:text-gray-300 text-center sm:text-left">
              {{ t('customers.list.pagination.showing', { 
                start: (currentPage - 1) * itemsPerPage + 1, 
                end: Math.min(currentPage * itemsPerPage, filteredCustomers.length),
                total: filteredCustomers.length 
              }) }}
            </div>
            <div class="flex flex-wrap items-center gap-2 justify-center">
              <button
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 touch-manipulation min-h-[44px] sm:min-h-0"
              >
                {{ t('customers.list.pagination.previous') }}
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
                {{ t('customers.list.pagination.next') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Card View -->
      <div class="md:hidden space-y-3">
        <!-- Loading State -->
        <div v-if="loading" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
          {{ t('customers.list.table.loading') }}
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="rounded-lg bg-white dark:bg-gray-800 border border-red-200 dark:border-red-800 p-6 text-center text-red-500 dark:text-red-400">
          {{ error }}
        </div>

        <!-- Empty State -->
        <div v-else-if="filteredCustomers.length === 0" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
          {{ t('customers.list.table.noCustomers') }}
        </div>

        <!-- Customer Cards -->
        <div
          v-for="customer in paginatedCustomers"
          :key="customer.id"
          @click="$router.push(`/customers/${customer.id}`)"
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm active:bg-gray-50 dark:active:bg-gray-700 cursor-pointer touch-manipulation"
        >
          <!-- Header: Name, Source Badge -->
          <div class="flex justify-between items-start mb-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-semibold text-gray-900 dark:text-white text-base truncate">
                  {{ customer.name }}
                </h3>
                <span
                  :class="[
                    'px-1.5 py-0.5 text-xs font-semibold rounded flex-shrink-0',
                    getSourceClass(customer.source || 'customer'),
                  ]"
                  :title="customer.source === 'user' ? t('customers.list.source.accountTooltip') : t('customers.list.source.customerTooltip')"
                >
                  {{ customer.source === 'user' ? '👤' : '📋' }}
                </span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                {{ customer.email || t('common.na') }}
              </p>
            </div>
          </div>

          <!-- Type and Source -->
          <div class="mb-3 flex items-center gap-2 flex-wrap">
            <span
              :class="[
                'px-2 py-1 text-xs font-semibold rounded-full',
                getSourceClass(customer.source || 'customer'),
              ]"
            >
              {{ getSourceLabel(customer.source || 'customer') }}
            </span>
            <span
              :class="[
                'px-2 py-1 text-xs font-semibold rounded-full',
                customer.type === 'distributor'
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  : customer.type === 'end_user'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
              ]"
            >
              {{ getTypeLabel(customer.type) }}
            </span>
          </div>

          <!-- Contact Info -->
          <div class="mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <p class="text-xs text-gray-500 dark:text-gray-400 truncate flex-1">
              {{ customer.phone || t('common.na') }}
            </p>
          </div>

          <!-- Address -->
          <div v-if="customer.address" class="mb-3 flex items-start gap-2">
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 flex-1">
              {{ customer.address }}
            </p>
          </div>

          <!-- Distributor Info -->
          <div v-if="customer.type === 'end_user' && customer.distributor_name" class="mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <div class="min-w-0 flex-1">
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('customers.list.table.distributor') }}</p>
              <p class="text-xs text-gray-900 dark:text-white truncate">{{ customer.distributor_name }}</p>
              <p v-if="customer.distributor_code" class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ customer.distributor_code }}</p>
            </div>
          </div>

          <!-- Footer: Projects, Devices, View -->
          <div class="flex items-center justify-between gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3 flex-1">
              <div class="text-center">
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('customers.list.table.projects') }}</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ customer.projectCount || 0 }}</p>
              </div>
              <div class="text-center">
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ t('customers.list.table.devices') }}</p>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ customer.inverterCount || 0 }}</p>
              </div>
            </div>
            <router-link
              :to="`/customers/${customer.id}`"
              @click.stop
              class="px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 touch-manipulation min-h-[32px] flex items-center"
            >
              {{ t('customers.list.table.view') }}
            </router-link>
          </div>
        </div>

        <!-- Mobile Pagination -->
        <div v-if="totalPages > 1" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex flex-col items-center justify-between gap-3">
            <div class="text-xs text-gray-700 dark:text-gray-300 text-center">
              {{ t('customers.list.pagination.showing', { 
                start: (currentPage - 1) * itemsPerPage + 1, 
                end: Math.min(currentPage * itemsPerPage, filteredCustomers.length),
                total: filteredCustomers.length 
              }) }}
            </div>
            <div class="flex items-center gap-2 w-full">
              <button
                @click="currentPage = Math.max(1, currentPage - 1)"
                :disabled="currentPage === 1"
                class="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 touch-manipulation min-h-[44px]"
              >
                {{ t('customers.list.pagination.previous') }}
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
                {{ t('customers.list.pagination.next') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Add Customer Modal -->
      <div
        v-if="showAddModal"
        class="fixed inset-0 z-50 flex items-start justify-center bg-gray-700/45 dark:bg-gray-900/65 overflow-y-auto pt-4 pb-4 sm:pt-8 sm:pb-8 overflow-x-hidden p-4"
        @click.self="showAddModal = false"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-[min(100vw-2rem,42rem)] mx-4 my-4 sm:my-8"
        >
          <div class="p-4 sm:p-6 max-h-[calc(100vh-2rem)] sm:max-h-[85vh] overflow-y-auto overflow-x-hidden">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {{ t('customers.list.modal.title') }}
              </h2>
              <button
                @click="closeAddModal"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form @submit.prevent="saveCustomer">
              <!-- Error Message -->
              <div v-if="addError" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p class="text-sm text-red-800 dark:text-red-200">{{ addError }}</p>
              </div>
              
              <!-- Success Message -->
              <div v-if="addSuccessMessage" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p class="text-sm text-green-800 dark:text-green-200">{{ addSuccessMessage }}</p>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 min-w-0">
                <div class="min-w-0">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('customers.list.modal.name') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="customerForm.name"
                    type="text"
                    required
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                </div>
                <div class="min-w-0">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('customers.list.modal.email') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="customerForm.email"
                    type="email"
                    required
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                </div>
                <div class="min-w-0">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('customers.list.modal.role') }} <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="customerForm.role"
                    required
                    @change="handleRoleChange"
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  >
                    <option value="">{{ t('customers.list.modal.selectRole') }}</option>
                    <option value="distributor">{{ t('customers.list.roleOptions.distributor') }}</option>
                    <option value="end_user">{{ t('customers.list.roleOptions.endUser') }}</option>
                  </select>
                </div>
                <div class="min-w-0">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('customers.list.modal.distributor') }}
                  </label>
                  <select
                    v-model="customerForm.parent_distributor_id"
                    :disabled="customerForm.role === 'distributor'"
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  >
                    <template v-if="customerForm.role === 'distributor'">
                      <option :value="null">Growatt Việt Nam</option>
                    </template>
                    <template v-else>
                      <option :value="null">{{ t('customers.list.modal.selectDistributor') }}</option>
                      <option
                        v-for="distributor in distributors"
                        :key="distributor.id"
                        :value="distributor.id"
                      >
                        {{ distributor.name }} {{ distributor.code ? `(${distributor.code})` : '' }}
                      </option>
                      <option value="other">{{ t('customers.list.modal.otherDistributor') }}</option>
                    </template>
                  </select>
                  <p v-if="customerForm.role === 'distributor'" class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {{ t('customers.list.modal.distributorNote') }}
                  </p>
                </div>
                <div v-if="customerForm.parent_distributor_id === 'other'" class="min-w-0">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('customers.list.modal.otherDistributorName') }}
                  </label>
                  <input
                    v-model="customerForm.other_distributor_name"
                    type="text"
                    :placeholder="t('customers.list.modal.otherDistributorNamePlaceholder')"
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                </div>
                <div class="min-w-0">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('customers.list.modal.phone') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="customerForm.phone"
                    type="tel"
                    required
                    :placeholder="t('customers.list.modal.phonePlaceholder')"
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                </div>
                <div class="min-w-0">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('customers.list.modal.organization') }}
                  </label>
                  <input
                    v-model="customerForm.organization"
                    type="text"
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                </div>
                <div class="min-w-0">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('customers.list.modal.address') }}
                  </label>
                  <input
                    v-model="customerForm.address"
                    type="text"
                    :placeholder="t('customers.list.modal.addressPlaceholder')"
                    class="w-full px-4 py-2.5 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white touch-manipulation min-h-[44px] sm:min-h-0 text-base sm:text-sm"
                  />
                </div>
                <div class="min-w-0 col-span-2">
                  <p class="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    <span class="font-medium">{{ t('customers.list.modal.passwordNote') }}:</span> {{ t('customers.list.modal.defaultPassword') }}
                  </p>
                </div>
              </div>
              <div class="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                <button
                  type="button"
                  @click="closeAddModal"
                  class="w-full sm:w-auto px-4 py-2.5 sm:py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 active:bg-gray-400 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 dark:active:bg-gray-500 transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  {{ t('customers.list.modal.cancel') }}
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-manipulation min-h-[44px] sm:min-h-0"
                >
                  {{ saving ? t('customers.list.modal.creating') : t('customers.list.modal.create') }}
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
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { PlusIcon, UserCircleIcon, BoxCubeIcon, UserGroupIcon, BoxIcon } from '../../../icons'
import { apiClient } from '@/services/api'
import { userService } from '@/services/userService'
import { UserStatus } from '@/composables/useAuth'

const { t } = useI18n()

const showAddModal = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const addError = ref<string | null>(null)
const addSuccessMessage = ref<string | null>(null)

const customerForm = ref({
  name: '',
  email: '',
  role: '',
  phone: '',
  organization: '',
  address: '',
  parent_distributor_id: null as number | string | null,
  other_distributor_name: '',
})

const stats = ref({
  totalCustomers: 0,
  totalProjects: 0,
  totalDistributors: 0,
  activeInverters: 0,
})

const filters = ref({
  search: '',
  type: '',
  province: '',
})

const customers = ref<any[]>([])
const distributors = ref<any[]>([])
const currentPage = ref(1)
const itemsPerPage = 20

const closeAddModal = () => {
  showAddModal.value = false
  addError.value = null
  addSuccessMessage.value = null
  customerForm.value = {
    name: '',
    email: '',
    role: '',
    phone: '',
    organization: '',
    address: '',
    parent_distributor_id: null,
    other_distributor_name: '',
  }
}

const handleRoleChange = () => {
  // Reset distributor selection when role changes
  if (customerForm.value.role === 'distributor') {
    customerForm.value.parent_distributor_id = null
    customerForm.value.other_distributor_name = ''
  } else if (customerForm.value.role === 'end_user') {
    // Don't reset when switching to end_user - allow user to select
    // Only reset if coming from distributor role
    // Keep any existing selection
  } else {
    customerForm.value.parent_distributor_id = null
    customerForm.value.other_distributor_name = ''
  }
}

// Watch for role changes to auto-update distributor field
watch(() => customerForm.value.role, (newRole, oldRole) => {
  if (newRole === 'distributor') {
    // Force set to null when role is distributor
    customerForm.value.parent_distributor_id = null
    customerForm.value.other_distributor_name = ''
  } else if (newRole === 'end_user') {
    // Only reset if switching from distributor role
    // Allow user to select distributor when role is end_user
    if (oldRole === 'distributor') {
      customerForm.value.parent_distributor_id = null
    }
    // Don't reset if user has already selected a distributor
  } else if (!newRole) {
    // Reset when role is cleared
    customerForm.value.parent_distributor_id = null
    customerForm.value.other_distributor_name = ''
  }
})

const saveCustomer = async () => {
  saving.value = true
  addError.value = null
  addSuccessMessage.value = null
  
  try {
    // Validate role
    if (customerForm.value.role !== 'distributor' && customerForm.value.role !== 'end_user') {
      addError.value = t('customers.list.messages.selectRole')
      saving.value = false
      return
    }

    // Validate other distributor name if selected
    if (customerForm.value.parent_distributor_id === 'other' && !customerForm.value.other_distributor_name?.trim()) {
      addError.value = t('customers.list.messages.otherDistributorNameRequired')
      saving.value = false
      return
    }

    // Determine parent_distributor_id
    let parentDistributorId: number | undefined = undefined
    if (customerForm.value.role === 'end_user') {
      if (customerForm.value.parent_distributor_id === 'other') {
        // For "other", we'll handle it differently - maybe create a distributor or just store the name
        // For now, we'll set it to null and store the name in organization or notes
        parentDistributorId = undefined
      } else if (customerForm.value.parent_distributor_id && typeof customerForm.value.parent_distributor_id === 'number') {
        parentDistributorId = customerForm.value.parent_distributor_id
      }
    }

    // Create user via userService with default password
    await userService.createUser({
      name: customerForm.value.name,
      email: customerForm.value.email,
      phone: customerForm.value.phone,
      address: customerForm.value.address || undefined,
      organization: customerForm.value.role === 'end_user' && customerForm.value.parent_distributor_id === 'other' 
        ? customerForm.value.other_distributor_name 
        : (customerForm.value.organization || undefined),
      role: customerForm.value.role as any,
      password: 'GRTVN2025', // Default password
      status: UserStatus.ACTIVE,
      parent_distributor_id: parentDistributorId,
    })

    addSuccessMessage.value = t('customers.list.messages.createSuccess')
    
    // Refresh customer list
    await fetchCustomers()
    
    // Close modal after 1.5 seconds
    setTimeout(() => {
      closeAddModal()
    }, 1500)
  } catch (err: any) {
    console.error('Error creating customer:', err)
    addError.value = err?.message || t('customers.list.messages.createError')
  } finally {
    saving.value = false
  }
}

// Fetch distributors from distributors table
const fetchDistributors = async () => {
  try {
    const response = await apiClient.get('/distributors?status=active')
    if (response.error) {
      throw new Error(response.error)
    }
    const data = response.data as any[]
    distributors.value = Array.isArray(data) ? data : []
  } catch (err) {
    console.error('Error fetching distributors:', err)
    distributors.value = []
  }
}

// Fetch customers from API
const fetchCustomers = async () => {
  loading.value = true
  error.value = null
  try {
    const params: any = {}
    if (filters.value.search) params.search = filters.value.search
    if (filters.value.type) params.customer_type = filters.value.type
    
    const queryString = new URLSearchParams(params).toString()
    const response = await apiClient.get(`/customers?limit=1000${queryString ? '&' + queryString : ''}`)
    
    if (response.error) {
      throw new Error(response.error)
    }
    
    const apiResponse = response.data as any
    const data = apiResponse?.data || apiResponse || []
    
    customers.value = Array.isArray(data) ? data : []
    updateStats()
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('customers.list.messages.loadError')
    console.error('Error fetching customers:', err)
  } finally {
    loading.value = false
  }
}

// Update statistics
const updateStats = () => {
  stats.value.totalCustomers = customers.value.length
  stats.value.totalDistributors = customers.value.filter((c) => 
    c.type === 'distributor'
  ).length
  stats.value.activeInverters = customers.value.reduce((sum, c) => sum + (c.inverterCount || 0), 0)
  stats.value.totalProjects = customers.value.reduce((sum, c) => sum + (c.projectCount || 0), 0)
}

const filteredCustomers = computed(() => {
  let result = customers.value

  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(
      (c) =>
        c.name?.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search) ||
        c.phone?.includes(search)
    )
  }

  if (filters.value.type) {
    if (filters.value.type === 'user') {
      result = result.filter((c) => c.source === 'user')
    } else {
      result = result.filter((c) => c.type === filters.value.type)
    }
  }

  if (filters.value.province) {
    result = result.filter((c) => {
      const address = c.address || ''
      return address.toLowerCase().includes(filters.value.province.toLowerCase())
    })
  }

  return result
})

// Pagination computed
const totalPages = computed(() => Math.ceil(filteredCustomers.value.length / itemsPerPage))

const paginatedCustomers = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredCustomers.value.slice(start, end)
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

// Reset to page 1 when filters change
watch([() => filters.value.search, () => filters.value.type, () => filters.value.province], () => {
  currentPage.value = 1
})

const getTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    end_user: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    distributor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    dealer: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }
  return classes[type] || classes.end_user
}

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    end_user: t('customers.list.typeOptions.endUser'),
    distributor: t('customers.list.typeOptions.distributor'),
    dealer: t('customers.list.typeOptions.dealer'),
  }
  return labels[type] || type
}

const getSourceLabel = (source: string) => {
  return source === 'user' ? t('customers.list.source.account') : t('customers.list.source.customer')
}

const getSourceClass = (source: string) => {
  return source === 'user' 
    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
    : 'bg-gray-50 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
}

const clearFilters = () => {
  filters.value = {
    search: '',
    type: '',
    province: '',
  }
  fetchCustomers()
}

// Load customers on mount
onMounted(() => {
  fetchCustomers()
  fetchDistributors()
})

// Refresh when component is activated
onActivated(() => {
  fetchCustomers()
  fetchDistributors()
})
</script>
