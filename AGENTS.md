# AGENTS.md: TimeSwap AI Coding Agent Directives & Repository Rules

This document defines the operational directives, architectural boundaries, security invariants, and coding standards for AI coding agents (including Google Antigravity) implementing the TimeSwap platform. All instructions in this file are mandatory and non-negotiable.

---

## 1. Project Context

* **Project Name:** TimeSwap
* **Product Classification:** Non-monetary, community-driven skill exchange and mutual aid marketplace.
* **Core Unit of Account:** Human Time ($60\text{ minutes of service} = 1.0\text{ credit}$). Credits are non-convertible, cannot be bought/sold, and carry zero monetary value.
* **Architecture Pattern:** Modular Monolith within a TypeScript monorepo.
* **Approved Technology Stack:**
* Frontend: Next.js (App Router, React, TypeScript, Tailwind CSS)
* Backend: NestJS (Fastify Adapter, TypeScript)
* Persistence: PostgreSQL 16+ with Prisma ORM
* Queue & Cache: Redis 7+ with BullMQ
* Storage: S3-compatible object storage (Cloudflare R2 / AWS S3)


* **Authoritative Documentation Directory:** `docs/`

---

## 2. Document Authority & Specification Hierarchy

When building or modifying any part of TimeSwap, Antigravity must adhere to the following strict hierarchy of authority. Lower-level implementations must never contradict higher-level specifications:

1. `docs/01_PRODUCT.md`: Authoritative for product definition, economic rules, user roles, cancellation policies, and MVP boundaries.
2. `docs/02_ARCHITECTURE.md`: Authoritative for technical architecture, infrastructure boundaries, tech stack choices, and deployment topology.
3. `docs/03_DOMAIN_DATABASE.md`: Authoritative for domain models, entity ownership, database constraints, lifecycles, and relational mappings.
4. `docs/04_API.md`: Authoritative for REST contracts, endpoint routes, request/response DTO structures, status codes, and error envelopes.
5. `docs/05_CREDIT_LEDGER.md`: Authoritative for double-entry accounting rules, account types, journal entries, escrow state machines, and balance invariants.
6. `docs/06_UI_UX.md`: Authoritative for screen inventories, user flows, responsive component behaviors, visual tokens, and accessibility standards.
7. `docs/07_IMPLEMENTATION.md`: Authoritative for phase sequencing, quality gates, test requirements, and definition of done.
8. `docs/08_FILE_STRUCTURE.md`: Authoritative for repository structure, application/package boundaries, file and directory ownership, dependency direction, protected areas, and code organization rules.

*Rule for Handling Conflicts:* If an assigned task or user prompt conflicts with any approved document in `docs/`, Antigravity must **not** silently invent a new behavior. Antigravity must highlight the contradiction, follow the authoritative document, and request formal specification updates before proceeding.

---

## 3. Pre-Coding Inspection Protocol

Before writing or modifying any code, Antigravity must execute the following preliminary checks:

* **Identify Affected Domains:** Determine exactly which domain modules and documentation specifications govern the task.
* **Review Relevant Documentation:** Read the corresponding sections in `docs/01_PRODUCT.md` through `docs/07_IMPLEMENTATION.md`.
* **Inspect Existing Codebase:** Examine existing services, DTOs, controllers, and database schemas before introducing new abstractions.
* **Verify Reuse Opportunities:** Reuse existing shared utilities, guards, interceptors, and Prisma models rather than creating duplicates.
* **Confirm Phase Prerequisites:** Verify that the task belongs to the active implementation phase and that all prior phase dependencies are satisfied.
* **Limit Scope:** Implement strictly what is required for the assigned task. Never perform speculative refactoring on unrelated modules.

---

## 4. Scope Control & Architectural Boundaries

Antigravity must strictly respect the following architectural guardrails:

* **DO NOT** convert the modular monolith into microservices or distributed micro-frontends.
* **DO NOT** replace or augment the approved tech stack (Next.js, NestJS, Fastify, PostgreSQL, Prisma, Redis, BullMQ) without explicit specification revisions.
* **DO NOT** add unapproved third-party libraries, UI component frameworks, or external state managers when native or existing tooling suffices.
* **DO NOT** build forward into future phases or implement speculative infrastructure.
* **DO NOT** create duplicate representations or parallel services for the same domain entity.
* **DO NOT** modify unrelated modules simply because they could be optimized. Keep code changes minimal, cohesive, and reviewable.

---

## 5. Domain & Business Logic Boundaries

All business logic, state machines, permission checks, and calculation rules belong exclusively in the backend application/domain layer:

* **The Frontend is Never Authoritative:** The Next.js client is strictly a presentation and input-capture interface. It must never be trusted to calculate balances, authorize state transitions, or enforce cancellation policies.
* **Strict Domain Ownership:** Each domain module owns its database tables. Cross-domain data mutations must occur via exported domain service methods or internal domain events.
* **Direct Database Boundary:** No module may directly query or update tables owned by another domain without using that domain's published service interface.

---

## 6. Credit & Ledger Protection (Protected Boundary)

The credit and ledger subsystem is a protected architectural boundary. The following rules are absolute:

* **No Direct Balance Overrides:** Never execute raw SQL updates or Prisma calls like `UPDATE user SET balance = balance + 1`. All credit changes must be executed as balanced journal entries via `LedgerService`.
* **Double-Entry Equilibrium:** Every credit-changing transaction must consist of balanced debit and credit entries ($\sum \text{Debits} = \sum \text{Credits}$).
* **PostgreSQL Authoritativeness:** Ledger balances reside authoritatively in PostgreSQL. Redis or in-memory caches must never be used as the authoritative source for credit accounting.
* **Zero Spontaneous Generation:** Credits can only be created via authorized onboarding starter grants from `SYSTEM_RESERVE`.
* **Zero Double-Spending:** All credit reservations (`lockEscrow`) must execute within database transactions acquiring row-level locks on user accounts (`SELECT ... FOR UPDATE`).
* **Immutability of History:** Historical `LedgerTransaction` and `JournalEntry` records are strictly append-only. They must never be updated or deleted.
* **Single Settlement / Refund:** A booking escrow hold can transition to settled or refunded exactly once. Duplicate executions must be prevented via database locks and state assertions.

---

## 7. Database & Persistence Invariants

* **PostgreSQL as Sole Source of Truth:** PostgreSQL 16+ enforces all relational integrity, constraints, and operational states.
* **Prisma Migrations:** All schema changes must be generated via `prisma migrate dev` with clear, descriptive migration names. Never modify production database schemas through raw, un-tracked SQL scripts.
* **Check Constraints:** Enforce non-negative wallet balances (`balance >= 0.00`) and valid rating bounds ($1 \le \text{rating} \le 5$) directly at the database layer.
* **Cascade Restrictions:** Use `RESTRICT` on financial records, bookings, and ledger entries to prevent accidental cascade deletions when a user account is modified.
* **Isolation of Seed Data:** Curated system taxonomies (`SkillCategory`, `Skill`) and system accounts must reside in `prisma/seed.ts`, strictly isolated from transactional test fixtures.

---

## 8. API Contracts & Communication Rules

* **Adhere to `docs/04_API.md`:** Endpoint paths, HTTP verbs, payload structures, and response shapes must match the approved API specification exactly.
* **Version Prefixing:** All routes must maintain the `/api/v1/` prefix.
* **Input Validation:** Every controller endpoint must enforce strict payload validation using typed DTOs and Zod/class-validator pipes (`whitelist: true, forbidNonWhitelisted: true`).
* **Server-Side Authentication:** Authenticate requests via signed, `HttpOnly`, `Secure`, `SameSite=Lax` cookies. Never accept raw user IDs from client request bodies to identify the authenticated caller.
* **Idempotency Safeguards:** Mutating endpoints (`/bookings`, `/attest-completion`, `/disputes/:id/resolve`) must support idempotency keys to prevent duplicate execution on network retries.
* **Standard Response Envelopes:** All responses must conform to the standard `{ success: true, data: { ... } }` or `{ success: false, error: { ... } }` envelope.

---

## 9. Frontend & UI/UX Guidelines

* **Adhere to `docs/06_UI_UX.md`:** Visual hierarchy, layout structures, and user flows must match the design specification.
* **Mobile-First Responsiveness:** All views must be designed mobile-first ($< 768\text{px}$) and scale gracefully to tablet and desktop viewports without clipping or horizontal overflow.
* **WCAG 2.2 AA Accessibility:** Ensure semantic HTML, visible focus states, adequate color contrast ratios ($\ge 4.5:1$), and explicit form `<label>` associations.
* **Multi-Modal State Indicators:** Status badges and alerts must never rely on color alone; always pair color fills with text labels and iconography.
* **No Optimistic Financial State:** Never optimistically update wallet balances or booking statuses before the backend API returns a verified 200/201 response.
* **Privacy by Default:** Never render exact residential addresses or GPS coordinates on public discovery cards; display only City and General District.
* **Mandatory UI States:** Every dynamic screen must handle all four operational states: Loading (Skeletons), Empty (Actionable guidance), Error (Friendly recovery), and Success.

---

## 10. Testing Mandates & Quality Gates

Every feature implementation must include corresponding automated tests:

* **Unit Tests (Vitest):** Required for all domain state machines, validation logic, calculation helpers, and double-entry balance arithmetic.
* **Integration Tests (Jest/Supertest + Testcontainers):** Required for API routes, database constraint validations, auth guards, and transaction boundaries.
* **Specialized High-Risk Tests:**
* *Zero-Sum Invariant:* Assert $\sum \text{Debits} - \sum \text{Credits} = 0.00$ across all journal records.
* *Concurrency Stress:* Simulate 50 concurrent booking attempts on a single credit; assert exactly one succeeds and 49 fail.
* *Cancellation Boundary:* Assert correct credit routing at minute 12:01 (refund) vs. minute 11:59 (provider indemnity).
* *Double-Blind Privacy:* Assert reviews remain invisible to other users until both parties submit or 7 days elapse.


* **Zero Test Deletion:** Never delete, skip, or disable failing tests to achieve a passing build. Fix the underlying implementation.

---

## 11. Implementation & Change Workflow

For every assigned engineering task, Antigravity must follow this exact execution cycle:

| Stage | Required Actions |
| --- | --- |
| **1. Before Coding** | Read governing documentation in `docs/`; inspect existing code; identify affected modules and dependencies. |
| **2. During Coding** | Make the smallest cohesive change; keep business logic in the domain layer; write accompanying tests concurrently; enforce validation and invariants. |
| **3. After Coding** | Run `tsc --noEmit` (zero errors); run linter and formatter; execute full test suite; inspect git diff for unintended file changes. |

---

## 12. Specification Synchronization & Conflict Resolution

If an implementation reality indicates that a product rule, database model, API contract, or UI flow is flawed or incomplete:

1. **Halt Code Modifications:** Do not silently write divergent code.
2. **Identify the Conflict:** Locate the exact section and document where the discrepancy exists.
3. **Resolve Specification First:** Document the necessary change in the appropriate `docs/` specification file.
4. **Implement Code & Tests:** Update the implementation to match the newly synchronized specification.

---

## 13. Security & Data Protection Standards

* **Secrets Management:** Secrets, private keys, database connection strings, and session salts must never be committed to repositories or exposed to client-accessible bundles.
* **Password Hashing:** Passwords must be hashed using `Argon2id` (or `bcrypt` with work factor $\ge 12$).
* **Rate Limiting:** Sliding-window Redis rate limiters must protect authentication routes (`/auth/login`, `/auth/register`, `/auth/forgot-password`) and messaging endpoints.
* **Cross-Site Scripting (XSS) & Header Security:** Enforce `@fastify/helmet` security headers; rely on Next.js automatic context-aware escaping.
* **Least Privilege:** Database application connections must operate with restricted permissions, separate from deployment migration roles.

---

## 14. Error Handling & Resilience

* **Masking Internal Exceptions:** Database errors, stack traces, and system internals must never be returned to the client in production responses.
* **Predictable Error Codes:** Map domain failures to explicit error codes (e.g., `INSUFFICIENT_CREDITS`, `BOOKING_SLOT_UNAVAILABLE`, `UNAUTHORIZED_RESOURCE_ACCESS`).
* **Non-Blocking Background Failures:** A failure in external notification pipelines (e.g., email API downtime) must never cause a database transaction (such as escrow settlement) to roll back.

---

## 15. Dependency Management Rules

* **Evaluate Before Adding:** Check if native Node.js/TypeScript features or existing monorepo dependencies can solve the problem before introducing a new package.
* **No Duplicate Libraries:** Do not install multiple libraries for the same concern (e.g., do not combine Axios with native Fetch, or date-fns with Moment).
* **Zero Unnecessary Infrastructure:** Do not introduce external micro-daemons, standalone search clusters, or alternative cache brokers outside of PostgreSQL and Redis.

---

## 16. MVP Boundaries & Excluded Features ("Do Not Build Yet")

The following concepts from early research are explicitly excluded from the MVP build. Antigravity must **not** implement them unless formally approved in updated specifications:

* **Demurrage / Balance Decay Engines:** No credit carrying charges or automatic deductions on idle balances.
* **Credit Expiration Schedules:** Credits remain valid indefinitely.
* **Dynamic / Skill-Based Pricing:** No surge pricing or tier multipliers; all sessions remain $1.00$ credit ($60\text{ min}$).
* **Multi-Hop Circular Clearing:** No Johnson cycle detection or Hopcroft-Karp graph clearing.
* **EigenTrust Global Matrix Iterations:** No graph-based trust propagation; use direct bilateral reviews and completion metrics.
* **Automated WebRTC Telemetry Verification:** No meeting log checking; use dual attestation and auto-settlement timers.
* **Vector Semantic Search (`pgvector`):** Deferred to Phase 2; use native PostgreSQL Full-Text Search for MVP.
* **Institutional SSO:** Deferred to Phase 2; use standard email verification for MVP.

---

## 17. AI Coding Agent Operating Directives

* **Inspect First:** Always read relevant files before proposing modifications.
* **Minimal Clean Diffs:** Generate clean, focused changes without sweeping rewrites of untouched functions.
* **Preserve Working Functionality:** Never break existing working features or tests while adding new capabilities.
* **No Phantom Rules:** If a product rule is unspecified in `docs/`, ask for clarification rather than assuming a solution.

---

## 18. Definition of Done (DoD) Checklist

A task is complete if and only if all of the following verification points pass:

* [ ] Feature behaves strictly according to `01_PRODUCT.md` and `04_API.md`.
* [ ] Domain logic is encapsulated in the backend without cross-domain leakage.
* [ ] Input payloads are strictly validated via DTOs and schemas.
* [ ] Role-based authorization and ownership checks are active and verified.
* [ ] Database transactions and row locks protect all balance mutations.
* [ ] Unit, integration, and E2E tests are written and passing.
* [ ] Frontend screens adhere to responsive and accessible UI/UX specs (`06_UI_UX.md`).
* [ ] TypeScript compilation succeeds with zero errors (`tsc --noEmit`).
* [ ] Documentation in `docs/` remains 100% synchronized with the codebase.

---

## 19. Communication Format for Antigravity

When presenting completed implementation tasks, Antigravity must structure its response using the following concise format:

* **Task Summary:** Brief description of what was implemented.
* **Affected Modules & Files:** List of created or modified files.
* **Key Design Decisions:** Architectural or domain choices made during implementation.
* **Tests Added & Verified:** Summary of test suites added and validation results.
* **Unresolved Decisions / Open Questions:** Any edge case or specification conflict identified during development.

---

## 20. The Core Invariant (Final Rule)

Do not optimize for generating the maximum volume of code. Optimize for building the **correct, secure, and maintainable** TimeSwap platform.

Mathematical ledger integrity, strict domain boundaries, and user trust take precedence over development shortcuts. When in doubt, consult the authoritative specifications in `docs/`.