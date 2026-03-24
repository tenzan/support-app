import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { api } from '../../lib/api-client'
import { Card, Loading } from '../../components/ui'
import type { Ticket, PaginatedResponse } from '@support-app/shared'

interface StatusCount {
  status: string
  count: number
  color: string
}

export function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<PaginatedResponse<Ticket>>('/tickets?per_page=100')
      .then((data) => setTickets(data.items))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  const statusCounts: StatusCount[] = [
    { status: 'new', count: tickets.filter((t) => t.status === 'new').length, color: 'text-blue-600 bg-blue-50' },
    { status: 'open', count: tickets.filter((t) => t.status === 'open').length, color: 'text-green-600 bg-green-50' },
    { status: 'pending', count: tickets.filter((t) => t.status === 'pending').length, color: 'text-yellow-600 bg-yellow-50' },
    { status: 'scheduled', count: tickets.filter((t) => t.status === 'scheduled').length, color: 'text-purple-600 bg-purple-50' },
    { status: 'resolved', count: tickets.filter((t) => t.status === 'resolved').length, color: 'text-gray-600 bg-gray-50' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        {statusCounts.map((sc) => (
          <Card key={sc.status}>
            <p className="text-sm font-medium text-gray-500 capitalize">{sc.status}</p>
            <p className={`mt-1 text-3xl font-bold ${sc.color.split(' ')[0]}`}>{sc.count}</p>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Tickets</h2>
        <Link to="/admin/tickets" className="text-sm text-blue-600 hover:text-blue-800">
          View all →
        </Link>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {tickets.slice(0, 10).map((ticket) => (
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
                <td className="px-4 py-3 text-sm capitalize">{ticket.status.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-sm capitalize">{ticket.priority}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
