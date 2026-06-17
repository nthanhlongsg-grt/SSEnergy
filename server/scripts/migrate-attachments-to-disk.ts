/**
 * One-time migration: move base64 ticket_attachments.file_path to disk.
 * Run with server stopped: npm run db:migrate:attachments
 */
import db from '../src/database/db.js'
import {
  decodeUploadPayload,
  isBase64Stored,
  saveAttachmentToDisk,
} from '../src/utils/attachmentStorage.js'

const rows = db.prepare(`
  SELECT id, ticket_id, filename, file_path, mime_type, file_size
  FROM ticket_attachments
  WHERE file_path IS NOT NULL AND file_path != ''
`).all() as Array<{
  id: number
  ticket_id: number
  filename: string
  file_path: string
  mime_type: string | null
  file_size: number | null
}>

let migrated = 0
let skipped = 0

for (const row of rows) {
  if (!isBase64Stored(row.file_path)) {
    skipped++
    continue
  }

  try {
    const { buffer } = decodeUploadPayload(row.file_path, row.mime_type || undefined)
    const { relativePath, size } = saveAttachmentToDisk(row.ticket_id, row.filename, buffer)
    db.prepare(`
      UPDATE ticket_attachments
      SET file_path = ?, file_size = ?
      WHERE id = ?
    `).run(relativePath, size, row.id)
    migrated++
    console.log(`Migrated attachment #${row.id} (ticket ${row.ticket_id})`)
  } catch (err) {
    console.error(`Failed attachment #${row.id}:`, err)
  }
}

console.log(`Done. Migrated: ${migrated}, skipped (already on disk): ${skipped}`)
