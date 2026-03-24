import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { api } from '../../lib/api-client'
import { Badge, Button, Textarea, Select, Loading } from '../../components/ui'
import { useAuth } from '../../lib/auth-context'
import type { Ticket, TicketMessage, TicketEvent } from '@support-app/shared'
import { formatLocalDate, formatLocalDateTime } from '../../lib/format'

export function AdminTicketDetail() {
  const { ticketId } = useParams()
  const { user } = useAuth()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [timeline, setTimeline] = useState<{ messages: TicketMessage[]; events: TicketEvent[] }>({
    messages: [],
    events: [],
  })
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [isInternal, setIsInternal] = useState(false)
  const [sending, setSending] = useState(false)

  const loadData = () => {
    if (!ticketId) return
    Promise.all([
      api.get<Ticket>(`/tickets/${ticketId}`),
      api.get<{ messages: TicketMessage[]; events: TicketEvent[] }>(`/tickets/${ticketId}/timeline`),
    ])
      .then(([t, tl]) => {
        setTicket(t)
        setTimeline(tl)
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
        message_type: isInternal ? 'internal_note' : 'public',
      })
      setReply('')
      loadData()
    } finally {
      setSending(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!ticketId) return
    await api.patch(`/tickets/${ticketId}`, { status: newStatus })
    loadData()
  }

  if (loading) return <Loading />
  if (!ticket) return <div>Ticket not found</div>

  // Merge and sort timeline entries
  const entries = [
    ...timeline.messages.map((m) => ({ type: 'message' as const, data: m, time: m.created_at })),
    ...timeline.events
      .filter((e) => e.event_type !== 'message' && e.event_type !== 'internal_note')
      .map((e) => ({ type: 'event' as const, data: e, time: e.created_at })),
  ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  return (
    <div>
      <Link to="/admin/tickets" className="text-sm text-blue-600 hover:text-blue-800">
        ← Back to tickets
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2">
          <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-mono text-sm text-gray-500">{ticket.ticket_number}</span>
            <Badge variant="status" value={ticket.status}>
              {ticket.status.replace(/_/g, ' ')}
            </Badge>
            <Badge variant="priority" value={ticket.priority}>
              {ticket.priority}
            </Badge>
          </div>

          {/* Timeline */}
          <div className="mt-6 space-y-4">
            {entries.map((entry, i) => {
              if (entry.type === 'message') {
                const msg = entry.data as TicketMessage
                const isNote = msg.message_type === 'internal_note'
                return (
                  <div
                    key={msg.id}
                    className={`rounded-lg border p-4 ${
                      isNote
                        ? 'bg-yellow-50 border-yellow-200'
                        : msg.sender_id === ticket.requester_id
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">
                          {msg.sender_id === ticket.requester_id ? 'Customer' : 'Agent'}
                        </span>
                        {isNote && (
                          <span className="text-xs bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded">
                            Internal Note
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatLocalDateTime(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.body}</p>
                  </div>
                )
              } else {
                const evt = entry.data as TicketEvent
                return (
                  <div key={evt.id} className="flex items-center gap-2 py-1 text-xs text-gray-500">
                    <div className="h-px flex-1 bg-gray-200" />
                    <span>
                      {evt.event_type.replace(/_/g, ' ')}: {evt.old_value || '—'} → {evt.new_value}
                    </span>
                    <span>{formatLocalDateTime(evt.created_at)}</span>
                    <div className="h-px flex-1 bg-gray-200" />
                  </div>
                )
              }
            })}
          </div>

          {/* Reply form */}
          <form onSubmit={handleReply} className="mt-6 border-t pt-6">
            <div className="flex items-center gap-4 mb-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded"
                />
                Internal note
              </label>
            </div>
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={isInternal ? 'Add an internal note...' : 'Reply to customer...'}
              rows={4}
            />
            <div className="mt-3 flex justify-end">
              <Button
                type="submit"
                loading={sending}
                disabled={!reply.trim()}
                variant={isInternal ? 'secondary' : 'primary'}
              >
                {isInternal ? 'Add Note' : 'Send Reply'}
              </Button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border bg-white p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Status</h3>
            <Select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              options={[
                { value: 'new', label: 'New' },
                { value: 'open', label: 'Open' },
                { value: 'pending', label: 'Pending' },
                { value: 'waiting_on_customer', label: 'Waiting on Customer' },
                { value: 'scheduled', label: 'Scheduled' },
                { value: 'resolved', label: 'Resolved' },
                { value: 'closed', label: 'Closed' },
              ]}
            />
          </div>

          <div className="rounded-lg border bg-white p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Details</h3>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd>{formatLocalDateTime(ticket.created_at)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Updated</dt>
                <dd>{formatLocalDateTime(ticket.updated_at)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Channel</dt>
                <dd className="capitalize">{ticket.channel}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}
