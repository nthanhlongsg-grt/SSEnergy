/**
 * Composable for Flatpickr date/time picker configurations
 */

export const useFlatpickrConfig = () => {
  // Date picker config (date only, no time)
  const dateConfig = {
    dateFormat: 'Y-m-d',
    altInput: true,
    altFormat: 'd/m/Y',
    locale: {
      firstDayOfWeek: 1, // Monday
    },
  }

  // Date and time picker config (with time)
  const dateTimeConfig = {
    enableTime: true,
    dateFormat: 'Y-m-d H:i',
    altInput: true,
    altFormat: 'd/m/Y H:i',
    time_24hr: false,
    locale: {
      firstDayOfWeek: 1, // Monday
    },
  }

  // Time picker config (time only, no date)
  const timeConfig = {
    enableTime: true,
    noCalendar: true,
    dateFormat: 'H:i',
    altInput: true,
    altFormat: 'H:i',
    time_24hr: false,
    minuteIncrement: 1,
  }

  /**
   * Format date string for flatpickr input (YYYY-MM-DD)
   */
  const formatDateForFlatpickr = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return ''
    
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    if (isNaN(date.getTime())) return ''
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    
    return `${year}-${month}-${day}`
  }

  /**
   * Format datetime string for flatpickr input (YYYY-MM-DD HH:mm)
   */
  const formatDateTimeForFlatpickr = (dateString: string | Date | null | undefined): string => {
    if (!dateString) return ''
    
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString
    if (isNaN(date.getTime())) return ''
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}`
  }

  /**
   * Convert flatpickr date format (YYYY-MM-DD) to ISO string
   */
  const convertFlatpickrDateToISO = (dateStr: string | null | undefined): string | undefined => {
    if (!dateStr) return undefined
    // Flatpickr returns YYYY-MM-DD format, convert to ISO
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return `${dateStr}T00:00:00+07:00`
    }
    return dateStr
  }

  /**
   * Convert flatpickr datetime format (YYYY-MM-DD HH:mm) to ISO string
   */
  const convertFlatpickrDateTimeToISO = (dateStr: string | null | undefined): string | undefined => {
    if (!dateStr) return undefined
    // Flatpickr returns YYYY-MM-DD HH:mm format, convert to ISO
    if (dateStr.includes(' ')) {
      const [datePart, timePart] = dateStr.split(' ')
      return `${datePart}T${timePart}:00+07:00`
    }
    return dateStr
  }

  return {
    dateConfig,
    dateTimeConfig,
    timeConfig,
    formatDateForFlatpickr,
    formatDateTimeForFlatpickr,
    convertFlatpickrDateToISO,
    convertFlatpickrDateTimeToISO,
  }
}



