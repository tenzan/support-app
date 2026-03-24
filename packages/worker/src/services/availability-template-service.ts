import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { availabilityTemplates, availabilityRules, availabilityExceptions } from '../db/schema'
import { generateId } from '../lib/id'
import { NotFoundError } from '../lib/errors'
import type { z } from 'zod'
import type {
  createAvailabilityTemplateSchema,
  updateAvailabilityTemplateSchema,
  createAvailabilityRuleSchema,
  createAvailabilityExceptionSchema,
} from '@support-app/shared'

export class AvailabilityTemplateService {
  private db

  constructor(d1: D1Database) {
    this.db = drizzle(d1)
  }

  async list() {
    return this.db.select().from(availabilityTemplates)
  }

  async getById(id: string) {
    const [template] = await this.db
      .select()
      .from(availabilityTemplates)
      .where(eq(availabilityTemplates.id, id))
      .limit(1)
    if (!template) throw new NotFoundError('Availability template')
    return template
  }

  async getByIdWithDetails(id: string) {
    const template = await this.getById(id)
    const rules = await this.db
      .select()
      .from(availabilityRules)
      .where(eq(availabilityRules.template_id, id))
    const exceptions = await this.db
      .select()
      .from(availabilityExceptions)
      .where(eq(availabilityExceptions.template_id, id))

    return { ...template, rules, exceptions }
  }

  async create(input: z.infer<typeof createAvailabilityTemplateSchema>) {
    const id = generateId()
    const now = new Date().toISOString()

    await this.db.insert(availabilityTemplates).values({
      id,
      ...input,
      created_at: now,
      updated_at: now,
    })

    return this.getById(id)
  }

  async update(id: string, input: z.infer<typeof updateAvailabilityTemplateSchema>) {
    await this.getById(id)
    const now = new Date().toISOString()

    await this.db
      .update(availabilityTemplates)
      .set({ ...input, updated_at: now })
      .where(eq(availabilityTemplates.id, id))

    return this.getById(id)
  }

  async delete(id: string) {
    await this.getById(id)
    // Rules and exceptions cascade-delete via FK
    await this.db.delete(availabilityTemplates).where(eq(availabilityTemplates.id, id))
  }

  // --- Rules ---

  async addRule(input: z.infer<typeof createAvailabilityRuleSchema>) {
    const id = generateId()
    await this.db.insert(availabilityRules).values({ id, ...input })
    return { id, ...input }
  }

  async getRulesByTemplate(templateId: string) {
    return this.db
      .select()
      .from(availabilityRules)
      .where(eq(availabilityRules.template_id, templateId))
  }

  async deleteRule(ruleId: string) {
    await this.db.delete(availabilityRules).where(eq(availabilityRules.id, ruleId))
  }

  // --- Exceptions ---

  async addException(input: z.infer<typeof createAvailabilityExceptionSchema>) {
    const id = generateId()
    await this.db.insert(availabilityExceptions).values({ id, ...input })
    return { id, ...input }
  }

  async getExceptionsByTemplate(templateId: string) {
    return this.db
      .select()
      .from(availabilityExceptions)
      .where(eq(availabilityExceptions.template_id, templateId))
  }

  async deleteException(exceptionId: string) {
    await this.db
      .delete(availabilityExceptions)
      .where(eq(availabilityExceptions.id, exceptionId))
  }
}
