---
name: timeswap-guardian
description: Enforces TimeSwap engineering, domain, security, ledger, and architectural invariants documented in AGENTS.md and docs/01_PRODUCT.md through docs/08_FILE_STRUCTURE.md. Activates when designing, implementing, refactoring, or auditing code across the TimeSwap platform.
---

# TimeSwap Guardian Skill

This skill enforces authoritative engineering, security, ledger, domain, and operational invariants for the TimeSwap platform. All rules contained herein are extracted directly from `AGENTS.md` and `docs/01_PRODUCT.md` through `docs/08_FILE_STRUCTURE.md`.

---

## 1. Activation Criteria

Activate this skill whenever:
* Designing, writing, modifying, refactoring, testing, or auditing code, schemas, or API contracts in TimeSwap.
* Working with user accounts, authentication, profiles, credit ledgers, escrow holds, marketplace listings, bookings, sessions, reviews, direct messaging, or moderation.
* Validating implementation pull requests, state transitions, financial transactions, or database migrations.

---

## 2. Critical Product Invariants

* **Universal Unit of Account:** Human time is the sole unit of account ($60\text{ minutes of completed service} = 1.00\text{ credit}$; $30\text{ minutes} = 0.50\text{ credits}$). Custom durations (e.g., 45 or 90 minutes) are strictly prohibited in MVP.
* **Strict Non-Monetization:** Credits cannot be purchased with money, sold for cash, converted to fiat, or traded on external platforms. Credits carry zero monetary value outside TimeSwap.
* **No Unbacked Peer Gifting:** Credits move between users exclusively via verified session exchanges and authorized onboarding grants from `SYSTEM_RESERVE`. Arbitrary peer-to-peer credit transfers or unbacked gifts are prohibited.
* **Universal Prosumer Model:** Every account has equal capability to act as both a Provider and a Requester. Do not create separate "buyer" vs. "seller" user entities.
* **MVP Exclusions ("Do Not Build Yet"):**
  * No demurrage or balance decay engines.
  * No credit expiration dates.
  * No dynamic, surge, or skill-tier pricing multipliers.
  * No group activities / 1-to-N workshops (deferred to Phase 2).
  * No vector semantic search (`pgvector` deferred to Phase 2).
  * No multi-hop circular clearing graph algorithms (rejected).

---

## 3. Credit & Ledger Protection Rules (Protected Boundary)

* **Double-Entry Equilibrium:** Every credit state transition must consist of balanced debit and credit journal entries ($\sum \text{Debits} = \sum \text{Credits}$).
* **PostgreSQL as Sole Source of Truth:** Ledger balances reside authoritatively in PostgreSQL. Redis, client state, or in-memory caches must never act as the authoritative source for credit accounting.
* **No Direct Balance Overrides:** Direct SQL or ORM balance column updates (`UPDATE user SET balance = ...`) are strictly prohibited. All credit balance changes must execute as balanced journal entries via `LedgerService`.
* **Zero Double-Spending & Row Locking:** Credit reservations (`lockEscrow`) must execute within database transactions acquiring row-level locks (`SELECT ... FOR UPDATE`).
* **Non-Negative Balance Invariant:** User wallet balances must never drop below zero (`balance >= 0.00`), enforced directly by database check constraints.
* **Immutability of Ledger History:** Historical `LedgerTransaction` and `JournalEntry` records are strictly append-only. They must never be updated or deleted.
* **Single Escrow State Transition:** An escrow hold can transition to `SETTLED`, `REFUNDED`, or `SPLIT` exactly once. Terminal states are irreversible.

---

## 4. Booking & State-Transition Protection Rules

* **Duration Constraints:** Bookings are strictly restricted to 30 minutes ($0.50\text{ credits}$) or 60 minutes ($1.00\text{ credit}$).
* **No Self-Booking:** Requester and Provider must be distinct users (`requester_id != provider_id`).
* **Escrow Lock at Creation:** Booking creation synchronously locks credits from the Requester wallet into Escrow. If available balance is less than the required amount, booking creation is blocked.
* **12-Hour Cancellation Window Matrix:**
  * **Requester Early ($\ge 12\text{h}$):** 100% credit refund to Requester.
  * **Requester Late ($< 12\text{h}$) / No-Show:** 100% credits forfeited and awarded to Provider as indemnity.
  * **Provider Cancellation ($\ge 12\text{h}$ or $< 12\text{h}$) / No-Show / Mutual:** 100% credit refund to Requester. Provider receives reliability score penalty on late cancellation or no-show.
* **24-Hour Auto-Settlement Window:** If Provider confirms completion and Requester fails to confirm or dispute within 24 hours of session end, the system automatically transitions session to `COMPLETED` and releases escrow to Provider.
* **Deterministic Dispute Resolution:** Moderator arbitration outcomes are strictly restricted to `FULL_REFUND_REQUESTER`, `FULL_RELEASE_PROVIDER`, or `SPLIT_50_50`. Opening a dispute immediately freezes escrow holds and halts auto-settlement timers.
* **Double-Blind Review Privacy:** Reviews remain hidden (`is_revealed = false`) until both parties submit feedback or 7 days elapse. Self-reviews are rejected (`author_id != subject_id`).

---

## 5. Location & Privacy Rules

* **Coarse Public Data Only:** Public profiles, Service Offers, and Help Requests display coarse location data only: City and General District / Neighborhood.
* **Strict Address Privacy:** Never collect, store, or publicly expose exact residential street addresses, house/flat numbers, or precise GPS coordinates.
* **Confirmed Session Meeting Details:** In-person meeting details (e.g., library room numbers) are visible only to confirmed exchange participants within private booking details or direct chat after booking confirmation.

---

## 6. Domain & Dependency Boundaries

* **Modular Monolith Architecture:** Maintain domain isolation within the TypeScript monorepo. Do not convert domains into microservices or distributed micro-frontends.
* **Strict Domain Ownership:** Each database table is owned exclusively by one domain module. Direct queries or mutations on tables owned by another domain are prohibited; modules must use published domain service interfaces.
* **Multi-Domain Atomic Transactions:** When operations span multiple domains (e.g., creating a booking and locking escrow), pass a Prisma transaction client (`tx`) across service boundaries.
* **Directed Dependencies:** Prevent circular module imports. Secondary cross-domain side effects must be handled via asynchronous events or worker queues.
* **Synchronous vs. Asynchronous Execution Boundary:**
  * **Synchronous & Transactional:** Booking creation, escrow locking, session completion, escrow settlement, cancellations, and refunds MUST be synchronous.
  * **Asynchronous (Worker Queues):** Email dispatch, push notifications, search index updates, and review expiration checks MUST execute asynchronously via BullMQ workers without blocking or rolling back database transactions.

---

## 7. Database & Migration Safety Rules

* **PostgreSQL 16+ Authoritativeness:** PostgreSQL enforces all ACID transactional guarantees, foreign keys, row locks, and full-text search (`tsvector`/GIN).
* **Prisma Migration Safety:** All schema modifications must execute via `prisma migrate dev` with clear, descriptive names. Raw, untracked production SQL scripts are forbidden.
* **Cascade Restrictions:** Use `RESTRICT` on financial records, bookings, sessions, and ledger entries to prevent cascade deletions.
* **Database Check Constraints:** Enforce non-negative wallet balances (`balance >= 0.00`), valid star ratings ($1 \le \text{rating} \le 5$), and positive credit amounts at the database level.
* **Seed Isolation:** System taxonomies (`SkillCategory`, `Skill`) and system accounts (`SYSTEM_RESERVE`, `TREASURY_SINK`) reside in `prisma/seed.ts`, strictly isolated from transactional test data.

---

## 8. API & Security Rules

* **Standard API Prefix & Envelope:** Route all endpoints under `/api/v1/`. Enforce standard envelopes: `{ success: true, data: { ... } }` or `{ success: false, error: { code: '...', message: '...' } }`.
* **Server-Side Cookie Authentication:** Authenticate requests via signed, `HttpOnly`, `Secure`, `SameSite=Lax` cookies. Never trust user IDs provided in client request bodies to identify the caller.
* **Strict Input Validation:** Enforce typed DTO payload validation using Zod or `class-validator` pipes (`whitelist: true, forbidNonWhitelisted: true`).
* **Idempotency Safeguards:** Mutating endpoints (`/bookings`, `/attest-completion`, `/disputes/:id/resolve`) must support idempotency keys to prevent duplicate execution on network retries.
* **Error Masking:** Database error stack traces, raw SQL queries, and internal system exceptions must never be returned to clients in production responses.
* **Password Hashing:** Hash passwords using `Argon2id` (or `bcrypt` with work factor $\ge 12$).
* **Gated Messaging:** Direct messaging is permitted only after a listing inquiry, proposal submission, or active booking. Unsolicited cold messaging is prohibited. Chat threads transition to read-only 48 hours after settlement or immediately upon cancellation.

---

## 9. Testing & Completion Requirements (Definition of Done)

* **Non-Authoritative Frontend:** The Next.js client is strictly a presentation layer. It must never calculate balances, authorize state transitions, or enforce cancellation rules. Optimistic updates on wallet balances or booking statuses before verified API HTTP 200/201 responses are prohibited.
* **Responsive & Accessible UI:** Views must be mobile-first ($< 768\text{px}$ to desktop), WCAG 2.2 AA compliant, use multi-modal state indicators (never color alone), and implement all 4 UI states: Loading (Skeletons), Empty, Error, and Success.
* **Zero Test Deletion Rule:** Never delete, skip, or disable failing tests to achieve a passing build. Fix the underlying code.
* **Mandatory Specialized Automated Tests:**
  * **Zero-Sum Invariant:** Assert $\sum \text{Debits} - \sum \text{Credits} = 0.00$ across all journal records.
  * **Concurrency Stress:** Simulate 50 concurrent booking attempts on a single credit; assert exactly 1 succeeds and 49 fail.
  * **Cancellation Boundary:** Assert credit routing at minute 12:01 (refund) vs. minute 11:59 (provider indemnity).
  * **Double-Blind Privacy:** Assert reviews remain hidden until both submit or 7 days elapse.
* **Zero Compilation Errors:** `tsc --noEmit` must complete with zero errors across all workspaces before declaring DoD complete.

---

## 10. Specification Conflict Resolution Protocol

If an assigned task, user request, or code modification conflicts with any rule in `AGENTS.md` or `docs/01_PRODUCT.md` through `docs/08_FILE_STRUCTURE.md`:

1. **HALT Code Execution:** Stop all code modifications immediately.
2. **Do Not Invent Behavior:** Do not write divergent code or assume an unapproved business rule.
3. **Identify Discrepancy:** State the precise document name and section containing the conflict.
4. **Report & Await Instructions:** Present the contradiction clearly and request formal specification resolution before proceeding.
