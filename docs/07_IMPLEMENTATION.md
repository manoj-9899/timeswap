# docs/07_IMPLEMENTATION.md: TimeSwap Implementation Roadmap & Engineering Guidelines

This document defines the authoritative, phase-by-phase implementation roadmap, engineering processes, testing mandates, quality gates, and AI agent operating rules for building the TimeSwap platform from scratch to production. It serves as the primary execution guide for Google Antigravity.

---

## 1. Implementation Philosophy

TimeSwap is built as a production-grade, modular monolith optimized for correctness, developer velocity, maintainability, and safety:

* **Incremental Vertical Slices:** Deliver cohesive vertical features (Database $\to$ Backend Domain $\to$ API Gateway $\to$ Frontend UI $\to$ Tests) within strictly ordered phases.
* **Domain Isolation First:** Enforce domain boundaries in code from day one. Prevent cross-domain database coupling and circular dependencies.
* **Test Alongside Implementation:** Every business rule, state transition, and ledger entry must have accompanying automated tests written concurrently with the implementation.
* **Correctness Before Polish:** Core transactional integrity (credit conservation, double-entry balancing, escrow locking, zero-balance enforcement) takes absolute precedence over UI styling and non-critical optimizations.
* **Zero Premature Complexity:** Exclude microservices, distributed transactions, dynamic monetary algorithms, and complex graph matchers until real-world user scale mandates them.

---

## 2. Hierarchy of Authority & Source of Truth

When implementation questions or design decisions arise, Google Antigravity must strictly adhere to the following documentation hierarchy:

1. `docs/01_PRODUCT.md`: Authoritative for product rules, user roles, economic principles, cancellation policies, and MVP boundaries.
2. `docs/02_ARCHITECTURE.md`: Authoritative for system topology, tech stack decisions, infrastructure boundaries, and security standards.
3. `docs/03_DOMAIN_DATABASE.md`: Authoritative for entity models, domain ownership, relationships, lifecycles, and database constraints.
4. `docs/04_API.md`: Authoritative for REST contracts, endpoint paths, request/response DTO structures, status codes, and error formats.
5. `docs/05_CREDIT_LEDGER.md`: Authoritative for double-entry accounting rules, account types, journal transactions, settlement workflows, and balance invariants.
6. `docs/06_UI_UX.md`: Authoritative for screen inventories, visual design tokens, component behaviors, user flows, and accessibility requirements.
7. `docs/07_IMPLEMENTATION.md`: Authoritative for the execution sequence, testing requirements, definition of done, and AI coding constraints.
8. `docs/08_FILE_STRUCTURE.md`: Authoritative for repository structure, application/package boundaries, file and directory ownership, dependency direction, protected areas, and code organization rules.

*Rule of Interpretation:* Antigravity must never invent product logic, modify economic rules, or add unapproved endpoints. If an edge case is unspecified, flag it as an open decision.

---

## 3. Implementation Dependency & Execution Sequence

Development must proceed sequentially through 14 structured phases. No phase may begin until the preceding phase satisfies its full Definition of Done.

| Phase | Milestone Name | Primary Dependency | Core Deliverable |
| --- | --- | --- | --- |
| **Phase 0** | Workspace & Tooling Foundation | None | Monorepo, Docker environments, CI pipelines, and base packages. |
| **Phase 1** | Identity, Auth & Session Management | Phase 0 | User registration, password security, session cookies, and RBAC guards. |
| **Phase 2** | Profiles & Skill Taxonomy | Phase 1 | Profile setup, onboarding wizard, skill tagging, and starter credit trigger. |
| **Phase 3** | Marketplace: Offers & Requests | Phase 2 | Service Offers and Help Requests CRUD, validations, and listing lifecycles. |
| **Phase 4** | Search & Discovery Engine | Phase 3 | Full-text search, category filtering, and location-based discovery. |
| **Phase 5** | Booking & Exchange Lifecycle | Phase 3 | Scheduling workflow, duration validation (30/60 min), and booking state machine. |
| **Phase 6** | Core Ledger, Wallets & Escrow | Phase 5 | Double-entry accounting engine, escrow locking, balance queries, and audit logs. |
| **Phase 7** | Completion, Cancellation & Disputes | Phase 6 | 12h cancellation policy, 24h auto-settlement, and moderator arbitration. |
| **Phase 8** | Double-Blind Reviews & Reputation | Phase 7 | 5-star bilateral review submission, 7-day reveal logic, and profile reputation. |
| **Phase 9** | Gated Direct Messaging | Phase 5 | Context-gated 1-on-1 chat threads, message persistence, and WebSocket push. |
| **Phase 10** | Activities & Community Layer | Phase 4 | Group activity models and discovery (Phase 2 feature staging). |
| **Phase 11** | Notifications & Transactional Alerts | Phase 7, 9 | In-app notification center and asynchronous BullMQ email dispatchers. |
| **Phase 12** | Production Hardening & Security Audit | Phase 0–11 | Concurrency stress tests, penetration checks, rate limiting, and observability. |
| **Phase 13** | Production Deployment & Launch | Phase 12 | Docker containerization, cloud infrastructure deployment, and live verification. |

---

## 4. Phase-by-Phase Execution Specifications

### Phase 0 — Workspace & Tooling Foundation

* **Objective:** Establish a typed monorepo, local development container orchestration, database connection pooling, shared type packages, and automated CI pipelines.
* **Prerequisites:** Approved architecture specification (`docs/02_ARCHITECTURE.md`).
* **Database Work:** Configure PostgreSQL 16+ container with persistent volume; initialize Prisma ORM in `packages/database`.
* **Backend Work:** Initialize NestJS Fastify application in `apps/api`; configure global validation pipes, exception filters, and Pino logger.
* **Frontend Work:** Initialize Next.js (App Router) in `apps/web`; configure Tailwind CSS, Lucide icons, and base design tokens matching `docs/06_UI_UX.md`.
* **Worker & Cache Work:** Initialize Redis 7+ container; configure BullMQ queue infrastructure in `apps/worker`.
* **Test Framework:** Setup Vitest for unit tests, Jest/Supertest for API integration tests, and Playwright for E2E testing.
* **User-Visible Milestone:** Local environment runs `pnpm dev`, rendering a base Next.js landing shell and returning 200 OK from `/api/v1/health`.
* **Definition of Done:** CI pipeline passes linting, type-checking, database migrations, and health check integration tests.

### Phase 1 — Identity, Auth & Session Management

* **Objective:** Implement secure user registration, email verification, login/logout, password recovery, session cookie management, and authorization guards.
* **Prerequisites:** Phase 0.
* **Database Work:** Implement `User`, `UserCredential`, and `SessionToken` models in Prisma schema; apply unique email constraint.
* **Backend Work:** Implement `AuthModule` and `UsersModule`; implement password hashing via `Argon2id`; issue signed HTTP-only session cookies; create `@Roles()` decorators and ownership guards.
* **Frontend Work:** Implement `/auth/register`, `/auth/login`, `/auth/verify-email`, and `/auth/forgot-password` pages with client-side Zod validation and error handling.
* **Background Worker Work:** Implement BullMQ email queue consumer to dispatch transactional verification and password reset links.
* **Test Coverage:** Unit tests for password hashing; integration tests for registration collision (`409 Conflict`), invalid credentials (`401 Unauthorized`), session expiration, and RBAC route protection.
* **User-Visible Milestone:** Users can register, verify their email address, log in securely, access authenticated shell layouts, and log out.
* **Definition of Done:** Authentication flows fully functional with HTTP-only cookies; zero credentials leaked in responses; test suite passing.

### Phase 2 — Profiles & Skill Taxonomy

* **Objective:** Implement user profile management, curated skill categories, profile skill linkages, and the onboarding completion wizard.
* **Prerequisites:** Phase 1.
* **Database Work:** Implement `Profile`, `SkillCategory`, `Skill`, and `ProfileSkill` models; seed initial skill taxonomy.
* **Backend Work:** Implement `ProfilesModule` and `SkillsModule`; implement profile update endpoints and onboarding finalization command (`POST /api/v1/users/me/profile/complete`).
* **Frontend Work:** Implement `/onboarding` multi-step wizard, `/users/me/profile` editor, and `/profiles/:handle` public view matching visual specs.
* **Test Coverage:** Integration tests for unique handle validation, skill attachment, and public profile data masking (verifying email/credentials are hidden).
* **User-Visible Milestone:** New users complete the multi-step onboarding wizard and view their updated public profile card with skill badges.
* **Definition of Done:** Profile CRUD complete; coarse location privacy respected; onboarding marks profile as `ACTIVE`.

### Phase 3 — Marketplace: Offers & Requests

* **Objective:** Implement creation, management, lifecycle transitions, and detailed views for Service Offers ("I can help") and Help Requests ("I need help").
* **Prerequisites:** Phase 2.
* **Database Work:** Implement `ServiceOffer` and `HelpRequest` models with status enums and category foreign keys.
* **Backend Work:** Implement `MarketplaceModule`; implement CRUD endpoints, ownership verification interceptors, and pause/publish/close state transitions.
* **Frontend Work:** Implement `/offers/create`, `/requests/create`, `/offers/:id`, `/requests/:id`, and user listing management dashboards.
* **Test Coverage:** Unit tests for listing state transitions; API tests asserting that non-owners cannot edit or archive listings (`403 Forbidden`).
* **User-Visible Milestone:** Users can publish, edit, and browse individual Service Offers and Help Requests.
* **Definition of Done:** Listings persist with correct duration enums (30/60 min) and delivery formats; unauthenticated users can view public details.

### Phase 4 — Search & Discovery Engine

* **Objective:** Implement marketplace discovery via full-text search, category navigation, duration filters, and location filtering.
* **Prerequisites:** Phase 3.
* **Database Work:** Create PostgreSQL GIN indexes on `to_tsvector` columns for titles, descriptions, and skill names.
* **Backend Work:** Implement `DiscoveryModule` exposing `/api/v1/discovery/offers`, `/api/v1/discovery/requests`, and `/api/v1/discovery/members`.
* **Frontend Work:** Build `/discover` catalog with tabbed Offer/Request switches, category filter pills, format dropdowns, and responsive result cards.
* **Test Coverage:** Search query integration tests verifying keyword matching, category filtering accuracy, and pagination envelope correctness.
* **User-Visible Milestone:** Users can search for skills and filter active listings by format, category, and city/district.
* **Definition of Done:** Discovery endpoints execute in $< 50\text{ms}$; coarse location privacy preserved across all result items.

### Phase 5 — Booking & Exchange Lifecycle

* **Objective:** Implement session scheduling, booking proposals, duration enforcement (30 vs. 60 min), participant validation, and the booking state machine.
* **Prerequisites:** Phase 3, Phase 4.
* **Database Work:** Implement `Booking` and `Session` models; enforce constraints prohibiting self-booking (`requester_id != provider_id`).
* **Backend Work:** Implement `BookingsModule`; enforce state machine transitions (`PENDING_ACCEPTANCE` $\to$ `CONFIRMED` $\to$ `IN_PROGRESS` $\to$ `COMPLETED` / `CANCELLED`).
* **Frontend Work:** Implement Booking Modal, `/bookings` tabbed list, and `/bookings/:id` session container screen.
* **Test Coverage:** Comprehensive state machine test suite asserting valid transitions and rejecting invalid jumps (e.g., `CANCELLED` $\to$ `COMPLETED`).
* **User-Visible Milestone:** Requesters can book sessions; Providers can accept or decline; both parties view scheduled sessions on their dashboards.
* **Definition of Done:** Booking lifecycle operational; duration strictly restricted to 30 or 60 minutes.

### Phase 6 — Core Ledger, Wallets & Escrow

* **Objective:** Implement the double-entry accounting engine, starter credit grants, balance inquiries, and atomic escrow locking/releasing.
* **Prerequisites:** Phase 5.
* **Database Work:** Implement `LedgerAccount`, `LedgerTransaction`, `JournalEntry`, and `EscrowHold` models; apply check constraints (`balance >= 0.00`).
* **Backend Work:** Implement `LedgerModule`; implement `lockEscrow()`, `settleEscrow()`, `refundEscrow()`, and `grantStarterCredit()` within atomic database transactions with row-level locks (`SELECT ... FOR UPDATE`).
* **Frontend Work:** Implement `/wallet` screen showing available vs. escrowed balances and immutable ledger activity table.
* **Test Coverage:** High-priority test suite:
* Zero-Sum Invariant Test: Verify $\sum \text{Debits} - \sum \text{Credits} = 0.00$ across all journal entries.
* Double-Spending Test: Run 50 concurrent booking requests against a 1.0 credit wallet; assert exactly 1 succeeds and 49 fail with `400 Bad Request`.
* Single Grant Test: Assert that starter credit cannot be awarded twice to the same user.


* **User-Visible Milestone:** Onboarding automatically awards $1.0\text{ credit}$; booking a session locks credits in escrow; wallet displays real-time balances.
* **Definition of Done:** Ledger invariant mathematically guaranteed; direct wallet mutations impossible; zero negative balances permitted.

### Phase 7 — Completion, Cancellation, No-Shows & Disputes

* **Objective:** Implement session completion attestations, 12-hour cancellation rules, provider indemnity payouts, 24-hour auto-settlement, and moderator dispute resolution.
* **Prerequisites:** Phase 6.
* **Database Work:** Implement `DisputeCase` and `AuditLog` models; add cancellation reason tracking columns.
* **Backend Work:** Implement cancellation logic (evaluating session start vs. 12-hour cutoff); implement attestation endpoints; implement moderator resolution triggers (`FULL_REFUND_REQUESTER`, `FULL_RELEASE_PROVIDER`, `SPLIT_50_50`).
* **Worker Work:** Implement BullMQ 10-minute cron job to auto-settle completed sessions where 24 hours have elapsed without dispute.
* **Frontend Work:** Implement Pre-Cancellation Confirmation Dialog, Dispute Filing Form, and `/admin/disputes` Moderator Console.
* **Test Coverage:** Integration tests for early cancellation refund, late requester cancellation indemnity, auto-settlement cron execution, and dispute ledger splits.
* **User-Visible Milestone:** Users can attest completion or cancel with clear credit terms; moderators can arbitrate disputes and settle escrow.
* **Definition of Done:** All cancellation and dispute paths execute balanced ledger transactions; auto-settlement worker functions reliably.

### Phase 8 — Double-Blind Reviews & Reputation Aggregation

* **Objective:** Implement post-session rating and review submission, 7-day double-blind privacy reveals, and profile reputation score calculations.
* **Prerequisites:** Phase 7.
* **Database Work:** Implement `Review` model with `is_revealed` flag and check constraint ($1 \le \text{rating} \le 5$).
* **Backend Work:** Implement `ReviewsModule`; create review submission endpoint; implement review reveal trigger and asynchronous profile score recalculation.
* **Worker Work:** Scheduled BullMQ job to automatically reveal submitted single reviews after 7 days elapse post-session.
* **Frontend Work:** Implement Double-Blind Review Modal and public profile review feeds.
* **Test Coverage:** Tests verifying that reviews remain hidden until both submit or 7 days elapse; self-review attempts are rejected (`400 Bad Request`).
* **User-Visible Milestone:** Completed sessions prompt bilateral reviews; revealed feedback updates public star ratings and reliability badges.
* **Definition of Done:** Double-blind privacy enforced; reputation metrics accurately aggregate verified exchange history.

### Phase 9 — Gated Direct Messaging

* **Objective:** Implement context-gated 1-on-1 direct messaging between booking participants with real-time updates.
* **Prerequisites:** Phase 5.
* **Database Work:** Implement `MessageThread` and `Message` models.
* **Backend Work:** Implement `MessagingModule` and NestJS WebSocket Gateway (with Redis adapter); enforce thread gating (requiring active booking or proposal); implement 48-hour post-settlement read-only transition.
* **Frontend Work:** Build `/messages` hub, split-panel desktop chat view, mobile chat drawer, and unread badge counters.
* **Test Coverage:** Authorization tests asserting strangers cannot initialize cold chat threads; tests verifying read-only state after booking cancellation.
* **User-Visible Milestone:** Participants coordinate session details via real-time in-app chat directly within their booking screen.
* **Definition of Done:** Messaging operational via WebSockets with REST fallback; cold outreach prevented; thread auto-close rules enforced.

### Phase 10 — Activities & Community Layer (Phase 2 Staging)

* **Objective:** Model and stage group activities (1-to-N workshops and study circles) without activating unapproved group-credit mechanics.
* **Prerequisites:** Phase 4.
* **Database Work:** Define `Activity` and `ActivityParticipant` schemas for future migration.
* **Backend & Frontend Work:** Create placeholder UI/API boundaries gated behind feature flags.
* **Definition of Done:** Phase 2 activity schemas isolated; zero impact on core 1-on-1 MVP booking flows.

### Phase 11 — Notifications & Transactional Alerts

* **Objective:** Implement in-app notification feeds, real-time alert popovers, and asynchronous transactional email dispatch.
* **Prerequisites:** Phase 7, Phase 9.
* **Database Work:** Implement `Notification` model with read/unread tracking.
* **Backend Work:** Implement `NotificationsModule`; dispatch events on booking requests, confirmations, cancellations, reminders, and disputes.
* **Worker Work:** Configure BullMQ email worker to dispatch booking reminders (24h and 2h prior) and moderation alerts via Resend/SendGrid.
* **Frontend Work:** Implement Top Navigation Notification Bell, popover feed, `/notifications` management page, and unread counters.
* **Test Coverage:** Tests asserting notifications generate for all lifecycle state changes; worker failure does not block database transactions.
* **User-Visible Milestone:** Users receive real-time in-app alerts and transactional emails for all exchange milestones.
* **Definition of Done:** In-app alert system fully integrated; email queue operates asynchronously with retry policies.

### Phase 12 — Production Hardening & Security Audit

* **Objective:** Perform end-to-end security audits, database query optimization, stress testing, and observability integration.
* **Prerequisites:** Phase 0 through 11.
* **Security Hardening:** Verify Redis sliding-window rate limiters; inspect CORS origins; verify Content-Security-Policy and Helmet headers; audit RBAC guards.
* **Database Performance:** Run `EXPLAIN ANALYZE` on marketplace discovery queries; verify GIN and compound B-tree index coverage; verify connection pooling parameters.
* **Ledger Integrity Audit:** Run automated reconciliation scripts asserting global conservation across all test transactions.
* **Observability:** Configure Pino structured JSON logging, Sentry error tracking, and `/health/live` and `/health/ready` probes.
* **E2E Test Execution:** Execute complete Playwright test suite covering all critical user journeys.
* **Definition of Done:** Zero critical/high vulnerability findings; zero unindexed discovery queries; all E2E test suites green.

### Phase 13 — Production Deployment & Release Engineering

* **Objective:** Deploy containerized services to production cloud infrastructure, execute production migrations, and verify system operation.
* **Prerequisites:** Phase 12.
* **Infrastructure Setup:** Provision managed PostgreSQL 16+ and Redis 7+ instances; configure S3/Cloudflare R2 object storage bucket with CORS policies.
* **Container Deployment:** Build and deploy Docker containers for `api` and `worker`; deploy `web` application to Node-compatible edge or container environment.
* **DNS & SSL:** Configure custom domains with strict TLS 1.3 termination and HSTS headers.
* **Live Smoke Verification:** Execute end-to-end synthetic user transaction on production environment (Registration $\to$ Profile Setup $\to$ Starter Grant $\to$ Listing Creation $\to$ Booking $\to$ Completion $\to$ Review).
* **Definition of Done:** Platform live in production; automated database backups active; monitoring dashboards operational.

---

## 5. Testing Strategy & Quality Assurance

Testing is integrated into every phase. Code without tests will be rejected by continuous integration.

```
+-------------------------------------------------------------------------+
| END-TO-END (E2E) TESTS (Playwright)                                     |
| Full browser workflows: Signup -> Onboarding -> Booking -> Settlement   |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| INTEGRATION & API TESTS (Supertest + Testcontainers Postgres & Redis)   |
| Ledger Invariant Verification, Race Conditions, RBAC & State Machines   |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| UNIT TESTS (Vitest)                                                     |
| Double-entry math, Zod schemas, lifecycle guards, and utility functions |
+-------------------------------------------------------------------------+

```

### 5.1 Specialized Critical Test Suites

* **Ledger Invariant Suite:** Continuously asserts $\sum \text{Debits} - \sum \text{Credits} = 0.00$ across all journal records.
* **Concurrency Race Suite:** Simulates 50 simultaneous HTTP requests attempting to book sessions against a single available credit, verifying that exactly one transaction succeeds.
* **Cancellation Boundary Suite:** Tests booking cancellations at minute 12:01 (early, refund) versus minute 11:59 (late, provider indemnity) relative to scheduled start.
* **Double-Blind Privacy Suite:** Asserts that unrevealed reviews return `null` content and ratings when queried by the subject or third parties prior to the reveal trigger.

---

## 6. Definition of Done (DoD)

A task or phase is considered complete if and only if it satisfies all of the following criteria:

1. **Functional Correctness:** The feature behaves exactly as specified in `01_PRODUCT.md` and `04_API.md`.
2. **Domain Boundary Compliance:** No cross-domain database mutations or raw SQL balance updates exist.
3. **Database Integrity:** Foreign key constraints, unique indexes, and non-negative check constraints are defined and verified.
4. **Input Validation:** All incoming request payloads are strictly validated using typed DTOs and Zod/class-validator schemas.
5. **Authorization Enforced:** Role-based guards (`@Roles()`) and ownership checks prevent unauthorized resource manipulation.
6. **Automated Test Coverage:** Unit and integration tests cover all success branches, validation errors, and unauthorized access attempts.
7. **UI/UX Fidelity:** Frontend screens match responsive layout, accessibility, and visual guidelines defined in `06_UI_UX.md`.
8. **Zero Regressions:** Full test suite passes without skipping existing tests; TypeScript compilation succeeds with zero errors (`tsc --noEmit`).

---

## 7. Google Antigravity Implementation Rules

These rules are non-negotiable constraints for AI coding agents:

### Mandatory Actions

* **Read Before Coding:** Always review the relevant specification document before writing code for a domain.
* **Implement Incrementally:** Work strictly within the designated phase. Do not build forward into unapproved phases.
* **Preserve Invariants:** Respect the double-entry accounting model, strict session duration limits (30/60 min), and location privacy safeguards.
* **Write Concurrent Tests:** Deliver unit and integration tests alongside every new service, controller, and state transition.
* **Isolate Database Writes:** Encapsulate all multi-step mutations within explicit database transactions (`prisma.$transaction`).

### Prohibited Actions

* **DO NOT** convert the modular monolith into microservices.
* **DO NOT** replace the chosen technology stack (Next.js, NestJS, Fastify, PostgreSQL, Prisma, Redis, BullMQ).
* **DO NOT** execute raw SQL `UPDATE` queries on user credit balances; all balance changes must route through `LedgerService`.
* **DO NOT** introduce unapproved economic features (demurrage, dynamic pricing, token conversions, or multi-hop graph clearing).
* **DO NOT** remove or skip failing tests to achieve a passing build.
* **DO NOT** expose private user location (street addresses or coordinates) through public endpoints.

---

## 8. Change Management & Spec Synchronization

If an implementation hurdle reveals a flaw or necessary modification in the product or architecture design:

1. **Halt Code Changes:** Do not silently modify database semantics or business rules in code.
2. **Identify Impacted Specifications:** Locate the affected documents (e.g., `01_PRODUCT.md` for rules, `03_DOMAIN_DATABASE.md` for schemas).
3. **Document the Revision:** Explicitly update the relevant specification document and record the rationale in an Architecture Decision Record (ADR).
4. **Apply Code & Tests:** Implement the approved change across backend, frontend, and automated test suites.
5. **Verify Coherence:** Confirm that all eight project documents remain synchronized and free of contradictions.

---

## 9. Database Migration & Data Integrity Rules

* **Deterministic Migrations:** All schema changes must be generated via `prisma migrate dev` with descriptive migration names.
* **Zero Casual Table Drops:** Destructive migrations (dropping tables or non-nullable columns) require explicit manual verification.
* **Separation of Seed Data:** System taxonomy seeds (`SkillCategory`, curated `Skill` records, and system accounts) must reside in dedicated seed scripts (`prisma/seed.ts`), isolated from test data.
* **Immutable Ledger Protection:** The migration pipeline must never alter or drop historical `LedgerTransaction` or `JournalEntry` tables in production environments.

---

## 10. Release Strategy & Environment Promotion

Features progress through a strict multi-tier promotion pipeline:

1. **Local Development:** Developers and AI agents implement features against local Docker-backed PostgreSQL and Redis instances.
2. **Automated CI Validation:** GitHub Actions executes linting, type-checking, database migration dry-runs, and unit/integration test suites on every pull request.
3. **Staging Environment:** Merge to main triggers automated deployment to a staging environment mirroring production configurations.
4. **E2E & Synthetic Testing:** Automated Playwright suites execute end-to-end user journeys against staging.
5. **Production Deployment:** Release tags trigger container image publishing and zero-downtime rolling deployment to production infrastructure.

---

## 11. MVP Boundary & Excluded Features ("Do Not Build Yet")

The following mechanisms are explicitly excluded from the MVP build and must not be implemented during initial phases:

* **Demurrage / Balance Decay:** No automatic credit deductions on idle wallets.
* **Credit Expiration:** Credits must remain valid indefinitely.
* **Dynamic / Skill-Based Pricing:** Pricing remains strictly $0.50$ credits for 30 minutes and $1.00$ credit for 60 minutes.
* **Multi-Hop Circular Clearing:** No Johnson cycle detection or Hopcroft-Karp graph routing.
* **EigenTrust Reputation Math:** No matrix-iterated graph trust scoring; use direct bilateral reviews.
* **Automated WebRTC Telemetry:** No meeting log checking; use dual attestation and auto-settle timers.
* **Vector Semantic Search (`pgvector`):** Deferred to Phase 2; use PostgreSQL GIN full-text search for MVP.
* **Institutional SSO:** Deferred to Phase 2; use standard email verification for MVP.

---

## 12. Standard AI Implementation Checklist

For every assigned engineering task, Antigravity must execute the following checklist:

### Before Writing Code

* [ ] Verify which phase this task belongs to.
* [ ] Review the authoritative documentation for the domain (`01_PRODUCT.md` through `08_FILE_STRUCTURE.md`).
* [ ] Verify that prerequisites from prior phases are completed and tested.

### During Implementation

* [ ] Enforce domain isolation (no unauthorized cross-domain database calls).
* [ ] Use typed DTOs and Zod validation schemas for all inputs.
* [ ] Wrap multi-entity database mutations in `prisma.$transaction`.
* [ ] Implement non-negotiable invariants (row-level locking for balances, check constraints).
* [ ] Adhere to WCAG 2.2 AA accessibility and mobile-first responsive guidelines.

### After Writing Code

* [ ] Run TypeScript compilation check (`tsc --noEmit`).
* [ ] Run automated linter and formatter.
* [ ] Execute unit, integration, and E2E test suites.
* [ ] Verify that no ledger invariant or balance conservation rule has been compromised.
* [ ] Confirm that Definition of Done criteria are fully satisfied.

---

## 13. Implementation Decision Summary

| Dimension | Final Implementation Rule | Primary Rationale |
| --- | --- | --- |
| **Architecture Model** | Modular Monolith in Monorepo | High developer velocity with strict internal domain boundaries. |
| **Execution Sequence** | 14 Dependency-Ordered Phases | Prevents architectural drift and ensures core ledger stability early. |
| **Ledger Concurrency** | Row-Level Locking (`SELECT FOR UPDATE`) | Guarantees zero double-spending during concurrent booking attempts. |
| **Search Technology** | PostgreSQL Full-Text Search (GIN) | High-performance text matching without external search cluster overhead. |
| **Session Security** | Signed, HTTP-Only, SameSite=Lax Cookies | Eliminates client-side XSS token theft vulnerabilities. |
| **Quality Enforcement** | Mandatory Concurrent Testing | Prevents regression and validates mathematical balance invariants. |
| **AI Agent Guardrails** | Strict Phasing & Prohibited Action Boundaries | Prevents unapproved feature creep, microservice drift, or spec dilution. |

---

## 14. Implementation Decisions Resolved

The following operational decision has been finalized for the MVP.

### 1. Transactional Email Service Provider

The production transactional email provider for the MVP will be **Resend**.

Resend will be used for application-generated transactional emails, including:

- booking-related notifications
- dispute resolution notifications
- account and authentication-related emails where required
- other essential system notifications

Email delivery must be processed asynchronously through the existing BullMQ notification worker.

Application requests and domain operations must not wait for email delivery to complete.

The email provider integration must be isolated behind an application email service boundary so the provider can be replaced in a future iteration without requiring changes to core business logic.

Production credentials must be supplied through environment variables and must never be committed to the repository.

### 2. Development and Testing Email Handling

Local development must not require production Resend credentials.

The development environment should support a safe local or test email configuration so notification flows can be tested without sending unintended production emails.

Production email sending must only be enabled when the required production environment configuration is explicitly present.