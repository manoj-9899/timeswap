# docs/02_ARCHITECTURE.md: TimeSwap Technical Architecture

This document defines the system architecture, component boundaries, domain structure, data flow, security model, and deployment strategy for TimeSwap. It translates the product definitions from `docs/01_PRODUCT.md` into an engineering specification for implementation in Google Antigravity.

---

## 1. Architecture Goal

The TimeSwap architecture is designed to deliver a robust, maintainable, and secure production platform. It prioritizes:

* **Transactional Correctness:** Ensuring that non-monetary credit accounting, escrow locking, and state transitions are strictly consistent, audit-logged, and immune to race conditions.


* **Modular Monolith Design:** Enforcing strict domain boundaries within a single deployable backend service to prevent premature distributed-system complexity while keeping paths clear for future scaling.
* **Developer and AI Velocity:** Utilizing a strongly typed TypeScript ecosystem across the entire stack (Next.js, NestJS, Prisma) to maximize type safety, linting, and automated code generation accuracy.
* **Pragmatic MVP Scope:** Deferring advanced graph algorithms, automated WebRTC telemetry, and complex monetary decay systems in favor of proven relational models and asynchronous worker queues.

---

## 2. Approved Technology Direction

| Layer / Concern | Technology Selection | Architectural Rationale |
| --- | --- | --- |
| **Frontend Framework** | Next.js (React, TypeScript, Tailwind CSS) | App Router architecture, Server Components for high performance, dynamic client interactivity for messaging and scheduling. |
| **Backend Framework** | NestJS (Fastify Adapter, TypeScript) | Modular architecture, native dependency injection, decorators for declarative role-based access control (RBAC), and high-throughput HTTP execution via Fastify. |
| **Database** | PostgreSQL 16+ | ACID transactional guarantees, strong foreign key constraints, row-level locking for wallet operations, and native Full-Text Search (`tsvector`/GIN).

 |
| **ORM / Data Access** | Prisma | Type-safe schema definition, automated migrations, and structured transaction orchestration (`prisma.$transaction`). |
| **Cache & Queues** | Redis 7+ with BullMQ | Low-latency session caching, sliding-window rate limiting, and durable background job execution (reminders, auto-settlement cron). |
| **Semantic Search** | PostgreSQL Full-Text Search (MVP) | Native Postgres search handles MVP volume; `pgvector` extension deferred to Phase 2 for vector embeddings. |
| **Authentication** | Server-Managed Sessions / HTTP-Only Cookies | State-verified session tokens stored in secure, `HttpOnly`, `SameSite=Lax` cookies; passwords hashed with `Argon2id` or `bcrypt`. |
| **Storage** | S3-Compatible Object Storage (Cloudflare R2 / AWS S3) | Pre-signed upload URLs for avatars and listing attachments, keeping large binary payloads out of PostgreSQL. |
| **Deployment** | Docker Containers on Managed Infrastructure | Containerized API and worker services; managed PostgreSQL and Redis instances; Next.js hosted on a Node-capable container or edge platform. |

---

## 3. Overall System Architecture

TimeSwap follows a Modular Monolith architecture pattern. The system consists of a unified Next.js web application consuming a centralized NestJS Fastify API, supported by PostgreSQL as the authoritative datastore and Redis/BullMQ for asynchronous job processing.

### 3.1 High-Level Component Flow

1. **Client Tier:** The user interacts with the Next.js frontend via a web browser or mobile browser. Next.js handles server-rendered UI and client-side interactions.
2. **API Gateway & Routing Tier:** The NestJS API receives HTTP requests over TLS. Fastify routes requests through global security middleware (CORS, Helmet, Rate Limiting, Cookie Parsing) to domain-specific controllers.
3. **Domain Layer:** Controllers delegate to domain services (e.g., `BookingsService`, `LedgerService`). Services encapsulate business rules, enforce domain invariants, and communicate across boundaries via internal module interfaces or event emitters.
4. **Persistence Tier:** PostgreSQL acts as the single source of truth for all relational models, user identities, listings, bookings, and ledger entries.


5. **Async & Caching Tier:** Redis stores session metadata, rate-limit counters, and BullMQ task queues. Dedicated BullMQ background workers process asynchronous jobs (email dispatch, scheduled session auto-settlement checks, push alerts).
6. **Object Storage Tier:** Clients upload and retrieve binary assets (profile avatars) directly to/from S3-compatible storage via backend-issued pre-signed URLs.
7. **External Communication:** The worker tier communicates with external transactional email services (e.g., Resend, SendGrid) to deliver verification links, booking reminders, and dispute alerts.

---

## 4. Monorepo Architecture

The codebase is organized as a typed monorepo managed via `pnpm` workspaces and Turborepo.

* `apps/`
* `web/`: Next.js frontend application (App Router, Tailwind CSS, TanStack Query).
* `api/`: NestJS + Fastify REST API and WebSocket gateway.
* `worker/`: BullMQ worker service executing scheduled cron jobs and queue consumers.


* `packages/`
* `database/`: Prisma schema, migration scripts, seed data, and generated client exports.
* `types/`: Shared TypeScript domain models, API Request/Response DTOs, Enums, and validation interfaces.
* `config/`: Shared ESLint, Prettier, and base TypeScript configurations.
* `ui/`: Shared UI design tokens, components, and layout primitives.


* `infrastructure/`
* `docker/`: Dockerfiles for `api`, `web`, and `worker`.
* `docker-compose.yml`: Local container orchestration for PostgreSQL, Redis, and MinIO storage.


* `docs/`
* Permanent engineering documentation, architecture decision records (ADRs), and implementation guides.



---

## 5. Frontend Architecture (Next.js)

The frontend application provides a responsive web interface optimized for clarity, speed, and real-time user feedback.

### 5.1 Responsibilities

* **Routing and Rendering:** Next.js App Router utilizes Server Components for search engine discovery and fast initial page loads (e.g., landing page, public listing directory), transitioning to Client Components for interactive workflows (e.g., booking calendar, direct chat, review forms).
* **Data Fetching and Mutation:** Server Components query the API directly; Client Components use TanStack Query (or SWR) for caching, stale-while-revalidate behavior, and optimistic UI updates for chat messages.
* **Form Management & Client Validation:** React Hook Form coupled with Zod schemas matching shared backend DTO definitions ensures instant feedback prior to network dispatch.
* **Authentication State Management:** Context-driven authentication state derived from server-verified HTTP-only session cookies.
* **Authorization-Aware UI:** Conditionally rendering administrative navigation items, dispute action buttons, and booking controls based on authenticated user roles (`USER`, `MODERATOR`, `ADMIN`).

### 5.2 Frontend Invariant: Non-Authoritative Client

The frontend is strictly a presentation and input capture layer. The frontend must **never** be treated as the authority for:

* User credit balances or wallet states.
* Booking state machine transitions (`CONFIRMED`, `COMPLETED`, `CANCELLED`).
* Escrow settlement or refund authorizations.
* Dispute resolution outcomes.
* Role-based permission verifications.

All business validation, state transitions, and balance checks are executed authoritatively by the NestJS API.

---

## 6. Backend Architecture (Modular Monolith)

The NestJS backend organizes functionality into isolated domain modules. Each module encapsulates its controllers, services, repositories, and DTOs.

| Domain Module | Primary Responsibilities | Data Owned | Allowed Dependencies | Prohibited Actions |
| --- | --- | --- | --- | --- |
| **AuthModule** | Authentication, password hashing, session issuance, role guards, token lifecycle. | `UserCredential`, `SessionToken`, `PasswordReset` | `UsersModule` | Must not mutate user profiles, balances, or bookings. |
| **UsersModule** | Base user account records, account status (`ACTIVE`, `SUSPENDED`), role flags. | `User` | None | Must not execute ledger transactions directly. |
| **ProfilesModule** | Public profile attributes, bios, location settings, aggregate rating display. | `Profile`, `ProfileSkill` | `UsersModule`, `SkillsModule` | Must not modify booking states or balance records. |
| **SkillsModule** | Curated skill taxonomy, category indexing, custom skill tags. | `Skill`, `SkillCategory` | None | Must not alter user account states. |
| **MarketplaceModule** | CRUD for Service Offers and Help Requests, category filtering, search queries. | `ServiceOffer`, `HelpRequest` | `ProfilesModule`, `SkillsModule` | Must not mutate booking records or lock escrow credits. |
| **BookingsModule** | Coordinating scheduling, slot availability, booking state transitions. | `Booking`, `Session` | `MarketplaceModule`, `UsersModule`, `LedgerModule` | Must not directly update wallet balances; must call `LedgerModule` interface. |
| **LedgerModule** | Double-entry accounting, balance calculation, escrow locking, settlement, refunds.

 | `LedgerAccount`, `LedgerTransaction`, `JournalEntry`, `EscrowHold` | `UsersModule` | Must not handle booking logic, messaging, or UI presentation. |
| **ReviewsModule** | Double-blind review submission, review revelation timing, rating aggregation. | `Review`, `ReputationMetric` | `BookingsModule`, `UsersModule` | Must not reveal individual reviews before both parties submit or deadline elapses. |
| **MessagingModule** | Direct 1-on-1 chat threads, message persistence, thread access gating. | `MessageThread`, `Message` | `UsersModule`, `BookingsModule` | Must not allow unsolicited cold messaging without an active booking or listing context. |
| **NotificationsModule** | In-app notification creation, unread tracking, email queue dispatch. | `Notification`, `NotificationPreference` | `UsersModule` | Must not modify core domain entities. |
| **ModerationModule** | Dispute ticket management, evidence collection, moderator resolution commands. | `DisputeCase`, `AuditLog` | `BookingsModule`, `LedgerModule`, `UsersModule` | Must not bypass double-entry ledger balancing during dispute settlement. |

### 6.3 Prevention of Circular Dependencies

To prevent circular dependencies across modules:

* Modules communicate via directed dependencies (e.g., `BookingsModule` imports `LedgerModule`, but `LedgerModule` never imports `BookingsModule`).
* Cross-domain events (e.g., `SessionCompletedEvent`) are dispatched via an internal EventEmitter or BullMQ queue, allowing secondary modules (`NotificationsModule`, `ReviewsModule`) to react without tight coupling.

---

## 7. Domain Boundaries & Ownership Rules

1. **Strict Table Ownership:** Each database table is owned exclusively by one domain module. No module may execute direct Prisma queries against tables owned by another module.
2. **Service Interface Communication:** Cross-domain operations must occur via exported domain services (e.g., `BookingsService` invoking `LedgerService.lockEscrow(...)`).
3. **No Direct Wallet Alteration:** All operations affecting user balances must route through `LedgerService`. Direct SQL `UPDATE` statements on balance values are strictly forbidden.
4. **Isolated Transactions:** When an operation spans multiple domains (e.g., creating a booking and locking escrow), the calling service passes a Prisma transaction client (`tx`) to the dependent service to maintain atomic consistency.

---

## 8. Credit & Ledger Architecture

The credit system operates as a closed-loop double-entry accounting ledger.

### 8.1 Ledger Invariants

* **PostgreSQL as Source of Truth:** Balances are authoritatively determined by the sum of journal entries in PostgreSQL, not by Redis counters or cached profile attributes.


* **Double-Entry Equilibrium:** Every transaction consists of at least two journal entries. The sum of debits must equal the sum of credits ($\sum \text{Debits} = \sum \text{Credits}$).


* **Zero Negative Balances:** User asset accounts (`USER_WALLET`) cannot drop below $0.0\text{ credits}$.

### 8.2 Architectural Interaction Sequence

1. **Booking Creation:** The `BookingsModule` validates the request and calls `LedgerService.lockEscrow(...)` within an atomic database transaction.
2. **Escrow Lock:** `LedgerService` debits the Requester’s `USER_WALLET` and credits the `ESCROW_HOLD` account for that booking.
3. **Session Completion:** Upon mutual attestation (or auto-settle timeout), `BookingsModule` transitions the session to `COMPLETED` and invokes `LedgerService.settleEscrow(...)`.
4. **Settlement:** `LedgerService` debits `ESCROW_HOLD` and credits the Provider’s `USER_WALLET`.
5. **Cancellation / Dispute Refund:** If cancelled eligible for refund, `LedgerService` debits `ESCROW_HOLD` and credits `USER_WALLET` (Requester). If late cancellation indemnity applies, `LedgerService` debits `ESCROW_HOLD` and credits `USER_WALLET` (Provider).

---

## 9. Database Architecture (PostgreSQL)

PostgreSQL 16 serves as the primary, authoritative relational datastore.

### 9.1 Data Integrity & Concurrency

* **ACID Transactions:** Multi-table mutations execute within explicit transaction boundaries (`prisma.$transaction`).
* **Row-Level Locking:** Critical ledger operations utilize explicit row-level locking (`SELECT ... FOR UPDATE`) or optimistic concurrency version checks to prevent double-spending during concurrent booking attempts.


* **Database Constraints:** Check constraints enforce non-negative balances on user wallets (`balance >= 0`), valid rating ranges ($1 \le \text{rating} \le 5$), and positive transaction amounts.


* **Index Strategy:**
* B-tree indexes on foreign keys, user IDs, and booking statuses.
* Compound indexes on `(user_id, status)` and `(provider_id, scheduled_start)`.
* GIN indexes on `tsvector` columns for full-text search across titles, descriptions, and skill tags.


* **Migrations:** Managed through Prisma Migrate in continuous integration pipelines, ensuring deterministic schema rollouts across environments.

### 9.3 Why Redis Is Not the Source of Truth

Redis serves exclusively as an ephemeral cache and queue transport. Redis memory is volatile and susceptible to eviction or partition failures; it must never be used as the authoritative record for user credits, booking states, or identity credentials.

---

## 10. Redis and Background Workers

Redis and BullMQ handle asynchronous, decoupled operations without blocking synchronous HTTP request-response cycles.

### 10.1 Permitted Redis Use Cases

* **Session Metadata Cache:** Storing active session expiration tokens for fast lookup.
* **Rate Limiting:** Sliding-window request counters per IP and authenticated User ID.
* **Queue Backbone:** Storage backend for BullMQ job queues and delayed task scheduling.
* **Real-time Pub/Sub:** Relay for multi-instance WebSocket messaging.

### 10.2 BullMQ Worker Tasks

* **Auto-Settlement Cron:** Scans for completed sessions where 24 hours have elapsed without requester confirmation or dispute, triggering automated settlement.
* **Booking Reminder Dispatch:** Scheduled reminders sent 24 hours and 2 hours prior to session start times.
* **Review Expiration Job:** Automatically reveals submitted reviews after the 7-day double-blind deadline elapses.
* **Transactional Email Delivery:** Sending welcome emails, verification links, booking status updates, and dispute notifications via external SMTP/API providers.

### 10.3 Synchronous vs. Asynchronous Boundary

| Operation | Execution Model | Architectural Reason |
| --- | --- | --- |
| **Booking Creation & Escrow Lock** | Synchronous (Transactional) | Must immediately verify credit availability and lock balance atomically.

 |
| **Session Completion & Settlement** | Synchronous (Transactional) | Credit transfer must complete before presenting updated state to user.

 |
| **Cancellation & Refund** | Synchronous (Transactional) | Immediate balance restoration prevents user confusion and double-booking errors. |
| **Email & Push Alerts** | Asynchronous (BullMQ Worker) | Network latency from external email APIs must never delay HTTP responses. |
| **Search Index Updates** | Asynchronous (BullMQ Worker) | Decouples listing database writes from search vector index updates. |

---

## 11. Authentication & Authorization Architecture

### 11.1 Authentication Mechanics

* **Session Strategy:** Server-managed session records stored in PostgreSQL with hot caching in Redis. Session identifiers are transmitted via signed, `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
* **Password Storage:** Passwords hashed using `Argon2id` (or `bcrypt` with work factor $\ge 12$).
* **Registration & Email Verification:** Account creation creates an unverified user and enqueues a cryptographically secure, time-limited verification token sent via email.
* **Password Reset:** Generates a secure, single-use reset token valid for 15 minutes, invalidating all existing active sessions upon successful reset.

### 11.2 Authorization & Access Control

* **Role-Based Access Control (RBAC):** NestJS guards evaluate `@Roles('USER' | 'MODERATOR' | 'ADMIN')` decorators on route handlers.
* **Resource Ownership Verification:** Custom interceptors and guards verify that the requesting user owns the targeted resource (e.g., editing a profile, cancelling a booking) before domain service invocation.

---

## 12. Security Architecture

* **Input Validation:** Global Fastify validation pipe enforcing strict schema checks on all incoming DTOs using Zod or `class-validator`. Unknown payload properties are stripped (`whitelist: true, forbidNonWhitelisted: true`).
* **Rate Limiting:** Redis-backed rate limiting applied globally, with strict thresholds on authentication routes (`/auth/login`, `/auth/register`, `/auth/forgot-password`) and messaging endpoints.
* **Cross-Site Scripting (XSS) & Header Security:** `@fastify/helmet` enforces secure headers (Content Security Policy, X-Frame-Options, HSTS). Next.js enforces automatic context-aware HTML escaping.
* **Cross-Site Request Forgery (CSRF):** Protection via `SameSite=Lax` cookie policies combined with custom anti-CSRF request headers on state-changing API routes.
* **Secrets Management:** Environment variables injected at runtime via container configuration; no secrets or private keys committed to repositories.
* **Audit Logging:** Dedicated, append-only audit log table recording administrative actions, dispute settlements, and role modifications.

---

## 13. File Storage & Media

* **Asset Scope (MVP):** User profile avatars and listing image attachments.
* **Storage Provider:** S3-compatible cloud storage (Cloudflare R2, AWS S3, or MinIO for local development).
* **Upload Flow:**
1. The client requests an upload authorization from `api/media/presign-upload`.
2. The API validates user permissions, file type (JPEG, PNG, WebP only), and size ($\le 5\text{ MB}$), then generates a short-lived Pre-Signed S3 Upload URL.
3. The client uploads the binary directly to the storage provider.
4. The client notifies the API of upload completion, updating the profile avatar URL.


* **Security:** Public bucket access is restricted; assets are served via a secured CDN domain with strict caching headers.

---

## 14. Notification Architecture

* **In-App Notifications:** Real-time in-app alerts for booking confirmations, cancellations, messages, and dispute updates.
* **Email Notifications:** Transactional emails dispatched asynchronously via BullMQ for critical lifecycle events (e.g., session reminders, password resets).
* **Delivery Invariant:** A failure in the notification dispatch pipeline (e.g., email API downtime) must never roll back or block a successful booking, escrow, or settlement transaction.

---

## 15. Real-Time Communication Architecture

### 15.1 Scope for MVP

Real-time capabilities are restricted strictly to:

1. **Direct 1-on-1 Messaging:** Instant message exchange between confirmed booking participants.
2. **In-App Notification Pushes:** Immediate delivery of booking state changes while a user is actively browsing.

### 15.2 Implementation Strategy

* **Gateway:** NestJS WebSocket Gateway built on `Socket.io` or Fastify WebSocket.
* **Scaling Adapter:** Redis Adapter (`@socket.io/redis-adapter`) enabling message broadcasting across multiple horizontally scaled NestJS container instances.
* **Fallback:** Standard REST API fallback for message retrieval and chat history pagination.

---

## 16. Search & Matching Architecture

### 16.1 MVP Search Strategy

Search and discovery operate entirely within PostgreSQL without external search cluster dependencies (e.g., Elasticsearch).

* **Text Indexing:** Multi-column PostgreSQL Full-Text Search utilizing generated `tsvector` columns indexed with Generalized Inverted Indexes (GIN) across listing titles, descriptions, and category tags.
* **Taxonomy Filtering:** Exact-match relational filters for `category_id`, `duration_minutes` (30 or 60), `format` (`ONLINE` vs `IN_PERSON`), and `city`/`district`.
* **Sorting:** Deterministic ordering based on recency, verified provider rating, and completed exchange counts.

### 16.2 Phase 2 Search Strategy (Deferred)

* Natural language semantic embeddings using `pgvector` will be introduced in Phase 2 to allow contextual skill matching without altering the core relational schema.

---

## 17. Observability & Monitoring

* **Structured Logging:** Fastify's native `Pino` logger outputs structured JSON logs containing `timestamp`, `log_level`, `request_id`, `user_id`, and `execution_duration_ms`.
* **Error Tracking:** Sentry (or equivalent) integrated across both Next.js and NestJS to capture unhandled exceptions with full stack traces and context breadcrumbs.
* **Health Checks:** Standardized health probes exposed at `/health/live` (process responsiveness) and `/health/ready` (PostgreSQL and Redis connectivity checks).
* **Queue Monitoring:** BullMQ dashboard enabled in internal administrative environments to monitor job failure rates and queue latency.

---

## 18. Testing Architecture

Testing is structured across four rigorous tiers to validate platform stability and financial correctness.

```
+-------------------------------------------------------------------------+
| END-TO-END (E2E) TESTS (Playwright)                                     |
| - Complete User Lifecycles: Signup -> Profile Setup -> Listing Creation  |
|   -> Booking -> Session Completion -> Escrow Settlement -> Review        |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| INTEGRATION & API TESTS (Supertest + Testcontainers PostgreSQL/Redis)   |
| - Ledger Concurrency & Balance Protection                               |
| - Booking & Escrow State Machine Transitions                            |
| - RBAC Guards & Route Authorization                                     |
+-------------------------------------------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
| UNIT TESTS (Vitest / Jest)                                              |
| - Double-Entry Debit/Credit Invariant Mathematics                       |
| - Domain State Machine Transition Rules                                 |
| - Input DTO & Zod Schema Validation                                     |
+-------------------------------------------------------------------------+

```

### 18.1 Critical Test Requirements

* **Ledger Invariant Tests:** Continuous verification that all database operations maintain zero-sum journal entries ($\sum \text{Debits} - \sum \text{Credits} = 0$).


* **Concurrency Race Condition Tests:** Simulating 50 concurrent booking attempts against a single available credit to prove that exactly one booking succeeds and race-condition double-spending is impossible.
* **Escrow Lock Isolation Tests:** Proving that credits in `ESCROW_HOLD` cannot be spent on concurrent booking requests.

---

## 19. Deployment Architecture

The production deployment utilizes a clean containerized infrastructure model.

* **Next.js Web Application:** Deployed on Node-compatible container environments or Vercel, connected securely to the backend API.
* **NestJS API Service:** Stateless Docker container instances deployed behind a load balancer with TLS termination.
* **BullMQ Worker Service:** Dedicated Docker container running background consumers independently of HTTP traffic.
* **Managed Datastores:** Managed PostgreSQL 16+ instance with automated daily snapshots and managed Redis 7+ instance with persistent failover.
* **Automated CI/CD Pipeline:** GitHub Actions running linting, type-checking, automated unit/integration tests, Prisma migration execution, and Docker image publishing.

---

## 20. Scalability Strategy

TimeSwap scales efficiently as a modular monolith before requiring architectural decomposition.

1. **Stateless API Scaling:** NestJS API instances are fully stateless, allowing horizontal scaling behind a standard load balancer.
2. **Worker Scaling:** BullMQ workers scale horizontally to process higher queue throughput independently of API web traffic.
3. **Database Read Replicas:** As read-heavy marketplace discovery traffic grows, PostgreSQL read replicas can be attached via Prisma middleware to offload search and profile queries from the primary write master.
4. **Caching Layer:** Frequently queried public data (curated skill taxonomy, category listings) is cached in Redis with short TTLs to minimize database load.

---

## 21. Architectural Invariants

The following architectural invariants are absolute and must never be violated during implementation:

1. **PostgreSQL is the Sole Source of Truth:** Balances, credentials, bookings, and listings reside authoritatively in PostgreSQL.


2. **Frontend is Never Authoritative:** The client cannot validate balances, authorize transitions, or determine permissions.
3. **Double-Entry Ledger Enforcement:** All credit changes must occur via `LedgerService` using balanced debit/credit journal entries ($\sum \text{Debits} = \sum \text{Credits}$).


4. **No Direct Balance Mutations:** Direct SQL column updates (`UPDATE user SET balance = ...`) are strictly prohibited.
5. **Transactional Multi-Domain Operations:** State transitions spanning bookings and escrow must execute within a unified Prisma transaction (`prisma.$transaction`).
6. **No Secrets on Client:** API keys, database connection strings, and session signing secrets must never be exposed to the frontend.
7. **Strict DTO Validation:** Every API endpoint must enforce incoming request validation via typed schemas before executing domain logic.
8. **Asynchronous External I/O:** Third-party API calls (email delivery, external storage) must execute asynchronously via BullMQ queues and never block HTTP request lifecycles.

---

## 22. Architecture Decision Summary

| Dimension | Architectural Choice | Primary Reason |
| --- | --- | --- |
| **System Architecture** | Modular Monolith | Eliminates microservice operational overhead while enforcing clean domain separation. |
| **Frontend Stack** | Next.js 14+ (React, TypeScript, Tailwind) | Combines Server Components for fast initial loads with Client interactivity for chat and scheduling. |
| **Backend Stack** | NestJS (Fastify Adapter, TypeScript) | High performance, structured dependency injection, declarative security guards, and end-to-end type safety. |
| **Primary Database** | PostgreSQL 16+ | Strong ACID guarantees, robust concurrency controls, and built-in full-text search.

 |
| **ORM Layer** | Prisma | Schema-first type generation, structured migrations, and declarative transaction management. |
| **Cache & Queues** | Redis 7+ with BullMQ | Low latency, reliable job persistence, and lightweight background queue execution. |
| **Auth Strategy** | Server-Managed Sessions / HTTP-Only Cookies | Enhanced security against XSS token theft compared to client-stored JWTs. |
| **Object Storage** | S3-Compatible Storage (Cloudflare R2 / AWS S3) | Scalable binary storage using secure pre-signed client upload URLs. |
| **Search Engine** | PostgreSQL Full-Text Search (GIN Indexes) | Sufficient capability for MVP without requiring external search cluster maintenance. |
| **Deployment Model** | Containerized Docker Services | Reproducible environments, simple CI/CD pipelines, and cost-effective scaling. |

---

## 23. Architectural Decisions Resolved

The following engineering decisions have been finalized for the MVP and Phase 0 setup.

### 1. Real-Time Communication Protocol

Real-time direct chat will use **Socket.IO through NestJS** with a **Redis adapter** for scalable connection and event distribution.

The WebSocket implementation remains behind the NestJS application boundary so real-time messaging logic is not coupled directly to frontend components.

This provides a conventional real-time architecture for the MVP while allowing multiple application instances to coordinate connections through Redis if scaling is required.

### 2. Session Storage Mechanism

Active sessions will use **PostgreSQL as the authoritative source of truth**.

Redis may be used as a cache for active session validation and related short-lived session data, but Redis is not the sole authoritative record of authentication sessions.

Session invalidation, revocation, and security-sensitive validation must remain consistent with the authoritative database state.

### 3. Local Object Storage Tooling

Local development will use **Docker-based MinIO** for S3-compatible object storage.

This allows the development environment to closely match production-style S3 object storage behavior and supports testing of pre-signed upload flows without requiring production cloud storage credentials.

The local filesystem will not be used as an alternative object-storage implementation for the MVP.