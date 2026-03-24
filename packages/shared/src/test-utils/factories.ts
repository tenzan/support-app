import { UserRole, TicketStatus, TicketPriority, TicketChannel, MessageType, BookingMode, BookingStatus } from '../constants'
import type { User } from '../types/user'
import type { Department, Category } from '../types/department'
import type { Ticket, TicketMessage, TicketEvent } from '../types/ticket'
import type { AvailabilityTemplate, AvailabilityRule, AvailabilityException, TicketBooking } from '../types/scheduling'

let counter = 0
function nextId(): string {
  counter++
  return `test-${counter.toString().padStart(6, '0')}`
}

export function resetIdCounter(): void {
  counter = 0
}

const NOW = '2026-04-06T10:00:00Z'

// --- Users ---

export function buildUser(overrides: Partial<User> = {}): User {
  const id = overrides.id ?? nextId()
  return {
    id,
    email: `${id}@test.com`,
    name: `Test User ${id}`,
    role: UserRole.AGENT,
    is_active: true,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  }
}

export function buildSuperAdmin(overrides: Partial<User> = {}): User {
  return buildUser({ role: UserRole.SUPER_ADMIN, ...overrides })
}

export function buildAdmin(overrides: Partial<User> = {}): User {
  return buildUser({ role: UserRole.ADMIN, ...overrides })
}

export function buildAgent(overrides: Partial<User> = {}): User {
  return buildUser({ role: UserRole.AGENT, ...overrides })
}

export function buildCustomer(overrides: Partial<User> = {}): User {
  return buildUser({ role: UserRole.CUSTOMER, ...overrides })
}

// --- Departments ---

export function buildDepartment(overrides: Partial<Department> = {}): Department {
  const id = overrides.id ?? nextId()
  return {
    id,
    name: `Department ${id}`,
    description: 'Test department',
    icon: 'help-circle',
    sort_order: 0,
    is_active: true,
    cta_text: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  }
}

// --- Categories ---

export function buildCategory(overrides: Partial<Category> = {}): Category {
  const id = overrides.id ?? nextId()
  return {
    id,
    department_id: overrides.department_id ?? nextId(),
    name: `Category ${id}`,
    description: 'Test category',
    sort_order: 0,
    is_active: true,
    scheduling_enabled: false,
    booking_mode: null,
    slot_duration_minutes: null,
    interval_step_minutes: null,
    availability_template_id: null,
    minimum_notice_minutes: null,
    maximum_booking_window_days: null,
    buffer_before_minutes: null,
    buffer_after_minutes: null,
    max_bookings_per_slot: null,
    timezone: null,
    attachments_allowed: true,
    priority_required: false,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  }
}

export function buildSchedulingCategory(overrides: Partial<Category> = {}): Category {
  return buildCategory({
    scheduling_enabled: true,
    booking_mode: BookingMode.CUSTOMER_SELF_BOOK,
    slot_duration_minutes: 30,
    interval_step_minutes: 30,
    minimum_notice_minutes: 60,
    maximum_booking_window_days: 30,
    buffer_before_minutes: 0,
    buffer_after_minutes: 0,
    max_bookings_per_slot: 1,
    timezone: 'UTC',
    ...overrides,
  })
}

// --- Tickets ---

export function buildTicket(overrides: Partial<Ticket> = {}): Ticket {
  const id = overrides.id ?? nextId()
  return {
    id,
    ticket_number: `SUP-${id.replace('test-', '')}`,
    subject: `Test ticket ${id}`,
    description: 'Test ticket description',
    status: TicketStatus.NEW,
    priority: TicketPriority.MEDIUM,
    channel: TicketChannel.WEB,
    department_id: overrides.department_id ?? nextId(),
    category_id: overrides.category_id ?? nextId(),
    requester_id: overrides.requester_id ?? nextId(),
    assignee_id: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  }
}

// --- Messages ---

export function buildMessage(overrides: Partial<TicketMessage> = {}): TicketMessage {
  const id = overrides.id ?? nextId()
  return {
    id,
    ticket_id: overrides.ticket_id ?? nextId(),
    sender_id: overrides.sender_id ?? nextId(),
    message_type: MessageType.PUBLIC,
    body: 'Test message body',
    email_message_id: null,
    created_at: NOW,
    ...overrides,
  }
}

// --- Availability ---

export function buildAvailabilityTemplate(
  overrides: Partial<AvailabilityTemplate> = {},
): AvailabilityTemplate {
  const id = overrides.id ?? nextId()
  return {
    id,
    name: `Template ${id}`,
    description: null,
    timezone: 'UTC',
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  }
}

export function buildWeekdayRules(templateId: string): AvailabilityRule[] {
  const rules: AvailabilityRule[] = []
  for (let day = 0; day <= 4; day++) {
    rules.push(
      {
        id: nextId(),
        template_id: templateId,
        weekday: day as any,
        start_time: '09:00',
        end_time: '12:00',
      },
      {
        id: nextId(),
        template_id: templateId,
        weekday: day as any,
        start_time: '13:00',
        end_time: '17:00',
      },
    )
  }
  return rules
}

// --- Bookings ---

export function buildBooking(overrides: Partial<TicketBooking> = {}): TicketBooking {
  const id = overrides.id ?? nextId()
  return {
    id,
    ticket_id: overrides.ticket_id ?? nextId(),
    booking_mode: BookingMode.CUSTOMER_SELF_BOOK,
    status: BookingStatus.NOT_SCHEDULED,
    proposed_slots: null,
    selected_slot_start: null,
    selected_slot_end: null,
    timezone: 'UTC',
    resource_id: null,
    confirmed_at: null,
    cancelled_at: null,
    notes: null,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  }
}
