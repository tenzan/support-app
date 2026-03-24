import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  UserRole,
} from '@support-app/shared'
import type { Env } from '../index'
import { authMiddleware, requireRole, type AuthUser } from '../middleware/auth'
import { DepartmentService } from '../services/department-service'
import { success } from '../lib/response'

type DeptEnv = {
  Bindings: Env
  Variables: { user: AuthUser }
}

const departmentsRouter = new Hono<DeptEnv>()

// Public: list active departments (for customer-facing support entry)
departmentsRouter.get('/public', async (c) => {
  const svc = new DepartmentService(c.env.DB)
  const depts = await svc.listActive()
  return success(c, depts)
})

// Admin routes
departmentsRouter.use('/*', authMiddleware)

departmentsRouter.get('/', async (c) => {
  const svc = new DepartmentService(c.env.DB)
  const depts = await svc.list()
  return success(c, depts)
})

departmentsRouter.get('/:id', async (c) => {
  const svc = new DepartmentService(c.env.DB)
  const dept = await svc.getById(c.req.param('id'))
  return success(c, dept)
})

departmentsRouter.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  zValidator('json', createDepartmentSchema),
  async (c) => {
    const svc = new DepartmentService(c.env.DB)
    const dept = await svc.create(c.req.valid('json'))
    return success(c, dept, 201)
  },
)

departmentsRouter.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  zValidator('json', updateDepartmentSchema),
  async (c) => {
    const svc = new DepartmentService(c.env.DB)
    const dept = await svc.update(c.req.param('id'), c.req.valid('json'))
    return success(c, dept)
  },
)

departmentsRouter.delete(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (c) => {
    const svc = new DepartmentService(c.env.DB)
    await svc.delete(c.req.param('id'))
    return success(c, { message: 'Department deleted' })
  },
)

export { departmentsRouter }
