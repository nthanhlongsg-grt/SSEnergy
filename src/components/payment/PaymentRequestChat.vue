<template>
  <div class="rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm p-5 sm:p-6">
    <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">
      {{ t('paymentRequests.chat.title') }}
    </h2>

    <div v-if="loadError" class="mb-3 text-sm text-red-600 dark:text-red-400">{{ loadError }}</div>

    <div
      ref="scrollRef"
      class="max-h-72 overflow-y-auto space-y-3 mb-4 pr-1"
    >
      <div v-if="loading && comments.length === 0" class="text-sm text-gray-500 text-center py-6">
        {{ t('common.loading') }}
      </div>
      <div
        v-for="comment in comments"
        :key="comment.id"
        class="border-l-4 border-blue-400 pl-3 py-1"
      >
        <div class="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span class="text-sm font-medium text-gray-900 dark:text-white">{{ comment.user_name || '—' }}</span>
          <span class="text-xs text-gray-400">{{ formatDateTime(comment.created_at) }}</span>
        </div>
        <p class="mt-1 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ comment.comment }}</p>
      </div>
      <p v-if="!loading && comments.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-6">
        {{ t('paymentRequests.chat.empty') }}
      </p>
    </div>

    <form class="pt-4 border-t border-gray-200 dark:border-gray-700" @submit.prevent="sendComment">
      <textarea
        v-model="newComment"
        rows="2"
        :placeholder="t('paymentRequests.chat.placeholder')"
        :disabled="sending"
        class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none disabled:opacity-60"
      />
      <div class="mt-2 flex justify-end">
        <button
          type="submit"
          :disabled="sending || !newComment.trim()"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 min-h-[40px]"
        >
          {{ sending ? t('common.saving') : t('paymentRequests.chat.send') }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { POLL } from '@/utils/pollInterval'
import {
  paymentRequestService,
  type PaymentRequestComment,
} from '@/services/paymentRequestService'

const props = defineProps<{
  paymentRequestId: number
}>()

const { t } = useI18n()

const comments = ref<PaymentRequestComment[]>([])
const loading = ref(true)
const loadError = ref('')
const newComment = ref('')
const sending = ref(false)
const scrollRef = ref<HTMLElement | null>(null)

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const scrollToBottom = async () => {
  await nextTick()
  if (scrollRef.value) {
    scrollRef.value.scrollTop = scrollRef.value.scrollHeight
  }
}

const fetchComments = async () => {
  try {
    const data = await paymentRequestService.listComments(props.paymentRequestId)
    const prevCount = comments.value.length
    comments.value = data
    loadError.value = ''
    if (data.length > prevCount) {
      await scrollToBottom()
    }
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : t('paymentRequests.chat.loadFailed')
  } finally {
    loading.value = false
  }
}

const sendComment = async () => {
  const text = newComment.value.trim()
  if (!text || sending.value) return
  sending.value = true
  loadError.value = ''
  try {
    const created = await paymentRequestService.addComment(props.paymentRequestId, text)
    comments.value.push(created)
    newComment.value = ''
    await scrollToBottom()
  } catch (err) {
    loadError.value = err instanceof Error ? err.message : t('paymentRequests.chat.sendFailed')
  } finally {
    sending.value = false
  }
}

const { stop: stopAutoRefresh } = useAutoRefresh({
  interval: POLL.chatRefresh(),
  fetchFn: async () => {
    if (!sending.value) await fetchComments()
  },
  pauseWhenHidden: true,
})

watch(
  () => props.paymentRequestId,
  () => {
    loading.value = true
    comments.value = []
    fetchComments()
  },
)

onMounted(async () => {
  await fetchComments()
})

onUnmounted(() => stopAutoRefresh())
</script>
