import { useState, useEffect } from 'react'
import { api } from '../../lib/api-client'
import { Button, Input, Select, Card, Loading, EmptyState } from '../../components/ui'
import type { Department, Category } from '@support-app/shared'

export function AdminCategories() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [selectedDept, setSelectedDept] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', scheduling_enabled: false })

  useEffect(() => {
    api.get<Department[]>('/departments').then((depts) => {
      setDepartments(depts)
      if (depts.length > 0) setSelectedDept(depts[0].id)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedDept) return
    api.get<Category[]>(`/categories/department/${selectedDept}`).then(setCategories)
  }, [selectedDept])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await api.post('/categories', {
      ...form,
      department_id: selectedDept,
    })
    setShowForm(false)
    setForm({ name: '', description: '', scheduling_enabled: false })
    api.get<Category[]>(`/categories/department/${selectedDept}`).then(setCategories)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return
    await api.delete(`/categories/${id}`)
    api.get<Category[]>(`/categories/department/${selectedDept}`).then(setCategories)
  }

  if (loading) return <Loading />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Button onClick={() => setShowForm(true)}>Add Category</Button>
      </div>

      <div className="mb-6">
        <Select
          label="Department"
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          options={departments.map((d) => ({ value: d.id, label: d.name }))}
        />
      </div>

      {showForm && (
        <Card className="mb-6">
          <h2 className="text-lg font-semibold mb-4">New Category</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.scheduling_enabled}
                onChange={(e) => setForm({ ...form, scheduling_enabled: e.target.checked })}
                className="rounded"
              />
              Enable scheduling
            </label>
            <div className="flex gap-2">
              <Button type="submit">Create</Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {categories.length === 0 ? (
        <EmptyState title="No categories" description="Add a category to this department." />
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between rounded-lg border bg-white p-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900">{cat.name}</h3>
                  {cat.scheduling_enabled && (
                    <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">Scheduling</span>
                  )}
                </div>
                <p className="text-sm text-gray-500">{cat.description}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)}>Delete</Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
