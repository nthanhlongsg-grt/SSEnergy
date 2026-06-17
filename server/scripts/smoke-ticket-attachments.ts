import 'dotenv/config'
import fs from 'fs'
import path from 'path'

const BASE = 'http://localhost:3000/api'
const EMAIL = 'admin@demo.local'
const PASSWORD = process.env.DEMO_SEED_PASSWORD || 'LocalTest123!'

async function main() {
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  const login = await loginRes.json()
  if (!login.token) throw new Error(`Login failed: ${JSON.stringify(login)}`)
  const headers = { Authorization: `Bearer ${login.token}`, 'Content-Type': 'application/json' }

  const ticketId = 1
  const detailRes = await fetch(`${BASE}/tickets/${ticketId}`, { headers })
  const detailText = await detailRes.text()
  console.log(`GET /tickets/${ticketId}: ${detailRes.status}, ${detailText.length} bytes`)
  const detail = JSON.parse(detailText)
  const hasBase64 = detailText.includes('data:image') || /file_path/.test(detailText)
  console.log(`  has base64/file_path in JSON: ${hasBase64}`)
  console.log(`  comments: ${detail.comments?.length ?? 0}, attachments: ${detail.attachments?.length ?? 0}`)

  // 1x1 PNG
  const pngBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  const commentRes = await fetch(`${BASE}/tickets/${ticketId}/comments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ comment: 'Smoke test comment with image', is_internal: false }),
  })
  const comment = await commentRes.json()
  if (!comment.id) throw new Error(`Comment failed: ${JSON.stringify(comment)}`)
  console.log(`POST comment id=${comment.id}`)

  const uploadRes = await fetch(`${BASE}/tickets/${ticketId}/attachments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      file: pngBase64,
      filename: 'smoke-test.png',
      mime_type: 'image/png',
      comment_id: comment.id,
    }),
  })
  const upload = await uploadRes.json()
  if (!upload.id) throw new Error(`Upload failed: ${JSON.stringify(upload)}`)
  console.log(`POST attachment id=${upload.id}, url=${upload.url}`)
  console.log(`  file_path in response: ${upload.file_path ?? '(omitted)'}`)

  const fileRes = await fetch(`${BASE}/tickets/${ticketId}/attachments/${upload.id}`)
  console.log(`GET attachment file: ${fileRes.status}, content-type=${fileRes.headers.get('content-type')}, bytes=${(await fileRes.arrayBuffer()).byteLength}`)

  const detail2Res = await fetch(`${BASE}/tickets/${ticketId}`, { headers })
  const detail2Text = await detail2Res.text()
  const detail2 = JSON.parse(detail2Text)
  const c = detail2.comments.find((x: { id: number }) => x.id === comment.id)
  console.log(`After upload detail size: ${detail2Text.length} bytes, comment.images=${JSON.stringify(c?.images)}`)

  const uploadsRoot = path.resolve('uploads/tickets', String(ticketId))
  const files = fs.existsSync(uploadsRoot) ? fs.readdirSync(uploadsRoot) : []
  console.log(`Disk files in ${uploadsRoot}: ${files.length}`)

  const syncRes = await fetch(`${BASE}/sync/changes?ticket_id=${ticketId}`, { headers })
  const sync = await syncRes.json()
  console.log(`GET /sync/changes: ${JSON.stringify(sync)}`)

  console.log('\n✅ Smoke test passed')
}

main().catch((err) => {
  console.error('❌ Smoke test failed:', err)
  process.exit(1)
})
