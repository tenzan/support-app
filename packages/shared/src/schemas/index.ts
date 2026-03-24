import { z } from 'zod'
import {
  UserRole,
  TicketStatus,
  TicketPriority,
  TicketChannel,
  MessageType,
  BookingMode,
  BookingStatus,
} from '../constants'

// --- Auth ---

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// --- Departments ---

export const createDepartmentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  icon: z.string().max(50).default('help-circle'),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  cta_text: z.string().max(100).nullable().default(null),
})

export const updateDepartmentSchema = createDepartmentSchema.partial()

// --- Categories ---

export const createCategorySchema = z.object({
  department_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  scheduling_enabled: z.boolean().default(false),
  booking_mode: z
    .enum([BookingMode.CUSTOMER_SELF_BOOK, BookingMode.AGENT_PROPOSE, BookingMode.INTERNAL_ONLY])
    .nullable()
    .default(null),
  slot_duration_minutes: z.number().int().min(5).max(480).nullable().default(null),
  interval_step_minutes: z.number().int().min(5).max(480).nullable().default(null),
  availability_template_id: z.string().uuid().nullable().default(null),
  minimum_notice_minutes: z.number().int().min(0).nullable().default(null),
  maximum_booking_window_days: z.number().int().min(1).max(365).nullable().default(null),
  buffer_before_minutes: z.number().int().min(0).nullable().default(null),
  buffer_after_minutes: z.number().int().min(0).nullable().default(null),
  max_bookings_per_slot: z.number().int().min(1).nullable().default(null),
  timezone: z.string().max(50).nullable().default(null),
  attachments_allowed: z.boolean().default(true),
  priority_required: z.boolean().default(false),
})

export const updateCategorySchema = createCategorySchema.partial()

// --- Tickets ---

export const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(10000),
  department_id: z.string().uuid(),
  category_id: z.string().uuid(),
  priority: z
    .enum([TicketPriority.LOW, TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.URGENT])
    .default(TicketPriority.MEDIUM),
  requester_email: z.string().email(),
  requester_name: z.string().min(1).max(100),
  channel: z
    .enum([TicketChannel.WEB, TicketChannel.EMAIL, TicketChannel.API])
    .default(TicketChannel.WEB),
})

export const updateTicketSchema = z.object({
  status: z
    .enum([
      TicketStatus.NEW,
      TicketStatus.OPEN,
      TicketStatus.PENDING,
      TicketStatus.WAITING_ON_CUSTOMER,
      TicketStatus.SCHEDULED,
      TicketStatus.RESOLVED,
      TicketStatus.CLOSED,
    ])
    .optional(),
  priority: z
    .enum([TicketPriority.LOW, TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.URGENT])
    .optional(),
  assignee_id: z.string().uuid().nullable().optional(),
})

export const addMessageSchema = z.object({
  body: z.string().min(1).max(50000),
  message_type: z
    .enum([MessageType.PUBLIC, MessageType.INTERNAL_NOTE])
    .default(MessageType.PUBLIC),
})

// --- Tickets list filters ---

export const listTicketsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(100).default(25),
  status: z
    .enum([
      TicketStatus.NEW,
      TicketStatus.OPEN,
      TicketStatus.PENDING,
      TicketStatus.WAITING_ON_CUSTOMER,
      TicketStatus.SCHEDULED,
      TicketStatus.RESOLVED,
      TicketStatus.CLOSED,
    ])
    .optional(),
  priority: z
    .enum([TicketPriority.LOW, TicketPriority.MEDIUM, TicketPriority.HIGH, TicketPriority.URGENT])
    .optional(),
  assignee_id: z.string().uuid().optional(),
  department_id: z.string().uuid().optional(),
  category_id: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
})

// --- Availability templates ---

export const createAvailabilityTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).nullable().default(null),
  timezone: z.string().min(1).max(50),
})

export const updateAvailabilityTemplateSchema = createAvailabilityTemplateSchema.partial()

export const createAvailabilityRuleSchema = z.object({
  template_id: z.string().uuid(),
  weekday: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format'),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format'),
})

export const createAvailabilityExceptionSchema = z.object({
  template_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  is_blocked: z.boolean().default(true),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format')
    .nullable()
    .default(null),
  end_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format')
    .nullable()
    .default(null),
})

// --- Bookings ---

export const createBookingSchema = z.object({
  ticket_id: z.string().uuid(),
  slot_start: z.string().datetime(),
  slot_end: z.string().datetime(),
  timezone: z.string().min(1).max(50),
  notes: z.string().max(1000).nullable().default(null),
})

export const proposeBookingSlotsSchema = z.object({
  ticket_id: z.string().uuid(),
  slots: z
    .array(
      z.object({
        start: z.string().datetime(),
        end: z.string().datetime(),
      }),
    )
    .min(1)
    .max(5),
  timezone: z.string().min(1).max(50),
  notes: z.string().max(1000).nullable().default(null),
})

export const selectProposedSlotSchema = z.object({
  booking_id: z.string().uuid(),
  slot_start: z.string().datetime(),
  slot_end: z.string().datetime(),
})

export const rescheduleBookingSchema = z.object({
  booking_id: z.string().uuid(),
  new_slot_start: z.string().datetime(),
  new_slot_end: z.string().datetime(),
  notes: z.string().max(1000).nullable().default(null),
})

// --- Slot lookup ---

export const getAvailableSlotsSchema = z.object({
  category_id: z.string().uuid(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timezone: z.string().min(1).max(50).optional(),
})
