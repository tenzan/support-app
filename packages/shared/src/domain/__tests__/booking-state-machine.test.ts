import { describe, it, expect } from 'vitest'
import {
  canTransitionBooking,
  getNextValidBookingStatuses,
  validateBookingAction,
} from '../booking-state-machine'
import { BookingStatus, BookingMode, UserRole } from '../../constants'

describe('booking-state-machine', () => {
  describe('canTransitionBooking', () => {
    // Self-book mode
    it('self-book: NOT_SCHEDULED -> SCHEDULED is valid', () => {
      expect(
        canTransitionBooking(
          BookingStatus.NOT_SCHEDULED,
          BookingStatus.SCHEDULED,
          BookingMode.CUSTOMER_SELF_BOOK,
        ),
      ).toBe(true)
    })

    it('self-book: SCHEDULED -> RESCHEDULED is valid', () => {
      expect(
        canTransitionBooking(
          BookingStatus.SCHEDULED,
          BookingStatus.RESCHEDULED,
          BookingMode.CUSTOMER_SELF_BOOK,
        ),
      ).toBe(true)
    })

    it('self-book: SCHEDULED -> CANCELLED is valid', () => {
      expect(
        canTransitionBooking(
          BookingStatus.SCHEDULED,
          BookingStatus.CANCELLED,
          BookingMode.CUSTOMER_SELF_BOOK,
        ),
      ).toBe(true)
    })

    it('self-book: SCHEDULED -> COMPLETED is valid', () => {
      expect(
        canTransitionBooking(
          BookingStatus.SCHEDULED,
          BookingStatus.COMPLETED,
          BookingMode.CUSTOMER_SELF_BOOK,
        ),
      ).toBe(true)
    })

    it('self-book: RESCHEDULED -> CANCELLED is valid', () => {
      expect(
        canTransitionBooking(
          BookingStatus.RESCHEDULED,
          BookingStatus.CANCELLED,
          BookingMode.CUSTOMER_SELF_BOOK,
        ),
      ).toBe(true)
    })

    it('self-book: RESCHEDULED -> COMPLETED is valid', () => {
      expect(
        canTransitionBooking(
          BookingStatus.RESCHEDULED,
          BookingStatus.COMPLETED,
          BookingMode.CUSTOMER_SELF_BOOK,
        ),
      ).toBe(true)
    })

    it('self-book: CANCELLED -> SCHEDULED is invalid (no direct recovery)', () => {
      expect(
        canTransitionBooking(
          BookingStatus.CANCELLED,
          BookingStatus.SCHEDULED,
          BookingMode.CUSTOMER_SELF_BOOK,
        ),
      ).toBe(false)
    })

    // Agent propose mode
    it('agent-propose: NOT_SCHEDULED -> PROPOSED is valid', () => {
      expect(
        canTransitionBooking(
          BookingStatus.NOT_SCHEDULED,
          BookingStatus.PROPOSED,
          BookingMode.AGENT_PROPOSE,
        ),
      ).toBe(true)
    })

    it('agent-propose: PROPOSED -> AWAITING_SELECTION is valid', () => {
      expect(
        canTransitionBooking(
          BookingStatus.PROPOSED,
          BookingStatus.AWAITING_SELECTION,
          BookingMode.AGENT_PROPOSE,
        ),
      ).toBe(true)
    })

    it('agent-propose: AWAITING_SELECTION -> SCHEDULED is valid', () => {
      expect(
        canTransitionBooking(
          BookingStatus.AWAITING_SELECTION,
          BookingStatus.SCHEDULED,
          BookingMode.AGENT_PROPOSE,
        ),
      ).toBe(true)
    })

    it('agent-propose: NOT_SCHEDULED -> SCHEDULED is invalid (must go through propose flow)', () => {
      expect(
        canTransitionBooking(
          BookingStatus.NOT_SCHEDULED,
          BookingStatus.SCHEDULED,
          BookingMode.AGENT_PROPOSE,
        ),
      ).toBe(false)
    })

    // Internal only mode
    it('internal-only: NOT_SCHEDULED -> SCHEDULED is valid', () => {
      expect(
        canTransitionBooking(
          BookingStatus.NOT_SCHEDULED,
          BookingStatus.SCHEDULED,
          BookingMode.INTERNAL_ONLY,
        ),
      ).toBe(true)
    })

    it('internal-only: SCHEDULED -> RESCHEDULED is valid', () => {
      expect(
        canTransitionBooking(
          BookingStatus.SCHEDULED,
          BookingStatus.RESCHEDULED,
          BookingMode.INTERNAL_ONLY,
        ),
      ).toBe(true)
    })

    // Same status transition
    it('same status transition is invalid', () => {
      expect(
        canTransitionBooking(
          BookingStatus.SCHEDULED,
          BookingStatus.SCHEDULED,
          BookingMode.CUSTOMER_SELF_BOOK,
        ),
      ).toBe(false)
    })
  })

  describe('getNextValidBookingStatuses', () => {
    it('self-book NOT_SCHEDULED can go to SCHEDULED', () => {
      const next = getNextValidBookingStatuses(
        BookingStatus.NOT_SCHEDULED,
        BookingMode.CUSTOMER_SELF_BOOK,
      )
      expect(next).toContain(BookingStatus.SCHEDULED)
      expect(next).not.toContain(BookingStatus.PROPOSED)
    })

    it('agent-propose NOT_SCHEDULED can go to PROPOSED', () => {
      const next = getNextValidBookingStatuses(
        BookingStatus.NOT_SCHEDULED,
        BookingMode.AGENT_PROPOSE,
      )
      expect(next).toContain(BookingStatus.PROPOSED)
      expect(next).not.toContain(BookingStatus.SCHEDULED)
    })

    it('CANCELLED has no valid next statuses', () => {
      const next = getNextValidBookingStatuses(
        BookingStatus.CANCELLED,
        BookingMode.CUSTOMER_SELF_BOOK,
      )
      expect(next).toHaveLength(0)
    })

    it('COMPLETED has no valid next statuses', () => {
      const next = getNextValidBookingStatuses(
        BookingStatus.COMPLETED,
        BookingMode.CUSTOMER_SELF_BOOK,
      )
      expect(next).toHaveLength(0)
    })
  })

  describe('validateBookingAction', () => {
    it('customer can self-book in CUSTOMER_SELF_BOOK mode', () => {
      const result = validateBookingAction({
        role: UserRole.CUSTOMER,
        bookingMode: BookingMode.CUSTOMER_SELF_BOOK,
        action: 'book',
        currentStatus: BookingStatus.NOT_SCHEDULED,
      })
      expect(result.allowed).toBe(true)
    })

    it('customer cannot book in INTERNAL_ONLY mode', () => {
      const result = validateBookingAction({
        role: UserRole.CUSTOMER,
        bookingMode: BookingMode.INTERNAL_ONLY,
        action: 'book',
        currentStatus: BookingStatus.NOT_SCHEDULED,
      })
      expect(result.allowed).toBe(false)
      expect(result.reason).toBeTruthy()
    })

    it('customer cannot propose slots in AGENT_PROPOSE mode', () => {
      const result = validateBookingAction({
        role: UserRole.CUSTOMER,
        bookingMode: BookingMode.AGENT_PROPOSE,
        action: 'propose',
        currentStatus: BookingStatus.NOT_SCHEDULED,
      })
      expect(result.allowed).toBe(false)
    })

    it('agent can propose slots in AGENT_PROPOSE mode', () => {
      const result = validateBookingAction({
        role: UserRole.AGENT,
        bookingMode: BookingMode.AGENT_PROPOSE,
        action: 'propose',
        currentStatus: BookingStatus.NOT_SCHEDULED,
      })
      expect(result.allowed).toBe(true)
    })

    it('customer can select proposed slot in AGENT_PROPOSE mode', () => {
      const result = validateBookingAction({
        role: UserRole.CUSTOMER,
        bookingMode: BookingMode.AGENT_PROPOSE,
        action: 'select',
        currentStatus: BookingStatus.AWAITING_SELECTION,
      })
      expect(result.allowed).toBe(true)
    })

    it('agent can book in INTERNAL_ONLY mode', () => {
      const result = validateBookingAction({
        role: UserRole.AGENT,
        bookingMode: BookingMode.INTERNAL_ONLY,
        action: 'book',
        currentStatus: BookingStatus.NOT_SCHEDULED,
      })
      expect(result.allowed).toBe(true)
    })

    it('admin can perform any booking action', () => {
      const result = validateBookingAction({
        role: UserRole.ADMIN,
        bookingMode: BookingMode.INTERNAL_ONLY,
        action: 'book',
        currentStatus: BookingStatus.NOT_SCHEDULED,
      })
      expect(result.allowed).toBe(true)
    })

    it('customer can cancel own booking in self-book mode', () => {
      const result = validateBookingAction({
        role: UserRole.CUSTOMER,
        bookingMode: BookingMode.CUSTOMER_SELF_BOOK,
        action: 'cancel',
        currentStatus: BookingStatus.SCHEDULED,
      })
      expect(result.allowed).toBe(true)
    })

    it('customer can reschedule in self-book mode', () => {
      const result = validateBookingAction({
        role: UserRole.CUSTOMER,
        bookingMode: BookingMode.CUSTOMER_SELF_BOOK,
        action: 'reschedule',
        currentStatus: BookingStatus.SCHEDULED,
      })
      expect(result.allowed).toBe(true)
    })

    it('customer cannot reschedule in internal-only mode', () => {
      const result = validateBookingAction({
        role: UserRole.CUSTOMER,
        bookingMode: BookingMode.INTERNAL_ONLY,
        action: 'reschedule',
        currentStatus: BookingStatus.SCHEDULED,
      })
      expect(result.allowed).toBe(false)
    })
  })
})
