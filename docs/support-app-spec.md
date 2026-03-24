# Support App Product Spec

## Overview

Build a production-ready, Zendesk-like support application for a single organization, with modern UX, email-threaded ticketing, and integrated ticket-based scheduling.

> **Note:** This is NOT a multi-tenant SaaS. It is a dedicated support app for one organization. There is no tenant isolation, tenant-aware schema, or multi-tenant API layer. References to "multi-tenancy" in other docs are superseded by this clarification.

This is not a toy demo and not just a proof of concept. It should be built as a solid foundation that can be extended later.

The product does not need to replicate Zendesk exactly. It should aim to provide the minimum practical value of a Zendesk-like support system, plus custom features such as category-based scheduling.

---

## Core product goals

The application should provide:

1. A public/support entry experience based on configurable department cards
2. Customer-facing ticket submission and ticket interaction
3. Internal admin/backend for departments, categories, tickets, agents, scheduling, and settings
4. Email-threaded support conversations
5. Optional scheduling/booking functionality that can be enabled or disabled per ticket category
6. Production-oriented architecture
7. Strong automated testing with TDD-first for critical domain logic

---

## Required stack

Use a Cloudflare-first architecture:

- Frontend: React + Vite + TypeScript
- Styling: Tailwind CSS
- Backend/API: Cloudflare Workers
- Database: Cloudflare D1
- Storage: Cloudflare R2 if attachments are required
- Email sending and inbound receiving: Resend
- Validation: strong schema validation everywhere
- Architecture: modular, scalable, production-oriented

Do not use Astro.

---

## Product structure

### Department-based support entry

The support landing page should consist of cards representing support departments.

Examples:
- Sales
- Billing
- Technical Support
- Onsite Support
- General Inquiry

Each department card should support:
- title
- description
- icon
- sort order
- active/inactive state
- optional CTA text

Requirements:
- departments are manageable in the admin backend
- admin can create, update, reorder, enable/disable, and delete departments
- clicking a department leads the user into the ticket creation flow for that department

### Ticket categories

Each department can contain multiple categories.

Examples:
- Technical Support
  - Bug Report
  - Login Issue
  - Device Issue
  - Onsite Visit Request
- Sales
  - Product Demo
  - Pricing Question

Categories are the main driver of ticket workflow behavior.

Each category should support configurable behavior such as:
- scheduling enabled/disabled
- attachments allowed
- priority required
- custom form fields
- SLA placeholder
- auto-assignment placeholder
- customer portal visibility if needed

Requirements:
- category CRUD in admin backend
- each category belongs to a department
- category behavior should affect ticket form and workflow

---

## Ticketing system

Implement a Zendesk-like ticketing system.

### Ticket features

Support:
- ticket creation
- ticket status management
- priority
- internal notes
- public replies
- assignee
- department/category association
- tags
- search/filter/sort
- attachments
- timeline/history
- audit-friendly activity feed

Suggested statuses:
- New
- Open
- Pending
- Waiting on Customer
- Scheduled
- Resolved
- Closed

Suggested ticket fields:
- id
- human-readable ticket number
- subject
- description
- requester/customer
- department_id
- category_id
- status
- priority
- assignee_id
- channel
- created_at
- updated_at
- email thread metadata
- scheduling metadata if applicable

---

## Email-threaded support conversations

Implement robust email threading.

### Requirements

- outbound emails sent via Resend
- inbound replies received via Resend inbound webhook
- customers should be able to reply to ticket-related emails without exposing agent personal email addresses
- use tokenized reply addressing

Recommended pattern:
- From: support@yourdomain.com
- Reply-To: reply+<secure-thread-token>@yourdomain.com

Incoming email should be matched using:
1. secure token in recipient address
2. fallback to `In-Reply-To`
3. fallback to `References`

Store enough metadata for debugging and auditing:
- raw message id
- headers needed for threading
- sender
- recipient
- subject
- timestamps
- webhook payload reference if useful

Support:
- inbound attachments
- duplicate detection where practical
- timeline rendering of inbound/outbound messages
- distinction between:
  - public messages
  - internal notes
  - system events

Initial implementation should include:
- secure reply token strategy
- message threading
- malformed inbound handling
- quoted content trimming strategy placeholder or initial implementation

---

## Customer-facing experience

The customer-facing flow should let users:

- choose a department
- choose a category
- submit a ticket
- upload attachments if allowed
- receive confirmation emails
- access the ticket conversation through secure portal/auth flow
- reply via portal and via email
- interact with booking/scheduling when enabled for the category

This may be implemented with:
- secure ticket access links
- or customer accounts
- or both

Architecture should remain extensible.

---

## Internal admin/backend

Build an internal backend/admin area with:

- dashboard
- department management
- category management
- ticket list
- ticket detail/timeline
- scheduling settings
- system settings
- message metadata visibility
- audit trail visibility
- user/agent management placeholder or initial implementation

Capabilities:
- CRUD departments
- CRUD categories
- enable/disable scheduling per category
- assign tickets
- change ticket status and priority
- add internal notes
- manage bookings for relevant tickets
- inspect email threading metadata

---

## Integrated ticket scheduling

This is not a full standalone calendar product.

It is a ticket-integrated scheduling module that can be enabled or disabled per category.

### Core concept

If scheduling is enabled for a category, tickets in that category can include booking functionality tied to that ticket.

Examples:
- Product Demo -> customer self-books demo time
- Onsite Visit Request -> agent proposes or confirms slot
- Billing Issue -> no scheduling

### Scheduling modes

Support at least:

1. Customer self-book
   - customer sees available slots and books one

2. Agent proposes, customer confirms
   - agent proposes one or more slots
   - customer selects one

3. Internal scheduling only
   - staff books internally
   - customer is notified

Mode should be configurable per category.

### Category-level scheduling configuration

Each category should support:
- scheduling_enabled
- booking_mode
- slot_duration
- interval_step
- availability_template_id
- minimum_notice_time
- maximum_booking_window
- buffer_before
- buffer_after
- max_bookings_per_slot
- timezone strategy
- cancellation/reschedule policy placeholder
- location or meeting type placeholder

### Availability templates

Implement reusable admin-configurable availability templates.

Examples:
- weekdays 09:00–12:00 and 13:00–17:00
- 30-minute slots
- weekends blocked

Requirements:
- admin can create, edit, delete templates
- categories can reference a template
- support weekday rules
- support multiple daily windows
- support slot duration and interval
- support blackout dates/exceptions
- support blocked dates and basic holiday handling

### Slot generation

Do not pre-generate all future slots in the database.

Use dynamic slot generation based on:
- availability template
- category rules
- existing bookings
- blackout dates
- booking window rules
- optional resource assignment

Persist:
- templates and rules
- exceptions
- actual bookings
- booking history

### Ticket-bound booking records

Each ticket with scheduling should have booking data and history.

Booking data should support:
- status
- booking mode
- proposed slots
- selected slot
- scheduled start/end
- timezone
- resource/assignee if applicable
- confirmed timestamp
- cancelled timestamp
- reschedule history
- notes/system events

Suggested booking statuses:
- Not Scheduled
- Awaiting Selection
- Proposed
- Scheduled
- Rescheduled
- Cancelled
- Completed

### Scheduling UI

Customer-facing:
- view available slots
- timezone-aware slot display
- choose / confirm / reschedule / cancel when permitted

Admin/agent-facing:
- configure scheduling behavior by category
- manage availability templates
- propose and confirm slots
- reschedule and cancel bookings
- view booking history
- optional list/calendar-style booking view

### External calendar integrations

Do not build full Google Calendar / Outlook sync in v1.

Support in v1:
- internal booking records
- email confirmations
- ICS invite generation if practical

Architecture should allow future integrations later.

---

## Authentication and roles

Support at least:
- super admin
- admin
- agent
- customer/requester

Roles should govern access to:
- system administration
- departments/categories
- tickets
- internal notes
- scheduling settings
- booking actions
- customer scope

Use secure production-ready auth/session patterns.

---

## Single-organization scope

This application serves a single organization. There is no multi-tenancy layer.

All data (departments, categories, tickets, users, templates, bookings, settings) belongs to the one organization operating the app.

If multi-tenancy is needed in the future, it can be added as a later extension.

---

## Database design

Design a production-oriented D1 schema for entities such as:
- users
- roles or membership roles
- departments
- categories
- custom fields if included
- tickets
- ticket_messages
- attachments
- ticket_events
- email_threads or equivalent metadata
- availability_templates
- availability_rules
- availability_exceptions
- ticket_bookings
- booking_history
- settings

Use practical indexing and constraints suitable for D1/SQLite.

---

## API design

Create clean modular APIs for:
- auth
- departments
- categories
- tickets
- ticket messages
- attachments
- scheduling templates
- slot availability
- bookings
- inbound email webhook
- outbound email trigger flows

Requirements:
- validation everywhere
- structured errors
- secure webhook verification
- clear authorization boundaries

---

## Notifications and email

Implement notification flows for:
- ticket created
- ticket reply received
- ticket status changed
- booking proposed
- booking confirmed
- booking rescheduled
- booking cancelled
- reminder placeholder or initial implementation

Keep ticket email threading intact when sending emails.

---

## UI/UX expectations

Build a polished SaaS UI:
- modern and clean
- responsive
- strong information hierarchy
- strong empty states
- good forms
- useful loading and error states
- accessible interactions where practical

Avoid toy/demo styling.

---

## Security and production readiness

Treat this as production-ready software.

Include:
- secure auth/session handling
- input validation
- output safety
- role-based authorization
- webhook verification
- logging/error handling
- environment variable management
- migrations
- seed/demo data
- auditability

Include placeholders or initial implementation for:
- rate limiting
- observability
- abuse protection

---

## Testing strategy

Use a TDD-first approach for critical domain and integration logic.

### Testing philosophy

Apply strict TDD for fragile, business-critical, and rules-heavy areas.

Use lighter test coverage for low-risk presentational UI.

### TDD-first areas

Write tests before implementation for:
- ticket state transitions
- role/permission checks
- email thread matching
- inbound webhook handling
- duplicate inbound detection
- scheduling rules
- slot generation
- booking confirmation/reschedule/cancel behavior
- validation of critical APIs

### Test layers

#### Unit tests
Focus on:
- domain services
- scheduling calculation logic
- thread token parsing
- thread matching
- permission rules
- ticket workflow rules
- booking workflow rules

#### Integration tests
Focus on:
- API + D1 interactions
- webhook ingestion
- email threading persistence
- booking creation and status changes
- role-scoped access
- attachment metadata flow
- availability lookup

#### End-to-end tests
Create a small but strong set of E2E tests for critical journeys:
- create ticket from customer flow
- agent replies
- inbound email reply attaches to correct ticket
- customer self-books a slot
- agent proposes slots and customer confirms
- reschedule booking
- role-based access control enforcement

### Testing expectations

- include meaningful fixtures/seed data
- avoid brittle tests where possible
- keep test structure clear
- prefer deterministic test data
- ensure critical business rules are well-covered

---

## Developer experience

Provide:
- clean project structure
- setup instructions
- README
- environment variables example
- migration/setup scripts
- seed data
- explanation of architecture choices
- testing instructions

---

## Deliverables

Generate:
1. full project structure
2. schema and migrations
3. backend/API implementation
4. frontend implementation
5. internal admin/backend UI
6. customer-facing ticket flows
7. Resend outbound + inbound integration
8. integrated scheduling module
9. tests with TDD-first emphasis
10. documentation

---

## Nice-to-have if practical

If practical, also include:
- saved ticket views/filters
- canned responses placeholder
- SLA placeholder
- ICS generation for booking events
- basic analytics/admin dashboard placeholder
- richer audit timeline details

---

## Final expectation

Produce a production-ready foundation for a Zendesk-like support SaaS with:
- department cards
- category-driven ticket workflows
- threaded email support
- integrated ticket scheduling enabled per category
- Cloudflare-first architecture
- Resend for outbound and inbound
- strong TDD-first coverage for critical logic