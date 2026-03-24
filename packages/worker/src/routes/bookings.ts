import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createBookingSchema,
  proposeBookingSlotsSchema,
  selectProposedSlotSchema,
  rescheduleBookingSchema,
} from '@support-app/shared'
import { z } from 'zod'
import type { Env } from '../index'
import { authMiddleware, type AuthUser } from '../middleware/auth'
import { BookingService } from '../services/booking-service'
import { success } from '../lib/response'

type BookingEnv = {
  Bindings: Env
  Variables: { user: AuthUser }
}

const bookingsRouter = new Hono<BookingEnv>()

bookingsRouter.use('/*', authMiddleware)

// Get booking for a ticket
bookingsRouter.get('/ticket/:ticketId', async (c) => {
  const svc = new BookingService(c.env.DB)
  const booking = await svc.getByTicketId(c.req.param('ticketId'))
  return success(c, booking)
})

// Get booking history
bookingsRouter.get('/:id/history', async (c) => {
  const svc = new BookingService(c.env.DB)
  const history = await svc.getHistory(c.req.param('id'))
  return success(c, history)
})

// Self-book
bookingsRouter.post(
  '/book',
  zValidator('json', createBookingSchema),
  async (c) => {
    const user = c.get('user')
    const input = c.req.valid('json')
    const svc = new BookingService(c.env.DB)

    const booking = await svc.selfBook({
      ticket_id: input.ticket_id,
      slot_start: input.slot_start,
      slot_end: input.slot_end,
      timezone: input.timezone,
      notes: input.notes,
      actor_id: user.id,
      actor_role: user.role,
    })

    return success(c, booking, 201)
  },
)

// Agent propose slots
bookingsRouter.post(
  '/propose',
  zValidator('json', proposeBookingSlotsSchema),
  async (c) => {
    const user = c.get('user')
    const input = c.req.valid('json')
    const svc = new BookingService(c.env.DB)

    const booking = await svc.proposeSlots({
      ticket_id: input.ticket_id,
      slots: input.slots,
      timezone: input.timezone,
      notes: input.notes,
      actor_id: user.id,
      actor_role: user.role,
    })

    return success(c, booking, 201)
  },
)

// Select proposed slot
bookingsRouter.post(
  '/select',
  zValidator('json', selectProposedSlotSchema),
  async (c) => {
    const user = c.get('user')
    const input = c.req.valid('json')
    const svc = new BookingService(c.env.DB)

    const booking = await svc.selectProposedSlot({
      booking_id: input.booking_id,
      slot_start: input.slot_start,
      slot_end: input.slot_end,
      actor_id: user.id,
      actor_role: user.role,
    })

    return success(c, booking)
  },
)

// Internal book (agent books directly)
bookingsRouter.post(
  '/internal',
  zValidator('json', createBookingSchema),
  async (c) => {
    const user = c.get('user')
    const input = c.req.valid('json')
    const svc = new BookingService(c.env.DB)

    const booking = await svc.internalBook({
      ticket_id: input.ticket_id,
      slot_start: input.slot_start,
      slot_end: input.slot_end,
      timezone: input.timezone,
      notes: input.notes,
      actor_id: user.id,
      actor_role: user.role,
    })

    return success(c, booking, 201)
  },
)

// Reschedule
bookingsRouter.post(
  '/reschedule',
  zValidator('json', rescheduleBookingSchema),
  async (c) => {
    const user = c.get('user')
    const input = c.req.valid('json')
    const svc = new BookingService(c.env.DB)

    const booking = await svc.reschedule({
      booking_id: input.booking_id,
      new_slot_start: input.new_slot_start,
      new_slot_end: input.new_slot_end,
      notes: input.notes,
      actor_id: user.id,
      actor_role: user.role,
    })

    return success(c, booking)
  },
)

// Cancel
bookingsRouter.post(
  '/:id/cancel',
  zValidator('json', z.object({ notes: z.string().max(1000).nullable().default(null) })),
  async (c) => {
    const user = c.get('user')
    const input = c.req.valid('json')
    const svc = new BookingService(c.env.DB)

    const booking = await svc.cancel({
      booking_id: c.req.param('id'),
      notes: input.notes,
      actor_id: user.id,
      actor_role: user.role,
    })

    return success(c, booking)
  },
)

export { bookingsRouter }
