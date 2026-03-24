# Architecture Decisions

This document records key architectural and product decisions for the support application.

The goal is to:
- prevent decision drift
- make reasoning explicit
- support future refactoring
- help onboard contributors
- keep consistency across the system

Each decision includes:
- context
- decision
- rationale
- consequences

---

## Decision 001: Use Resend for both outbound and inbound email

### Context
The application requires:
- transactional email sending
- inbound email processing for ticket replies
- email threading support
- low operational complexity

Alternatives considered:
- Postmark (outbound + inbound)
- Mailgun (outbound + inbound)
- Cloudflare Email Routing + Workers (inbound) + separate sender

### Decision
Use Resend for:
- outbound email sending
- inbound email receiving (webhooks)

### Rationale
- single provider reduces complexity
- clean developer experience
- supports inbound parsing and webhook delivery
- sufficient free tier for early-stage usage
- avoids building custom email parsing infrastructure

### Consequences
- vendor dependency for email
- inbound + outbound share quota
- must implement robust webhook handling and validation

---

## Decision 002: Use tokenized reply addresses for email threading

### Context
Users must be able to reply to emails and have messages attach to the correct ticket.

### Decision
Use:
- `Reply-To: reply+<secure-token>@domain`

Primary matching:
1. token
2. `In-Reply-To`
3. `References`

### Rationale
- deterministic and reliable thread matching
- industry-standard pattern
- avoids ambiguity in subject-based matching

### Consequences
- must implement secure token generation and validation
- must handle malformed or missing tokens gracefully

---

## Decision 003: Cloudflare-first architecture

### Context
Need scalable, cost-efficient, and deployable infrastructure.

### Decision
Use:
- Cloudflare Workers for backend
- Cloudflare D1 for database
- Cloudflare R2 for storage (if needed)
- Cloudflare Pages for frontend

### Rationale
- unified ecosystem
- cost efficiency
- global edge performance
- simple deployment model

### Consequences
- SQLite-based constraints (D1)
- must design around limitations (e.g., transactions, concurrency patterns)
- vendor coupling

---

## Decision 004: Single-organization architecture (supersedes multi-tenancy)

### Context
The product serves a single organization, not multiple tenants.

### Decision
Build as a single-organization app. No tenant isolation, tenant-scoped schema, or multi-tenant API layer.

### Rationale
- simpler architecture matching actual use case
- avoids unnecessary complexity
- can be extended to multi-tenancy later if needed

### Consequences
- simpler queries and authorization
- no tenant isolation testing needed
- future multi-tenancy would require migration

---

## Decision 005: Category-driven workflow behavior

### Context
Different support cases require different behavior.

### Decision
Use categories to define:
- ticket behavior
- scheduling availability
- validation rules
- future workflow extensions

### Rationale
- flexible and scalable design
- avoids hardcoding logic in tickets
- aligns with real-world support systems

### Consequences
- category configuration becomes critical
- must validate category rules carefully

---

## Decision 006: Integrated scheduling (not standalone calendar)

### Context
Scheduling is required but only in relation to tickets.

### Decision
Implement scheduling as:
- a ticket-bound feature
- enabled/disabled per category

### Rationale
- keeps scope focused
- aligns with support workflows
- reduces complexity vs full calendar system

### Consequences
- scheduling logic tied to tickets
- must design extensibly for future calendar integrations

---

## Decision 007: Dynamic slot generation (no pre-generated slots)

### Context
Scheduling requires time slot availability.

### Decision
Do NOT store all future time slots.

Instead:
- generate slots dynamically from rules

### Rationale
- avoids massive data growth
- flexible rule updates
- easier to maintain

### Consequences
- requires efficient slot calculation logic
- must be well-tested
- performance considerations for large datasets

---

## Decision 008: Availability templates for scheduling

### Context
Scheduling rules need reuse and flexibility.

### Decision
Introduce reusable availability templates:
- categories reference templates
- templates define working hours, intervals, etc.

### Rationale
- reduces duplication
- easier admin management
- scalable configuration

### Consequences
- template system adds complexity
- must support overrides and exceptions

---

## Decision 009: Support multiple booking modes

### Context
Different workflows require different scheduling flows.

### Decision
Support:
1. customer self-book
2. agent proposes, customer confirms
3. internal scheduling only

### Rationale
- covers most real-world scenarios
- flexible per category

### Consequences
- more complex booking state machine
- requires clear UI flows
- requires strong validation and testing

---

## Decision 010: TDD-first for critical domain logic

### Context
System includes complex logic:
- scheduling rules
- email threading
- permissions
- tenant isolation

### Decision
Apply TDD-first for:
- domain services
- scheduling logic
- email matching
- permissions
- tenant isolation

### Rationale
- reduces bugs in critical paths
- enables safe refactoring
- improves long-term maintainability

### Consequences
- slower initial development
- requires discipline
- requires well-structured tests

---

## Decision 011: Layered testing strategy

### Context
Need balanced testing coverage.

### Decision
Use:
- unit tests for domain logic
- integration tests for API and DB
- limited E2E tests for core workflows

### Rationale
- efficient test coverage
- avoids over-reliance on slow E2E tests
- improves confidence

### Consequences
- must maintain multiple test layers
- requires clear test organization

---

## Decision 012: Treat email threading as a first-class system

### Context
Email is a primary interaction channel.

### Decision
Design email threading as a core subsystem:
- not an afterthought
- deeply integrated into tickets

### Rationale
- essential for support apps
- reduces inconsistencies
- improves user experience

### Consequences
- requires careful design
- requires strong testing
- must handle edge cases

---

## Decision 013: Internal audit-friendly timeline

### Context
Support systems require traceability.

### Decision
Implement a unified timeline for tickets:
- messages
- internal notes
- status changes
- booking events
- system events

### Rationale
- improves transparency
- simplifies debugging
- aligns with Zendesk-like expectations

### Consequences
- more complex event model
- must standardize event structure

---

## Decision 014: No external calendar sync in v1

### Context
External calendar integrations add complexity.

### Decision
Do NOT implement Google/Outlook sync in v1.

Support:
- internal scheduling
- email notifications
- optional ICS attachments

### Rationale
- reduces complexity
- faster time to market
- avoids OAuth and sync edge cases

### Consequences
- limited interoperability initially
- must design for future extension

---

## Decision 015: Production-ready mindset from start

### Context
The system is intended as a real SaaS product.

### Decision
Build with production readiness:
- proper validation
- security considerations
- structured APIs
- scalable design

### Rationale
- avoids rewrite later
- supports real users early
- aligns with SaaS goals

### Consequences
- higher upfront effort
- requires discipline in design and implementation

---

## Future decisions

This document should be updated when:

- introducing new major features
- changing core architecture
- replacing providers
- altering scheduling model
- changing email threading strategy
- modifying multi-tenancy approach

Each new decision should follow the same format.

---

## Final note

This document is a living artifact.

Do not delete or overwrite decisions.
Instead:
- append new decisions
- mark old ones as superseded if necessary
- keep reasoning visible

Clarity today prevents confusion tomorrow.