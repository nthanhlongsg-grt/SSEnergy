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
                {{ task?.title || t('tasks.detail.header.title') }}
              </h1>
              <p class="text-gray-500 dark:text-gray-400 mt-1">
                {{ task?.technician_name || 'N/A' }} - {{ formatDate(task?.schedule_date) }}
              </p>
            </div>
          </div>
        </div>
        <div class="flex gap-2">
          <button
            v-if="!isEditing && canEdit && task?.status !== 'completed'"
            @click="startEdit"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {{ t('tasks.detail.actions.edit') }}
          </button>
          <button
            v-if="isEditing"
            @click="cancelEdit"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            v-if="isEditing"
            @click="saveTask"
            :disabled="saving"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ saving ? t('common.saving') : t('common.save') }}
          </button>
        </div>
      </div>

      <!-- Error Alert -->
      <div
        v-if="error"
        class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4"
      >
        <div class="flex items-center gap-2">
          <svg class="h-5 w-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p class="text-sm font-medium text-red-800 dark:text-red-200">
            {{ error }}
          </p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-500 dark:text-gray-400">{{ t('common.loading') }}</p>
      </div>

      <!-- Task Details -->
      <div v-if="task && !loading" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Task Information -->
        <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {{ t('tasks.detail.sections.taskInfo') }}
          </h2>
          
          <div v-if="!isEditing" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('tasks.detail.fields.title') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white font-medium">
                  {{ task.title }}
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('tasks.detail.fields.status') }}
                </label>
                <div class="mt-1">
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      getTaskStatusClass(task.status),
                    ]"
                  >
                    {{ getTaskStatusLabel(task.status) }}
                  </span>
                </div>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('tasks.detail.fields.technician') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white">
                  {{ task.technician_name || t('common.na') }}
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('tasks.detail.fields.assignedBy') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white">
                  {{ task.created_by_name || t('common.na') }}
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('tasks.detail.fields.scheduleDate') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white">
                  {{ formatDate(task.schedule_date) }}
                </p>
              </div>
              <div>
                <div class="flex items-center justify-between">
                  <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {{ t('tasks.detail.fields.deadline') }}
                  </label>
                  <button
                    v-if="canEdit && task.status !== 'completed'"
                    @click="openExtendDeadlineModal"
                    class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    {{ t('tasks.detail.actions.extendDeadline') }}
                  </button>
                </div>
                <p class="mt-1 text-gray-900 dark:text-white font-medium">
                  <span v-if="task.schedule_date">
                    {{ formatDate(task.schedule_date) }}
                    <span v-if="task.end_time"> - {{ task.end_time }}</span>
                  </span>
                  <span v-else>{{ t('common.na') }}</span>
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('tasks.detail.fields.daysRemaining') }}
                </label>
                <div class="mt-1">
                  <span
                    v-if="calculateDaysRemaining(task) !== null"
                    :class="[
                      'px-3 py-1 text-sm font-semibold rounded-full',
                      isTaskOverdue(task)
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : calculateDaysRemaining(task)! <= 3
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
                    ]"
                  >
                    {{ getDaysRemainingText(task) }}
                  </span>
                  <span v-else class="text-gray-500 dark:text-gray-400">
                    {{ t('common.na') }}
                  </span>
                </div>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('tasks.detail.fields.overdueStatus') }}
                </label>
                <div class="mt-1">
                  <span
                    :class="[
                      'px-3 py-1 text-sm font-semibold rounded-full',
                      getOverdueStatusClass(task),
                    ]"
                  >
                    {{ getOverdueStatusText(task) }}
                  </span>
                </div>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('tasks.detail.fields.time') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white">
                  <span v-if="task.start_time">
                    {{ task.start_time }}
                    <span v-if="task.end_time"> - {{ task.end_time }}</span>
                  </span>
                  <span v-else>{{ t('common.na') }}</span>
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('tasks.detail.fields.location') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white">
                  {{ task.location || t('common.na') }}
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('tasks.detail.fields.createdDate') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white">
                  {{ task.created_at ? formatDateTime(task.created_at) : t('common.na') }}
                </p>
              </div>
            </div>
            <div>
              <div class="flex items-center justify-between">
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('technicians.schedule.modal.relatedUsers') }}
                </label>
                <button
                  @click="showAddRelatedUserModal = true"
                  class="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  + {{ t('tasks.detail.actions.addRelatedUser') }}
                </button>
              </div>
              <div v-if="task.related_users && task.related_users.length > 0" class="mt-2 flex flex-wrap gap-2">
                <span
                  v-for="user in task.related_users"
                  :key="user.id"
                  class="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm flex items-center gap-1.5"
                >
                  {{ user.name }}
                  <button
                    @click="removeRelatedUser(user.id)"
                    :disabled="updatingRelatedUsers"
                    class="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors disabled:opacity-50"
                    :title="t('tasks.detail.actions.removeRelatedUser')"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              </div>
              <p v-else class="mt-1 text-gray-500 dark:text-gray-400 text-sm">
                {{ t('technicians.schedule.modal.noRelatedUsers') }}
              </p>
            </div>
            <div v-if="task.description">
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tasks.detail.fields.description') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">
                {{ task.description }}
              </p>
            </div>
            <div v-if="task.work_requirements">
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tasks.detail.fields.workRequirements') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">
                {{ task.work_requirements }}
              </p>
            </div>
            <div v-if="task.notes">
              <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ t('tasks.detail.fields.notes') }}
              </label>
              <p class="mt-1 text-gray-900 dark:text-white whitespace-pre-wrap">
                {{ task.notes }}
              </p>
            </div>
          </div>

          <!-- Edit Form -->
          <form v-else @submit.prevent="saveTask" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('tasks.detail.fields.title') }} <span class="text-red-500">*</span>
              </label>
              <input
                v-model="editForm.title"
                type="text"
                required
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :disabled="saving"
              />
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('tasks.detail.fields.technician') }} <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="editForm.technician_id"
                  required
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="saving"
                >
                  <option value="">{{ t('technicians.schedule.modal.selectAssignee') }}</option>
                  <option
                    v-for="user in assignableUsers"
                    :key="user.id"
                    :value="user.id"
                  >
                    {{ user.name }} ({{ getAssignableRoleLabel(user.role) }})
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('tasks.detail.fields.status') }}
                </label>
                <select
                  v-model="editForm.status"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="saving || task?.status === 'completed'"
                >
                  <option value="scheduled">{{ t('technicians.schedule.statusOptions.scheduled') }}</option>
                  <option value="in_progress">{{ t('technicians.schedule.statusOptions.inProgress') }}</option>
                  <option value="completed">{{ t('technicians.schedule.statusOptions.completed') }}</option>
                </select>
                <p v-if="task?.status === 'completed'" class="mt-1 text-xs text-gray-500 dark:text-gray-400 italic">
                  {{ t('tasks.detail.messages.taskCompletedNoEdit') }}
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('tasks.detail.fields.scheduleDate') }} <span class="text-red-500">*</span>
                </label>
                <flat-pickr
                  v-model="editForm.schedule_date"
                  :config="dateConfig"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="saving"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('tasks.detail.fields.location') }}
                </label>
                <input
                  v-model="editForm.location"
                  type="text"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="saving"
                />
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('tasks.detail.fields.startTime') }} <span class="text-red-500">*</span>
                </label>
                <flat-pickr
                  v-model="editForm.start_time"
                  :config="timeConfig"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="saving"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('tasks.detail.fields.endTime') }}
                </label>
                <flat-pickr
                  v-model="editForm.end_time"
                  :config="timeConfig"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="saving"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('tasks.detail.fields.description') }}
              </label>
              <textarea
                v-model="editForm.description"
                rows="3"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :disabled="saving"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('tasks.detail.fields.workRequirements') }}
              </label>
              <textarea
                v-model="editForm.work_requirements"
                rows="4"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :disabled="saving"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('tasks.detail.fields.notes') }}
              </label>
              <textarea
                v-model="editForm.notes"
                rows="2"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :disabled="saving"
              ></textarea>
            </div>

            <!-- Related Users -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('technicians.schedule.modal.relatedUsers') }}
              </label>
              <select
                v-model="editForm.related_user_ids"
                multiple
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-h-[100px]"
                :disabled="saving"
              >
                <option
                  v-for="user in assignableUsers"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.name }} ({{ getAssignableRoleLabel(user.role) }})
                </option>
              </select>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {{ t('technicians.schedule.modal.selectRelatedUsers') }}
              </p>
            </div>
          </form>
        </div>

        <!-- Related Information -->
        <div class="space-y-6">
          <!-- Ticket Link -->
          <div
            v-if="task.ticket_id"
            class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('tasks.detail.sections.relatedTicket') }}
            </h2>
            <div class="space-y-2">
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('tasks.detail.fields.ticketNumber') }}
                </label>
                <p class="mt-1">
                  <button
                    @click="$router.push(`/tickets/${task.ticket_id}`)"
                    class="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    #{{ task.ticket_number }}
                  </button>
                </p>
              </div>
              <div v-if="task.ticket_title">
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('tasks.detail.fields.ticketTitle') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white">
                  {{ task.ticket_title }}
                </p>
              </div>
              <div v-if="task.customer_name">
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('tasks.detail.fields.customer') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white">
                  {{ task.customer_name }}
                </p>
              </div>
            </div>
          </div>

          <!-- Additional Info -->
          <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('tasks.detail.sections.additionalInfo') }}
            </h2>
            <div class="space-y-2">
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('tasks.detail.fields.createdDate') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white">
                  {{ task.created_at ? formatDateTime(task.created_at) : t('common.na') }}
                </p>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('tasks.detail.fields.lastUpdated') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white">
                  {{ task.updated_at ? formatDateTime(task.updated_at) : t('common.na') }}
                </p>
              </div>
              <div v-if="task.completed_at">
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('tasks.detail.fields.completedAt') }}
                </label>
                <p class="mt-1 text-gray-900 dark:text-white">
                  {{ formatDateTime(task.completed_at) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Progress Update Section -->
          <div class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('tasks.detail.sections.progress') }}
            </h2>
            <div v-if="!isEditing" class="space-y-4">
              <!-- Status Display -->
              <div>
                <label class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ t('tasks.detail.fields.status') }}
                </label>
                <div class="mt-1">
                  <span
                    :class="[
                      'px-3 py-1 text-sm font-semibold rounded-full',
                      getTaskStatusClass(task.status),
                    ]"
                  >
                    {{ getTaskStatusLabel(task.status) }}
                  </span>
                </div>
              </div>
              
              <!-- Quick Status Update (for technicians and dev) -->
              <div v-if="canUpdateStatus && task.status !== 'completed'" class="space-y-2">
                <label class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ t('tasks.detail.actions.updateStatus') }}
                </label>
                <div class="flex gap-2 flex-wrap">
                  <button
                    v-if="task.status !== 'in_progress'"
                    @click="quickUpdateStatus('in_progress')"
                    :disabled="updatingStatus"
                    class="px-3 py-1.5 text-xs font-medium bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                  >
                    {{ t('tasks.detail.actions.startWork') }}
                  </button>
                  <button
                    v-if="task.status !== 'completed'"
                    @click="quickUpdateStatus('completed')"
                    :disabled="updatingStatus"
                    class="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {{ t('tasks.detail.actions.completeTask') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Activity Log -->
      <div
        v-if="task && !loading"
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 shadow-sm"
      >
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {{ t('tasks.detail.sections.activityLog') }}
        </h2>
        <div class="space-y-0">
          <div
            v-for="(activity, index) in activities"
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
              <div class="flex items-center gap-2">
                <p 
                  :class="[
                    'text-sm font-medium',
                    activity.isSystem 
                      ? 'text-gray-600 dark:text-gray-400 italic' 
                      : 'text-gray-900 dark:text-white'
                  ]"
                >
                  {{ activity.isSystem ? t('tasks.detail.status.system') : activity.user }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ formatDateTime(activity.timestamp) }}
                </p>
              </div>
              <p 
                :class="[
                  'text-sm mt-1',
                  activity.isSystem 
                    ? 'text-gray-700 dark:text-gray-300 italic' 
                    : 'text-gray-700 dark:text-gray-300'
                ]"
              >
                {{ activity.action }}
              </p>
              
              <!-- Display images if available -->
              <div v-if="activity.images && activity.images.length > 0" class="mt-3 grid grid-cols-4 gap-2">
                <div
                  v-for="(imageSrc, imgIndex) in activity.images"
                  :key="imgIndex"
                  class="relative group"
                >
                  <img 
                    :src="imageSrc" 
                    alt="Comment image" 
                    class="w-full h-24 object-cover rounded border border-gray-300 dark:border-gray-600 cursor-pointer hover:opacity-80 transition-opacity"
                    @click="openImageModal(imageSrc)"
                  />
                </div>
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
              :placeholder="t('tasks.detail.actions.commentPlaceholder')"
              class="w-full px-4 py-2 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
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
                id="task-comment-image-upload"
              />
              <label
                for="task-comment-image-upload"
                class="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                :title="t('tasks.detail.actions.attachImage')"
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
                :title="t('tasks.detail.actions.removeImage')"
              >
                ×
              </button>
            </div>
          </div>
          
          <button
            @click="addComment"
            :disabled="(!newComment.trim() && commentImageFiles.length === 0) || addingComment"
            class="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ addingComment ? t('tasks.detail.actions.addingComment') : t('tasks.detail.actions.addComment') }}
          </button>
        </div>
      </div>

      <!-- Add Related User Modal -->
      <div
        v-if="showAddRelatedUserModal"
        class="fixed inset-0 bg-gray-700/45 dark:bg-gray-900/65 flex items-center justify-center z-50"
        @click.self="showAddRelatedUserModal = false"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('tasks.detail.actions.addRelatedUser') }}
            </h3>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('technicians.schedule.modal.selectRelatedUsers') }}
              </label>
              <select
                v-model="selectedRelatedUserId"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                :disabled="updatingRelatedUsers"
              >
                <option value="">{{ t('tasks.detail.actions.selectUser') }}</option>
                <option
                  v-for="user in availableRelatedUsers"
                  :key="user.id"
                  :value="user.id"
                >
                  {{ user.name }} ({{ getAssignableRoleLabel(user.role) }})
                </option>
              </select>
            </div>

            <div class="flex gap-2 justify-end">
              <button
                @click="showAddRelatedUserModal = false"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                :disabled="updatingRelatedUsers"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                @click="addRelatedUser"
                :disabled="!selectedRelatedUserId || updatingRelatedUsers"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ updatingRelatedUsers ? t('common.saving') : t('tasks.detail.actions.addRelatedUser') }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Image Modal -->
      <div
        v-if="showImageModal"
        class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
        @click="closeImageModal"
      >
        <div class="relative max-w-4xl max-h-[90vh] mx-4">
          <button
            @click="closeImageModal"
            class="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
          >
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            :src="selectedImageSrc"
            alt="Full size image"
            class="max-w-full max-h-[90vh] object-contain rounded-lg"
            @click.stop
          />
        </div>
      </div>

      <!-- Extend Deadline Modal -->
      <div
        v-if="showExtendDeadlineModal"
        class="fixed inset-0 bg-gray-700/45 dark:bg-gray-900/65 flex items-center justify-center z-50"
        @click.self="showExtendDeadlineModal = false"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('tasks.detail.extendDeadline.title') }}
            </h3>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('tasks.detail.extendDeadline.currentDeadline') }}
              </label>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                {{ task?.schedule_date ? formatDate(task.schedule_date) : t('common.na') }}
              </p>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {{ t('tasks.detail.extendDeadline.newDeadline') }}
              </label>
              <flat-pickr
                v-model="newDeadlineDate"
                :config="dateConfig"
                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div class="flex gap-2 justify-end">
              <button
                @click="showExtendDeadlineModal = false"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                :disabled="extendingDeadline"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                @click="extendDeadline"
                :disabled="!newDeadlineDate || extendingDeadline"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ extendingDeadline ? t('common.saving') : t('tasks.detail.extendDeadline.confirm') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { scheduleService, type TechnicianSchedule } from '@/services/scheduleService'
import { useAuth, UserRole, hasRole } from '@/composables/useAuth'
import { formatDate, formatDateTime } from '@/utils/dateTime'
import flatPickr from 'vue-flatpickr-component'
import { useFlatpickrConfig } from '@/composables/useFlatpickr'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { getUser } = useAuth()

const task = ref<TechnicianSchedule | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const isEditing = ref(false)
const saving = ref(false)
const updatingStatus = ref(false)
const assignableUsers = ref<any[]>([])
const comments = ref<any[]>([])
const activities = ref<any[]>([])
const newComment = ref('')
const addingComment = ref(false)
const showAddRelatedUserModal = ref(false)
const selectedRelatedUserId = ref<number | ''>('')
const updatingRelatedUsers = ref(false)
const commentImagePreviews = ref<string[]>([])
const commentImageFiles = ref<File[]>([])
const showImageModal = ref(false)
const selectedImageSrc = ref('')
const commentTextarea = ref<HTMLTextAreaElement | null>(null)
const commentImageInput = ref<HTMLInputElement | null>(null)
const showExtendDeadlineModal = ref(false)
const newDeadlineDate = ref('')
const extendingDeadline = ref(false)

// Flatpickr configs
const { dateConfig, timeConfig, formatDateForFlatpickr } = useFlatpickrConfig()

const editForm = ref({
  title: '',
  technician_id: '',
  schedule_date: '',
  start_time: '',
  end_time: '',
  location: '',
  description: '',
  work_requirements: '',
  notes: '',
  status: 'scheduled',
  ticket_id: '',
  related_user_ids: [] as number[],
})

// Available users for adding as related users (excluding already added ones)
const availableRelatedUsers = computed(() => {
  if (!task.value || !assignableUsers.value.length) return assignableUsers.value
  
  const currentRelatedUserIds = task.value.related_users 
    ? task.value.related_users.map((u: any) => u.id)
    : []
  
  return assignableUsers.value.filter(user => !currentRelatedUserIds.includes(user.id))
})

const canEdit = computed(() => {
  return hasRole(UserRole.DEV)
})

const canUpdateStatus = computed(() => {
  const currentUser = getUser.value
  if (!currentUser || !task.value) return false
  
  // DEV can always update
  if (hasRole(UserRole.DEV)) return true
  
  // Technician can update if they are assigned to this task
  if (currentUser.role === UserRole.TECHNICIAN && currentUser.id === task.value.technician_id) {
    return true
  }
  
  // Admin can update
  if (hasRole(UserRole.ADMIN)) return true
  
  return false
})

const getTaskStatusClass = (status: string | null | undefined): string => {
  switch (status) {
    case 'scheduled':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
}

const getTaskStatusLabel = (status: string | null | undefined): string => {
  switch (status) {
    case 'scheduled':
      return t('technicians.schedule.statusOptions.scheduled')
    case 'in_progress':
      return t('technicians.schedule.statusOptions.inProgress')
    case 'completed':
      return t('technicians.schedule.statusOptions.completed')
    case 'cancelled':
      return t('technicians.schedule.statusOptions.cancelled')
    default:
      return status || t('common.na')
  }
}

const getAssignableRoleLabel = (role: string): string => {
  return role === UserRole.ADMIN || role === UserRole.DEV ? t('technicians.schedule.roleLabels.admin') : t('technicians.schedule.roleLabels.technician')
}

/**
 * Calculate days remaining or overdue based on deadline
 * Deadline is calculated from schedule_date + end_time (if end_time has date, use that; otherwise use schedule_date)
 * Returns positive number for days remaining, negative for days overdue, null if no deadline
 */
const calculateDaysRemaining = (task: any): number | null => {
  if (!task || !task.schedule_date) return null
  
  // If task is completed, don't show as overdue
  if (task.status === 'completed') {
    return null
  }
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Calculate deadline: if end_time exists, use schedule_date + end_time
  // Otherwise, use schedule_date only
  let deadlineDate = new Date(task.schedule_date)
  
  // If end_time exists, combine schedule_date with end_time to get full deadline datetime
  if (task.end_time) {
    const [hours, minutes] = task.end_time.split(':')
    if (hours && minutes) {
      deadlineDate = new Date(task.schedule_date)
      deadlineDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
    }
  }
  
  deadlineDate.setHours(0, 0, 0, 0)
  
  // Calculate difference in days
  const diffMs = deadlineDate.getTime() - today.getTime()
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  
  return diffDays
}

/**
 * Check if task is overdue
 */
const isTaskOverdue = (task: any): boolean => {
  if (!task) return false
  const daysRemaining = calculateDaysRemaining(task)
  return daysRemaining !== null && daysRemaining < 0
}

/**
 * Get formatted text for days remaining/overdue
 */
const getDaysRemainingText = (task: any): string => {
  if (!task) return t('common.na')
  const days = calculateDaysRemaining(task)
  if (days === null) return t('common.na')
  
  if (days < 0) {
    return t('dashboard.tasksTable.daysOverdueText', { count: Math.abs(days) })
  } else {
    return t('dashboard.tasksTable.daysRemainingText', { count: days })
  }
}

/**
 * Get overdue status class
 */
const getOverdueStatusClass = (task: any): string => {
  if (!task) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  
  const daysRemaining = calculateDaysRemaining(task)
  if (daysRemaining === null) {
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  }
  
  if (daysRemaining < 0) {
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  } else if (daysRemaining <= 3) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  } else {
    return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
  }
}

/**
 * Get overdue status text
 */
const getOverdueStatusText = (task: any): string => {
  if (!task) return t('common.na')
  
  const daysRemaining = calculateDaysRemaining(task)
  if (daysRemaining === null) {
    return t('common.na')
  }
  
  if (daysRemaining < 0) {
    return t('dashboard.tasksTable.overdue')
  } else if (daysRemaining <= 3) {
    return t('dashboard.tasksTable.approachingDeadline')
  } else {
    return t('dashboard.tasksTable.onTime')
  }
}

const loadTask = async () => {
  loading.value = true
  error.value = null
  try {
    const taskId = parseInt(route.params.id as string)
    task.value = await scheduleService.getSchedule(taskId)
    
    // Map comments from API response
    comments.value = (task.value as any).comments || []
    
    // Build activities from comments and task history
    buildActivities()
  } catch (err: any) {
    error.value = err?.message || t('tasks.detail.errors.loadError')
    console.error('Error loading task:', err)
  } finally {
    loading.value = false
  }
}

// Build activities list from comments
const buildActivities = () => {
  if (!task.value) return
  
  activities.value = []
  
  // Add task creation activity
  if (task.value.created_at) {
    activities.value.push({
      user: task.value.created_by_name || 'System',
      action: t('tasks.detail.status.created'),
      timestamp: new Date(task.value.created_at),
      isSystem: !task.value.created_by_name,
    })
  }
  
  // Add comments as activities
  comments.value.forEach((comment) => {
    // Check if comment has images (contains "📷 Đã đính kèm")
    let images: string[] = []
    const commentText = comment.comment || ''
    if (commentText.includes('📷') && commentText.includes('Đã đính kèm')) {
      // Try to get images from sessionStorage
      if (task.value) {
        try {
          const storedImagesData = sessionStorage.getItem(`task_${task.value.id}_images`)
          if (storedImagesData) {
            const imagesArray = JSON.parse(storedImagesData)
            // Find images that match this comment's timestamp (approximate match)
            const commentTime = new Date(comment.created_at).getTime()
            // Sort by timestamp descending and find the closest match
            const sortedImages = imagesArray
              .filter((imgData: any) => task.value && imgData.taskId === task.value.id)
              .sort((a: any, b: any) => Math.abs(b.commentTimestamp - commentTime) - Math.abs(a.commentTimestamp - commentTime))
            
            const matchedImages = sortedImages.find((imgData: any) => {
              // Match if timestamp is within 30 seconds of comment creation
              return Math.abs((imgData.commentTimestamp || imgData.timestamp) - commentTime) < 30000
            })
            if (matchedImages && matchedImages.images) {
              images = matchedImages.images
            }
          }
        } catch (e) {
          console.warn('Failed to parse stored images:', e)
        }
      }
    }
    
    activities.value.push({
      user: comment.user_name || 'Unknown',
      email: comment.user_email || null,
      phone: comment.user_phone || null,
      action: commentText,
      timestamp: new Date(comment.created_at),
      isSystem: false,
      images: images,
      commentId: comment.id,
    })
  })
  
  // Sort by timestamp (oldest first)
  activities.value.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
}

// Handle comment image selection
const handleCommentImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    Array.from(target.files).forEach((file) => {
      if (file.size <= 10 * 1024 * 1024) {
        // Max 10MB
        const reader = new FileReader()
        reader.onload = (e) => {
          commentImagePreviews.value.push(e.target?.result as string)
          commentImageFiles.value.push(file)
        }
        reader.readAsDataURL(file)
      } else {
        error.value = t('tasks.detail.errors.fileTooLarge', { name: file.name })
      }
    })
  }
  // Reset input to allow selecting the same file again
  if (target) {
    target.value = ''
  }
}

// Remove comment image
const removeCommentImage = (index: number) => {
  commentImagePreviews.value.splice(index, 1)
  commentImageFiles.value.splice(index, 1)
}

// Open image modal for viewing
const openImageModal = (imageSrc: string) => {
  selectedImageSrc.value = imageSrc
  showImageModal.value = true
}

// Close image modal
const closeImageModal = () => {
  showImageModal.value = false
  selectedImageSrc.value = ''
}

const addComment = async () => {
  if ((!newComment.value.trim() && commentImageFiles.value.length === 0) || !task.value) return

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
    await scheduleService.addComment(task.value.id, finalCommentText)
    
    // Store images in sessionStorage for display in activity log
    if (imagesToSave.length > 0) {
      const timestamp = Date.now()
      const imagesData = {
        taskId: task.value.id,
        images: imagesToSave,
        timestamp: timestamp,
        commentTimestamp: timestamp // Store when we created the comment
      }
      
      // Store in sessionStorage for current session
      const existingImages = JSON.parse(sessionStorage.getItem(`task_${task.value.id}_images`) || '[]')
      existingImages.push(imagesData)
      // Keep only last 50 entries to avoid sessionStorage getting too large
      const recentImages = existingImages.slice(-50)
      sessionStorage.setItem(`task_${task.value.id}_images`, JSON.stringify(recentImages))
    }
    
    // Clear image previews and files
    commentImagePreviews.value = []
    commentImageFiles.value = []
    
    // Reload task to get updated data with server timestamp
    await loadTask()
  } catch (err) {
    console.error('Error adding comment:', err)
    error.value = err instanceof Error ? err.message : t('tasks.detail.errors.addCommentError')
    // Restore comment text if there was an error
    newComment.value = commentText
  } finally {
    addingComment.value = false
  }
}

const loadAssignableUsers = async () => {
  try {
    assignableUsers.value = await scheduleService.getAssignableUsers()
  } catch (err) {
    console.error('Error loading assignable users:', err)
  }
}

const startEdit = () => {
  if (!task.value) return
  
  // Prevent editing if task is completed
  if (task.value.status === 'completed') {
    error.value = t('tasks.detail.messages.taskCompletedNoEdit')
    return
  }
  
  // Extract related user IDs
  const relatedUserIds = task.value.related_users && Array.isArray(task.value.related_users)
    ? task.value.related_users.map((u: any) => u.id)
    : []
  
  editForm.value = {
    title: task.value.title || '',
    technician_id: String(task.value.technician_id || ''),
    schedule_date: formatDateForFlatpickr(task.value.schedule_date) || '',
    start_time: task.value.start_time || '',
    end_time: task.value.end_time || '',
    location: task.value.location || '',
    description: task.value.description || '',
    work_requirements: task.value.work_requirements || '',
    notes: task.value.notes || '',
    status: task.value.status || 'scheduled',
    ticket_id: task.value.ticket_id ? String(task.value.ticket_id) : '',
    related_user_ids: relatedUserIds,
  }
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  editForm.value = {
    title: '',
    technician_id: '',
    schedule_date: '',
    start_time: '',
    end_time: '',
    location: '',
    description: '',
    work_requirements: '',
    notes: '',
    status: 'scheduled',
    ticket_id: '',
    related_user_ids: [],
  }
}

const saveTask = async () => {
  if (!task.value) return
  
  saving.value = true
  error.value = null
  
  try {
    const payload: any = {
      title: editForm.value.title,
      technician_id: parseInt(editForm.value.technician_id),
      schedule_date: editForm.value.schedule_date,
      start_time: editForm.value.start_time,
      status: editForm.value.status,
    }
    
    if (editForm.value.end_time) {
      payload.end_time = editForm.value.end_time
    }
    if (editForm.value.location) {
      payload.location = editForm.value.location
    }
    if (editForm.value.description) {
      payload.description = editForm.value.description
    }
    if (editForm.value.work_requirements) {
      payload.work_requirements = editForm.value.work_requirements
    }
    if (editForm.value.notes) {
      payload.notes = editForm.value.notes
    }
    if (editForm.value.ticket_id) {
      payload.ticket_id = parseInt(editForm.value.ticket_id)
    }
    
    // Add related user IDs (convert to numbers)
    if (editForm.value.related_user_ids && editForm.value.related_user_ids.length > 0) {
      payload.related_user_ids = Array.isArray(editForm.value.related_user_ids)
        ? editForm.value.related_user_ids.map(id => typeof id === 'string' ? parseInt(id) : id)
        : []
    } else {
      payload.related_user_ids = []
    }
    
    // Prevent editing if task is already completed
    if (task.value.status === 'completed') {
      error.value = t('tasks.detail.messages.taskCompletedNoEdit')
      isEditing.value = false
      return
    }
    
    // Check if status changed
    const oldStatus = task.value.status
    const statusChanged = editForm.value.status && editForm.value.status !== oldStatus
    
    // Handle completed_at based on status - record completion timestamp
    if (editForm.value.status === 'completed' && oldStatus !== 'completed') {
      payload.completed_at = new Date().toISOString()
    }
    
    task.value = await scheduleService.updateSchedule(task.value.id, payload)
    
    // Add activity log comment if status changed
    if (statusChanged) {
      try {
        const oldStatusLabel = getTaskStatusLabel(oldStatus)
        const newStatusLabel = getTaskStatusLabel(editForm.value.status)
        const comment = t('tasks.detail.messages.statusChanged', { 
          oldStatus: oldStatusLabel,
          newStatus: newStatusLabel
        })
        await scheduleService.addComment(task.value.id, comment)
      } catch (commentErr) {
        console.warn('Failed to add activity comment:', commentErr)
        // Don't fail the whole operation if comment fails
      }
    }
    
    // Reload task to get updated data
    await loadTask()
    
    isEditing.value = false
    // Show success message (optional - you can add a toast notification here)
    error.value = null
  } catch (err: any) {
    error.value = err?.message || t('tasks.detail.errors.saveError')
    console.error('Error saving task:', err)
  } finally {
    saving.value = false
  }
}

const quickUpdateStatus = async (newStatus: string) => {
  if (!task.value) return
  
  // Prevent updating status if task is already completed
  if (task.value.status === 'completed') {
    error.value = t('tasks.detail.messages.taskCompletedNoEdit')
    return
  }
  
  updatingStatus.value = true
  error.value = null
  
  try {
    const oldStatus = task.value.status
    const oldStatusLabel = getTaskStatusLabel(oldStatus)
    const newStatusLabel = getTaskStatusLabel(newStatus)
    
    const payload: any = {
      status: newStatus,
    }
    
    // If completing, set completed_at timestamp
    if (newStatus === 'completed') {
      payload.completed_at = new Date().toISOString()
    }
    
    // Update task status
    task.value = await scheduleService.updateSchedule(task.value.id, payload)
    
    // Add activity log comment
    try {
      const comment = t('tasks.detail.messages.statusChanged', { 
        oldStatus: oldStatusLabel,
        newStatus: newStatusLabel
      })
      await scheduleService.addComment(task.value.id, comment)
    } catch (commentErr) {
      console.warn('Failed to add activity comment:', commentErr)
      // Don't fail the whole operation if comment fails
    }
    
    // Reload task to get updated data including related_users
    await loadTask()
  } catch (err: any) {
    error.value = err?.message || t('tasks.detail.errors.saveError')
    console.error('Error updating task status:', err)
  } finally {
    updatingStatus.value = false
  }
}

// Add related user
const addRelatedUser = async () => {
  if (!selectedRelatedUserId.value || !task.value) return
  
  updatingRelatedUsers.value = true
  error.value = null
  
  try {
    const currentRelatedUserIds = task.value.related_users 
      ? task.value.related_users.map((u: any) => u.id)
      : []
    
    // Find the user being added
    const userToAdd = assignableUsers.value.find(u => u.id === selectedRelatedUserId.value)
    const userName = userToAdd?.name || 'N/A'
    
    // Add new user to the list
    const updatedRelatedUserIds = [...currentRelatedUserIds, selectedRelatedUserId.value]
    
    // Update task with new related users
    await scheduleService.updateSchedule(task.value.id, {
      related_user_ids: updatedRelatedUserIds,
    } as any)
    
    // Add activity log comment
    try {
      const comment = t('tasks.detail.messages.relatedUserAdded', { name: userName })
      await scheduleService.addComment(task.value.id, comment)
    } catch (commentErr) {
      console.warn('Failed to add activity comment:', commentErr)
      // Don't fail the whole operation if comment fails
    }
    
    // Reload task to get updated data
    await loadTask()
    
    // Reset modal
    selectedRelatedUserId.value = ''
    showAddRelatedUserModal.value = false
  } catch (err: any) {
    error.value = err?.message || t('tasks.detail.errors.saveError')
    console.error('Error adding related user:', err)
  } finally {
    updatingRelatedUsers.value = false
  }
}

// Remove related user
const removeRelatedUser = async (userId: number) => {
  if (!task.value) return
  
  updatingRelatedUsers.value = true
  error.value = null
  
  try {
    const currentRelatedUserIds = task.value.related_users 
      ? task.value.related_users.map((u: any) => u.id)
      : []
    
    // Find the user being removed
    const userToRemove = task.value.related_users?.find((u: any) => u.id === userId)
    const userName = userToRemove?.name || 'N/A'
    
    // Remove user from the list
    const updatedRelatedUserIds = currentRelatedUserIds.filter((id: number) => id !== userId)
    
    // Update task with updated related users
    await scheduleService.updateSchedule(task.value.id, {
      related_user_ids: updatedRelatedUserIds,
    } as any)
    
    // Add activity log comment
    try {
      const comment = t('tasks.detail.messages.relatedUserRemoved', { name: userName })
      await scheduleService.addComment(task.value.id, comment)
    } catch (commentErr) {
      console.warn('Failed to add activity comment:', commentErr)
      // Don't fail the whole operation if comment fails
    }
    
    // Reload task to get updated data
    await loadTask()
  } catch (err: any) {
    error.value = err?.message || t('tasks.detail.errors.saveError')
    console.error('Error removing related user:', err)
  } finally {
    updatingRelatedUsers.value = false
  }
}

// Open extend deadline modal
const openExtendDeadlineModal = () => {
  if (!task.value) return
  
  // Initialize with current deadline or tomorrow if no deadline
  if (task.value.schedule_date) {
    newDeadlineDate.value = formatDateForFlatpickr(task.value.schedule_date)
  } else {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    newDeadlineDate.value = formatDateForFlatpickr(tomorrow.toISOString().split('T')[0])
  }
  showExtendDeadlineModal.value = true
}

// Extend deadline
const extendDeadline = async () => {
  if (!newDeadlineDate.value || !task.value) return
  
  extendingDeadline.value = true
  error.value = null
  
  try {
    const oldDeadline = task.value.schedule_date ? formatDate(task.value.schedule_date) : 'N/A'
    
    // Update task schedule_date (deadline)
    await scheduleService.updateSchedule(task.value.id, {
      schedule_date: newDeadlineDate.value,
    })
    
    // Add activity log comment
    try {
      const newDeadlineFormatted = formatDate(newDeadlineDate.value)
      const comment = t('tasks.detail.messages.deadlineExtended', { 
        oldDeadline,
        newDeadline: newDeadlineFormatted
      })
      await scheduleService.addComment(task.value.id, comment)
    } catch (commentErr) {
      console.warn('Failed to add activity comment:', commentErr)
      // Don't fail the whole operation if comment fails
    }
    
    // Reload task to get updated data
    await loadTask()
    
    // Reset modal
    newDeadlineDate.value = ''
    showExtendDeadlineModal.value = false
  } catch (err: any) {
    error.value = err?.message || t('tasks.detail.errors.saveError')
    console.error('Error extending deadline:', err)
  } finally {
    extendingDeadline.value = false
  }
}

onMounted(async () => {
  await loadAssignableUsers()
  await loadTask()
})
</script>

