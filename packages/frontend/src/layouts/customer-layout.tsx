import { Outlet, Link, useNavigate } from 'react-router'
import { useAuth } from '../lib/auth-context'

export function CustomerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="text-xl font-bold text-gray-900">
              Support Center
            </Link>
            <nav className="flex items-center gap-4">
              <Link to="/portal" className="text-sm text-gray-600 hover:text-gray-900">
                My Tickets
              </Link>
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link to="/login" className="text-sm text-gray-600 hover:text-gray-900">
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
