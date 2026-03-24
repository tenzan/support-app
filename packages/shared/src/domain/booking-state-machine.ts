import { BookingStatus, BookingMode, UserRole } from '../constants'

type BookingTransitions = Record<BookingStatus, BookingStatus[]>

const SELF_BOOK_TRANSITIONS: BookingTransitions = {
  [BookingStatus.NOT_SCHEDULED]: [BookingStatus.SCHEDULED],
  [BookingStatus.AWAITING_SELECTION]: [], // not used in self-book
  [BookingStatus.PROPOSED]: [], // not used in self-book
  [BookingStatus.SCHEDULED]: [
    BookingStatus.RESCHEDULED,
    BookingStatus.CANCELLED,
    BookingStatus.COMPLETED,
  ],
  [BookingStatus.RESCHEDULED]: [BookingStatus.CANCELLED, BookingStatus.COMPLETED],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.COMPLETED]: [],
}

const AGENT_PROPOSE_TRANSITIONS: BookingTransitions = {
  [BookingStatus.NOT_SCHEDULED]: [BookingStatus.PROPOSED],
  [BookingStatus.PROPOSED]: [BookingStatus.AWAITING_SELECTION, BookingStatus.CANCELLED],
  [BookingStatus.AWAITING_SELECTION]: [BookingStatus.SCHEDULED, BookingStatus.CANCELLED],
  [BookingStatus.SCHEDULED]: [
    BookingStatus.RESCHEDULED,
    BookingStatus.CANCELLED,
    BookingStatus.COMPLETED,
  ],
  [BookingStatus.RESCHEDULED]: [BookingStatus.CANCELLED, BookingStatus.COMPLETED],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.COMPLETED]: [],
}

const INTERNAL_ONLY_TRANSITIONS: BookingTransitions = {
  [BookingStatus.NOT_SCHEDULED]: [BookingStatus.SCHEDULED],
  [BookingStatus.AWAITING_SELECTION]: [], // not used
  [BookingStatus.PROPOSED]: [], // not used
  [BookingStatus.SCHEDULED]: [
    BookingStatus.RESCHEDULED,
    BookingStatus.CANCELLED,
    BookingStatus.COMPLETED,
  ],
  [BookingStatus.RESCHEDULED]: [BookingStatus.CANCELLED, BookingStatus.COMPLETED],
  [BookingStatus.CANCELLED]: [],
  [BookingStatus.COMPLETED]: [],
}

function getTransitionMap(mode: BookingMode): BookingTransitions {
  switch (mode) {
    case BookingMode.CUSTOMER_SELF_BOOK:
      return SELF_BOOK_TRANSITIONS
    case BookingMode.AGENT_PROPOSE:
      return AGENT_PROPOSE_TRANSITIONS
    case BookingMode.INTERNAL_ONLY:
      return INTERNAL_ONLY_TRANSITIONS
  }
}

export function canTransitionBooking(
  from: BookingStatus,
  to: BookingStatus,
  mode: BookingMode,
): boolean {
  if (from === to) return false
  const transitions = getTransitionMap(mode)
  return transitions[from]?.includes(to) ?? false
}

export function getNextValidBookingStatuses(
  current: BookingStatus,
  mode: BookingMode,
): BookingStatus[] {
  const transitions = getTransitionMap(mode)
  return transitions[current] ?? []
}

type BookingAction = 'book' | 'propose' | 'select' | 'reschedule' | 'cancel' | 'complete'

interface BookingActionInput {
  role: UserRole
  bookingMode: BookingMode
  action: BookingAction
  currentStatus: BookingStatus
}

interface BookingActionResult {
  allowed: boolean
  reason?: string
}

export function validateBookingAction(input: BookingActionInput): BookingActionResult {
  const { role, bookingMode, action, currentStatus } = input

  // Admins and super admins can do anything
  if (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN) {
    return { allowed: true }
  }

  switch (action) {
    case 'book': {
      if (role === UserRole.CUSTOMER && bookingMode === BookingMode.INTERNAL_ONLY) {
        return { allowed: false, reason: 'Customers cannot book in internal-only mode' }
      }
      if (role === UserRole.CUSTOMER && bookingMode === BookingMode.AGENT_PROPOSE) {
        return { allowed: false, reason: 'Customers must wait for agent to propose slots' }
      }
      // Agents can book in any mode, customers only in self-book
      return { allowed: true }
    }

    case 'propose': {
      if (role === UserRole.CUSTOMER) {
        return { allowed: false, reason: 'Only staff can propose slots' }
      }
      if (bookingMode !== BookingMode.AGENT_PROPOSE) {
        return { allowed: false, reason: 'Proposing slots only available in agent-propose mode' }
      }
      return { allowed: true }
    }

    case 'select': {
      if (currentStatus !== BookingStatus.AWAITING_SELECTION) {
        return { allowed: false, reason: 'No slots available for selection' }
      }
      // Both customer and agent can select
      return { allowed: true }
    }

    case 'reschedule': {
      if (
        role === UserRole.CUSTOMER &&
        bookingMode === BookingMode.INTERNAL_ONLY
      ) {
        return { allowed: false, reason: 'Customers cannot reschedule internal bookings' }
      }
      if (
        currentStatus !== BookingStatus.SCHEDULED &&
        currentStatus !== BookingStatus.RESCHEDULED
      ) {
        return { allowed: false, reason: 'Booking must be scheduled to reschedule' }
      }
      return { allowed: true }
    }

    case 'cancel': {
      if (
        currentStatus !== BookingStatus.SCHEDULED &&
        currentStatus !== BookingStatus.RESCHEDULED &&
        currentStatus !== BookingStatus.PROPOSED &&
        currentStatus !== BookingStatus.AWAITING_SELECTION
      ) {
        return { allowed: false, reason: 'Booking cannot be cancelled in current state' }
      }
      return { allowed: true }
    }

    case 'complete': {
      if (role === UserRole.CUSTOMER) {
        return { allowed: false, reason: 'Only staff can mark bookings as completed' }
      }
      return { allowed: true }
    }

    default:
      return { allowed: false, reason: 'Unknown action' }
  }
}
