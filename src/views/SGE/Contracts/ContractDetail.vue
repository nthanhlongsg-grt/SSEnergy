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
          <span :class="statusClass(contract.status)" class="px-2.5 py-0.5 rounded-full text-xs font-semibold">
            {{ statusLabel(contract.status) }}
          </span>
          <span :class="paymentStatusClass(isContractPaid(contract))" class="px-2.5 py-0.5 rounded-full text-xs font-semibold">
            {{ getPaymentStatusLabel(contract) }}
          </span>
          <span :class="deviceDeliveryStatusClass(isContractDeviceDelivered(contract))" class="px-2.5 py-0.5 rounded-full text-xs font-semibold">
            {{ getDeviceDeliveryStatusLabel(contract) }}
          </span>
          <span
            v-if="paperworkComplete"
            class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
          >
            Hoàn thành giấy tờ
          </span>
        </div>

        <div
          v-if="contract && !paperworkComplete"
          class="flex items-start gap-1.5 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-800 dark:text-amber-200"
        >
          <svg class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <span class="min-w-0">
            <span class="font-semibold">Thiếu giấy tờ:</span>
            {{ missingPaperworkLabels.join(', ') }}
          </span>
        </div>

        <div v-if="contract && isStaff" class="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <button
            @click="showExportModal = true"
            class="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg transition-colors touch-manipulation min-h-[44px]"
          >
            <svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span class="truncate">Xuất báo giá</span>
          </button>
          <button
            @click="openEdit"
            class="px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors touch-manipulation min-h-[44px]"
          >
            Chỉnh sửa
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
                  <dt class="text-xs text-gray-400 dark:text-gray-500">Trạng thái</dt>
                  <dd class="flex flex-wrap items-center gap-2 mt-0.5">
                    <span :class="statusClass(contract.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                      {{ statusLabel(contract.status) }}
                    </span>
                    <button
                      type="button"
                      @click="openStatusModal"
                      class="text-xs text-blue-600 dark:text-blue-400 hover:underline touch-manipulation min-h-[44px] inline-flex items-center py-1"
                    >
                      Đổi trạng thái
                    </button>
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-gray-400 dark:text-gray-500">Trạng thái thanh toán</dt>
                  <dd class="mt-0.5">
                    <span :class="paymentStatusClass(isContractPaid(contract))" class="px-2 py-0.5 rounded-full text-xs font-medium">
                      {{ getPaymentStatusLabel(contract) }}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt class="text-xs text-gray-400 dark:text-gray-500">Trạng thái giao máy</dt>
                  <dd class="mt-0.5">
                    <span :class="deviceDeliveryStatusClass(isContractDeviceDelivered(contract))" class="px-2 py-0.5 rounded-full text-xs font-medium">
                      {{ getDeviceDeliveryStatusLabel(contract) }}
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
                <div>
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
            <div v-if="contract.items && contract.items.length" class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
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
                  <div class="grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-3 lg:grid-cols-5 mb-3">
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
                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 sm:p-3">
                      <p class="text-xs text-gray-400 dark:text-gray-500 mb-1">Lần sửa gần nhất</p>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ fmt(inv.last_repair_date) || '—' }}</p>
                    </div>
                    <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-2.5 sm:p-3 col-span-2 sm:col-span-1">
                      <p class="text-xs text-gray-400 dark:text-gray-500 mb-1">Số lần sửa</p>
                      <p class="text-sm font-bold text-gray-900 dark:text-white">{{ inv.repair_count || 0 }}</p>
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

        <!-- Checklist hồ sơ giấy tờ -->
        <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hồ sơ giấy tờ</h2>
            <span
              v-if="paperworkComplete"
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Hoàn thành giấy tờ
            </span>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div
              v-for="item in paperworkChecklist"
              :key="item.id"
              :class="item.id === 'paper_sent' ? 'md:col-span-2' : ''"
              class="space-y-1.5"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span
                  :class="hasCheckDate(item) ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'"
                  class="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <svg v-if="hasCheckDate(item)" class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
                  </svg>
                </span>
                <span class="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{{ item.label }}</span>
              </div>

              <template v-if="isStaff">
                <input
                  v-if="item.source === 'contract'"
                  v-model="paperworkForm[item.dateField as 'signed_date' | 'end_date']"
                  type="date"
                  class="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  v-else
                  v-model="paperworkForm[item.dateField as keyof typeof paperworkForm]"
                  type="date"
                  class="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div v-if="item.id === 'paper_sent'" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    v-model="paperworkForm.shipping_carrier"
                    type="text"
                    placeholder="Đơn vị vận chuyển"
                    class="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    v-model="paperworkForm.tracking_number"
                    type="text"
                    placeholder="Mã vận đơn"
                    class="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </template>
              <template v-else>
                <p class="text-sm text-gray-900 dark:text-white pl-6">
                  {{ fmtCheckDate(item) || '—' }}
                </p>
                <p v-if="item.id === 'paper_sent' && (contract.paperwork?.shipping_carrier || contract.paperwork?.tracking_number)" class="text-xs text-gray-500 dark:text-gray-400 pl-6">
                  <span v-if="contract.paperwork?.shipping_carrier">{{ contract.paperwork.shipping_carrier }}</span>
                  <span v-if="contract.paperwork?.shipping_carrier && contract.paperwork?.tracking_number"> · </span>
                  <span v-if="contract.paperwork?.tracking_number">MVD: {{ contract.paperwork.tracking_number }}</span>
                </p>
              </template>
            </div>
          </div>

          <div v-if="isStaff" class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
            <button
              type="button"
              :disabled="paperworkSaving || !paperworkDirty"
              @click="savePaperwork"
              class="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors touch-manipulation min-h-[44px]"
            >
              {{ paperworkSaving ? 'Đang lưu...' : 'Lưu hồ sơ giấy tờ' }}
            </button>
            <p v-if="paperworkError" class="text-sm text-red-600 dark:text-red-400">{{ paperworkError }}</p>
            <p v-else-if="paperworkSaved" class="text-sm text-emerald-600 dark:text-emerald-400">Đã lưu hồ sơ giấy tờ</p>
          </div>
        </div>
      </template>

      <!-- Modal cập nhật trạng thái -->
      <div v-if="showStatusModal" class="fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50">
        <div class="bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md p-5 sm:p-6 max-h-[90vh] overflow-y-auto pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-1">Cập nhật trạng thái hợp đồng</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
            Trạng thái hiện tại:
            <span v-if="contract" :class="statusClass(contract.status)" class="ml-1 px-2 py-0.5 rounded-full text-xs font-semibold">
              {{ statusLabel(contract.status) }}
            </span>
          </p>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Trạng thái mới</label>
          <select
            v-model="statusForm"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
          >
            <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <p v-if="statusError" class="text-sm text-red-600 dark:text-red-400 mb-4">{{ statusError }}</p>
          <div class="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:justify-end mt-4">
            <button
              type="button"
              @click="closeStatusModal"
              class="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors touch-manipulation min-h-[44px]"
            >
              Hủy
            </button>
            <button
              type="button"
              :disabled="statusSaving || !contract || statusForm === contract.status"
              @click="saveStatus"
              class="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors touch-manipulation min-h-[44px]"
            >
              {{ statusSaving ? 'Đang lưu...' : 'Lưu' }}
            </button>
          </div>
        </div>
      </div>

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
import { useAuth, UserRole } from '@/composables/useAuth'
import {
  PAPERWORK_CHECKLIST,
  emptyPaperworkForm,
  getPaperworkDate,
  hasPaperworkDate,
  isPaperworkComplete,
  getMissingPaperworkLabels,
  isContractPaid,
  getPaymentStatusLabel,
  paymentStatusClass,
  isContractDeviceDelivered,
  getDeviceDeliveryStatusLabel,
  deviceDeliveryStatusClass,
  type PaperworkCheckItem,
} from '@/utils/contractPaperwork'

const route = useRoute()
const router = useRouter()
const { getUserRole } = useAuth()
const isStaff = computed(() => getUserRole.value !== UserRole.END_USER && getUserRole.value !== UserRole.DISTRIBUTOR)
const contract = ref<any>(null)
const loading = ref(true)
const error = ref('')
const showExportModal = ref(false)
const showStatusModal = ref(false)
const exportShowContact = ref(true)
const statusForm = ref<Contract['status']>('draft')
const statusSaving = ref(false)
const statusError = ref('')
const paperworkForm = ref(emptyPaperworkForm())
const paperworkBaseline = ref('')
const paperworkSaving = ref(false)
const paperworkError = ref('')
const paperworkSaved = ref(false)

const paperworkChecklist = PAPERWORK_CHECKLIST

const paperworkComplete = computed(() =>
  contract.value ? isPaperworkComplete(contract.value) : false
)

const missingPaperworkLabels = computed(() =>
  contract.value ? getMissingPaperworkLabels(contract.value) : []
)

const paperworkDirty = computed(() => JSON.stringify(paperworkForm.value) !== paperworkBaseline.value)

function toInputDate(v?: string | null): string {
  if (!v) return ''
  return String(v).slice(0, 10)
}

function syncPaperworkForm() {
  if (!contract.value) return
  const pw = contract.value.paperwork || {}
  paperworkForm.value = {
    signed_date: toInputDate(contract.value.signed_date),
    end_date: toInputDate(contract.value.end_date),
    invoice_date: toInputDate(pw.invoice_date),
    payment_received_date: toInputDate(pw.payment_received_date),
    device_delivery_date: toInputDate(pw.device_delivery_date),
    paper_sent_date: toInputDate(pw.paper_sent_date),
    shipping_carrier: pw.shipping_carrier || '',
    tracking_number: pw.tracking_number || '',
    contract_returned_date: toInputDate(pw.contract_returned_date),
    verification_date: toInputDate(pw.verification_date),
  }
  paperworkBaseline.value = JSON.stringify(paperworkForm.value)
  paperworkSaved.value = false
}

function hasCheckDate(item: PaperworkCheckItem): boolean {
  if (!contract.value) return false
  return hasPaperworkDate(getPaperworkDate(contract.value, item))
}

function fmtCheckDate(item: PaperworkCheckItem): string | null {
  if (!contract.value) return null
  const d = getPaperworkDate(contract.value, item)
  return d ? fmt(d) : null
}

async function savePaperwork() {
  if (!contract.value) return
  paperworkSaving.value = true
  paperworkError.value = ''
  paperworkSaved.value = false
  try {
    const updated = await contractService.updatePaperwork(contract.value.id, { ...paperworkForm.value })
    contract.value = { ...contract.value, ...updated }
    syncPaperworkForm()
    paperworkSaved.value = true
  } catch (e: any) {
    paperworkError.value = e.message || 'Không thể lưu hồ sơ giấy tờ'
  } finally {
    paperworkSaving.value = false
  }
}

const statusOptions = [
  { value: 'draft', label: 'Nháp' },
  { value: 'active', label: 'Hiệu lực' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'cancelled', label: 'Đã hủy' },
] as const

function ticketDetailPath(ticketId: number) {
  return isStaff.value ? `/tickets/${ticketId}` : `/customer/tickets/${ticketId}`
}

function inverterDetailPath(inverterId: number) {
  const base = isStaff.value ? `/inverters/${inverterId}` : `/customer/inverters/${inverterId}`
  if (contract.value?.id) {
    return `${base}?contract_id=${contract.value.id}`
  }
  return base
}

function openStatusModal() {
  if (!contract.value) return
  statusForm.value = contract.value.status
  statusError.value = ''
  showStatusModal.value = true
}

function closeStatusModal() {
  showStatusModal.value = false
  statusError.value = ''
}

async function saveStatus() {
  if (!contract.value || statusForm.value === contract.value.status) return
  statusSaving.value = true
  statusError.value = ''
  try {
    const updated = await contractService.updateStatus(contract.value.id, statusForm.value)
    contract.value = { ...contract.value, ...updated }
    showStatusModal.value = false
  } catch (e: any) {
    statusError.value = e.message || 'Không thể cập nhật trạng thái'
  } finally {
    statusSaving.value = false
  }
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
    syncPaperworkForm()
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

function exportQuote() {
  if (!contract.value) return
  exportQuotation(contract.value, { showContact: exportShowContact.value }).catch(() => {
    alert('Không thể tải con dấu báo giá. Vui lòng đăng nhập lại hoặc thử sau.')
  })
  showExportModal.value = false
}

function fmt(d?: string) {
  if (!d) return null
  return new Date(d).toLocaleDateString('vi-VN')
}

function fmtCurrency(v: number) {
  if (!v) return '—'
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v)
}

function isExpired(d?: string) {
  if (!d) return false
  return new Date(d) < new Date()
}

function statusLabel(s: string) {
  const m: Record<string,string> = { draft: 'Nháp', active: 'Hiệu lực', expired: 'Hết hạn', cancelled: 'Đã hủy' }
  return m[s] ?? s
}

function statusClass(s: string) {
  const m: Record<string,string> = {
    draft: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    expired: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    cancelled: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  }
  return m[s] ?? 'bg-gray-100 text-gray-600'
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
