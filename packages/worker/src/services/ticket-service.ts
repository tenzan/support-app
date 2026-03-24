import { eq, desc, asc, like, and, sql, count } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { tickets, ticketMessages, ticketEvents, users } from '../db/schema'
import { generateId } from '../lib/id'
import { NotFoundError, AppError } from '../lib/errors'
import {
  TicketStatus,
  MessageType,
  EventType,
  canTransition,
  canViewTicket,
  canUpdateTicket,
  canAddInternalNote,
  canChangeTicketStatus,
  type UserRole,
} from '@support-app/shared'

export class TicketService {
  private db

  constructor(d1: D1Database) {
    this.db = drizzle(d1)
  }

  private async generateTicketNumber(): Promise<string> {
    const result = await this.db
      .select({ total: count() })
      .from(tickets)
    const num = (result[0]?.total ?? 0) + 1
    return `SUP-${num.toString().padStart(5, '0')}`
  }

  async create(input: {
    subject: string
    description: string
    department_id: string
    category_id: string
    priority: string
    requester_id: string
    channel?: string
  }) {
    const id = generateId()
    const ticketNumber = await this.generateTicketNumber()
    const now = new Date().toISOString()

    await this.db.insert(tickets).values({
      id,
      ticket_number: ticketNumber,
      subject: input.subject,
      description: input.description,
      department_id: input.department_id,
      category_id: input.category_id,
      priority: input.priority as any,
      requester_id: input.requester_id,
      channel: (input.channel as any) ?? 'web',
      status: 'new',
      created_at: now,
      updated_at: now,
    })

    // Create initial message from description
    await this.db.insert(ticketMessages).values({
      id: generateId(),
      ticket_id: id,
      sender_id: input.requester_id,
      message_type: 'public',
      body: input.description,
      created_at: now,
    })

    // Create event
    await this.db.insert(ticketEvents).values({
      id: generateId(),
      ticket_id: id,
      actor_id: input.requester_id,
      event_type: EventType.STATUS_CHANGE,
      old_value: null,
      new_value: 'new',
      created_at: now,
    })

    return this.getById(id)
  }

  async getById(id: string) {
    const [ticket] = await this.db.select().from(tickets).where(eq(tickets.id, id)).limit(1)
    if (!ticket) throw new NotFoundError('Ticket')
    return ticket
  }

  async getByTicketNumber(ticketNumber: string) {
    const [ticket] = await this.db
      .select()
      .from(tickets)
      .where(eq(tickets.ticket_number, ticketNumber))
      .limit(1)
    if (!ticket) throw new NotFoundError('Ticket')
    return ticket
  }

  async list(filters: {
    page: number
    per_page: number
    status?: string
    priority?: string
    assignee_id?: string
    department_id?: string
    category_id?: string
    search?: string
    requester_id?: string // for customer-scoped access
  }) {
    const conditions = []

    if (filters.status) conditions.push(eq(tickets.status, filters.status as any))
    if (filters.priority) conditions.push(eq(tickets.priority, filters.priority as any))
    if (filters.assignee_id) conditions.push(eq(tickets.assignee_id, filters.assignee_id))
    if (filters.department_id) conditions.push(eq(tickets.department_id, filters.department_id))
    if (filters.category_id) conditions.push(eq(tickets.category_id, filters.category_id))
    if (filters.requester_id) conditions.push(eq(tickets.requester_id, filters.requester_id))
    if (filters.search) conditions.push(like(tickets.subject, `%${filters.search}%`))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const [totalResult, items] = await Promise.all([
      this.db
        .select({ total: count() })
        .from(tickets)
        .where(where),
      this.db
        .select()
        .from(tickets)
        .where(where)
        .orderBy(desc(tickets.created_at))
        .limit(filters.per_page)
        .offset((filters.page - 1) * filters.per_page),
    ])

    const total = totalResult[0]?.total ?? 0

    return {
      items,
      total,
      page: filters.page,
      per_page: filters.per_page,
      total_pages: Math.ceil(total / filters.per_page),
    }
  }

  async updateStatus(
    ticketId: string,
    newStatus: string,
    actorId: string,
    actorRole: UserRole,
  ) {
    if (!canChangeTicketStatus(actorRole)) {
      throw new AppError('FORBIDDEN', 'You do not have permission to change ticket status', 403)
    }

    const ticket = await this.getById(ticketId)

    if (!canTransition(ticket.status as TicketStatus, newStatus as TicketStatus)) {
      throw new AppError(
        'INVALID_TRANSITION',
        `Cannot transition from ${ticket.status} to ${newStatus}`,
      )
    }

    const now = new Date().toISOString()

    await this.db
      .update(tickets)
      .set({ status: newStatus as any, updated_at: now })
      .where(eq(tickets.id, ticketId))

    await this.db.insert(ticketEvents).values({
      id: generateId(),
      ticket_id: ticketId,
      actor_id: actorId,
      event_type: EventType.STATUS_CHANGE,
      old_value: ticket.status,
      new_value: newStatus,
      created_at: now,
    })

    return this.getById(ticketId)
  }

  async updatePriority(ticketId: string, newPriority: string, actorId: string) {
    const ticket = await this.getById(ticketId)
    const now = new Date().toISOString()

    await this.db
      .update(tickets)
      .set({ priority: newPriority as any, updated_at: now })
      .where(eq(tickets.id, ticketId))

    await this.db.insert(ticketEvents).values({
      id: generateId(),
      ticket_id: ticketId,
      actor_id: actorId,
      event_type: EventType.PRIORITY_CHANGE,
      old_value: ticket.priority,
      new_value: newPriority,
      created_at: now,
    })

    return this.getById(ticketId)
  }

  async assign(ticketId: string, assigneeId: string | null, actorId: string) {
    const ticket = await this.getById(ticketId)
    const now = new Date().toISOString()

    await this.db
      .update(tickets)
      .set({ assignee_id: assigneeId, updated_at: now })
      .where(eq(tickets.id, ticketId))

    await this.db.insert(ticketEvents).values({
      id: generateId(),
      ticket_id: ticketId,
      actor_id: actorId,
      event_type: EventType.ASSIGNMENT,
      old_value: ticket.assignee_id,
      new_value: assigneeId,
      created_at: now,
    })

    return this.getById(ticketId)
  }

  async addMessage(input: {
    ticket_id: string
    sender_id: string
    body: string
    message_type: string
    email_message_id?: string
  }) {
    const id = generateId()
    const now = new Date().toISOString()

    await this.db.insert(ticketMessages).values({
      id,
      ticket_id: input.ticket_id,
      sender_id: input.sender_id,
      message_type: input.message_type as any,
      body: input.body,
      email_message_id: input.email_message_id ?? null,
      created_at: now,
    })

    // Create event
    const eventType =
      input.message_type === MessageType.INTERNAL_NOTE ? EventType.INTERNAL_NOTE : EventType.MESSAGE
    await this.db.insert(ticketEvents).values({
      id: generateId(),
      ticket_id: input.ticket_id,
      actor_id: input.sender_id,
      event_type: eventType,
      metadata: JSON.stringify({ message_id: id }),
      created_at: now,
    })

    // Auto-open ticket if it's NEW and a staff member replies
    const ticket = await this.getById(input.ticket_id)
    if (
      ticket.status === TicketStatus.NEW &&
      input.message_type === MessageType.PUBLIC
    ) {
      await this.db
        .update(tickets)
        .set({ status: 'open' as any, updated_at: now })
        .where(eq(tickets.id, input.ticket_id))
    }

    // Update ticket timestamp
    await this.db
      .update(tickets)
      .set({ updated_at: now })
      .where(eq(tickets.id, input.ticket_id))

    return this.getMessageById(id)
  }

  async getMessageById(id: string) {
    const [msg] = await this.db
      .select()
      .from(ticketMessages)
      .where(eq(ticketMessages.id, id))
      .limit(1)
    if (!msg) throw new NotFoundError('Message')
    return msg
  }

  async getMessages(ticketId: string, includeInternal: boolean) {
    const conditions = [eq(ticketMessages.ticket_id, ticketId)]
    if (!includeInternal) {
      conditions.push(
        sql`${ticketMessages.message_type} != 'internal_note'` as any,
      )
    }
    return this.db
      .select()
      .from(ticketMessages)
      .where(and(...conditions))
      .orderBy(asc(ticketMessages.created_at))
  }

  async getTimeline(ticketId: string) {
    const [messages, events] = await Promise.all([
      this.db
        .select()
        .from(ticketMessages)
        .where(eq(ticketMessages.ticket_id, ticketId))
        .orderBy(asc(ticketMessages.created_at)),
      this.db
        .select()
        .from(ticketEvents)
        .where(eq(ticketEvents.ticket_id, ticketId))
        .orderBy(asc(ticketEvents.created_at)),
    ])

    return { messages, events }
  }
}
