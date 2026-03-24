import { Hono } from 'hono'
import type { Env } from '../index'
import { authMiddleware, type AuthUser } from '../middleware/auth'
import { AttachmentService } from '../services/attachment-service'
import { success, error } from '../lib/response'
import { AppError } from '../lib/errors'

type AttachmentEnv = {
  Bindings: Env
  Variables: { user: AuthUser }
}

const attachmentsRouter = new Hono<AttachmentEnv>()

attachmentsRouter.use('/*', authMiddleware)

// Upload attachment
attachmentsRouter.post('/upload', async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  const ticketId = formData.get('ticket_id') as string | null
  const messageId = formData.get('message_id') as string | null

  if (!file || !ticketId) {
    return error(c, new AppError('VALIDATION_ERROR', 'file and ticket_id are required', 422))
  }

  // 10MB limit
  if (file.size > 10 * 1024 * 1024) {
    return error(c, new AppError('FILE_TOO_LARGE', 'File size must be under 10MB', 413))
  }

  const svc = new AttachmentService(c.env.DB, c.env.ATTACHMENTS)

  const metadata = await svc.createMetadata({
    ticket_id: ticketId,
    message_id: messageId ?? undefined,
    filename: file.name,
    content_type: file.type || 'application/octet-stream',
    size_bytes: file.size,
  })

  const data = await file.arrayBuffer()
  await svc.upload(metadata.storage_key, data, file.type || 'application/octet-stream')

  return success(c, metadata, 201)
})

// Download attachment
attachmentsRouter.get('/:id/download', async (c) => {
  const svc = new AttachmentService(c.env.DB, c.env.ATTACHMENTS)
  const result = await svc.getDownloadUrl(c.req.param('id'))

  return new Response(result.body as any, {
    headers: {
      'Content-Type': result.contentType,
      'Content-Disposition': `attachment; filename="${result.attachment.filename}"`,
    },
  })
})

// List attachments for a ticket
attachmentsRouter.get('/ticket/:ticketId', async (c) => {
  const svc = new AttachmentService(c.env.DB, c.env.ATTACHMENTS)
  const list = await svc.listByTicket(c.req.param('ticketId'))
  return success(c, list)
})

export { attachmentsRouter }
