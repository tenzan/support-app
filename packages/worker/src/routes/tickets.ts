import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createTicketSchema,
  updateTicketSchema,
  addMessageSchema,
  listTicketsSchema,
  UserRole,
  canViewTicket,
  canUpdateTicket,
  canAddInternalNote,
  canViewInternalNotes,
  canAssignTicket,
  MessageType,
} from '@support-app/shared'
import type { Env } from '../index'
import { authMiddleware, requireRole, type AuthUser } from '../middleware/auth'
import { TicketService } from '../services/ticket-service'
import { AuthService } from '../services/auth-service'
import { success, error } from '../lib/response'
import { AppError, ForbiddenError } from '../lib/errors'

type TicketEnv = {
  Bindings: Env
  Variables: { user: AuthUser }
}

const ticketsRouter = new Hono<TicketEnv>()

// Public ticket creation (for customers without auth — creates/finds customer user)
ticketsRouter.post(
  '/public',
  zValidator('json', createTicketSchema),
  async (c) => {
    const input = c.req.valid('json')
    const authService = new AuthService(c.env.DB)

    // Find or create customer user by email
    let userId: string
    try {
      const existingUser = await authService.validateSession('') // won't work, but that's fine
      userId = existingUser.id
    } catch {
      // Create a customer user with a random password (they'll use email-based access)
      try {
        const user = await authService.createUser({
          email: input.requester_email,
          name: input.requester_name,
          password: crypto.randomUUID(), // placeholder — customers access via secure links
          role: UserRole.CUSTOMER,
        })
        userId = user.id
      } catch {
        // User might already exist — look them up via DB directly
        const { drizzle } = await import('drizzle-orm/d1')
        const { eq } = await import('drizzle-orm')
        const { users } = await import('../db/schema')
        const db = drizzle(c.env.DB)
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.email, input.requester_email))
          .limit(1)
        if (!existing) throw new AppError('USER_ERROR', 'Could not create or find user')
        userId = existing.id
      }
    }

    const svc = new TicketService(c.env.DB)
    const ticket = await svc.create({
      subject: input.subject,
      description: input.description,
      department_id: input.department_id,
      category_id: input.category_id,
      priority: input.priority,
      requester_id: userId,
      channel: input.channel,
    })

    return success(c, ticket, 201)
  },
)

// Authenticated routes
ticketsRouter.use('/*', authMiddleware)

ticketsRouter.get('/', zValidator('query', listTicketsSchema), async (c) => {
  const user = c.get('user')
  const filters = c.req.valid('query')

  // Customers can only see their own tickets
  const scopedFilters =
    user.role === UserRole.CUSTOMER
      ? { ...filters, requester_id: user.id }
      : filters

  const svc = new TicketService(c.env.DB)
  const result = await svc.list(scopedFilters)
  return success(c, result)
})

ticketsRouter.get('/:id', async (c) => {
  const user = c.get('user')
  const svc = new TicketService(c.env.DB)
  const ticket = await svc.getById(c.req.param('id'))

  if (!canViewTicket(user.role, user.id, ticket.requester_id)) {
    throw new ForbiddenError()
  }

  return success(c, ticket)
})

ticketsRouter.get('/:id/messages', async (c) => {
  const user = c.get('user')
  const svc = new TicketService(c.env.DB)
  const ticket = await svc.getById(c.req.param('id'))

  if (!canViewTicket(user.role, user.id, ticket.requester_id)) {
    throw new ForbiddenError()
  }

  const includeInternal = canViewInternalNotes(user.role)
  const messages = await svc.getMessages(c.req.param('id'), includeInternal)
  return success(c, messages)
})

ticketsRouter.get('/:id/timeline', async (c) => {
  const user = c.get('user')
  const svc = new TicketService(c.env.DB)
  const ticket = await svc.getById(c.req.param('id'))

  if (!canViewTicket(user.role, user.id, ticket.requester_id)) {
    throw new ForbiddenError()
  }

  const timeline = await svc.getTimeline(c.req.param('id'))
  return success(c, timeline)
})

ticketsRouter.patch(
  '/:id',
  zValidator('json', updateTicketSchema),
  async (c) => {
    const user = c.get('user')
    const input = c.req.valid('json')
    const svc = new TicketService(c.env.DB)

    if (!canUpdateTicket(user.role)) {
      throw new ForbiddenError()
    }

    let ticket = await svc.getById(c.req.param('id'))

    if (input.status) {
      ticket = await svc.updateStatus(c.req.param('id'), input.status, user.id, user.role)
    }
    if (input.priority) {
      ticket = await svc.updatePriority(c.req.param('id'), input.priority, user.id)
    }
    if (input.assignee_id !== undefined) {
      if (!canAssignTicket(user.role)) {
        throw new ForbiddenError('Only admins can assign tickets')
      }
      ticket = await svc.assign(c.req.param('id'), input.assignee_id, user.id)
    }

    return success(c, ticket)
  },
)

ticketsRouter.post(
  '/:id/messages',
  zValidator('json', addMessageSchema),
  async (c) => {
    const user = c.get('user')
    const input = c.req.valid('json')
    const svc = new TicketService(c.env.DB)

    const ticket = await svc.getById(c.req.param('id'))

    if (!canViewTicket(user.role, user.id, ticket.requester_id)) {
      throw new ForbiddenError()
    }

    if (input.message_type === MessageType.INTERNAL_NOTE && !canAddInternalNote(user.role)) {
      throw new ForbiddenError('Customers cannot add internal notes')
    }

    const message = await svc.addMessage({
      ticket_id: c.req.param('id'),
      sender_id: user.id,
      body: input.body,
      message_type: input.message_type,
    })

    return success(c, message, 201)
  },
)

export { ticketsRouter }
