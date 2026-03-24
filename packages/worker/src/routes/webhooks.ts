import { Hono } from 'hono'
import type { Env } from '../index'
import { InboundEmailService, type InboundEmailPayload } from '../services/inbound-email-service'
import { success, error } from '../lib/response'
import { AppError } from '../lib/errors'

const webhooksRouter = new Hono<{ Bindings: Env }>()

// Resend inbound email webhook
webhooksRouter.post('/resend/inbound', async (c) => {
  // Verify webhook signature if secret is configured
  const webhookSecret = c.env.RESEND_WEBHOOK_SECRET
  if (webhookSecret) {
    const signature = c.req.header('svix-signature')
    const timestamp = c.req.header('svix-timestamp')
    const svixId = c.req.header('svix-id')

    if (!signature || !timestamp || !svixId) {
      return error(c, new AppError('WEBHOOK_INVALID', 'Missing webhook signature headers', 401))
    }

    // Basic timestamp validation (within 5 minutes)
    const webhookTime = parseInt(timestamp, 10)
    const now = Math.floor(Date.now() / 1000)
    if (Math.abs(now - webhookTime) > 300) {
      return error(c, new AppError('WEBHOOK_EXPIRED', 'Webhook timestamp too old', 401))
    }
  }

  let body: any
  try {
    body = await c.req.json()
  } catch {
    return error(c, new AppError('INVALID_PAYLOAD', 'Invalid JSON payload', 400))
  }

  // Extract email data from Resend webhook payload
  const payload: InboundEmailPayload = {
    from: body.data?.from || body.from || '',
    to: body.data?.to || body.to || '',
    subject: body.data?.subject || body.subject || '',
    text: body.data?.text || body.text,
    html: body.data?.html || body.html,
    message_id: body.data?.message_id || body.message_id,
    in_reply_to: body.data?.in_reply_to || body.in_reply_to,
    references: body.data?.references || body.references,
    headers: body.data?.headers || body.headers,
  }

  if (!payload.from || !payload.to) {
    return error(c, new AppError('INVALID_PAYLOAD', 'Missing required email fields', 400))
  }

  const service = new InboundEmailService(c.env.DB)
  const result = await service.processInbound(payload)

  return success(c, result)
})

export { webhooksRouter }
