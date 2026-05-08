                  <template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div
      class="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div
        class="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 p-4 dark:border-gray-800"
      >
        <div class="flex flex-wrap items-end gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('calendar.filters.technician') }}
            </label>
            <select
              v-model="technicianFilter"
              :disabled="loadingUsers"
              class="w-56 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">{{ t('calendar.filters.all') }}</option>
              <option v-for="tech in assignableUsers" :key="tech.id" :value="tech.id">
                {{ tech.name }} ({{ getAssignableRoleLabel(tech.role) }})
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('calendar.filters.status') }}
            </label>
            <select
              v-model="statusFilter"
              class="w-48 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              <option value="">{{ t('calendar.filters.all') }}</option>
              <option v-for="status in statusOptions" :key="status.value" :value="status.value">
                {{ status.label }}
              </option>
            </select>
          </div>
        </div>
        <button
          v-if="canManageSchedules"
          @click="openCreateModal()"
          class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + {{ t('calendar.actions.assign') }}
        </button>
      </div>

      <div v-if="fetchError" class="px-4 py-3 text-sm text-red-600 dark:text-red-400">
        {{ fetchError }}
      </div>
      <div
        v-else-if="loadingEvents"
        class="flex items-center gap-2 px-4 py-3 text-sm text-gray-500 dark:text-gray-400"
      >
        <span class="inline-block h-3 w-3 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></span>
        {{ t('calendar.loading.schedules') }}
      </div>

      <div class="flex flex-wrap gap-4 px-4 pb-4 text-xs text-gray-500 dark:text-gray-400">
        <div v-for="status in statusOptions" :key="status.value" class="flex items-center gap-2">
          <span :class="['h-3 w-3 rounded-full', getStatusColorClass(status.value)]"></span>
          {{ status.label }}
        </div>
      </div>

      <div class="custom-calendar">
        <FullCalendar ref="calendarRef" class="min-h-screen" :options="calendarOptions" />
      </div>

      <Modal v-if="isOpen" @close="closeModal">
        <template #body>
          <div
            class="no-scrollbar relative w-full max-w-[900px] max-h-[calc(100vh-4rem)] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900"
          >
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 sticky top-0 bg-white dark:bg-gray-900 z-10 pb-2">
              {{ selectedScheduleId ? t('technicians.schedule.modal.titleEdit') : t('technicians.schedule.modal.titleCreate') }}
            </h3>

            <div v-if="formError" class="mb-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
              <p class="text-red-800 dark:text-red-200 text-sm">{{ formError }}</p>
            </div>
            <div v-if="formSuccess" class="mb-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
              <p class="text-green-800 dark:text-green-200 text-sm">{{ formSuccess }}</p>
            </div>

            <form @submit.prevent="handleAddOrUpdateEvent" class="space-y-4">
              <!-- Assignee -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('technicians.schedule.modal.assignee') }} <span class="text-red-500">*</span>
                </label>
                <select
                  v-model.number="scheduleForm.technician_id"
                  required
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="isSaving"
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
                  v-model="scheduleForm.title"
                  type="text"
                  required
                  :placeholder="t('technicians.schedule.modal.taskNamePlaceholder')"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="isSaving"
                />
              </div>

              <!-- Work Requirements -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('technicians.schedule.modal.workRequirements') }}
                </label>
                <textarea
                  v-model="scheduleForm.work_requirements"
                  rows="4"
                  :placeholder="t('technicians.schedule.modal.workRequirementsPlaceholder')"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="isSaving"
                ></textarea>
              </div>

              <!-- Time Range -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('technicians.schedule.modal.startTime') }} <span class="text-red-500">*</span>
                  </label>
                  <div class="relative">
                    <flat-pickr
                      v-model="scheduleForm.start_time"
                      :config="flatpickrDateTimeConfig"
                      class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      :disabled="isSaving"
                    />
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {{ t('technicians.schedule.modal.endTime') }}
                  </label>
                  <div class="relative">
                    <flat-pickr
                      v-model="scheduleForm.end_time"
                      :config="flatpickrDateTimeConfig"
                      class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      :disabled="isSaving"
                    />
                  </div>
                </div>
              </div>

              <!-- Days Remaining (computed) -->
              <div v-if="daysRemaining !== null" class="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3">
                <p class="text-sm text-blue-800 dark:text-blue-200">
                  <span class="font-medium">{{ t('calendar.daysRemaining.label') }}</span> 
                  <span class="font-bold">{{ daysRemaining }}</span> {{ t('calendar.daysRemaining.unit') }}
                </p>
              </div>

              <!-- Location -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('technicians.schedule.modal.location') }}
                </label>
                <input
                  v-model="scheduleForm.location"
                  type="text"
                  :placeholder="t('technicians.schedule.modal.locationPlaceholder')"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="isSaving"
                />
              </div>

              <!-- Ticket Link (Optional) -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {{ t('technicians.schedule.modal.linkTicket') }}
                </label>
                <select
                  v-model="scheduleForm.ticket_id"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="isSaving || loadingTickets"
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
                    {{ t('technicians.schedule.modal.noRelatedUsers') }}
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
                      :disabled="isSaving"
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
                  v-model="scheduleForm.notes"
                  rows="2"
                  :placeholder="t('technicians.schedule.modal.notesPlaceholder')"
                  class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  :disabled="isSaving"
                ></textarea>
              </div>

              <!-- Actions -->
              <div class="flex gap-3 justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  v-if="selectedScheduleId && canManageSchedules"
                  type="button"
                  @click="handleDeleteEvent"
                  :disabled="isSaving"
                  class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ t('technicians.schedule.modal.deleteTask') }}
                </button>
                <div class="flex gap-3 ml-auto">
                  <button
                    type="button"
                    @click="closeModal"
                    :disabled="isSaving"
                    class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {{ t('technicians.schedule.modal.cancel') }}
                  </button>
                  <button
                    type="submit"
                    :disabled="isSaving"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {{ isSaving ? (selectedScheduleId ? t('technicians.schedule.modal.updating') : t('technicians.schedule.modal.creating')) : (selectedScheduleId ? t('technicians.schedule.modal.update') : t('technicians.schedule.modal.createTask')) }}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </template>
      </Modal>

      <!-- Day Tasks Modal -->
      <Modal v-if="isDayTasksModalOpen" @close="isDayTasksModalOpen = false">
        <template #body>
          <div
            class="no-scrollbar relative w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8"
          >
            <div class="flex items-center justify-between mb-4">
              <h5 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ t('calendar.dayTasks.title', { date: formatDate(selectedDate) }) }}
              </h5>
              <button
                v-if="canManageSchedules"
                @click="handleAddTaskForDate"
                class="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                + {{ t('calendar.actions.assign') }}
              </button>
            </div>
            
            <div v-if="dayTasks.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
              {{ t('calendar.dayTasks.empty') }}
            </div>
            
            <div v-else class="space-y-3">
              <div
                v-for="task in dayTasks"
                :key="task.id"
                class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                @click="handleTaskClick(task)"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <span
                        :class="[
                          'w-2 h-2 rounded-full flex-shrink-0',
                          getStatusColorClass(task.status)
                        ]"
                      ></span>
                      <span class="font-semibold text-gray-900 dark:text-white">{{ task.title }}</span>
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <div v-if="task.technicianName">
                        <span class="font-medium">{{ t('calendar.dayTasks.technician') }}</span> {{ task.technicianName }}
                      </div>
                      <div v-if="task.startTime || task.endTime">
                        <span class="font-medium">{{ t('calendar.dayTasks.time') }}</span>
                        {{ task.startTime || '' }}{{ task.startTime && task.endTime ? ' - ' : '' }}{{ task.endTime || '' }}
                      </div>
                      <div v-if="task.location">
                        <span class="font-medium">{{ t('calendar.dayTasks.location') }}</span> {{ task.location }}
                      </div>
                      <div v-if="task.ticketNumber">
                        <span class="font-medium">{{ t('calendar.dayTasks.ticket') }}</span> #{{ task.ticketNumber }}
                      </div>
                      <div v-if="task.customerName">
                        <span class="font-medium">{{ t('calendar.dayTasks.customer') }}</span> {{ task.customerName }}
                      </div>
                    </div>
                  </div>
                  <span
                    :class="[
                      'px-2 py-1 rounded text-xs font-medium',
                      task.status === 'scheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      task.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                      task.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    ]"
                  >
                    {{ statusOptions.find(s => s.value === task.status)?.label || task.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Modal>
    </div>
  </AdminLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useI18n } from 'vue-i18n'

import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import Modal from '@/components/profile/Modal.vue'
import { scheduleService, type TechnicianSchedule } from '@/services/scheduleService'
import { hasAnyRole, UserRole, getUserRole } from '@/composables/useAuth'
import flatPickr from 'vue-flatpickr-component'
import { useFlatpickrConfig } from '@/composables/useFlatpickr'
import { apiClient } from '@/services/api'

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const currentPageTitle = computed(() => t('calendar.pageTitle'))

// Format date using i18n locale
const formatDate = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return 'N/A'
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  if (isNaN(date.getTime())) return 'N/A'
  
  const localeCode = locale.value === 'vi' ? 'vi-VN' : 'en-US'
  
  return new Intl.DateTimeFormat(localeCode, {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

const calendarRef = ref()
const events = ref<any[]>([])
const isOpen = ref(false)
const loadingEvents = ref(false)
const fetchError = ref<string | null>(null)
const loadingUsers = ref(false)

const assignableUsers = ref<any[]>([])
const technicianFilter = ref<string | number>('')
const statusFilter = ref('')

const selectedScheduleId = ref<number | null>(null)
const selectedEventMeta = ref<any>(null)

const formError = ref<string | null>(null)
const formSuccess = ref<string | null>(null)
const isSaving = ref(false)

// Day tasks modal
const isDayTasksModalOpen = ref(false)
const selectedDate = ref<string>('')
const dayTasks = ref<any[]>([])

const scheduleForm = reactive({
  technician_id: '' as number | '',
  title: '',
  schedule_date: '',
  start_time: '',
  end_time: '',
  location: '',
  work_requirements: '',
  notes: '',
  status: 'scheduled',
  ticket_id: '',
  related_user_ids: [] as number[],
})

// Flatpickr configs
const { dateTimeConfig, formatDateTimeForFlatpickr, convertFlatpickrDateTimeToISO } = useFlatpickrConfig()
const flatpickrDateTimeConfig = computed(() => {
  try {
    const userRole = getUserRole.value
    const config: any = { ...dateTimeConfig }
    
    // Only DEV can select past dates
    // ADMIN, TECHNICIAN, SERVICE_CENTER cannot select past dates
    if (userRole && userRole !== UserRole.DEV) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      config.minDate = today
    }
    
    return config
  } catch (error) {
    console.error('Error in flatpickrDateTimeConfig:', error)
    return dateTimeConfig
  }
})

// Tickets for dropdown
const tickets = ref<any[]>([])
const loadingTickets = ref(false)

const STATUS_SEQUENCE = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const

const statusOptions = computed(() =>
  STATUS_SEQUENCE.map((value) => ({
    value,
    label: t(`calendar.statuses.${value}`),
  })),
)

const statusColorMap: Record<string, string> = {
  scheduled: 'primary',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'danger',
}

const canManageSchedules = computed(() =>
  hasAnyRole([UserRole.ADMIN, UserRole.DEV, UserRole.SERVICE_CENTER])
)

const resetForm = () => {
  scheduleForm.technician_id = ''
  scheduleForm.title = ''
  scheduleForm.schedule_date = ''
  scheduleForm.start_time = ''
  scheduleForm.end_time = ''
  scheduleForm.location = ''
  scheduleForm.work_requirements = ''
  scheduleForm.notes = ''
  scheduleForm.status = 'scheduled'
  scheduleForm.ticket_id = ''
  scheduleForm.related_user_ids = []
  selectedScheduleId.value = null
  selectedEventMeta.value = null
  formError.value = null
  formSuccess.value = null
}

// Calculate days remaining from start_time to end_time (or to now if no end_time)
const daysRemaining = computed(() => {
  if (!scheduleForm.start_time) return null
  
  try {
    let startDate: Date
    let endDate: Date
    
    // Parse start_time (can be datetime or just time)
    if (scheduleForm.start_time.includes(' ')) {
      // Has date and time: YYYY-MM-DD HH:mm
      startDate = new Date(scheduleForm.start_time.replace(' ', 'T'))
    } else {
      // Only time, use today's date
      const today = new Date()
      const [hours, minutes] = scheduleForm.start_time.split(':')
      startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(hours), parseInt(minutes))
    }
    
    // Parse end_time or use current date
    if (scheduleForm.end_time && scheduleForm.end_time.trim()) {
      if (scheduleForm.end_time.includes(' ')) {
        // Has date and time
        endDate = new Date(scheduleForm.end_time.replace(' ', 'T'))
      } else {
        // Only time, use same date as start
        const [hours, minutes] = scheduleForm.end_time.split(':')
        endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), parseInt(hours), parseInt(minutes))
      }
    } else {
      // No end_time, use current date
      endDate = new Date()
    }
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return null
    }
    
    // Calculate difference in days
    const diffTime = endDate.getTime() - startDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays >= 0 ? diffDays : 0
  } catch (error) {
    console.error('Error calculating days remaining:', error)
    return null
  }
})

// Filter users for Related Users section (only Admin and Technician, excluding assigned user and System)
const relatedUsersList = computed(() => {
  const assignedUserId = scheduleForm.technician_id ? Number(scheduleForm.technician_id) : null
  
  return assignableUsers.value.filter(user => {
    // Exclude System users
    if (user.name && user.name.toLowerCase().includes('system')) {
      return false
    }
    // Exclude assigned user
    if (assignedUserId && user.id === assignedUserId) {
      return false
    }
    // Only Admin and Technician
    return user.role === UserRole.ADMIN || user.role === UserRole.TECHNICIAN
  })
})

// Check if a user is selected in related users
const isRelatedUserSelected = (userId: number) => {
  return Array.isArray(scheduleForm.related_user_ids) && scheduleForm.related_user_ids.includes(userId)
}

// Toggle related user selection
const toggleRelatedUser = (userId: number) => {
  if (!Array.isArray(scheduleForm.related_user_ids)) {
    scheduleForm.related_user_ids = []
  }
  
  const index = scheduleForm.related_user_ids.indexOf(userId)
  if (index > -1) {
    scheduleForm.related_user_ids.splice(index, 1)
  } else {
    scheduleForm.related_user_ids.push(userId)
  }
}

// Load tickets for dropdown
const loadTickets = async () => {
  loadingTickets.value = true
  try {
    const response = await apiClient.get('/tickets?limit=1000')
    if (response.error) {
      console.error('Error loading tickets:', response.error)
      return
    }
    tickets.value = (response as any).data?.data || []
  } catch (error) {
    console.error('Error loading tickets:', error)
  } finally {
    loadingTickets.value = false
  }
}

const combineDateTime = (date: string, time?: string | null) => {
  if (!time) {
    // Return date in ISO format (YYYY-MM-DD)
    return date
  }
  // Ensure time is in HH:MM format, add seconds if needed
  const timeStr = time.length === 5 ? `${time}:00` : time
  return `${date}T${timeStr}`
}

const mapScheduleToEvent = (schedule: TechnicianSchedule) => {
  const status = schedule.status || 'scheduled'
  
  // Ensure schedule_date is in YYYY-MM-DD format
  let scheduleDate = schedule.schedule_date
  if (scheduleDate && scheduleDate.includes('T')) {
    scheduleDate = scheduleDate.split('T')[0]
  }
  
  const start = combineDateTime(scheduleDate, schedule.start_time || undefined)
  const end = schedule.end_time ? combineDateTime(scheduleDate, schedule.end_time) : undefined

  // Get color based on status - lighter colors for background
  const statusColorMap: Record<string, string> = {
    scheduled: '#DBEAFE', // light blue
    in_progress: '#FEF3C7', // light yellow
    completed: '#D1FAE5', // light green
    cancelled: '#FEE2E2', // light red
  }
  const backgroundColor = statusColorMap[status] || statusColorMap.scheduled
  const borderColor = 'transparent'

  const event = {
    id: String(schedule.id),
    title: schedule.title || 'Untitled',
    start,
    end,
    allDay: !schedule.start_time,
    backgroundColor,
    borderColor,
    textColor: '#1F2937',
    extendedProps: {
      status,
      technicianName: schedule.technician_name,
      technicianId: schedule.technician_id,
      description: schedule.description,
      location: schedule.location,
      workRequirements: schedule.work_requirements,
      notes: schedule.notes,
      ticketId: schedule.ticket_id,
      ticketNumber: schedule.ticket_number,
      customerName: schedule.customer_name,
    },
  }
  
  console.log('Mapped event:', event)
  return event
}

const fetchSchedules = async () => {
  loadingEvents.value = true
  fetchError.value = null
  try {
    const response = await scheduleService.getSchedules({
      technician_id: technicianFilter.value || undefined,
      status: statusFilter.value || undefined,
      limit: 500,
    })
    const items = response.data || []
    console.log('Fetched schedules:', items)
    const mappedEvents = items.map(mapScheduleToEvent)
    console.log('Mapped events:', mappedEvents)
    events.value = mappedEvents
    
    // Refresh calendar after events are loaded
    if (calendarRef.value && calendarRef.value.getApi) {
      const calendarApi = calendarRef.value.getApi()
      calendarApi.removeAllEvents()
      if (mappedEvents.length > 0) {
        calendarApi.addEventSource(mappedEvents)
      }
      console.log('Calendar refreshed with', mappedEvents.length, 'events')
    }
  } catch (error) {
    console.error('Error loading schedules:', error)
    fetchError.value = error instanceof Error ? error.message : t('calendar.messages.fetchError')
  } finally {
    loadingEvents.value = false
  }
}

const loadAssignableUsers = async () => {
  loadingUsers.value = true
  try {
    assignableUsers.value = await scheduleService.getAssignableUsers()
  } catch (error) {
    console.error('Error loading assignable users:', error)
  } finally {
    loadingUsers.value = false
  }
}

const getAssignableRoleLabel = (role: string) => {
  if (role === UserRole.ADMIN || role === UserRole.DEV) {
    return t('calendar.roles.manager')
  }
  return t('calendar.roles.technician')
}

const getStatusColorClass = (status: string) => {
  const map: Record<string, string> = {
    scheduled: 'bg-blue-500',
    in_progress: 'bg-yellow-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500',
  }
  return map[status] || 'bg-gray-400'
}

const openCreateModal = (dateStr?: string) => {
  if (!canManageSchedules.value) return
  resetForm()
  const now = new Date()
  const defaultDate = dateStr || now.toISOString().split('T')[0]
  scheduleForm.schedule_date = defaultDate
  scheduleForm.start_time = formatDateTimeForFlatpickr(new Date(`${defaultDate}T08:00:00`))
  isOpen.value = true
}

const openEditModal = (event: any) => {
  if (!canManageSchedules.value) return
  resetForm()
  selectedScheduleId.value = Number(event.id)
  scheduleForm.title = event.title
  if (event.start) {
    const startDate = new Date(event.start)
    scheduleForm.schedule_date = startDate.toISOString().split('T')[0]
    scheduleForm.start_time = formatDateTimeForFlatpickr(startDate)
  }
  if (event.end) {
    scheduleForm.end_time = formatDateTimeForFlatpickr(new Date(event.end))
  }
  scheduleForm.technician_id = event.extendedProps.technicianId || ''
  scheduleForm.location = event.extendedProps.location || ''
  scheduleForm.work_requirements = event.extendedProps.workRequirements || ''
  scheduleForm.notes = event.extendedProps.notes || ''
  scheduleForm.status = event.extendedProps.status || 'scheduled'
  scheduleForm.ticket_id = event.extendedProps.ticketId ? String(event.extendedProps.ticketId) : ''
  scheduleForm.related_user_ids = event.extendedProps.relatedUserIds || []
  selectedEventMeta.value = event.extendedProps
  isOpen.value = true
}

const closeModal = () => {
  isOpen.value = false
  resetForm()
}

const handleDateSelect = (selectInfo: any) => {
  if (!canManageSchedules.value) return
  openCreateModal(selectInfo.startStr)
}

const handleDateClick = (dateClickInfo: any) => {
  const clickedDate = dateClickInfo.dateStr || dateClickInfo.date.toISOString().split('T')[0]
  selectedDate.value = clickedDate
  
  // Filter events for the selected date
  const dateEvents = events.value.filter((event: any) => {
    const eventDate = event.start ? event.start.split('T')[0] : ''
    return eventDate === clickedDate
  })
  
  dayTasks.value = dateEvents.map((event: any) => ({
    id: event.id,
    title: event.title,
    technicianName: event.extendedProps?.technicianName || '',
    status: event.extendedProps?.status || 'scheduled',
    startTime: event.start ? event.start.split('T')[1]?.substring(0, 5) : '',
    endTime: event.end ? event.end.split('T')[1]?.substring(0, 5) : '',
    location: event.extendedProps?.location || '',
    ticketNumber: event.extendedProps?.ticketNumber || '',
    customerName: event.extendedProps?.customerName || '',
    fullEvent: event, // Store full event for editing
  }))
  
  isDayTasksModalOpen.value = true
}

const handleEventClick = (clickInfo: any) => {
  // Navigate to task detail page when clicking on event
  const taskId = clickInfo.event.id
  if (taskId) {
    router.push(`/tasks/${taskId}`)
  }
}

const handleTaskClick = (task: any) => {
  // Navigate to task detail page
  router.push(`/tasks/${task.id}`)
  isDayTasksModalOpen.value = false
}

const handleAddTaskForDate = () => {
  // Close day tasks modal and open create modal with selected date
  isDayTasksModalOpen.value = false
  openCreateModal(selectedDate.value)
}

const handleAddOrUpdateEvent = async () => {
  if (!canManageSchedules.value) return
  formError.value = null
  formSuccess.value = null

  if (
    !scheduleForm.title.trim() ||
    !scheduleForm.start_time ||
    !scheduleForm.technician_id
  ) {
    formError.value = t('technicians.schedule.messages.fillRequired')
    return
  }

  // Parse start_time and end_time from flatpickr format
  let startTime = scheduleForm.start_time
  let endTime = scheduleForm.end_time || null
  
  // Extract date and time from flatpickr format (YYYY-MM-DD HH:mm)
  let scheduleDate = scheduleForm.schedule_date
  let startTimeOnly = startTime
  
  if (startTime.includes(' ')) {
    // Has date and time
    const [datePart, timePart] = startTime.split(' ')
    scheduleDate = datePart
    startTimeOnly = timePart
  } else if (!scheduleDate) {
    // Only time, use today's date
    scheduleDate = new Date().toISOString().split('T')[0]
  }

  // Check if date is in the past
  if (scheduleDate) {
    try {
      const selectedDate = new Date(scheduleDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      selectedDate.setHours(0, 0, 0, 0)
      
      // If date is in the past
      if (selectedDate < today) {
        const userRole = getUserRole.value
        // Only DEV can create tasks for past dates
        // ADMIN, TECHNICIAN, SERVICE_CENTER cannot create tasks for past dates
        if (userRole && userRole !== UserRole.DEV) {
          formError.value = t('calendar.messages.cannotCreatePastDate')
          return
        }
        // DEV can create tasks for past dates, so continue
      }
    } catch (error) {
      console.error('Error checking date:', error)
      // Continue if error checking date
    }
  }

  isSaving.value = true
  try {
    
    let endTimeOnly = null
    if (endTime && endTime.trim()) {
      if (endTime.includes(' ')) {
        const [, timePart] = endTime.split(' ')
        endTimeOnly = timePart
      } else {
        endTimeOnly = endTime
      }
    }

    const payload: any = {
      technician_id: parseInt(String(scheduleForm.technician_id)),
      title: scheduleForm.title.trim(),
      schedule_date: scheduleDate,
      start_time: startTimeOnly,
      end_time: endTimeOnly,
      status: scheduleForm.status,
    }

    if (scheduleForm.ticket_id) {
      payload.ticket_id = parseInt(String(scheduleForm.ticket_id))
    }
    if (scheduleForm.work_requirements) {
      payload.work_requirements = scheduleForm.work_requirements
    }
    if (scheduleForm.location) {
      payload.location = scheduleForm.location
    }
    if (scheduleForm.notes) {
      payload.notes = scheduleForm.notes
    }
    
    // Add related users if any
    if (scheduleForm.related_user_ids && scheduleForm.related_user_ids.length > 0) {
      const relatedIds = Array.isArray(scheduleForm.related_user_ids)
        ? scheduleForm.related_user_ids.map(id => typeof id === 'string' ? parseInt(id) : id)
        : []
      payload.related_user_ids = relatedIds
    }

    if (selectedScheduleId.value) {
      await scheduleService.updateSchedule(selectedScheduleId.value, payload)
      formSuccess.value = t('calendar.messages.updateSuccess')
    } else {
      await scheduleService.createSchedule(payload)
      formSuccess.value = t('calendar.messages.createSuccess')
    }

    await fetchSchedules()
    setTimeout(() => {
      closeModal()
    }, 400)
  } catch (error) {
    console.error('Error saving schedule:', error)
    formError.value = error instanceof Error ? error.message : t('technicians.schedule.messages.saveError')
  } finally {
    isSaving.value = false
  }
}

const handleDeleteEvent = async () => {
  if (!selectedScheduleId.value || !canManageSchedules.value) return
  isSaving.value = true
  formError.value = null
  try {
    await scheduleService.deleteSchedule(selectedScheduleId.value)
    await fetchSchedules()
    closeModal()
  } catch (error) {
    console.error('Error deleting schedule:', error)
    formError.value = error instanceof Error ? error.message : t('calendar.messages.deleteError')
  } finally {
    isSaving.value = false
  }
}

const getEventClassName = (eventInfo: any) => {
  const status = eventInfo.event.extendedProps.status || 'scheduled'
  const classMap: Record<string, string> = {
    scheduled: 'fc-event-scheduled',
    in_progress: 'fc-event-in-progress',
    completed: 'fc-event-completed',
    cancelled: 'fc-event-cancelled',
  }
  return classMap[status] || 'fc-event-scheduled'
}

const renderEventContent = (eventInfo: any) => {
  const technicianName = eventInfo.event.extendedProps.technicianName || ''

  // Display: white pill with technician name inside the colored event background
  return {
    html: `
      <div class="fc-event-content-wrapper px-1 py-1 rounded text-[10px] leading-tight flex items-center justify-start">
        ${technicianName ? `<span class="font-medium text-black bg-white px-2 py-1 rounded-full shadow-sm border border-gray-100 whitespace-nowrap">${technicianName}</span>` : ''}
      </div>
    `,
  }
}

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek,timeGridDay',
  },
  events: events.value,
  selectable: canManageSchedules.value,
  select: handleDateSelect,
  dateClick: handleDateClick,
  eventClick: handleEventClick,
  eventContent: renderEventContent,
  eventClassNames: (arg: any) => {
    return getEventClassName(arg)
  },
  eventDisplay: 'block',
  eventTimeFormat: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    hour12: false,
  },
  height: 'auto',
  dayMaxEvents: 5,
  moreLinkClick: 'popover',
  eventMinHeight: 20,
  eventShortHeight: 20,
  locale: locale.value,
}))

// Removed - using computed for calendarOptions instead

let filtersReady = false
watch(
  [technicianFilter, statusFilter],
  () => {
    if (!filtersReady) return
    fetchSchedules()
  },
  { deep: true }
)

// Watch events and update calendar
watch(
  () => events.value,
  (newEvents) => {
    try {
      if (calendarRef.value && calendarRef.value.getApi) {
        const calendarApi = calendarRef.value.getApi()
        calendarApi.removeAllEvents()
        if (newEvents && newEvents.length > 0) {
          calendarApi.addEventSource(newEvents)
        }
      }
    } catch (error) {
      console.error('Error updating calendar events:', error)
    }
  },
  { deep: true }
)

onMounted(async () => {
  if (route.query.tech) {
    technicianFilter.value = Number(route.query.tech as string)
  }
  await loadAssignableUsers()
  await loadTickets()
  await fetchSchedules()
  filtersReady = true
})
</script>
