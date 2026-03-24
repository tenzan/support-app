import { eq, and, gte, lte } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import {
  categories,
  availabilityTemplates,
  availabilityRules,
  availabilityExceptions,
  ticketBookings,
} from '../db/schema'
import { NotFoundError, AppError } from '../lib/errors'
import { generateSlots, type SlotGenerationInput } from '@support-app/shared'

export class SlotService {
  private db

  constructor(d1: D1Database) {
    this.db = drizzle(d1)
  }

  async getAvailableSlots(input: {
    category_id: string
    date_from: string
    date_to: string
    timezone?: string
  }) {
    // 1. Load category
    const [category] = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, input.category_id))
      .limit(1)

    if (!category) throw new NotFoundError('Category')
    if (!category.scheduling_enabled) {
      throw new AppError('SCHEDULING_DISABLED', 'Scheduling is not enabled for this category')
    }
    if (!category.availability_template_id) {
      throw new AppError('NO_TEMPLATE', 'No availability template configured for this category')
    }

    // 2. Load template, rules, exceptions
    const [template] = await this.db
      .select()
      .from(availabilityTemplates)
      .where(eq(availabilityTemplates.id, category.availability_template_id))
      .limit(1)

    if (!template) throw new NotFoundError('Availability template')

    const rules = await this.db
      .select()
      .from(availabilityRules)
      .where(eq(availabilityRules.template_id, template.id))

    const exceptions = await this.db
      .select()
      .from(availabilityExceptions)
      .where(eq(availabilityExceptions.template_id, template.id))

    // 3. Load existing bookings in date range
    const existingBookings = await this.db
      .select({
        start: ticketBookings.selected_slot_start,
        end: ticketBookings.selected_slot_end,
      })
      .from(ticketBookings)
      .where(
        and(
          gte(ticketBookings.selected_slot_start, input.date_from),
          lte(ticketBookings.selected_slot_start, input.date_to + 'T23:59:59Z'),
          // Only count active bookings
          eq(ticketBookings.status, 'scheduled'),
        ),
      )

    // 4. Generate slots using shared domain logic
    const slotInput: SlotGenerationInput = {
      rules: rules.map((r) => ({
        weekday: r.weekday as any,
        start_time: r.start_time,
        end_time: r.end_time,
      })),
      exceptions: exceptions.map((e) => ({
        date: e.date,
        is_blocked: e.is_blocked,
        start_time: e.start_time,
        end_time: e.end_time,
      })),
      existingBookings: existingBookings
        .filter((b) => b.start && b.end)
        .map((b) => ({
          start: b.start!,
          end: b.end!,
        })),
      slotDurationMinutes: category.slot_duration_minutes ?? 30,
      intervalStepMinutes: category.interval_step_minutes ?? 30,
      dateFrom: input.date_from,
      dateTo: input.date_to,
      timezone: input.timezone ?? category.timezone ?? template.timezone,
      minimumNoticeMinutes: category.minimum_notice_minutes ?? 0,
      maximumBookingWindowDays: category.maximum_booking_window_days,
      bufferBeforeMinutes: category.buffer_before_minutes ?? 0,
      bufferAfterMinutes: category.buffer_after_minutes ?? 0,
      maxBookingsPerSlot: category.max_bookings_per_slot ?? 1,
      now: new Date(),
    }

    return generateSlots(slotInput)
  }
}
