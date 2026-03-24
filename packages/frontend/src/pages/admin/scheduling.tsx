import { useState, useEffect } from 'react'
import { api } from '../../lib/api-client'
import { Button, Input, Card, Loading, EmptyState } from '../../components/ui'

interface Template {
  id: string
  name: string
  description: string | null
  timezone: string
  rules?: any[]
  exceptions?: any[]
}

export function AdminScheduling() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selected, setSelected] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', timezone: 'UTC' })

  const loadTemplates = () => {
    api.get<Template[]>('/availability-templates').then(setTemplates).finally(() => setLoading(false))
  }

  useEffect(loadTemplates, [])

  const loadDetail = (id: string) => {
    api.get<Template>(`/availability-templates/${id}`).then(setSelected)
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/availability-templates', form)
    setShowForm(false)
    setForm({ name: '', description: '', timezone: 'UTC' })
    loadTemplates()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return
    await api.delete(`/availability-templates/${id}`)
    setSelected(null)
    loadTemplates()
  }

  if (loading) return <Loading />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Availability Templates</h1>
        <Button onClick={() => setShowForm(true)}>Add Template</Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-4">New Template</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input label="Timezone" value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
            <div className="flex gap-2">
              <Button type="submit">Create</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {templates.length === 0 ? (
            <EmptyState title="No templates" description="Create an availability template to configure scheduling." />
          ) : (
            templates.map((t) => (
              <div
                key={t.id}
                onClick={() => loadDetail(t.id)}
                className={`cursor-pointer rounded-lg border bg-white p-4 transition-shadow hover:shadow-sm ${
                  selected?.id === t.id ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{t.name}</h3>
                  <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDelete(t.id) }}>
                    Delete
                  </Button>
                </div>
                <p className="text-sm text-gray-500">{t.timezone}</p>
              </div>
            ))
          )}
        </div>

        {selected && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">{selected.name}</h2>
            <p className="text-sm text-gray-500 mb-4">Timezone: {selected.timezone}</p>

            <h3 className="text-sm font-medium text-gray-900 mb-2">Rules</h3>
            {selected.rules && selected.rules.length > 0 ? (
              <div className="space-y-1 mb-4">
                {selected.rules.map((r: any) => (
                  <div key={r.id} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-1.5 rounded">
                    <span>Day {r.weekday}: {r.start_time} - {r.end_time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-4">No rules configured</p>
            )}

            <h3 className="text-sm font-medium text-gray-900 mb-2">Exceptions</h3>
            {selected.exceptions && selected.exceptions.length > 0 ? (
              <div className="space-y-1">
                {selected.exceptions.map((e: any) => (
                  <div key={e.id} className="text-sm bg-gray-50 px-3 py-1.5 rounded">
                    {e.date} — {e.is_blocked ? 'Blocked' : `${e.start_time} - ${e.end_time}`}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No exceptions</p>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
