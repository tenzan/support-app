import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// --- Users ---

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    email: text('email').notNull().unique(),
    name: text('name').notNull(),
    password_hash: text('password_hash').notNull(),
    role: text('role', { enum: ['super_admin', 'admin', 'agent', 'customer'] }).notNull(),
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updated_at: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    emailIdx: index('idx_users_email').on(table.email),
    roleIdx: index('idx_users_role').on(table.role),
  }),
)

// --- Sessions ---

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  user_id: text('user_id')
    .notNull()
    .references(() => users.id),
  token: text('token').notNull().unique(),
  expires_at: text('expires_at').notNull(),
  created_at: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

// --- Departments ---

export const departments = sqliteTable('departments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  icon: text('icon').notNull().default('help-circle'),
  sort_order: integer('sort_order').notNull().default(0),
  is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  cta_text: text('cta_text'),
  created_at: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

// --- Categories ---

export const categories = sqliteTable(
  'categories',
  {
    id: text('id').primaryKey(),
    department_id: text('department_id')
      .notNull()
      .references(() => departments.id),
    name: text('name').notNull(),
    description: text('description').notNull().default(''),
    sort_order: integer('sort_order').notNull().default(0),
    is_active: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    scheduling_enabled: integer('scheduling_enabled', { mode: 'boolean' })
      .notNull()
      .default(false),
    booking_mode: text('booking_mode', {
      enum: ['customer_self_book', 'agent_propose', 'internal_only'],
    }),
    slot_duration_minutes: integer('slot_duration_minutes'),
    interval_step_minutes: integer('interval_step_minutes'),
    availability_template_id: text('availability_template_id').references(
      () => availabilityTemplates.id,
    ),
    minimum_notice_minutes: integer('minimum_notice_minutes'),
    maximum_booking_window_days: integer('maximum_booking_window_days'),
    buffer_before_minutes: integer('buffer_before_minutes'),
    buffer_after_minutes: integer('buffer_after_minutes'),
    max_bookings_per_slot: integer('max_bookings_per_slot'),
    timezone: text('timezone'),
    attachments_allowed: integer('attachments_allowed', { mode: 'boolean' })
      .notNull()
      .default(true),
    priority_required: integer('priority_required', { mode: 'boolean' }).notNull().default(false),
    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updated_at: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    departmentIdx: index('idx_categories_department').on(table.department_id),
  }),
)

// --- Tickets ---

export const tickets = sqliteTable(
  'tickets',
  {
    id: text('id').primaryKey(),
    ticket_number: text('ticket_number').notNull().unique(),
    subject: text('subject').notNull(),
    description: text('description').notNull(),
    status: text('status', {
      enum: ['new', 'open', 'pending', 'waiting_on_customer', 'scheduled', 'resolved', 'closed'],
    })
      .notNull()
      .default('new'),
    priority: text('priority', { enum: ['low', 'medium', 'high', 'urgent'] })
      .notNull()
      .default('medium'),
    channel: text('channel', { enum: ['web', 'email', 'api'] })
      .notNull()
      .default('web'),
    department_id: text('department_id')
      .notNull()
      .references(() => departments.id),
    category_id: text('category_id')
      .notNull()
      .references(() => categories.id),
    requester_id: text('requester_id')
      .notNull()
      .references(() => users.id),
    assignee_id: text('assignee_id').references(() => users.id),
    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updated_at: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    statusIdx: index('idx_tickets_status').on(table.status),
    requesterIdx: index('idx_tickets_requester').on(table.requester_id),
    assigneeIdx: index('idx_tickets_assignee').on(table.assignee_id),
    departmentIdx: index('idx_tickets_department').on(table.department_id),
    categoryIdx: index('idx_tickets_category').on(table.category_id),
    createdIdx: index('idx_tickets_created').on(table.created_at),
  }),
)

// --- Ticket Messages ---

export const ticketMessages = sqliteTable(
  'ticket_messages',
  {
    id: text('id').primaryKey(),
    ticket_id: text('ticket_id')
      .notNull()
      .references(() => tickets.id),
    sender_id: text('sender_id')
      .notNull()
      .references(() => users.id),
    message_type: text('message_type', { enum: ['public', 'internal_note', 'system'] })
      .notNull()
      .default('public'),
    body: text('body').notNull(),
    email_message_id: text('email_message_id'),
    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    ticketIdx: index('idx_messages_ticket').on(table.ticket_id),
    emailIdIdx: index('idx_messages_email_id').on(table.email_message_id),
  }),
)

// --- Ticket Events ---

export const ticketEvents = sqliteTable(
  'ticket_events',
  {
    id: text('id').primaryKey(),
    ticket_id: text('ticket_id')
      .notNull()
      .references(() => tickets.id),
    actor_id: text('actor_id')
      .notNull()
      .references(() => users.id),
    event_type: text('event_type').notNull(),
    old_value: text('old_value'),
    new_value: text('new_value'),
    metadata: text('metadata'),
    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    ticketIdx: index('idx_events_ticket').on(table.ticket_id),
  }),
)

// --- Attachments ---

export const attachments = sqliteTable(
  'attachments',
  {
    id: text('id').primaryKey(),
    ticket_id: text('ticket_id')
      .notNull()
      .references(() => tickets.id),
    message_id: text('message_id').references(() => ticketMessages.id),
    filename: text('filename').notNull(),
    content_type: text('content_type').notNull(),
    size_bytes: integer('size_bytes').notNull(),
    storage_key: text('storage_key').notNull(),
    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    ticketIdx: index('idx_attachments_ticket').on(table.ticket_id),
  }),
)

// --- Email Threads ---

export const emailThreads = sqliteTable(
  'email_threads',
  {
    id: text('id').primaryKey(),
    ticket_id: text('ticket_id')
      .notNull()
      .references(() => tickets.id),
    thread_token: text('thread_token').notNull().unique(),
    outbound_message_id: text('outbound_message_id'),
    subject: text('subject').notNull(),
    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updated_at: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    tokenIdx: uniqueIndex('idx_email_threads_token').on(table.thread_token),
    ticketIdx: index('idx_email_threads_ticket').on(table.ticket_id),
  }),
)

// --- Tags ---

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  created_at: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

export const ticketTags = sqliteTable(
  'ticket_tags',
  {
    ticket_id: text('ticket_id')
      .notNull()
      .references(() => tickets.id),
    tag_id: text('tag_id')
      .notNull()
      .references(() => tags.id),
    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    ticketIdx: index('idx_ticket_tags_ticket').on(table.ticket_id),
  }),
)

// --- Availability Templates ---

export const availabilityTemplates = sqliteTable('availability_templates', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  timezone: text('timezone').notNull(),
  created_at: text('created_at')
    .notNull()
    .default(sql`(datetime('now'))`),
  updated_at: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})

// --- Availability Rules ---

export const availabilityRules = sqliteTable(
  'availability_rules',
  {
    id: text('id').primaryKey(),
    template_id: text('template_id')
      .notNull()
      .references(() => availabilityTemplates.id, { onDelete: 'cascade' }),
    weekday: integer('weekday').notNull(), // 0=Mon, 6=Sun
    start_time: text('start_time').notNull(), // HH:mm
    end_time: text('end_time').notNull(), // HH:mm
  },
  (table) => ({
    templateIdx: index('idx_rules_template').on(table.template_id),
  }),
)

// --- Availability Exceptions ---

export const availabilityExceptions = sqliteTable(
  'availability_exceptions',
  {
    id: text('id').primaryKey(),
    template_id: text('template_id')
      .notNull()
      .references(() => availabilityTemplates.id, { onDelete: 'cascade' }),
    date: text('date').notNull(), // YYYY-MM-DD
    is_blocked: integer('is_blocked', { mode: 'boolean' }).notNull().default(true),
    start_time: text('start_time'), // HH:mm, for special hours
    end_time: text('end_time'), // HH:mm
  },
  (table) => ({
    templateIdx: index('idx_exceptions_template').on(table.template_id),
  }),
)

// --- Ticket Bookings ---

export const ticketBookings = sqliteTable(
  'ticket_bookings',
  {
    id: text('id').primaryKey(),
    ticket_id: text('ticket_id')
      .notNull()
      .references(() => tickets.id),
    booking_mode: text('booking_mode', {
      enum: ['customer_self_book', 'agent_propose', 'internal_only'],
    }).notNull(),
    status: text('status', {
      enum: [
        'not_scheduled',
        'awaiting_selection',
        'proposed',
        'scheduled',
        'rescheduled',
        'cancelled',
        'completed',
      ],
    })
      .notNull()
      .default('not_scheduled'),
    proposed_slots: text('proposed_slots'), // JSON
    selected_slot_start: text('selected_slot_start'),
    selected_slot_end: text('selected_slot_end'),
    timezone: text('timezone').notNull(),
    resource_id: text('resource_id').references(() => users.id),
    confirmed_at: text('confirmed_at'),
    cancelled_at: text('cancelled_at'),
    notes: text('notes'),
    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
    updated_at: text('updated_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    ticketIdx: index('idx_bookings_ticket').on(table.ticket_id),
    statusIdx: index('idx_bookings_status').on(table.status),
    slotIdx: index('idx_bookings_slot').on(table.selected_slot_start),
  }),
)

// --- Booking History ---

export const bookingHistory = sqliteTable(
  'booking_history',
  {
    id: text('id').primaryKey(),
    booking_id: text('booking_id')
      .notNull()
      .references(() => ticketBookings.id),
    action: text('action').notNull(),
    old_status: text('old_status'),
    new_status: text('new_status').notNull(),
    old_slot_start: text('old_slot_start'),
    old_slot_end: text('old_slot_end'),
    new_slot_start: text('new_slot_start'),
    new_slot_end: text('new_slot_end'),
    actor_id: text('actor_id')
      .notNull()
      .references(() => users.id),
    notes: text('notes'),
    created_at: text('created_at')
      .notNull()
      .default(sql`(datetime('now'))`),
  },
  (table) => ({
    bookingIdx: index('idx_booking_history_booking').on(table.booking_id),
  }),
)

// --- Settings ---

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updated_at: text('updated_at')
    .notNull()
    .default(sql`(datetime('now'))`),
})
