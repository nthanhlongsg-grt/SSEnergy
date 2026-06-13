<template>
  <div class="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4 sm:p-5">
    <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">
      {{ t('paymentRequests.beneficiary.section') }}
    </h3>

    <div class="grid grid-cols-1 sm:grid-cols-[1fr_auto] sm:grid-rows-[auto_auto_auto] gap-x-6 gap-y-3 text-sm">
      <!-- Hàng 1 -->
      <div class="sm:row-start-1 sm:col-start-1 min-w-0">
        <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.create.beneficiary') }}</dt>
        <dd class="mt-0.5 font-medium text-gray-900 dark:text-white">{{ beneficiaryName || '—' }}</dd>
      </div>
      <div class="sm:row-start-1 sm:col-start-2 sm:text-right">
        <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.create.bankName') }}</dt>
        <dd class="mt-0.5 text-gray-900 dark:text-white">{{ bankLabel }}</dd>
      </div>

      <!-- Hàng 2 -->
      <div class="sm:row-start-2 sm:col-start-1 min-w-0">
        <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.create.bankAccount') }}</dt>
        <dd class="mt-0.5 font-mono text-base font-semibold text-gray-900 dark:text-white tracking-wide">
          {{ bankAccount || '—' }}
        </dd>
      </div>

      <!-- QR: cột phải, ngang hàng STK + số tiền -->
      <div
        v-if="canShowQr"
        class="sm:row-start-2 sm:row-span-2 sm:col-start-2 flex justify-center sm:justify-end self-start"
      >
        <div class="bg-white p-1.5 rounded-lg shadow-sm border border-gray-100">
          <img
            v-if="qrImageUrl && !qrError"
            :src="qrImageUrl"
            :alt="t('paymentRequests.beneficiary.qrAlt')"
            class="w-24 h-24 sm:w-28 sm:h-28 object-contain"
            @error="onQrImageError"
          />
          <div
            v-else-if="qrLoading"
            class="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center text-gray-400 text-xs"
          >
            {{ t('common.loading') }}
          </div>
          <div
            v-else
            class="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center text-gray-400 text-xs text-center px-2"
          >
            {{ t('paymentRequests.beneficiary.qrFailed') }}
          </div>
        </div>
      </div>
      <p
        v-else
        class="sm:row-start-2 sm:row-span-2 sm:col-start-2 text-xs text-amber-600 dark:text-amber-400 sm:text-right self-start max-w-[7rem]"
      >
        {{ t('paymentRequests.beneficiary.qrIncomplete') }}
      </p>

      <!-- Hàng 3 -->
      <div v-if="amount > 0" class="sm:row-start-3 sm:col-start-1 min-w-0">
        <dt class="text-xs text-gray-500 dark:text-gray-400">{{ t('paymentRequests.columns.amount') }}</dt>
        <dd class="mt-0.5 font-bold text-green-700 dark:text-green-400">{{ formatCurrency(amount) }}</dd>
      </div>
    </div>

    <p
      v-if="transferNote && canShowQr"
      class="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400"
    >
      {{ t('paymentRequests.beneficiary.transferNote') }}: {{ transferNote }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getBankLabel, resolveBankBin } from '@/data/vnBanks'
import { buildVietQrImageUrl, generateVietQrDataUrl } from '@/utils/vietQr'

const props = defineProps<{
  beneficiaryName?: string | null
  bankAccount?: string | null
  bankName?: string | null
  amount?: number
  transferNote?: string
}>()

const { t } = useI18n()

const qrImageUrl = ref<string | null>(null)
const qrLoading = ref(false)
const qrError = ref(false)

const amount = computed(() => props.amount || 0)

const bankLabel = computed(() => getBankLabel(props.bankName))

const canShowQr = computed(() => {
  return !!(
    props.bankAccount?.trim() &&
    props.bankName?.trim() &&
    resolveBankBin(props.bankName)
  )
})

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value || 0)

const loadQr = async () => {
  qrImageUrl.value = null
  qrError.value = false
  if (!canShowQr.value || !props.bankAccount || !props.bankName) return

  qrLoading.value = true
  try {
    const params = {
      bankNameOrBin: props.bankName,
      accountNumber: props.bankAccount,
      accountName: props.beneficiaryName || undefined,
      amount: amount.value > 0 ? amount.value : undefined,
      addInfo: props.transferNote || undefined,
    }

    const dataUrl = await generateVietQrDataUrl(params)
    if (dataUrl) {
      qrImageUrl.value = dataUrl
    } else {
      qrImageUrl.value = buildVietQrImageUrl(params)
    }
    if (!qrImageUrl.value) qrError.value = true
  } catch {
    qrError.value = true
  } finally {
    qrLoading.value = false
  }
}

const onQrImageError = () => {
  if (!props.bankAccount || !props.bankName) return
  const fallback = buildVietQrImageUrl({
    bankNameOrBin: props.bankName,
    accountNumber: props.bankAccount,
    accountName: props.beneficiaryName || undefined,
    amount: amount.value > 0 ? amount.value : undefined,
    addInfo: props.transferNote || undefined,
  })
  if (fallback && qrImageUrl.value !== fallback) {
    qrImageUrl.value = fallback
    return
  }
  qrError.value = true
}

watch(
  () => [props.beneficiaryName, props.bankAccount, props.bankName, props.amount, props.transferNote],
  () => loadQr(),
)

onMounted(() => loadQr())
</script>
