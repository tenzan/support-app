import { createMiddleware } from 'hono/factory'
import type { Env } from '../index'
import { AuthService } from '../services/auth-service'
import type { UserRole } from '@support-app/shared'
import { AppError } from '../lib/errors'
import { error } from '../lib/response'

export type AuthUser = {
  id: string
  email: string
  name: string
  role: UserRole
}

type AuthEnv = {
  Bindings: Env
  Variables: {
    user: AuthUser
  }
}

function extractToken(c: any): string | null {
  // Try Authorization header first
  const authHeader = c.req.header('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  // Try cookie
  const cookie = c.req.header('Cookie')
  if (cookie) {
    const match = cookie.match(/session=([^;]+)/)
    if (match) return match[1]
  }

  return null
}

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const token = extractToken(c)
  if (!token) {
    return error(c, new AppError('UNAUTHORIZED', 'Authentication required', 401))
  }

  try {
    const authService = new AuthService(c.env.DB)
    const user = await authService.validateSession(token)
    c.set('user', user)
    await next()
  } catch (err) {
    if (err instanceof AppError) {
      return error(c, err)
    }
    return error(c, new AppError('UNAUTHORIZED', 'Authentication failed', 401))
  }
})

export function requireRole(...roles: UserRole[]) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const user = c.get('user')
    if (!user) {
      return error(c, new AppError('UNAUTHORIZED', 'Authentication required', 401))
    }
    if (!roles.includes(user.role)) {
      return error(c, new AppError('FORBIDDEN', 'Insufficient permissions', 403))
    }
    await next()
  })
}
