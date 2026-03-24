import type {
  TicketStatus,
  TicketPriority,
  TicketChannel,
  MessageType,
  EventType,
} from '../constants'

export interface Ticket {
  id: string
  ticket_number: string
  subject: string
  description: string
  status: TicketStatus
  priority: TicketPriority
  channel: TicketChannel
  department_id: string
  category_id: string
  requester_id: string
  assignee_id: string | null
  created_at: string
  updated_at: string
}

export interface TicketMessage {
  id: string
  ticket_id: string
  sender_id: string
  message_type: MessageType
  body: string
  email_message_id: string | null
  created_at: string
}

export interface TicketEvent {
  id: string
  ticket_id: string
  actor_id: string
  event_type: EventType
  old_value: string | null
  new_value: string | null
  metadata: string | null
  created_at: string
}

export interface Attachment {
  id: string
  ticket_id: string
  message_id: string | null
  filename: string
  content_type: string
  size_bytes: number
  storage_key: string
  created_at: string
}
