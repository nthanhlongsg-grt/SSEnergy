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

