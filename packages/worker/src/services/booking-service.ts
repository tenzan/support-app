import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { ticketBookings, bookingHistory, tickets, categories } from '../db/schema'
import { generateId } from '../lib/id'
import { NotFoundError, AppError, ForbiddenError } from '../lib/errors'
import {
  BookingStatus,
  BookingMode,
  TicketStatus,
  canTransitionBooking,
  validateBookingAction,
  type UserRole,
} from '@support-app/shared'

export class BookingService {
  private db

  constructor(private d1: D1Database) {
    this.db = drizzle(d1)
  }

  async getByTicketId(ticketId: string) {
    const [booking] = await this.db
      .select()
      .from(ticketBookings)
      .where(eq(ticketBookings.ticket_id, ticketId))
      .limit(1)
    return booking ?? null
  }

  async getById(id: string) {
    const [booking] = await this.db
      .select()
      .from(ticketBookings)
      .where(eq(ticketBookings.id, id))
      .limit(1)
    if (!booking) throw new NotFoundError('Booking')
    return booking
  }

  async getHistory(bookingId: string) {
    return this.db
      .select()
      .from(bookingHistory)
      .where(eq(bookingHistory.booking_id, bookingId))
  }

  /**
   * Customer self-books a slot
   */
  async selfBook(input: {
    ticket_id: string
    slot_start: string
    slot_end: string
    timezone: string
    notes?: string | null
    actor_id: string
    actor_role: UserRole
  }) {
    const category = await this.getCategoryForTicket(input.ticket_id)

    const validation = validateBookingAction({
      role: input.actor_role,
      bookingMode: category.booking_mode as BookingMode,
      action: 'book',
      currentStatus: BookingStatus.NOT_SCHEDULED,
    })
    if (!validation.allowed) throw new ForbiddenError(validation.reason)

    const id = generateId()
    const now = new Date().toISOString()

    await this.db.insert(ticketBookings).values({
      id,
      ticket_id: input.ticket_id,
      booking_mode: category.booking_mode as any,
      status: 'scheduled',
      selected_slot_start: input.slot_start,
      selected_slot_end: input.slot_end,
      timezone: input.timezone,
      notes: input.notes ?? null,
      confirmed_at: now,
      created_at: now,
      updated_at: now,
    })

    await this.addHistory({
      booking_id: id,
      action: 'booked',
      old_status: null,
      new_status: BookingStatus.SCHEDULED,
      new_slot_start: input.slot_start,
      new_slot_end: input.slot_end,
      actor_id: input.actor_id,
      notes: input.notes,
    })

    // Update ticket status to scheduled
    await this.db
      .update(tickets)
      .set({ status: 'scheduled' as any, updated_at: now })
      .where(eq(tickets.id, input.ticket_id))

    return this.getById(id)
  }

  /**
   * Agent proposes one or more slots
   */
  async proposeSlots(input: {
    ticket_id: string
    slots: { start: string; end: string }[]
    timezone: string
    notes?: string | null
    actor_id: string
    actor_role: UserRole
  }) {
    const category = await this.getCategoryForTicket(input.ticket_id)

    const validation = validateBookingAction({
      role: input.actor_role,
      bookingMode: category.booking_mode as BookingMode,
      action: 'propose',
      currentStatus: BookingStatus.NOT_SCHEDULED,
    })
    if (!validation.allowed) throw new ForbiddenError(validation.reason)

    const id = generateId()
    const now = new Date().toISOString()

    await this.db.insert(ticketBookings).values({
      id,
      ticket_id: input.ticket_id,
      booking_mode: 'agent_propose',
      status: 'awaiting_selection',
      proposed_slots: JSON.stringify(input.slots),
      timezone: input.timezone,
      notes: input.notes ?? null,
      created_at: now,
      updated_at: now,
    })

    await this.addHistory({
      booking_id: id,
      action: 'proposed',
      old_status: null,
      new_status: BookingStatus.AWAITING_SELECTION,
      actor_id: input.actor_id,
      notes: input.notes,
    })

    return this.getById(id)
  }

  /**
   * Customer selects one of the proposed slots
   */
  async selectProposedSlot(input: {
    booking_id: string
    slot_start: string
    slot_end: string
    actor_id: string
    actor_role: UserRole
  }) {
    const booking = await this.getById(input.booking_id)

    const validation = validateBookingAction({
      role: input.actor_role,
      bookingMode: booking.booking_mode as BookingMode,
      action: 'select',
      currentStatus: booking.status as BookingStatus,
    })
    if (!validation.allowed) throw new ForbiddenError(validation.reason)

    // Verify the selected slot was actually proposed
    const proposedSlots = JSON.parse(booking.proposed_slots || '[]')
    const validSlot = proposedSlots.some(
      (s: any) => s.start === input.slot_start && s.end === input.slot_end,
    )
    if (!validSlot) {
      throw new AppError('INVALID_SLOT', 'Selected slot was not in the proposed options')
    }

    const now = new Date().toISOString()

    await this.db
      .update(ticketBookings)
      .set({
        status: 'scheduled',
        selected_slot_start: input.slot_start,
        selected_slot_end: input.slot_end,
        confirmed_at: now,
        updated_at: now,
      })
      .where(eq(ticketBookings.id, input.booking_id))

    await this.addHistory({
      booking_id: input.booking_id,
      action: 'selected',
      old_status: booking.status as BookingStatus,
      new_status: BookingStatus.SCHEDULED,
      new_slot_start: input.slot_start,
      new_slot_end: input.slot_end,
      actor_id: input.actor_id,
    })

    // Update ticket status
    await this.db
      .update(tickets)
      .set({ status: 'scheduled' as any, updated_at: now })
      .where(eq(tickets.id, booking.ticket_id))

    return this.getById(input.booking_id)
  }

  /**
   * Internal booking (agent books directly)
   */
  async internalBook(input: {
    ticket_id: string
    slot_start: string
    slot_end: string
    timezone: string
    notes?: string | null
    actor_id: string
    actor_role: UserRole
  }) {
    const category = await this.getCategoryForTicket(input.ticket_id)

    const validation = validateBookingAction({
      role: input.actor_role,
      bookingMode: category.booking_mode as BookingMode,
      action: 'book',
      currentStatus: BookingStatus.NOT_SCHEDULED,
    })
    if (!validation.allowed) throw new ForbiddenError(validation.reason)

    const id = generateId()
    const now = new Date().toISOString()

    await this.db.insert(ticketBookings).values({
      id,
      ticket_id: input.ticket_id,
      booking_mode: 'internal_only',
      status: 'scheduled',
      selected_slot_start: input.slot_start,
      selected_slot_end: input.slot_end,
      timezone: input.timezone,
      notes: input.notes ?? null,
      confirmed_at: now,
      created_at: now,
      updated_at: now,
    })

    await this.addHistory({
      booking_id: id,
      action: 'booked_internally',
      old_status: null,
      new_status: BookingStatus.SCHEDULED,
      new_slot_start: input.slot_start,
      new_slot_end: input.slot_end,
      actor_id: input.actor_id,
      notes: input.notes,
    })

    await this.db
      .update(tickets)
      .set({ status: 'scheduled' as any, updated_at: now })
      .where(eq(tickets.id, input.ticket_id))

    return this.getById(id)
  }

  /**
   * Reschedule an existing booking
   */
  async reschedule(input: {
    booking_id: string
    new_slot_start: string
    new_slot_end: string
    notes?: string | null
    actor_id: string
    actor_role: UserRole
  }) {
    const booking = await this.getById(input.booking_id)

    const validation = validateBookingAction({
      role: input.actor_role,
      bookingMode: booking.booking_mode as BookingMode,
      action: 'reschedule',
      currentStatus: booking.status as BookingStatus,
    })
    if (!validation.allowed) throw new ForbiddenError(validation.reason)

    const now = new Date().toISOString()

    await this.db
      .update(ticketBookings)
      .set({
        status: 'rescheduled',
        selected_slot_start: input.new_slot_start,
        selected_slot_end: input.new_slot_end,
        notes: input.notes ?? booking.notes,
        updated_at: now,
      })
      .where(eq(ticketBookings.id, input.booking_id))

    await this.addHistory({
      booking_id: input.booking_id,
      action: 'rescheduled',
      old_status: booking.status as BookingStatus,
      new_status: BookingStatus.RESCHEDULED,
      old_slot_start: booking.selected_slot_start,
      old_slot_end: booking.selected_slot_end,
      new_slot_start: input.new_slot_start,
      new_slot_end: input.new_slot_end,
      actor_id: input.actor_id,
      notes: input.notes,
    })

    return this.getById(input.booking_id)
  }

  /**
   * Cancel a booking
   */
  async cancel(input: {
    booking_id: string
    notes?: string | null
    actor_id: string
    actor_role: UserRole
  }) {
    const booking = await this.getById(input.booking_id)

    const validation = validateBookingAction({
      role: input.actor_role,
      bookingMode: booking.booking_mode as BookingMode,
      action: 'cancel',
      currentStatus: booking.status as BookingStatus,
    })
    if (!validation.allowed) throw new ForbiddenError(validation.reason)

    const now = new Date().toISOString()

    await this.db
      .update(ticketBookings)
      .set({
        status: 'cancelled',
        cancelled_at: now,
        notes: input.notes ?? booking.notes,
        updated_at: now,
      })
      .where(eq(ticketBookings.id, input.booking_id))

    await this.addHistory({
      booking_id: input.booking_id,
      action: 'cancelled',
      old_status: booking.status as BookingStatus,
      new_status: BookingStatus.CANCELLED,
      old_slot_start: booking.selected_slot_start,
      old_slot_end: booking.selected_slot_end,
      actor_id: input.actor_id,
      notes: input.notes,
    })

    // Reopen ticket
    await this.db
      .update(tickets)
      .set({ status: 'open' as any, updated_at: now })
      .where(eq(tickets.id, booking.ticket_id))

    return this.getById(input.booking_id)
  }

  // --- Helpers ---

  private async getCategoryForTicket(ticketId: string) {
    const [ticket] = await this.db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1)
    if (!ticket) throw new NotFoundError('Ticket')

    const [category] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, ticket.category_id))
      .limit(1)
    if (!category) throw new NotFoundError('Category')

    if (!category.scheduling_enabled) {
      throw new AppError('SCHEDULING_DISABLED', 'Scheduling is not enabled for this category')
    }

    return category
  }

  private async addHistory(input: {
    booking_id: string
    action: string
    old_status: string | null
    new_status: string
    old_slot_start?: string | null
    old_slot_end?: string | null
    new_slot_start?: string | null
    new_slot_end?: string | null
    actor_id: string
    notes?: string | null
  }) {
    await this.db.insert(bookingHistory).values({
      id: generateId(),
      booking_id: input.booking_id,
      action: input.action,
      old_status: input.old_status,
      new_status: input.new_status,
      old_slot_start: input.old_slot_start ?? null,
      old_slot_end: input.old_slot_end ?? null,
      new_slot_start: input.new_slot_start ?? null,
      new_slot_end: input.new_slot_end ?? null,
      actor_id: input.actor_id,
      notes: input.notes ?? null,
      created_at: new Date().toISOString(),
    })
  }
}
