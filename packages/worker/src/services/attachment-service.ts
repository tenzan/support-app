import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { attachments } from '../db/schema'
import { generateId } from '../lib/id'
import { NotFoundError } from '../lib/errors'

export class AttachmentService {
  private db

  constructor(
    d1: D1Database,
    private r2: R2Bucket,
  ) {
    this.db = drizzle(d1)
  }

  async createMetadata(input: {
    ticket_id: string
    message_id?: string
    filename: string
    content_type: string
    size_bytes: number
  }) {
    const id = generateId()
    const storageKey = `tickets/${input.ticket_id}/${id}/${input.filename}`
    const now = new Date().toISOString()

    await this.db.insert(attachments).values({
      id,
      ticket_id: input.ticket_id,
      message_id: input.message_id ?? null,
      filename: input.filename,
      content_type: input.content_type,
      size_bytes: input.size_bytes,
      storage_key: storageKey,
      created_at: now,
    })

    return { id, storage_key: storageKey }
  }

  async upload(storageKey: string, data: ArrayBuffer, contentType: string) {
    await this.r2.put(storageKey, data, {
      httpMetadata: { contentType },
    })
  }

  async getDownloadUrl(attachmentId: string) {
    const [att] = await this.db
      .select()
      .from(attachments)
      .where(eq(attachments.id, attachmentId))
      .limit(1)

    if (!att) throw new NotFoundError('Attachment')

    const object = await this.r2.get(att.storage_key)
    if (!object) throw new NotFoundError('Attachment file')

    return {
      attachment: att,
      body: object.body,
      contentType: att.content_type,
    }
  }

  async listByTicket(ticketId: string) {
    return this.db
      .select()
      .from(attachments)
      .where(eq(attachments.ticket_id, ticketId))
  }
}
