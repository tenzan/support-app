import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import { ticketMessages, emailThreads, users } from '../db/schema'
import { generateId } from '../lib/id'
import {
  parseReplyToken,
  matchInboundEmail,
  isDuplicateMessage,
  MessageType,
} from '@support-app/shared'
import { TicketService } from './ticket-service'

export interface InboundEmailPayload {
  from: string
  to: string
  subject: string
  text?: string
  html?: string
  message_id?: string
  in_reply_to?: string
  references?: string
  headers?: Record<string, string>
}

export class InboundEmailService {
  private db

  constructor(private d1: D1Database) {
    this.db = drizzle(d1)
  }

  async processInbound(payload: InboundEmailPayload): Promise<{
    status: 'matched' | 'duplicate' | 'unmatched'
    ticket_id?: string
    message_id?: string
  }> {
    // 1. Check for duplicate by message_id
    if (payload.message_id) {
      const existing = await this.db
        .select({ id: ticketMessages.id })
        .from(ticketMessages)
        .where(eq(ticketMessages.email_message_id, payload.message_id))
        .limit(1)

      if (existing.length > 0) {
        return { status: 'duplicate' }
      }
    }

    // 2. Load all threads for matching
    const threads = await this.db.select().from(emailThreads)
    const threadRecords = threads.map((t) => ({
      ticket_id: t.ticket_id,
      thread_token: t.thread_token,
      outbound_message_id: t.outbound_message_id,
    }))

    // 3. Match inbound email to ticket
    const ticketId = matchInboundEmail(
      {
        to: payload.to,
        in_reply_to: payload.in_reply_to ?? null,
        references: payload.references ?? null,
      },
      threadRecords,
    )

    if (!ticketId) {
      return { status: 'unmatched' }
    }

    // 4. Find or create sender user by email
    const senderEmail = this.extractEmail(payload.from)
    let senderId: string

    const [existingUser] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, senderEmail))
      .limit(1)

    if (existingUser) {
      senderId = existingUser.id
    } else {
      // Create customer user for unknown sender
      senderId = generateId()
      const senderName = this.extractName(payload.from) || senderEmail
      await this.db.insert(users).values({
        id: senderId,
        email: senderEmail,
        name: senderName,
        password_hash: 'inbound-email-user', // placeholder
        role: 'customer',
      })
    }

    // 5. Create message on ticket
    const body = this.trimQuotedContent(payload.text || payload.html || '')
    const ticketService = new TicketService(this.d1)

    const message = await ticketService.addMessage({
      ticket_id: ticketId,
      sender_id: senderId,
      body,
      message_type: MessageType.PUBLIC,
      email_message_id: payload.message_id,
    })

    return {
      status: 'matched',
      ticket_id: ticketId,
      message_id: message.id,
    }
  }

  private extractEmail(from: string): string {
    const match = from.match(/<([^>]+)>/)
    if (match) return match[1]
    return from.trim()
  }

  private extractName(from: string): string {
    const match = from.match(/^([^<]+)</)
    if (match) return match[1].trim().replace(/^"|"$/g, '')
    return ''
  }

  private trimQuotedContent(body: string): string {
    // Simple quoted content trimming
    // Remove lines starting with > (quoted text)
    const lines = body.split('\n')
    const trimmed: string[] = []

    for (const line of lines) {
      // Stop at common reply markers
      if (
        line.match(/^On .+ wrote:$/i) ||
        line.match(/^-{2,}\s*Original Message/i) ||
        line.match(/^-{2,}\s*Forwarded/i) ||
        line.match(/^From:\s/i)
      ) {
        break
      }
      // Skip quoted lines
      if (line.startsWith('>')) continue
      trimmed.push(line)
    }

    return trimmed.join('\n').trim()
  }
}
