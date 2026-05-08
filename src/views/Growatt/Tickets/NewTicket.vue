<template>
  <admin-layout>
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ t('tickets.new.header.title') }}
        </h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          {{ t('tickets.new.header.subtitle') }}
        </p>
      </div>

      <!-- Error Message -->
      <div
        v-if="error"
        class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
      >
        <p class="text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Form -->
      <form
        @submit.prevent="handleSubmit"
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm space-y-6"
      >
        <!-- Ticket Type & Priority -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Ticket Type -->
        <div>
            <label
              for="ticketType"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {{ t('tickets.new.ticketInfo.typeLabel') }} <span class="text-red-500">*</span>
            </label>
              <select
              id="ticketType"
              v-model="form.ticketType"
              required
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option
                v-for="option in ticketTypeOptions"
                :key="option.value || 'type-all'"
                :value="option.value"
              >
                {{ option.label }}
                </option>
              </select>
            </div>

          <!-- Priority -->
          <div>
            <label
              for="priority"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              {{ t('tickets.new.ticketInfo.priorityLabel') }} <span class="text-red-500">*</span>
            </label>
              <select
              id="priority"
              v-model="form.priority"
              required
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option
                v-for="option in priorityOptions"
                :key="option.value || 'priority-all'"
                :value="option.value"
              >
                {{ option.label }}
                </option>
              </select>
            </div>
        </div>

        <!-- Device Selection (Serial Number Search) -->
        <div>
          <label
            for="serialNumberSearch"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {{ t('tickets.new.device.label') }} <span class="text-red-500">*</span>
          </label>
          <div class="relative">
            <input
              id="serialNumberSearch"
              v-model="serialNumberSearch"
              @focus="showSerialDropdown = true"
              @blur="handleSerialBlur"
              @input="searchSerialNumber"
              type="text"
              :placeholder="t('tickets.new.device.serialPlaceholder')"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <transition name="fade">
              <div
                v-if="showSerialDropdown"
                class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                <div
                  v-if="filteredSerialNumbers.length > 0"
                  v-for="inv in filteredSerialNumbers"
                  :key="inv.id"
                  @mousedown.prevent="selectInverterBySerial(inv)"
                  class="px-4 py-2 text-sm text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  :class="{ 'bg-blue-50 dark:bg-blue-900/20': form.inverterId === inv.id.toString() }"
                >
                  {{ inv.serial_number }} - {{ inv.model }}
                </div>
                <div
                  v-if="filteredSerialNumbers.length === 0 && serialNumberSearch.trim()"
                  class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center"
                >
                  {{ t('tickets.new.device.noDevicesFound') }}
                </div>
                <!-- Always show Add device option at the bottom -->
                <div
                  @mousedown.prevent="navigateToRegisterDevice"
                  class="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700 font-medium"
                >
                  + {{ t('tickets.new.device.addDevice') }}
                </div>
              </div>
            </transition>
          </div>
        </div>

        <!-- Inverter Details (Auto-loaded from Serial Number) -->
        <div v-if="selectedInverterDetails" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('tickets.new.device.infoTitle') }}
            </h2>
            <button
              v-if="!editingInverterDetails"
              type="button"
              @click="startEditInverterDetails"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              {{ t('tickets.new.device.edit') }}
            </button>
            <div v-else class="flex gap-2">
              <button
                type="button"
                @click="cancelEditInverterDetails"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                {{ t('tickets.new.device.cancel') }}
              </button>
              <button
                type="button"
                @click="saveInverterDetails"
                :disabled="savingInverterDetails"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {{ savingInverterDetails ? t('tickets.new.device.saving') : t('tickets.new.device.save') }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Device Info -->
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.device.fields.serial') }}</label>
              <p v-if="!editingInverterDetails" class="mt-1 text-gray-900 dark:text-white">
                {{ selectedInverterDetails.serial_number || t('common.na') }}
              </p>
              <input
                v-else
                v-model="inverterDetailsForm.serial_number"
                type="text"
                class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.device.fields.model') }}</label>
              <p v-if="!editingInverterDetails" class="mt-1 text-gray-900 dark:text-white">
                {{ selectedInverterDetails.model || t('common.na') }}
              </p>
              <input
                v-else
                v-model="inverterDetailsForm.model"
                type="text"
                class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.device.fields.type') }}</label>
              <p v-if="!editingInverterDetails" class="mt-1 text-gray-900 dark:text-white">
                {{ selectedInverterDetails.type || t('common.na') }}
              </p>
              <input
                v-else
                v-model="inverterDetailsForm.type"
                type="text"
                class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.device.fields.power') }}</label>
              <p v-if="!editingInverterDetails" class="mt-1 text-gray-900 dark:text-white">
                {{ selectedInverterDetails.power_rating || t('common.na') }}
              </p>
              <input
                v-else
                v-model="inverterDetailsForm.power_rating"
                type="text"
                class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.device.fields.warrantyStart') }}</label>
              <p v-if="!editingInverterDetails" class="mt-1 text-gray-900 dark:text-white">
                {{ formatDate(selectedInverterDetails.warranty_start_date) }}
              </p>
              <div v-else class="relative">
                <flat-pickr
                  v-model="inverterDetailsForm.warranty_start_date"
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
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.device.fields.warrantyEnd') }}</label>
              <p v-if="!editingInverterDetails" class="mt-1 text-gray-900 dark:text-white">
                {{ formatDate(selectedInverterDetails.warranty_end_date) }}
              </p>
              <div v-else class="relative">
                <flat-pickr
                  v-model="inverterDetailsForm.warranty_end_date"
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
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.device.fields.installationAddress') }}</label>
              <p v-if="!editingInverterDetails" class="mt-1 text-gray-900 dark:text-white">
                {{ selectedInverterDetails.installation_address || t('common.na') }}
              </p>
              <input
                v-else
                v-model="inverterDetailsForm.installation_address"
                type="text"
                class="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

        </div>

        <!-- Customer Info (Extracted from Device) -->
        <div v-if="selectedInverterDetails || (isEndUser && currentUser)" class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('tickets.new.customer.title') }}
            </h2>
            <button
              v-if="!editingCustomerDetails && !isEndUser && selectedCustomerDetails"
              type="button"
              @click="startEditCustomerDetails"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              {{ t('tickets.new.customer.edit') }}
            </button>
            <div v-else-if="!isEndUser" class="flex gap-2">
              <button
                type="button"
                @click="cancelEditCustomerDetails"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                {{ t('tickets.new.customer.cancel') }}
              </button>
              <button
                type="button"
                @click="saveCustomerDetails"
                :disabled="savingCustomerDetails"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {{ savingCustomerDetails ? t('tickets.new.customer.saving') : t('tickets.new.customer.save') }}
              </button>
            </div>
          </div>

          <!-- Select Customer if not assigned -->
          <div v-if="!selectedCustomerDetails && !isEndUser && selectedInverterDetails" class="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <label class="block text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
              {{ t('tickets.new.customer.assignLabel') }} <span class="text-red-500">*</span>
            </label>
            <div class="flex gap-2">
              <select
                v-model="selectedCustomerIdForAssignment"
                class="flex-1 px-4 py-2 border border-blue-300 dark:border-blue-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :disabled="assigningCustomer"
              >
                <option value="">{{ t('tickets.new.customer.assignPlaceholder') }}</option>
                <option v-for="customer in customers" :key="customer.id" :value="customer.id">
                  {{ customer.name }} - {{ customer.email || customer.phone || '' }}
                </option>
              </select>
              <button
                type="button"
                @click="assignCustomerToInverter"
                :disabled="!selectedCustomerIdForAssignment || assigningCustomer"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ assigningCustomer ? t('tickets.new.customer.assigning') : t('tickets.new.customer.assignButton') }}
              </button>
            </div>
          </div>
          
          <!-- Display Customer Info (Read-only) -->
          <div v-if="!editingCustomerDetails || isEndUser" class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.customer.name') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ isEndUser ? currentUser?.name : (selectedCustomerDetails?.name || t('tickets.new.customer.unassigned')) }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.customer.email') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ isEndUser ? currentUser?.email : (selectedCustomerDetails?.email || t('common.na')) }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.customer.phone') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ isEndUser ? (currentUser?.phone || t('common.na')) : (selectedCustomerDetails?.phone || t('common.na')) }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.new.customer.address') }}</label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ isEndUser ? ((currentUser as any)?.address || t('common.na')) : (selectedCustomerDetails?.address || t('common.na')) }}
              </p>
          </div>
        </div>

          <!-- Edit Customer: Searchable Dropdown -->
          <div v-else class="space-y-4">
          <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('tickets.new.customer.selectCustomer') }} <span class="text-red-500">*</span>
            </label>
              <div class="relative">
                <input
                  v-model="customerSearchQuery"
                  @focus="showCustomerDropdown = true"
                        @blur="handleCustomerBlur"
                  @input="searchCustomer"
                  type="text"
                  :placeholder="t('tickets.new.customer.searchPlaceholder')"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <transition name="fade">
                  <div
                    v-if="showCustomerDropdown"
                    class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    <div
                      v-if="filteredCustomers.length > 0"
                      v-for="customer in filteredCustomers"
                      :key="customer.id"
                      @mousedown.prevent="selectCustomer(customer)"
                      class="px-4 py-2 text-sm text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      :class="{ 'bg-blue-50 dark:bg-blue-900/20': customerDetailsForm.customer_id === customer.id }"
                    >
                      {{ customer.name }} {{ customer.email ? `(${customer.email})` : '' }} {{ customer.phone ? `- ${customer.phone}` : '' }}
          </div>
                    <div
                      v-if="filteredCustomers.length === 0 && customerSearchQuery.trim()"
                      class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center"
                    >
                      {{ t('tickets.new.customer.noCustomersFound') }}
                    </div>
                    <!-- Always show Add customer option at the bottom -->
                    <div
                      @mousedown.prevent="navigateToAddCustomer"
                      class="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700 font-medium"
                    >
                      + {{ t('tickets.new.customer.addCustomer') }}
                    </div>
                  </div>
                </transition>
              </div>
              <!-- Selected Customer Display -->
              <div v-if="customerDetailsForm.customer_id" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {{ t('tickets.new.customer.selectedCustomer') }}: <span class="font-medium text-gray-900 dark:text-white">{{ getSelectedCustomerName() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Title -->
        <div>
          <label
            for="title"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {{ t('tickets.new.ticketInfo.titleLabel') }} <span class="text-red-500">*</span>
          </label>
          <input
            id="title"
            v-model="form.title"
            required
            type="text"
            :placeholder="t('tickets.new.ticketInfo.titlePlaceholder')"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        <!-- Description -->
        <div>
          <label
            for="description"
            class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {{ t('tickets.new.ticketInfo.descriptionLabel') }} <span class="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            v-model="form.description"
            required
            rows="5"
            :placeholder="t('tickets.new.ticketInfo.descriptionPlaceholder')"
            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          ></textarea>
        </div>

        <!-- Attachments (Images Only) -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('tickets.new.attachments.label') }}
            <span class="text-xs text-gray-500 dark:text-gray-400 ml-2">
              ({{ form.attachments.length }}/4)
            </span>
          </label>
          <div
            class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center"
            :class="{ 'border-blue-400 bg-blue-50 dark:bg-blue-900/20': isDragging }"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleDrop"
          >
            <input
              type="file"
              :multiple="form.attachments.length < 4"
              accept="image/*"
              @change="handleFileUpload"
              class="hidden"
              id="file-upload"
              :disabled="form.attachments.length >= 4"
            />
            <label
              for="file-upload"
              class="cursor-pointer flex flex-col items-center"
              :class="{ 'cursor-not-allowed opacity-50': form.attachments.length >= 4 }"
            >
              <svg
                class="w-12 h-12 text-gray-400 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ t('tickets.new.attachments.hint') }}
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                {{ t('tickets.new.attachments.help') }}
              </span>
            </label>
            <!-- Image Previews -->
            <div v-if="form.attachments.length > 0" class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div
                v-for="(preview, index) in form.attachmentPreviews"
                :key="index"
                class="relative group"
              >
                <img
                  :src="preview"
                  :alt="form.attachments[index]?.name"
                  class="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                />
                <button
                  type="button"
                  @click="removeFile(index)"
                  class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  :title="t('tickets.new.attachments.remove')"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div class="absolute bottom-2 left-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded truncate">
                  {{ form.attachments[index]?.name }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-4 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            @click="$router.back()"
            class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {{ t('tickets.new.actions.cancel') }}
          </button>
          <button
            type="submit"
            :disabled="isSubmitting"
            class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? t('tickets.new.actions.submitting') : t('tickets.new.actions.submit') }}
          </button>
        </div>
      </form>

      <!-- Modal: Create New Inverter -->
      <div
        v-if="showNewInverterModal"
        class="fixed inset-0 z-50 flex items-center justify-center bg-gray-700/45 dark:bg-gray-900/65"
        @click.self="closeNewInverterModal"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                {{ t('tickets.new.modal.title') }}
              </h2>
              <button
                @click="closeNewInverterModal"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form @submit.prevent="createNewInverter" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('tickets.new.modal.serialLabel') }} <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="newInverterForm.serial_number"
                    type="text"
                    required
                    :placeholder="t('tickets.new.modal.serialPlaceholder')"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('tickets.new.modal.modelLabel') }} <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <!-- Searchable Model Dropdown -->
                    <div class="relative">
                    <input
                        v-model="modelSearchQuery"
                        @focus="showModelDropdown = true"
                        @blur="handleModelBlur"
                      type="text"
                        :placeholder="t('inverters.register.form.searchModel')"
                        class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                      <transition name="fade">
                        <div
                          v-if="showModelDropdown"
                          class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                        >
                          <div
                            v-if="filteredModels.length === 0"
                            class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center"
                          >
                            {{ t('inverters.register.form.noModelsFound') }}
                  </div>
                          <div
                            v-for="model in filteredModels"
                            :key="model.id"
                            @mousedown.prevent="selectModel(model)"
                            class="px-4 py-2 text-sm text-gray-900 dark:text-white cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                            :class="{ 'bg-blue-50 dark:bg-blue-900/20': newInverterForm.model === model.name }"
                          >
                            {{ model.name }} {{ model.manufacturer ? `(${model.manufacturer})` : '' }}
                </div>
                          <div
                            @mousedown.prevent="selectNewModel"
                            class="px-4 py-2 text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 border-t border-gray-200 dark:border-gray-700"
                          >
                            + {{ t('tickets.new.modal.modelCreate') }}
                </div>
                        </div>
                      </transition>
                    </div>
                    <!-- Selected Model Display -->
                    <div v-if="newInverterForm.model && newInverterForm.model !== '__NEW__'" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                      {{ t('tickets.new.modal.modelLabel') }}: <span class="font-medium text-gray-900 dark:text-white">{{ newInverterForm.model }}</span>
                    </div>
                    <!-- New Model Input -->
                  <input
                      v-if="newInverterForm.model === '__NEW__'"
                      v-model="newModelName"
                    type="text"
                      required
                      :placeholder="t('tickets.new.modal.modelNewPlaceholder')"
                      class="mt-2 w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  </div>
                </div>
              </div>
              
              <!-- Installation Address -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('tickets.new.modal.addressLabel') }}
                </label>
                <input
                  v-model="newInverterForm.installation_address"
                  type="text"
                  :placeholder="t('tickets.new.modal.addressPlaceholder')"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div v-if="error" class="text-red-600 dark:text-red-400 text-sm">
                {{ error }}
              </div>

              <div class="flex gap-4 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  @click="closeNewInverterModal"
                  class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {{ t('tickets.new.modal.cancel') }}
                </button>
                <button
                  type="submit"
                  :disabled="creatingInverter"
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {{ creatingInverter ? t('tickets.new.modal.submitting') : t('tickets.new.modal.submit') }}
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
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { ticketService } from '@/services/ticketService'
import { apiClient } from '@/services/api'
import { useAuth, UserRole } from '@/composables/useAuth'
import { formatDate } from '@/utils/dateTime'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { useFlatpickrConfig } from '@/composables/useFlatpickr'
import { useSlaSettings } from '@/composables/useSlaSettings'

const router = useRouter()
const { t } = useI18n()
const { slaHours } = useSlaSettings()
const { getUser } = useAuth()
const currentUser = computed(() => getUser.value)
const isEndUser = computed(() => currentUser.value?.role === UserRole.END_USER)

// Flatpickr config
const { dateConfig: flatpickrDateConfig } = useFlatpickrConfig()

const form = ref({
  customerId: '',
  inverterId: '',
  ticketType: '',
  priority: '',
  title: '',
  description: '',
  attachments: [] as File[],
  attachmentPreviews: [] as string[], // Base64 previews for images
})

const allInverters = ref<any[]>([])
const filteredInverters = ref<any[]>([])
const selectedInverter = ref<any>(null)
const selectedInverterDetails = ref<any>(null)
const selectedCustomerDetails = ref<any>(null)
const selectedCustomerIdForAssignment = ref<string>('')
const assigningCustomer = ref(false)
const editingInverterDetails = ref(false)
const savingInverterDetails = ref(false)
const editingCustomerDetails = ref(false)
const savingCustomerDetails = ref(false)
const customerSearchQuery = ref<string>('')
const showCustomerDropdown = ref<boolean>(false)
const filteredCustomers = ref<any[]>([])
const inverterDetailsForm = ref({
  serial_number: '',
  model: '',
  type: '',
  power_rating: '',
  warranty_start_date: '',
  warranty_end_date: '',
  installation_address: '',
})
const customerDetailsForm = ref({
  name: '',
  email: '',
  phone: '',
  address: '',
  customer_id: null as number | null,
})
const modelFilter = ref<string>('')
const serialNumberSearch = ref<string>('')
const showSerialDropdown = ref<boolean>(false)
const filteredSerialNumbers = ref<any[]>([])
const isSubmitting = ref(false)
const error = ref<string | null>(null)
const isDragging = ref(false)
const compressingImages = ref(false)
const loadingInverters = ref(false)
const customers = ref<any[]>([])
const loadingCustomers = ref(false)
const showNewInverterModal = ref(false)
const creatingInverter = ref(false)

const newInverterForm = ref({
  serial_number: '',
  model: '',
  installation_address: '',
})

const availableModels = ref<any[]>([])
const newModelName = ref<string>('')
const loadingModels = ref(false)
const modelSearchQuery = ref<string>('')
const showModelDropdown = ref<boolean>(false)

const ticketTypeOptions = computed(() => [
  { value: '', label: t('tickets.new.ticketInfo.typePlaceholder') },
  { value: 'warranty', label: t('tickets.new.ticketInfo.types.warranty') },
  { value: 'technicalSupport', label: t('tickets.new.ticketInfo.types.technicalSupport') },
  { value: 'productConsultation', label: t('tickets.new.ticketInfo.types.productConsultation') },
  { value: 'other', label: t('tickets.new.ticketInfo.types.other') },
])

const priorityOptions = computed(() => [
  { value: '', label: t('tickets.new.ticketInfo.priorityPlaceholder') },
  { value: 'urgent', label: t('tickets.new.ticketInfo.priorities.urgent', { n: slaHours.value.urgent }) },
  { value: 'high', label: t('tickets.new.ticketInfo.priorities.high', { n: slaHours.value.high }) },
  { value: 'medium', label: t('tickets.new.ticketInfo.priorities.medium', { n: slaHours.value.medium }) },
  { value: 'low', label: t('tickets.new.ticketInfo.priorities.low', { n: slaHours.value.low }) },
])

const deviceTypeOptions = computed(() => [
  { value: '', label: t('tickets.new.modal.typePlaceholder') },
  { value: 'Hòa lưới', label: t('tickets.new.modal.types.grid') },
  { value: 'Hybrid', label: t('tickets.new.modal.types.hybrid') },
  { value: 'Logger', label: t('tickets.new.modal.types.logger') },
  { value: 'Meter', label: t('tickets.new.modal.types.meter') },
  { value: 'BESS', label: t('tickets.new.modal.types.bess') },
  { value: 'Khác', label: t('tickets.new.modal.types.other') },
])

// Auto-fill customer info for END_USER
const customerInfo = computed(() => {
  if (isEndUser.value && currentUser.value) {
    return {
      id: currentUser.value.id,
      name: currentUser.value.name,
      email: currentUser.value.email,
      phone: currentUser.value.phone || '',
    }
  }
  return null
})

// Computed: Get unique models from inverters
const uniqueModels = computed(() => {
  const models = new Set<string>()
  allInverters.value.forEach((inv) => {
    if (inv.model) {
      models.add(inv.model)
    }
  })
  return Array.from(models).sort()
})

// Load data on mount
onMounted(async () => {
  await loadAllInverters()
  await loadModels()
  if (!isEndUser.value) {
    await loadCustomers()
  }
})

const loadModels = async () => {
  loadingModels.value = true
  try {
    const response = await apiClient.get('/models?status=active')
    if (response.error) {
      throw new Error(response.error)
    }
    availableModels.value = Array.isArray(response.data) ? response.data : []
  } catch (err) {
    console.error('Error loading models:', err)
  } finally {
    loadingModels.value = false
  }
}

const filteredModels = computed(() => {
  if (!modelSearchQuery.value) {
    return availableModels.value.filter(m => m.status === 'active')
  }
  const query = modelSearchQuery.value.toLowerCase()
  return availableModels.value.filter(
    (model) =>
      model.status === 'active' &&
      (model.name?.toLowerCase().includes(query) ||
        model.manufacturer?.toLowerCase().includes(query) ||
        model.type?.toLowerCase().includes(query))
  )
})

const selectModel = (model: any) => {
  newInverterForm.value.model = model.name
  modelSearchQuery.value = model.name
  showModelDropdown.value = false
    newModelName.value = ''
}

const selectNewModel = () => {
  newInverterForm.value.model = '__NEW__'
  modelSearchQuery.value = ''
  showModelDropdown.value = false
  newModelName.value = ''
}

const closeNewInverterModal = () => {
  showNewInverterModal.value = false
  // Reset form and search
  modelSearchQuery.value = ''
  showModelDropdown.value = false
  newInverterForm.value = {
    serial_number: '',
    model: '',
    installation_address: '',
    }
    newModelName.value = ''
  }

const onModelSelected = () => {
  if (newInverterForm.value.model === '__NEW__') {
    newModelName.value = ''
    return
  }
  newModelName.value = ''
}

const loadAllInverters = async () => {
  loadingInverters.value = true
  try {
    // Backend will automatically filter by user for END_USER
    const response = await apiClient.get('/inverters?limit=1000')
    if (response.error) {
      throw new Error(response.error)
    }
    const data = response.data as any
    allInverters.value = Array.isArray(data) ? data : (data?.data || [])
    filteredInverters.value = allInverters.value
  } catch (err) {
    console.error('Error loading inverters:', err)
    error.value = t('tickets.new.messages.loadDevicesError')
  } finally {
    loadingInverters.value = false
  }
}

const loadCustomers = async () => {
  loadingCustomers.value = true
  try {
    const response = await apiClient.get('/customers?limit=1000')
    if (response.error) {
      throw new Error(response.error)
    }
    const data = response.data as any
    customers.value = Array.isArray(data) ? data : (data?.data || [])
    // Initialize filtered customers
    filteredCustomers.value = customers.value
  } catch (err) {
    console.error('Error loading customers:', err)
  } finally {
    loadingCustomers.value = false
  }
}

const createNewInverter = async () => {
  if (!newInverterForm.value.serial_number) {
    error.value = t('tickets.new.messages.serialRequired')
    return
  }

  let finalModel = newInverterForm.value.model

  // If user selected "Create new model", create it first
  if (newInverterForm.value.model === '__NEW__') {
    if (!newModelName.value.trim()) {
      error.value = t('tickets.new.messages.newModelNameRequired')
      return
    }

    creatingInverter.value = true
    error.value = null

    try {
      // Create new model
      const modelResponse = await apiClient.post('/models', {
        name: newModelName.value.trim(),
        manufacturer: 'Growatt',
        type: null, // Type will be set based on model selection
      })

      if (modelResponse.error) {
        throw new Error(modelResponse.error)
      }

      const newModel = modelResponse.data as any
      finalModel = newModel.name

      // Reload models list
      await loadModels()
    } catch (err) {
      console.error('Error creating model:', err)
      error.value = err instanceof Error ? err.message : t('tickets.new.messages.createModelError')
      creatingInverter.value = false
      return
    }
  }

  if (!finalModel) {
    error.value = t('tickets.new.messages.modelRequired')
    return
  }

  creatingInverter.value = true
  error.value = null

  try {
    const inverterData: any = {
      serial_number: newInverterForm.value.serial_number,
      model: finalModel,
      installation_address: newInverterForm.value.installation_address || null,
    }
    
    // Get type from selected model if available
    const selectedModel = availableModels.value.find(m => m.name === finalModel)
    if (selectedModel?.type) {
      inverterData.type = selectedModel.type
    }

    // For non-END_USER: link to selected customer
    if (!isEndUser.value && form.value.customerId) {
      inverterData.customer_id = parseInt(form.value.customerId)
    }
    // For END_USER: backend will auto-link to user's customer record

    const response = await apiClient.post('/inverters', inverterData)
    if (response.error) {
      throw new Error(response.error)
    }

    // Reload inverters list
    await loadAllInverters()

    // Auto-select the newly created inverter
    const newInverter = response.data as any
    if (newInverter) {
      form.value.inverterId = newInverter.id.toString()
      serialNumberSearch.value = newInverter.serial_number || serialNumberSearch.value
      await loadAllInverters() // Reload to include the new inverter
      await onInverterSelected()
    }

    // Close modal and reset form
    closeNewInverterModal()
  } catch (err) {
    console.error('Error creating inverter:', err)
    error.value = err instanceof Error ? err.message : t('tickets.new.messages.createDeviceError')
  } finally {
    creatingInverter.value = false
  }
}

// Filter inverters by model
const filterInvertersByModel = () => {
  if (!modelFilter.value) {
    filteredInverters.value = allInverters.value
  } else {
    filteredInverters.value = allInverters.value.filter(
      (inv) => inv.model === modelFilter.value
    )
  }
  // Reset inverter selection if current selection is not in filtered list
  if (form.value.inverterId) {
    const isStillAvailable = filteredInverters.value.some(
      (inv) => inv.id === parseInt(form.value.inverterId)
    )
    if (!isStillAvailable) {
      form.value.inverterId = ''
      selectedInverter.value = null
      form.value.customerId = ''
    }
  }
}

// Handle inverter selection - Load full details from API
const onInverterSelected = async () => {
  if (!form.value.inverterId) {
    selectedInverter.value = null
    selectedInverterDetails.value = null
    selectedCustomerDetails.value = null
    form.value.customerId = ''
    return
  }

  const inverter = allInverters.value.find(
    (inv) => inv.id === parseInt(form.value.inverterId)
  )

  if (inverter) {
    selectedInverter.value = inverter
    
    // Load full inverter details from API
    try {
      const response = await apiClient.get(`/inverters/${inverter.id}`)
      if (response.error) {
        throw new Error(response.error)
      }
      selectedInverterDetails.value = response.data as any
      
      // Extract customer information from inverter details
      if (selectedInverterDetails.value?.customer_id) {
        form.value.customerId = selectedInverterDetails.value.customer_id.toString()
        
        // Load customer details
        selectedCustomerDetails.value = {
          customer_id: selectedInverterDetails.value.customer_id,
          name: selectedInverterDetails.value.customer_name || '',
          email: selectedInverterDetails.value.customer_email || '',
          phone: selectedInverterDetails.value.customer_phone || '',
          address: selectedInverterDetails.value.customer_address || '',
        }
      } else {
        // For END_USER: Auto-assign personal info to device if not assigned
        if (isEndUser.value && currentUser.value) {
          await autoAssignEndUserToInverter()
        } else {
          selectedCustomerDetails.value = null
          form.value.customerId = ''
        }
      }
      
    } catch (err) {
      console.error('Error loading inverter details:', err)
      error.value = t('tickets.new.messages.loadDetailsError')
    }
  }
}

// Format date helper

// Search serial number
const searchSerialNumber = () => {
  if (!serialNumberSearch.value.trim()) {
    filteredSerialNumbers.value = []
    return
  }
  const query = serialNumberSearch.value.toLowerCase().trim()
  filteredSerialNumbers.value = allInverters.value.filter(
    (inv) => inv.serial_number?.toLowerCase().includes(query)
  )
}

// Select inverter by serial number
const selectInverterBySerial = (inverter: any) => {
  form.value.inverterId = inverter.id.toString()
  serialNumberSearch.value = inverter.serial_number
  showSerialDropdown.value = false
  onInverterSelected()
}

// Handle blur events with delay
const handleSerialBlur = () => {
  setTimeout(() => {
    showSerialDropdown.value = false
  }, 200)
}

const handleCustomerBlur = () => {
  setTimeout(() => {
    showCustomerDropdown.value = false
  }, 200)
}

const handleModelBlur = () => {
  setTimeout(() => {
    showModelDropdown.value = false
  }, 200)
}

// Navigate to register device page
const navigateToRegisterDevice = () => {
  showSerialDropdown.value = false
  // Navigate to register device page, optionally with serial number as query param
  if (serialNumberSearch.value.trim()) {
    router.push({
      path: '/inverters/register',
      query: { serial: serialNumberSearch.value.trim() }
    })
  } else {
    router.push('/inverters/register')
  }
}

// Create new device from search (kept for backward compatibility)
const createNewDeviceFromSearch = () => {
  if (!serialNumberSearch.value.trim()) {
    return
  }
  // Pre-fill the new inverter form with the searched serial number
  newInverterForm.value.serial_number = serialNumberSearch.value.trim()
  showSerialDropdown.value = false
  showNewInverterModal.value = true
}

// Inverter details edit functions
const startEditInverterDetails = () => {
  if (!selectedInverterDetails.value) return
  
  inverterDetailsForm.value = {
    serial_number: selectedInverterDetails.value.serial_number || '',
    model: selectedInverterDetails.value.model || '',
    type: selectedInverterDetails.value.type || '',
    power_rating: selectedInverterDetails.value.power_rating || '',
    warranty_start_date: selectedInverterDetails.value.warranty_start_date 
      ? selectedInverterDetails.value.warranty_start_date.split('T')[0] 
      : '',
    warranty_end_date: selectedInverterDetails.value.warranty_end_date 
      ? selectedInverterDetails.value.warranty_end_date.split('T')[0] 
      : '',
    installation_address: selectedInverterDetails.value.installation_address || '',
  }
  editingInverterDetails.value = true
}

const cancelEditInverterDetails = () => {
  editingInverterDetails.value = false
  inverterDetailsForm.value = {
    serial_number: '',
    model: '',
    type: '',
    power_rating: '',
    warranty_start_date: '',
    warranty_end_date: '',
    installation_address: '',
  }
}

const saveInverterDetails = async () => {
  if (!selectedInverterDetails.value?.id) return
  
  savingInverterDetails.value = true
  error.value = null

  try {
    const updateData: any = {
      serial_number: inverterDetailsForm.value.serial_number,
      model: inverterDetailsForm.value.model,
      type: inverterDetailsForm.value.type || null,
      power_rating: inverterDetailsForm.value.power_rating || null,
      warranty_start_date: inverterDetailsForm.value.warranty_start_date || null,
      warranty_end_date: inverterDetailsForm.value.warranty_end_date || null,
      installation_address: inverterDetailsForm.value.installation_address || null,
    }

    const response = await apiClient.put(`/inverters/${selectedInverterDetails.value.id}`, updateData)
    if (response.error) {
      throw new Error(response.error)
    }

    // Reload inverter details
    await onInverterSelected()
    
    editingInverterDetails.value = false
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('tickets.new.messages.saveDeviceError')
    console.error('Error saving inverter details:', err)
  } finally {
    savingInverterDetails.value = false
  }
}

// Customer details edit functions
const startEditCustomerDetails = () => {
  if (!selectedCustomerDetails.value) return
  
  customerDetailsForm.value = {
    customer_id: selectedCustomerDetails.value.customer_id,
    name: '',
    email: '',
    phone: '',
    address: '',
  }
  // Set search query to current customer name if exists
  if (selectedCustomerDetails.value.customer_id) {
    const currentCustomer = customers.value.find(c => c.id === selectedCustomerDetails.value.customer_id)
    if (currentCustomer) {
      customerSearchQuery.value = currentCustomer.name
    }
  }
  editingCustomerDetails.value = true
}

const cancelEditCustomerDetails = () => {
  editingCustomerDetails.value = false
  customerSearchQuery.value = ''
  showCustomerDropdown.value = false
  customerDetailsForm.value = {
    name: '',
    email: '',
    phone: '',
    address: '',
    customer_id: null as number | null,
  }
}

// Search customer
const searchCustomer = () => {
  if (!customerSearchQuery.value.trim()) {
    filteredCustomers.value = customers.value
    return
  }
  const query = customerSearchQuery.value.toLowerCase().trim()
  filteredCustomers.value = customers.value.filter(
    (customer) =>
      customer.name?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query)
  )
}

// Select customer
const selectCustomer = (customer: any) => {
  customerDetailsForm.value.customer_id = customer.id
  customerSearchQuery.value = customer.name
  showCustomerDropdown.value = false
}

// Get selected customer name
const getSelectedCustomerName = () => {
  if (!customerDetailsForm.value.customer_id) return ''
  const customer = customers.value.find(c => c.id === customerDetailsForm.value.customer_id)
  return customer ? customer.name : ''
}

// Navigate to add customer page
const navigateToAddCustomer = () => {
  showCustomerDropdown.value = false
  router.push('/customers')
}

const saveCustomerDetails = async () => {
  if (!customerDetailsForm.value.customer_id) {
    error.value = t('tickets.new.messages.selectCustomerRequired')
    return
  }
  
  savingCustomerDetails.value = true
  error.value = null

  try {
    // Assign selected customer to inverter
    if (selectedInverterDetails.value?.id) {
    const updateData: any = {
        customer_id: customerDetailsForm.value.customer_id,
    }

      const response = await apiClient.put(`/inverters/${selectedInverterDetails.value.id}`, updateData)
    if (response.error) {
      throw new Error(response.error)
    }

    // Reload inverter details to refresh customer info
    await onInverterSelected()
    }
    
    editingCustomerDetails.value = false
    customerSearchQuery.value = ''
    showCustomerDropdown.value = false
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('tickets.new.messages.saveCustomerError')
    console.error('Error saving customer details:', err)
  } finally {
    savingCustomerDetails.value = false
  }
}

// Auto-assign END_USER personal info to inverter
const autoAssignEndUserToInverter = async () => {
  if (!isEndUser.value || !currentUser.value || !selectedInverterDetails.value?.id) return
  
  // If inverter already has customer, skip
  if (selectedInverterDetails.value?.customer_id) {
    // Load customer details if exists
    selectedCustomerDetails.value = {
      customer_id: selectedInverterDetails.value.customer_id,
      name: selectedInverterDetails.value.customer_name || '',
      email: selectedInverterDetails.value.customer_email || '',
      phone: selectedInverterDetails.value.customer_phone || '',
      address: selectedInverterDetails.value.customer_address || '',
    }
    form.value.customerId = selectedInverterDetails.value.customer_id.toString()
    return
  }
  
  try {
    // The backend will handle finding or creating customer record from user's email/phone
    const updateData: any = {
      customer_id: currentUser.value.id, // Send user ID, backend will resolve to customer
    }

    const response = await apiClient.put(`/inverters/${selectedInverterDetails.value.id}`, updateData)
    if (response.error) {
      throw new Error(response.error)
    }

    // Reload inverter details to refresh customer info (only once)
    const reloadResponse = await apiClient.get(`/inverters/${selectedInverterDetails.value.id}`)
    if (reloadResponse.error) {
      throw new Error(reloadResponse.error)
    }
    
    selectedInverterDetails.value = reloadResponse.data as any
    
    // Extract customer information from reloaded data
    if (selectedInverterDetails.value?.customer_id) {
      form.value.customerId = selectedInverterDetails.value.customer_id.toString()
      
      selectedCustomerDetails.value = {
        customer_id: selectedInverterDetails.value.customer_id,
        name: selectedInverterDetails.value.customer_name || currentUser.value.name || '',
        email: selectedInverterDetails.value.customer_email || currentUser.value.email || '',
        phone: selectedInverterDetails.value.customer_phone || currentUser.value.phone || '',
        address: selectedInverterDetails.value.customer_address || (currentUser.value as any).address || '',
      }
    }
  } catch (err) {
    console.error('Error auto-assigning END_USER to inverter:', err)
    // Don't show error to user, just log it
  }
}

// Assign customer to inverter
const assignCustomerToInverter = async () => {
  if (!selectedCustomerIdForAssignment.value || !selectedInverterDetails.value?.id) return
  
  assigningCustomer.value = true
  error.value = null

  try {
    const updateData: any = {
      customer_id: parseInt(selectedCustomerIdForAssignment.value),
    }

    const response = await apiClient.put(`/inverters/${selectedInverterDetails.value.id}`, updateData)
    if (response.error) {
      throw new Error(response.error)
    }

    // Reload inverter details to refresh customer info
    await onInverterSelected()
    
    // Clear selection
    selectedCustomerIdForAssignment.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('tickets.new.messages.assignCustomerError')
    console.error('Error assigning customer to inverter:', err)
  } finally {
    assigningCustomer.value = false
  }
}

// Compress image function
const compressImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.8): Promise<File> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
      } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

// Handle file upload
const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files || target.files.length === 0) return

  const files = Array.from(target.files)
  const imageFiles = files.filter((file) => file.type.startsWith('image/'))

  if (imageFiles.length === 0) {
    error.value = t('tickets.new.messages.onlyImagesAllowed')
    target.value = ''
    return
  }

  // Check if adding these files would exceed the limit
  const remainingSlots = 4 - form.value.attachments.length
  if (imageFiles.length > remainingSlots) {
    error.value = t('tickets.new.messages.maxImagesReached', { max: 4 })
    target.value = ''
    return
  }

  compressingImages.value = true
  try {
    for (const file of imageFiles.slice(0, remainingSlots)) {
      // Check file size (before compression)
      if (file.size > 10 * 1024 * 1024) {
        error.value = t('tickets.new.messages.fileTooLarge', { name: file.name })
        continue
      }

      // Compress image
      const compressedFile = await compressImage(file)
      
      // Create preview
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(compressedFile)
      })

      form.value.attachments.push(compressedFile)
      form.value.attachmentPreviews.push(preview)
    }
  } catch (err) {
    console.error('Error compressing images:', err)
    error.value = err instanceof Error ? err.message : t('tickets.new.messages.compressError')
  } finally {
    compressingImages.value = false
    target.value = ''
  }
}

// Handle drag and drop
const handleDrop = async (event: DragEvent) => {
  isDragging.value = false
  if (!event.dataTransfer?.files) return

  const files = Array.from(event.dataTransfer.files)
  const imageFiles = files.filter((file) => file.type.startsWith('image/'))

  if (imageFiles.length === 0) {
    error.value = t('tickets.new.messages.onlyImagesAllowed')
    return
  }

  // Check if adding these files would exceed the limit
  const remainingSlots = 4 - form.value.attachments.length
  if (imageFiles.length > remainingSlots) {
    error.value = t('tickets.new.messages.maxImagesReached', { max: 4 })
    return
  }

  compressingImages.value = true
  try {
    for (const file of imageFiles.slice(0, remainingSlots)) {
      // Check file size (before compression)
      if (file.size > 10 * 1024 * 1024) {
        error.value = t('tickets.new.messages.fileTooLarge', { name: file.name })
        continue
      }

      // Compress image
      const compressedFile = await compressImage(file)
      
      // Create preview
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(compressedFile)
      })

      form.value.attachments.push(compressedFile)
      form.value.attachmentPreviews.push(preview)
    }
  } catch (err) {
    console.error('Error compressing images:', err)
    error.value = err instanceof Error ? err.message : t('tickets.new.messages.compressError')
  } finally {
    compressingImages.value = false
  }
}

const removeFile = (index: number) => {
  form.value.attachments.splice(index, 1)
  form.value.attachmentPreviews.splice(index, 1)
}

const handleSubmit = async () => {
  if (!form.value.inverterId) {
    error.value = t('tickets.new.messages.selectDevice')
    return
  }

  if (!form.value.title || !form.value.description) {
    error.value = t('tickets.new.messages.fillRequired')
    return
  }

  // For non-END_USER: validate customer from inverter
  if (!isEndUser.value && !form.value.customerId && !selectedCustomerDetails.value?.customer_id) {
    error.value = t('tickets.new.messages.missingCustomer')
    return
  }

  isSubmitting.value = true
  error.value = null

  try {
    // Map form data to API format
    // Backend will auto-determine customer_id for END_USER
    const ticketData: any = {
      inverter_id: parseInt(form.value.inverterId),
      title: form.value.title,
      description: form.value.description,
      priority: (form.value.priority || 'medium') as 'urgent' | 'high' | 'medium' | 'low',
      category: form.value.ticketType || undefined,
    }

    // For non-END_USER: include customer_id from inverter details or form
    if (!isEndUser.value) {
      // Priority: customer from inverter details > customer from form
      if (selectedCustomerDetails.value?.customer_id) {
        ticketData.customer_id = selectedCustomerDetails.value.customer_id
      } else if (form.value.customerId) {
        ticketData.customer_id = parseInt(form.value.customerId)
      } else if (selectedInverterDetails.value?.customer_id) {
        ticketData.customer_id = selectedInverterDetails.value.customer_id
      }
    }
    // For END_USER: backend will auto-determine from user's customer record

    // Create ticket via API - server will set the timestamp
    const newTicket = await ticketService.createTicket(ticketData)

    // Upload attachments if any
    if (form.value.attachments && form.value.attachments.length > 0) {
      try {
        // Convert files to base64 and upload
        for (const file of form.value.attachments) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              // Remove data:image/...;base64, prefix if present
              const base64Data = result.includes(',') ? result.split(',')[1] : result
              resolve(base64Data)
            }
            reader.onerror = reject
            reader.readAsDataURL(file)
          })

          await ticketService.uploadAttachment(newTicket.id, {
            file: base64,
            filename: file.name,
            mime_type: file.type,
            file_size: file.size,
          })
        }
      } catch (err) {
        console.error('Error uploading attachments:', err)
        // Continue even if attachment upload fails
      }
    }

    // Success - redirect to ticket detail page to see the ticket with server timestamp
    router.push(`/tickets/${newTicket.id}`)
  } catch (err) {
    console.error('Error creating ticket:', err)
    error.value = err instanceof Error ? err.message : t('tickets.new.messages.createTicketError')
  } finally {
    isSubmitting.value = false
  }
}
</script>