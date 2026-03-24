export const UserRole = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  AGENT: 'agent',
  CUSTOMER: 'customer',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const TicketStatus = {
  NEW: 'new',
  OPEN: 'open',
  PENDING: 'pending',
  WAITING_ON_CUSTOMER: 'waiting_on_customer',
  SCHEDULED: 'scheduled',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus]

export const TicketPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const
export type TicketPriority = (typeof TicketPriority)[keyof typeof TicketPriority]

export const TicketChannel = {
  WEB: 'web',
  EMAIL: 'email',
  API: 'api',
} as const
export type TicketChannel = (typeof TicketChannel)[keyof typeof TicketChannel]

export const MessageType = {
  PUBLIC: 'public',
  INTERNAL_NOTE: 'internal_note',
  SYSTEM: 'system',
} as const
export type MessageType = (typeof MessageType)[keyof typeof MessageType]

export const BookingMode = {
  CUSTOMER_SELF_BOOK: 'customer_self_book',
  AGENT_PROPOSE: 'agent_propose',
  INTERNAL_ONLY: 'internal_only',
} as const
export type BookingMode = (typeof BookingMode)[keyof typeof BookingMode]

export const BookingStatus = {
  NOT_SCHEDULED: 'not_scheduled',
  AWAITING_SELECTION: 'awaiting_selection',
  PROPOSED: 'proposed',
  SCHEDULED: 'scheduled',
  RESCHEDULED: 'rescheduled',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus]

export const EventType = {
  STATUS_CHANGE: 'status_change',
  PRIORITY_CHANGE: 'priority_change',
  ASSIGNMENT: 'assignment',
  MESSAGE: 'message',
  INTERNAL_NOTE: 'internal_note',
  BOOKING_CREATED: 'booking_created',
  BOOKING_PROPOSED: 'booking_proposed',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_RESCHEDULED: 'booking_rescheduled',
  BOOKING_CANCELLED: 'booking_cancelled',
  TAG_ADDED: 'tag_added',
  TAG_REMOVED: 'tag_removed',
  ATTACHMENT_ADDED: 'attachment_added',
} as const
export type EventType = (typeof EventType)[keyof typeof EventType]

export const Weekday = {
  MONDAY: 0,
  TUESDAY: 1,
  WEDNESDAY: 2,
  THURSDAY: 3,
  FRIDAY: 4,
  SATURDAY: 5,
  SUNDAY: 6,
} as const
export type Weekday = (typeof Weekday)[keyof typeof Weekday]
