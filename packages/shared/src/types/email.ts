export interface EmailThread {
  id: string
  ticket_id: string
  thread_token: string
  outbound_message_id: string | null
  subject: string
  created_at: string
  updated_at: string
}

export interface InboundEmail {
  from: string
  to: string
  subject: string
  body_text: string | null
  body_html: string | null
  message_id: string
  in_reply_to: string | null
  references: string | null
  headers: Record<string, string>
  attachments?: InboundAttachment[]
}

export interface InboundAttachment {
  filename: string
  content_type: string
  size: number
  content: string // base64
}
