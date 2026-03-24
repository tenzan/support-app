import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { getAvailableSlotsSchema } from '@support-app/shared'
import type { Env } from '../index'
import { SlotService } from '../services/slot-service'
import { success } from '../lib/response'

const availabilityRouter = new Hono<{ Bindings: Env }>()

// Public endpoint — customers need to see available slots
availabilityRouter.get(
  '/slots',
  zValidator('query', getAvailableSlotsSchema),
  async (c) => {
    const input = c.req.valid('query')
    const svc = new SlotService(c.env.DB)
    const slots = await svc.getAvailableSlots(input)
    return success(c, slots)
  },
)

export { availabilityRouter }
