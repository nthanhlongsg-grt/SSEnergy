<template>
  <admin-layout>
    <div class="px-4 sm:px-0 space-y-6 max-w-6xl mx-auto min-w-0">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div class="flex items-start gap-3 min-w-0">
          <button
            type="button"
            @click="router.push('/payment-requests')"
            class="p-2 shrink-0 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
          </button>
          <div class="min-w-0">
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white font-mono truncate">
              {{ item?.request_number || '—' }}
            </h1>
            <div v-if="item" class="flex flex-wrap items-center gap-2 mt-2">
              <span :class="statusClass(item.status)" class="px-2.5 py-0.5 text-xs font-semibold rounded-full">
                {{ statusLabel(item.status) }}
              </span>
              <span v-if="item.has_vat" class="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
                VAT
              </span>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                {{ t('paymentRequests.detailPage.createdAt') }}: {{ formatDateTime(item.created_at) }}
              </span>
            </div>
          </div>
        </div>
        <button
          v-if="canDelete && item"
          type="button"
          :disabled="deleteLoading"
          @click="deleteItem"
          class="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 min-h-[44px]"
        >
          {{ deleteLoading ? t('common.saving') : t('paymentRequests.actions.delete') }}
        </button>
      </div>

      <div v-if="loading" class="text-center py-16 text-gray-500">{{ t('common.loading') }}</div>
      <div v-else-if="loadError" class="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 p-4 text-red-800">
        {{ loadError }}
      </div>

      <div v-else-if="item" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Thông tin chi phí -->
        <div class="lg:col-span-2 space-y-4">
          <div class="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-5 sm:p-6">
            <div class="flex items-center justify-between gap-3 mb-4">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ t('paymentRequests.detailPage.requestInfo') }}
              </h2>
              <button
                v-if="canEditRequestInfo && hasInfoChanges"
                type="button"
                :disabled="infoSaving"
                @click="saveInfoChanges"
                class="shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                {{ infoSaving ? t('common.saving') : t('common.save') }}
              </button>
            </div>
            <p v-if="canEditRequestInfo" class="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {{ t('paymentRequests.detailPage.editInfoHint') }}
            </p>
            <div v-if="infoError" class="mb-3 text-sm text-red-600 dark:text-red-400">{{ infoError }}</div>
            <div v-if="infoSuccess" class="mb-3 text-sm text-green-600 dark:text-green-400">{{ infoSuccess }}</div>

            <!-- Chỉnh sửa hạng mục + nội dung (người duyệt) -->
            <div v-if="canEditRequestInfo" class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.columns.date') }}</dt>
                <dd class="mt-0.5 font-medium text-gray-900 dark:text-white">
                  {{ item.payment_date ? formatDate(item.payment_date) : '—' }}
                </dd>
              </div>
              <div>
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">{{ t('paymentRequests.columns.category') }}</label>
                <select
                  v-model="infoForm.expense_category"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">{{ t('paymentRequests.create.selectCategory') }}</option>
                  <option v-for="cat in EXPENSE_CATEGORIES" :key="cat" :value="cat">
                    {{ categoryLabel(cat) }}
                  </option>
                </select>
              </div>
              <div class="sm:col-span-2">
                <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">{{ t('paymentRequests.columns.content') }}</label>
                <textarea
                  v-model="infoForm.payment_content"
                  rows="3"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.columns.amount') }}</dt>
                <dd class="mt-0.5 text-xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(item.amount) }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.create.payer') }}</dt>
                <dd class="mt-0.5 text-gray-900 dark:text-white">{{ item.payer_name || item.requested_by_name || '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.columns.requester') }}</dt>
                <dd class="mt-0.5 text-gray-900 dark:text-white">{{ item.requested_by_name || '—' }}</dd>
              </div>
              <div v-if="item.contract_number" class="sm:col-span-2">
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.create.contract') }}</dt>
                <dd class="mt-0.5">
                  <router-link
                    v-if="canViewContracts"
                    :to="`/contracts/${item.contract_id}`"
                    class="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    {{ item.contract_number }}
                  </router-link>
                  <span v-else class="text-gray-900 dark:text-white">{{ item.contract_number }}</span>
                  <span v-if="item.customer_name" class="text-gray-500 dark:text-gray-400"> — {{ item.customer_name }}</span>
                </dd>
              </div>
              <div v-if="item.notes" class="sm:col-span-2">
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.create.notes') }}</dt>
                <dd class="mt-0.5 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ item.notes }}</dd>
              </div>
            </div>

            <!-- Chỉ xem -->
            <dl v-else class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.columns.date') }}</dt>
                <dd class="mt-0.5 font-medium text-gray-900 dark:text-white">
                  {{ item.payment_date ? formatDate(item.payment_date) : '—' }}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.columns.category') }}</dt>
                <dd class="mt-0.5 text-gray-900 dark:text-white">
                  {{ item.expense_category ? categoryLabel(item.expense_category) : '—' }}
                </dd>
              </div>
              <div class="sm:col-span-2">
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.columns.content') }}</dt>
                <dd class="mt-0.5 text-gray-900 dark:text-white whitespace-pre-wrap">{{ item.payment_content }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.columns.amount') }}</dt>
                <dd class="mt-0.5 text-xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(item.amount) }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.create.payer') }}</dt>
                <dd class="mt-0.5 text-gray-900 dark:text-white">{{ item.payer_name || item.requested_by_name || '—' }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.columns.source') }}</dt>
                <dd class="mt-0.5 text-gray-900 dark:text-white">{{ sourceLabel(item.payment_source) }}</dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.columns.requester') }}</dt>
                <dd class="mt-0.5 text-gray-900 dark:text-white">{{ item.requested_by_name || '—' }}</dd>
              </div>
              <div v-if="item.contract_number" class="sm:col-span-2">
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.create.contract') }}</dt>
                <dd class="mt-0.5">
                  <router-link
                    v-if="canViewContracts"
                    :to="`/contracts/${item.contract_id}`"
                    class="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    {{ item.contract_number }}
                  </router-link>
                  <span v-else class="text-gray-900 dark:text-white">{{ item.contract_number }}</span>
                  <span v-if="item.customer_name" class="text-gray-500 dark:text-gray-400"> — {{ item.customer_name }}</span>
                </dd>
              </div>
              <div v-if="item.notes" class="sm:col-span-2">
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.create.notes') }}</dt>
                <dd class="mt-0.5 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ item.notes }}</dd>
              </div>
            </dl>
          </div>

          <!-- Người thụ hưởng + QR chuyển khoản -->
          <BeneficiaryTransferQr
            v-if="item.beneficiary_name || item.bank_account"
            :beneficiary-name="item.beneficiary_name"
            :bank-account="item.bank_account"
            :bank-name="item.bank_name"
            :amount="item.amount"
            :transfer-note="item.request_number"
          />

          <!-- Hóa đơn -->
          <div
            v-if="invoiceImages.length > 0"
            class="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-5 sm:p-6"
          >
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('paymentRequests.detail.invoiceImages') }}
            </h2>
            <div class="flex flex-wrap gap-3">
              <button
                v-for="(img, idx) in invoiceImages"
                :key="idx"
                type="button"
                class="block cursor-pointer"
                @click="openImageModal(img)"
              >
                <img
                  :src="resolveImageSrc(img)"
                  class="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:opacity-90 transition-opacity"
                />
              </button>
            </div>
          </div>

          <!-- Lịch sử duyệt -->
          <div
            v-if="item.reviewed_by_name || item.review_note"
            class="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-5 sm:p-6"
          >
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('paymentRequests.detailPage.reviewHistory') }}
            </h2>
            <dl class="space-y-2 text-sm">
              <div v-if="item.reviewed_by_name">
                <dt class="text-xs text-gray-500">{{ t('paymentRequests.detail.reviewedBy') }}</dt>
                <dd class="text-gray-900 dark:text-white">{{ item.reviewed_by_name }}</dd>
              </div>
              <div v-if="item.reviewed_at">
                <dt class="text-xs text-gray-500">{{ t('paymentRequests.detailPage.reviewedAt') }}</dt>
                <dd class="text-gray-900 dark:text-white">{{ formatDateTime(item.reviewed_at) }}</dd>
              </div>
              <div v-if="item.review_note">
                <dt class="text-xs text-gray-500">{{ t('paymentRequests.detail.reviewNote') }}</dt>
                <dd class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ item.review_note }}</dd>
              </div>
            </dl>
          </div>

          <!-- Ảnh chứng từ đã thanh toán -->
          <div
            v-if="paymentProofImages.length > 0"
            class="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-5 sm:p-6"
          >
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('paymentRequests.detail.paymentProofImages') }}
            </h2>
            <div class="flex flex-wrap gap-3">
              <button
                v-for="(img, idx) in paymentProofImages"
                :key="idx"
                type="button"
                class="block cursor-pointer"
                @click="openImageModal(img)"
              >
                <img
                  :src="resolveImageSrc(img)"
                  class="w-28 h-28 sm:w-32 sm:h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:opacity-90 transition-opacity"
                />
              </button>
            </div>
          </div>

          <!-- Chat theo dõi -->
          <PaymentRequestChat :payment-request-id="item.id" />
        </div>

        <!-- Panel duyệt (admin / dev / kế toán) -->
        <div class="space-y-4">
          <div
            v-if="canReview"
            class="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-5 sticky top-4"
          >
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              {{ t('paymentRequests.detailPage.reviewPanel') }}
            </h2>

            <div v-if="actionError" class="mb-3 text-sm text-red-600 dark:text-red-400">{{ actionError }}</div>
            <div v-if="actionSuccess" class="mb-3 text-sm text-green-600 dark:text-green-400">{{ actionSuccess }}</div>

            <!-- Chỉnh sửa thông tin duyệt -->
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('paymentRequests.columns.source') }} *
                </label>
                <select
                  v-model="reviewForm.payment_source"
                  :disabled="item.status === 'paid' || item.status === 'rejected'"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white disabled:opacity-60"
                >
                  <option value="">{{ t('paymentRequests.detailPage.selectSource') }}</option>
                  <option value="company_account">{{ t('paymentRequests.paymentSource.company_account') }}</option>
                  <option value="cash">{{ t('paymentRequests.paymentSource.cash') }}</option>
                  <option value="other">{{ t('paymentRequests.paymentSource.other') }}</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('paymentRequests.detailPage.approver') }}
                </label>
                <input
                  :value="approverDisplayName"
                  type="text"
                  readonly
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white cursor-not-allowed"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('paymentRequests.detail.reviewNote') }}
                </label>
                <textarea
                  v-model="reviewForm.review_note"
                  rows="3"
                  :disabled="item.status === 'paid'"
                  :placeholder="t('paymentRequests.detailPage.reviewNotePlaceholder')"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none disabled:opacity-60"
                />
              </div>

              <!-- Upload ảnh khi duyệt / thanh toán -->
              <div v-if="canUploadProof">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ t('paymentRequests.detail.paymentProofImages') }}
                </label>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {{ t('paymentRequests.detail.paymentProofHint') }}
                </p>
                <div
                  ref="proofDropZone"
                  tabindex="0"
                  class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 text-center cursor-pointer hover:border-blue-400 transition-colors outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/30"
                  @click="proofInputRef?.click()"
                  @dragover.prevent
                  @drop.prevent="handleProofDrop"
                >
                  <input
                    ref="proofInputRef"
                    type="file"
                    accept="image/*"
                    multiple
                    class="hidden"
                    @change="handleProofSelect"
                  />
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ t('paymentRequests.detail.paymentProofUpload') }}
                  </p>
                </div>
                <div v-if="proofPreviews.length > 0" class="flex flex-wrap gap-2 mt-3">
                  <div
                    v-for="(img, idx) in proofPreviews"
                    :key="idx"
                    class="relative group"
                  >
                    <img
                      :src="resolveImageSrc(img)"
                      class="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:opacity-90"
                      @click="openImageModal(img)"
                    />
                    <button
                      type="button"
                      class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      @click="removeProofImage(idx)"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>

              <!-- Pending: duyệt / từ chối -->
              <template v-if="item.status === 'pending'">
                <div class="flex flex-col gap-2 pt-2">
                  <button
                    type="button"
                    :disabled="actionLoading"
                    @click="submitReview('approve')"
                    class="w-full px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 min-h-[44px]"
                  >
                    {{ actionLoading ? t('common.saving') : t('paymentRequests.actions.approve') }}
                  </button>
                  <button
                    type="button"
                    :disabled="actionLoading"
                    @click="submitReview('reject')"
                    class="w-full px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 min-h-[44px]"
                  >
                    {{ t('paymentRequests.actions.reject') }}
                  </button>
                </div>
              </template>

              <!-- Approved: lưu nguồn tiền + xác nhận đã chi -->
              <template v-else-if="item.status === 'approved'">
                <button
                  v-if="hasSourceChanges || hasProofChanges || hasReviewNoteChanges"
                  type="button"
                  :disabled="actionLoading"
                  @click="saveReviewerPanelChanges"
                  class="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 min-h-[44px]"
                >
                  {{ actionLoading ? t('common.saving') : t('common.save') }}
                </button>
                <button
                  type="button"
                  :disabled="actionLoading"
                  @click="submitMarkPaid"
                  class="w-full px-4 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 min-h-[44px]"
                >
                  {{ t('paymentRequests.actions.markPaid') }}
                </button>
              </template>

              <!-- Paid: lưu ảnh chứng từ bổ sung -->
              <template v-else-if="item.status === 'paid'">
                <button
                  v-if="hasProofChanges"
                  type="button"
                  :disabled="actionLoading"
                  @click="saveProofImages"
                  class="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 min-h-[44px]"
                >
                  {{ actionLoading ? t('common.saving') : t('paymentRequests.detail.saveProof') }}
                </button>
                <p class="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                  {{ t('paymentRequests.detailPage.alreadyPaid') }}
                </p>
              </template>
              <p v-else-if="item.status === 'rejected'" class="text-xs text-red-600 dark:text-red-400 text-center py-2">
                {{ t('paymentRequests.detailPage.rejected') }}
              </p>
            </div>
          </div>

          <!-- Nhân viên thường: chỉ xem trạng thái -->
          <div
            v-else
            class="rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 p-5"
          >
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ t('paymentRequests.detailPage.viewOnly') }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Xem ảnh full size -->
    <div
      v-if="showImageModal"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      @click="closeImageModal"
    >
      <button
        type="button"
        class="absolute top-4 right-4 text-white hover:text-gray-300 p-2"
        @click="closeImageModal"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
        </svg>
      </button>
      <img
        :src="selectedImageSrc"
        :alt="t('paymentRequests.detail.viewImage')"
        class="max-w-full max-h-[90vh] object-contain rounded-lg"
        @click.stop
      />
    </div>
  </admin-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import BeneficiaryTransferQr from '@/components/payment/BeneficiaryTransferQr.vue'
import PaymentRequestChat from '@/components/payment/PaymentRequestChat.vue'
import { hasPermission, Permission, getUser } from '@/composables/useAuth'
import { filterImageFiles, readFileAsDataUrl, compressImage } from '@/utils/imageUpload'
import { useImagePaste } from '@/composables/useImagePaste'
import {
  paymentRequestService,
  type PaymentRequest,
  type PaymentRequestStatus,
  type PaymentSource,
  type ExpenseCategory,
} from '@/services/paymentRequestService'
import { getApiBaseUrl } from '@/utils/apiUrl'

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'tools',
  'materials',
  'external_labor',
  'transport',
  'business_travel',
  'office',
  'entertainment',
  'other',
]

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const canReview = computed(() => hasPermission(Permission.REVIEW_PAYMENT_REQUEST))
const canDelete = computed(() => hasPermission(Permission.DELETE_PAYMENT_REQUEST))
const canViewContracts = computed(() => hasPermission(Permission.VIEW_CONTRACTS))

const canEditRequestInfo = computed(() => {
  if (!canReview.value || !item.value) return false
  return item.value.status === 'pending' || item.value.status === 'approved'
})

const loading = ref(true)
const loadError = ref('')
const item = ref<PaymentRequest | null>(null)

const actionLoading = ref(false)
const deleteLoading = ref(false)
const actionError = ref('')
const actionSuccess = ref('')

const infoSaving = ref(false)
const infoError = ref('')
const infoSuccess = ref('')

const showImageModal = ref(false)
const selectedImageSrc = ref('')

const infoForm = ref({
  payment_content: '',
  expense_category: '' as ExpenseCategory | '',
})

const reviewForm = ref({
  payment_source: '' as PaymentSource | '',
  review_note: '',
})

const proofInputRef = ref<HTMLInputElement | null>(null)
const proofDropZone = ref<HTMLElement | null>(null)
const proofPreviews = ref<string[]>([])
const savedProofImages = ref<string[]>([])

const canUploadProof = computed(() => {
  if (!canReview.value || !item.value) return false
  return item.value.status === 'pending' || item.value.status === 'approved' || item.value.status === 'paid'
})

useImagePaste(
  (files) => addProofImages(files),
  {
    enabled: () => canUploadProof.value && proofPreviews.value.length < 5,
    zoneRef: proofDropZone,
    globalImagePaste: true,
  },
)

const parseJsonImages = (raw?: string | null): string[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const resolveImageSrc = (src: string): string => {
  if (!src) return ''
  if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://')) return src
  const origin = getApiBaseUrl().replace(/\/api\/?$/, '')
  return src.startsWith('/') ? `${origin}${src}` : `${origin}/${src}`
}

const openImageModal = (src: string) => {
  selectedImageSrc.value = resolveImageSrc(src)
  showImageModal.value = true
}

const closeImageModal = () => {
  showImageModal.value = false
  selectedImageSrc.value = ''
}

const onImageModalKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && showImageModal.value) closeImageModal()
}

const approverDisplayName = computed(() => {
  if (item.value?.reviewed_by_name) return item.value.reviewed_by_name
  if (item.value?.status === 'pending' && canReview.value) {
    return getUser.value?.name || '—'
  }
  return '—'
})

const invoiceImages = computed(() => parseJsonImages(item.value?.invoice_images))

const paymentProofImages = computed(() => parseJsonImages(item.value?.payment_proof_images))

const hasReviewNoteChanges = computed(() => {
  if (!item.value) return false
  return reviewForm.value.review_note !== (item.value.review_note || '')
})

const hasSourceChanges = computed(() => {
  if (!item.value) return false
  return (reviewForm.value.payment_source || '') !== (item.value.payment_source || '')
})

const hasInfoChanges = computed(() => {
  if (!item.value) return false
  const d = item.value
  return (
    infoForm.value.payment_content.trim() !== (d.payment_content || '').trim() ||
    (infoForm.value.expense_category || '') !== (d.expense_category || '')
  )
})

const hasProofChanges = computed(() => {
  if (proofPreviews.value.length !== savedProofImages.value.length) return true
  return proofPreviews.value.some((img, i) => img !== savedProofImages.value[i])
})

const syncProofImages = (data: PaymentRequest) => {
  const imgs = parseJsonImages(data.payment_proof_images)
  savedProofImages.value = [...imgs]
  proofPreviews.value = [...imgs]
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0)

const formatDate = (d: string) => {
  const date = new Date(d.includes('T') ? d : `${d}T00:00:00`)
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const statusLabel = (status: PaymentRequestStatus) => t(`paymentRequests.status.${status}`)

const statusClass = (status: PaymentRequestStatus) => {
  const map: Record<PaymentRequestStatus, string> = {
    pending: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    approved: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  }
  return map[status] || 'bg-gray-100 text-gray-800'
}

const categoryLabel = (cat: string) => t(`paymentRequests.expenseCategory.${cat}`, cat)
const sourceLabel = (src?: string | null) =>
  src ? t(`paymentRequests.paymentSource.${src}`, src) : t('paymentRequests.detailPage.notSet')

const syncInfoForm = (data: PaymentRequest) => {
  infoForm.value = {
    payment_content: data.payment_content || '',
    expense_category: (data.expense_category as ExpenseCategory) || '',
  }
}

const syncReviewForm = (data: PaymentRequest) => {
  reviewForm.value = {
    payment_source: (data.payment_source as PaymentSource) || '',
    review_note: data.review_note || '',
  }
  syncInfoForm(data)
  syncProofImages(data)
}

const buildInfoPayload = () => ({
  payment_content: infoForm.value.payment_content.trim(),
  expense_category: infoForm.value.expense_category || undefined,
})

const saveInfoChanges = async () => {
  if (!item.value || !hasInfoChanges.value) return
  if (!infoForm.value.payment_content.trim()) {
    infoError.value = t('paymentRequests.detailPage.contentRequired')
    return
  }
  infoSaving.value = true
  infoError.value = ''
  infoSuccess.value = ''
  try {
    const updated = await paymentRequestService.update(item.value.id, buildInfoPayload())
    item.value = { ...item.value, ...updated }
    syncReviewForm(item.value)
    infoSuccess.value = t('paymentRequests.detailPage.infoSavedNotify')
  } catch (err) {
    infoError.value = err instanceof Error ? err.message : t('paymentRequests.errors.createFailed')
  } finally {
    infoSaving.value = false
  }
}

const handleProofSelect = async (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  await addProofImages(Array.from(input.files))
  input.value = ''
}

const handleProofDrop = async (e: DragEvent) => {
  const files = filterImageFiles(Array.from(e.dataTransfer?.files || []))
  await addProofImages(files)
}

const addProofImages = async (files: File[]) => {
  const remaining = 5 - proofPreviews.value.length
  const toAdd = files.slice(0, remaining)
  for (const file of toAdd) {
    if (file.size > 10 * 1024 * 1024) {
      actionError.value = t('paymentRequests.errors.imageTooLarge', { name: file.name })
      continue
    }
    const compressed = await compressImage(file, 1280, 1280, 0.78)
    const url = await readFileAsDataUrl(compressed)
    proofPreviews.value.push(url)
  }
}

const removeProofImage = (idx: number) => {
  proofPreviews.value.splice(idx, 1)
}

const saveProofImages = async () => {
  if (!item.value) return
  actionLoading.value = true
  actionError.value = ''
  actionSuccess.value = ''
  try {
    const updated = await paymentRequestService.update(item.value.id, {
      payment_proof_images: proofPreviews.value,
    })
    item.value = { ...item.value, ...updated }
    syncProofImages(item.value)
    actionSuccess.value = t('paymentRequests.detailPage.saveSuccess')
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : t('paymentRequests.errors.createFailed')
  } finally {
    actionLoading.value = false
  }
}

const loadItem = async () => {
  const id = Number(route.params.id)
  if (!id) {
    loadError.value = t('paymentRequests.errors.loadFailed')
    loading.value = false
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    item.value = await paymentRequestService.get(id)
    syncReviewForm(item.value)
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : t('paymentRequests.errors.loadFailed')
  } finally {
    loading.value = false
  }
}

const submitReview = async (action: 'approve' | 'reject') => {
  if (!item.value) return
  if (action === 'approve' && !reviewForm.value.payment_source) {
    actionError.value = t('paymentRequests.detailPage.sourceRequired')
    return
  }
  if (action === 'reject' && !window.confirm(t('paymentRequests.review.rejectConfirm'))) return

  actionLoading.value = true
  actionError.value = ''
  actionSuccess.value = ''
  try {
    if (hasInfoChanges.value) {
      await paymentRequestService.update(item.value.id, buildInfoPayload())
    }
    const updated = await paymentRequestService.review(item.value.id, action, {
      review_note: reviewForm.value.review_note || undefined,
      payment_source: reviewForm.value.payment_source || undefined,
      payment_proof_images: proofPreviews.value.length > 0 ? proofPreviews.value : undefined,
    })
    item.value = updated
    syncReviewForm(updated)
    actionSuccess.value = action === 'approve'
      ? t('paymentRequests.detailPage.approveSuccess')
      : t('paymentRequests.detailPage.rejectSuccess')
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : t('paymentRequests.errors.reviewFailed')
  } finally {
    actionLoading.value = false
  }
}

const saveReviewerPanelChanges = async () => {
  if (!item.value) return
  actionLoading.value = true
  actionError.value = ''
  actionSuccess.value = ''
  try {
    const payload: Record<string, unknown> = {}
    if (hasSourceChanges.value) payload.payment_source = reviewForm.value.payment_source || null
    if (hasProofChanges.value) payload.payment_proof_images = proofPreviews.value
    if (hasReviewNoteChanges.value) payload.review_note = reviewForm.value.review_note || null
    if (Object.keys(payload).length > 0) {
      const updated = await paymentRequestService.update(item.value.id, payload)
      item.value = { ...item.value, ...updated }
      syncReviewForm(item.value)
    }
    actionSuccess.value = t('paymentRequests.detailPage.saveSuccess')
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : t('paymentRequests.errors.createFailed')
  } finally {
    actionLoading.value = false
  }
}

const submitMarkPaid = async () => {
  if (!item.value) return
  if (!window.confirm(t('paymentRequests.review.confirmPaid'))) return
  actionLoading.value = true
  actionError.value = ''
  try {
    if (hasInfoChanges.value) {
      await paymentRequestService.update(item.value.id, buildInfoPayload())
    }
    if (hasProofChanges.value || hasReviewNoteChanges.value || hasSourceChanges.value) {
      const payload: Record<string, unknown> = {}
      if (hasSourceChanges.value) payload.payment_source = reviewForm.value.payment_source || null
      if (hasProofChanges.value) payload.payment_proof_images = proofPreviews.value
      if (hasReviewNoteChanges.value) payload.review_note = reviewForm.value.review_note || null
      await paymentRequestService.update(item.value.id, payload)
    }
    item.value = await paymentRequestService.markPaid(
      item.value.id,
      proofPreviews.value.length > 0 ? proofPreviews.value : undefined,
    )
    syncReviewForm(item.value)
    actionSuccess.value = t('paymentRequests.detailPage.paidSuccess')
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : t('paymentRequests.errors.paidFailed')
  } finally {
    actionLoading.value = false
  }
}

const deleteItem = async () => {
  if (!item.value) return
  if (!window.confirm(t('paymentRequests.detailPage.deleteConfirm', { number: item.value.request_number }))) return
  deleteLoading.value = true
  actionError.value = ''
  try {
    await paymentRequestService.remove(item.value.id)
    router.push('/payment-requests')
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : t('paymentRequests.errors.deleteFailed')
    deleteLoading.value = false
  }
}

watch(() => route.params.id, () => {
  if (route.name === 'PaymentRequestDetail') loadItem()
})

onMounted(async () => {
  document.addEventListener('keydown', onImageModalKeydown)
  await loadItem()
})

onUnmounted(() => {
  document.removeEventListener('keydown', onImageModalKeydown)
})
</script>
