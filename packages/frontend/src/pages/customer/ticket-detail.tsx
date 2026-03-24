import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { api } from '../../lib/api-client'
import { Badge, Button, Textarea, Loading } from '../../components/ui'
import type { Ticket, TicketMessage } from '@support-app/shared'
import { format } from 'date-fns'

export function CustomerTicketDetail() {
  const { ticketId } = useParams()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  const loadData = () => {
    if (!ticketId) return
    Promise.all([
      api.get<Ticket>(`/tickets/${ticketId}`),
      api.get<TicketMessage[]>(`/tickets/${ticketId}/messages`),
    ])
      .then(([t, m]) => {
        setTicket(t)
        setMessages(m)
      })
      .finally(() => setLoading(false))
  }

  useEffect(loadData, [ticketId])

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim() || !ticketId) return
    setSending(true)
    try {
      await api.post(`/tickets/${ticketId}/messages`, {
        body: reply,
        message_type: 'public',
      })
      setReply('')
      loadData()
    } finally {
      setSending(false)
    }
  }

  if (loading) return <Loading />
  if (!ticket) return <div>Ticket not found</div>

  return (
    <div>
      <Link to="/portal" className="text-sm text-blue-600 hover:text-blue-800">
        ← Back to tickets
      </Link>
      <div className="mt-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="font-mono text-gray-500">{ticket.ticket_number}</span>
          <Badge variant="status" value={ticket.status}>
            {ticket.status.replace(/_/g, ' ')}
          </Badge>
          <Badge variant="priority" value={ticket.priority}>
            {ticket.priority}
          </Badge>
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{ticket.subject}</h1>
        <p className="mt-1 text-sm text-gray-500">
          Created {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`rounded-lg border p-4 ${
              msg.sender_id === ticket.requester_id
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {msg.sender_id === ticket.requester_id ? 'You' : 'Support'}
              </span>
              <span className="text-xs text-gray-500">
                {format(new Date(msg.created_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
            <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.body}</p>
          </div>
        ))}
      </div>

      {ticket.status !== 'closed' && (
        <form onSubmit={handleReply} className="border-t pt-6">
          <Textarea
            label="Reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply..."
            rows={4}
          />
          <div className="mt-3 flex justify-end">
            <Button type="submit" loading={sending} disabled={!reply.trim()}>
              Send Reply
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
