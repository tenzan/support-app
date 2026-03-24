import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createCategorySchema,
  updateCategorySchema,
  UserRole,
} from '@support-app/shared'
import type { Env } from '../index'
import { authMiddleware, requireRole, type AuthUser } from '../middleware/auth'
import { CategoryService } from '../services/category-service'
import { success } from '../lib/response'

type CatEnv = {
  Bindings: Env
  Variables: { user: AuthUser }
}

const categoriesRouter = new Hono<CatEnv>()

// Public: list active categories for a department
categoriesRouter.get('/public/department/:departmentId', async (c) => {
  const svc = new CategoryService(c.env.DB)
  const cats = await svc.listActiveByDepartment(c.req.param('departmentId'))
  return success(c, cats)
})

// Admin routes
categoriesRouter.use('/*', authMiddleware)

categoriesRouter.get('/department/:departmentId', async (c) => {
  const svc = new CategoryService(c.env.DB)
  const cats = await svc.listByDepartment(c.req.param('departmentId'))
  return success(c, cats)
})

categoriesRouter.get('/:id', async (c) => {
  const svc = new CategoryService(c.env.DB)
  const cat = await svc.getById(c.req.param('id'))
  return success(c, cat)
})

categoriesRouter.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  zValidator('json', createCategorySchema),
  async (c) => {
    const svc = new CategoryService(c.env.DB)
    const cat = await svc.create(c.req.valid('json'))
    return success(c, cat, 201)
  },
)

categoriesRouter.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  zValidator('json', updateCategorySchema),
  async (c) => {
    const svc = new CategoryService(c.env.DB)
    const cat = await svc.update(c.req.param('id'), c.req.valid('json'))
    return success(c, cat)
  },
)

categoriesRouter.delete(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (c) => {
    const svc = new CategoryService(c.env.DB)
    await svc.delete(c.req.param('id'))
    return success(c, { message: 'Category deleted' })
  },
)

export { categoriesRouter }
