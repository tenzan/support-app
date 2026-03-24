import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { emailThreads } from '../db/schema'
import { generateId } from '../lib/id'
import { generateThreadToken, buildReplyToAddress } from '@support-app/shared'
import { Resend } from 'resend'

export class EmailService {
  private db
  private resend: Resend
  private fromEmail: string
  private replyToDomain: string

  constructor(
    d1: D1Database,
    resendApiKey: string,
    fromEmail: string,
    replyToDomain: string,
  ) {
    this.db = drizzle(d1)
    this.resend = new Resend(resendApiKey)
    this.fromEmail = fromEmail
    this.replyToDomain = replyToDomain
  }

  async getOrCreateThread(ticketId: string, subject: string) {
    const [existing] = await this.db
      .select()
      .from(emailThreads)
      .where(eq(emailThreads.ticket_id, ticketId))
      .limit(1)

    if (existing) return existing

    const id = generateId()
    const token = generateThreadToken(ticketId)
    const now = new Date().toISOString()

    await this.db.insert(emailThreads).values({
      id,
      ticket_id: ticketId,
      thread_token: token,
      subject,
      created_at: now,
      updated_at: now,
    })

    return this.db
      .select()
      .from(emailThreads)
      .where(eq(emailThreads.id, id))
      .then((rows) => rows[0]!)
  }

  async sendTicketEmail(input: {
    to: string
    ticketId: string
    ticketNumber: string
    subject: string
    body: string
    isReply?: boolean
  }) {
    const thread = await this.getOrCreateThread(input.ticketId, input.subject)
    const replyTo = buildReplyToAddress(thread.thread_token, this.replyToDomain)

    const emailSubject = input.isReply
      ? `Re: [${input.ticketNumber}] ${input.subject}`
      : `[${input.ticketNumber}] ${input.subject}`

    const headers: Record<string, string> = {}
    if (thread.outbound_message_id) {
      headers['References'] = thread.outbound_message_id
      headers['In-Reply-To'] = thread.outbound_message_id
    }

    try {
      const result = await this.resend.emails.send({
        from: this.fromEmail,
        to: input.to,
        replyTo,
        subject: emailSubject,
        html: input.body,
        headers,
      })

      // Store outbound message ID for threading
      if (result.data?.id) {
        const messageId = `<${result.data.id}@resend.dev>`
        await this.db
          .update(emailThreads)
          .set({
            outbound_message_id: messageId,
            updated_at: new Date().toISOString(),
          })
          .where(eq(emailThreads.id, thread.id))
      }

      return result
    } catch (err) {
      console.error('Failed to send email:', err)
      throw err
    }
  }

  async getThreadByToken(token: string) {
    const [thread] = await this.db
      .select()
      .from(emailThreads)
      .where(eq(emailThreads.thread_token, token))
      .limit(1)
    return thread ?? null
  }

  async getThreadByTicketId(ticketId: string) {
    const [thread] = await this.db
      .select()
      .from(emailThreads)
      .where(eq(emailThreads.ticket_id, ticketId))
      .limit(1)
    return thread ?? null
  }

  async getAllThreads() {
    return this.db.select().from(emailThreads)
  }
}
