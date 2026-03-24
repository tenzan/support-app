import { Outlet, Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../lib/auth-context'
import {
  LayoutDashboard,
  Ticket,
  Building2,
  FolderTree,
  Calendar,
  Settings,
  LogOut,
} from 'lucide-react'

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/tickets', label: 'Tickets', icon: Ticket },
  { path: '/admin/departments', label: 'Departments', icon: Building2 },
  { path: '/admin/categories', label: 'Categories', icon: FolderTree },
  { path: '/admin/scheduling', label: 'Scheduling', icon: Calendar },
  { path: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="flex w-64 flex-col border-r bg-white">
        <div className="flex h-16 items-center border-b px-6">
          <Link to="/admin" className="text-lg font-bold text-gray-900">
            Support Admin
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t p-4">
          <div className="mb-2 text-sm text-gray-500">{user?.name}</div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
      <div className="flex-1">
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
