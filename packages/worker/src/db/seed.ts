import { drizzle } from 'drizzle-orm/d1'
import {
  users,
  departments,
  categories,
  tickets,
  ticketMessages,
  ticketEvents,
  availabilityTemplates,
  availabilityRules,
  tags,
} from './schema'

/**
 * Seeds the database with sample data for development.
 * Run via: wrangler d1 execute support-db --local --file=seed.sql
 * Or call this function from a worker route during development.
 */
export async function seed(d1: D1Database) {
  const db = drizzle(d1)

  // --- Users ---
  const superAdminId = '00000000-0000-0000-0000-000000000001'
  const adminId = '00000000-0000-0000-0000-000000000002'
  const agentId = '00000000-0000-0000-0000-000000000003'
  const customerId = '00000000-0000-0000-0000-000000000004'

  // Password: "password123" — PBKDF2 hashed (for dev only)
  // In production, use the AuthService.createUser method
  await db.insert(users).values([
    {
      id: superAdminId,
      email: 'superadmin@example.com',
      name: 'Super Admin',
      password_hash: 'dev-seed-hash', // replaced by setup script
      role: 'super_admin',
    },
    {
      id: adminId,
      email: 'admin@example.com',
      name: 'Admin User',
      password_hash: 'dev-seed-hash',
      role: 'admin',
    },
    {
      id: agentId,
      email: 'agent@example.com',
      name: 'Support Agent',
      password_hash: 'dev-seed-hash',
      role: 'agent',
    },
    {
      id: customerId,
      email: 'customer@example.com',
      name: 'Jane Customer',
      password_hash: 'dev-seed-hash',
      role: 'customer',
    },
  ])

  // --- Departments ---
  const techSupportId = '10000000-0000-0000-0000-000000000001'
  const salesId = '10000000-0000-0000-0000-000000000002'
  const billingId = '10000000-0000-0000-0000-000000000003'
  const generalId = '10000000-0000-0000-0000-000000000004'

  await db.insert(departments).values([
    {
      id: techSupportId,
      name: 'Technical Support',
      description: 'Get help with technical issues, bugs, and product questions.',
      icon: 'wrench',
      sort_order: 0,
      is_active: true,
      cta_text: 'Get Tech Help',
    },
    {
      id: salesId,
      name: 'Sales',
      description: 'Product demos, pricing, and purchasing inquiries.',
      icon: 'shopping-cart',
      sort_order: 1,
      is_active: true,
      cta_text: 'Contact Sales',
    },
    {
      id: billingId,
      name: 'Billing',
      description: 'Invoice questions, payment issues, and subscription management.',
      icon: 'credit-card',
      sort_order: 2,
      is_active: true,
      cta_text: 'Billing Help',
    },
    {
      id: generalId,
      name: 'General Inquiry',
      description: 'Any other questions or feedback.',
      icon: 'message-circle',
      sort_order: 3,
      is_active: true,
    },
  ])

  // --- Categories ---
  const bugReportId = '20000000-0000-0000-0000-000000000001'
  const loginIssueId = '20000000-0000-0000-0000-000000000002'
  const onsiteVisitId = '20000000-0000-0000-0000-000000000003'
  const productDemoId = '20000000-0000-0000-0000-000000000004'
  const pricingId = '20000000-0000-0000-0000-000000000005'
  const invoiceId = '20000000-0000-0000-0000-000000000006'
  const feedbackId = '20000000-0000-0000-0000-000000000007'

  // Availability template for scheduling categories
  const businessHoursId = '30000000-0000-0000-0000-000000000001'

  await db.insert(availabilityTemplates).values([
    {
      id: businessHoursId,
      name: 'Business Hours',
      description: 'Standard weekday business hours',
      timezone: 'UTC',
    },
  ])

  // Mon-Fri 09:00-12:00, 13:00-17:00
  const ruleValues = []
  for (let day = 0; day <= 4; day++) {
    ruleValues.push(
      {
        id: `40000000-0000-0000-0000-00000000${day.toString().padStart(2, '0')}01`,
        template_id: businessHoursId,
        weekday: day,
        start_time: '09:00',
        end_time: '12:00',
      },
      {
        id: `40000000-0000-0000-0000-00000000${day.toString().padStart(2, '0')}02`,
        template_id: businessHoursId,
        weekday: day,
        start_time: '13:00',
        end_time: '17:00',
      },
    )
  }
  await db.insert(availabilityRules).values(ruleValues)

  await db.insert(categories).values([
    {
      id: bugReportId,
      department_id: techSupportId,
      name: 'Bug Report',
      description: 'Report a bug or unexpected behavior.',
      sort_order: 0,
      attachments_allowed: true,
      priority_required: true,
    },
    {
      id: loginIssueId,
      department_id: techSupportId,
      name: 'Login Issue',
      description: 'Problems signing in or accessing your account.',
      sort_order: 1,
      priority_required: true,
    },
    {
      id: onsiteVisitId,
      department_id: techSupportId,
      name: 'Onsite Visit Request',
      description: 'Request an onsite technician visit.',
      sort_order: 2,
      scheduling_enabled: true,
      booking_mode: 'agent_propose',
      slot_duration_minutes: 60,
      interval_step_minutes: 60,
      availability_template_id: businessHoursId,
      minimum_notice_minutes: 1440, // 24 hours
      maximum_booking_window_days: 30,
      buffer_before_minutes: 30,
      buffer_after_minutes: 30,
      max_bookings_per_slot: 1,
      timezone: 'UTC',
    },
    {
      id: productDemoId,
      department_id: salesId,
      name: 'Product Demo',
      description: 'Schedule a product demonstration.',
      sort_order: 0,
      scheduling_enabled: true,
      booking_mode: 'customer_self_book',
      slot_duration_minutes: 30,
      interval_step_minutes: 30,
      availability_template_id: businessHoursId,
      minimum_notice_minutes: 120, // 2 hours
      maximum_booking_window_days: 14,
      max_bookings_per_slot: 1,
      timezone: 'UTC',
    },
    {
      id: pricingId,
      department_id: salesId,
      name: 'Pricing Question',
      description: 'Questions about pricing and plans.',
      sort_order: 1,
    },
    {
      id: invoiceId,
      department_id: billingId,
      name: 'Invoice Issue',
      description: 'Questions about invoices and charges.',
      sort_order: 0,
    },
    {
      id: feedbackId,
      department_id: generalId,
      name: 'Feedback',
      description: 'Share your feedback or suggestions.',
      sort_order: 0,
    },
  ])

  // --- Tags ---
  await db.insert(tags).values([
    { id: '50000000-0000-0000-0000-000000000001', name: 'urgent' },
    { id: '50000000-0000-0000-0000-000000000002', name: 'bug' },
    { id: '50000000-0000-0000-0000-000000000003', name: 'feature-request' },
    { id: '50000000-0000-0000-0000-000000000004', name: 'billing' },
    { id: '50000000-0000-0000-0000-000000000005', name: 'documentation' },
  ])

  // --- Sample Tickets ---
  const ticket1Id = '60000000-0000-0000-0000-000000000001'
  const ticket2Id = '60000000-0000-0000-0000-000000000002'
  const now = new Date().toISOString()

  await db.insert(tickets).values([
    {
      id: ticket1Id,
      ticket_number: 'SUP-00001',
      subject: 'Cannot login to dashboard',
      description: 'Getting a 403 error when trying to access the admin dashboard after logging in.',
      status: 'open',
      priority: 'high',
      channel: 'web',
      department_id: techSupportId,
      category_id: loginIssueId,
      requester_id: customerId,
      assignee_id: agentId,
      created_at: now,
      updated_at: now,
    },
    {
      id: ticket2Id,
      ticket_number: 'SUP-00002',
      subject: 'Request a product demo',
      description: 'We are interested in seeing a demo of your enterprise plan features.',
      status: 'new',
      priority: 'medium',
      channel: 'web',
      department_id: salesId,
      category_id: productDemoId,
      requester_id: customerId,
      created_at: now,
      updated_at: now,
    },
  ])

  await db.insert(ticketMessages).values([
    {
      id: '70000000-0000-0000-0000-000000000001',
      ticket_id: ticket1Id,
      sender_id: customerId,
      message_type: 'public',
      body: 'Getting a 403 error when trying to access the admin dashboard after logging in.',
      created_at: now,
    },
    {
      id: '70000000-0000-0000-0000-000000000002',
      ticket_id: ticket1Id,
      sender_id: agentId,
      message_type: 'public',
      body: 'Thanks for reporting this. Could you try clearing your browser cache and logging in again?',
      created_at: new Date(Date.now() + 3600000).toISOString(),
    },
    {
      id: '70000000-0000-0000-0000-000000000003',
      ticket_id: ticket1Id,
      sender_id: agentId,
      message_type: 'internal_note',
      body: 'Looks like a permissions issue. Checking the role assignments.',
      created_at: new Date(Date.now() + 3700000).toISOString(),
    },
    {
      id: '70000000-0000-0000-0000-000000000004',
      ticket_id: ticket2Id,
      sender_id: customerId,
      message_type: 'public',
      body: 'We are interested in seeing a demo of your enterprise plan features.',
      created_at: now,
    },
  ])

  await db.insert(ticketEvents).values([
    {
      id: '80000000-0000-0000-0000-000000000001',
      ticket_id: ticket1Id,
      actor_id: customerId,
      event_type: 'status_change',
      old_value: null,
      new_value: 'new',
      created_at: now,
    },
    {
      id: '80000000-0000-0000-0000-000000000002',
      ticket_id: ticket1Id,
      actor_id: agentId,
      event_type: 'status_change',
      old_value: 'new',
      new_value: 'open',
      created_at: new Date(Date.now() + 3600000).toISOString(),
    },
    {
      id: '80000000-0000-0000-0000-000000000003',
      ticket_id: ticket1Id,
      actor_id: adminId,
      event_type: 'assignment',
      old_value: null,
      new_value: agentId,
      created_at: new Date(Date.now() + 1800000).toISOString(),
    },
  ])

  return { message: 'Database seeded successfully' }
}
