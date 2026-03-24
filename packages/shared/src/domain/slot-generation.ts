import type { Weekday } from '../constants'

export interface SlotRule {
  weekday: Weekday
  start_time: string // HH:mm
  end_time: string // HH:mm
}

export interface SlotException {
  date: string // YYYY-MM-DD
  is_blocked: boolean
  start_time: string | null
  end_time: string | null
}

export interface ExistingBooking {
  start: string // ISO datetime
  end: string // ISO datetime
}

export interface GeneratedSlot {
  start: string // ISO datetime
  end: string // ISO datetime
  available: boolean
  remaining_capacity: number
}

export interface SlotGenerationInput {
  rules: SlotRule[]
  exceptions: SlotException[]
  existingBookings: ExistingBooking[]
  slotDurationMinutes: number
  intervalStepMinutes: number
  dateFrom: string // YYYY-MM-DD
  dateTo: string // YYYY-MM-DD
  timezone: string
  minimumNoticeMinutes: number
  maximumBookingWindowDays: number | null
  bufferBeforeMinutes: number
  bufferAfterMinutes: number
  maxBookingsPerSlot: number
  now: Date
}

function parseTime(time: string): { hours: number; minutes: number } {
  const [hours, minutes] = time.split(':').map(Number)
  return { hours, minutes }
}

function getWeekday(date: Date): Weekday {
  // JS getUTCDay: 0=Sunday, we want 0=Monday
  const day = date.getUTCDay()
  return ((day + 6) % 7) as Weekday
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().substring(0, 10)
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / (86400 * 1000))
}

export function generateSlots(input: SlotGenerationInput): GeneratedSlot[] {
  const {
    rules,
    exceptions,
    existingBookings,
    slotDurationMinutes,
    intervalStepMinutes,
    dateFrom,
    dateTo,
    minimumNoticeMinutes,
    maximumBookingWindowDays,
    bufferBeforeMinutes,
    bufferAfterMinutes,
    maxBookingsPerSlot,
    now,
  } = input

  const slots: GeneratedSlot[] = []

  // Validate date range
  if (dateFrom > dateTo) return slots

  const earliestStart = new Date(now.getTime() + minimumNoticeMinutes * 60 * 1000)
  const latestDate =
    maximumBookingWindowDays !== null
      ? addDays(now.toISOString().substring(0, 10), maximumBookingWindowDays)
      : null

  let currentDate = dateFrom
  while (currentDate <= dateTo) {
    // Check maximum booking window
    if (latestDate && currentDate > latestDate) break

    const dateObj = new Date(currentDate + 'T00:00:00Z')
    const weekday = getWeekday(dateObj)

    // Check for exceptions on this date
    const exception = exceptions.find((e) => e.date === currentDate)

    let windows: { start_time: string; end_time: string }[]

    if (exception) {
      if (exception.is_blocked) {
        // Entire day blocked
        currentDate = addDays(currentDate, 1)
        continue
      }
      // Special hours
      if (exception.start_time && exception.end_time) {
        windows = [{ start_time: exception.start_time, end_time: exception.end_time }]
      } else {
        currentDate = addDays(currentDate, 1)
        continue
      }
    } else {
      // Normal rules for this weekday
      windows = rules
        .filter((r) => r.weekday === weekday)
        .sort((a, b) => a.start_time.localeCompare(b.start_time))
    }

    // Generate slots for each window
    for (const window of windows) {
      const windowStart = parseTime(window.start_time)
      const windowEnd = parseTime(window.end_time)
      const windowStartMinutes = windowStart.hours * 60 + windowStart.minutes
      const windowEndMinutes = windowEnd.hours * 60 + windowEnd.minutes

      let slotStartMinutes = windowStartMinutes
      while (slotStartMinutes + slotDurationMinutes <= windowEndMinutes) {
        const slotStart = new Date(dateObj)
        slotStart.setUTCHours(0, 0, 0, 0)
        slotStart.setUTCMinutes(slotStartMinutes)

        const slotEnd = new Date(slotStart)
        slotEnd.setUTCMinutes(slotEnd.getUTCMinutes() + slotDurationMinutes)

        // Check minimum notice
        if (slotStart >= earliestStart) {
          // Count bookings for this slot
          const bookingCount = existingBookings.filter(
            (b) => b.start === slotStart.toISOString() && b.end === slotEnd.toISOString(),
          ).length

          // Check buffer conflicts with existing bookings
          const hasBufferConflict = existingBookings.some((booking) => {
            const bookingStart = new Date(booking.start)
            const bookingEnd = new Date(booking.end)
            const bufferStart = new Date(
              bookingStart.getTime() - bufferBeforeMinutes * 60 * 1000,
            )
            const bufferEnd = new Date(bookingEnd.getTime() + bufferAfterMinutes * 60 * 1000)

            // Check if this slot overlaps with the buffer zone but NOT the booking itself
            const isTheBookingItself =
              slotStart.getTime() === bookingStart.getTime() &&
              slotEnd.getTime() === bookingEnd.getTime()

            if (isTheBookingItself) return false

            return slotStart < bufferEnd && slotEnd > bufferStart
          })

          const remainingCapacity = Math.max(0, maxBookingsPerSlot - bookingCount)
          const available = remainingCapacity > 0 && !hasBufferConflict

          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            available,
            remaining_capacity: hasBufferConflict ? 0 : remainingCapacity,
          })
        }

        slotStartMinutes += intervalStepMinutes
      }
    }

    currentDate = addDays(currentDate, 1)
  }

  return slots
}
