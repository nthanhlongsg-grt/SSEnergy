/**
 * Date and Time utility functions for Vietnam timezone (UTC+7)
 * Timezone: Asia/Ho_Chi_Minh
 */

const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh'

/**
 * Format a date/time string or Date object to Vietnamese locale format
 * @param dateString - Date string or Date object
 * @param includeTime - Whether to include time in the output
 * @returns Formatted date/time string
 */
export const formatDateTime = (
  dateString: string | Date | null | undefined,
  includeTime: boolean = true
): string => {
  if (!dateString) return 'N/A'
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  if (isNaN(date.getTime())) return 'N/A'
  
  const options: Intl.DateTimeFormatOptions = {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }
  
  if (includeTime) {
    options.hour = '2-digit'
    options.minute = '2-digit'
  }
  
  return new Intl.DateTimeFormat('vi-VN', options).format(date)
}

/**
 * Format a date string or Date object to Vietnamese date format (without time)
 * @param dateString - Date string or Date object
 * @returns Formatted date string
 */
export const formatDate = (
  dateString: string | Date | null | undefined
): string => {
  if (!dateString) return 'N/A'
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  if (isNaN(date.getTime())) return 'N/A'
  
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/**
 * Format a date to Vietnamese locale with full date details
 * @param date - Date object
 * @returns Formatted date string with weekday
 */
export const formatDateFull = (date: Date): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: VIETNAM_TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/**
 * Get current date/time in Vietnam timezone
 * @returns Date object adjusted to Vietnam timezone
 */
export const getVietnamNow = (): Date => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: VIETNAM_TIMEZONE }))
}

/** YYYY-MM-DD in Vietnam timezone */
export const getVietnamDateString = (date: Date = getVietnamNow()): string => {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** First day of current month → today in Vietnam timezone */
export const getVietnamMonthRange = (): { from: string; to: string } => {
  const now = getVietnamNow()
  const from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  return { from, to: getVietnamDateString(now) }
}

/** Monday → Sunday of current week in Vietnam timezone */
export const getVietnamWeekRange = (): { from: string; to: string } => {
  const now = getVietnamNow()
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(now.getFullYear(), now.getMonth(), diff)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    from: getVietnamDateString(monday),
    to: getVietnamDateString(sunday),
  }
}

/** Full current calendar month in Vietnam timezone */
export const getVietnamFullMonthRange = (): { from: string; to: string } => {
  const now = getVietnamNow()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  return {
    from: getVietnamDateString(firstDay),
    to: getVietnamDateString(lastDay),
  }
}

/** Jan 1 → Dec 31 of current year in Vietnam timezone */
export const getVietnamYearRange = (): { from: string; to: string } => {
  const year = getVietnamNow().getFullYear()
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}

/**
 * Convert a date string to ISO string in Vietnam timezone
 * @param dateString - Date string or Date object
 * @returns ISO string
 */
export const toVietnamISOString = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  // Get date components in Vietnam timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  
  const parts = formatter.formatToParts(date)
  const year = parts.find(p => p.type === 'year')?.value
  const month = parts.find(p => p.type === 'month')?.value
  const day = parts.find(p => p.type === 'day')?.value
  const hour = parts.find(p => p.type === 'hour')?.value
  const minute = parts.find(p => p.type === 'minute')?.value
  const second = parts.find(p => p.type === 'second')?.value
  
  return `${year}-${month}-${day}T${hour}:${minute}:${second}+07:00`
}

/**
 * Format date for input type="date" (YYYY-MM-DD format)
 * @param dateString - Date string or Date object
 * @returns Date string in YYYY-MM-DD format in Vietnam timezone
 */
export const formatDateForInput = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return ''
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  if (isNaN(date.getTime())) return ''
  
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  
  return formatter.format(date)
}

/**
 * Format datetime for input type="datetime-local" (YYYY-MM-DDTHH:mm format)
 * @param dateString - Date string or Date object
 * @returns Date string in YYYY-MM-DDTHH:mm format in Vietnam timezone
 */
export const formatDateTimeForInput = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return ''
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  if (isNaN(date.getTime())) return ''
  
  // Format to YYYY-MM-DDTHH:mm
  const dateStr = formatDateForInput(date)
  const timeFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: VIETNAM_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  
  const timeParts = timeFormatter.formatToParts(date)
  const hour = timeParts.find(p => p.type === 'hour')?.value?.padStart(2, '0')
  const minute = timeParts.find(p => p.type === 'minute')?.value?.padStart(2, '0')
  
  return `${dateStr}T${hour}:${minute}`
}

/** yyyy-mm-dd → dd/mm/yyyy (hiển thị nhập tay) */
export function formatIsoToDdMmYyyy(iso: string | null | undefined): string {
  if (!iso) return ''
  const s = String(iso).trim().slice(0, 10)
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return s
  return `${m[3]}/${m[2]}/${m[1]}`
}

/** dd/mm/yyyy hoặc yyyy-mm-dd → yyyy-mm-dd (lưu API) */
export function parseDdMmYyyyToIso(input: string | null | undefined): string | null {
  if (!input?.trim()) return null
  const s = input.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const dmY = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (!dmY) return null
  const day = Number(dmY[1])
  const month = Number(dmY[2])
  const year = Number(dmY[3])
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900) return null
  const d = new Date(year, month - 1, day)
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null
  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${year}-${mm}-${dd}`
}

