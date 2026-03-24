import { Routes, Route, Navigate } from 'react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './lib/auth-context'
import { PublicLayout } from './layouts/public-layout'
import { AdminLayout } from './layouts/admin-layout'
import { CustomerLayout } from './layouts/customer-layout'
import { LoginPage } from './pages/login'
import { DepartmentsPage } from './pages/public/departments'
import { CategoriesPage } from './pages/public/categories'
import { SubmitTicketPage } from './pages/public/submit-ticket'
import { CustomerTicketList } from './pages/customer/ticket-list'
import { CustomerTicketDetail } from './pages/customer/ticket-detail'
import { AdminDashboard } from './pages/admin/dashboard'
import { AdminTicketList } from './pages/admin/ticket-list'
import { AdminTicketDetail } from './pages/admin/ticket-detail'
import { AdminDepartments } from './pages/admin/departments'
import { AdminCategories } from './pages/admin/categories'
import { AdminScheduling } from './pages/admin/scheduling'
import { AdminSettings } from './pages/admin/settings'
import { Loading } from './components/ui'
import { UserRole } from '@support-app/shared'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function RequireAuth({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth()

  if (loading) return <Loading />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<DepartmentsPage />} />
        <Route path="/departments/:departmentId" element={<CategoriesPage />} />
        <Route path="/submit" element={<SubmitTicketPage />} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />

      {/* Customer portal */}
      <Route
        element={
          <RequireAuth>
            <CustomerLayout />
          </RequireAuth>
        }
      >
        <Route path="/portal" element={<CustomerTicketList />} />
        <Route path="/portal/tickets/:ticketId" element={<CustomerTicketDetail />} />
      </Route>

      {/* Admin */}
      <Route
        element={
          <RequireAuth roles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.AGENT]}>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/tickets" element={<AdminTicketList />} />
        <Route path="/admin/tickets/:ticketId" element={<AdminTicketDetail />} />
        <Route path="/admin/departments" element={<AdminDepartments />} />
        <Route path="/admin/categories" element={<AdminCategories />} />
        <Route path="/admin/scheduling" element={<AdminScheduling />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </QueryClientProvider>
  )
}
