<template>
  <admin-layout>
    <div class="space-y-4 sm:space-y-6 px-4 sm:px-0 pb-6">

      <!-- Back + Header -->
      <div class="space-y-3">
        <div class="flex items-start gap-2 sm:gap-3">
          <button
            @click="goBack"
            class="p-2.5 -ml-1 mt-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Quay lại"
          >
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
          </button>
          <div class="flex-1 min-w-0">
            <h1 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-snug">
              {{ contract?.customer_name || 'Đang tải...' }}
            </h1>
            <p v-if="contract?.contract_number" class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-mono truncate">
              {{ contract.contract_number }}
            </p>
          </div>
        </div>

        <div v-if="contract" class="flex flex-wrap gap-1.5 sm:gap-2">
          <span :class="paymentStatusClass(isContractPaid(contract))" class="px-2.5 py-0.5 rounded-full text-xs font-semibold">
            {{ getPaymentStatusLabel(contract) }}
          </span>
        </div>

        <div
          v-if="contract && (canViewContractFinance || canManageContracts || canCreateTicket)"
          class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end"
        >
          <button
            v-if="canViewContractFinance"
            @click="showExportModal = true"
            class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg transition-colors touch-manipulation min-h-[44px]"
          >
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span class="truncate">Xuất báo giá</span>
          </button>
          <router-link
            v-if="canCreateTicket"
            :to="createTicketPath"
            class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg transition-colors touch-manipulation min-h-[44px]"
          >
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span class="truncate">Tạo ticket</span>
          </router-link>
          <button
            v-if="canManageContracts"
            @click="openEdit"
            class="px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors touch-manipulation min-h-[44px]"
          >
            Chỉnh sửa
          </button>
          <button
            v-if="isDev"
            @click="showDeleteConfirm = true"
            class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 active:bg-red-100 dark:active:bg-red-900/30 transition-colors touch-manipulation min-h-[44px]"
          >
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            Xóa hợp đồng
          </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-16 text-gray-400">Đang tải...</div>
      <div v-else-if="error" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 text-red-700 dark:text-red-300">{{ error }}</div>

      <template v-else-if="contract">
        <!-- 2-col layout -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

          <!-- LEFT: contract info + customer info -->
          <div class="lg:col-span-1 space-y-4">

            <!-- Contract Info -->
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
              <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Thông tin hợp đồng</h2>
              <dl class="space-y-3">
                <div>
                  <dt class="text-xs text-gray-400 dark:text-gray-500">Trạng thái thanh toán</dt>
                  <dd class="mt-0.5">
                    <span :class="paymentStatusClass(isContractPaid(contract))" class="px-2 py-0.5 rounded-full text-xs font-medium">
                      {{ getPaymentStatusLabel(contract) }}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-gray-400 dark:text-gray-500">Loại</dt>
                  <dd>
                    <span :class="typeClass(contract.contract_type)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                      {{ typeLabel(contract.contract_type) }}
                    </span>
                  </dd>
                </div>
                <div v-if="canViewContractFinance">
                  <dt class="text-xs text-gray-400 dark:text-gray-500">Giá trị hợp đồng</dt>
                  <dd class="text-base font-bold text-blue-600 dark:text-blue-400">{{ fmtCurrency(contract.value) }}</dd>
                </div>
                <div v-if="contract.description">
                  <dt class="text-xs text-gray-400 dark:text-gray-500">Mô tả</dt>
                  <dd class="text-sm text-gray-700 dark:text-gray-300">{{ contract.description }}</dd>
                </div>
                <div v-if="isStaff && contract.notes">
                  <dt class="text-xs text-gray-400 dark:text-gray-500">Ghi chú nội bộ</dt>
                  <dd class="text-sm text-gray-500 dark:text-gray-400 italic">{{ contract.notes }}</dd>
                </div>
                <div v-if="contract.delivery_days">
                  <dt class="text-xs text-gray-400 dark:text-gray-500">Thời gian giao hàng</dt>
                  <dd class="text-sm text-gray-700 dark:text-gray-300">{{ contract.delivery_days }} ngày làm việc</dd>
                </div>
                <div v-if="contract.warranty_months">
                  <dt class="text-xs text-gray-400 dark:text-gray-500">Thời gian bảo hành</dt>
                  <dd class="text-sm text-gray-700 dark:text-gray-300">{{ contract.warranty_months }} tháng</dd>
                </div>
              </dl>
            </div>

            <!-- Customer Info -->
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Khách hàng</h2>
                <router-link v-if="isStaff" :to="`/customers/${contract.customer_id}`" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">Xem chi tiết →</router-link>
              </div>
              <p class="text-base font-semibold text-gray-900 dark:text-white">{{ contract.customer_name }}</p>
              <p v-if="contract.customer_phone" class="text-sm mt-2">
                <a
                  :href="`tel:${contract.customer_phone}`"
                  class="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline touch-manipulation min-h-[44px] py-1"
                >
                  <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  {{ contract.customer_phone }}
                </a>
              </p>
              <p v-if="contract.customer_email" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                <a
                  :href="`mailto:${contract.customer_email}`"
                  class="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline truncate max-w-full touch-manipulation min-h-[44px] py-1"
                >
                  {{ contract.customer_email }}
                </a>
              </p>

              <dl class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
                <div v-if="contract.customer_tax_code">
                  <dt class="text-xs text-gray-400 dark:text-gray-500">Mã số thuế</dt>
                  <dd class="text-sm text-gray-700 dark:text-gray-300">{{ contract.customer_tax_code }}</dd>
                </div>
                <div v-if="contract.customer_address">
                  <dt class="text-xs text-gray-400 dark:text-gray-500">Địa chỉ công ty</dt>
                  <dd class="text-sm text-gray-700 dark:text-gray-300">{{ contract.customer_address }}</dd>
                </div>
                <div v-if="contract.customer_representative_name">
                  <dt class="text-xs text-gray-400 dark:text-gray-500">Người đại diện</dt>
                  <dd class="text-sm text-gray-700 dark:text-gray-300">
                    {{ contract.customer_representative_name }}
                    <span v-if="contract.customer_representative_position" class="text-gray-400">— {{ contract.customer_representative_position }}</span>
                  </dd>
                </div>
              </dl>

              <!-- Người liên hệ -->
              <div v-if="contract.customer_contact_name || contract.customer_contact_phone || contract.customer_contact_email || contract.customer_contact_address" class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Người liên hệ</p>
                <p v-if="contract.customer_contact_name" class="text-sm font-medium text-gray-900 dark:text-white">{{ contract.customer_contact_name }}</p>
                <p v-if="contract.customer_contact_phone" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  <a
                    v-if="zaloChatUrl(contract.customer_contact_phone)"
                    :href="zaloChatUrl(contract.customer_contact_phone)!"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="hover:text-blue-600 touch-manipulation min-h-[44px] inline-flex items-center py-1"
                    title="Nhắn Zalo"
                  >{{ contract.customer_contact_phone }}</a>
                </p>
                <p v-if="contract.customer_contact_email" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  <a :href="`mailto:${contract.customer_contact_email}`" class="hover:text-blue-600 truncate block">{{ contract.customer_contact_email }}</a>
                </p>
                <p v-if="contract.customer_contact_address" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ contract.customer_contact_address }}</p>
              </div>

              <!-- Người nhận hợp đồng -->
              <div v-if="contract.customer_recipient_name || contract.customer_recipient_phone || contract.customer_recipient_address" class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Người nhận hợp đồng</p>
                <p v-if="contract.customer_recipient_name" class="text-sm font-medium text-gray-900 dark:text-white">{{ contract.customer_recipient_name }}</p>
                <p v-if="contract.customer_recipient_phone" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  <a :href="`tel:${contract.customer_recipient_phone}`" class="hover:text-blue-600">{{ contract.customer_recipient_phone }}</a>
                </p>
                <p v-if="contract.customer_recipient_address" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{{ contract.customer_recipient_address }}</p>
              </div>
            </div>

          </div>

          <!-- RIGHT: Contract content + Device list -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Nội dung hợp đồng -->
            <div v-if="canViewContractFinance && contract.items && contract.items.length" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 class="font-semibold text-gray-900 dark:text-white">Nội dung hợp đồng</h2>
              </div>

              <!-- Mobile: card list -->
              <div class="md:hidden divide-y divide-gray-100 dark:divide-gray-700">
                <div v-for="(it, idx) in contract.items" :key="`m-${idx}`" class="px-4 py-3">
                  <div class="flex items-start gap-2">
                    <span class="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center justify-center">
                      {{ idx + 1 }}
                    </span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ it.description }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {{ it.quantity }} {{ it.unit || '—' }} × {{ fmtCurrency(it.unit_price) }}
                      </p>
                    </div>
                    <p class="text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">
                      {{ fmtCurrency(it.quantity * it.unit_price) }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Desktop: table -->
              <div class="hidden md:block overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="bg-gray-50 dark:bg-gray-700/40 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      <th class="px-3 py-2 text-center w-10">STT</th>
                      <th class="px-3 py-2 text-left">Hạng mục</th>
                      <th class="px-3 py-2 text-center w-16">ĐVT</th>
                      <th class="px-3 py-2 text-right w-16">SL</th>
                      <th class="px-3 py-2 text-right w-32">Đơn giá</th>
                      <th class="px-3 py-2 text-right w-32">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                    <tr v-for="(it, idx) in contract.items" :key="idx">
                      <td class="px-3 py-2 text-center text-gray-500">{{ idx + 1 }}</td>
                      <td class="px-3 py-2 text-gray-900 dark:text-white">{{ it.description }}</td>
                      <td class="px-3 py-2 text-center text-gray-600 dark:text-gray-400">{{ it.unit || '—' }}</td>
                      <td class="px-3 py-2 text-right text-gray-600 dark:text-gray-400">{{ it.quantity }}</td>
                      <td class="px-3 py-2 text-right text-gray-600 dark:text-gray-400 whitespace-nowrap">{{ fmtCurrency(it.unit_price) }}</td>
                      <td class="px-3 py-2 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">{{ fmtCurrency(it.quantity * it.unit_price) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="border-t border-gray-200 dark:border-gray-700 px-4 sm:px-5 py-3 bg-gray-50 dark:bg-gray-700/30">
                <div class="w-full sm:ml-auto sm:w-80 space-y-1.5 text-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Tổng cộng:</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ fmtCurrency(itemsSubtotal) }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Thuế GTGT ({{ contract.vat_rate ?? 8 }}%):</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ fmtCurrency(itemsVat) }}</span>
                  </div>
                  <div class="flex items-center justify-between pt-1.5 border-t border-gray-200 dark:border-gray-600">
                    <span class="font-semibold text-gray-900 dark:text-white">Tổng cộng thanh toán:</span>
                    <span class="font-bold text-blue-600 dark:text-blue-400">{{ fmtCurrency(itemsTotal) }}</span>
                  </div>
                  <p class="text-xs italic text-gray-500 dark:text-gray-400 pt-1">Bằng chữ: {{ itemsTotalInWords }}</p>
                </div>
              </div>
            </div>

            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  Danh sách thiết bị
                  <span class="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-full">{{ contract.inverters?.length || 0 }}</span>
                </h2>
              </div>

              <!-- No devices -->
              <div v-if="!contract.inverters?.length" class="px-4 sm:px-5 py-10 sm:py-12 text-center text-gray-400 dark:text-gray-500">
                <svg class="mx-auto h-10 w-10 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"/>
                </svg>
                Chưa có thiết bị nào trong hợp đồng này
              </div>

              <!-- Device cards -->
              <div v-else class="divide-y divide-gray-100 dark:divide-gray-700">
                <div v-for="inv in contract.inverters" :key="inv.id" class="p-4 sm:p-5">
                  <!-- Device header -->
                  <div class="flex items-start justify-between gap-2 sm:gap-3 mb-3">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ inv.model }}</span>
                        <span v-if="inv.manufacturer" class="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">{{ inv.manufacturer }}</span>
                        <span :class="inv.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'" class="text-xs">● {{ inv.status === 'active' ? 'Hoạt động' : inv.status }}</span>
                      </div>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 font-mono break-all">SN: {{ inv.serial_number }}</p>
                    </div>
                    <router-link
                      :to="inverterDetailPath(inv.id)"
                      class="flex-shrink-0 inline-flex items-center min-h-[44px] px-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline touch-manipulation"
                    >
                      Chi tiết →
                    </router-link>
                  </div>

                  <!-- Device info grid -->
                  <div class="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-2 mb-3">
                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 sm:p-3">
                      <p class="text-xs text-gray-400 dark:text-gray-500 mb-1">Hãng</p>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ inv.manufacturer || '—' }}</p>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 sm:p-3">
                      <p class="text-xs text-gray-400 dark:text-gray-500 mb-1">Bảo hành từ</p>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ fmt(inv.warranty_start_date) || '—' }}</p>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 sm:p-3">
                      <p class="text-xs text-gray-400 dark:text-gray-500 mb-1">Bảo hành đến</p>
                      <p :class="isExpired(inv.warranty_end_date) ? 'text-red-500' : 'text-gray-900 dark:text-white'" class="text-sm font-medium">
                        {{ fmt(inv.warranty_end_date) || '—' }}
                      </p>
                    </div>
                  </div>

                  <!-- Tickets -->
                  <div v-if="inv.tickets?.length">
                    <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Ticket đính kèm ({{ inv.ticket_count }})
                    </p>
                    <div class="space-y-1.5">
                      <router-link
                        v-for="tk in inv.tickets"
                        :key="tk.id"
                        :to="ticketDetailPath(tk.id)"
                        class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 active:bg-blue-100 dark:active:bg-blue-900/30 rounded-lg transition-colors touch-manipulation min-h-[44px]"
                      >
                        <div class="flex items-center gap-2 min-w-0">
                          <span class="text-xs font-mono text-gray-500 dark:text-gray-400 flex-shrink-0">#{{ tk.ticket_number }}</span>
                          <span class="text-sm text-gray-700 dark:text-gray-300 truncate">{{ tk.title }}</span>
                        </div>
                        <div class="flex items-center gap-2 flex-shrink-0 pl-0 sm:pl-0 sm:ml-2">
                          <span :class="ticketStatusClass(tk.status)" class="px-1.5 py-0.5 text-xs rounded-full font-medium">{{ ticketStatusLabel(tk.status) }}</span>
                          <span class="text-xs text-gray-400">{{ fmt(tk.created_at) }}</span>
                        </div>
                      </router-link>
                      <router-link v-if="inv.ticket_count > 3 && isStaff" :to="`/tickets?inverter_id=${inv.id}`" class="block text-center text-xs text-blue-600 dark:text-blue-400 hover:underline py-1">
                        Xem thêm {{ inv.ticket_count - 3 }} ticket...
                      </router-link>
                    </div>
                  </div>
                  <p v-else class="text-xs text-gray-400 dark:text-gray-500 italic">Chưa có ticket nào</p>

                </div>
              </div>
            </div>
          </div>

        </div>
      </template>

      <!-- Modal xuất báo giá -->
      <div v-if="showExportModal" class="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
        <div class="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">Xuất báo giá</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">Tùy chọn nội dung hiển thị trên file báo giá</p>
          <label class="flex items-center gap-3 cursor-pointer mb-6">
            <input
              v-model="exportShowContact"
              type="checkbox"
              class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">Hiển thị người liên hệ</span>
          </label>
          <div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end">
            <button
              type="button"
              @click="showExportModal = false"
              class="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation min-h-[44px]"
            >
              Hủy
            </button>
            <button
              type="button"
              @click="exportQuote"
              class="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors touch-manipulation min-h-[44px]"
            >
              Xuất báo giá
            </button>
          </div>
        </div>
      </div>

      <!-- Xác nhận xóa hợp đồng (dev only) -->
      <div v-if="showDeleteConfirm" class="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/50">
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Xác nhận xóa</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Bạn có chắc muốn xóa hợp đồng
            <strong>{{ contract?.contract_number }}</strong>?
            Hành động này không thể hoàn tác.
          </p>
          <p v-if="deleteError" class="mb-4 text-sm text-red-600 dark:text-red-400">{{ deleteError }}</p>
          <div class="flex gap-3 justify-end">
            <button
              type="button"
              @click="showDeleteConfirm = false; deleteError = ''"
              :disabled="deleting"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="button"
              @click="deleteContract"
              :disabled="deleting"
              class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg flex items-center gap-2"
            >
              <span v-if="deleting" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              {{ deleting ? 'Đang xóa...' : 'Xóa hợp đồng' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { contractService, type Contract } from '@/services/contractService'
import { amountToVietnameseWords } from '@/utils/numberToWords'
import { exportQuotation } from '@/utils/quotation'
import { zaloChatUrl } from '@/utils/zalo'
import { useAuth, UserRole, Permission } from '@/composables/useAuth'
import {
  isContractPaid,
  getPaymentStatusLabel,
  paymentStatusClass,
} from '@/utils/contractPaperwork'

const route = useRoute()
const router = useRouter()
const { getUserRole, getUser, canViewContractFinance, canManageContracts, hasPermission } = useAuth()
const canCreateTicket = computed(() => hasPermission(Permission.CREATE_TICKET))
const isStaff = computed(() => getUserRole.value !== UserRole.END_USER && getUserRole.value !== UserRole.DISTRIBUTOR)
const isDev = computed(() => getUserRole.value === UserRole.DEV)
const contract = ref<any>(null)
const loading = ref(true)
const error = ref('')
const showExportModal = ref(false)
const showDeleteConfirm = ref(false)
const deleting = ref(false)
const deleteError = ref('')
const exportShowContact = ref(true)

const ticketDetailPath = (ticketId: number) => {
  return isStaff.value ? `/tickets/${ticketId}` : `/customer/tickets/${ticketId}`
}

const createTicketPath = computed(() => {
  if (!contract.value?.id) return '/tickets/new'
  const q = new URLSearchParams({
    contract_id: String(contract.value.id),
    category: 'repair',
  })
  if (contract.value.customer_id) {
    q.set('customer_id', String(contract.value.customer_id))
  }
  const firstInverter = contract.value.inverters?.[0]
  if (firstInverter?.id) {
    q.set('inverter_id', String(firstInverter.id))
  }
  return `/tickets/new?${q.toString()}`
})

function inverterDetailPath(inverterId: number) {
  const base = isStaff.value ? `/inverters/${inverterId}` : `/customer/inverters/${inverterId}`
  if (contract.value?.id) {
    return `${base}?contract_id=${contract.value.id}`
  }
  return base
}

const itemsSubtotal = computed(() =>
  (contract.value?.items ?? []).reduce(
    (sum: number, it: any) => sum + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0),
    0
  )
)
const itemsVat = computed(() => Math.round(itemsSubtotal.value * (Number(contract.value?.vat_rate) ?? 8) / 100))
const itemsTotal = computed(() => itemsSubtotal.value + itemsVat.value)
const itemsTotalInWords = computed(() => amountToVietnameseWords(itemsTotal.value))

function goBack() {
  if (route.path.startsWith('/customer/contracts')) {
    router.push('/customer/contracts')
  } else {
    router.back()
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    contract.value = await contractService.get(Number(route.params.id))
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function openEdit() {
  if (!contract.value) return
  // Điều hướng sang trang danh sách và mở sẵn form chỉnh sửa hợp đồng này
  router.push({ path: '/contracts', query: { edit: contract.value.id } })
}

async function deleteContract() {
  if (!contract.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await contractService.remove(contract.value.id)
    showDeleteConfirm.value = false
    router.push('/contracts')
  } catch (e: any) {
    deleteError.value = e.message || 'Không thể xóa hợp đồng'
  } finally {
    deleting.value = false
  }
}

function exportQuote() {
  if (!contract.value) return
  exportQuotation(contract.value, {
    showContact: exportShowContact.value,
    sellerName: getUser.value?.name || '',
  }).catch(() => {
    alert('Không thể tải con dấu báo giá. Vui lòng đăng nhập lại hoặc thử sau.')
  })
  showExportModal.value = false
}

function fmt(d?: string) {
  if (!d) return null
  return new Date(d).toLocaleDateString('vi-VN')
}

function fmtCurrency(v: number | null | undefined) {
  if (v === null || v === undefined || Number.isNaN(Number(v))) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(v))
}

function isExpired(d?: string) {
  if (!d) return false
  return new Date(d) < new Date()
}

function typeLabel(t: string) {
  const m: Record<string,string> = { service: 'Dịch vụ', economic: 'Kinh tế', other: 'Khác' }
  return m[t] ?? t
}

function typeClass(t: string) {
  const m: Record<string,string> = {
    service: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    economic: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    other: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  }
  return m[t] ?? 'bg-gray-100 text-gray-600'
}

function ticketStatusLabel(s: string) {
  const m: Record<string,string> = {
    initialized: 'Mới', in_progress: 'Đang xử lý', resolved: 'Đã giải quyết',
    closed: 'Đóng', pending: 'Chờ'
  }
  return m[s] ?? s
}

function ticketStatusClass(s: string) {
  const m: Record<string,string> = {
    initialized: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    closed: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  }
  return m[s] ?? 'bg-gray-100 text-gray-600'
}

onMounted(load)
</script>
