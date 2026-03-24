import { eq, and, asc } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { categories } from '../db/schema'
import { generateId } from '../lib/id'
import { NotFoundError } from '../lib/errors'
import type { z } from 'zod'
import type { createCategorySchema, updateCategorySchema } from '@support-app/shared'

export class CategoryService {
  private db

  constructor(d1: D1Database) {
    this.db = drizzle(d1)
  }

  async listByDepartment(departmentId: string) {
    return this.db
      .select()
      .from(categories)
      .where(eq(categories.department_id, departmentId))
      .orderBy(asc(categories.sort_order))
  }

  async getById(id: string) {
    const [cat] = await this.db.select().from(categories).where(eq(categories.id, id)).limit(1)
    if (!cat) throw new NotFoundError('Category')
    return cat
  }

  async create(input: z.infer<typeof createCategorySchema>) {
    const id = generateId()
    const now = new Date().toISOString()

    await this.db.insert(categories).values({
      id,
      ...input,
      created_at: now,
      updated_at: now,
    })

    return this.getById(id)
  }

  async update(id: string, input: z.infer<typeof updateCategorySchema>) {
    await this.getById(id)
    const now = new Date().toISOString()

    await this.db
      .update(categories)
      .set({ ...input, updated_at: now })
      .where(eq(categories.id, id))

    return this.getById(id)
  }

  async delete(id: string) {
    await this.getById(id)
    await this.db.delete(categories).where(eq(categories.id, id))
  }

  async listActiveByDepartment(departmentId: string) {
    return this.db
      .select()
      .from(categories)
      .where(and(eq(categories.department_id, departmentId), eq(categories.is_active, true)))
      .orderBy(asc(categories.sort_order))
  }
}
