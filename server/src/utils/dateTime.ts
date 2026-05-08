/**
 * Date and Time utility functions for Vietnam timezone (UTC+7)
 * Timezone: Asia/Ho_Chi_Minh
 */

const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh'
const UTC_OFFSET_MS = 7 * 60 * 60 * 1000 // 7 hours in milliseconds

/**
 * Get current date/time in Vietnam timezone
 * @returns Date string in ISO format with Vietnam timezone offset
 */
export const getVietnamNow = (): string => {
  const now = new Date()
  // Add 7 hours to UTC to get Vietnam time
  const vietnamTime = new Date(now.getTime() + UTC_OFFSET_MS)
  return vietnamTime.toISOString().replace('Z', '+07:00')
}

/**
 * Get current date/time in Vietnam timezone as Date object
 * @returns Date object adjusted to Vietnam timezone
 */
export const getVietnamDate = (): Date => {
  const now = new Date()
  return new Date(now.getTime() + UTC_OFFSET_MS)
}

/**
 * Format a date string to Vietnam timezone ISO string
 * @param dateString - Date string or Date object (assumed to be UTC from database)
 * @returns ISO string with Vietnam timezone offset (+07:00)
 */
export const toVietnamISOString = (dateString: string | Date | null | undefined): string | null => {
  if (!dateString) return null
  
  try {
    let date: Date
    
    if (typeof dateString === 'string') {
      // Handle SQLite datetime format (YYYY-MM-DD HH:MM:SS) - treat as UTC
      if (dateString.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
        // SQLite format - append 'Z' to indicate UTC
        date = new Date(dateString + 'Z')
      } else if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Date only - treat as UTC midnight
        date = new Date(dateString + 'T00:00:00Z')
      } else {
        // ISO format or other - parse directly
        date = new Date(dateString)
      }
    } else {
      date = dateString
    }
    
    if (isNaN(date.getTime())) return null
    
    // Convert UTC to Vietnam timezone (UTC+7)
    // Get UTC time components
    const utcTime = date.getTime()
    // Add 7 hours (in milliseconds)
    const vietnamTime = new Date(utcTime + UTC_OFFSET_MS)
    
    // Format as ISO string with +07:00 offset
    const year = vietnamTime.getUTCFullYear()
    const month = String(vietnamTime.getUTCMonth() + 1).padStart(2, '0')
    const day = String(vietnamTime.getUTCDate()).padStart(2, '0')
    const hours = String(vietnamTime.getUTCHours()).padStart(2, '0')
    const minutes = String(vietnamTime.getUTCMinutes()).padStart(2, '0')
    const seconds = String(vietnamTime.getUTCSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+07:00`
  } catch {
    return null
  }
}

/**
 * Format a date string to Vietnam timezone for display
 * @param dateString - Date string or Date object
 * @param format - Format type: 'iso', 'datetime', 'date', 'time'
 * @returns Formatted date string
 */
export const formatVietnamDateTime = (
  dateString: string | Date | null | undefined,
  format: 'iso' | 'datetime' | 'date' | 'time' = 'datetime'
): string => {
  if (!dateString) return 'N/A'
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    if (isNaN(date.getTime())) return 'N/A'
    
    // Convert to Vietnam timezone
    const vietnamTime = new Date(date.getTime() + UTC_OFFSET_MS)
    
    switch (format) {
      case 'iso':
        return vietnamTime.toISOString().replace('Z', '+07:00')
      case 'datetime':
        return vietnamTime.toLocaleString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      case 'date':
        return vietnamTime.toLocaleDateString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
      case 'time':
        return vietnamTime.toLocaleTimeString('vi-VN', {
          timeZone: 'Asia/Ho_Chi_Minh',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      default:
        return 'N/A'
    }
  } catch {
    return 'N/A'
  }
}

/**
 * Format CURRENT_TIMESTAMP for SQL queries to return Vietnam timezone
 * SQLite doesn't support timezone conversion natively, so we format after query
 * @param dateString - Date string from SQLite CURRENT_TIMESTAMP
 * @returns Formatted date string in Vietnam timezone
 */
export const formatSQLiteTimestamp = (dateString: string | null | undefined): string | null => {
  if (!dateString) return null
  return toVietnamISOString(dateString)
}

/**
 * Convert a JavaScript Date to SQLite DATETIME format (for INSERT/UPDATE)
 * Note: SQLite stores timestamps in UTC, but we format them as Vietnam time for consistency
 * @param date - Date object or date string
 * @returns SQLite-compatible datetime string
 */
export const toSQLiteDateTime = (date: Date | string | null | undefined): string | null => {
  if (!date) return null
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return null
    
    // Format as YYYY-MM-DD HH:mm:ss (SQLite format)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const hours = String(dateObj.getHours()).padStart(2, '0')
    const minutes = String(dateObj.getMinutes()).padStart(2, '0')
    const seconds = String(dateObj.getSeconds()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
  } catch {
    return null
  }
}

/**
 * Convert date/time input to Vietnam timezone for database storage
 * @param dateString - Date string from form input (local time)
 * @returns Date string in Vietnam timezone
 */
export const convertInputToVietnamTime = (dateString: string | null | undefined): string | null => {
  if (!dateString) return null
  
  try {
    // Parse as local time and convert to Vietnam timezone
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return null
    
    // Adjust to Vietnam timezone
    const vietnamTime = new Date(date.getTime() + UTC_OFFSET_MS)
    return vietnamTime.toISOString().replace('Z', '+07:00')
  } catch {
    return null
  }
}

/**
 * Format timestamps in an object/array to Vietnam timezone
 * Recursively processes objects and arrays to find and format timestamp fields
 * @param data - Object or array to format
 * @returns Object/array with formatted timestamps
 */
export const formatTimestampsInResponse = (data: any): any => {
  if (data === null || data === undefined) return data
  
  // Skip formatting for error responses or non-data responses
  if (typeof data === 'object' && 'error' in data && Object.keys(data).length === 1) {
    return data
  }
  
  if (Array.isArray(data)) {
    return data.map(item => formatTimestampsInResponse(item))
  }
  
  if (typeof data === 'object' && !(data instanceof Date)) {
    const formatted: any = {}
    for (const [key, value] of Object.entries(data)) {
      // Format common timestamp field names
      if (
        (key.includes('_at') || 
         key.includes('_date') || 
         key.includes('deadline') ||
         key.includes('time')) &&
        value !== null &&
        value !== undefined
      ) {
        // Only format if it looks like a date string or timestamp
        if (typeof value === 'string' && (value.match(/^\d{4}-\d{2}-\d{2}/) || value.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/))) {
          formatted[key] = toVietnamISOString(value as string)
        } else {
          formatted[key] = value
        }
      } else if (Array.isArray(value)) {
        formatted[key] = value.map(item => formatTimestampsInResponse(item))
      } else if (typeof value === 'object' && value !== null) {
        formatted[key] = formatTimestampsInResponse(value)
      } else {
        formatted[key] = value
      }
    }
    return formatted
  }
  
  return data
}

