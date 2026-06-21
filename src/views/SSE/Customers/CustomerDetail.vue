<template>
  <admin-layout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <div class="flex items-center gap-3">
          <button
            @click="$router.back()"
            class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg
              class="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ customer?.name || t('customers.detail.loading') }}
            </h1>
            <p class="text-gray-500 dark:text-gray-400 mt-1">
              {{ customer ? getTypeLabel(customer?.type) : '' }}
            </p>
          </div>
        </div>
        <button
          v-if="customer"
          @click="openEditModal"
          class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Chỉnh sửa
        </button>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
      >
        <p class="text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400">{{ t('customers.detail.loading') }}</p>
      </div>

      <div v-if="!loading && customer" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Customer Info -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Thông tin Khách hàng
            </h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <!-- Tên công ty -->
              <div class="sm:col-span-2">
                <label class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Tên công ty</label>
                <p class="mt-1 text-base font-semibold text-gray-900 dark:text-white">{{ customer?.name || '—' }}</p>
              </div>

              <!-- MST -->
              <div>
                <label class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Mã số thuế (MST)</label>
                <p class="mt-1 text-sm font-mono text-gray-900 dark:text-white">{{ customer?.code || customer?.tax_code || '—' }}</p>
              </div>

              <!-- Email nhận hóa đơn -->
              <div>
                <label class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  Email
                  <span class="text-amber-500 text-xs font-normal normal-case">· nhận hóa đơn</span>
                </label>
                <p class="mt-1 text-sm text-gray-900 dark:text-white">
                  <a v-if="customer?.email" :href="`mailto:${customer.email}`" class="text-blue-600 dark:text-blue-400 hover:underline">{{ customer.email }}</a>
                  <span v-else class="text-gray-400">—</span>
                </p>
              </div>

              <!-- Địa chỉ công ty -->
              <div class="sm:col-span-2">
                <label class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Địa chỉ công ty</label>
                <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ customer?.address || '—' }}</p>
              </div>

              <!-- Người đại diện -->
              <div class="sm:col-span-2 pt-4 mt-1 border-t border-gray-100 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
                  <svg class="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  Người đại diện
                </h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Người đại diện</label>
                    <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ customer?.representative_name || '—' }}</p>
                  </div>
                  <div>
                    <label class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Chức vụ</label>
                    <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ customer?.representative_position || '—' }}</p>
                  </div>
                  <div class="sm:col-span-2">
                    <label class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Ủy nhiệm <span class="normal-case font-normal">(nếu không phải giám đốc)</span></label>
                    <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ customer?.authorization_doc || '—' }}</p>
                  </div>
                </div>
              </div>

              <!-- Người liên hệ -->
              <div class="sm:col-span-2">
                <label class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Người liên hệ</label>
                <div v-if="customer?.contact_name || customer?.contactPerson" class="mt-1 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div class="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                    <span class="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {{ (customer?.contact_name || customer?.contactPerson)?.charAt(0)?.toUpperCase() }}
                    </span>
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-semibold text-gray-900 dark:text-white">{{ customer?.contact_name || customer?.contactPerson }}</p>
                    <div class="flex flex-col gap-y-1 mt-1">
                      <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <svg class="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                        <a
                          v-if="customer?.contact_phone && zaloChatUrl(customer.contact_phone)"
                          :href="zaloChatUrl(customer.contact_phone)!"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-blue-600 dark:text-blue-400 hover:underline"
                          title="Nhắn Zalo"
                        >{{ customer.contact_phone }}</a>
                        <span v-else class="text-gray-400">—</span>
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <svg class="h-3.5 w-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                        <a v-if="customer?.contact_email" :href="`mailto:${customer.contact_email}`" class="text-blue-600 dark:text-blue-400 hover:underline truncate">{{ customer.contact_email }}</a>
                        <span v-else class="text-gray-400">—</span>
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 flex items-start gap-1.5">
                        <svg class="h-3.5 w-3.5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <span :class="customer?.contact_address ? '' : 'text-gray-400'">{{ customer?.contact_address || '—' }}</span>
                      </p>
                    </div>
                  </div>
                </div>
                <p v-else class="mt-1 text-sm text-gray-400 dark:text-gray-500">—</p>
              </div>

              <!-- Người nhận hợp đồng -->
              <div class="sm:col-span-2 pt-4 mt-1 border-t border-gray-100 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
                  <svg class="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  Người nhận hợp đồng
                </h3>
                <div v-if="customer?.recipient_name || customer?.recipient_phone || customer?.recipient_address" class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Người nhận</label>
                    <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ customer?.recipient_name || '—' }}</p>
                  </div>
                  <div>
                    <label class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">SĐT người nhận</label>
                    <p class="mt-1 text-sm text-gray-900 dark:text-white">
                      <a v-if="customer?.recipient_phone" :href="`tel:${customer.recipient_phone}`" class="text-blue-600 dark:text-blue-400 hover:underline">{{ customer.recipient_phone }}</a>
                      <span v-else class="text-gray-400">—</span>
                    </p>
                  </div>
                  <div class="sm:col-span-2">
                    <label class="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">Địa chỉ người nhận</label>
                    <p class="mt-1 text-sm text-gray-900 dark:text-white">{{ customer?.recipient_address || '—' }}</p>
                  </div>
                </div>
                <p v-else class="text-sm text-gray-400 dark:text-gray-500">Chưa có thông tin người nhận hợp đồng</p>
              </div>
            </div>
          </div>

          <!-- Inverters -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('customers.detail.inverters.title') }} ({{ inverters.length }})
            </h2>
            <div class="overflow-y-auto max-h-[500px]">
              <table class="w-full">
                <thead class="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      {{ t('customers.detail.inverters.columns.serial') }}
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      {{ t('customers.detail.inverters.columns.model') }}
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      {{ t('customers.detail.inverters.columns.project') }}
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      {{ t('customers.detail.inverters.columns.warranty') }}
                    </th>
                    <th
                      class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase"
                    >
                      {{ t('customers.detail.inverters.columns.status') }}
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  <tr
                    v-for="inverter in inverters"
                    :key="inverter.id"
                    class="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    @click="$router.push(`/inverters/${inverter.id}`)"
                  >
                    <td class="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                      {{ inverter.serialNumber }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {{ inverter.model }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {{ inverter.projectName }}
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {{ formatDate(inverter.warrantyExpiry) }}
                    </td>
                    <td class="px-4 py-3">
                      <span
                        :class="[
                          'px-2 py-1 text-xs font-semibold rounded-full',
                          getWarrantyStatusClass(inverter.warrantyStatus),
                        ]"
                      >
                        {{ getWarrantyStatusLabel(inverter.warrantyStatus) }}
                      </span>
                    </td>
                  </tr>
                  <tr v-if="inverters.length === 0">
                    <td colspan="5" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {{ t('customers.detail.inverters.empty') }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Contracts -->
          <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                Hợp đồng
                <span class="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">{{ contracts.length }}</span>
              </h2>
              <router-link to="/contracts" class="text-sm text-blue-600 dark:text-blue-400 hover:underline">+ Tạo hợp đồng</router-link>
            </div>
            <div class="space-y-2">
              <router-link
                v-for="c in contracts"
                :key="c.id"
                :to="`/contracts/${c.id}`"
                class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group"
              >
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-sm font-mono font-medium text-blue-600 dark:text-blue-400">{{ c.contract_number }}</span>
                    <span :class="cStatusClass(c.status)" class="px-1.5 py-0.5 text-xs rounded-full font-medium">{{ cStatusLabel(c.status) }}</span>
                  </div>
                  <p
                    v-if="contractSubtitle(c)"
                    class="text-sm text-gray-700 dark:text-gray-300 mt-0.5 truncate"
                  >
                    {{ contractSubtitle(c) }}
                  </p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    <span v-if="contractDateLabel(c)">{{ contractDateLabel(c) }}</span>
                    <span v-if="c.device_count" :class="contractDateLabel(c) ? 'ml-2' : ''">· {{ c.device_count }} thiết bị</span>
                  </p>
                </div>
                <svg class="h-4 w-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </router-link>
              <div v-if="contracts.length === 0" class="text-center py-6 text-gray-400 dark:text-gray-500 text-sm">
                Chưa có hợp đồng nào
              </div>
            </div>
          </div>

          <!-- Tickets History -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('customers.detail.tickets.title') }} ({{ tickets.length }})
            </h2>
            <div class="space-y-2">
              <div
                v-for="ticket in tickets"
                :key="ticket.id"
                class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                @click="$router.push(`/tickets/${ticket.id}`)"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    #{{ ticket.ticketNumber }} - {{ ticket.title || ticket.errorType }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ formatDate(ticket.createdAt) }}
                  </p>
                </div>
                <span
                  :class="[
                    'px-2 py-1 text-xs font-semibold rounded-full',
                    getTicketStatusClass(ticket.status),
                  ]"
                >
                  {{ getTicketStatusLabel(ticket.status) }}
                </span>
              </div>
              <div v-if="tickets.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400">
                {{ t('customers.detail.tickets.empty') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Summary Stats -->
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('customers.detail.stats.title') }}
            </h2>
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('customers.detail.stats.totalDevices') }}
                </label>
                <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {{ inverters.length }}
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('customers.detail.stats.totalCapacity') }}
                </label>
                <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {{ totalCapacity }} kWp
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('customers.detail.stats.activeTickets') }}
                </label>
                <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {{ activeTicketsCount }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Customer Modal -->
    <div
      v-if="showEditModal"
      class="fixed inset-0 z-50 flex items-start justify-center bg-gray-700/45 dark:bg-gray-900/65 overflow-y-auto pt-8 pb-8"
      @click.self="showEditModal = false"
    >
      <div
        class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8"
      >
        <div class="p-6 max-h-[85vh] overflow-y-auto">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ t('customers.detail.editModal.title') }}
            </h2>
            <button
              @click="closeEditModal"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form @submit.prevent="saveCustomer">
            <!-- Error Message -->
            <div v-if="editError" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p class="text-sm text-red-800 dark:text-red-200">{{ editError }}</p>
            </div>
            
            <!-- Success Message -->
            <div v-if="editSuccessMessage" class="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p class="text-sm text-green-800 dark:text-green-200">{{ editSuccessMessage }}</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Tên công ty -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Tên công ty <span class="text-red-500">*</span></label>
                <input v-model="editForm.name" type="text" required placeholder="Nhập tên công ty / cá nhân" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
              </div>
              <!-- Người đại diện -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Người đại diện <span class="text-red-500">*</span></label>
                <input v-model="editForm.representative_name" type="text" required placeholder="Họ tên người đại diện" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Chức vụ <span class="text-red-500">*</span></label>
                <input v-model="editForm.representative_position" type="text" required placeholder="VD: Giám đốc" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Ủy nhiệm
                  <span class="text-xs font-normal text-gray-400 dark:text-gray-500">(nếu người đại diện không phải là giám đốc)</span>
                </label>
                <input v-model="editForm.authorization_doc" type="text" placeholder="Số / nội dung văn bản ủy quyền" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
              </div>
              <!-- MST -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Mã số thuế (MST) <span class="text-red-500">*</span></label>
                <input v-model="editForm.tax_code" type="text" required placeholder="VD: 0123456789" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
              </div>
              <!-- Email nhận hóa đơn -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                    <span class="text-xs font-normal text-gray-400 dark:text-gray-500">(tùy chọn)</span>
                  </label>
                  <span class="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                    Email nhận hóa đơn
                  </span>
                </div>
                <input v-model="editForm.email" type="email" placeholder="example@company.com" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
              </div>
              <!-- Địa chỉ công ty -->
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Địa chỉ công ty <span class="text-red-500">*</span></label>
                <input v-model="editForm.address" type="text" required placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
              </div>
              <!-- Người liên hệ -->
              <div class="md:col-span-2 relative edit-contact-search">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Người liên hệ</label>
                <!-- Tìm để điền nhanh -->
                <div class="relative mb-3">
                  <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>
                  <input v-model="editContactSearch" @input="onEditContactSearch" @focus="showEditContactDropdown = true" type="text" placeholder="Tìm người liên hệ có sẵn để điền nhanh..." class="w-full pl-9 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
                  <div v-if="showEditContactDropdown && editContactResults.length" class="absolute z-30 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-44 overflow-y-auto">
                    <button v-for="u in editContactResults" :key="u.id" type="button" @click="selectEditContact(u)" class="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <div class="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                        <span class="text-xs font-bold text-blue-600 dark:text-blue-400">{{ u.name?.charAt(0)?.toUpperCase() }}</span>
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ u.name }}</p>
                        <p class="text-xs text-gray-400 dark:text-gray-500">{{ u.email }}{{ u.phone ? ' · ' + u.phone : '' }}</p>
                      </div>
                    </button>
                  </div>
                </div>
                <!-- Thông tin người liên hệ (điền tay, có thể đã điền sẵn) -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Tên người liên hệ</label>
                    <input v-model="editForm.contact_person" type="text" placeholder="Họ tên người liên hệ" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">SĐT người liên hệ</label>
                    <input v-model="editForm.contact_phone" type="tel" placeholder="VD: 0901234567" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email người liên hệ</label>
                    <input v-model="editForm.contact_email" type="email" placeholder="email@congty.com" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Địa chỉ người liên hệ</label>
                    <input v-model="editForm.contact_address" type="text" placeholder="Địa chỉ người liên hệ" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
                  </div>
                </div>
              </div>
              <!-- Người nhận hợp đồng -->
              <div class="md:col-span-2 pt-2 mt-1 border-t border-gray-100 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-1.5">
                  <svg class="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  Người nhận hợp đồng
                </h3>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Người nhận</label>
                <input v-model="editForm.recipient_name" type="text" placeholder="Họ tên người nhận hợp đồng" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">SĐT người nhận</label>
                <input v-model="editForm.recipient_phone" type="tel" placeholder="VD: 0901234567" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Địa chỉ người nhận</label>
                <input v-model="editForm.recipient_address" type="text" placeholder="Địa chỉ nhận hợp đồng" class="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm" />
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button
                type="button"
                @click="closeEditModal"
                class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              >
                {{ t('customers.detail.editModal.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ saving ? t('customers.detail.editModal.saving') : t('customers.detail.editModal.save') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { apiClient } from '@/services/api'
import { zaloChatUrl } from '@/utils/zalo'

const route = useRoute()
const { t } = useI18n()
const showEditModal = ref(false)
const showAddProjectModal = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)
const editError = ref<string | null>(null)
const editSuccessMessage = ref<string | null>(null)

const customer = ref<any>(null)
const projects = ref<any[]>([])
const inverters = ref<any[]>([])
const tickets = ref<any[]>([])
const contracts = ref<any[]>([])

const editForm = ref({
  name: '',
  email: '',
  tax_code: '',
  address: '',
  contact_person: '',
  contact_phone: '',
  contact_email: '',
  contact_address: '',
  representative_name: '',
  representative_position: '',
  authorization_doc: '',
  recipient_name: '',
  recipient_address: '',
  recipient_phone: '',
  role: '',
})

// Edit contact search
const editSelectedContact = ref<any>(null)
const editContactSearch = ref('')
const showEditContactDropdown = ref(false)
const editContactResults = ref<any[]>([])
const allEditUsers = ref<any[]>([])

const loadEditUsers = async () => {
  if (allEditUsers.value.length) return
  try {
    const res = await apiClient.get('/users?limit=1000')
    allEditUsers.value = ((res.data as any[]) || []).filter(u => u.role === 'end_user' && u.status === 'active')
  } catch {}
}

const onEditContactSearch = () => {
  const q = editContactSearch.value.toLowerCase().trim()
  editContactResults.value = allEditUsers.value
    .filter(u => !q || u.name?.toLowerCase().includes(q) || u.phone?.includes(q) || u.email?.toLowerCase().includes(q))
    .slice(0, 10)
  showEditContactDropdown.value = true
}

const selectEditContact = (u: any) => {
  editSelectedContact.value = u
  editForm.value.contact_person = u.name || ''
  editForm.value.contact_phone = u.phone || ''
  editForm.value.contact_email = u.email || ''
  editForm.value.contact_address = u.address || ''
  editContactSearch.value = ''
  showEditContactDropdown.value = false
}

const totalCapacity = computed(() => {
  // Calculate from inverters instead of projects
  return inverters.value.reduce((sum, inv) => {
    // Use capacity from model (model_capacity) or fallback to power_rating
    const capacity = inv.capacity || inv.powerRating || 0
    return sum + (typeof capacity === 'number' ? capacity : parseFloat(String(capacity)) || 0)
  }, 0)
})

const activeTicketsCount = computed(() => {
  return tickets.value.filter(
    (t) => t.status !== 'completed' && t.status !== 'closed' && t.status !== 'initialized'
  ).length
})

// Contract helpers
const cStatusLabel = (s: string) => ({ draft: 'Nháp', active: 'Hiệu lực', expired: 'Hết hạn', cancelled: 'Đã hủy' }[s] ?? s)
const cStatusClass = (s: string) => ({
  draft: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  expired: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',
  cancelled: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300',
}[s] ?? 'bg-gray-100 text-gray-600')
const fmtDate = (d?: string | null) => {
  if (!d || !String(d).trim()) return null
  const parsed = new Date(d)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toLocaleDateString('vi-VN')
}

const contractSubtitle = (c: { title?: string; contract_number?: string }) => {
  const title = c.title?.trim()
  if (!title || title === c.contract_number) return null
  return title
}

const contractDateLabel = (c: {
  start_date?: string | null
  end_date?: string | null
  signed_date?: string | null
}) => {
  const start = fmtDate(c.start_date)
  const end = fmtDate(c.end_date)
  if (start && end) return `${start} → ${end}`
  const signed = fmtDate(c.signed_date)
  if (signed) return `Ngày ký: ${signed}`
  if (start) return `Từ ${start}`
  if (end) return `Đến ${end}`
  return null
}

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

const getWarrantyStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    expired: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  }
  return classes[status] || classes.pending
}

const getWarrantyStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: t('tickets.detail.labels.warrantyStatus.active'),
    expired: t('tickets.detail.labels.warrantyStatus.expired'),
    pending: t('tickets.detail.labels.warrantyStatus.pending'),
  }
  return labels[status] || status
}

const getTicketStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    initialized: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    // Legacy statuses
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    assigned: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    waiting_parts: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }
  return classes[status] || classes.initialized
}

const getTicketStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    initialized: t('tickets.list.statusLabels.initialized'),
    in_progress: t('tickets.list.statusLabels.in_progress'),
    closed: t('tickets.list.statusLabels.closed'),
    // Legacy statuses
    new: t('tickets.list.statusLabels.new'),
    assigned: t('tickets.list.statusLabels.assigned'),
    waiting_parts: t('tickets.list.statusLabels.waiting_parts'),
    completed: t('tickets.list.statusLabels.completed'),
  }
  return labels[status] || status
}

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return t('common.na')
  const dateObj = date instanceof Date ? date : new Date(date)
  if (isNaN(dateObj.getTime())) return t('common.na')
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(dateObj)
}

const viewProject = (projectId: number) => {
  // TODO: Navigate to project detail
  console.log('View project:', projectId)
}

const loadCustomer = async () => {
  loading.value = true
  error.value = null
  try {
    const customerId = route.params.id as string
    const response = await apiClient.get(`/customers/${customerId}`)
    
    if (response.error) {
      throw new Error(response.error)
    }

    const data = response.data as any
    customer.value = {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      type: data.type || data.customer_type,
      organization: data.organization,
      code: data.code || data.tax_code,
      tax_code: data.tax_code || data.code,
      contactPerson: data.contact_person || data.contactPerson,
      contact_person: data.contact_person || data.contactPerson,
      // Người đại diện
      representative_name: data.representative_name,
      representative_position: data.representative_position,
      authorization_doc: data.authorization_doc,
      // Thông tin người liên hệ từ bảng users
      contact_name: data.contact_name,
      contact_email: data.contact_email,
      contact_phone: data.contact_phone,
      contact_address: data.contact_address,
      // Người nhận hợp đồng
      recipient_name: data.recipient_name,
      recipient_address: data.recipient_address,
      recipient_phone: data.recipient_phone,
      distributor: data.distributor,
      province: data.province,
      source: data.source,
    }

    // Process inverters from API
    inverters.value = (data.inverters || []).map((inv: any) => ({
      id: inv.id,
      serialNumber: inv.serial_number,
      model: inv.model,
      type: inv.type,
      powerRating: inv.power_rating,
      capacity: inv.model_capacity || inv.capacity || inv.power_rating || 0, // Get capacity from model or fallback to power_rating
      projectName: inv.project_name || 'N/A',
      warrantyExpiry: inv.warranty_end_date ? new Date(inv.warranty_end_date) : null,
      warrantyStatus: getWarrantyStatus(inv.warranty_end_date),
    }))

    // Process tickets from API
    tickets.value = (data.tickets || []).map((ticket: any) => ({
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      errorType: ticket.category || ticket.error_type || 'N/A',
      status: ticket.status,
      createdAt: ticket.created_at ? new Date(ticket.created_at) : null,
      title: ticket.title,
    }))

    // Projects are not yet in the API, keep empty for now
    projects.value = []

    // Load contracts for this customer
    try {
      const contractRes = await apiClient.get(`/customers/${customerId}/contracts`)
      contracts.value = contractRes.data as any[] || []
    } catch {
      contracts.value = []
    }
  } catch (err) {
    console.error('Error loading customer:', err)
    error.value = err instanceof Error ? err.message : t('customers.detail.messages.loadError')
  } finally {
    loading.value = false
  }
}

const getWarrantyStatus = (warrantyEndDate: string | null | undefined): string => {
  if (!warrantyEndDate) return 'pending'
  const endDate = new Date(warrantyEndDate)
  const today = new Date()
  if (endDate < today) return 'expired'
  return 'active'
}

const openEditModal = () => {
  if (customer.value) {
    editForm.value = {
      name: customer.value.name || '',
      email: customer.value.email || '',
      tax_code: customer.value.code || customer.value.tax_code || '',
      address: customer.value.address || '',
      contact_person: customer.value.contact_name || customer.value.contactPerson || customer.value.contact_person || '',
      contact_phone: customer.value.contact_phone || '',
      contact_email: customer.value.contact_email || '',
      contact_address: customer.value.contact_address || '',
      representative_name: customer.value.representative_name || '',
      representative_position: customer.value.representative_position || '',
      authorization_doc: customer.value.authorization_doc || '',
      recipient_name: customer.value.recipient_name || '',
      recipient_address: customer.value.recipient_address || '',
      recipient_phone: customer.value.recipient_phone || '',
      role: customer.value.type || customer.value.customer_type || '',
    }
    // Pre-fill contact nếu có
    editSelectedContact.value = null
    editContactSearch.value = ''
    showEditContactDropdown.value = false
    loadEditUsers()
    editError.value = null
    editSuccessMessage.value = null
  }
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  editError.value = null
  editSuccessMessage.value = null
  editForm.value = {
    name: '',
    email: '',
    tax_code: '',
    address: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    contact_address: '',
    representative_name: '',
    representative_position: '',
    authorization_doc: '',
    recipient_name: '',
    recipient_address: '',
    recipient_phone: '',
    role: '',
  }
}

const saveCustomer = async () => {
  if (!customer.value) return
  
  saving.value = true
  editError.value = null
  editSuccessMessage.value = null

  if (!editForm.value.representative_name?.trim()) {
    editError.value = 'Vui lòng nhập người đại diện'
    saving.value = false
    return
  }
  if (!editForm.value.representative_position?.trim()) {
    editError.value = 'Vui lòng nhập chức vụ người đại diện'
    saving.value = false
    return
  }

  try {
    const customerId = route.params.id as string
    
    // Determine if customer is from users table or customers table
    const isUserSource = customer.value.source === 'user' || !customer.value.source
    
    if (isUserSource) {
      // Update user in users table
      const response = await apiClient.put(`/users/${customerId}`, {
        name: editForm.value.name,
        email: editForm.value.email.trim(),
        phone: editForm.value.contact_phone || null,
        address: editForm.value.address || null,
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
    } else {
      // Update customer in customers table
      const response = await apiClient.put(`/customers/${customerId}`, {
        name: editForm.value.name,
        email: editForm.value.email.trim() || null,
        address: editForm.value.address || null,
        tax_code: editForm.value.tax_code || null,
        contact_person: editForm.value.contact_person || null,
        contact_phone: editForm.value.contact_phone || null,
        contact_email: editForm.value.contact_email || null,
        contact_address: editForm.value.contact_address || null,
        representative_name: editForm.value.representative_name || null,
        representative_position: editForm.value.representative_position || null,
        authorization_doc: editForm.value.authorization_doc || null,
        recipient_name: editForm.value.recipient_name || null,
        recipient_address: editForm.value.recipient_address || null,
        recipient_phone: editForm.value.recipient_phone || null,
      })
      
      if (response.error) {
        throw new Error(response.error)
      }
    }
    
    editSuccessMessage.value = t('customers.detail.editModal.success')
    
    // Reload customer data after a short delay
    setTimeout(() => {
      loadCustomer()
      setTimeout(() => {
        closeEditModal()
      }, 1500)
    }, 500)
  } catch (err) {
    console.error('Error updating customer:', err)
    editError.value = err instanceof Error ? err.message : t('customers.detail.messages.updateError')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadCustomer()
  document.addEventListener('click', (e) => {
    if (!(e.target as Element)?.closest('.edit-contact-search')) {
      showEditContactDropdown.value = false
    }
  })
})
</script>