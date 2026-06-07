export interface ReplacementPartRow {
  material: string
  unit: string
  quantity: number | string
  notes: string
}

export function emptyReplacementPartRow(): ReplacementPartRow {
  return { material: '', unit: '', quantity: 1, notes: '' }
}

export function serializeReplacementParts(rows: ReplacementPartRow[]): string | null {
  const items = rows
    .map(row => ({
      material: row.material.trim(),
      unit: row.unit.trim(),
      quantity: Number(row.quantity) || 0,
      notes: row.notes.trim(),
    }))
    .filter(row => row.material || row.unit || row.notes || row.quantity > 0)

  if (items.length === 0) return null
  return JSON.stringify(items)
}
