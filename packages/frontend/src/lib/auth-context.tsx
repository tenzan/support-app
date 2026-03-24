import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { api } from './api-client'
import type { UserRole } from '@support-app/shared'

interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
}

interface AuthState {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<AuthUser>('/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const result = await api.post<{ token: string; user: AuthUser }>('/auth/login', {
      email,
      password,
    })
    api.setToken(result.token)
    setUser(result.user)
  }

  const logout = async () => {
    await api.post('/auth/logout').catch(() => {})
    api.setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
