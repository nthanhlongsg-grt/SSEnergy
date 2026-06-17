<template>
  <admin-layout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-start">
        <div>
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
                Ticket #{{ ticket?.ticket_number }}
              </h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                {{ ticket?.customer_name || 'N/A' }} - {{ ticket?.category || 'N/A' }}
              </p>
            </div>
          </div>
        </div>
        <div class="flex gap-2 items-center">
          <!-- Auto-refresh indicator -->
          <div v-if="isAutoRefreshing" class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mr-2">
            <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span class="hidden sm:inline">Đang cập nhật...</span>
          </div>
          <button
            v-if="canViewReport && isTicketClosed(ticket?.status)"
            @click="viewReport"
            class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{{ t('tickets.detail.header.viewReport') }}</span>
          </button>
          <button
            v-if="canUpdateStatus"
            @click="showStatusModal = true"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {{ t('tickets.detail.header.closeTicket') }}
          </button>
        </div>
      </div>

      <!-- Error Alert -->
      <div
        v-if="error"
        class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
      >
        <div class="flex items-center gap-2">
          <WarningIcon class="h-5 w-5 text-red-600 dark:text-red-400" />
          <p class="text-sm font-medium text-red-800 dark:text-red-200">
            {{ error }}
          </p>
        </div>
      </div>

      <!-- Alert if SLA overdue -->
      <div
        v-if="isSLAOverdue"
        class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
      >
        <div class="flex items-center gap-2">
          <WarningIcon class="h-5 w-5 text-red-600 dark:text-red-400" />
          <p class="text-sm font-medium text-red-800 dark:text-red-200">
            {{ t('tickets.detail.slaOverdue', { deadline: formatDateTime(ticket?.sla_deadline) }) }}
          </p>
        </div>
      </div>

      <!-- Top Section: 2x2 Grid of Info Cards -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <!-- Ticket Info -->
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
        >
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('tickets.detail.sections.ticketInfo') }}
            </h2>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.ticketCode') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white font-medium">
                #{{ ticket?.ticket_number }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.status') }}
              </label>
              <div class="mt-1">
                <span
                  :class="[
                    'px-2 py-1 text-xs font-semibold rounded-full',
                    getStatusClass(ticket?.status),
                  ]"
                >
                  {{ getStatusLabel(ticket?.status) }}
                </span>
              </div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.ticketType') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ getTicketTypeLabel(ticket?.category) || 'N/A' }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.priority') }}
              </label>
              <p class="mt-1">
                <span
                  :class="[
                    'px-2 py-1 text-xs font-semibold rounded-full',
                    getPriorityClass(ticket?.priority),
                  ]"
                >
                  {{ getPriorityLabel(ticket?.priority) }}
                </span>
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.createdAt') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ formatDateTime(ticket?.created_at) }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.lastUpdated') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ formatDateTime(ticket?.updated_at) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Customer Info -->
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
        >
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('tickets.detail.sections.customer') }}
            </h2>
          </div>
          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.name') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ ticket?.customer_name || 'N/A' }}
              </p>
            </div>
            <div v-if="ticket?.contract_number">
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.contractNumber') }}
              </label>
              <p class="mt-1">
                <router-link
                  v-if="ticket?.contract_id"
                  :to="contractDetailPath(ticket.contract_id)"
                  class="font-mono text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  @click.stop
                >
                  {{ ticket.contract_number }}
                </router-link>
                <span v-else class="font-mono text-sm text-gray-900 dark:text-white">
                  {{ ticket.contract_number }}
                </span>
              </p>
              <p
                v-if="ticket?.contract_title"
                class="mt-0.5 text-xs text-gray-500 dark:text-gray-400"
              >
                {{ ticket.contract_title }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.phone') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ ticket?.customer_phone || 'N/A' }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.email') }}
              </label>
              <p class="mt-1 text-sm text-gray-900 dark:text-white">
                {{ ticket?.customer_email || 'N/A' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Device Info -->
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
        >
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('tickets.detail.sections.deviceInfo') }}
            </h2>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.manufacturer') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white">{{ ticket?.inverter_manufacturer || '—' }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.model') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white">{{ ticket?.inverter_model || 'N/A' }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.serialNumber') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ ticket?.inverter_serial || 'N/A' }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.errorType') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white">{{ ticket?.category || 'N/A' }}</p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.warrantyExpiry') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ ticket?.inverter_warranty_end_date ? formatDateTime(ticket.inverter_warranty_end_date) : 'N/A' }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.warrantyStatus') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white">
                <span :class="getWarrantyStatusClass(ticket?.inverter_warranty_end_date)">
                  {{ getWarrantyStatusText(ticket?.inverter_warranty_end_date) }}
                </span>
              </p>
            </div>
          </div>
        </div>

        <!-- Assignee Info -->
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
        >
          <div class="flex justify-between items-start mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('tickets.detail.sections.assignee') }}
            </h2>
            <button
              v-if="canAssign"
              @click="showAssignModal = true"
              class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {{ ticket?.assigned_to_name ? t('tickets.detail.actions.change') : t('tickets.detail.actions.assign') }}
            </button>
          </div>
          <div v-if="ticket?.assigned_to_name" class="space-y-3">
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.name') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ ticket.assigned_to_name }}
              </p>
            </div>
            <div v-if="ticket?.assigned_to_function">
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.function') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ getUserFunctionLabel(ticket.assigned_to_function) }}
              </p>
            </div>
          </div>
          <div v-else class="space-y-3">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ t('tickets.detail.status.unassigned') }}
            </p>
          </div>
        </div>

        <!-- Watchers Info -->
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
        >
          <div class="flex justify-between items-start mb-4">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('tickets.detail.sections.watchers') }}
            </h2>
            <button
              v-if="canEdit || canAssign"
              @click="openAddWatcherModal"
              class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              {{ t('tickets.detail.actions.addWatcher') }}
            </button>
          </div>
          <div v-if="watchers.length > 0" class="space-y-2">
            <div
              v-for="watcher in watchers"
              :key="watcher.id"
              class="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50"
            >
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <span class="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {{ watcher.user_name?.charAt(0).toUpperCase() || '?' }}
                  </span>
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ watcher.user_name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ getUserRoleLabel(watcher.user_role) }}
                  </p>
                </div>
              </div>
              <button
                v-if="canRemoveWatcher(watcher)"
                @click="removeWatcher(watcher.id)"
                class="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                :disabled="loadingWatchers"
                :title="t('tickets.detail.watchers.confirmRemove')"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div v-else class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            {{ t('tickets.detail.watchers.noWatchers') }}
          </div>
        </div>

        <!-- SLA Info -->
        <div
          class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
        >
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ t('tickets.detail.sections.sla') }}
          </h2>
          <div class="space-y-3">
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.responseWithin') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ getSLATime(ticket?.priority) }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.responseDeadline') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white">
                {{ formatDateTime(ticket?.sla_deadline) }}
              </p>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.fields.onsiteHandlingTime') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white">{{ t('tickets.detail.labels.onsiteHandlingTime') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Description - Full Width -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
      >
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ t('tickets.detail.sections.description') }}
        </h2>
        <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
          {{ ticket?.description }}
        </p>
      </div>

      <!-- Attachments - Full Width -->
      <div
        v-if="(ticketAttachments.length > 0) || (canViewReport && isTicketClosed(ticket?.status))"
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
      >
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ t('tickets.detail.sections.attachments') }}
        </h2>
        
        <!-- Report Button -->
        <div v-if="canViewReport && isTicketClosed(ticket?.status)" class="mb-4">
          <button
            @click="viewReport"
            class="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{{ t('tickets.detail.header.viewReport') }}</span>
          </button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="(file, index) in ticketAttachments"
            :key="index"
            class="relative group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            :class="isImageFile(file) ? 'cursor-pointer' : ''"
            @click="isImageFile(file) && openAttachmentImage(file)"
          >
            <!-- Image Preview -->
            <div v-if="isImageFile(file)" class="aspect-square bg-gray-100 dark:bg-gray-700 relative">
              <img
                :src="getAttachmentUrl(file)"
                :alt="file.filename || file.name"
                class="w-full h-full object-cover"
                @error="handleImageError"
                loading="lazy"
              />
              <div v-if="!getAttachmentUrl(file)" class="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                Không thể tải hình ảnh
              </div>
            </div>
            <!-- File Icon -->
            <div v-else class="p-4 bg-gray-50 dark:bg-gray-700">
              <div class="flex items-center gap-2">
                <svg
                  class="w-8 h-8 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {{ file.filename || file.name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ formatFileSize(file.file_size || file.size || 0) }}
                  </p>
                </div>
              </div>
            </div>
            <!-- File Name Overlay for Images -->
            <div
              v-if="isImageFile(file)"
              class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2"
            >
              <p class="text-xs text-white truncate">
                {{ file.filename || file.name }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Comments/Activity Log -->
        <div class="space-y-6">
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('tickets.detail.sections.activityLog') }}
            </h2>
            <div class="space-y-0">
              <div
                v-for="(activity, index) in nonInternalActivities"
                :key="index"
                :class="[
                  'flex gap-4 p-4 border-b border-gray-200 dark:border-gray-700 last:border-0',
                  index % 2 === 0 
                    ? 'bg-white dark:bg-gray-800' 
                    : 'bg-gray-50 dark:bg-gray-700/50'
                ]"
              >
                <div class="flex-shrink-0">
                  <div
                    :class="[
                      'h-10 w-10 rounded-full flex items-center justify-center',
                      activity.isSystem 
                        ? 'bg-gray-100 dark:bg-gray-700' 
                        : 'bg-blue-100 dark:bg-blue-900'
                    ]"
                  >
                    <span 
                      :class="[
                        'text-sm font-bold',
                        activity.isSystem 
                          ? 'text-gray-600 dark:text-gray-400' 
                          : 'text-blue-600 dark:text-blue-400'
                      ]"
                    >
                      {{ activity.isSystem ? '🤖' : activity.user.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p 
                      :class="[
                        'text-sm font-medium',
                        activity.isSystem 
                          ? 'text-gray-600 dark:text-gray-400 italic' 
                          : 'text-gray-900 dark:text-white'
                      ]"
                    >
                      {{ activity.isSystem ? t('tickets.detail.status.system') : activity.user }}
                    </p>
                    <span 
                      v-if="activity.isInternal"
                      class="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                    >
                      {{ t('tickets.detail.actions.internalCommentBadge') || 'Nội bộ' }}
                    </span>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDateTime(activity.timestamp) }}
                    </p>
                  </div>
                  <!-- Edit mode (only for non-system comments with valid commentId) -->
                  <div v-if="!activity.isSystem && activity.commentId && editingComment?.commentId === activity.commentId" class="mt-1">
                    <textarea
                      v-model="editingCommentText"
                      rows="3"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    ></textarea>
                    <div class="mt-2 flex gap-2">
                      <button
                        @click="saveEditedComment"
                        class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Lưu
                      </button>
                      <button
                        @click="cancelEdit"
                        class="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                  <!-- Display mode: ẩn text marker khi chỉ là thông báo đính kèm ảnh -->
                  <p 
                    v-else-if="getCommentText(activity.action).trim()"
                    :class="[
                      'text-sm mt-1',
                      activity.isSystem 
                        ? 'text-gray-700 dark:text-gray-300 italic whitespace-pre-wrap' 
                        : 'text-gray-700 dark:text-gray-300 whitespace-pre-wrap'
                    ]"
                  >
                    {{ getCommentText(activity.action) }}
                  </p>
                  
                  <!-- Inline images -->
                  <div v-if="activity.images && activity.images.length > 0" class="mt-2 flex flex-wrap gap-2">
                    <div
                      v-for="(imageSrc, imgIndex) in activity.images"
                      :key="imgIndex"
                      :class="[
                        'relative group overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer',
                        activity.images.length === 1 ? 'max-w-xs w-full' : 'w-[calc(50%-4px)]'
                      ]"
                      @click="openImageFromComment(imageSrc)"
                    >
                      <img 
                        :src="imageSrc"
                        alt="Comment image"
                        class="w-full object-cover hover:opacity-90 transition-opacity"
                        :class="activity.images.length === 1 ? 'max-h-64' : 'h-36'"
                      />
                      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <svg class="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Edit/Delete buttons for user's own comments (only for TECHNICIAN, ADMIN, DEV) -->
                  <div 
                    v-if="!activity.isSystem && activity.commentId && activity.userId === currentUser?.id && (hasRole(UserRole.TECHNICIAN) || hasRole(UserRole.ADMIN) || hasRole(UserRole.DEV))" 
                    class="mt-2 flex gap-2"
                  >
                    <button
                      @click="editComment(activity)"
                      class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Chỉnh sửa
                    </button>
                    <button
                      @click="deleteComment(activity)"
                      class="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Thu hồi
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Add Comment -->
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div class="relative">
                <textarea
                  ref="commentTextarea"
                  v-model="newComment"
                  rows="3"
                  :placeholder="t('tickets.detail.actions.commentPlaceholder')"
                  class="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  @paste="handleCommentPaste"
                ></textarea>
                
                <!-- Image Upload Button - Icon only, positioned at top-right of textarea -->
                <div class="absolute top-2 right-2">
                  <input
                    ref="commentImageInput"
                    type="file"
                    multiple
                    accept="image/*"
                    @change="handleCommentImageSelect"
                    class="hidden"
                    id="comment-image-upload"
                  />
                  <label
                    for="comment-image-upload"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                    :title="t('tickets.detail.actions.attachImage')"
                  >
                    <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </label>
                </div>
              </div>
              
              <!-- Image Previews -->
              <div v-if="commentImagePreviews.length > 0" class="mt-3 grid grid-cols-4 gap-2">
                <div
                  v-for="(preview, index) in commentImagePreviews"
                  :key="index"
                  class="relative group"
                >
                  <img :src="preview" alt="Preview" class="w-full h-20 object-cover rounded border border-gray-300 dark:border-gray-600" />
                  <button
                    @click="removeCommentImage(index)"
                    class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    type="button"
                    :title="t('tickets.detail.statusModal.removeImage')"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <button
                @click="addComment"
                :disabled="!newComment.trim() && commentImageFiles.length === 0"
                class="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ addingComment ? t('tickets.detail.actions.addingComment') : t('tickets.detail.actions.addComment') }}
              </button>
              
              <!-- Quick Comment Buttons (Only for Technical and Admin) - Below Add Comment button -->
              <div v-if="canUseQuickComments" class="mt-2">
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="(quickComment, index) in quickComments"
                    :key="index"
                    @click="useQuickComment(quickComment)"
                    class="px-2 py-1 text-xs italic opacity-60 hover:opacity-80 text-gray-500 dark:text-gray-400 border-0 bg-transparent hover:underline transition-opacity cursor-pointer"
                  >
                    {{ quickComment }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Internal Comment -->
        <div class="space-y-6">
          <div
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('tickets.detail.sections.internalComment') }}
            </h2>
            <div class="space-y-0">
              <div
                v-if="internalActivities.length === 0"
                class="text-center py-8 text-gray-500 dark:text-gray-400"
              >
                {{ t('common.na') }}
              </div>
              <div
                v-for="(activity, index) in internalActivities"
                :key="index"
                :class="[
                  'flex gap-4 p-4 border-b border-gray-200 dark:border-gray-700 last:border-0',
                  index % 2 === 0 
                    ? 'bg-white dark:bg-gray-800' 
                    : 'bg-gray-50 dark:bg-gray-700/50'
                ]"
              >
                <div class="flex-shrink-0">
                  <div
                    :class="[
                      'h-10 w-10 rounded-full flex items-center justify-center',
                      activity.isSystem 
                        ? 'bg-gray-100 dark:bg-gray-700' 
                        : 'bg-orange-100 dark:bg-orange-900'
                    ]"
                  >
                    <span 
                      :class="[
                        'text-sm font-bold',
                        activity.isSystem 
                          ? 'text-gray-600 dark:text-gray-400' 
                          : 'text-orange-600 dark:text-orange-400'
                      ]"
                    >
                      {{ activity.isSystem ? '🤖' : activity.user.charAt(0).toUpperCase() }}
                    </span>
                  </div>
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p 
                      :class="[
                        'text-sm font-medium',
                        activity.isSystem 
                          ? 'text-gray-600 dark:text-gray-400 italic' 
                          : 'text-gray-900 dark:text-white'
                      ]"
                    >
                      {{ activity.isSystem ? t('tickets.detail.status.system') : activity.user }}
                    </p>
                    <span 
                      class="px-2 py-0.5 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
                    >
                      {{ t('tickets.detail.actions.internalCommentBadge') || 'Nội bộ' }}
                    </span>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ formatDateTime(activity.timestamp) }}
                    </p>
                  </div>
                  <!-- Edit mode (only for non-system comments with valid commentId) -->
                  <div v-if="!activity.isSystem && activity.commentId && editingComment?.commentId === activity.commentId" class="mt-1">
                    <textarea
                      v-model="editingCommentText"
                      rows="3"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm"
                    ></textarea>
                    <div class="mt-2 flex gap-2">
                      <button
                        @click="saveEditedComment"
                        class="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Lưu
                      </button>
                      <button
                        @click="cancelEdit"
                        class="px-3 py-1 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                  <!-- Display mode: ẩn text marker khi chỉ là thông báo đính kèm ảnh -->
                  <p 
                    v-else-if="getCommentText(activity.action).trim()"
                    :class="[
                      'text-sm mt-1',
                      activity.isSystem 
                        ? 'text-gray-700 dark:text-gray-300 italic whitespace-pre-wrap' 
                        : 'text-gray-700 dark:text-gray-300 whitespace-pre-wrap'
                    ]"
                  >
                    {{ getCommentText(activity.action) }}
                  </p>
                  
                  <!-- Inline images -->
                  <div v-if="activity.images && activity.images.length > 0" class="mt-2 flex flex-wrap gap-2">
                    <div
                      v-for="(imageSrc, imgIndex) in activity.images"
                      :key="imgIndex"
                      :class="[
                        'relative group overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer',
                        activity.images.length === 1 ? 'max-w-xs w-full' : 'w-[calc(50%-4px)]'
                      ]"
                      @click="openImageFromComment(imageSrc)"
                    >
                      <img 
                        :src="imageSrc"
                        alt="Comment image"
                        class="w-full object-cover hover:opacity-90 transition-opacity"
                        :class="activity.images.length === 1 ? 'max-h-64' : 'h-36'"
                      />
                      <div class="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <svg class="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Edit/Delete buttons for user's own comments (only for TECHNICIAN, ADMIN, DEV) -->
                  <div 
                    v-if="!activity.isSystem && activity.commentId && activity.userId === currentUser?.id && (hasRole(UserRole.TECHNICIAN) || hasRole(UserRole.ADMIN) || hasRole(UserRole.DEV))" 
                    class="mt-2 flex gap-2"
                  >
                    <button
                      @click="editComment(activity)"
                      class="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Chỉnh sửa
                    </button>
                    <button
                      @click="deleteComment(activity)"
                      class="text-xs text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Thu hồi
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Add Internal Comment -->
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div class="relative">
                <textarea
                  ref="internalCommentTextarea"
                  v-model="newInternalComment"
                  rows="3"
                  :placeholder="t('tickets.detail.actions.commentPlaceholder')"
                  class="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:text-white"
                  @paste="handleInternalCommentPaste"
                ></textarea>
                
                <!-- Image Upload Button - Icon only, positioned at top-right of textarea -->
                <div class="absolute top-2 right-2">
                  <input
                    ref="internalCommentImageInput"
                    type="file"
                    multiple
                    accept="image/*"
                    @change="handleInternalCommentImageSelect"
                    class="hidden"
                    id="internal-comment-image-upload"
                  />
                  <label
                    for="internal-comment-image-upload"
                    class="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                    :title="t('tickets.detail.actions.attachImage')"
                  >
                    <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </label>
                </div>
              </div>
              
              <!-- Image Previews -->
              <div v-if="internalCommentImagePreviews.length > 0" class="mt-3 grid grid-cols-4 gap-2">
                <div
                  v-for="(preview, index) in internalCommentImagePreviews"
                  :key="index"
                  class="relative group"
                >
                  <img :src="preview" alt="Preview" class="w-full h-20 object-cover rounded border border-gray-300 dark:border-gray-600" />
                  <button
                    @click="removeInternalCommentImage(index)"
                    class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    type="button"
                    :title="t('tickets.detail.statusModal.removeImage')"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              <button
                @click="addInternalComment"
                :disabled="!newInternalComment.trim() && internalCommentImageFiles.length === 0"
                class="mt-3 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ addingInternalComment ? t('tickets.detail.actions.addingComment') : t('tickets.detail.actions.addInternalComment') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Assign Technician Modal -->
      <div
        v-if="showAssignModal"
        class="fixed inset-0 bg-gray-700/45 dark:bg-gray-900/65 flex items-center justify-center z-50"
        @click.self="showAssignModal = false"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {{ ticket?.assigned_to_name ? t('tickets.detail.assignModal.changeTitle') : t('tickets.detail.assignModal.title') }}
            </h3>

            <div v-if="ticket?.assigned_to_name" class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p class="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-1">
                {{ t('tickets.detail.assignModal.currentAssignee') }}
              </p>
              <p class="text-sm text-yellow-800 dark:text-yellow-300">
                {{ ticket.assigned_to_name }}
              </p>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ ticket?.assigned_to_name ? t('tickets.detail.assignModal.selectNewAssignee') : t('tickets.detail.assignModal.selectAssignee') }}
              </label>
              <select
                v-model="selectedTechnicianId"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :disabled="loadingTechnicians || assigning"
              >
                <option value="">{{ t('tickets.detail.assignModal.selectAssigneePlaceholder') }}</option>
                <option
                  v-for="tech in technicians"
                  :key="tech.id"
                  :value="tech.id"
                >
                  {{ tech.name }} ({{ getUserRoleLabel(tech.role) }}{{ tech.code ? ' • ' + tech.code : '' }})
                </option>
              </select>
              <p v-if="loadingTechnicians" class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                {{ t('tickets.detail.assignModal.loadingTechnicians') }}
              </p>
            </div>

            <div v-if="selectedTechnicianId && selectedTechnician" class="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p class="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                {{ t('tickets.detail.assignModal.assigneeInfo') }}
              </p>
              <p class="text-sm text-blue-800 dark:text-blue-300">
                {{ t('tickets.detail.fields.emailLabel') }} {{ selectedTechnician.email || 'N/A' }}
              </p>
              <p class="text-sm text-blue-800 dark:text-blue-300">
                {{ t('tickets.detail.fields.phoneLabel') }} {{ selectedTechnician.phone || 'N/A' }}
              </p>
              <p class="text-sm text-blue-800 dark:text-blue-300">
                {{ t('tickets.detail.fields.roleLabel') }} {{ getUserRoleLabel(selectedTechnician.role) }}
              </p>
            </div>

            <div class="flex gap-3 justify-end">
              <button
                @click="showAssignModal = false"
                :disabled="assigning"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {{ t('tickets.detail.assignModal.cancel') }}
              </button>
              <button
                @click="assignTechnician"
                :disabled="!selectedTechnicianId || assigning"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ assigning ? t('tickets.detail.assignModal.selecting') : t('tickets.detail.assignModal.assign') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Update Status Modal -->
      <div
        v-if="showStatusModal"
        class="fixed inset-0 bg-gray-700/45 dark:bg-gray-900/65 flex items-start justify-center z-50 overflow-y-auto pt-20 pb-8"
        @click.self="showStatusModal = false"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full mx-4 my-4 flex flex-col max-h-[85vh]">
          <!-- Header -->
          <div class="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('tickets.detail.statusModal.title') }}
            </h3>
          </div>
          
          <!-- Scrollable Content -->
          <div class="p-6 overflow-y-auto flex-1 min-h-0">
            <!-- Status Selection -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('tickets.detail.statusModal.newStatus') }}
              </label>
              <select
                v-model="selectedStatus"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :disabled="updatingStatus"
              >
                <option
                  v-for="option in statusOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </option>
              </select>
            </div>

            <!-- Service Report Form - Show when status is closed -->
            <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
              <h4 class="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {{ t('tickets.detail.statusModal.serviceReport') }}
              </h4>

              <!-- Basic Information Section -->
              <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{{ t('tickets.detail.statusModal.basicInfo') }}</h5>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {{ t('tickets.detail.statusModal.startDate') }} <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                      <flat-pickr
                        v-model="serviceReportForm.service_date"
                        :config="flatpickrDateConfig"
                        class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        :disabled="updatingStatus"
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
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {{ t('tickets.detail.statusModal.endDate') }}
                    </label>
                    <div class="relative">
                      <flat-pickr
                        v-model="serviceReportForm.completion_date"
                        :config="flatpickrDateConfig"
                        class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                        :disabled="updatingStatus"
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
              </div>

              <!-- Service Details Section -->
              <div class="mb-6 space-y-4">
                <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{{ t('tickets.detail.statusModal.serviceDetails') }}</h5>
                
                <!-- Diagnosis -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('tickets.detail.statusModal.diagnosis') }}
                  </label>
                  <textarea
                    v-model="serviceReportForm.diagnosis"
                    rows="2"
                    :placeholder="t('tickets.detail.statusModal.diagnosisPlaceholder')"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
                    :disabled="updatingStatus"
                  ></textarea>
                </div>

                <!-- Actions Taken -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('tickets.detail.statusModal.actionsTaken') }}
                  </label>
                  <textarea
                    v-model="serviceReportForm.actions_taken"
                    rows="2"
                    :placeholder="t('tickets.detail.statusModal.actionsTakenPlaceholder')"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white resize-none"
                    :disabled="updatingStatus"
                  ></textarea>
                </div>

                <!-- Replacement Parts -->
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {{ t('tickets.detail.statusModal.replacementParts') }}
                    </label>
                    <button
                      type="button"
                      @click="addReplacementPartRow"
                      class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      :disabled="updatingStatus"
                    >
                      + {{ t('tickets.detail.statusModal.addReplacementPart') }}
                    </button>
                  </div>
                  <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                    <table class="w-full text-sm min-w-[520px]">
                      <thead class="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                          <th class="px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 w-10">STT</th>
                          <th class="px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.detail.statusModal.partMaterial') }}</th>
                          <th class="px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 w-20">{{ t('tickets.detail.statusModal.partUnit') }}</th>
                          <th class="px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 w-20">{{ t('tickets.detail.statusModal.partQuantity') }}</th>
                          <th class="px-2 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">{{ t('tickets.detail.statusModal.partNotes') }}</th>
                          <th class="px-2 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                        <tr v-for="(row, idx) in replacementPartRows" :key="idx">
                          <td class="px-2 py-1.5 text-center text-gray-500 dark:text-gray-400">{{ idx + 1 }}</td>
                          <td class="px-2 py-1.5">
                            <input
                              v-model="row.material"
                              type="text"
                              :placeholder="t('tickets.detail.statusModal.partMaterialPlaceholder')"
                              class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                              :disabled="updatingStatus"
                            />
                          </td>
                          <td class="px-2 py-1.5">
                            <input
                              v-model="row.unit"
                              type="text"
                              :placeholder="t('tickets.detail.statusModal.partUnitPlaceholder')"
                              class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                              :disabled="updatingStatus"
                            />
                          </td>
                          <td class="px-2 py-1.5">
                            <input
                              v-model.number="row.quantity"
                              type="number"
                              min="0"
                              step="1"
                              class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                              :disabled="updatingStatus"
                            />
                          </td>
                          <td class="px-2 py-1.5">
                            <input
                              v-model="row.notes"
                              type="text"
                              :placeholder="t('tickets.detail.statusModal.partNotesPlaceholder')"
                              class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                              :disabled="updatingStatus"
                            />
                          </td>
                          <td class="px-2 py-1.5 text-center">
                            <button
                              v-if="replacementPartRows.length > 1"
                              type="button"
                              @click="removeReplacementPartRow(idx)"
                              class="p-1 text-red-500 hover:text-red-700"
                              :disabled="updatingStatus"
                              title="Xóa dòng"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <!-- Images Section -->
              <div class="mb-6">
                <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">{{ t('tickets.detail.statusModal.images') }}</h5>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Before Images -->
                  <div
                    ref="beforeImagesZoneRef"
                    class="outline-none focus-within:ring-2 focus-within:ring-blue-400 rounded-lg p-1 -m-1"
                    tabindex="0"
                    @click="focusBeforeImagesZone"
                    @paste="handleBeforeImagesPaste"
                  >
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {{ t('tickets.detail.statusModal.beforeRepair') }}
                    </label>
                    <input
                      ref="beforeImagesInput"
                      type="file"
                      multiple
                      accept="image/*"
                      @change="handleBeforeImagesSelect"
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-200"
                      :disabled="updatingStatus"
                    />
                    <div v-if="beforeImagePreviews.length > 0" class="mt-2 grid grid-cols-4 gap-2">
                      <div v-for="(preview, index) in beforeImagePreviews" :key="index" class="relative group">
                        <img :src="preview" alt="Before" class="w-full h-20 object-cover rounded border border-gray-300 dark:border-gray-600" />
                        <button
                          @click="removeBeforeImage(index)"
                          class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          type="button"
                          :title="t('tickets.detail.statusModal.removeImage')"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <p v-else class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ t('tickets.detail.statusModal.noImages') }}</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ t('common.imageUpload.pasteHint') }}</p>
                  </div>

                  <!-- After Images -->
                  <div
                    ref="afterImagesZoneRef"
                    class="outline-none focus-within:ring-2 focus-within:ring-blue-400 rounded-lg p-1 -m-1"
                    tabindex="0"
                    @click="focusAfterImagesZone"
                    @paste="handleAfterImagesPaste"
                  >
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {{ t('tickets.detail.statusModal.afterRepair') }}
                    </label>
                    <input
                      ref="afterImagesInput"
                      type="file"
                      multiple
                      accept="image/*"
                      @change="handleAfterImagesSelect"
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-700 dark:file:text-gray-200"
                      :disabled="updatingStatus"
                    />
                    <div v-if="afterImagePreviews.length > 0" class="mt-2 grid grid-cols-4 gap-2">
                      <div v-for="(preview, index) in afterImagePreviews" :key="index" class="relative group">
                        <img :src="preview" alt="After" class="w-full h-20 object-cover rounded border border-gray-300 dark:border-gray-600" />
                        <button
                          @click="removeAfterImage(index)"
                          class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          type="button"
                          :title="t('tickets.detail.statusModal.removeImage')"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <p v-else class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ t('tickets.detail.statusModal.noImages') }}</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ t('common.imageUpload.pasteHint') }}</p>
                  </div>
                </div>
              </div>

              <!-- Signatures Section -->
              <div class="mb-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                <h5 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">{{ t('tickets.detail.statusModal.signatures') }}</h5>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Assignee Signature -->
                  <div>
                    <h6 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      {{ t('tickets.detail.statusModal.assigneeSignature') || 'Chữ ký' }}
                    </h6>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      {{ t('tickets.detail.statusModal.responsiblePerson') || 'Người phụ trách' }}
                    </p>
                    <div class="border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-800">
                      <label class="flex items-start gap-2 mb-3 cursor-pointer">
                        <input
                          v-model="technicianSignatureAgreed"
                          type="checkbox"
                          @change="generateTechnicianSignature"
                          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-0.5"
                          :disabled="updatingStatus || !canSignTechnician"
                          required
                        />
                        <span class="text-sm text-gray-700 dark:text-gray-300">
                          {{ t('tickets.detail.statusModal.agreeAndConfirm') || 'Tôi đồng ý và xác nhận' }}
                        </span>
                      </label>
                      <p class="text-xs text-gray-500 dark:text-gray-400 ml-6">
                        {{ t('tickets.detail.statusModal.checkToSign') || 'Tích vào ô trên để tạo chữ ký' }}
                      </p>
                      <div
                        v-if="technicianSignatureAgreed && serviceReportForm.technician_signature"
                        class="mt-3 border border-gray-200 dark:border-gray-600 rounded-lg p-2 bg-gray-50 dark:bg-gray-900"
                      >
                        <img :src="serviceReportForm.technician_signature" :alt="t('tickets.detail.statusModal.assigneeSignatureAlt')" class="w-full h-auto object-contain max-h-40" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          
          <!-- Footer with buttons - Always visible -->
          <div class="p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div class="flex gap-3 justify-end">
              <button
                @click="closeStatusModal"
                :disabled="updatingStatus"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {{ t('tickets.detail.statusModal.cancel') }}
              </button>
              <button
                @click="updateTicketStatus"
                :disabled="!selectedStatus || updatingStatus || (selectedStatus === TicketStatus.CLOSED && !technicianSignatureAgreed)"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ updatingStatus ? t('tickets.detail.statusModal.updating') : t('tickets.detail.statusModal.update') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Image Modal for viewing full-size images -->
      <div
        v-if="showImageModal"
        class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
        @click="closeImageModal"
      >
        <div class="relative max-w-4xl max-h-[90vh] mx-4" @click.stop>
          <button
            @click="closeImageModal"
            class="absolute -top-10 right-0 text-white hover:text-gray-300 text-2xl font-bold z-10"
          >
            ×
          </button>
          <div 
            class="flex items-center justify-center"
            :class="isPngImage(selectedImageSrc) ? 'bg-white rounded-lg p-4' : ''"
          >
            <img 
              :src="selectedImageSrc" 
              alt="Full size image" 
              class="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Add Watcher Modal -->
    <div
      v-if="showAddWatcherModal"
      class="fixed inset-0 z-50 flex items-start justify-center bg-gray-700/45 dark:bg-gray-900/65 overflow-y-auto"
    >
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mt-20 mb-10 mx-4">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ t('tickets.detail.watchers.addWatcher') }}
            </h3>
            <button
              @click="showAddWatcherModal = false"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('tickets.detail.watchers.selectUser') }} ({{ selectedWatcherUserIds.length }} đã chọn)
            </label>
            <div class="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 space-y-2">
              <div v-if="availableUsers.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                {{ t('tickets.detail.watchers.noUsersAvailable') || 'Không có người dùng nào khả dụng' }}
              </div>
              <label
                v-for="user in availableUsers"
                :key="user.id"
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                :class="{ 'bg-blue-50 dark:bg-blue-900/20': isUserSelected(user.id) }"
              >
                <input
                  type="checkbox"
                  :checked="isUserSelected(user.id)"
                  @change="toggleUserSelection(user.id)"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                  :disabled="addingWatcher"
                />
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span class="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {{ user.name?.charAt(0).toUpperCase() || '?' }}
                      </span>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ user.name }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        {{ getUserRoleLabel(user.role) }}
                      </p>
                    </div>
                  </div>
                </div>
              </label>
            </div>
            <p v-if="availableUsers.length === 0 && !addingWatcher" class="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {{ t('tickets.detail.watchers.loadingUsers') || 'Đang tải danh sách người dùng...' }}
            </p>
          </div>

          <div class="flex justify-end gap-2">
            <button
              @click="showAddWatcherModal = false"
              class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              :disabled="addingWatcher"
            >
              {{ t('common.cancel') }}
            </button>
            <button
              @click="addWatchers"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              :disabled="addingWatcher || selectedWatcherUserIds.length === 0"
            >
              <svg v-if="addingWatcher" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ addingWatcher ? t('common.adding') : t('common.add') }} ({{ selectedWatcherUserIds.length }})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { useChangeDetection } from '@/composables/useChangeDetection'
import { WarningIcon } from '../../../icons'
import { ticketService } from '@/services/ticketService'
import { useAuth, UserRole } from '@/composables/useAuth'
import { useSlaSettings } from '@/composables/useSlaSettings'
import { apiClient } from '@/services/api'
import { formatDateTime, formatDateForInput, formatDateTimeForInput } from '@/utils/dateTime'
import { emptyReplacementPartRow, serializeReplacementParts, type ReplacementPartRow } from '@/utils/replacementParts'
import { resolveAttachmentUrl, resolveCommentImageSrc, resolveReportUrl } from '@/utils/attachmentUrl'
import { POLL } from '@/utils/pollInterval'
import flatPickr from 'vue-flatpickr-component'
import 'flatpickr/dist/flatpickr.css'
import { useFlatpickrConfig } from '@/composables/useFlatpickr'
import { addFilesToImageList } from '@/utils/imageUpload'
import { useImagePaste } from '@/composables/useImagePaste'
import { useTicketStatus } from '@/composables/useTicketStatus'
import { isTicketClosed, TicketStatus } from '@/constants/ticketStatus'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { getStatusLabel, getStatusClass, statusOptions } = useTicketStatus()
const { getSlaHoursByPriority } = useSlaSettings()
const { hasRole, getUser } = useAuth()
const currentUser = getUser

const isStaffUser = computed(() => {
  const role = currentUser.value?.role
  return role !== UserRole.END_USER && role !== UserRole.DISTRIBUTOR
})

const contractDetailPath = (contractId: number) =>
  isStaffUser.value ? `/contracts/${contractId}` : `/customer/contracts/${contractId}`

const ticket = ref<any>(null)
const newComment = ref('')
const isInternalComment = ref(false)
const showStatusModal = ref(false)
const showAssignModal = ref(false)
const showAddWatcherModal = ref(false)
const watchers = ref<any[]>([])
const availableUsers = ref<any[]>([])
const selectedWatcherUserIds = ref<number[]>([])
const loadingWatchers = ref(false)
const addingWatcher = ref(false)
const loading = ref(false)
const addingComment = ref(false)
const editingComment = ref<any>(null)
const editingCommentText = ref('')
const deletingCommentId = ref<number | null>(null)
const assigning = ref(false)
const updatingStatus = ref(false)
const deleting = ref(false)
const showDeleteConfirm = ref(false)
const error = ref<string | null>(null)
const comments = ref<any[]>([])
const attachments = ref<any[]>([])

/** File đính kèm ticket (không gồm ảnh thuộc comment) */
const ticketAttachments = computed(() =>
  attachments.value.filter((file: any) => !file.comment_id)
)
const reportId = ref<string | null>(null)
const reportUrl = ref<string | null>(null)

const applyReportFromTicket = (ticketData: {
  report_url?: string | null
  id?: number
  status?: string
}) => {
  if (ticketData?.report_url) {
    reportUrl.value = ticketData.report_url
    return
  }
  if (ticketData?.id && isTicketClosed(ticketData.status ?? '')) {
    try {
      const savedReport = sessionStorage.getItem(`ticket_${ticketData.id}_report`)
      if (savedReport) {
        const saved = JSON.parse(savedReport) as { url?: string; reportId?: string }
        reportId.value = saved.reportId ? String(saved.reportId) : null
        reportUrl.value = saved.url || null
        return
      }
    } catch {
      // ignore legacy sessionStorage parse errors
    }
  }
  reportId.value = null
  reportUrl.value = null
}
const activities = ref<any[]>([])
const technicians = ref<any[]>([])
const loadingTechnicians = ref(false)
const selectedTechnicianId = ref<number | null>(null)
const selectedStatus = ref<string>('')
const serviceReportForm = ref({
  service_date: '',
  completion_date: '',
  diagnosis: '',
  actions_taken: '',
  technician_signature: null as string | null,
})
const replacementPartRows = ref<ReplacementPartRow[]>([emptyReplacementPartRow()])

const resetReplacementPartRows = () => {
  replacementPartRows.value = [emptyReplacementPartRow()]
}

const addReplacementPartRow = () => {
  replacementPartRows.value.push(emptyReplacementPartRow())
}

const removeReplacementPartRow = (index: number) => {
  if (replacementPartRows.value.length <= 1) return
  replacementPartRows.value.splice(index, 1)
}

const technicianSignatureAgreed = ref(false)

const canSignTechnician = computed(() => {
  if (!ticket.value || !currentUser.value) return false
  return ticket.value.assigned_to === currentUser.value.id
})

// Image upload refs
const beforeImagesInput = ref<HTMLInputElement | null>(null)
const beforeImagesZoneRef = ref<HTMLElement | null>(null)
const afterImagesZoneRef = ref<HTMLElement | null>(null)
const afterImagesInput = ref<HTMLInputElement | null>(null)
const beforeImagePreviews = ref<string[]>([])
const afterImagePreviews = ref<string[]>([])
const beforeImageFiles = ref<File[]>([])
const afterImageFiles = ref<File[]>([])

// Image modal for viewing
const showImageModal = ref(false)
const selectedImageSrc = ref<string>('')
const selectedImageFile = ref<any>(null) // Store file info for PNG detection
const currentImageIndex = ref<number>(-1)
const imageModalRef = ref<HTMLElement | null>(null)

// Comment image upload refs
const commentImageInput = ref<HTMLInputElement | null>(null)
const commentTextarea = ref<HTMLTextAreaElement | null>(null)
const commentImagePreviews = ref<string[]>([])
const commentImageFiles = ref<File[]>([])

// Internal comment refs
const newInternalComment = ref('')
const internalCommentImageInput = ref<HTMLInputElement | null>(null)
const internalCommentTextarea = ref<HTMLTextAreaElement | null>(null)
const internalCommentImagePreviews = ref<string[]>([])
const internalCommentImageFiles = ref<File[]>([])
const addingInternalComment = ref(false)

// Generate signature with name and logo
const generateSignature = async (name: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = 500
    canvas.height = 180
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      reject(new Error('Cannot get canvas context'))
      return
    }
    
    // White background
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Add border
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, canvas.width, canvas.height)
    
    // Function to draw signature content (with or without logo)
    const drawSignature = (hasLogo: boolean = false) => {
      const nameX = 20
      let nameY = 40
      
      // If logo was loaded, draw it first
      if (hasLogo && logoImg.complete && logoImg.naturalWidth > 0) {
        const logoSize = 80
        const logoX = 20
        const logoY = 20
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize)
        nameY = logoY + logoSize + 15
      }
      
      // Draw "Người phụ trách:" label
      ctx.fillStyle = '#6b7280'
      ctx.font = '14px Arial, sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText('Người phụ trách:', nameX, nameY)
      
      // Draw name
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 20px Arial, sans-serif'
      const nameLabelHeight = 20
      ctx.fillText(name, nameX, nameY + nameLabelHeight + 5)
      
      // Draw date
      const now = new Date()
      const dateStr = now.toLocaleDateString('vi-VN', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
      ctx.fillStyle = '#6b7280'
      ctx.font = '12px Arial, sans-serif'
      ctx.fillText(dateStr, nameX, nameY + nameLabelHeight + 35)
      
      // Convert to base64
      const signatureBase64 = canvas.toDataURL('image/png')
      resolve(signatureBase64)
    }
    
    // Load SGE logo
    const logoImg = new Image()
    logoImg.crossOrigin = 'anonymous'
    
    let resolved = false
    
    logoImg.onload = () => {
      if (!resolved) {
        resolved = true
        drawSignature(true)
      }
    }
    
    logoImg.onerror = () => {
      if (!resolved) {
        resolved = true
        drawSignature(false)
      }
    }
    
    // Timeout fallback - if logo takes too long, just draw without logo
    setTimeout(() => {
      if (!resolved) {
        resolved = true
        drawSignature(false)
      }
    }, 2000)
    
    // Try to load logo from public folder
    logoImg.src = '/images/logo/logo.png'
  })
}

const generateTechnicianSignature = async () => {
  if (!canSignTechnician.value) {
    technicianSignatureAgreed.value = false
    serviceReportForm.value.technician_signature = null
    return
  }

  if (technicianSignatureAgreed.value) {
    // Get the name from ticket or current user
    const technicianName = ticket.value?.assigned_to_name || currentUser.value?.name || 'Người phụ trách'
    
    try {
      const signature = await generateSignature(technicianName)
      serviceReportForm.value.technician_signature = signature
    } catch (error) {
      console.error('Error generating signature:', error)
      serviceReportForm.value.technician_signature = null
      technicianSignatureAgreed.value = false
    }
  } else {
    serviceReportForm.value.technician_signature = null
  }
}

// Handle before images selection
const pushBeforeImages = async (files: File[]) => {
  await addFilesToImageList(files, beforeImageFiles.value, beforeImagePreviews.value)
}

const handleBeforeImagesSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    await pushBeforeImages(Array.from(target.files))
    target.value = ''
  }
}

const { handlePaste: handleBeforeImagesPaste, focusZone: focusBeforeImagesZone } = useImagePaste(pushBeforeImages, {
  enabled: () => !updatingStatus.value,
  zoneRef: beforeImagesZoneRef,
})

// Handle after images selection
const pushAfterImages = async (files: File[]) => {
  await addFilesToImageList(files, afterImageFiles.value, afterImagePreviews.value)
}

const handleAfterImagesSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    await pushAfterImages(Array.from(target.files))
    target.value = ''
  }
}

const { handlePaste: handleAfterImagesPaste, focusZone: focusAfterImagesZone } = useImagePaste(pushAfterImages, {
  enabled: () => !updatingStatus.value,
  zoneRef: afterImagesZoneRef,
})

// Remove before image
const removeBeforeImage = (index: number) => {
  beforeImagePreviews.value.splice(index, 1)
  beforeImageFiles.value.splice(index, 1)
}

// Remove after image
const removeAfterImage = (index: number) => {
  afterImagePreviews.value.splice(index, 1)
  afterImageFiles.value.splice(index, 1)
}

// Convert images to base64
const convertImagesToBase64 = async (files: File[]): Promise<string[]> => {
  const promises = files.map((file) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(reader.result as string)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  })
  return Promise.all(promises)
}

const canUpdateStatus = computed(() => {
  // TODO: Check user permissions
  return true
})

// Check if current user can view report
const canViewReport = computed(() => {
  if (!ticket.value || !currentUser.value) return false
  
  // Admin và Dev luôn có thể xem
  if (hasRole(UserRole.ADMIN) || hasRole(UserRole.DEV)) {
    return true
  }
  
  // Kiểm tra user liên quan đến ticket
  const userId = currentUser.value.id
  
  // User tạo ticket
  if (ticket.value.created_by === userId) {
    return true
  }
  
  // User được phân công
  if (ticket.value.assigned_to === userId) {
    return true
  }
  
  // User là watcher
  if (watchers.value.some(w => w.user_id === userId)) {
    return true
  }
  
  // User là customer (qua customer user_id)
  if (ticket.value.customer_user_id === userId) {
    return true
  }
  
  // User là owner của inverter (qua inverter user_id)
  if (ticket.value.inverter_user_id === userId) {
    return true
  }
  
  return false
})

const canAssign = computed(() => {
  if (hasRole(UserRole.ADMIN) || hasRole(UserRole.TECHNICIAN)) {
    return !isTicketClosed(ticket.value?.status)
  }
  return ticket.value?.status === TicketStatus.NEW || ticket.value?.status === 'initialized'
})

const canUseQuickComments = computed(() => {
  // Only Technical and Admin can use quick comments
  return hasRole(UserRole.ADMIN) || hasRole(UserRole.TECHNICIAN)
})

// Quick comment templates
const quickComments = computed(() => [
  t('tickets.detail.actions.quickCommentReceived'),
  t('tickets.detail.actions.quickCommentChecking'),
  t('tickets.detail.actions.quickCommentNeedConfirm'),
  t('tickets.detail.actions.quickCommentTransferToWarranty'),
  t('tickets.detail.actions.quickCommentGatheringInfo'),
])

// Use quick comment - insert into textarea
const useQuickComment = (comment: string) => {
  if (newComment.value.trim()) {
    newComment.value += '\n\n' + comment
  } else {
    newComment.value = comment
  }
  // Focus on textarea after inserting
  nextTick(() => {
    if (commentTextarea.value) {
      commentTextarea.value.focus()
      commentTextarea.value.setSelectionRange(commentTextarea.value.value.length, commentTextarea.value.value.length)
    }
  })
}

const canDelete = computed(() => {
  // Only dev can delete tickets
  try {
    return hasRole(UserRole.DEV)
  } catch (e) {
    console.warn('Error checking delete permission:', e)
    return false
  }
})

const canEdit = computed(() => {
  // Only dev can edit ticket data
  try {
    return hasRole(UserRole.DEV)
  } catch (e) {
    console.warn('Error checking edit permission:', e)
    return false
  }
})

const isSLAOverdue = computed(() => {
  if (!ticket.value?.sla_deadline) return false
  const deadline = typeof ticket.value.sla_deadline === 'string' 
    ? new Date(ticket.value.sla_deadline) 
    : ticket.value.sla_deadline
  return (
    new Date() > deadline &&
    !isTicketClosed(ticket.value.status)
  )
})

// Separate activities into internal and non-internal
const nonInternalActivities = computed(() => {
  return activities.value.filter(activity => activity.isInternal !== true)
})

const internalActivities = computed(() => {
  return activities.value.filter(activity => activity.isInternal === true)
})

// Get all images from attachments and activities for navigation
const allImages = computed(() => {
  const images: Array<{ file_path: string; filename: string; source: 'comment' | 'attachment'; file?: any }> = []
  
  // Add images from ticket attachments only (not comment-linked)
  if (ticketAttachments.value) {
    ticketAttachments.value.forEach((file: any) => {
      if (isImageFile(file)) {
        images.push({
          file_path: getAttachmentUrl(file),
          filename: file.filename || file.name || 'image.jpg',
          source: 'attachment',
          file: file // Keep original file data
        })
      }
    })
  }
  
  // Add images from activities (both internal and non-internal)
  if (activities.value) {
    activities.value.forEach((activity: any) => {
      if (activity.images && activity.images.length > 0) {
        activity.images.forEach((imgSrc: string, idx: number) => {
          images.push({
            file_path: imgSrc,
            filename: `comment-image-${idx + 1}.jpg`,
            source: 'comment'
          })
        })
      }
    })
  }
  
  return images
})


const getPriorityClass = (priority: string) => {
  const classes: Record<string, string> = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  }
  return classes[priority] || classes.medium
}

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    high: t('tickets.detail.labels.priority.high'),
    medium: t('tickets.detail.labels.priority.medium'),
    low: t('tickets.detail.labels.priority.low'),
  }
  return labels[priority] || priority
}

const getTicketTypeLabel = (type: string | null | undefined) => {
  if (!type) return 'N/A'
  const labels: Record<string, string> = {
    repair: t('tickets.detail.labels.ticketType.repair'),
    warranty: t('tickets.detail.labels.ticketType.warranty'),
    other: t('tickets.detail.labels.ticketType.other'),
    technicalSupport: t('tickets.detail.labels.ticketType.technicalSupport'),
    productConsultation: t('tickets.detail.labels.ticketType.productConsultation'),
    // Legacy types
    complaint: 'Khiếu nại',
    consultation: 'Tư vấn',
  }
  return labels[type] || type
}

const getWarrantyStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    active: t('tickets.detail.labels.warrantyStatus.active'),
    expired: t('tickets.detail.labels.warrantyStatus.expired'),
    pending: t('tickets.detail.labels.warrantyStatus.pending'),
  }
  return labels[status] || status
}

const getUserRoleLabel = (role?: string | null) => {
  if (!role) return t('tickets.detail.labels.role.default')
  const labels: Record<string, string> = {
    [UserRole.TECHNICIAN]: t('tickets.detail.labels.role.technician'),
    [UserRole.ADMIN]: t('tickets.detail.labels.role.admin'),
    [UserRole.DEV]: t('tickets.detail.labels.role.dev'),
    [UserRole.SERVICE_CENTER]: t('tickets.detail.labels.role.serviceCenter'),
    [UserRole.DISTRIBUTOR]: t('tickets.detail.labels.role.distributor'),
    [UserRole.DEALER]: t('tickets.detail.labels.role.dealer'),
    [UserRole.END_USER]: t('tickets.detail.labels.role.endUser'),
  }
  return labels[role] || role
}

const getUserFunctionLabel = (functionType?: string | null) => {
  if (!functionType) return t('common.na')
  const labels: Record<string, string> = {
    sale: t('technicians.list.functionOptions.sale'),
    technicalSupport: t('technicians.list.functionOptions.technicalSupport'),
    repair: t('technicians.list.functionOptions.repair'),
    management: t('technicians.list.functionOptions.management'),
  }
  return labels[functionType] || functionType
}

const getAssigneeRoleDescription = (role?: string | null) => {
  return getUserRoleLabel(role).toLowerCase()
}


// Get warranty status text
const getWarrantyStatusText = (warrantyEndDate: string | null | undefined): string => {
  if (!warrantyEndDate) return 'N/A'
  
  const endDate = new Date(warrantyEndDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)
  
  if (endDate < today) {
    return t('tickets.detail.labels.warrantyStatus.expired')
  } else {
    return t('tickets.detail.labels.warrantyStatus.active')
  }
}

// Get warranty status CSS class
const getWarrantyStatusClass = (warrantyEndDate: string | null | undefined): string => {
  if (!warrantyEndDate) return 'text-gray-500 dark:text-gray-400'
  
  const endDate = new Date(warrantyEndDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  endDate.setHours(0, 0, 0, 0)
  
  if (endDate < today) {
    return 'text-red-600 dark:text-red-400 font-semibold'
  } else {
    return 'text-green-600 dark:text-green-400 font-semibold'
  }
}

// Strips the "📷 Đã đính kèm X hình ảnh" image marker from comment text
// so images render directly without redundant label
const getCommentText = (action: string): string => {
  if (!action) return ''
  // Remove trailing image marker (with optional preceding newlines)
  const cleaned = action.replace(/\n*📷 Đã đính kèm \d+ hình ảnh\s*$/u, '').trimEnd()
  // If the entire text was just the marker, return empty so <p> is hidden
  return cleaned
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

const getSLATime = (priority?: string) => {
  const hours = getSlaHoursByPriority(priority)
  return `${hours}h`
}

// Handle comment image selection
const pushCommentImages = async (files: File[]) => {
  await addFilesToImageList(files, commentImageFiles.value, commentImagePreviews.value, {
    onTooLarge: (name) => {
      error.value = t('tickets.new.messages.fileTooLarge', { name })
    },
  })
}

const handleCommentImageSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    await pushCommentImages(Array.from(target.files))
    target.value = ''
  }
}

const { handlePaste: handleCommentPaste } = useImagePaste(pushCommentImages)

// Remove comment image
const removeCommentImage = (index: number) => {
  commentImagePreviews.value.splice(index, 1)
  commentImageFiles.value.splice(index, 1)
}

// Handle internal comment image select
const pushInternalCommentImages = async (files: File[]) => {
  await addFilesToImageList(files, internalCommentImageFiles.value, internalCommentImagePreviews.value, {
    onTooLarge: (name) => {
      error.value = t('tickets.new.messages.fileTooLarge', { name })
    },
  })
}

const handleInternalCommentImageSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    await pushInternalCommentImages(Array.from(target.files))
    target.value = ''
  }
}

const { handlePaste: handleInternalCommentPaste } = useImagePaste(pushInternalCommentImages)

// Remove internal comment image
const removeInternalCommentImage = (index: number) => {
  internalCommentImagePreviews.value.splice(index, 1)
  internalCommentImageFiles.value.splice(index, 1)
}

// Open image modal for viewing
const openImageModal = (imageSrc: string, file?: any) => {
  // Find index in allImages
  const index = allImages.value.findIndex(img => {
    if (file) {
      return img.file_path === imageSrc || (img.file && img.file === file)
    }
    return img.file_path === imageSrc
  })
  
  currentImageIndex.value = index >= 0 ? index : -1
  selectedImageSrc.value = imageSrc
  selectedImageFile.value = file || null
  showImageModal.value = true
  
  // Focus modal for keyboard events
  setTimeout(() => {
    if (imageModalRef.value) {
      imageModalRef.value.focus()
    }
  }, 100)
}

// Close image modal
const closeImageModal = () => {
  showImageModal.value = false
  selectedImageSrc.value = ''
  selectedImageFile.value = null
  currentImageIndex.value = -1
}

// Handle keyboard navigation in image modal
const handleImageModalKeydown = (event: KeyboardEvent) => {
  if (!showImageModal.value) return
  
  switch (event.key) {
    case 'Escape':
      closeImageModal()
      break
    case 'ArrowUp':
      event.preventDefault()
      navigateImage(-1)
      break
    case 'ArrowDown':
      event.preventDefault()
      navigateImage(1)
      break
  }
}

// Open image from comment (sessionStorage base64)
const openImageFromComment = (imageSrc: string) => {
  // Find index in allImages
  const index = allImages.value.findIndex(img => img.file_path === imageSrc)
  
  currentImageIndex.value = index >= 0 ? index : -1
  selectedImageSrc.value = imageSrc
  selectedImageFile.value = null
  showImageModal.value = true
  
  // Focus modal for keyboard events
  setTimeout(() => {
    if (imageModalRef.value) {
      imageModalRef.value.focus()
    }
  }, 100)
}

// Navigate between images
const navigateImage = (direction: number) => {
  if (allImages.value.length === 0) return
  
  let newIndex = currentImageIndex.value + direction
  
  // Wrap around
  if (newIndex < 0) {
    newIndex = allImages.value.length - 1
  } else if (newIndex >= allImages.value.length) {
    newIndex = 0
  }
  
  currentImageIndex.value = newIndex
  const nextImage = allImages.value[newIndex]
  
  if (nextImage.source === 'comment') {
    selectedImageSrc.value = nextImage.file_path
    selectedImageFile.value = null
  } else {
    selectedImageSrc.value = nextImage.file_path
    selectedImageFile.value = nextImage.file || null
  }
}

// Check if image is PNG (for white background display)
const isPngImage = (imageSrc: string): boolean => {
  if (!imageSrc) return false
  
  // First, check if we have file info (more reliable)
  if (selectedImageFile.value) {
    const filename = (selectedImageFile.value.filename || selectedImageFile.value.name || '').toLowerCase()
    const mimeType = (selectedImageFile.value.mime_type || selectedImageFile.value.type || '').toLowerCase()
    
    if (filename && filename.endsWith('.png')) {
      return true
    }
    
    if (mimeType && (mimeType === 'image/png' || mimeType.includes('png'))) {
      return true
    }
  }
  
  // Check by URL extension
  if (imageSrc.toLowerCase().includes('.png')) {
    return true
  }
  
  // Check by MIME type in data URI
  if (imageSrc.startsWith('data:image/png') || imageSrc.startsWith('data:image/x-png')) {
    return true
  }
  
  // Check by URL path
  try {
    const url = new URL(imageSrc)
    const pathname = url.pathname.toLowerCase()
    if (pathname.endsWith('.png')) {
      return true
    }
  } catch (e) {
    // If URL parsing fails, check if it's a relative path
    if (imageSrc.toLowerCase().endsWith('.png')) {
      return true
    }
  }
  
  return false
}

// Check if file is an image
const isImageFile = (file: any): boolean => {
  if (!file) return false
  
  const filename = (file.filename || file.name || '').toLowerCase()
  const mimeType = (file.mime_type || file.type || '').toLowerCase()
  const filePath = (file.file_path || '').toString()
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico']
  const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp', 'image/x-icon']
  
  // Check by extension
  if (filename && imageExtensions.some(ext => filename.endsWith(ext))) {
    return true
  }
  
  // Check by mime type
  if (mimeType && imageMimeTypes.some(type => mimeType.includes(type))) {
    return true
  }
  
  // Check if file_path is base64 data URI
  if (filePath && (filePath.startsWith('data:image/') || filePath.startsWith('data:application/octet-stream'))) {
    return true
  }
  
  return false
}

// Get attachment URL for display
const getAttachmentUrl = (file: any): string => {
  return resolveAttachmentUrl(file, ticket.value?.id)
}

// View report
const viewReport = () => {
  const urlToOpen = reportUrl.value
  if (!urlToOpen) {
    alert('Báo cáo chưa được tạo. Vui lòng đóng ticket để tạo báo cáo.')
    return
  }
  const fullUrl = resolveReportUrl(urlToOpen)
  if (fullUrl) window.open(fullUrl, '_blank')
}

// Open attachment image in modal
const openAttachmentImage = (file: any) => {
  const imageUrl = getAttachmentUrl(file)
  if (imageUrl) {
    openImageModal(imageUrl, file) // Pass file info for PNG detection
  }
}

// Handle image load error
const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  console.error('Image load error:', img.alt)
  img.style.display = 'none'
  
  // Show error message if not already shown
  const parent = img.parentElement
  if (parent && !parent.querySelector('.image-error')) {
    const errorDiv = document.createElement('div')
    errorDiv.className = 'image-error absolute inset-0 flex items-center justify-center text-xs text-gray-400 bg-gray-100 dark:bg-gray-700'
    errorDiv.textContent = 'Không thể tải hình ảnh'
    parent.appendChild(errorDiv)
  }
}

const addComment = async () => {
  if ((!newComment.value.trim() && commentImageFiles.value.length === 0) || !ticket.value) return

  addingComment.value = true
  const commentText = newComment.value.trim()
  const imagesToSave = [...commentImagePreviews.value] // Save preview URLs for display
  const imageFilesToSave = [...commentImageFiles.value] // Save files temporarily
  newComment.value = ''

  try {
    let finalCommentText = commentText
    
    // If there are images, just add a simple marker
    if (imageFilesToSave.length > 0) {
      if (finalCommentText) {
        finalCommentText += '\n\n📷 Đã đính kèm ' + imageFilesToSave.length + ' hình ảnh'
      } else {
        finalCommentText = '📷 Đã đính kèm ' + imageFilesToSave.length + ' hình ảnh'
      }
    }

    // Call API to add comment - server will set the timestamp
    const newCommentData = await ticketService.addComment(ticket.value.id, finalCommentText, isInternalComment.value)
    const commentId = newCommentData?.id || newCommentData?.data?.id
    
    // Upload images as attachments linked to this comment
    if (imageFilesToSave.length > 0 && commentId) {
      for (const imageFile of imageFilesToSave) {
        try {
          // Convert file to base64
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              // Remove data:image/...;base64, prefix if present
              const base64Data = result.includes(',') ? result.split(',')[1] : result
              resolve(base64Data)
            }
            reader.onerror = reject
            reader.readAsDataURL(imageFile)
          })
          
          await ticketService.uploadAttachment(ticket.value.id, {
            file: base64,
            filename: imageFile.name,
            mime_type: imageFile.type,
            file_size: imageFile.size,
            comment_id: commentId
          })
        } catch (uploadErr) {
          console.error('Error uploading image:', uploadErr)
          // Continue with other images even if one fails
        }
      }
    }
    
    // Clear image previews and files
    commentImagePreviews.value = []
    commentImageFiles.value = []
    isInternalComment.value = false // Reset internal comment checkbox
    
    // Reload ticket to get updated data with server timestamp
    await loadTicket()
  } catch (err) {
    console.error('Error adding comment:', err)
    error.value = err instanceof Error ? err.message : t('tickets.detail.messages.addCommentError')
    // Restore comment text if there was an error
    newComment.value = commentText
  } finally {
    addingComment.value = false
  }
}

// Add internal comment
const addInternalComment = async () => {
  if ((!newInternalComment.value.trim() && internalCommentImageFiles.value.length === 0) || !ticket.value) return

  addingInternalComment.value = true
  const commentText = newInternalComment.value.trim()
  const imageFilesToSave = [...internalCommentImageFiles.value]
  newInternalComment.value = ''

  try {
    const finalCommentText = commentText || ' '

    // Call API to add comment - server will set the timestamp, isInternal = true
    const newCommentData = await ticketService.addComment(ticket.value.id, finalCommentText, true)
    const commentId = newCommentData?.id || newCommentData?.data?.id

    // Upload images as attachments linked to this comment
    if (imageFilesToSave.length > 0 && commentId) {
      for (const imageFile of imageFilesToSave) {
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result as string
              const base64Data = result.includes(',') ? result.split(',')[1] : result
              resolve(base64Data)
            }
            reader.onerror = reject
            reader.readAsDataURL(imageFile)
          })

          await ticketService.uploadAttachment(ticket.value.id, {
            file: base64,
            filename: imageFile.name,
            mime_type: imageFile.type,
            file_size: imageFile.size,
            comment_id: commentId
          })
        } catch (uploadErr) {
          console.error('Error uploading internal comment image:', uploadErr)
        }
      }
    }

    // Clear image previews and files
    internalCommentImagePreviews.value = []
    internalCommentImageFiles.value = []
    
    // Reload ticket to get updated data with server timestamp
    await loadTicket()
  } catch (err) {
    console.error('Error adding internal comment:', err)
    error.value = err instanceof Error ? err.message : t('tickets.detail.messages.addCommentError')
    // Restore comment text if there was an error
    newInternalComment.value = commentText
  } finally {
    addingInternalComment.value = false
  }
}

// Load ticket from API
const loadTicket = async () => {
  const ticketId = route.params.id as string
  if (!ticketId) return

  loading.value = true
  error.value = null

  try {
    const ticketData = await ticketService.getTicketById(parseInt(ticketId))
    ticket.value = ticketData
    
    // Map comments and attachments from API response
    comments.value = (ticketData as any).comments || []
    attachments.value = (ticketData as any).attachments || []
    watchers.value = (ticketData as any).watchers || []
    applyReportFromTicket(ticketData as { report_url?: string; id?: number; status?: string })
    
    // Debug: ticket-level attachments vs comment-linked images
    const commentImageCount = (ticketData.comments || []).reduce(
      (sum: number, c: { images?: unknown[] }) => sum + (c.images?.length || 0),
      0,
    )
    if (attachments.value.length > 0) {
      console.log('📎 Ticket attachments loaded:', attachments.value.length, 'files')
      attachments.value.forEach((att: any, idx: number) => {
        console.log(`  Attachment ${idx + 1}:`, {
          id: att.id,
          filename: att.filename,
          mime_type: att.mime_type,
          file_size: att.file_size,
          isImage: isImageFile(att),
          url: getAttachmentUrl(att),
        })
      })
    } else if (commentImageCount > 0) {
      console.log(
        `📎 No standalone attachments for ticket ${ticketId}; ${commentImageCount} image(s) on comments`,
      )
    } else {
      console.log('📎 No attachments for ticket', ticketId)
    }
    
    // Build activities from comments and ticket history
    buildActivities()
    
    // Return data for auto-refresh comparison
    return ticketData
  } catch (err) {
    console.error('Error loading ticket:', err)
    error.value = err instanceof Error ? err.message : t('tickets.detail.messages.loadError')
    throw err
  } finally {
    loading.value = false
  }
}

// Change detection: refresh when ticket/comments change (20s prod)
useChangeDetection({
  ticketId: route.params.id,
  onTicketChange: async () => {
    if (!loading.value) await loadTicket()
  },
})

// Auto-refresh ticket data (fallback)
const { isRefreshing: isAutoRefreshing, lastRefreshTime } = useAutoRefresh({
  interval: POLL.detailRefresh(),
  fetchFn: async () => {
    // Only refresh if not currently loading manually
    if (!loading.value) {
      return await loadTicket()
    }
  },
  compareFn: (oldData: any, newData: any) => {
    if (!oldData || !newData) return true
    
    // Compare key fields that might change
    const oldKey = `${oldData.status}-${oldData.comments?.length || 0}-${oldData.updated_at}`
    const newKey = `${newData.status}-${newData.comments?.length || 0}-${newData.updated_at}`
    
    return oldKey !== newKey
  },
  onDataChange: (newData: any, oldData: any) => {
    // Silently update data when changes are detected
    if (newData) {
      ticket.value = newData
      // Map comments and attachments
      comments.value = (newData as any).comments || []
      attachments.value = (newData as any).attachments || []
      watchers.value = (newData as any).watchers || []
      applyReportFromTicket(newData as { report_url?: string; id?: number; status?: string })
      // Rebuild activities
      buildActivities()
    }
  },
  pauseWhenHidden: true, // Pause when tab is not visible
})

// Edit comment (only for non-system comments)
const editComment = (activity: any) => {
  if (activity.isSystem) {
    return // Cannot edit system comments
  }
  editingComment.value = activity
  editingCommentText.value = activity.action
}

// Cancel edit
const cancelEdit = () => {
  editingComment.value = null
  editingCommentText.value = ''
}

// Save edited comment
const saveEditedComment = async () => {
  if (!editingComment.value || !editingCommentText.value.trim()) return
  
  // Prevent editing system comments
  if (editingComment.value.isSystem || !editingComment.value.commentId) {
    cancelEdit()
    return
  }

  try {
    const ticketId = route.params.id as string
    const response = await apiClient.put(`/tickets/${ticketId}/comments/${editingComment.value.commentId}`, {
      comment: editingCommentText.value.trim(),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    // Reload ticket to get updated comments
    await loadTicket()
    cancelEdit()
  } catch (err) {
    console.error('Error editing comment:', err)
    error.value = err instanceof Error ? err.message : 'Không thể chỉnh sửa comment'
  }
}

// Delete comment (recall)
const deleteComment = async (activity: any) => {
  if (!confirm('Bạn có chắc chắn muốn thu hồi comment này?')) {
    return
  }

  try {
    const ticketId = route.params.id as string
    deletingCommentId.value = activity.commentId

    const response = await apiClient.delete(`/tickets/${ticketId}/comments/${activity.commentId}`)

    if (response.error) {
      throw new Error(response.error)
    }

    // Reload ticket to get updated comments
    await loadTicket()
    deletingCommentId.value = null
  } catch (err) {
    console.error('Error deleting comment:', err)
    error.value = err instanceof Error ? err.message : 'Không thể thu hồi comment'
    deletingCommentId.value = null
  }
}

// Build activities list from comments
const buildActivities = () => {
  if (!ticket.value) return
  
  activities.value = []
  
  // Add ticket creation activity
  if (ticket.value.created_at) {
    activities.value.push({
      user: ticket.value.created_by_name || 'System',
      email: ticket.value.created_by_email || null,
      phone: ticket.value.created_by_phone || null,
      action: t('tickets.detail.status.created'),
      timestamp: new Date(ticket.value.created_at),
      isInternal: false, // Ticket creation is not internal
    })
  }
  
  // Add comments as activities
  const hasSystemAssignmentComment = comments.value.some(c => 
    c.comment?.includes('Hệ thống phân công cho nhân viên')
  )
  
  comments.value.forEach((comment) => {
    // Check if comment is system auto-assignment message
    const commentText = comment.comment || comment.content || ''
    const isSystemAssignment = commentText.includes('Hệ thống phân công cho nhân viên') || false
    
    // Attachment IDs from API — resolve to URLs (no base64 in JSON)
    const images: string[] = (comment.images || []).map((img: number | string) =>
      resolveCommentImageSrc(img, ticket.value!.id),
    )
    
    // Skip system assignment comments (they are auto-generated, no need to show in activity log)
    if (isSystemAssignment) {
      return // Skip system assignment comments
    }
    
    activities.value.push({
      user: comment.user_name || 'Unknown',
      email: comment.user_email || null,
      phone: comment.user_phone || null,
      action: commentText,
      timestamp: new Date(comment.created_at),
      isSystem: false, // Regular comments are not system messages
      isInternal: comment.is_internal === 1 || comment.is_internal === true,
      images: images,
      commentId: comment.id, // All comments can be edited if user has permission
      userId: comment.user_id,
    })
  })
  
  // Add assignment activity if assigned but no system comment (for manual assignments)
  if (ticket.value.assigned_to_name && ticket.value.assigned_at && !hasSystemAssignmentComment) {
    const assigneeRoleDesc = getAssigneeRoleDescription(ticket.value.assigned_to_role)
    activities.value.push({
      user: ticket.value.assigned_to_name,
      email: ticket.value.assigned_to_email || null,
      phone: ticket.value.assigned_to_phone || null,
      action: t('tickets.detail.messages.assignmentAssigned', { role: assigneeRoleDesc, name: ticket.value.assigned_to_name }),
      timestamp: new Date(ticket.value.assigned_at),
      isSystem: false,
      isInternal: false, // Assignment activity is not internal
    })
  }
  
  // Sort by timestamp (oldest first)
  activities.value.sort((a, b) => {
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  })
}

// Load technicians when modal opens
watch(showAssignModal, async (isOpen) => {
  if (isOpen) {
    // Load technicians if not loaded
    if (technicians.value.length === 0) {
      await loadTechnicians()
    }
    // Pre-select current technician if already assigned (but allow admin to change)
    if (ticket.value) {
      selectedTechnicianId.value = ticket.value.assigned_to || null
    }
  } else {
    // Reset selection when modal closes
    selectedTechnicianId.value = null
  }
})

// Watch status modal
watch(showStatusModal, async (isOpen) => {
  if (isOpen && ticket.value) {
    selectedStatus.value = ticket.value.status || TicketStatus.NEW
    
    // Ngày bắt đầu = ngày tạo ticket
    const ticketCreatedDate = ticket.value.created_at ? formatDateForInput(ticket.value.created_at) : formatDateForInput(new Date())
    // Ngày kết thúc = ngày hiện tại
    const todayDate = formatDateForInput(new Date())
    
    serviceReportForm.value = {
      service_date: ticketCreatedDate,
      completion_date: todayDate,
      diagnosis: '',
      actions_taken: '',
      technician_signature: null,
    }
    resetReplacementPartRows()
    
    beforeImagePreviews.value = []
    afterImagePreviews.value = []
    beforeImageFiles.value = []
    afterImageFiles.value = []
    technicianSignatureAgreed.value = false
    serviceReportForm.value.technician_signature = null
    
    if (technicians.value.length === 0) {
      await loadTechnicians()
    }
  }
})

// Computed for selected technician
const selectedTechnician = computed(() => {
  if (!selectedTechnicianId.value) return null
  return technicians.value.find(t => t.id === selectedTechnicianId.value)
})

// Load technicians list
const loadTechnicians = async () => {
  loadingTechnicians.value = true
  try {
    const response = await apiClient.get('/technicians?includeAdmins=true')
    if (response.error) {
      throw new Error(response.error)
    }
    technicians.value = Array.isArray(response.data)
      ? response.data.filter((t: any) => t.role !== UserRole.DEV)
      : []
  } catch (err) {
    console.error('Error loading technicians:', err)
    error.value = err instanceof Error ? err.message : t('tickets.detail.messages.loadTechniciansError')
  } finally {
    loadingTechnicians.value = false
  }
}

// Assign technician
const assignTechnician = async () => {
  if (!selectedTechnicianId.value || !ticket.value) return

  assigning.value = true
  error.value = null

  try {
    // Store old technician info before updating
    const oldTechnicianId = ticket.value.assigned_to
    const oldTechnicianName = ticket.value.assigned_to_name
    const oldAssigneeRoleDesc = getAssigneeRoleDescription(ticket.value.assigned_to_role)
    
    // Get new technician info
    const newTechnician = technicians.value.find(t => t.id === selectedTechnicianId.value)
    const newTechnicianName = newTechnician?.name || 'N/A'
    const newAssigneeRoleDesc = getAssigneeRoleDescription(newTechnician?.role)
    
    // Assign technician (this will update the ticket status to in_progress)
    await ticketService.assignTechnician(ticket.value.id, selectedTechnicianId.value)
    
    // Create activity comment
    let activityComment = ''
    if (oldTechnicianId && oldTechnicianId !== selectedTechnicianId.value) {
      // Thay đổi người phụ trách
      activityComment = t('tickets.detail.messages.assignmentChanged', { role: oldAssigneeRoleDesc, oldName: oldTechnicianName || 'N/A', newName: newTechnicianName })
    } else if (!oldTechnicianId) {
      // Phân công người phụ trách mới
      activityComment = t('tickets.detail.messages.assignmentAssigned', { role: newAssigneeRoleDesc, name: newTechnicianName })
    } else {
      // Giữ nguyên (trường hợp hiếm, nhưng vẫn ghi lại)
      activityComment = t('tickets.detail.messages.assignmentConfirmed', { role: newAssigneeRoleDesc, name: newTechnicianName })
    }
    
    // Add comment to activity log (this will be shown in the activity timeline)
    try {
      await ticketService.addComment(ticket.value.id, activityComment)
    } catch (commentErr) {
      console.warn('Failed to add activity comment:', commentErr)
      // Don't fail the entire operation if comment fails
    }
    
    // Reload ticket to get updated data (including new comment and updated assignment info)
    await loadTicket()
    
    // Close modal
    showAssignModal.value = false
    selectedTechnicianId.value = null
  } catch (err) {
    console.error('Error assigning technician:', err)
    error.value = err instanceof Error ? err.message : t('tickets.detail.messages.assignError')
  } finally {
    assigning.value = false
  }
}

// Close status modal
const closeStatusModal = () => {
  showStatusModal.value = false
  selectedStatus.value = ''
  serviceReportForm.value = {
    service_date: '',
    completion_date: '',
    diagnosis: '',
    actions_taken: '',
    technician_signature: null,
  }
  resetReplacementPartRows()
  
  // Reset images and signatures
  beforeImagePreviews.value = []
  afterImagePreviews.value = []
  beforeImageFiles.value = []
  afterImageFiles.value = []
  technicianSignatureAgreed.value = false
  serviceReportForm.value.technician_signature = null
}

// Update ticket status
const updateTicketStatus = async () => {
  if (!selectedStatus.value || !ticket.value) return

  if (selectedStatus.value === TicketStatus.CLOSED && !serviceReportForm.value.service_date) {
    error.value = t('tickets.detail.messages.fillServiceReportRequired')
    return
  }

  // Yêu cầu checkbox đồng ý khi close ticket
  if (selectedStatus.value === TicketStatus.CLOSED && !technicianSignatureAgreed.value) {
    error.value = 'Vui lòng tích vào ô "Tôi đồng ý và xác nhận" để đóng ticket'
    return
  }

  updatingStatus.value = true
  error.value = null

  try {
    const payload = {
      status: selectedStatus.value,
    }

    await ticketService.updateTicketStatus(ticket.value.id, payload)
    
    // Generate HTML report nếu hoàn thành (không lưu vào DB)
    if (selectedStatus.value === TicketStatus.CLOSED) {
      try {
        const beforeImages = await convertImagesToBase64(beforeImageFiles.value)
        const afterImages = await convertImagesToBase64(afterImageFiles.value)
        
        const reportData = {
          service_date: serviceReportForm.value.service_date,
          completion_date: serviceReportForm.value.completion_date || null,
          diagnosis: serviceReportForm.value.diagnosis || null,
          actions_taken: serviceReportForm.value.actions_taken || null,
          replacement_parts: serializeReplacementParts(replacementPartRows.value),
          before_images: beforeImages.length > 0 ? JSON.stringify(beforeImages) : null,
          after_images: afterImages.length > 0 ? JSON.stringify(afterImages) : null,
          technician_signature: serviceReportForm.value.technician_signature,
        }

        const response = await apiClient.post(`/tickets/${ticket.value.id}/generate-report`, reportData)
        if (response.error) {
          console.warn('Error generating report:', response.error)
          alert('Lỗi khi tạo báo cáo: ' + response.error)
        } else if (response.data) {
          const reportData = response.data as { reportId?: number; url?: string }
          // Lưu report URL để hiển thị nút xem report
          reportId.value = reportData.reportId ? String(reportData.reportId) : null
          reportUrl.value = reportData.url || null

          sessionStorage.setItem(`ticket_${ticket.value.id}_report`, JSON.stringify({
            reportId: reportData.reportId,
            url: reportData.url,
            timestamp: new Date().toISOString(),
          }))

          if (reportData.url) {
            const fullUrl = resolveReportUrl(reportData.url)
            if (fullUrl) window.open(fullUrl, '_blank')
          }
        }
      } catch (reportError) {
        console.error('Error generating report:', reportError)
      }
    }

    try {
      await ticketService.addComment(ticket.value.id, t('tickets.detail.messages.ticketCompletedComment'))
    } catch (activityError) {
      console.warn('Không thể lưu nhật ký trạng thái:', activityError)
    }
    
    await loadTicket()
    closeStatusModal()
  } catch (err) {
    console.error('Error updating ticket status:', err)
    error.value = err instanceof Error ? err.message : t('tickets.detail.messages.updateTicketError')
  } finally {
    updatingStatus.value = false
  }
}

// Confirm delete ticket
const confirmDeleteTicket = () => {
  if (!ticket.value) return
  if (confirm(t('tickets.list.messages.confirmDelete', { code: ticket.value.ticket_number }))) {
    deleteTicket()
  }
}

// Delete ticket
const deleteTicket = async () => {
  if (!ticket.value) return

  deleting.value = true
  error.value = null

  try {
    await ticketService.deleteTicket(ticket.value.id)
    
    // Redirect to ticket list after successful deletion
    router.push('/tickets')
  } catch (err) {
    console.error('Error deleting ticket:', err)
    error.value = err instanceof Error ? err.message : t('tickets.detail.messages.loadError')
    deleting.value = false
  }
}

const { dateConfig: flatpickrDateConfig } = useFlatpickrConfig()

// Load available users for watcher selection (only ADMIN and TECHNICIAN)
const loadAvailableUsers = async () => {
  try {
    const response = await apiClient.get('/users?status=active&limit=1000')
    let users: any[] = []
    const responseData = response.data as any
    if (responseData && Array.isArray(responseData)) {
      users = responseData
    } else if (responseData?.data) {
      users = responseData.data
    }
    
    // Filter: only ADMIN and TECHNICIAN, exclude current user and already watching users
    const currentWatcherIds = watchers.value.map(w => w.user_id)
    availableUsers.value = users.filter((u: any) => 
      u.id !== currentUser.value?.id && 
      (u.role === UserRole.ADMIN || u.role === UserRole.TECHNICIAN) &&
      !currentWatcherIds.includes(u.id)
    )
  } catch (err) {
    console.error('Error loading users:', err)
    availableUsers.value = []
  }
}

// Open add watcher modal
const openAddWatcherModal = async () => {
  showAddWatcherModal.value = true
  await loadAvailableUsers()
  selectedWatcherUserIds.value = []
}

// Toggle user selection
const toggleUserSelection = (userId: number) => {
  const index = selectedWatcherUserIds.value.indexOf(userId)
  if (index > -1) {
    selectedWatcherUserIds.value.splice(index, 1)
  } else {
    selectedWatcherUserIds.value.push(userId)
  }
}

// Check if user is selected
const isUserSelected = (userId: number): boolean => {
  return selectedWatcherUserIds.value.includes(userId)
}

// Add watchers (multiple)
const addWatchers = async () => {
  if (selectedWatcherUserIds.value.length === 0) {
    error.value = t('tickets.detail.watchers.selectUserRequired')
    return
  }

  addingWatcher.value = true
  error.value = null

  try {
    const ticketId = route.params.id as string
    const errors: string[] = []
    let successCount = 0

    // Add each watcher
    for (const userId of selectedWatcherUserIds.value) {
      try {
        const response = await apiClient.post(`/tickets/${ticketId}/watchers`, {
          user_id: userId,
        })

        if (response.error) {
          errors.push(`User ID ${userId}: ${response.error}`)
        } else {
          successCount++
        }
      } catch (err) {
        const user = availableUsers.value.find(u => u.id === userId)
        errors.push(user ? `${user.name}: ${err instanceof Error ? err.message : 'Unknown error'}` : `User ID ${userId}: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    // Reload ticket to get updated watchers
    await loadTicket()
    
    if (errors.length > 0) {
      error.value = `${successCount} watcher(s) added. Errors: ${errors.join('; ')}`
    } else {
      showAddWatcherModal.value = false
      selectedWatcherUserIds.value = []
    }
  } catch (err) {
    console.error('Error adding watchers:', err)
    error.value = err instanceof Error ? err.message : t('tickets.detail.watchers.addError')
  } finally {
    addingWatcher.value = false
  }
}

// Remove watcher
const removeWatcher = async (watcherId: number) => {
  if (!confirm(t('tickets.detail.watchers.confirmRemove'))) {
    return
  }

  loadingWatchers.value = true
  error.value = null

  try {
    const ticketId = route.params.id as string
    const response = await apiClient.delete(`/tickets/${ticketId}/watchers/${watcherId}`)

    if (response.error) {
      throw new Error(response.error)
    }

    // Reload ticket to get updated watchers
    await loadTicket()
  } catch (err) {
    console.error('Error removing watcher:', err)
    error.value = err instanceof Error ? err.message : t('tickets.detail.watchers.removeError')
  } finally {
    loadingWatchers.value = false
  }
}

// Check if user can remove watcher
const canRemoveWatcher = (watcher: any): boolean => {
  if (!currentUser.value) return false
  // Can remove themselves or if admin/technician
  return (
    watcher.user_id === currentUser.value.id ||
    hasRole(UserRole.ADMIN) ||
    hasRole(UserRole.DEV) ||
    (hasRole(UserRole.TECHNICIAN) && (ticket.value?.assigned_to === currentUser.value.id || ticket.value?.created_by === currentUser.value.id))
  )
}

onMounted(() => {
  loadTicket()
})
</script>
