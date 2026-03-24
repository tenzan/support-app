# Testing Strategy

## Purpose

This document defines the testing strategy for the support application.

The goal is to ensure the system is reliable, maintainable, and safe to evolve, especially in areas with high business risk such as ticket workflows, email threading, scheduling, and permissions.

This project uses a **TDD-first approach for critical domain and integration logic**, while keeping lower-risk UI testing pragmatic.

---

## Testing principles

### 1. Test business-critical logic first
The most important behaviors in this product are not visual. They are the rules that determine:

- who can access what
- how tickets move through states
- how replies are attached to threads
- how scheduling rules generate slots
- how bookings are confirmed, rescheduled, or cancelled
These areas should be implemented with tests written before or alongside production code.

### 2. Prefer confidence over coverage vanity
We do not optimize for a large but meaningless coverage number.

We optimize for:
- confidence in critical behavior
- safe refactoring
- early bug detection
- readable tests
- deterministic results

### 3. Test at the right level
Not every behavior needs an end-to-end test.

Use:
- **unit tests** for isolated business rules
- **integration tests** for API, database, and webhook flows
- **end-to-end tests** for core user journeys

### 4. Keep tests deterministic
Avoid flaky tests.

Prefer:
- fixed fixtures
- controlled clocks/timestamps where possible
- explicit setup
- stable assertions

### 5. Treat tests as product documentation
Tests should clearly express business intent.

A good test should help answer:
- what behavior is expected
- under what conditions
- what must never break

---

## Test pyramid

This project should broadly follow this test mix:

- many **unit tests**
- a good set of **integration tests**
- a smaller number of **E2E tests**

### Unit tests
Fast, isolated, and focused on domain logic.

### Integration tests
Validate that modules work together correctly:
- API + DB
- webhook + parsing + persistence
- booking services + slot generation + state changes

### End-to-end tests
Validate the most important real user workflows.

---

## TDD-first scope

TDD-first is required for the following areas.

### 1. Role and permission rules
Write tests first for:
- super admin permissions
- admin permissions
- agent permissions
- customer/requester permissions
- internal note visibility
- scheduling management rights

Examples:
- customers cannot see internal notes
- agents can update assigned tickets depending on policy
- only allowed roles can edit category scheduling rules

### 2. Ticket workflow rules
Write tests first for:
- valid status transitions
- invalid transitions
- ticket assignment behavior
- timeline event generation
- public reply vs internal note handling

Examples:
- closed tickets cannot accept certain actions unless reopened
- changing status to resolved creates an audit event
- internal note does not trigger customer notification

### 3. Email thread matching
Write tests first for:
- reply token extraction from inbound recipient
- secure token validation
- matching by `In-Reply-To`
- matching by `References`
- duplicate message detection
- malformed inbound payload handling

Examples:
- inbound email with valid reply token attaches to correct ticket
- duplicate inbound event is ignored safely
- unmatched inbound email is rejected or quarantined by defined behavior

### 4. Inbound webhook handling
Write tests first for:
- webhook signature verification
- payload validation
- attachment metadata handling
- message persistence
- failure behavior

Examples:
- invalid webhook signature returns rejection
- missing required payload fields returns safe error
- attachment metadata is persisted and linked correctly

### 5. Scheduling rules and slot generation
Write tests first for:
- availability template evaluation
- slot duration handling
- interval stepping
- blackout dates
- notice periods
- maximum booking window
- buffers before/after
- max bookings per slot

Examples:
- a 30-minute slot template produces expected slots
- blocked dates yield no slots
- bookings inside minimum notice window are excluded
- existing bookings reduce or eliminate availability correctly

### 6. Booking workflow
Write tests first for:
- customer self-book flow
- agent propose/customer confirm flow
- internal scheduling only flow
- reschedule flow
- cancellation flow
- booking history creation
- ticket status side effects where defined

Examples:
- customer selects valid slot and booking becomes scheduled
- rescheduling preserves history
- cancelled booking cannot be confirmed without defined recovery path

### 7. API validation for critical endpoints
Write tests first for:
- ticket creation validation
- category scheduling validation
- availability lookup input validation
- booking action validation
- inbound email webhook validation

Examples:
- invalid category ID is rejected
- disabled scheduling category cannot accept booking requests
- invalid timezone input is rejected if timezone validation is enforced

---

## Unit testing strategy

Unit tests should target pure or near-pure logic.

### Primary targets
- permission evaluators
- ticket state transition logic
- thread token generation and parsing
- email matching logic
- scheduling calculators
- slot generation services
- booking state rules
- validation schemas where useful

### Unit test expectations
- fast execution
- no network dependency
- minimal or no DB dependency
- deterministic inputs and outputs
- focused assertions

### Examples of unit test subjects
- `canUserViewTicket()`
- `canUserManageCategoryScheduling()`
- `getNextValidTicketStatuses()`
- `parseReplyTokenFromEmail()`
- `matchInboundEmailToThread()`
- `generateAvailableSlots()`
- `validateBookingTransition()`

---

## Integration testing strategy

Integration tests should verify module interactions and persistence behavior.

### Primary targets
- API routes with D1
- auth/session integration
- ticket creation flow
- message persistence flow
- inbound webhook ingestion
- attachment metadata persistence
- scheduling template CRUD + slot lookup
- booking creation/reschedule/cancel flows

### Integration test expectations
- exercise realistic app boundaries
- verify authorization and validation
- verify DB persistence and retrieval
- avoid external network calls where possible by mocking provider boundaries

### Integration scenarios
- create ticket and verify persistence
- add public reply and verify ticket timeline
- add internal note and ensure no customer-visible message created
- receive inbound email webhook and attach message
- compute available slots and create booking
- reject booking when scheduling disabled for category

---

## End-to-end testing strategy

E2E tests should cover only the most critical workflows.

### Required E2E scenarios

#### 1. Customer creates a ticket
- customer opens support entry page
- selects department
- selects category
- submits ticket
- receives success confirmation
- ticket appears in backend

#### 2. Agent manages a ticket
- agent opens ticket
- adds internal note
- sends public reply
- changes status
- timeline reflects all actions correctly

#### 3. Inbound email reply attaches to correct ticket
- system has existing ticket thread
- inbound reply is received
- message appears on correct ticket
- duplicate event does not create duplicate message

#### 4. Customer self-books an appointment
- category has scheduling enabled in self-book mode
- customer sees available slots
- customer books a valid slot
- booking is shown in ticket timeline and booking view

#### 5. Agent proposes, customer confirms
- agent proposes slot(s)
- customer selects one
- booking becomes scheduled
- history is preserved

#### 6. Reschedule and cancel flow
- existing booking is rescheduled
- prior booking record/history preserved
- cancellation behaves correctly

### E2E expectations
- cover business-critical paths only
- avoid broad UI over-testing
- keep selectors stable
- keep flows deterministic

---

## UI testing strategy

UI tests should be pragmatic.

### Test directly only when behavior matters
Prefer testing UI when it includes meaningful logic such as:
- role-based visibility
- form validation behavior
- state-dependent actions
- scheduling interaction flows

### Do not over-test presentational details
Avoid excessive tests for:
- static styling
- purely visual composition
- low-risk layout details

Use component tests sparingly and only where they provide clear value.

---

## External dependency strategy

External providers should not dominate test behavior.

### Resend
Do not depend on live Resend calls in normal automated tests.

Instead:
- mock outbound email sending boundaries
- simulate inbound webhook payloads
- verify internal processing and persistence

### Cloudflare/D1/R2
Use local or test-friendly environments where possible.
Abstract file and provider interactions enough to test core logic safely.

---

## Test data and fixtures

Use clear, reusable fixtures for:
- users by role
- departments
- categories
- tickets
- ticket messages
- availability templates
- blackout dates
- bookings

### Fixture rules
- keep fixtures small and readable
- prefer explicit builders/factories
- avoid hidden magic setup
Recommended approach:
- factory/builders for domain objects
- helper functions for authenticated test contexts
- stable IDs where useful for clarity

---

## Time and timezone testing

Because scheduling is time-sensitive, time handling must be tested carefully.

### Requirements
- use controlled/frozen time where practical
- test minimum notice windows
- test booking horizon rules
- test timezone-aware display or conversion logic where applicable
- test daylight-saving-sensitive scenarios if relevant to supported markets

Even if the first version is simple, do not leave core scheduling logic untested around time boundaries.

---

## Definition of done for new features

A feature is not complete unless:

1. critical business logic is covered by tests
2. API validation and authorization are tested
3. regression risk is addressed
5. documentation is updated if behavior changed

For fragile or rules-heavy features, implementation should begin with tests.

---

## Minimum quality gates

At minimum, every major PR should ensure:

- unit tests pass
- integration tests pass
- critical E2E tests pass
- no known permission regression

If time is limited, protect critical paths first, not cosmetic coverage.

---

## Suggested test organization

Example structure:

- `tests/unit/`
- `tests/integration/`
- `tests/e2e/`
- `tests/fixtures/`
- `tests/helpers/`

Possible domain grouping:

- `tests/unit/auth/`
- `tests/unit/tickets/`
- `tests/unit/email/`
- `tests/unit/scheduling/`
- `tests/integration/api/`
- `tests/integration/webhooks/`
- `tests/integration/bookings/`
- `tests/e2e/customer/`
- `tests/e2e/agent/`
- `tests/e2e/tenancy/`

---

## Initial must-have test checklist

The first implementation phase should include tests for:

- role access for internal notes
- ticket creation validation
- ticket status transition rules
- reply token parsing
- inbound email thread matching
- duplicate inbound message detection
- availability template slot generation
- scheduling-disabled category rejection
- customer self-book booking creation
- reschedule history preservation
- role-based booking access control

---

## Final guidance

Use TDD-first where business rules and system integrity matter most.

This project should prioritize correctness in:
- tenancy
- permissions
- ticket workflows
- email threading
- scheduling

The test suite should make refactoring safer, not slower.
Aim for a system where critical behaviors are easy to trust and hard to accidentally break.