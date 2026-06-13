import { onMounted, onUnmounted, type Ref } from 'vue'
import { clipboardHasPlainText, getImageFilesFromClipboard } from '@/utils/imageUpload'

export interface UseImagePasteOptions {
  enabled?: () => boolean
  /** Upload zone — document listener handles paste when zone is focused or clicked */
  zoneRef?: Ref<HTMLElement | null>
  /** Paste screenshot anywhere on page when clipboard has image only (no plain text) */
  globalImagePaste?: boolean
}

const PASTE_HANDLED = Symbol('imagePasteHandled')

/** Handle Ctrl+V / clipboard paste when the target zone contains image data. */
export function useImagePaste(
  onImages: (files: File[]) => void | Promise<void>,
  options?: UseImagePasteOptions,
) {
  let zoneActive = false
  const usesDocumentListener = !!(options?.zoneRef || options?.globalImagePaste)

  async function processPaste(event: ClipboardEvent): Promise<boolean> {
    if ((event as ClipboardEvent & { [PASTE_HANDLED]?: boolean })[PASTE_HANDLED]) return false
    if (options?.enabled && !options.enabled()) return false

    const files = getImageFilesFromClipboard(event)
    if (files.length === 0) return false

    ;(event as ClipboardEvent & { [PASTE_HANDLED]?: boolean })[PASTE_HANDLED] = true
    event.preventDefault()
    event.stopPropagation()
    await onImages(files)
    return true
  }

  /** Direct @paste on element — skip when document listener owns this zone */
  async function handlePaste(event: ClipboardEvent) {
    if (usesDocumentListener && options?.zoneRef?.value) return
    await processPaste(event)
  }

  function focusZone() {
    zoneActive = true
    options?.zoneRef?.value?.focus()
  }

  function onDocumentPaste(event: ClipboardEvent) {
    if ((event as ClipboardEvent & { [PASTE_HANDLED]?: boolean })[PASTE_HANDLED]) return

    const zone = options?.zoneRef?.value
    const target = event.target as Node | null
    const active = document.activeElement

    const targetInZone = !!(zone && target && zone.contains(target))
    const focusInZone = !!(zone && active && (active === zone || zone.contains(active)))
    const imageOnly = !clipboardHasPlainText(event)

    let shouldHandle = targetInZone || focusInZone || zoneActive

    if (options?.globalImagePaste && imageOnly) {
      shouldHandle = true
    }

    if (!shouldHandle) return

    void processPaste(event).then((handled) => {
      if (handled) zoneActive = false
    })
  }

  function onDocumentFocusIn(event: FocusEvent) {
    const zone = options?.zoneRef?.value
    if (!zone) return
    const target = event.target as Node | null
    zoneActive = !!(target && zone.contains(target))
  }

  onMounted(() => {
    if (usesDocumentListener) {
      document.addEventListener('paste', onDocumentPaste)
      document.addEventListener('focusin', onDocumentFocusIn)
    }
  })

  onUnmounted(() => {
    if (usesDocumentListener) {
      document.removeEventListener('paste', onDocumentPaste)
      document.removeEventListener('focusin', onDocumentFocusIn)
    }
  })

  return { handlePaste, focusZone }
}
