import { getApiBaseUrlWithoutApi } from '@/utils/apiUrl'

export function ticketAttachmentUrl(ticketId: number | string, attachmentId: number | string): string {
  const base = getApiBaseUrlWithoutApi()
  return `${base}/api/tickets/${ticketId}/attachments/${attachmentId}`
}

function resolveApiPath(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const base = getApiBaseUrlWithoutApi()
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}

/** Resolve comment image entry: attachment ID, legacy base64, or API url field. */
export function resolveCommentImageSrc(
  img: number | string,
  ticketId: number | string,
): string {
  if (typeof img === 'number') {
    return ticketAttachmentUrl(ticketId, img)
  }
  if (typeof img === 'string') {
    if (img.startsWith('data:') || img.startsWith('http')) return img
    if (/^\d+$/.test(img)) return ticketAttachmentUrl(ticketId, img)
    if (img.length > 100 && !img.includes('/') && !img.includes('\\')) {
      return `data:image/jpeg;base64,${img}`
    }
  }
  return img
}

/** Resolve ticket HTML report path from API. */
export function resolveReportUrl(apiPath: string | null | undefined): string {
  if (!apiPath) return ''
  return resolveApiPath(apiPath)
}
export function resolveAttachmentUrl(
  attachment: { id?: number; url?: string; file_path?: string },
  ticketId?: number | string,
): string {
  if (!attachment) return ''

  if (attachment.url) {
    return resolveApiPath(attachment.url)
  }

  const filePath = attachment.file_path || ''
  if (filePath && typeof filePath === 'string') {
    if (filePath.startsWith('data:')) return filePath
    if (
      filePath.length > 100 &&
      !filePath.includes('/') &&
      !filePath.includes('\\') &&
      !filePath.startsWith('http')
    ) {
      return `data:image/jpeg;base64,${filePath}`
    }
    if (filePath.startsWith('uploads/')) {
      // Legacy disk path without url field — still served via attachment ID
    }
  }

  if (attachment.id && ticketId) {
    return ticketAttachmentUrl(ticketId, attachment.id)
  }

  if (filePath && (filePath.startsWith('http') || filePath.startsWith('/'))) {
    return filePath.startsWith('/') ? resolveApiPath(filePath) : filePath
  }

  return ''
}
