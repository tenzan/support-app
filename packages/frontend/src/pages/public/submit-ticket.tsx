import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router'
import { api } from '../../lib/api-client'
import { Button, Input, Textarea, Select } from '../../components/ui'

export function SubmitTicketPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const departmentId = searchParams.get('department') || ''
  const categoryId = searchParams.get('category') || ''

  const [form, setForm] = useState({
    subject: '',
    description: '',
    requester_email: '',
    requester_name: '',
    priority: 'medium',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ticketNumber, setTicketNumber] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const ticket = await api.post<any>('/tickets/public', {
        ...form,
        department_id: departmentId,
        category_id: categoryId,
      })
      setTicketNumber(ticket.ticket_number)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Failed to submit ticket')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg text-center py-12">
        <div className="rounded-full bg-green-100 p-3 inline-block mb-4">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Ticket Submitted</h2>
        <p className="mt-2 text-gray-600">
          Your ticket <span className="font-mono font-semibold">{ticketNumber}</span> has been
          created. We'll get back to you via email.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link to="/">
            <Button variant="secondary">Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/" className="text-sm text-blue-600 hover:text-blue-800">
        ← Back
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-gray-900">Submit a Request</h1>
      <p className="mt-1 text-gray-600">Fill out the form below and we'll get back to you.</p>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Your Name"
            value={form.requester_name}
            onChange={(e) => setForm({ ...form, requester_name: e.target.value })}
            required
            placeholder="Jane Smith"
          />
          <Input
            label="Your Email"
            type="email"
            value={form.requester_email}
            onChange={(e) => setForm({ ...form, requester_email: e.target.value })}
            required
            placeholder="jane@example.com"
          />
        </div>
        <Input
          label="Subject"
          value={form.subject}
          onChange={(e) => setForm({ ...form, subject: e.target.value })}
          required
          placeholder="Brief summary of your request"
        />
        <Select
          label="Priority"
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
          options={[
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' },
          ]}
        />
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
          placeholder="Please describe your issue or request in detail..."
          rows={6}
        />
        <Button type="submit" loading={loading} className="w-full">
          Submit Request
        </Button>
      </form>
    </div>
  )
}
