import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { loginSchema } from '@support-app/shared'
import type { Env } from '../index'
import { AuthService } from '../services/auth-service'
import { authMiddleware, type AuthUser } from '../middleware/auth'
import { success, error } from '../lib/response'
import { AppError } from '../lib/errors'

type AuthEnv = {
  Bindings: Env
  Variables: { user: AuthUser }
}

const auth = new Hono<AuthEnv>()

auth.post('/login', zValidator('json', loginSchema), async (c) => {
  try {
    const { email, password } = c.req.valid('json')
    const authService = new AuthService(c.env.DB)
    const result = await authService.login(email, password)

    // Set cookie
    c.header(
      'Set-Cookie',
      `session=${result.token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${7 * 24 * 3600}`,
    )

    return success(c, result)
  } catch (err) {
    if (err instanceof AppError) {
      return error(c, err)
    }
    throw err
  }
})

auth.post('/logout', authMiddleware, async (c) => {
  const token =
    c.req.header('Authorization')?.slice(7) ||
    c.req.header('Cookie')?.match(/session=([^;]+)/)?.[1]

  if (token) {
    const authService = new AuthService(c.env.DB)
    await authService.logout(token)
  }

  c.header('Set-Cookie', 'session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0')
  return success(c, { message: 'Logged out' })
})

auth.get('/me', authMiddleware, async (c) => {
  const user = c.get('user')
  return success(c, user)
})

export { auth }
