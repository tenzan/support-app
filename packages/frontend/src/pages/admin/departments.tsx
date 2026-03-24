import { useState, useEffect } from 'react'
import { api } from '../../lib/api-client'
import { Button, Input, Card, Loading, EmptyState } from '../../components/ui'
import type { Department } from '@support-app/shared'

export function AdminDepartments() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', icon: 'help-circle', cta_text: '' })

  const loadData = () => {
    api.get<Department[]>('/departments').then(setDepartments).finally(() => setLoading(false))
  }

  useEffect(loadData, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...form, cta_text: form.cta_text || null }

    if (editId) {
      await api.patch(`/departments/${editId}`, payload)
    } else {
      await api.post('/departments', payload)
    }

    setShowForm(false)
    setEditId(null)
    setForm({ name: '', description: '', icon: 'help-circle', cta_text: '' })
    loadData()
  }

  const handleEdit = (dept: Department) => {
    setForm({
      name: dept.name,
      description: dept.description,
      icon: dept.icon,
      cta_text: dept.cta_text || '',
    })
    setEditId(dept.id)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this department?')) return
    await api.delete(`/departments/${id}`)
    loadData()
  }

  const handleToggle = async (dept: Department) => {
    await api.patch(`/departments/${dept.id}`, { is_active: !dept.is_active })
    loadData()
  }

  if (loading) return <Loading />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Departments</h1>
        <Button onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', description: '', icon: 'help-circle', cta_text: '' }) }}>
          Add Department
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-4">{editId ? 'Edit' : 'New'} Department</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <Input label="Icon" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            <Input label="CTA Text" value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} placeholder="Optional" />
            <div className="flex gap-2">
              <Button type="submit">{editId ? 'Update' : 'Create'}</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {departments.length === 0 ? (
        <EmptyState title="No departments" description="Create your first department to get started." />
      ) : (
        <div className="space-y-3">
          {departments.map((dept) => (
            <div key={dept.id} className="flex items-center justify-between rounded-lg border bg-white p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{dept.name}</h3>
                  {!dept.is_active && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Inactive</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{dept.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleToggle(dept)}>
                  {dept.is_active ? 'Disable' : 'Enable'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(dept)}>Edit</Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(dept.id)}>Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
