import type { BookingStatus, BookingMode, Weekday } from '../constants'

export interface AvailabilityTemplate {
  id: string
  name: string
  description: string | null
  timezone: string
  created_at: string
  updated_at: string
}

export interface AvailabilityRule {
  id: string
  template_id: string
  weekday: Weekday
  start_time: string // HH:mm
  end_time: string // HH:mm
}

export interface AvailabilityException {
  id: string
  template_id: string
  date: string // YYYY-MM-DD
  is_blocked: boolean
  start_time: string | null // HH:mm, if not blocked but has special hours
  end_time: string | null // HH:mm
}

export interface TimeSlot {
  start: string // ISO datetime
  end: string // ISO datetime
  available: boolean
  remaining_capacity: number
}

export interface TicketBooking {
  id: string
  ticket_id: string
  booking_mode: BookingMode
  status: BookingStatus
  proposed_slots: string | null // JSON array of TimeSlot
  selected_slot_start: string | null
  selected_slot_end: string | null
  timezone: string
  resource_id: string | null
  confirmed_at: string | null
  cancelled_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface BookingHistory {
  id: string
  booking_id: string
  action: string
  old_status: BookingStatus | null
  new_status: BookingStatus
  old_slot_start: string | null
  old_slot_end: string | null
  new_slot_start: string | null
  new_slot_end: string | null
  actor_id: string
  notes: string | null
  created_at: string
}
