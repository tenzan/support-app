import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { api } from '../../lib/api-client'
import { Card, Loading, EmptyState } from '../../components/ui'
import type { Category, Department } from '@support-app/shared'

export function CategoriesPage() {
  const { departmentId } = useParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [department, setDepartment] = useState<Department | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!departmentId) return
    Promise.all([
      api.get<Category[]>(`/categories/public/department/${departmentId}`),
      api.get<Department[]>('/departments/public').then((depts) =>
        depts.find((d) => d.id === departmentId) || null,
      ),
    ])
      .then(([cats, dept]) => {
        setCategories(cats)
        setDepartment(dept)
      })
      .finally(() => setLoading(false))
  }, [departmentId])

  if (loading) return <Loading />

  return (
    <div>
      <Link to="/" className="text-sm text-blue-600 hover:text-blue-800">
        ← Back to departments
      </Link>
      <div className="mt-4 mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{department?.name || 'Department'}</h1>
        <p className="mt-1 text-gray-600">Select a category for your request</p>
      </div>
      {categories.length === 0 ? (
        <EmptyState title="No categories available" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {categories.map((cat) => (
            <Link key={cat.id} to={`/submit?department=${departmentId}&category=${cat.id}`}>
              <Card hover>
                <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                <p className="mt-1 text-sm text-gray-600">{cat.description}</p>
                {cat.scheduling_enabled && (
                  <span className="mt-2 inline-block text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                    Booking available
                  </span>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
