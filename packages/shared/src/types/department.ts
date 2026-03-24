import type { BookingMode } from '../constants'

export interface Department {
  id: string
  name: string
  description: string
  icon: string
  sort_order: number
  is_active: boolean
  cta_text: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  department_id: string
  name: string
  description: string
  sort_order: number
  is_active: boolean
  scheduling_enabled: boolean
  booking_mode: BookingMode | null
  slot_duration_minutes: number | null
  interval_step_minutes: number | null
  availability_template_id: string | null
  minimum_notice_minutes: number | null
  maximum_booking_window_days: number | null
  buffer_before_minutes: number | null
  buffer_after_minutes: number | null
  max_bookings_per_slot: number | null
  timezone: string | null
  attachments_allowed: boolean
  priority_required: boolean
  created_at: string
  updated_at: string
}
