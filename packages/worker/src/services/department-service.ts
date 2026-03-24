import { eq, asc } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import { departments } from '../db/schema'
import { generateId } from '../lib/id'
import { NotFoundError } from '../lib/errors'
import type { z } from 'zod'
import type { createDepartmentSchema, updateDepartmentSchema } from '@support-app/shared'

export class DepartmentService {
  private db

  constructor(d1: D1Database) {
    this.db = drizzle(d1)
  }

  async list() {
    return this.db.select().from(departments).orderBy(asc(departments.sort_order))
  }

  async getById(id: string) {
    const [dept] = await this.db.select().from(departments).where(eq(departments.id, id)).limit(1)
    if (!dept) throw new NotFoundError('Department')
    return dept
  }

  async create(input: z.infer<typeof createDepartmentSchema>) {
    const id = generateId()
    const now = new Date().toISOString()

    await this.db.insert(departments).values({
      id,
      ...input,
      created_at: now,
      updated_at: now,
    })

    return this.getById(id)
  }

  async update(id: string, input: z.infer<typeof updateDepartmentSchema>) {
    await this.getById(id) // throws if not found
    const now = new Date().toISOString()

    await this.db
      .update(departments)
      .set({ ...input, updated_at: now })
      .where(eq(departments.id, id))

    return this.getById(id)
  }

  async delete(id: string) {
    await this.getById(id)
    await this.db.delete(departments).where(eq(departments.id, id))
  }

  async listActive() {
    return this.db
      .select()
      .from(departments)
      .where(eq(departments.is_active, true))
      .orderBy(asc(departments.sort_order))
  }
}
