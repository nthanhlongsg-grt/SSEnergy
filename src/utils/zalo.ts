/** Chuẩn hóa SĐT VN cho link Zalo (84xxxxxxxxx, không dấu +). */
export function normalizePhoneForZalo(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (!digits) return ''
  if (digits.startsWith('84')) return digits
  if (digits.startsWith('0')) return `84${digits.slice(1)}`
  return digits
}

export function zaloChatUrl(phone?: string | null): string | null {
  if (!phone?.trim()) return null
  const normalized = normalizePhoneForZalo(phone)
  return normalized ? `https://zalo.me/${normalized}` : null
}
