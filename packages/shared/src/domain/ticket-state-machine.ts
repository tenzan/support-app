import { TicketStatus } from '../constants'

export const VALID_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  [TicketStatus.NEW]: [TicketStatus.OPEN, TicketStatus.PENDING, TicketStatus.CLOSED],
  [TicketStatus.OPEN]: [
    TicketStatus.PENDING,
    TicketStatus.WAITING_ON_CUSTOMER,
    TicketStatus.SCHEDULED,
    TicketStatus.RESOLVED,
    TicketStatus.CLOSED,
  ],
  [TicketStatus.PENDING]: [TicketStatus.OPEN, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.WAITING_ON_CUSTOMER]: [
    TicketStatus.OPEN,
    TicketStatus.RESOLVED,
    TicketStatus.CLOSED,
  ],
  [TicketStatus.SCHEDULED]: [TicketStatus.OPEN, TicketStatus.RESOLVED, TicketStatus.CLOSED],
  [TicketStatus.RESOLVED]: [TicketStatus.OPEN, TicketStatus.CLOSED],
  [TicketStatus.CLOSED]: [TicketStatus.OPEN],
}

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  if (from === to) return false
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

export function getNextValidStatuses(current: TicketStatus): TicketStatus[] {
  return VALID_TRANSITIONS[current] ?? []
}
