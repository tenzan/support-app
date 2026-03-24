import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { api } from '../../lib/api-client'
import { Card, Loading, EmptyState } from '../../components/ui'
import type { Department } from '@support-app/shared'

const iconMap: Record<string, string> = {
  wrench: '🔧',
  'shopping-cart': '🛒',
  'credit-card': '💳',
  'message-circle': '💬',
  'help-circle': '❓',
}

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<Department[]>('/departments/public')
      .then(setDepartments)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  if (departments.length === 0) {
    return <EmptyState title="No departments available" description="Please check back later." />
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">How can we help?</h1>
        <p className="mt-2 text-gray-600">Choose a department to get started</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => (
          <Link key={dept.id} to={`/departments/${dept.id}`}>
            <Card hover className="h-full">
              <div className="text-3xl mb-3">{iconMap[dept.icon] || '📋'}</div>
              <h2 className="text-lg font-semibold text-gray-900">{dept.name}</h2>
              <p className="mt-1 text-sm text-gray-600">{dept.description}</p>
              {dept.cta_text && (
                <p className="mt-4 text-sm font-medium text-blue-600">{dept.cta_text} →</p>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
