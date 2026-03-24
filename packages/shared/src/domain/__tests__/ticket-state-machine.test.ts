import { describe, it, expect } from 'vitest'
import { canTransition, getNextValidStatuses, VALID_TRANSITIONS } from '../ticket-state-machine'
import { TicketStatus } from '../../constants'

describe('ticket-state-machine', () => {
  describe('canTransition', () => {
    // Valid transitions from NEW
    it('NEW -> OPEN is valid', () => {
      expect(canTransition(TicketStatus.NEW, TicketStatus.OPEN)).toBe(true)
    })

    it('NEW -> PENDING is valid', () => {
      expect(canTransition(TicketStatus.NEW, TicketStatus.PENDING)).toBe(true)
    })

    it('NEW -> CLOSED is valid', () => {
      expect(canTransition(TicketStatus.NEW, TicketStatus.CLOSED)).toBe(true)
    })

    // Valid transitions from OPEN
    it('OPEN -> PENDING is valid', () => {
      expect(canTransition(TicketStatus.OPEN, TicketStatus.PENDING)).toBe(true)
    })

    it('OPEN -> WAITING_ON_CUSTOMER is valid', () => {
      expect(canTransition(TicketStatus.OPEN, TicketStatus.WAITING_ON_CUSTOMER)).toBe(true)
    })

    it('OPEN -> SCHEDULED is valid', () => {
      expect(canTransition(TicketStatus.OPEN, TicketStatus.SCHEDULED)).toBe(true)
    })

    it('OPEN -> RESOLVED is valid', () => {
      expect(canTransition(TicketStatus.OPEN, TicketStatus.RESOLVED)).toBe(true)
    })

    it('OPEN -> CLOSED is valid', () => {
      expect(canTransition(TicketStatus.OPEN, TicketStatus.CLOSED)).toBe(true)
    })

    // Valid transitions from PENDING
    it('PENDING -> OPEN is valid', () => {
      expect(canTransition(TicketStatus.PENDING, TicketStatus.OPEN)).toBe(true)
    })

    it('PENDING -> RESOLVED is valid', () => {
      expect(canTransition(TicketStatus.PENDING, TicketStatus.RESOLVED)).toBe(true)
    })

    it('PENDING -> CLOSED is valid', () => {
      expect(canTransition(TicketStatus.PENDING, TicketStatus.CLOSED)).toBe(true)
    })

    // Valid transitions from WAITING_ON_CUSTOMER
    it('WAITING_ON_CUSTOMER -> OPEN is valid', () => {
      expect(canTransition(TicketStatus.WAITING_ON_CUSTOMER, TicketStatus.OPEN)).toBe(true)
    })

    it('WAITING_ON_CUSTOMER -> RESOLVED is valid', () => {
      expect(canTransition(TicketStatus.WAITING_ON_CUSTOMER, TicketStatus.RESOLVED)).toBe(true)
    })

    it('WAITING_ON_CUSTOMER -> CLOSED is valid', () => {
      expect(canTransition(TicketStatus.WAITING_ON_CUSTOMER, TicketStatus.CLOSED)).toBe(true)
    })

    // Valid transitions from SCHEDULED
    it('SCHEDULED -> OPEN is valid', () => {
      expect(canTransition(TicketStatus.SCHEDULED, TicketStatus.OPEN)).toBe(true)
    })

    it('SCHEDULED -> RESOLVED is valid', () => {
      expect(canTransition(TicketStatus.SCHEDULED, TicketStatus.RESOLVED)).toBe(true)
    })

    it('SCHEDULED -> CLOSED is valid', () => {
      expect(canTransition(TicketStatus.SCHEDULED, TicketStatus.CLOSED)).toBe(true)
    })

    // Valid transitions from RESOLVED
    it('RESOLVED -> OPEN is valid (reopen)', () => {
      expect(canTransition(TicketStatus.RESOLVED, TicketStatus.OPEN)).toBe(true)
    })

    it('RESOLVED -> CLOSED is valid', () => {
      expect(canTransition(TicketStatus.RESOLVED, TicketStatus.CLOSED)).toBe(true)
    })

    // Valid transitions from CLOSED
    it('CLOSED -> OPEN is valid (reopen)', () => {
      expect(canTransition(TicketStatus.CLOSED, TicketStatus.OPEN)).toBe(true)
    })

    // Invalid transitions
    it('NEW -> RESOLVED is invalid (must go through OPEN first)', () => {
      expect(canTransition(TicketStatus.NEW, TicketStatus.RESOLVED)).toBe(false)
    })

    it('NEW -> SCHEDULED is invalid', () => {
      expect(canTransition(TicketStatus.NEW, TicketStatus.SCHEDULED)).toBe(false)
    })

    it('CLOSED -> PENDING is invalid', () => {
      expect(canTransition(TicketStatus.CLOSED, TicketStatus.PENDING)).toBe(false)
    })

    it('CLOSED -> RESOLVED is invalid', () => {
      expect(canTransition(TicketStatus.CLOSED, TicketStatus.RESOLVED)).toBe(false)
    })

    it('same status transition is invalid', () => {
      expect(canTransition(TicketStatus.OPEN, TicketStatus.OPEN)).toBe(false)
    })

    it('RESOLVED -> PENDING is invalid', () => {
      expect(canTransition(TicketStatus.RESOLVED, TicketStatus.PENDING)).toBe(false)
    })
  })

  describe('getNextValidStatuses', () => {
    it('NEW has correct next statuses', () => {
      const next = getNextValidStatuses(TicketStatus.NEW)
      expect(next).toContain(TicketStatus.OPEN)
      expect(next).toContain(TicketStatus.PENDING)
      expect(next).toContain(TicketStatus.CLOSED)
      expect(next).not.toContain(TicketStatus.RESOLVED)
      expect(next).not.toContain(TicketStatus.NEW)
    })

    it('OPEN has correct next statuses', () => {
      const next = getNextValidStatuses(TicketStatus.OPEN)
      expect(next).toContain(TicketStatus.PENDING)
      expect(next).toContain(TicketStatus.WAITING_ON_CUSTOMER)
      expect(next).toContain(TicketStatus.SCHEDULED)
      expect(next).toContain(TicketStatus.RESOLVED)
      expect(next).toContain(TicketStatus.CLOSED)
      expect(next).not.toContain(TicketStatus.NEW)
      expect(next).not.toContain(TicketStatus.OPEN)
    })

    it('CLOSED only allows reopen to OPEN', () => {
      const next = getNextValidStatuses(TicketStatus.CLOSED)
      expect(next).toEqual([TicketStatus.OPEN])
    })

    it('RESOLVED allows OPEN and CLOSED', () => {
      const next = getNextValidStatuses(TicketStatus.RESOLVED)
      expect(next).toContain(TicketStatus.OPEN)
      expect(next).toContain(TicketStatus.CLOSED)
      expect(next).toHaveLength(2)
    })
  })

  describe('VALID_TRANSITIONS covers all statuses', () => {
    it('every ticket status has a transitions entry', () => {
      const allStatuses = Object.values(TicketStatus)
      for (const status of allStatuses) {
        expect(VALID_TRANSITIONS).toHaveProperty(status)
      }
    })
  })
})
