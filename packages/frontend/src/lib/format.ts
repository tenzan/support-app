import { format as fnsFormat, parseISO } from 'date-fns'

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export function weekdayName(day: number): string {
  return WEEKDAY_NAMES[day] ?? `Day ${day}`
}

/**
 * Format a UTC datetime string to local time.
 * Handles both ISO strings and D1's "YYYY-MM-DD HH:mm:ss" format.
 */
export function formatLocalDate(utcString: string, pattern = 'MMM d, yyyy'): string {
  const date = utcString.includes('T') ? parseISO(utcString) : new Date(utcString + 'Z')
  return fnsFormat(date, pattern)
}

export function formatLocalDateTime(utcString: string): string {
  return formatLocalDate(utcString, 'MMM d, yyyy h:mm a')
}

export function formatLocalTime(utcString: string): string {
  return formatLocalDate(utcString, 'h:mm a')
}
