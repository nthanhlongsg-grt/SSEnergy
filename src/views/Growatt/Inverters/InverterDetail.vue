<template>
  <admin-layout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('inverters.detail.title') }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            {{ t('inverters.detail.serial') }} {{ inverter?.serial_number || t('common.na') }}
          </p>
        </div>
        <button
          @click="$router.back()"
          class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          {{ t('inverters.detail.back') }}
        </button>
      </div>

      <!-- Device Info -->
      <div
        class="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        <!-- Main Info -->
        <div
          class="lg:col-span-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
        >
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('inverters.detail.deviceInfo.title') }}
            </h2>
            <button
              v-if="!editingDevice"
              @click="startEditDevice"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              {{ t('inverters.detail.deviceInfo.edit') }}
            </button>
            <div v-else class="flex gap-2">
              <button
                @click="cancelEditDevice"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                {{ t('inverters.detail.deviceInfo.cancel') }}
              </button>
              <button
                @click="saveDeviceInfo"
                :disabled="saving"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {{ saving ? t('inverters.detail.deviceInfo.saving') : t('inverters.detail.deviceInfo.save') }}
              </button>
            </div>
          </div>
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Serial Number
                </label>
                <p v-if="!editingDevice" class="mt-1 text-gray-900 dark:text-white">
                  {{ inverter?.serial_number || 'N/A' }}
                </p>
                <input
                  v-else
                  v-model="deviceForm.serial_number"
                  type="text"
                  class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('inverters.detail.deviceInfo.fields.model') }}
                </label>
                <p v-if="!editingDevice" class="mt-1 text-gray-900 dark:text-white">
                  {{ inverter?.model || t('common.na') }}
                </p>
                <div v-else class="relative">
                  <input
                    v-model="modelSearchQuery"
                    @input="onModelSearch"
                    @focus="showModelDropdown = true"
                    type="text"
                    :placeholder="t('inverters.detail.deviceInfo.modelSearch.placeholder')"
                    class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <div
                    v-if="showModelDropdown && filteredModels.length > 0"
                    class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    <div
                      v-for="model in filteredModels"
                      :key="model.id"
                      @click="selectModel(model)"
                      class="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                    >
                      <div class="font-medium text-gray-900 dark:text-white">{{ model.name }}</div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">
                        {{ model.manufacturer }} - {{ model.type }}
                      </div>
                    </div>
                  </div>
                  <div
                    v-if="showModelDropdown && filteredModels.length === 0 && !loadingModels"
                    class="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-3 text-sm text-gray-500 dark:text-gray-400"
                  >
                    {{ t('inverters.detail.deviceInfo.modelSearch.noResults') }}
                  </div>
                  <router-link
                    to="/inverters/models"
                    class="mt-1 block text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    target="_blank"
                  >
                    {{ t('inverters.detail.deviceInfo.modelSearch.createNew') }}
                  </router-link>
                </div>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('inverters.detail.deviceInfo.fields.warrantyStart') }}
                </label>
                <p v-if="!editingDevice" class="mt-1 text-gray-900 dark:text-white">
                  {{ formatDate(inverter?.warranty_start_date) }}
                </p>
                <div v-else class="relative">
                  <flat-pickr
                    v-model="deviceForm.warranty_start_date"
                    @on-change="onWarrantyStartDateChange"
                    :config="flatpickrDateConfig"
                    class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <span
                    class="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-[calc(50%+0.125rem)] dark:text-gray-400"
                  >
                    <svg
                      class="fill-current"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.66667 9.16667H8.33333V10.8333H6.66667V9.16667ZM6.66667 12.5H8.33333V14.1667H6.66667V12.5ZM11.6667 9.16667H13.3333V10.8333H11.6667V9.16667ZM11.6667 12.5H13.3333V14.1667H11.6667V12.5ZM4.16667 16.6667H15.8333C16.2917 16.6667 16.6667 16.2917 16.6667 15.8333V5.83333C16.6667 5.375 16.2917 5 15.8333 5H14.1667V3.33333H12.5V5H7.5V3.33333H5.83333V5H4.16667C3.70833 5 3.33333 5.375 3.33333 5.83333V15.8333C3.33333 16.2917 3.70833 16.6667 4.16667 16.6667ZM15 15H5V8.33333H15V15Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                </div>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('inverters.detail.deviceInfo.fields.warrantyEnd') }}
                </label>
                <p v-if="!editingDevice" class="mt-1 text-gray-900 dark:text-white">
                  {{ formatDate(inverter?.warranty_end_date) }}
                </p>
                <div v-else class="relative">
                  <flat-pickr
                    v-model="deviceForm.warranty_end_date"
                    :config="flatpickrDateConfig"
                    class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    :disabled="true"
                  />
                  <span
                    class="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-[calc(50%+0.125rem)] dark:text-gray-400"
                  >
                    <svg
                      class="fill-current"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.66667 9.16667H8.33333V10.8333H6.66667V9.16667ZM6.66667 12.5H8.33333V14.1667H6.66667V12.5ZM11.6667 9.16667H13.3333V10.8333H11.6667V9.16667ZM11.6667 12.5H13.3333V14.1667H11.6667V12.5ZM4.16667 16.6667H15.8333C16.2917 16.6667 16.6667 16.2917 16.6667 15.8333V5.83333C16.6667 5.375 16.2917 5 15.8333 5H14.1667V3.33333H12.5V5H7.5V3.33333H5.83333V5H4.16667C3.70833 5 3.33333 5.375 3.33333 5.83333V15.8333C3.33333 16.2917 3.70833 16.6667 4.16667 16.6667ZM15 15H5V8.33333H15V15Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {{ t('inverters.detail.deviceInfo.fields.warrantyEndNote') }}
                  </p>
                </div>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('inverters.detail.deviceInfo.fields.status') }}
                </label>
                <p v-if="!editingDevice" class="mt-1">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      getWarrantyStatus() === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
                    ]"
                  >
                    {{ getWarrantyStatus() === 'active' ? t('inverters.detail.deviceInfo.status.active') : getWarrantyStatus() === 'pending' ? t('inverters.detail.deviceInfo.status.pending') : t('inverters.detail.deviceInfo.status.outOfWarranty') }}
                  </span>
                </p>
                <select
                  v-else
                  v-model="deviceForm.status"
                  class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="warranty">{{ t('inverters.detail.deviceInfo.status.warranty') }}</option>
                  <option value="out_of_warranty">{{ t('inverters.detail.deviceInfo.status.outOfWarranty') }}</option>
                </select>
              </div>
              <div class="col-span-2">
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('inverters.detail.deviceInfo.fields.installationAddress') }}
                </label>
                <p v-if="!editingDevice" class="mt-1 text-gray-900 dark:text-white">
                  {{ inverter?.installation_address || t('common.na') }}
                </p>
                <input
                  v-else
                  v-model="deviceForm.installation_address"
                  type="text"
                  :placeholder="t('inverters.detail.deviceInfo.fields.installationAddressPlaceholder')"
                  class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div class="col-span-2">
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('inverters.detail.deviceInfo.fields.notes') }}
                </label>
                <p v-if="!editingDevice" class="mt-1 text-gray-900 dark:text-white">
                  {{ inverter?.notes || t('common.na') }}
                </p>
                <textarea
                  v-else
                  v-model="deviceForm.notes"
                  rows="3"
                  class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Customer Info -->
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
        >
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('inverters.detail.customerInfo.title') }}
            </h2>
            <button
              v-if="!editingCustomer"
              @click="startEditCustomer"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              {{ t('inverters.detail.customerInfo.edit') }}
            </button>
            <div v-else class="flex gap-2">
              <button
                @click="cancelEditCustomer"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                {{ t('inverters.detail.customerInfo.cancel') }}
              </button>
              <button
                @click="saveCustomerInfo"
                :disabled="saving"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {{ saving ? t('inverters.detail.customerInfo.saving') : t('inverters.detail.customerInfo.save') }}
              </button>
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('inverters.detail.customerInfo.fields.customer') }}
              </label>
              <p v-if="!editingCustomer" class="mt-1 text-gray-900 dark:text-white">
                {{ inverter?.customer_name || t('inverters.detail.customerInfo.notAssigned') }}
              </p>
              <select
                v-else
                v-model="customerForm.customer_id"
                class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                @change="onCustomerSelected"
              >
                <option value="">{{ t('inverters.detail.customerInfo.selectPlaceholder') }}</option>
                <option
                  v-for="customer in customers"
                  :key="customer.id"
                  :value="String(customer.id)"
                >
                  {{ customer.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('inverters.detail.customerInfo.fields.email') }}
              </label>
              <p v-if="!editingCustomer" class="mt-1 text-gray-900 dark:text-white">
                {{ inverter?.customer_email || t('common.na') }}
              </p>
              <p v-else class="mt-1 text-gray-900 dark:text-white">
                {{ selectedCustomerInfo?.email || t('common.na') }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('inverters.detail.customerInfo.fields.phone') }}
              </label>
              <p v-if="!editingCustomer" class="mt-1 text-gray-900 dark:text-white">
                {{ inverter?.customer_phone || t('common.na') }}
              </p>
              <p v-else class="mt-1 text-gray-900 dark:text-white">
                {{ selectedCustomerInfo?.phone || t('common.na') }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('inverters.detail.customerInfo.fields.address') }}
              </label>
              <p v-if="!editingCustomer" class="mt-1 text-gray-900 dark:text-white">
                {{ inverter?.customer_address || t('common.na') }}
              </p>
              <p v-else class="mt-1 text-gray-900 dark:text-white">
                {{ selectedCustomerInfo?.address || t('common.na') }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Error History -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Lịch sử Lỗi
          </h2>
          <button
            @click="openAddErrorModal"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            + Thêm lỗi mới
          </button>
        </div>
        <div class="p-6">
          <div v-if="loading" class="text-center py-8">
            <p class="text-gray-500 dark:text-gray-400">Đang tải...</p>
          </div>
          <div v-else-if="errorHistory.length === 0" class="text-center py-8">
            <p class="text-gray-500 dark:text-gray-400 italic">
              Danh sách lỗi sẽ được hiển thị ở đây...
            </p>
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="error in errorHistory"
              :key="error.id"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div class="flex justify-between items-start mb-2">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span
                      :class="[
                        'px-2 py-1 text-xs font-semibold rounded-full',
                        getSeverityClass(error.severity),
                      ]"
                    >
                      {{ getSeverityLabel(error.severity) }}
                    </span>
                    <span class="text-sm text-gray-500 dark:text-gray-400">
                      {{ error.error_type }}
                    </span>
                    <span v-if="error.error_code" class="text-sm font-mono text-gray-600 dark:text-gray-400">
                      ({{ error.error_code }})
                    </span>
                  </div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ error.error_message }}
                  </p>
                </div>
                <span
                  :class="[
                    'px-2 py-1 text-xs font-semibold rounded-full',
                    error.resolved_at ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
                  ]"
                >
                  {{ error.resolved_at ? 'Đã xử lý' : 'Chưa xử lý' }}
                </span>
              </div>
              <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <p>
                  <span class="font-medium">Thời gian:</span>
                  {{ formatDateTime(error.occurred_at) }}
                </p>
                <p v-if="error.resolved_at">
                  <span class="font-medium">Đã xử lý:</span>
                  {{ formatDateTime(error.resolved_at) }}
                </p>
                <p v-if="error.resolution">
                  <span class="font-medium">Giải pháp:</span>
                  {{ error.resolution }}
                </p>
                <p v-if="error.ticket_number">
                  <span class="font-medium">Ticket:</span>
                  {{ error.ticket_number }}
                </p>
              </div>
              <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <button
                  @click="editError(error)"
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                >
                  Sửa
                </button>
                <button
                  @click="deleteError(error.id)"
                  class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium"
                >
                  Xóa
                </button>
                <button
                  v-if="!error.resolved_at"
                  @click="markErrorResolved(error.id)"
                  class="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium"
                >
                  Đánh dấu đã xử lý
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ticket History -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ t('inverters.detail.ticketHistory.title') }}
          </h2>
          <router-link
            :to="`/tickets/new?inverter_id=${inverter?.id}`"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            + {{ t('inverters.detail.ticketHistory.add') }}
          </router-link>
        </div>
        <div class="p-6">
          <div v-if="loading" class="text-center py-8">
            <p class="text-gray-500 dark:text-gray-400">{{ t('inverters.detail.ticketHistory.loading') }}</p>
          </div>
          <div v-else-if="ticketHistory.length === 0" class="text-center py-8">
            <p class="text-gray-500 dark:text-gray-400 italic">
              {{ t('inverters.detail.ticketHistory.empty') }}
            </p>
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="ticket in ticketHistory"
              :key="ticket.id"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              @click="$router.push(`/tickets/${ticket.id}`)"
            >
              <div class="flex justify-between items-start mb-2">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium text-gray-900 dark:text-white">
                      #{{ ticket.ticket_number }}
                    </span>
                    <span
                      :class="[
                        'px-2 py-1 text-xs font-semibold rounded-full',
                        getTicketStatusClass(ticket.status),
                      ]"
                    >
                      {{ getTicketStatusLabel(ticket.status) }}
                    </span>
                    <span
                      v-if="ticket.priority"
                      :class="[
                        'px-2 py-1 text-xs font-semibold rounded-full',
                        getPriorityClass(ticket.priority),
                      ]"
                    >
                      {{ getPriorityLabel(ticket.priority) }}
                    </span>
                  </div>
                  <p class="font-medium text-gray-900 dark:text-white mb-1">
                    {{ ticket.title || ticket.category || ticket.error_type || t('common.na') }}
                  </p>
                  <div class="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
                    <span v-if="ticket.category">
                      <span class="font-medium">{{ t('inverters.detail.ticketHistory.fields.category') }}</span>
                      {{ getCategoryLabel(ticket.category) }}
                    </span>
                    <span v-if="ticket.created_at">
                      <span class="font-medium">{{ t('inverters.detail.ticketHistory.fields.createdAt') }}</span>
                      {{ formatDate(ticket.created_at) }}
                    </span>
                    <span v-if="ticket.assigned_to_name">
                      <span class="font-medium">{{ t('inverters.detail.ticketHistory.fields.assignedTo') }}</span>
                      {{ ticket.assigned_to_name }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <button
                  @click.stop="$router.push(`/tickets/${ticket.id}`)"
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                >
                  {{ t('inverters.detail.ticketHistory.actions.viewDetail') }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Service History -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Lịch sử Dịch vụ
          </h2>
          <button
            @click="openAddServiceModal"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            + Thêm dịch vụ
          </button>
        </div>
        <div class="p-6">
          <div v-if="loading" class="text-center py-8">
            <p class="text-gray-500 dark:text-gray-400">Đang tải...</p>
          </div>
          <div v-else-if="serviceHistory.length === 0" class="text-center py-8">
            <p class="text-gray-500 dark:text-gray-400 italic">
              Lịch sử bảo hành và sửa chữa sẽ được hiển thị ở đây...
            </p>
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="service in serviceHistory"
              :key="service.id"
              class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div class="flex justify-between items-start mb-2">
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <span class="font-medium text-gray-900 dark:text-white">
                      {{ service.report_number }}
                    </span>
                    <span
                      :class="[
                        'px-2 py-1 text-xs font-semibold rounded-full',
                        getServiceTypeClass(service.service_type),
                      ]"
                    >
                      {{ getServiceTypeLabel(service.service_type) }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">
                    Ngày dịch vụ: {{ formatDate(service.service_date) }}
                  </p>
                </div>
                <span
                  :class="[
                    'px-2 py-1 text-xs font-semibold rounded-full',
                    getStatusClass(service.status),
                  ]"
                >
                  {{ getStatusLabel(service.status) }}
                </span>
              </div>
              <div v-if="service.description" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <p><span class="font-medium">Mô tả:</span> {{ service.description }}</p>
              </div>
              <div v-if="service.diagnosis" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <p><span class="font-medium">Chẩn đoán:</span> {{ service.diagnosis }}</p>
              </div>
              <div v-if="service.actions_taken" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                <p><span class="font-medium">Hành động đã thực hiện:</span> {{ service.actions_taken }}</p>
              </div>
              <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center text-sm">
                <div class="text-gray-600 dark:text-gray-400">
                  <p v-if="service.technician_name">
                    <span class="font-medium">Kỹ thuật viên:</span> {{ service.technician_name }}
                  </p>
                  <p v-if="service.ticket_number">
                    <span class="font-medium">Ticket:</span> {{ service.ticket_number }}
                  </p>
                </div>
                <div v-if="service.total_cost" class="text-gray-900 dark:text-white font-semibold">
                  {{ formatCurrency(service.total_cost) }}
                </div>
              </div>
              <div class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                <button
                  @click="viewServiceDetail(service)"
                  class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                >
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add/Edit Error Modal -->
      <div
        v-if="showErrorModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-gray-700/45 dark:bg-gray-900/65"
        @click.self="closeErrorModal"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        >
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ editingError ? 'Sửa lỗi' : 'Thêm lỗi mới' }}
              </h2>
              <button
                @click="closeErrorModal"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form @submit.prevent="saveError" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mã lỗi
                  </label>
                  <input
                    v-model="errorForm.error_code"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Loại lỗi <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="errorForm.error_type"
                    type="text"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mức độ <span class="text-red-500">*</span>
                  </label>
                  <select
                    v-model="errorForm.severity"
                    required
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                    <option value="critical">Nghiêm trọng</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Thời gian xảy ra <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <flat-pickr
                      v-model="errorForm.occurred_at"
                      :config="flatpickrDateTimeConfig"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    <span
                      class="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400"
                    >
                      <svg
                        class="fill-current"
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6.66667 9.16667H8.33333V10.8333H6.66667V9.16667ZM6.66667 12.5H8.33333V14.1667H6.66667V12.5ZM11.6667 9.16667H13.3333V10.8333H11.6667V9.16667ZM11.6667 12.5H13.3333V14.1667H11.6667V12.5ZM4.16667 16.6667H15.8333C16.2917 16.6667 16.6667 16.2917 16.6667 15.8333V5.83333C16.6667 5.375 16.2917 5 15.8333 5H14.1667V3.33333H12.5V5H7.5V3.33333H5.83333V5H4.16667C3.70833 5 3.33333 5.375 3.33333 5.83333V15.8333C3.33333 16.2917 3.70833 16.6667 4.16667 16.6667ZM15 15H5V8.33333H15V15Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Mô tả lỗi <span class="text-red-500">*</span>
                </label>
                <textarea
                  v-model="errorForm.error_message"
                  rows="3"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Thời gian xử lý
                </label>
                <div class="relative">
                  <flat-pickr
                    v-model="errorForm.resolved_at"
                    :config="flatpickrDateTimeConfig"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  <span
                    class="absolute text-gray-500 -translate-y-1/2 pointer-events-none right-3 top-1/2 dark:text-gray-400"
                  >
                    <svg
                      class="fill-current"
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M6.66667 9.16667H8.33333V10.8333H6.66667V9.16667ZM6.66667 12.5H8.33333V14.1667H6.66667V12.5ZM11.6667 9.16667H13.3333V10.8333H11.6667V9.16667ZM11.6667 12.5H13.3333V14.1667H11.6667V12.5ZM4.16667 16.6667H15.8333C16.2917 16.6667 16.6667 16.2917 16.6667 15.8333V5.83333C16.6667 5.375 16.2917 5 15.8333 5H14.1667V3.33333H12.5V5H7.5V3.33333H5.83333V5H4.16667C3.70833 5 3.33333 5.375 3.33333 5.83333V15.8333C3.33333 16.2917 3.70833 16.6667 4.16667 16.6667ZM15 15H5V8.33333H15V15Z"
                        fill="currentColor"
                      />
                    </svg>
                  </span>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Giải pháp
                </label>
                <textarea
                  v-model="errorForm.resolution"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>

              <div class="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  @click="closeErrorModal"
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  :disabled="saving"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ saving ? 'Đang lưu...' : 'Lưu' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <!-- Add Service History Modal -->
      <div
        v-if="showServiceModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-gray-700/45 dark:bg-gray-900/65"
        @click.self="closeServiceModal"
      >
        <div
          class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
        >
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                Thêm lịch sử dịch vụ
              </h2>
              <button
                @click="closeServiceModal"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-4">
              <p class="text-sm text-blue-800 dark:text-blue-200">
                💡 Lịch sử dịch vụ được quản lý thông qua Service Reports. Vui lòng tạo Service Report từ Ticket để tự động hiển thị ở đây.
              </p>
            </div>

            <div class="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                @click="closeServiceModal"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { apiClient } from '@/services/api'
import type { Inverter } from '@/services/inverterService'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { useFlatpickrConfig } from '@/composables/useFlatpickr'

const route = useRoute()
const { t } = useI18n()

// Flatpickr config
const { dateConfig: flatpickrDateConfig, dateTimeConfig: flatpickrDateTimeConfig } = useFlatpickrConfig()

const inverter = ref<any>(null)
const ticketHistory = ref<any[]>([])
const errorHistory = ref<any[]>([])
const serviceHistory = ref<any[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const saving = ref(false)

// Edit mode states
const editingDevice = ref(false)
const editingCustomer = ref(false)
const deviceForm = ref({
  serial_number: '',
  model: '',
  type: '',
  power_rating: '',
  warranty_start_date: '',
  warranty_end_date: '',
  installation_address: '',
  status: 'active',
  notes: '',
})
const customerForm = ref({
  customer_id: '',
})
const customers = ref<any[]>([])
const availableModels = ref<any[]>([])
const loadingModels = ref(false)
const modelSearchQuery = ref('')
const showModelDropdown = ref(false)
const selectedModelInfo = ref<any>(null)

// Error modal states
const showErrorModal = ref(false)
const editingError = ref<any>(null)
const errorForm = ref({
  error_code: '',
  error_type: '',
  error_message: '',
  severity: 'medium',
  occurred_at: '',
  resolved_at: '',
  resolution: '',
})

// Service modal states
const showServiceModal = ref(false)

const fetchInverterData = async () => {
  const inverterId = route.params.id as string
  if (!inverterId) {
    error.value = 'Không tìm thấy ID thiết bị'
    return
  }

  loading.value = true
  error.value = null

  try {
    const response = await apiClient.get(`/inverters/${inverterId}`)
    if (response.error) {
      throw new Error(response.error)
    }

    const data = response.data as any
    inverter.value = {
      id: data.id,
      serial_number: data.serial_number,
      model: data.model,
      type: data.type,
      warranty_start_date: data.warranty_start_date,
      warranty_end_date: data.warranty_end_date,
      customer_id: data.customer_id,
      customer_name: data.customer_name,
      customer_email: data.customer_email,
      customer_phone: data.customer_phone,
      customer_address: data.customer_address,
      installation_address: data.installation_address,
    }

    ticketHistory.value = data.tickets || []
    errorHistory.value = data.error_history || []
    serviceHistory.value = data.service_history || []
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Không thể tải thông tin thiết bị'
    console.error('Error fetching inverter:', err)
  } finally {
    loading.value = false
  }
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
    active: 'Đang bảo hành',
    expired: 'Hết hạn',
    pending: 'Chờ kích hoạt',
  }
  return labels[status] || status
}

const getSeverityClass = (severity: string) => {
  const classes: Record<string, string> = {
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  }
  return classes[severity] || classes.medium
}

const getSeverityLabel = (severity: string) => {
  const labels: Record<string, string> = {
    critical: 'Nghiêm trọng',
    high: 'Cao',
    medium: 'Trung bình',
    low: 'Thấp',
  }
  return labels[severity] || severity
}

const getServiceTypeClass = (type: string) => {
  const classes: Record<string, string> = {
    warranty: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    repair: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    maintenance: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    inspection: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  }
  return classes[type] || classes.maintenance
}

const getServiceTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    warranty: 'Bảo hành',
    repair: 'Sửa chữa',
    maintenance: 'Bảo trì',
    inspection: 'Kiểm tra',
  }
  return labels[type] || type
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return classes[status] || classes.draft
}

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: 'Nháp',
    completed: 'Hoàn thành',
    cancelled: 'Hủy',
  }
  return labels[status] || status
}

const getTicketStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    initialized: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
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
    new: t('tickets.list.statusLabels.new'),
    assigned: t('tickets.list.statusLabels.assigned'),
    waiting_parts: t('tickets.list.statusLabels.waiting_parts'),
    completed: t('tickets.list.statusLabels.completed'),
  }
  return labels[status] || status
}

const getPriorityClass = (priority: string) => {
  const classes: Record<string, string> = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return classes[priority] || classes.medium
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    urgent: t('tickets.detail.labels.priority.urgent'),
    high: t('tickets.detail.labels.priority.high'),
    medium: t('tickets.detail.labels.priority.medium'),
    low: t('tickets.detail.labels.priority.low'),
  }
  return labels[priority] || priority
}

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    warranty: t('tickets.detail.labels.category.warranty'),
    technicalSupport: t('tickets.detail.labels.category.technicalSupport'),
    productConsultation: t('tickets.detail.labels.category.productConsultation'),
    other: t('tickets.detail.labels.category.other'),
    repair: t('tickets.detail.labels.category.repair'),
    complaint: t('tickets.detail.labels.category.complaint'),
    consultation: t('tickets.detail.labels.category.consultation'),
  }
  return labels[category] || category
}

const formatDate = (dateString: string | Date | null | undefined) => {
  if (!dateString) return t('common.na')
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  if (isNaN(date.getTime())) return t('common.na')
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

const formatDateTime = (dateString: string | Date | null | undefined) => {
  if (!dateString) return 'N/A'
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  if (isNaN(date.getTime())) return 'N/A'
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount)
}

const getWarrantyStatus = () => {
  if (!inverter.value?.warranty_start_date) return 'pending'
  if (!inverter.value?.warranty_end_date) return 'pending'
  
  const endDate = new Date(inverter.value.warranty_end_date)
  const now = new Date()
  
  if (now > endDate) return 'expired'
  return 'active'
}

// Load customers list
const loadCustomers = async () => {
  try {
    console.log('🔄 Loading customers...')
    const response = await apiClient.get('/customers?limit=1000')
    if (response.error) {
      throw new Error(response.error)
    }
    const apiResponse = response.data as any
    customers.value = apiResponse?.data || apiResponse || []
    console.log('✅ Loaded customers:', customers.value.length)
  } catch (err) {
    console.error('❌ Error loading customers:', err)
    customers.value = []
  }
}

// Type label helper
const getTypeLabel = (type: string | null | undefined) => {
  if (!type) return 'N/A'
  const labels: Record<string, string> = {
    'grid-tie': 'Hòa lưới',
    hybrid: 'Hybrid',
    logger: 'Logger',
    meter: 'Meter',
    bess: 'BESS',
    other: 'Khác',
  }
  return labels[type] || type
}

// Load models
const loadModels = async () => {
  loadingModels.value = true
  try {
    const response = await apiClient.get('/models?status=active&limit=1000')
    if (response.error) {
      throw new Error(response.error)
    }
    const data = response.data as any
    availableModels.value = Array.isArray(data) ? data : (data?.data || [])
  } catch (err) {
    console.error('Error loading models:', err)
  } finally {
    loadingModels.value = false
  }
}

// Filter models based on search query
const filteredModels = computed(() => {
  if (!modelSearchQuery.value) {
    return availableModels.value.slice(0, 10) // Show first 10 when no search
  }
  const query = modelSearchQuery.value.toLowerCase()
  return availableModels.value.filter(model => 
    model.name.toLowerCase().includes(query) ||
    (model.manufacturer && model.manufacturer.toLowerCase().includes(query)) ||
    (model.type && model.type.toLowerCase().includes(query))
  ).slice(0, 10)
})

// Handle model search
const onModelSearch = () => {
  showModelDropdown.value = true
}

// Handle model selection
const selectModel = (model: any) => {
  deviceForm.value.model = model.name
  selectedModelInfo.value = model
  modelSearchQuery.value = model.name
  showModelDropdown.value = false
  
  // Auto-fill type from model if available
  if (model.type) {
    // Map model type to inverter type if needed
    deviceForm.value.type = model.type
  }
}

// Handle warranty start date change - auto calculate end date (+5 years)
const onWarrantyStartDateChange = (selectedDates: Date[]) => {
  if (selectedDates && selectedDates.length > 0) {
    const startDate = new Date(selectedDates[0])
    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + 5)
    
    // Format as YYYY-MM-DD
    deviceForm.value.warranty_end_date = endDate.toISOString().split('T')[0]
  } else {
    deviceForm.value.warranty_end_date = ''
  }
}

// Device edit functions
const startEditDevice = async () => {
  if (!inverter.value) return
  
  // Load models when starting to edit
  if (availableModels.value.length === 0) {
    await loadModels()
  }
  
  // Find selected model info
  const currentModel = availableModels.value.find(m => m.name === inverter.value.model)
  if (currentModel) {
    selectedModelInfo.value = currentModel
    modelSearchQuery.value = currentModel.name
  } else {
    modelSearchQuery.value = inverter.value.model || ''
  }
  
  // Determine warranty status based on warranty dates
  let warrantyStatus = 'out_of_warranty'
  if (inverter.value.warranty_start_date && inverter.value.warranty_end_date) {
    const today = new Date()
    const startDate = new Date(inverter.value.warranty_start_date)
    const endDate = new Date(inverter.value.warranty_end_date)
    if (today >= startDate && today <= endDate) {
      warrantyStatus = 'warranty'
    }
  }
  
  deviceForm.value = {
    serial_number: inverter.value.serial_number || '',
    model: inverter.value.model || '',
    type: inverter.value.type || '',
    power_rating: inverter.value.power_rating || '',
    warranty_start_date: inverter.value.warranty_start_date ? inverter.value.warranty_start_date.split('T')[0] : '',
    warranty_end_date: inverter.value.warranty_end_date ? inverter.value.warranty_end_date.split('T')[0] : '',
    installation_address: inverter.value.installation_address || '',
    status: warrantyStatus,
    notes: inverter.value.notes || '',
  }
  editingDevice.value = true
  showModelDropdown.value = false
}

const cancelEditDevice = () => {
  editingDevice.value = false
  deviceForm.value = {
    serial_number: '',
    model: '',
    type: '',
    power_rating: '',
    warranty_start_date: '',
    warranty_end_date: '',
    installation_address: '',
    status: 'active',
    notes: '',
  }
  modelSearchQuery.value = ''
  showModelDropdown.value = false
  selectedModelInfo.value = null
}

const saveDeviceInfo = async () => {
  if (!inverter.value?.id) return
  
  saving.value = true
  error.value = null

  try {
    const updateData: any = {
      serial_number: deviceForm.value.serial_number,
      model: deviceForm.value.model,
      type: deviceForm.value.type,
      warranty_start_date: deviceForm.value.warranty_start_date || null,
      warranty_end_date: deviceForm.value.warranty_end_date || null,
      installation_address: deviceForm.value.installation_address || null,
      notes: deviceForm.value.notes || null,
    }

    const response = await apiClient.put<Inverter>(`/inverters/${inverter.value.id}`, updateData)
    if (response.error) {
      throw new Error(response.error)
    }

    editingDevice.value = false
    await fetchInverterData()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu'
    console.error('Error saving device info:', err)
    alert(error.value)
  } finally {
    saving.value = false
  }
}

// Customer edit functions
const startEditCustomer = () => {
  if (!inverter.value) return
  customerForm.value = {
    customer_id: inverter.value.customer_id ? String(inverter.value.customer_id) : '',
  }
  editingCustomer.value = true
}

const cancelEditCustomer = () => {
  editingCustomer.value = false
  customerForm.value = {
    customer_id: '',
  }
}

const selectedCustomerInfo = computed(() => {
  if (!customerForm.value.customer_id) {
    return null
  }
  const customerId = parseInt(String(customerForm.value.customer_id))
  const customer = customers.value.find(c => c.id === customerId)
  if (customer) {
    return {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
    }
  }
  return null
})

const onCustomerSelected = () => {
  console.log('🔍 Customer selected:', customerForm.value.customer_id)
  const selectedCustomer = customers.value.find(c => c.id === parseInt(String(customerForm.value.customer_id)))
  if (selectedCustomer) {
    console.log('✅ Found customer:', selectedCustomer)
    // Customer info is automatically populated via selectedCustomerInfo computed
  } else {
    console.log('❌ Customer not found in list')
  }
}

const saveCustomerInfo = async () => {
  if (!inverter.value?.id) return
  
  saving.value = true
  error.value = null

  try {
    const updateData: any = {}

    // Normalize customer_id: ensure it's a valid positive integer or null
    const customerIdStr = String(customerForm.value.customer_id || '').trim()
    console.log('🔍 Debug saveCustomerInfo:', {
      originalValue: customerForm.value.customer_id,
      customerIdStr,
      inverterId: inverter.value.id,
      customersList: customers.value.map(c => ({ id: c.id, name: c.name }))
    })
    
    if (customerIdStr && customerIdStr !== '0') {
      const customerIdNum = parseInt(customerIdStr)
      if (!isNaN(customerIdNum) && customerIdNum > 0) {
        updateData.customer_id = customerIdNum
      } else {
        updateData.customer_id = null
      }
    } else {
      updateData.customer_id = null
    }

    console.log('📤 Sending update data:', JSON.stringify(updateData, null, 2))

    const response = await apiClient.put<Inverter>(`/inverters/${inverter.value.id}`, updateData)
    console.log('📥 Response:', JSON.stringify(response, null, 2))
    
    if (response.error) {
      console.error('❌ API Error:', response.error)
      throw new Error(response.error)
    }

    if (!response.data) {
      console.error('❌ No data in response')
      throw new Error('Không nhận được dữ liệu từ server')
    }

    console.log('✅ Update successful, customer_id:', response.data.customer_id)
    console.log('✅ Full response data:', JSON.stringify(response.data, null, 2))
    
    // Check if customer_id was actually updated
    if (response.data.customer_id === null && updateData.customer_id !== null) {
      console.error('❌ WARNING: customer_id was set to null in response, but we sent:', updateData.customer_id)
      alert('Cảnh báo: Khách hàng không được gán. Có thể khách hàng không tồn tại trong hệ thống.')
    }
    
    editingCustomer.value = false
    // Force refresh to get updated data
    await fetchInverterData()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu'
    console.error('❌ Error saving customer info:', err)
    alert(error.value)
  } finally {
    saving.value = false
  }
}

// Error modal functions
const openAddErrorModal = () => {
  editingError.value = null
  errorForm.value = {
    error_code: '',
    error_type: '',
    error_message: '',
    severity: 'medium',
    occurred_at: new Date().toISOString().slice(0, 16),
    resolved_at: '',
    resolution: '',
  }
  showErrorModal.value = true
}

const editError = (errorItem: any) => {
  editingError.value = errorItem
  errorForm.value = {
    error_code: errorItem.error_code || '',
    error_type: errorItem.error_type || '',
    error_message: errorItem.error_message || '',
    severity: errorItem.severity || 'medium',
    occurred_at: errorItem.occurred_at ? new Date(errorItem.occurred_at).toISOString().slice(0, 16) : '',
    resolved_at: errorItem.resolved_at ? new Date(errorItem.resolved_at).toISOString().slice(0, 16) : '',
    resolution: errorItem.resolution || '',
  }
  showErrorModal.value = true
}

const closeErrorModal = () => {
  showErrorModal.value = false
  editingError.value = null
  errorForm.value = {
    error_code: '',
    error_type: '',
    error_message: '',
    severity: 'medium',
    occurred_at: '',
    resolved_at: '',
    resolution: '',
  }
}

const saveError = async () => {
  if (!errorForm.value.error_type || !errorForm.value.error_message || !errorForm.value.occurred_at) {
    error.value = 'Vui lòng điền đầy đủ thông tin bắt buộc'
    return
  }

  saving.value = true
  error.value = null

  try {
    const inverterId = route.params.id as string
    const errorData = {
      error_code: errorForm.value.error_code || null,
      error_type: errorForm.value.error_type,
      error_message: errorForm.value.error_message,
      severity: errorForm.value.severity,
      occurred_at: new Date(errorForm.value.occurred_at).toISOString(),
      resolved_at: errorForm.value.resolved_at ? new Date(errorForm.value.resolved_at).toISOString() : null,
      resolution: errorForm.value.resolution || null,
    }

    if (editingError.value?.id) {
      // Update error
      const response = await apiClient.put(`/inverters/${inverterId}/errors/${editingError.value.id}`, errorData)
      if (response.error) {
        throw new Error(response.error)
      }
    } else {
      // Create new error
      const response = await apiClient.post(`/inverters/${inverterId}/errors`, errorData)
      if (response.error) {
        throw new Error(response.error)
      }
    }

    closeErrorModal()
    await fetchInverterData()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu'
    console.error('Error saving error:', err)
  } finally {
    saving.value = false
  }
}

const deleteError = async (errorId: number) => {
  if (!confirm('Bạn có chắc chắn muốn xóa lỗi này?')) {
    return
  }

  saving.value = true
  error.value = null

  try {
    const inverterId = route.params.id as string
    const response = await apiClient.delete(`/inverters/${inverterId}/errors/${errorId}`)
    if (response.error) {
      throw new Error(response.error)
    }

    await fetchInverterData()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Không thể xóa lỗi'
    console.error('Error deleting error:', err)
    alert(error.value)
  } finally {
    saving.value = false
  }
}

const markErrorResolved = async (errorId: number) => {
  saving.value = true
  error.value = null

  try {
    const inverterId = route.params.id as string
    const resolvedData = {
      resolved_at: new Date().toISOString(),
      resolution: 'Đã được xử lý',
    }

    const response = await apiClient.put(`/inverters/${inverterId}/errors/${errorId}`, resolvedData)
    if (response.error) {
      throw new Error(response.error)
    }

    await fetchInverterData()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Không thể đánh dấu đã xử lý'
    console.error('Error marking error as resolved:', err)
    alert(error.value)
  } finally {
    saving.value = false
  }
}

// Service modal functions
const openAddServiceModal = () => {
  showServiceModal.value = true
}

const closeServiceModal = () => {
  showServiceModal.value = false
}

const viewServiceDetail = (service: any) => {
  if (service.id) {
    window.location.href = `/service-reports/${service.id}`
  }
}

// Handle click outside to close model dropdown
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.relative')) {
    showModelDropdown.value = false
  }
}

onMounted(() => {
  fetchInverterData()
  loadCustomers()
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
