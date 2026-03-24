import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { tickets, users } from '../db/schema'
import { EmailService } from './email-service'

export class NotificationService {
  private db
  private emailService: EmailService

  constructor(
    d1: D1Database,
    resendApiKey: string,
    fromEmail: string,
    replyToDomain: string,
  ) {
    this.db = drizzle(d1)
    this.emailService = new EmailService(d1, resendApiKey, fromEmail, replyToDomain)
  }

  async notifyTicketCreated(ticketId: string) {
    const ticket = await this.getTicketWithRequester(ticketId)
    if (!ticket) return

    await this.emailService.sendTicketEmail({
      to: ticket.requester_email,
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      subject: ticket.subject,
      body: `
        <h2>Your support request has been received</h2>
        <p><strong>Ticket:</strong> ${ticket.ticket_number}</p>
        <p><strong>Subject:</strong> ${ticket.subject}</p>
        <p>${ticket.description}</p>
        <p>We'll get back to you as soon as possible. You can reply to this email to add more information.</p>
      `,
    })
  }

  async notifyNewReply(ticketId: string, replyBody: string, replierName: string) {
    const ticket = await this.getTicketWithRequester(ticketId)
    if (!ticket) return

    await this.emailService.sendTicketEmail({
      to: ticket.requester_email,
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      subject: ticket.subject,
      body: `
        <h2>New reply on your ticket</h2>
        <p><strong>Ticket:</strong> ${ticket.ticket_number}</p>
        <p><strong>From:</strong> ${replierName}</p>
        <hr />
        <div>${replyBody}</div>
        <hr />
        <p>Reply to this email to respond.</p>
      `,
      isReply: true,
    })
  }

  async notifyStatusChanged(ticketId: string, oldStatus: string, newStatus: string) {
    const ticket = await this.getTicketWithRequester(ticketId)
    if (!ticket) return

    await this.emailService.sendTicketEmail({
      to: ticket.requester_email,
      ticketId: ticket.id,
      ticketNumber: ticket.ticket_number,
      subject: ticket.subject,
      body: `
        <h2>Ticket status updated</h2>
        <p><strong>Ticket:</strong> ${ticket.ticket_number}</p>
        <p><strong>Status:</strong> ${oldStatus} → ${newStatus}</p>
        <p>Reply to this email if you have any questions.</p>
      `,
      isReply: true,
    })
  }

  private async getTicketWithRequester(ticketId: string) {
    const [ticket] = await this.db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1)

    if (!ticket) return null

    const [requester] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, ticket.requester_id))
      .limit(1)

    if (!requester) return null

    return {
      ...ticket,
      requester_email: requester.email,
      requester_name: requester.name,
    }
  }
}
