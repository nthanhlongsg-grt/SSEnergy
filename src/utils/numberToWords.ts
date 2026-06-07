// Đọc số tiền thành chữ tiếng Việt (dùng cho hợp đồng, hóa đơn)

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
const UNITS = ['', 'nghìn', 'triệu', 'tỷ']

function readThreeDigits(num: number, full: boolean): string {
  const hundred = Math.floor(num / 100)
  const ten = Math.floor((num % 100) / 10)
  const unit = num % 10
  let result = ''

  if (full || hundred > 0) {
    result += DIGITS[hundred] + ' trăm'
  }

  if (ten > 1) {
    result += ' ' + DIGITS[ten] + ' mươi'
    if (unit === 1) result += ' mốt'
    else if (unit === 5) result += ' lăm'
    else if (unit > 0) result += ' ' + DIGITS[unit]
  } else if (ten === 1) {
    result += ' mười'
    if (unit === 5) result += ' lăm'
    else if (unit > 0) result += ' ' + DIGITS[unit]
  } else {
    // ten === 0
    if (unit > 0) {
      if (full || hundred > 0) result += ' lẻ'
      result += ' ' + DIGITS[unit]
    }
  }

  return result.trim()
}

/**
 * Chuyển một số nguyên (>= 0) thành chữ tiếng Việt.
 * VD: 17280000 -> "mười bảy triệu hai trăm tám mươi nghìn"
 */
export function numberToVietnameseWords(value: number): string {
  let num = Math.floor(Math.abs(value || 0))
  if (num === 0) return 'không'

  // Tách thành các nhóm 3 chữ số
  const groups: number[] = []
  while (num > 0) {
    groups.push(num % 1000)
    num = Math.floor(num / 1000)
  }

  const parts: string[] = []
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i]
    if (group === 0) continue
    // Nhóm cao nhất không cần đọc đủ hàng trăm (nếu trăm = 0)
    const isHighest = i === groups.length - 1
    const text = readThreeDigits(group, !isHighest)
    parts.push((text + ' ' + UNITS[i]).trim())
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim()
}

/**
 * Đọc số tiền VNĐ thành chữ, viết hoa chữ đầu, kèm "đồng".
 * VD: 17280000 -> "Mười bảy triệu hai trăm tám mươi nghìn đồng"
 */
export function amountToVietnameseWords(value: number): string {
  const words = numberToVietnameseWords(value)
  const capitalized = words.charAt(0).toUpperCase() + words.slice(1)
  return `${capitalized} đồng`
}
