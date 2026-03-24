Build a production-ready, organization-dedicated Zendesk-like support app with integrated ticket-based scheduling.

> **Note:** This is a single-organization app, NOT a multi-tenant SaaS. No tenant isolation, tenant-scoped schema, or multi-tenant API layer is needed.

## Stack
- React + Vite + TypeScript
- Tailwind CSS
- Cloudflare Workers backend
- Cloudflare D1 database
- Cloudflare R2 for attachments if needed
- Resend for outbound and inbound email
- Strong schema validation
- Clean modular architecture

Do not use Astro.

## Product requirements

### Core product
Build a support app with:
- public support entry page using configurable department cards
- ticket categories under departments
- customer ticket submission and replies
- internal admin/backend
- email-threaded ticket conversations
- category-based scheduling/booking integrated into tickets
- proper multi-tenancy

### Departments and categories
Admin can manage departments and categories.

Departments:
- title
- description
- icon
- sort order
- active/inactive

Categories belong to departments and drive ticket behavior:
- scheduling enabled/disabled
- attachments allowed
- priority required
- custom fields placeholder
- SLA/assignment placeholders

### Ticketing
Implement:
- ticket creation
- statuses
- priority
- assignee
- internal notes
- public replies
- tags
- attachments
- searchable/filterable list
- audit-friendly timeline

Suggested statuses:
- New
- Open
- Pending
- Waiting on Customer
- Scheduled
- Resolved
- Closed

### Email threading
Implement robust email threading with Resend.

Use:
- From: support@yourdomain.com
- Reply-To: reply+<secure-thread-token>@yourdomain.com

Inbound matching priority:
1. tokenized reply address
2. In-Reply-To
3. References

Support:
- inbound attachments
- duplicate detection where practical
- raw metadata storage for auditing/debugging
- public messages vs internal notes vs system events

### Customer-facing flow
Customer can:
- choose department
- choose category
- create ticket
- upload attachments if allowed
- access ticket securely
- reply via portal and email
- book or manage appointment if scheduling is enabled

### Internal backend
Admin/agents can:
- manage departments
- manage categories
- view and manage tickets
- assign tickets
- change status and priority
- add internal notes
- inspect message metadata
- manage scheduling for relevant tickets

## Integrated scheduling
This is not a standalone calendar app. It is a ticket-integrated scheduling module.

Scheduling is configurable per category.

Support booking modes:
1. customer self-book
2. agent proposes, customer confirms
3. internal scheduling only

Per-category scheduling settings:
- scheduling enabled
- booking mode
- slot duration
- interval step
- availability template
- minimum notice time
- maximum booking window
- buffer before/after
- max bookings per slot
- timezone strategy

Implement reusable availability templates:
- weekday rules
- multiple time windows per day
- slot duration and interval
- blackout dates/exceptions

Do not pre-generate future slots in the database.
Generate slots dynamically from:
- template rules
- existing bookings
- blackout dates
- category constraints

Persist:
- templates/rules
- exceptions
- actual bookings
- booking history

Booking statuses may include:
- Not Scheduled
- Awaiting Selection
- Proposed
- Scheduled
- Rescheduled
- Cancelled
- Completed

Customer UI:
- timezone-aware slot display
- book / confirm / reschedule / cancel when allowed

Admin/agent UI:
- configure scheduling by category
- manage templates
- propose/confirm/reschedule/cancel bookings
- view booking history
- optional list/calendar-style bookings view

Do not implement full Google/Outlook sync in v1.
Internal scheduling plus email confirmation and optional ICS support is enough.

## Auth, roles, and tenancy
Support at minimum:
- super admin
- admin
- agent
- customer

This is a single-organization app. No multi-tenancy layer is needed.

## Database/API
Design a production-oriented schema for:
- users
- departments
- categories
- tickets
- ticket_messages
- attachments
- ticket_events
- email metadata/threading
- availability_templates
- availability_rules
- availability_exceptions
- ticket_bookings
- booking_history
- settings

Create modular APIs for:
- auth
- departments
- categories
- tickets
- messages
- attachments
- scheduling templates
- availability lookup
- bookings
- inbound email webhook

## Notifications
Support email notifications for:
- ticket created
- ticket reply received
- ticket status changed
- booking proposed
- booking confirmed
- booking rescheduled
- booking cancelled

## Testing
Use TDD-first for critical logic.

Write tests before implementation for:
- role/permission checks
- ticket state transitions
- email thread matching
- inbound webhook handling
- scheduling rules
- slot generation
- booking confirm/reschedule/cancel flows

Include:
- unit tests for domain logic
- integration tests for API + DB + webhooks
- a small set of E2E tests for critical journeys

Critical E2E flows:
- create ticket
- reply by email
- agent reply flow
- customer self-books
- agent proposes and customer confirms
- role-based access control scenario

## Deliverables
Generate:
- full project structure
- schema and migrations
- backend/API
- frontend
- admin/backend UI
- customer flows
- Resend outbound + inbound integration
- integrated scheduling module
- tests
- seed data
- README and setup docs

Make reasonable decisions without unnecessary clarification.
Prioritize production-ready structure, clean architecture, and strong test coverage for core logic.