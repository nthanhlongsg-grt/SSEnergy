import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** Relative path prefix stored in DB for disk-backed attachments */
export const DISK_PATH_PREFIX = 'uploads/tickets/'

export function getAttachmentsRoot(): string {
  if (process.env.ATTACHMENTS_PATH) {
    return path.resolve(process.env.ATTACHMENTS_PATH)
  }
  // dist/utils -> ../../uploads/tickets
  return path.resolve(__dirname, '../../uploads/tickets')
}

export function isBase64Stored(filePath: string | null | undefined): boolean {
  if (!filePath) return false
  const s = String(filePath)
  if (s.startsWith('data:')) return true
  if (s.startsWith(DISK_PATH_PREFIX) || s.startsWith('uploads/')) return false
  if (s.includes('/') || s.includes('\\')) return false
  return s.length > 100
}

export function isDiskStored(filePath: string | null | undefined): boolean {
  if (!filePath) return false
  const s = String(filePath)
  return s.startsWith(DISK_PATH_PREFIX) || s.startsWith('uploads/tickets/')
}

export function resolveAttachmentAbsolutePath(relativePath: string): string | null {
  if (!relativePath || isBase64Stored(relativePath)) return null
  const normalized = relativePath.replace(/^uploads\/tickets\//, '')
  const absolute = path.join(getAttachmentsRoot(), normalized)
  const root = path.resolve(getAttachmentsRoot())
  if (!absolute.startsWith(root)) return null
  return absolute
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'file'
}

export function decodeUploadPayload(
  file: string,
  mimeType?: string,
): { buffer: Buffer; mimeType: string } {
  let raw = file
  let detectedMime = mimeType || 'application/octet-stream'

  if (raw.startsWith('data:')) {
    const match = raw.match(/^data:([^;]+);base64,(.+)$/)
    if (!match) throw new Error('Invalid data URI')
    detectedMime = match[1]
    raw = match[2]
  }

  const buffer = Buffer.from(raw, 'base64')
  if (!buffer.length) throw new Error('Empty file data')
  return { buffer, mimeType: detectedMime }
}

export function saveAttachmentToDisk(
  ticketId: number,
  filename: string,
  buffer: Buffer,
): { relativePath: string; absolutePath: string; size: number } {
  const ticketDir = path.join(getAttachmentsRoot(), String(ticketId))
  fs.mkdirSync(ticketDir, { recursive: true })

  const safeName = sanitizeFilename(filename)
  const unique = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${safeName}`
  const absolutePath = path.join(ticketDir, unique)
  fs.writeFileSync(absolutePath, buffer)

  const relativePath = `${DISK_PATH_PREFIX}${ticketId}/${unique}`
  return { relativePath, absolutePath, size: buffer.length }
}

/** Strip heavy file_path from API responses */
export function sanitizeAttachmentRow(row: Record<string, unknown>, ticketId: number) {
  const { file_path: _fp, ...rest } = row
  const id = row.id as number
  return {
    ...rest,
    url: `/api/tickets/${ticketId}/attachments/${id}`,
  }
}
