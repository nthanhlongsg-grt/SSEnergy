export interface ReplacementPartRow {
  material: string
  unit: string
  quantity: number
  notes: string
}

export function parseReplacementParts(raw: string | null | undefined): ReplacementPartRow[] | null {
  if (!raw?.trim()) return null
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return null
    return parsed.map(item => ({
      material: String(item.material ?? '').trim(),
      unit: String(item.unit ?? '').trim(),
      quantity: Number(item.quantity) || 0,
      notes: String(item.notes ?? '').trim(),
    }))
  } catch {
    return null
  }
}

export function renderReplacementPartsSection(
  raw: string | null | undefined,
  escapeHtml: (s: string) => string,
  title: string
): string {
  const rows = parseReplacementParts(raw)
  if (rows?.length) {
    return `
        <div style="margin-bottom: 24px;">
          <div class="section-title" style="font-size: 16px; margin-bottom: 12px;">${title}</div>
          <table style="width:100%; border-collapse:collapse; font-size:13px;">
            <thead>
              <tr>
                <th style="border:1px solid #d1d5db; padding:8px; background:#f3f4f6; width:48px;">STT</th>
                <th style="border:1px solid #d1d5db; padding:8px; background:#f3f4f6;">Vật tư</th>
                <th style="border:1px solid #d1d5db; padding:8px; background:#f3f4f6; width:72px;">ĐVT</th>
                <th style="border:1px solid #d1d5db; padding:8px; background:#f3f4f6; width:80px;">Số lượng</th>
                <th style="border:1px solid #d1d5db; padding:8px; background:#f3f4f6;">Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (row, idx) => `
              <tr>
                <td style="border:1px solid #d1d5db; padding:8px; text-align:center;">${idx + 1}</td>
                <td style="border:1px solid #d1d5db; padding:8px;">${escapeHtml(row.material || '—')}</td>
                <td style="border:1px solid #d1d5db; padding:8px; text-align:center;">${escapeHtml(row.unit || '—')}</td>
                <td style="border:1px solid #d1d5db; padding:8px; text-align:center;">${row.quantity || '—'}</td>
                <td style="border:1px solid #d1d5db; padding:8px;">${escapeHtml(row.notes || '—')}</td>
              </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>`
  }

  if (!raw?.trim()) return ''
  return `
        <div style="margin-bottom: 24px;">
          <div class="section-title" style="font-size: 16px; margin-bottom: 12px;">${title}</div>
          <div class="content-box">${escapeHtml(raw).replace(/\n/g, '<br>')}</div>
        </div>`
}
