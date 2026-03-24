/**
 * Generate a secure thread token for a ticket.
 * Token format: base64url(ticketId + random bytes) for uniqueness.
 */
export function generateThreadToken(ticketId: string): string {
  const random = Math.random().toString(36).substring(2, 10)
  const raw = `${ticketId}.${random}.${Date.now()}`
  // Use base64url-safe encoding
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Build a reply-to address with embedded token.
 * Format: reply+<token>@<domain>
 */
export function buildReplyToAddress(token: string, domain: string): string {
  return `reply+${token}@${domain}`
}

/**
 * Extract the reply token from a reply+<token>@domain address.
 * Returns null if the address is not a valid reply address.
 */
export function parseReplyToken(address: string): string | null {
  if (!address || typeof address !== 'string') return null

  const match = address.match(/^reply\+([^@]+)@.+$/)
  if (!match || !match[1]) return null

  return match[1]
}

interface ThreadRecord {
  ticket_id: string
  thread_token: string
  outbound_message_id: string | null
}

interface InboundMatchInput {
  to: string
  in_reply_to: string | null
  references: string | null
}

/**
 * Match an inbound email to a ticket using the priority chain:
 * 1. Reply token in recipient address
 * 2. In-Reply-To header matching outbound message id
 * 3. References header matching outbound message id
 */
export function matchInboundEmail(
  email: InboundMatchInput,
  threads: ThreadRecord[],
): string | null {
  if (threads.length === 0) return null

  // 1. Try reply token
  const token = parseReplyToken(email.to)
  if (token) {
    const match = threads.find((t) => t.thread_token === token)
    if (match) return match.ticket_id
  }

  // 2. Try In-Reply-To
  if (email.in_reply_to) {
    const match = threads.find((t) => t.outbound_message_id === email.in_reply_to)
    if (match) return match.ticket_id
  }

  // 3. Try References (may contain multiple message IDs separated by spaces)
  if (email.references) {
    const refs = email.references.split(/\s+/)
    for (const ref of refs) {
      const match = threads.find((t) => t.outbound_message_id === ref)
      if (match) return match.ticket_id
    }
  }

  return null
}

/**
 * Check if an inbound message is a duplicate based on its Message-ID.
 */
export function isDuplicateMessage(
  messageId: string | null | undefined,
  existingMessageIds: string[],
): boolean {
  if (!messageId) return false
  return existingMessageIds.includes(messageId)
}
