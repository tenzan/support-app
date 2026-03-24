import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api } from '../../lib/api-client'
import { Badge, Select, Loading, EmptyState } from '../../components/ui'
import type { Ticket, PaginatedResponse } from '@support-app/shared'
import { format } from 'date-fns'

export function AdminTicketList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState<PaginatedResponse<Ticket> | null>(null)
  const [loading, setLoading] = useState(true)

  const status = searchParams.get('status') || ''
  const priority = searchParams.get('priority') || ''
  const page = searchParams.get('page') || '1'

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    params.set('per_page', '25')
    params.set('page', page)
    if (status) params.set('status', status)
    if (priority) params.set('priority', priority)

    api
      .get<PaginatedResponse<Ticket>>(`/tickets?${params}`)
      .then(setData)
      .finally(() => setLoading(false))
  }, [status, priority, page])

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams)
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tickets</h1>

      <div className="flex gap-4 mb-6">
        <Select
          value={status}
          onChange={(e) => updateFilter('status', e.target.value)}
          placeholder="All statuses"
          options={[
            { value: '', label: 'All statuses' },
            { value: 'new', label: 'New' },
            { value: 'open', label: 'Open' },
            { value: 'pending', label: 'Pending' },
            { value: 'waiting_on_customer', label: 'Waiting on Customer' },
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'resolved', label: 'Resolved' },
            { value: 'closed', label: 'Closed' },
          ]}
        />
        <Select
          value={priority}
          onChange={(e) => updateFilter('priority', e.target.value)}
          placeholder="All priorities"
          options={[
            { value: '', label: 'All priorities' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' },
          ]}
        />
      </div>

      {loading ? (
        <Loading />
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="No tickets found" description="Try changing your filters." />
      ) : (
        <>
          <div className="rounded-lg border bg-white overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.items.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">
                      <Link to={`/admin/tickets/${ticket.id}`} className="hover:text-blue-600">
                        {ticket.ticket_number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <Link to={`/admin/tickets/${ticket.id}`} className="hover:text-blue-600">
                        {ticket.subject}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="status" value={ticket.status}>
                        {ticket.status.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="priority" value={ticket.priority}>
                        {ticket.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.total_pages > 1 && (
            <div className="mt-4 flex justify-center gap-2">
              {Array.from({ length: data.total_pages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => updateFilter('page', String(i + 1))}
                  className={`px-3 py-1 rounded text-sm ${
                    data.page === i + 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
