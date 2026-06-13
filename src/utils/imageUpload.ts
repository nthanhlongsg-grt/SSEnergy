/** Shared helpers for image pick, drag-drop, and clipboard paste. */

export function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  // Windows screenshot / Snipping Tool sometimes omits MIME type
  if (!file.type || file.type === 'application/octet-stream') {
    return file.size > 0
  }
  return false
}

export function filterImageFiles(files: Iterable<File>): File[] {
  return Array.from(files).filter(isImageFile)
}

function clipboardHasPlainText(event: ClipboardEvent): boolean {
  const dt = event.clipboardData
  if (!dt) return false
  const text = dt.getData('text/plain')?.trim()
  if (text) return true
  const items = dt.items
  if (!items) return false
  for (const item of items) {
    if (item.kind === 'string' && item.type === 'text/plain') return true
  }
  return false
}

function pushClipboardFile(files: File[], seenSizes: Set<number>, blob: File | Blob, fallbackName: string) {
  const type = blob.type || 'image/png'
  if (!type.startsWith('image/') && type !== 'application/octet-stream' && type !== '') return
  if (blob.size === 0) return

  // Cùng một ảnh thường xuất hiện cả trong items lẫn files — dedupe theo size
  if (seenSizes.has(blob.size)) return
  seenSizes.add(blob.size)

  const hasName = blob instanceof File && blob.name && !/^image\d*\.(png|jpe?g|gif|webp)$/i.test(blob.name)
  const name = hasName ? (blob as File).name : fallbackName
  const file = blob instanceof File ? blob : new File([blob], name, { type: type.startsWith('image/') ? type : 'image/png' })
  files.push(file)
}

/** Extract image files from a clipboard paste event (screenshot, copied image, etc.). */
export function getImageFilesFromClipboard(event: ClipboardEvent): File[] {
  const dt = event.clipboardData
  if (!dt) return []

  const files: File[] = []
  const seenSizes = new Set<number>()
  let index = 0

  const items = dt.items
  if (items?.length) {
    for (const item of items) {
      if (item.kind !== 'file') continue
      const blob = item.getAsFile()
      if (!blob) continue
      pushClipboardFile(files, seenSizes, blob, `clipboard-${Date.now()}-${index++}.png`)
    }
  }

  // Chỉ fallback khi items không có file (tránh double cùng ảnh từ items + files)
  if (files.length === 0 && dt.files?.length) {
    for (const file of dt.files) {
      if (!isImageFile(file)) continue
      pushClipboardFile(files, seenSizes, file, file.name || `clipboard-${Date.now()}-${index++}.png`)
    }
  }

  return files
}

export { clipboardHasPlainText }

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export async function compressImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.8,
  outputType = 'image/jpeg',
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
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
            const ext = outputType === 'image/png' ? '.png' : '.jpg'
            const baseName = file.name.replace(/\.[^.]+$/, '') || 'image'
            resolve(
              new File([blob], `${baseName}${ext}`, {
                type: outputType,
                lastModified: Date.now(),
              }),
            )
          },
          outputType,
          quality,
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

export async function addFilesToImageList(
  incoming: File[],
  files: File[],
  previews: string[],
  options?: {
    maxSizeBytes?: number
    onTooLarge?: (fileName: string) => void
  },
): Promise<void> {
  const maxSize = options?.maxSizeBytes ?? 10 * 1024 * 1024

  for (const file of filterImageFiles(incoming)) {
    if (file.size > maxSize) {
      options?.onTooLarge?.(file.name)
      continue
    }
    previews.push(await readFileAsDataUrl(file))
    files.push(file)
  }
}
