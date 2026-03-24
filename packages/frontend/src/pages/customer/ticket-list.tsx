import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { api } from '../../lib/api-client'
import { Badge, Loading, EmptyState, Button } from '../../components/ui'
import type { Ticket, PaginatedResponse } from '@support-app/shared'
import { formatLocalDate } from '../../lib/format'

export function CustomerTicketList() {
  const [data, setData] = useState<PaginatedResponse<Ticket> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<PaginatedResponse<Ticket>>('/tickets?per_page=25')
      .then(setData)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        title="No tickets yet"
        description="Submit a support request to get started."
        action={
          <Link to="/">
            <Button>New Request</Button>
          </Link>
        }
      />
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
        <Link to="/">
          <Button>New Request</Button>
        </Link>
      </div>
      <div className="space-y-3">
        {data.items.map((ticket) => (
          <Link key={ticket.id} to={`/portal/tickets/${ticket.id}`}>
            <div className="flex items-center justify-between rounded-lg border bg-white p-4 hover:shadow-sm transition-shadow">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-500">{ticket.ticket_number}</span>
                  <Badge variant="status" value={ticket.status}>
                    {ticket.status.replace(/_/g, ' ')}
                  </Badge>
                  <Badge variant="priority" value={ticket.priority}>
                    {ticket.priority}
                  </Badge>
                </div>
                <p className="mt-1 font-medium text-gray-900 truncate">{ticket.subject}</p>
              </div>
              <span className="ml-4 text-sm text-gray-500 whitespace-nowrap">
                {formatLocalDate(ticket.created_at)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
