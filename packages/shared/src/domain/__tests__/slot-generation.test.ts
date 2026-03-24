import { describe, it, expect } from 'vitest'
import { generateSlots, type SlotGenerationInput } from '../slot-generation'

function makeInput(overrides: Partial<SlotGenerationInput> = {}): SlotGenerationInput {
  return {
    rules: [
      // Mon-Fri 09:00-12:00, 13:00-17:00
      { weekday: 0, start_time: '09:00', end_time: '12:00' },
      { weekday: 0, start_time: '13:00', end_time: '17:00' },
      { weekday: 1, start_time: '09:00', end_time: '12:00' },
      { weekday: 1, start_time: '13:00', end_time: '17:00' },
      { weekday: 2, start_time: '09:00', end_time: '12:00' },
      { weekday: 2, start_time: '13:00', end_time: '17:00' },
      { weekday: 3, start_time: '09:00', end_time: '12:00' },
      { weekday: 3, start_time: '13:00', end_time: '17:00' },
      { weekday: 4, start_time: '09:00', end_time: '12:00' },
      { weekday: 4, start_time: '13:00', end_time: '17:00' },
    ],
    exceptions: [],
    existingBookings: [],
    slotDurationMinutes: 30,
    intervalStepMinutes: 30,
    dateFrom: '2026-04-06', // Monday
    dateTo: '2026-04-06', // Single day
    timezone: 'UTC',
    minimumNoticeMinutes: 0,
    maximumBookingWindowDays: null,
    bufferBeforeMinutes: 0,
    bufferAfterMinutes: 0,
    maxBookingsPerSlot: 1,
    now: new Date('2026-04-05T00:00:00Z'), // day before, so all slots are future
    ...overrides,
  }
}

describe('slot-generation', () => {
  describe('basic slot generation', () => {
    it('generates correct number of 30-min slots for a weekday with two windows', () => {
      const slots = generateSlots(makeInput())
      // 09:00-12:00 = 6 slots, 13:00-17:00 = 8 slots = 14 total
      expect(slots).toHaveLength(14)
    })

    it('slot times are correct for morning window', () => {
      const slots = generateSlots(makeInput())
      expect(slots[0].start).toBe('2026-04-06T09:00:00.000Z')
      expect(slots[0].end).toBe('2026-04-06T09:30:00.000Z')
      expect(slots[5].start).toBe('2026-04-06T11:30:00.000Z')
      expect(slots[5].end).toBe('2026-04-06T12:00:00.000Z')
    })

    it('slot times are correct for afternoon window', () => {
      const slots = generateSlots(makeInput())
      expect(slots[6].start).toBe('2026-04-06T13:00:00.000Z')
      expect(slots[13].start).toBe('2026-04-06T16:30:00.000Z')
      expect(slots[13].end).toBe('2026-04-06T17:00:00.000Z')
    })

    it('all slots are marked available', () => {
      const slots = generateSlots(makeInput())
      expect(slots.every((s) => s.available)).toBe(true)
    })

    it('all slots have correct remaining capacity', () => {
      const slots = generateSlots(makeInput())
      expect(slots.every((s) => s.remaining_capacity === 1)).toBe(true)
    })
  })

  describe('weekend exclusion', () => {
    it('generates no slots on Saturday (no rules for day 5)', () => {
      const slots = generateSlots(
        makeInput({
          dateFrom: '2026-04-11', // Saturday
          dateTo: '2026-04-11',
        }),
      )
      expect(slots).toHaveLength(0)
    })

    it('generates no slots on Sunday (no rules for day 6)', () => {
      const slots = generateSlots(
        makeInput({
          dateFrom: '2026-04-12', // Sunday
          dateTo: '2026-04-12',
        }),
      )
      expect(slots).toHaveLength(0)
    })
  })

  describe('multi-day generation', () => {
    it('generates slots across multiple weekdays', () => {
      const slots = generateSlots(
        makeInput({
          dateFrom: '2026-04-06', // Monday
          dateTo: '2026-04-08', // Wednesday
        }),
      )
      // 14 slots per day * 3 days = 42
      expect(slots).toHaveLength(42)
    })

    it('skips weekends in multi-day range', () => {
      const slots = generateSlots(
        makeInput({
          dateFrom: '2026-04-10', // Friday
          dateTo: '2026-04-13', // Monday
        }),
      )
      // Friday: 14 + Sat: 0 + Sun: 0 + Monday: 14 = 28
      expect(slots).toHaveLength(28)
    })
  })

  describe('blackout dates', () => {
    it('blocked exception produces zero slots for that date', () => {
      const slots = generateSlots(
        makeInput({
          exceptions: [{ date: '2026-04-06', is_blocked: true, start_time: null, end_time: null }],
        }),
      )
      expect(slots).toHaveLength(0)
    })

    it('special hours exception overrides normal rules', () => {
      const slots = generateSlots(
        makeInput({
          exceptions: [
            { date: '2026-04-06', is_blocked: false, start_time: '10:00', end_time: '12:00' },
          ],
        }),
      )
      // 10:00-12:00 = 4 slots of 30 min
      expect(slots).toHaveLength(4)
      expect(slots[0].start).toBe('2026-04-06T10:00:00.000Z')
    })
  })

  describe('minimum notice period', () => {
    it('filters out slots too close to now', () => {
      const slots = generateSlots(
        makeInput({
          minimumNoticeMinutes: 120, // 2 hours
          now: new Date('2026-04-06T10:00:00Z'),
        }),
      )
      // 09:00 and 09:30 and 10:00 and 10:30 and 11:00 and 11:30 are within 2h of 10:00
      // Wait: slots starting before 12:00 are filtered
      // Morning: only no slots (09:00-12:00 all filtered since 10:00 + 2h = 12:00)
      // Afternoon: all 8 slots available (13:00+)
      expect(slots.every((s) => new Date(s.start) >= new Date('2026-04-06T12:00:00Z'))).toBe(true)
    })

    it('all slots filtered when entire day is within notice period', () => {
      const slots = generateSlots(
        makeInput({
          minimumNoticeMinutes: 1440, // 24 hours
          now: new Date('2026-04-06T00:00:00Z'),
        }),
      )
      expect(slots).toHaveLength(0)
    })
  })

  describe('maximum booking window', () => {
    it('filters out slots beyond the window', () => {
      const slots = generateSlots(
        makeInput({
          dateFrom: '2026-04-06',
          dateTo: '2026-04-10', // Friday, 5 days
          maximumBookingWindowDays: 2,
          now: new Date('2026-04-05T00:00:00Z'),
        }),
      )
      // Only Apr 6 and Apr 7 are within 2-day window from Apr 5
      const dates = [...new Set(slots.map((s) => s.start.substring(0, 10)))]
      expect(dates).toEqual(['2026-04-06', '2026-04-07'])
    })
  })

  describe('existing bookings', () => {
    it('reduces remaining capacity for booked slots', () => {
      const slots = generateSlots(
        makeInput({
          existingBookings: [
            { start: '2026-04-06T09:00:00.000Z', end: '2026-04-06T09:30:00.000Z' },
          ],
        }),
      )
      const bookedSlot = slots.find((s) => s.start === '2026-04-06T09:00:00.000Z')
      expect(bookedSlot?.available).toBe(false)
      expect(bookedSlot?.remaining_capacity).toBe(0)
    })

    it('slot with max > 1 remains available until fully booked', () => {
      const slots = generateSlots(
        makeInput({
          maxBookingsPerSlot: 3,
          existingBookings: [
            { start: '2026-04-06T09:00:00.000Z', end: '2026-04-06T09:30:00.000Z' },
          ],
        }),
      )
      const slot = slots.find((s) => s.start === '2026-04-06T09:00:00.000Z')
      expect(slot?.available).toBe(true)
      expect(slot?.remaining_capacity).toBe(2)
    })

    it('slot becomes unavailable when fully booked', () => {
      const slots = generateSlots(
        makeInput({
          maxBookingsPerSlot: 2,
          existingBookings: [
            { start: '2026-04-06T09:00:00.000Z', end: '2026-04-06T09:30:00.000Z' },
            { start: '2026-04-06T09:00:00.000Z', end: '2026-04-06T09:30:00.000Z' },
          ],
        }),
      )
      const slot = slots.find((s) => s.start === '2026-04-06T09:00:00.000Z')
      expect(slot?.available).toBe(false)
      expect(slot?.remaining_capacity).toBe(0)
    })
  })

  describe('buffers', () => {
    it('buffer before removes slots that overlap with booking buffer', () => {
      const slots = generateSlots(
        makeInput({
          bufferBeforeMinutes: 30,
          existingBookings: [
            { start: '2026-04-06T10:00:00.000Z', end: '2026-04-06T10:30:00.000Z' },
          ],
        }),
      )
      // The 09:30 slot should be unavailable (buffer before 10:00 booking)
      const bufferSlot = slots.find((s) => s.start === '2026-04-06T09:30:00.000Z')
      expect(bufferSlot?.available).toBe(false)
    })

    it('buffer after removes slots that overlap with booking buffer', () => {
      const slots = generateSlots(
        makeInput({
          bufferAfterMinutes: 30,
          existingBookings: [
            { start: '2026-04-06T10:00:00.000Z', end: '2026-04-06T10:30:00.000Z' },
          ],
        }),
      )
      // The 10:30 slot should be unavailable (buffer after 10:00-10:30 booking)
      const bufferSlot = slots.find((s) => s.start === '2026-04-06T10:30:00.000Z')
      expect(bufferSlot?.available).toBe(false)
    })
  })

  describe('different slot durations', () => {
    it('60-minute slots in 3-hour window produces 3 slots', () => {
      const slots = generateSlots(
        makeInput({
          rules: [{ weekday: 0, start_time: '09:00', end_time: '12:00' }],
          slotDurationMinutes: 60,
          intervalStepMinutes: 60,
        }),
      )
      expect(slots).toHaveLength(3)
      expect(slots[0].start).toBe('2026-04-06T09:00:00.000Z')
      expect(slots[0].end).toBe('2026-04-06T10:00:00.000Z')
    })

    it('interval step smaller than duration creates overlapping slots', () => {
      const slots = generateSlots(
        makeInput({
          rules: [{ weekday: 0, start_time: '09:00', end_time: '10:00' }],
          slotDurationMinutes: 30,
          intervalStepMinutes: 15,
        }),
      )
      // 09:00, 09:15, 09:30 (09:45 would end at 10:15, past window)
      expect(slots).toHaveLength(3)
    })
  })

  describe('edge cases', () => {
    it('empty rules produce no slots', () => {
      const slots = generateSlots(makeInput({ rules: [] }))
      expect(slots).toHaveLength(0)
    })

    it('dateFrom after dateTo produces no slots', () => {
      const slots = generateSlots(
        makeInput({
          dateFrom: '2026-04-10',
          dateTo: '2026-04-06',
        }),
      )
      expect(slots).toHaveLength(0)
    })
  })
})
