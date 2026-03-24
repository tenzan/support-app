import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  createAvailabilityTemplateSchema,
  updateAvailabilityTemplateSchema,
  createAvailabilityRuleSchema,
  createAvailabilityExceptionSchema,
  UserRole,
} from '@support-app/shared'
import type { Env } from '../index'
import { authMiddleware, requireRole, type AuthUser } from '../middleware/auth'
import { AvailabilityTemplateService } from '../services/availability-template-service'
import { success } from '../lib/response'

type TemplateEnv = {
  Bindings: Env
  Variables: { user: AuthUser }
}

const availabilityTemplatesRouter = new Hono<TemplateEnv>()

availabilityTemplatesRouter.use('/*', authMiddleware)

// List all templates
availabilityTemplatesRouter.get('/', async (c) => {
  const svc = new AvailabilityTemplateService(c.env.DB)
  const templates = await svc.list()
  return success(c, templates)
})

// Get template with rules and exceptions
availabilityTemplatesRouter.get('/:id', async (c) => {
  const svc = new AvailabilityTemplateService(c.env.DB)
  const template = await svc.getByIdWithDetails(c.req.param('id'))
  return success(c, template)
})

// Create template
availabilityTemplatesRouter.post(
  '/',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  zValidator('json', createAvailabilityTemplateSchema),
  async (c) => {
    const svc = new AvailabilityTemplateService(c.env.DB)
    const template = await svc.create(c.req.valid('json'))
    return success(c, template, 201)
  },
)

// Update template
availabilityTemplatesRouter.patch(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  zValidator('json', updateAvailabilityTemplateSchema),
  async (c) => {
    const svc = new AvailabilityTemplateService(c.env.DB)
    const template = await svc.update(c.req.param('id'), c.req.valid('json'))
    return success(c, template)
  },
)

// Delete template
availabilityTemplatesRouter.delete(
  '/:id',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (c) => {
    const svc = new AvailabilityTemplateService(c.env.DB)
    await svc.delete(c.req.param('id'))
    return success(c, { message: 'Template deleted' })
  },
)

// --- Rules ---

availabilityTemplatesRouter.post(
  '/:id/rules',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  zValidator('json', createAvailabilityRuleSchema.omit({ template_id: true })),
  async (c) => {
    const svc = new AvailabilityTemplateService(c.env.DB)
    const templateId = c.req.param('id')
    await svc.getById(templateId) // verify exists
    const input = c.req.valid('json')
    const rule = await svc.addRule({ ...input, template_id: templateId })
    return success(c, rule, 201)
  },
)

availabilityTemplatesRouter.delete(
  '/rules/:ruleId',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (c) => {
    const svc = new AvailabilityTemplateService(c.env.DB)
    await svc.deleteRule(c.req.param('ruleId'))
    return success(c, { message: 'Rule deleted' })
  },
)

// --- Exceptions ---

availabilityTemplatesRouter.post(
  '/:id/exceptions',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  zValidator('json', createAvailabilityExceptionSchema.omit({ template_id: true })),
  async (c) => {
    const svc = new AvailabilityTemplateService(c.env.DB)
    const templateId = c.req.param('id')
    await svc.getById(templateId) // verify exists
    const input = c.req.valid('json')
    const exception = await svc.addException({ ...input, template_id: templateId })
    return success(c, exception, 201)
  },
)

availabilityTemplatesRouter.delete(
  '/exceptions/:exceptionId',
  requireRole(UserRole.SUPER_ADMIN, UserRole.ADMIN),
  async (c) => {
    const svc = new AvailabilityTemplateService(c.env.DB)
    await svc.deleteException(c.req.param('exceptionId'))
    return success(c, { message: 'Exception deleted' })
  },
)

export { availabilityTemplatesRouter }
