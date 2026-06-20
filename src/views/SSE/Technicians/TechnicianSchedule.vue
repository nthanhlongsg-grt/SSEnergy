<template>
  <admin-layout>
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ t('technicians.schedule.header.title') }}
          </h1>
          <p class="text-gray-500 dark:text-gray-400 mt-1">
            {{ t('technicians.schedule.header.subtitle') }}
          </p>
        </div>
        <div class="flex gap-2">
          <button
            v-if="canCreateSchedule"
            @click="openTaskModal"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <PlusIcon class="w-5 h-5" />
            {{ t('technicians.schedule.actions.createTask') }}
          </button>
          <button
            @click="viewMode = 'day'"
            :class="[
              'px-4 py-2 rounded-lg transition-colors',
              viewMode === 'day'
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
            ]"
          >
            {{ t('technicians.schedule.actions.day') }}
          </button>
          <button
            @click="viewMode = 'week'"
            :class="[
              'px-4 py-2 rounded-lg transition-colors',
              viewMode === 'week'
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
            ]"
          >
            {{ t('technicians.schedule.actions.week') }}
          </button>
          <button
            @click="viewMode = 'month'"
            :class="[
              'px-4 py-2 rounded-lg transition-colors',
              viewMode === 'month'
                ? 'bg-blue-600 text-white'
                : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700',
            ]"
          >
            {{ t('technicians.schedule.actions.month') }}
          </button>
        </div>
      </div>

      <!-- Date Navigation -->
      <div
        class="flex items-center justify-between rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
      >
        <button
          @click="previousPeriod"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronLeftIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <div class="text-center">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ currentPeriodLabel }}
          </h2>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ formatDateRange(currentDate, viewMode) }}
          </p>
        </div>
        <button
          @click="nextPeriod"
          class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ChevronRightIcon class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <button
          @click="goToToday"
          class="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {{ t('technicians.schedule.actions.today') }}
        </button>
      </div>

      <!-- Filters -->
      <div
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 shadow-sm"
      >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('technicians.schedule.filters.assignedPerson') }}
            </label>
            <select
              v-model="selectedUserId"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">{{ t('technicians.schedule.filters.all') }}</option>
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
              {{ t('technicians.schedule.filters.status') }}
            </label>
            <select
              v-model="filterStatus"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">{{ t('technicians.schedule.filters.all') }}</option>
              <option value="scheduled">{{ t('technicians.schedule.statusOptions.scheduled') }}</option>
              <option value="in_progress">{{ t('technicians.schedule.statusOptions.inProgress') }}</option>
              <option value="completed">{{ t('technicians.schedule.statusOptions.completed') }}</option>
              <option value="cancelled">{{ t('technicians.schedule.statusOptions.cancelled') }}</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              @click="clearFilters"
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {{ t('technicians.schedule.filters.clearFilters') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-500 dark:text-gray-400">{{ t('technicians.schedule.messages.loading') }}</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
        <p class="text-red-800 dark:text-red-200">{{ error }}</p>
      </div>

      <!-- Schedule View -->
      <div
        v-else-if="viewMode === 'day'"
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
      >
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 dark:divide-gray-700">
          <!-- User List -->
          <div class="p-4">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
              {{ t('technicians.schedule.list.assignedPeople') }}
            </h3>
            <div class="space-y-2 max-h-[600px] overflow-y-auto">
              <div
                v-for="user in filteredUsers"
                :key="user.id"
                @click="selectedUserId = user.id"
                :class="[
                  'p-3 rounded-lg border cursor-pointer transition-colors',
                  selectedUserId === user.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700',
                ]"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ user.name }}
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ getAssignableRoleLabel(user.role) }} - {{ user.code || `U${String(user.id).padStart(3, '0')}` }}
                    </p>
                  </div>
                  <span
                    :class="[
                      'px-2 py-1 text-xs font-semibold rounded-full',
                      getUserStatusClass(user),
                    ]"
                  >
                    {{ getUserStatusLabel(user) }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {{ getTodayTasksCount(user.id) }} {{ t('technicians.schedule.list.tasksToday') }}
                </p>
              </div>
              <div v-if="filteredUsers.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                {{ t('technicians.schedule.list.noData') }}
              </div>
            </div>
          </div>

          <!-- Schedule -->
          <div class="p-4">
            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
              {{ t('technicians.schedule.list.workSchedule') }} - {{ formatDate(currentDate) }}
            </h3>
            <div class="space-y-3 max-h-[600px] overflow-y-auto">
              <div
                v-for="task in todayTasks"
                :key="task.id"
                class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div class="flex items-start justify-between mb-2">
                  <div class="flex-1">
                    <div class="cursor-pointer" @click="task.isTicket ? viewTicket(task.ticket_id) : $router.push(`/tasks/${task.id}`)">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ task.title }}
                        <span v-if="task.isTicket" class="ml-2 text-xs text-blue-600 dark:text-blue-400">({{ t('technicians.schedule.task.fromTicket') }})</span>
                      </p>
                    </div>
                    <p v-if="task.technician_name" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {{ t('technicians.schedule.task.assignedTo') }} {{ task.technician_name }}
                    </p>
                    <p v-if="task.ticket_number" class="text-xs text-gray-500 dark:text-gray-400">
                      {{ t('technicians.schedule.task.ticket') }} #{{ task.ticket_number }}
                    </p>
                    <p v-if="task.customer_name" class="text-xs text-gray-500 dark:text-gray-400">
                      {{ t('technicians.schedule.task.customer') }} {{ task.customer_name }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2 ml-2">
                    <span
                      :class="[
                        'px-2 py-1 text-xs font-semibold rounded-full',
                        getTaskStatusClass(task.status),
                      ]"
                    >
                      {{ getTaskStatusLabel(task.status) }}
                    </span>
                    <button
                      v-if="canDeleteSchedule(task)"
                      @click.stop="confirmDeleteTask(task)"
                      class="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                      :title="t('technicians.schedule.task.deleteTask')"
                    >
                      <TrashIcon class="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                  <span>🕐 {{ task.start_time }} - {{ task.end_time || t('technicians.schedule.task.timeNotSet') }}</span>
                  <span v-if="task.location">📍 {{ task.location }}</span>
                </div>
                <div v-if="task.work_requirements" class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('technicians.schedule.task.workRequirements') }}
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {{ task.work_requirements }}
                  </p>
                </div>
                <div v-if="task.description" class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {{ t('technicians.schedule.task.description') }}
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {{ task.description }}
                  </p>
                </div>
              </div>
              <div v-if="todayTasks.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
                {{ t('technicians.schedule.task.noTasks') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Week/Month View -->
      <div
        v-else
        class="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-6"
      >
        <p class="text-center text-gray-500 dark:text-gray-400">
          {{ viewMode === 'week' ? t('technicians.schedule.messages.weekView') : t('technicians.schedule.messages.monthView') }}
        </p>
      </div>

      <!-- Add/Edit Task Modal -->
      <div
        v-if="showAddTaskModal"
        class="fixed inset-0 bg-gray-700/45 dark:bg-gray-900/65 flex items-start justify-center z-50 overflow-y-auto pt-20"
        @click.self="closeTaskModal"
      >
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 my-8 mb-20 max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ editingTask ? t('technicians.schedule.modal.titleEdit') : t('technicians.schedule.modal.titleCreate') }}
            </h3>

            <form @submit.prevent="handleSubmitTask" class="space-y-4">
              <!-- Assignee -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('technicians.schedule.modal.assignee') }} <span class="text-red-500">*</span>
                </label>
                <select
                  v-model="taskForm.technician_id"
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

              <!-- Title -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('technicians.schedule.modal.taskName') }} <span class="text-red-500">*</span>
                </label>
                <input
                  v-model="taskForm.title"
                  type="text"
                  required
                  :placeholder="t('technicians.schedule.modal.taskNamePlaceholder')"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="saving"
                />
              </div>

              <!-- Work Requirements -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('technicians.schedule.modal.workRequirements') }}
                </label>
                <textarea
                  v-model="taskForm.work_requirements"
                  rows="4"
                  :placeholder="t('technicians.schedule.modal.workRequirementsPlaceholder')"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="saving"
                ></textarea>
              </div>

              <!-- Date and Time -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('technicians.schedule.modal.executionDate') }} <span class="text-red-500">*</span>
                  </label>
                  <flat-pickr
                    v-model="taskForm.schedule_date"
                    :config="dateConfig"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    :disabled="saving"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('technicians.schedule.modal.status') }}
                  </label>
                  <select
                    v-model="taskForm.status"
                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    :disabled="saving"
                  >
                    <option value="scheduled">{{ t('technicians.schedule.statusOptions.scheduled') }}</option>
                    <option value="in_progress">{{ t('technicians.schedule.statusOptions.inProgress') }}</option>
                    <option value="completed">{{ t('technicians.schedule.statusOptions.completed') }}</option>
                  </select>
                </div>
              </div>

              <!-- Time Range -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('technicians.schedule.modal.startTime') }} <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <flat-pickr
                      v-model="taskForm.start_time"
                      :config="flatpickrDateTimeConfig"
                      class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      :disabled="saving"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('technicians.schedule.modal.endTime') }}
                  </label>
                  <div class="relative">
                    <flat-pickr
                      v-model="taskForm.end_time"
                      :config="flatpickrDateTimeConfig"
                      class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      :disabled="saving"
                    />
                  </div>
                </div>
              </div>

              <!-- Location -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('technicians.schedule.modal.location') }}
                </label>
                <input
                  v-model="taskForm.location"
                  type="text"
                  :placeholder="t('technicians.schedule.modal.locationPlaceholder')"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="saving"
                />
              </div>

              <!-- Ticket Link (Optional) -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('technicians.schedule.modal.linkTicket') }}
                </label>
                <select
                  v-model="taskForm.ticket_id"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="saving || loadingTickets"
                >
                  <option value="">{{ t('technicians.schedule.modal.noLink') }}</option>
                  <option
                    v-for="ticket in tickets"
                    :key="ticket.id"
                    :value="ticket.id"
                  >
                    {{ ticket.ticket_number }} - {{ ticket.title }}
                  </option>
                </select>
              </div>

              <!-- Related Users -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('technicians.schedule.modal.relatedUsers') }}
                </label>
                <div class="max-h-60 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg p-2 space-y-2 bg-white dark:bg-gray-700">
                  <div v-if="relatedUsersList.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    {{ t('technicians.schedule.modal.noRelatedUsers') || 'Không có người dùng nào khả dụng' }}
                  </div>
                  <label
                    v-for="user in relatedUsersList"
                    :key="user.id"
                    class="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                    :class="{ 'bg-blue-50 dark:bg-blue-900/20': isRelatedUserSelected(user.id) }"
                  >
                    <input
                      type="checkbox"
                      :checked="isRelatedUserSelected(user.id)"
                      @change="toggleRelatedUser(user.id)"
                      class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      :disabled="saving"
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
                            {{ getAssignableRoleLabel(user.role) }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                </div>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ t('technicians.schedule.modal.selectRelatedUsers') }}
                </p>
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('technicians.schedule.modal.notes') }}
                </label>
                <textarea
                  v-model="taskForm.notes"
                  rows="2"
                  :placeholder="t('technicians.schedule.modal.notesPlaceholder')"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="saving"
                ></textarea>
              </div>

              <!-- Error Message -->
              <div v-if="error" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                <p class="text-red-800 dark:text-red-200 text-sm">{{ error }}</p>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  v-if="editingTask && canDeleteSchedule(editingTask)"
                  type="button"
                  @click="confirmDeleteTask(editingTask)"
                  :disabled="saving"
                  class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ t('technicians.schedule.modal.deleteTask') }}
                </button>
                <div class="flex gap-3 ml-auto">
                  <button
                    type="button"
                    @click="closeTaskModal"
                    :disabled="saving"
                    class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {{ t('technicians.schedule.modal.cancel') }}
                  </button>
                  <button
                    type="submit"
                    :disabled="saving"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ saving ? (editingTask ? t('technicians.schedule.modal.updating') : t('technicians.schedule.modal.creating')) : (editingTask ? t('technicians.schedule.modal.update') : t('technicians.schedule.modal.createTask')) }}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import { apiClient } from '@/services/api'
import { useAuth, UserRole, hasRole } from '@/composables/useAuth'
import { formatDate } from '@/utils/dateTime'
import { PlusIcon, ChevronRightIcon, ChevronLeftIcon, TrashIcon } from '@/icons'
import flatPickr from 'vue-flatpickr-component'
import { useFlatpickrConfig } from '@/composables/useFlatpickr'

const { t } = useI18n()
const router = useRouter()
const { getUser } = useAuth()
const currentUser = computed(() => getUser.value)

// Flatpickr configs
const { dateConfig, dateTimeConfig, formatDateForFlatpickr, formatDateTimeForFlatpickr, convertFlatpickrDateTimeToISO } = useFlatpickrConfig()
const flatpickrDateTimeConfig = computed(() => dateTimeConfig)

const viewMode = ref<'day' | 'week' | 'month'>('day')
const currentDate = ref(new Date())
const selectedUserId = ref<number | ''>('')
const filterStatus = ref('')
const showAddTaskModal = ref(false)
const editingTask = ref<any>(null)
const loading = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const loadingTickets = ref(false)

const schedules = ref<any[]>([])
const assignableUsers = ref<any[]>([])
const tickets = ref<any[]>([])
const assignedTickets = ref<any[]>([]) // Tickets assigned to technicians

const taskForm = ref({
  technician_id: '',
  ticket_id: '',
  title: '',
  description: '',
  work_requirements: '',
  schedule_date: '',
  start_time: '',
  end_time: '',
  location: '',
  status: 'scheduled',
  notes: '',
  related_user_ids: [] as number[],
})

const canCreateSchedule = computed(() => {
  return hasRole(UserRole.ADMIN) || hasRole('SERVICE_CENTER' as UserRole)
})

const filteredUsers = computed(() => {
  return assignableUsers.value
})

// Filter users for Related Users section (only Admin and Technician)
const relatedUsersList = computed(() => {
  return assignableUsers.value.filter(user => 
    user.role === UserRole.ADMIN || user.role === UserRole.TECHNICIAN
  )
})

// Check if a user is selected in related users
const isRelatedUserSelected = (userId: number) => {
  return Array.isArray(taskForm.value.related_user_ids) && taskForm.value.related_user_ids.includes(userId)
}

// Toggle related user selection
const toggleRelatedUser = (userId: number) => {
  if (!Array.isArray(taskForm.value.related_user_ids)) {
    taskForm.value.related_user_ids = []
  }
  
  const index = taskForm.value.related_user_ids.indexOf(userId)
  if (index > -1) {
    taskForm.value.related_user_ids.splice(index, 1)
  } else {
    taskForm.value.related_user_ids.push(userId)
  }
}

const todayTasks = computed(() => {
  const today = formatDateForFilter(currentDate.value)
  
  // Get schedules for selected date
  const scheduleTasks = schedules.value.filter((task) => {
    // Compare dates (both schedule_date and selected date should be in YYYY-MM-DD format)
    const taskDate = task.schedule_date ? formatDateForFilter(new Date(task.schedule_date)) : ''
    const matchesDate = taskDate === today || task.schedule_date === today
    
    // Compare technician_id (handle both number and string types)
    const matchesTechnician = !selectedUserId.value || 
      task.technician_id === selectedUserId.value || 
      String(task.technician_id) === String(selectedUserId.value)
    
    // Match status filter
    const matchesStatus = !filterStatus.value || task.status === filterStatus.value
    
    return matchesDate && matchesTechnician && matchesStatus
  })

  // Get tickets assigned (not already linked to a schedule)
  // Show all active tickets assigned to technician, regardless of creation date
  const ticketTasks = assignedTickets.value
    .filter((ticket) => {
      // Only include tickets assigned to selected technician (or all if none selected)
      const matchesTechnician = !selectedUserId.value || ticket.assigned_to === selectedUserId.value
      
      // Only include tickets that are not already linked to a schedule for today
      const hasSchedule = schedules.value.some(s => s.ticket_id === ticket.id && s.schedule_date === today)
      
      // Only show active tickets (not closed/completed)
      const isActive = ticket.status !== 'closed' && ticket.status !== 'completed'
      
      // Map ticket status to schedule status for filtering
      const ticketStatusMap: Record<string, string> = {
        'initialized': 'scheduled',
        'new': 'scheduled',
        'assigned': 'scheduled',
        'in_progress': 'in_progress',
        'waiting_parts': 'scheduled',
        'closed': 'completed',
        'completed': 'completed',
      }
      const mappedStatus = ticketStatusMap[ticket.status] || ticket.status
      const matchesStatus = !filterStatus.value || mappedStatus === filterStatus.value
      
      return matchesTechnician && !hasSchedule && isActive && matchesStatus
    })
    .map((ticket) => {
      // Convert ticket to task-like format
      // Use created_at for display, but show it as today's task
      const ticketDate = new Date(ticket.created_at)
      const ticketDateStr = formatDateForFilter(ticketDate)
      
      return {
        id: `ticket-${ticket.id}`, // Prefix to avoid conflicts
        ticket_id: ticket.id,
        title: ticket.title || ticket.ticket_number,
        description: ticket.description,
        schedule_date: today, // Always show as today's task
        start_time: ticketDateStr === today ? new Date(ticket.created_at).toTimeString().slice(0, 5) : '09:00',
        end_time: null,
        location: ticket.customer_address || null,
        status: ticket.status === 'in_progress' ? 'in_progress' : 
                (ticket.status === 'closed' || ticket.status === 'completed' ? 'completed' : 'scheduled'),
        technician_id: ticket.assigned_to,
        technician_name: ticket.assigned_to_name,
        ticket_number: ticket.ticket_number,
        customer_name: ticket.customer_name,
        work_requirements: null,
        notes: null,
        isTicket: true, // Flag to identify tickets
      }
    })

  // Combine and sort
  const allTasks = [...scheduleTasks, ...ticketTasks]
  
  return allTasks.sort((a, b) => {
    if (!a.start_time) return 1
    if (!b.start_time) return -1
    return a.start_time.localeCompare(b.start_time)
  })
})

const currentPeriodLabel = computed(() => {
  if (viewMode.value === 'day') {
    return formatDate(currentDate.value)
  } else if (viewMode.value === 'week') {
    return t('technicians.schedule.actions.week')
  } else {
    return t('technicians.schedule.actions.month')
  }
})

const formatDateForFilter = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDateRange = (date: Date, mode: string): string => {
  return formatDate(date)
}

const getTodayTasksCount = (userId: number): number => {
  const today = formatDateForFilter(currentDate.value)
  
  // Count schedules for selected date
  const scheduleCount = schedules.value.filter((task) => {
    const taskDate = task.schedule_date ? formatDateForFilter(new Date(task.schedule_date)) : ''
    const matchesDate = taskDate === today || task.schedule_date === today
    const matchesUser = task.technician_id === userId || String(task.technician_id) === String(userId)
    return matchesDate && matchesUser
  }).length
  
  // Count tickets (not already linked to a schedule)
  // Count all active tickets assigned to the user
  const ticketCount = assignedTickets.value.filter((ticket) => {
    if (ticket.assigned_to !== userId) return false
    
    // Only count active tickets
    const isActive = ticket.status !== 'closed' && ticket.status !== 'completed'
    const hasSchedule = schedules.value.some(s => s.ticket_id === ticket.id && s.schedule_date === today)
    
    return isActive && !hasSchedule
  }).length
  
  return scheduleCount + ticketCount
}

const getUserStatusClass = (user: any): string => {
  const today = formatDateForFilter(currentDate.value)
  const userTasks = schedules.value.filter(
    (t) => t.technician_id === user.id && t.schedule_date === today
  )
  const hasInProgress = userTasks.some(t => t.status === 'in_progress')
  const hasScheduled = userTasks.some(t => t.status === 'scheduled')
  
  if (hasInProgress) {
    return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
  } else if (hasScheduled) {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  }
  return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
}

const getUserStatusLabel = (user: any): string => {
  const today = formatDateForFilter(currentDate.value)
  const userTasks = schedules.value.filter(
    (t) => t.technician_id === user.id && t.schedule_date === today
  )
  const hasInProgress = userTasks.some(t => t.status === 'in_progress')
  const hasScheduled = userTasks.some(t => t.status === 'scheduled')
  
  if (hasInProgress) {
    return t('technicians.schedule.userStatus.working')
  } else if (hasScheduled) {
    return t('technicians.schedule.userStatus.hasSchedule')
  }
  return t('technicians.schedule.userStatus.ready')
}

const getAssignableRoleLabel = (role: string): string => {
  return role === UserRole.ADMIN || role === UserRole.DEV ? t('technicians.schedule.roleLabels.admin') : t('technicians.schedule.roleLabels.technician')
}

const getTaskStatusClass = (status: string): string => {
  const classes: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  }
  return classes[status] || classes.scheduled
}

const getTaskStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    scheduled: t('technicians.schedule.statusOptions.scheduled'),
    in_progress: t('technicians.schedule.statusOptions.inProgress'),
    completed: t('technicians.schedule.statusOptions.completed'),
    cancelled: t('technicians.schedule.statusOptions.cancelled'),
  }
  return labels[status] || status
}

const previousPeriod = () => {
  if (viewMode.value === 'day') {
    currentDate.value = new Date(currentDate.value.getTime() - 24 * 60 * 60 * 1000)
  }
}

const nextPeriod = () => {
  if (viewMode.value === 'day') {
    currentDate.value = new Date(currentDate.value.getTime() + 24 * 60 * 60 * 1000)
  }
}

const goToToday = () => {
  currentDate.value = new Date()
}

const clearFilters = () => {
  selectedUserId.value = ''
  filterStatus.value = ''
}

const openTaskModal = () => {
  editingTask.value = null
  error.value = null
  resetTaskForm()
  showAddTaskModal.value = true
}

const closeTaskModal = () => {
  showAddTaskModal.value = false
  editingTask.value = null
  error.value = null
  resetTaskForm()
}

const resetTaskForm = () => {
  const today = formatDateForFlatpickr(new Date())
  const now = new Date()
  const defaultStartTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  
  taskForm.value = {
    technician_id: '',
    ticket_id: '',
    title: '',
    description: '',
    work_requirements: '',
    schedule_date: today,
    start_time: defaultStartTime,
    end_time: '',
    location: '',
    status: 'scheduled',
    notes: '',
    related_user_ids: [],
  }
}

const handleSubmitTask = async () => {
  if (!taskForm.value.technician_id || !taskForm.value.title || !taskForm.value.schedule_date || !taskForm.value.start_time) {
    error.value = t('technicians.schedule.messages.fillRequired')
    return
  }

  saving.value = true
  error.value = null

  try {
    // Extract time from datetime strings (start_time and end_time may contain date+time or just time)
    let startTime = taskForm.value.start_time
    let endTime = taskForm.value.end_time || null
    
    // If start_time contains date (YYYY-MM-DD HH:mm format), extract time part
    if (startTime && startTime.includes(' ')) {
      const parts = startTime.split(' ')
      if (parts.length >= 2) {
        startTime = parts[1] // Extract time part (HH:mm)
        // Also update schedule_date if the date in start_time is different
        if (parts[0]) {
          taskForm.value.schedule_date = parts[0]
        }
      }
    }
    
    // Same for end_time
    if (endTime && endTime.includes(' ')) {
      const parts = endTime.split(' ')
      if (parts.length >= 2) {
        endTime = parts[1] // Extract time part (HH:mm)
      }
    }

    const payload: any = {
      technician_id: parseInt(taskForm.value.technician_id),
      title: taskForm.value.title,
      schedule_date: taskForm.value.schedule_date,
      start_time: startTime,
      status: taskForm.value.status,
    }

    if (taskForm.value.ticket_id) {
      payload.ticket_id = parseInt(taskForm.value.ticket_id)
    }
    if (taskForm.value.description) {
      payload.description = taskForm.value.description
    }
    if (taskForm.value.work_requirements) {
      payload.work_requirements = taskForm.value.work_requirements
    }
    if (endTime) {
      payload.end_time = endTime
    }
    if (taskForm.value.location) {
      payload.location = taskForm.value.location
    }
    if (taskForm.value.notes) {
      payload.notes = taskForm.value.notes
    }
    
    // Add related user IDs (convert to numbers)
    if (taskForm.value.related_user_ids && taskForm.value.related_user_ids.length > 0) {
      payload.related_user_ids = Array.isArray(taskForm.value.related_user_ids)
        ? taskForm.value.related_user_ids.map(id => typeof id === 'string' ? parseInt(id) : id)
        : []
    } else {
      payload.related_user_ids = []
    }

    if (editingTask.value) {
      await apiClient.put(`/schedules/${editingTask.value.id}`, payload)
    } else {
      await apiClient.post('/schedules', payload)
    }

    await loadSchedules()
    closeTaskModal()
  } catch (err: any) {
    console.error('Error saving task:', err)
    error.value = err?.error || t('technicians.schedule.messages.saveError')
  } finally {
    saving.value = false
  }
}

const viewTask = (taskId: number) => {
  const task = schedules.value.find(t => t.id === taskId)
  if (task) {
    editingTask.value = task
    const scheduleDate = task.schedule_date || formatDateForFilter(new Date())
    
    // Extract related user IDs
    const relatedUserIds = task.related_users && Array.isArray(task.related_users)
      ? task.related_users.map((u: any) => u.id)
      : []
    
    taskForm.value = {
      technician_id: task.technician_id.toString(),
      ticket_id: task.ticket_id ? task.ticket_id.toString() : '',
      title: task.title || '',
      description: task.description || '',
      work_requirements: task.work_requirements || '',
      schedule_date: formatDateForFlatpickr(scheduleDate),
      start_time: task.start_time || '',
      end_time: task.end_time || '',
      location: task.location || '',
      status: task.status || 'scheduled',
      notes: task.notes || '',
      related_user_ids: relatedUserIds,
    }
    showAddTaskModal.value = true
  }
}

const viewTicket = (ticketId: number) => {
  // Navigate to ticket detail page
  router.push(`/tickets/${ticketId}`)
}

const loadAssignableUsers = async () => {
  if (!canCreateSchedule.value) return
  
  try {
    const response = await apiClient.get('/schedules/assignable-users')
    if (response.error) {
      throw new Error(response.error)
    }
    assignableUsers.value = Array.isArray(response.data) ? response.data : []
  } catch (err) {
    console.error('Error loading assignable users:', err)
  }
}

const loadTickets = async () => {
  loadingTickets.value = true
  try {
    // Load all tickets for the dropdown in modal
    const response = await apiClient.get('/tickets?limit=1000')
    if (response.error) {
      throw new Error(response.error)
    }
    const data = response.data as any
    const allTickets = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
    tickets.value = allTickets
    
    // Filter tickets that are assigned to someone (not null)
    assignedTickets.value = allTickets.filter((t: any) => t.assigned_to !== null && t.assigned_to !== undefined)
  } catch (err) {
    console.error('Error loading tickets:', err)
  } finally {
    loadingTickets.value = false
  }
}

const loadSchedules = async () => {
  loading.value = true
  error.value = null
  try {
    // Load all schedules (without date filter) to ensure we can show tasks for any selected date
    const response = await apiClient.get(`/schedules?limit=1000`)
    if (response.error) {
      throw new Error(response.error)
    }
    const data = response.data as any
    schedules.value = Array.isArray(data?.data) ? data.data : (Array.isArray(data) ? data : [])
  } catch (err) {
    console.error('Error loading schedules:', err)
    error.value = t('technicians.schedule.messages.loadError')
  } finally {
    loading.value = false
  }
}

const canDeleteSchedule = (task: any): boolean => {
  return hasRole(UserRole.DEV)
}

const confirmDeleteTask = async (task: any) => {
  if (!confirm(t('technicians.schedule.messages.deleteConfirm', { title: task.title }))) {
    return
  }

  try {
    await apiClient.delete(`/schedules/${task.id}`)
    await loadSchedules()
    if (editingTask.value?.id === task.id) {
      closeTaskModal()
    }
  } catch (err: any) {
    console.error('Error deleting task:', err)
    error.value = err?.error || t('technicians.schedule.messages.deleteError')
  }
}

// Watch date change to reload schedules and tickets
watch([currentDate, viewMode], () => {
  loadSchedules()
  loadTickets() // Reload tickets to update assigned tickets
})

// Initialize
onMounted(async () => {
  await loadAssignableUsers()
  await loadTickets()
  await loadSchedules()
  resetTaskForm()
})
</script>
