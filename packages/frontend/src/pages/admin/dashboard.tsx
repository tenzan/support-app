import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { api } from '../../lib/api-client'
import { Card, Badge, Loading } from '../../components/ui'
import { formatLocalDate } from '../../lib/format'
import type { Ticket, Department, Category, PaginatedResponse } from '@support-app/shared'

type SortField = 'ticket_number' | 'department' | 'status' | 'priority' | 'created_at'
type SortDir = 'asc' | 'desc'

export function AdminDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  useEffect(() => {
    Promise.all([
      api.get<PaginatedResponse<Ticket>>('/tickets?per_page=100'),
      api.get<Department[]>('/departments'),
      api.get<Category[]>('/categories/department/all').catch(() => [] as Category[]),
    ])
      .then(([ticketData, depts, cats]) => {
        setTickets(ticketData.items)
        setDepartments(depts)
        // If /categories/department/all doesn't exist, load per department
        if (cats.length === 0 && depts.length > 0) {
          Promise.all(depts.map((d) => api.get<Category[]>(`/categories/department/${d.id}`))).then(
            (results) => setCategories(results.flat()),
          )
        } else {
          setCategories(cats)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]))
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]))

  const statusCounts = [
    { status: 'new', count: tickets.filter((t) => t.status === 'new').length, color: 'text-blue-600' },
    { status: 'open', count: tickets.filter((t) => t.status === 'open').length, color: 'text-green-600' },
    { status: 'pending', count: tickets.filter((t) => t.status === 'pending').length, color: 'text-yellow-600' },
    { status: 'scheduled', count: tickets.filter((t) => t.status === 'scheduled').length, color: 'text-purple-600' },
    { status: 'resolved', count: tickets.filter((t) => t.status === 'resolved').length, color: 'text-gray-600' },
  ]

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const sortIndicator = (field: SortField) => {
    if (sortField !== field) return ''
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  const sorted = [...tickets].sort((a, b) => {
    let cmp = 0
    if (sortField === 'created_at') {
      cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    } else if (sortField === 'department') {
      cmp = (deptMap[a.department_id] || '').localeCompare(deptMap[b.department_id] || '')
    } else {
      cmp = (a[sortField] || '').localeCompare(b[sortField] || '')
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        {statusCounts.map((sc) => (
          <Card key={sc.status}>
            <p className="text-sm font-medium text-gray-500 capitalize">{sc.status}</p>
            <p className={`mt-1 text-3xl font-bold ${sc.color}`}>{sc.count}</p>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => toggleSort('ticket_number')}>
                Ticket{sortIndicator('ticket_number')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => toggleSort('department')}>
                Department{sortIndicator('department')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => toggleSort('status')}>
                Status{sortIndicator('status')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => toggleSort('priority')}>
                Priority{sortIndicator('priority')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:text-gray-700" onClick={() => toggleSort('created_at')}>
                Created{sortIndicator('created_at')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sorted.slice(0, 10).map((ticket) => (
              <tr key={ticket.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-gray-500">
                  <Link to={`/admin/tickets/${ticket.id}`} className="hover:text-blue-600">
                    {ticket.ticket_number}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  <Link to={`/admin/tickets/${ticket.id}`} className="hover:text-blue-600 truncate block max-w-[200px]">
                    {ticket.subject}
                  </Link>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{deptMap[ticket.department_id] || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{catMap[ticket.category_id] || '—'}</td>
                <td className="px-4 py-3">
                  <Badge variant="status" value={ticket.status}>{ticket.status.replace(/_/g, ' ')}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="priority" value={ticket.priority}>{ticket.priority}</Badge>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{formatLocalDate(ticket.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
