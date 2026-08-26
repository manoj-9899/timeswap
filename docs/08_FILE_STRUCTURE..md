# docs/08_FILE_STRUCTURE.md: TimeSwap Repository & Implementation Structure

This document defines the authoritative repository file tree, package boundaries, directory responsibilities, dependency flows, and architectural boundaries for TimeSwap. It serves as the physical structural blueprint for Antigravity and engineering contributors.

---

## 1. Primary Objective

The TimeSwap repository is structured as a TypeScript monorepo managed via `pnpm` workspaces and Turborepo. It organizes the system into a modular monolith that strictly enforces:

* **Separation of Presentation, Domain, and Persistence:** Next.js handles the client and UI rendering, NestJS Fastify encapsulates core business domains and API gateways, PostgreSQL acts as the single source of truth, and BullMQ manages asynchronous worker queues.
* **Domain Boundaries:** Backend modules own their domain logic and database interactions. Cross-domain interactions occur strictly via exported domain interfaces or internal domain events.
* **Protected Ledger Isolation:** Double-entry accounting, escrow locking, settlement, and balance verifications are isolated in a dedicated, high-integrity ledger module.
* **Shared Type & Contract Safety:** API contracts and validation schemas are defined once in a shared contracts package, ensuring end-to-end type safety between frontend mutations and backend validation pipes.

---

## 2. Derivation & Architectural Grounding

This file structure is directly derived from the approved specification documents:

* Application routes match the Screen Inventory (SCR-01 to SCR-18) defined in `docs/06_UI_UX.md`.
* Backend modules map to the domain entities and lifecycles defined in `docs/03_DOMAIN_DATABASE.md` and `docs/04_API.md`.
* The ledger and escrow folder structure reflects the double-entry accounting rules in `docs/05_CREDIT_LEDGER.md`.
* Monorepo boundaries and infrastructure configurations follow `docs/02_ARCHITECTURE.md` and `docs/07_IMPLEMENTATION.md`.

---

## 3. Complete Repository Structure

```
timeswap/
├── AGENTS.md
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── turbo.json
├── tsconfig.base.json
├── .gitignore
├── .editorconfig
│
├── apps/
│   ├── web/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.mjs
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.js
│   │   ├── public/
│   │   │   ├── favicon.ico
│   │   │   └── images/
│   │   └── src/
│   │       ├── app/
│   │       │   ├── layout.tsx
│   │       │   ├── page.tsx
│   │       │   ├── error.tsx
│   │       │   ├── not-found.tsx
│   │       │   ├── loading.tsx
│   │       │   ├── (public)/
│   │       │   │   ├── how-it-works/
│   │       │   │   │   └── page.tsx
│   │       │   │   ├── discover/
│   │       │   │   │   ├── page.tsx
│   │       │   │   │   ├── offers/[id]/
│   │       │   │   │   │   └── page.tsx
│   │       │   │   │   └── requests/[id]/
│   │       │   │   │       └── page.tsx
│   │       │   │   └── profiles/[handle]/
│   │       │   │       └── page.tsx
│   │       │   ├── (auth)/
│   │       │   │   ├── layout.tsx
│   │       │   │   ├── login/
│   │       │   │   │   └── page.tsx
│   │       │   │   ├── register/
│   │       │   │   │   └── page.tsx
│   │       │   │   ├── verify-email/
│   │       │   │   │   └── page.tsx
│   │       │   │   ├── forgot-password/
│   │       │   │   │   └── page.tsx
│   │       │   │   └── reset-password/
│   │       │   │       └── page.tsx
│   │       │   ├── (onboarding)/
│   │       │   │   └── onboarding/
│   │       │   │       └── page.tsx
│   │       │   ├── (dashboard)/
│   │       │   │   ├── layout.tsx
│   │       │   │   ├── dashboard/
│   │       │   │   │   └── page.tsx
│   │       │   │   ├── offers/
│   │       │   │   │   ├── page.tsx
│   │       │   │   │   └── create/
│   │       │   │   │       └── page.tsx
│   │       │   │   ├── requests/
│   │       │   │   │   ├── page.tsx
│   │       │   │   │   └── create/
│   │       │   │   │       └── page.tsx
│   │       │   │   ├── bookings/
│   │       │   │   │   ├── page.tsx
│   │       │   │   │   └── [id]/
│   │       │   │   │       └── page.tsx
│   │       │   │   ├── wallet/
│   │       │   │   │   └── page.tsx
│   │       │   │   ├── messages/
│   │       │   │   │   ├── page.tsx
│   │       │   │   │   └── [threadId]/
│   │       │   │   │       └── page.tsx
│   │       │   │   ├── notifications/
│   │       │   │   │   └── page.tsx
│   │       │   │   ├── profile/
│   │       │   │   │   └── edit/
│   │       │   │   │       └── page.tsx
│   │       │   │   └── disputes/
│   │       │   │       └── [id]/
│   │       │   │           └── page.tsx
│   │       │   └── (admin)/
│   │       │       ├── layout.tsx
│   │       │       ├── admin/
│   │       │       │   ├── disputes/
│   │       │       │   │   ├── page.tsx
│   │       │       │   │   └── [id]/
│   │       │       │   │       └── page.tsx
│   │       │       │   └── moderation/
│   │       │       │       └── page.tsx
│   │       ├── components/
│   │       │   ├── layout/
│   │       │   │   ├── header.tsx
│   │       │   │   ├── sidebar.tsx
│   │       │   │   ├── bottom-nav.tsx
│   │       │   │   ├── user-menu.tsx
│   │       │   │   └── wallet-capsule.tsx
│   │       │   ├── marketplace/
│   │       │   │   ├── offer-card.tsx
│   │       │   │   ├── request-card.tsx
│   │       │   │   ├── discovery-filters.tsx
│   │       │   │   ├── category-pill.tsx
│   │       │   │   └── skill-chip.tsx
│   │       │   ├── bookings/
│   │       │   │   ├── booking-card.tsx
│   │       │   │   ├── booking-modal.tsx
│   │       │   │   ├── session-countdown.tsx
│   │       │   │   ├── attestation-panel.tsx
│   │       │   │   └── cancellation-dialog.tsx
│   │       │   ├── wallet/
│   │       │   │   ├── balance-card.tsx
│   │       │   │   ├── escrow-breakdown.tsx
│   │       │   │   └── transaction-history-table.tsx
│   │       │   ├── messaging/
│   │       │   │   ├── thread-list.tsx
│   │       │   │   ├── chat-window.tsx
│   │       │   │   ├── message-bubble.tsx
│   │       │   │   └── message-composer.tsx
│   │       │   ├── reviews/
│   │       │   │   ├── review-modal.tsx
│   │       │   │   ├── review-card.tsx
│   │       │   │   └── star-rating-input.tsx
│   │       │   ├── disputes/
│   │       │   │   ├── dispute-form-modal.tsx
│   │       │   │   ├── evidence-timeline.tsx
│   │       │   │   └── resolution-outcome-card.tsx
│   │       │   └── shared/
│   │       │       ├── status-badge.tsx
│   │       │       ├── empty-state.tsx
│   │       │       ├── skeleton-card.tsx
│   │       │       └── error-boundary.tsx
│   │       ├── hooks/
│   │       │   ├── use-auth.ts
│   │       │   ├── use-wallet.ts
│   │       │   ├── use-bookings.ts
│   │       │   ├── use-messages.ts
│   │       │   ├── use-notifications.ts
│   │       │   └── use-debounce.ts
│   │       ├── lib/
│   │       │   ├── api-client.ts
│   │       │   ├── socket-client.ts
│   │       │   └── utils.ts
│   │       └── providers/
│   │           ├── auth-provider.tsx
│   │           ├── query-provider.tsx
│   │           └── socket-provider.tsx
│   │
│   ├── api/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── nest-cli.json
│   │   └── src/
│   │       ├── main.ts
│   │       ├── app.module.ts
│   │       ├── common/
│   │       │   ├── decorators/
│   │       │   │   ├── current-user.decorator.ts
│   │       │   │   ├── roles.decorator.ts
│   │       │   │   └── public.decorator.ts
│   │       │   ├── filters/
│   │       │   │   ├── http-exception.filter.ts
│   │       │   │   └── prisma-exception.filter.ts
│   │       │   ├── guards/
│   │       │   │   ├── session-auth.guard.ts
│   │       │   │   └── roles.guard.ts
│   │       │   ├── interceptors/
│   │       │   │   ├── logging.interceptor.ts
│   │       │   │   ├── transform.interceptor.ts
│   │       │   │   └── idempotency.interceptor.ts
│   │       │   └── pipes/
│   │       │       └── zod-validation.pipe.ts
│   │       └── modules/
│   │           ├── auth/
│   │           │   ├── auth.module.ts
│   │           │   ├── auth.controller.ts
│   │           │   ├── auth.service.ts
│   │           │   ├── session.service.ts
│   │           │   └── password.service.ts
│   │           ├── users/
│   │           │   ├── users.module.ts
│   │           │   ├── users.controller.ts
│   │           │   └── users.service.ts
│   │           ├── profiles/
│   │           │   ├── profiles.module.ts
│   │           │   ├── profiles.controller.ts
│   │           │   └── profiles.service.ts
│   │           ├── skills/
│   │           │   ├── skills.module.ts
│   │           │   ├── skills.controller.ts
│   │           │   └── skills.service.ts
│   │           ├── marketplace/
│   │           │   ├── marketplace.module.ts
│   │           │   ├── offers.controller.ts
│   │           │   ├── offers.service.ts
│   │           │   ├── requests.controller.ts
│   │           │   └── requests.service.ts
│   │           ├── discovery/
│   │           │   ├── discovery.module.ts
│   │           │   ├── discovery.controller.ts
│   │           │   └── discovery.service.ts
│   │           ├── bookings/
│   │           │   ├── bookings.module.ts
│   │           │   ├── bookings.controller.ts
│   │           │   ├── bookings.service.ts
│   │           │   ├── sessions.service.ts
│   │           │   └── state-machine/
│   │           │       └── booking-state-machine.ts
│   │           ├── ledger/
│   │           │   ├── ledger.module.ts
│   │           │   ├── ledger.controller.ts
│   │           │   ├── ledger.service.ts
│   │           │   ├── escrow.service.ts
│   │           │   ├── wallet.service.ts
│   │           │   ├── reconciliation.service.ts
│   │           │   └── invariants/
│   │           │       └── double-entry-guard.ts
│   │           ├── reviews/
│   │           │   ├── reviews.module.ts
│   │           │   ├── reviews.controller.ts
│   │           │   ├── reviews.service.ts
│   │           │   └── reputation-calculator.ts
│   │           ├── messaging/
│   │           │   ├── messaging.module.ts
│   │           │   ├── messaging.controller.ts
│   │           │   ├── messaging.service.ts
│   │           │   └── messaging.gateway.ts
│   │           ├── notifications/
│   │           │   ├── notifications.module.ts
│   │           │   ├── notifications.controller.ts
│   │           │   └── notifications.service.ts
│   │           ├── moderation/
│   │           │   ├── moderation.module.ts
│   │           │   ├── moderation.controller.ts
│   │           │   ├── disputes.service.ts
│   │           │   └── audit-log.service.ts
│   │           └── health/
│   │               ├── health.module.ts
│   │               └── health.controller.ts
│   │
│   └── worker/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── main.ts
│           ├── worker.module.ts
│           ├── queues/
│           │   ├── queue.constants.ts
│           │   └── queue.provider.ts
│           └── processors/
│               ├── auto-settlement.processor.ts
│               ├── session-reminder.processor.ts
│               ├── review-reveal.processor.ts
│               └── email-dispatch.processor.ts
│
├── packages/
│   ├── contracts/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── auth/
│   │       │   └── auth.contract.ts
│   │       ├── profiles/
│   │       │   └── profiles.contract.ts
│   │       ├── skills/
│   │       │   └── skills.contract.ts
│   │       ├── marketplace/
│   │       │   ├── offers.contract.ts
│   │       │   └── requests.contract.ts
│   │       ├── discovery/
│   │       │   └── discovery.contract.ts
│   │       ├── bookings/
│   │       │   └── bookings.contract.ts
│   │       ├── ledger/
│   │       │   └── ledger.contract.ts
│   │       ├── reviews/
│   │       │   └── reviews.contract.ts
│   │       ├── messaging/
│   │       │   └── messaging.contract.ts
│   │       ├── notifications/
│   │       │   └── notifications.contract.ts
│   │       ├── moderation/
│   │       │   └── moderation.contract.ts
│   │       └── common/
│   │           ├── pagination.schema.ts
│   │           └── response.schema.ts
│   │
│   ├── database/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── src/
│   │       ├── index.ts
│   │       ├── client.ts
│   │       └── extensions/
│   │           └── audit-extension.ts
│   │
│   ├── types/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts
│   │       ├── enums.ts
│   │       ├── user.types.ts
│   │       ├── booking.types.ts
│   │       ├── ledger.types.ts
│   │       └── session.types.ts
│   │
│   ├── ui/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── tailwind.config.ts
│   │   └── src/
│   │       ├── index.ts
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── textarea.tsx
│   │       ├── modal.tsx
│   │       ├── bottom-sheet.tsx
│   │       ├── badge.tsx
│   │       ├── card.tsx
│   │       ├── toast.tsx
│   │       ├── tabs.tsx
│   │       └── avatar.tsx
│   │
│   └── config/
│       ├── package.json
│       ├── eslint/
│       │   ├── base.js
│       │   ├── react.js
│       │   └── nest.js
│       ├── typescript/
│       │   ├── base.json
│       │   ├── nextjs.json
│       │   └── nestjs.json
│       └── tailwind/
│           └── preset.js
│
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile.web
│   │   ├── Dockerfile.api
│   │   └── Dockerfile.worker
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── ci/
│       └── workflows/
│           ├── ci.yml
│           └── e2e.yml
│
├── tests/
│   ├── e2e/
│   │   ├── playwright.config.ts
│   │   ├── auth.spec.ts
│   │   ├── onboarding.spec.ts
│   │   ├── booking-flow.spec.ts
│   │   └── dispute-settlement.spec.ts
│   └── setup/
│       ├── testcontainers.ts
│       └── global-setup.ts
│
└── docs/
    ├── 01_PRODUCT.md
    ├── 02_ARCHITECTURE.md
    ├── 03_DOMAIN_DATABASE.md
    ├── 04_API.md
    ├── 05_CREDIT_LEDGER.md
    ├── 06_UI_UX.md
    ├── 07_IMPLEMENTATION.md
    └── 08_FILE_STRUCTURE.md

```

---

## 4. Application Structure & Boundaries

### 4.1 Web Application (`apps/web`)

* **Purpose:** Next.js presentation tier rendering server-side landing pages and dynamic client dashboards.
* **Responsibilities:**
* Routing and server/client page transitions using Next.js App Router.
* Form management and client-side validation using `@timeswap/contracts` Zod schemas.
* Context-driven auth state via session cookies.
* Live messaging and notification subscription via WebSockets.


* **Allowed Dependencies:** `@timeswap/contracts`, `@timeswap/types`, `@timeswap/ui`, `@timeswap/config`, React, Tailwind CSS, TanStack Query, Lucide Icons.
* **Forbidden Dependencies:** `@timeswap/database`, Prisma Client, `@nestjs/*`, `bcrypt`/`argon2`, BullMQ, Redis. The frontend must **never** connect directly to the database or execute ledger math.

### 4.2 API Application (`apps/api`)

* **Purpose:** NestJS Fastify backend hosting all core domain services, REST endpoints, and WebSocket gateways.
* **Responsibilities:**
* Enforcing role-based access control (`@Roles()`) and session verification.
* Authoritative domain validation and state machine transitions.
* Executing double-entry ledger transactions and escrow locking within PostgreSQL ACID transactions.
* Ingesting and validating incoming HTTP requests using Fastify and Zod pipes.


* **Allowed Dependencies:** `@timeswap/database`, `@timeswap/contracts`, `@timeswap/types`, `@timeswap/config`, `@nestjs/*`, Fastify, Redis, BullMQ.
* **Forbidden Dependencies:** `@timeswap/ui`, Next.js, React.

### 4.3 Worker Application (`apps/worker`)

* **Purpose:** Dedicated BullMQ worker service executing asynchronous background jobs and scheduled cron tasks.
* **Responsibilities:**
* 10-minute cron scanning for eligible 24-hour auto-settlement sessions.
* Scheduled session reminder dispatches (24h and 2h prior).
* 7-day double-blind review reveal timer jobs.
* Transactional email delivery via external APIs (Resend/SendGrid).


* **Allowed Dependencies:** `@timeswap/database`, `@timeswap/types`, `@timeswap/config`, BullMQ, Redis, NodeMailer / Resend SDK.
* **Forbidden Dependencies:** `@timeswap/ui`, Next.js, React.

---

## 5. Frontend Architecture & Routing (`apps/web`)

The routing layout matches the Screen Inventory defined in `docs/06_UI_UX.md`:

### 5.1 Route Groups

* `(public)`: Publicly accessible marketing and discovery views.
* `/`: Landing Page (Hero, How it Works, Value Proposition).
* `/how-it-works`: Step-by-step explainer.
* `/discover`: Marketplace directory (Offers & Requests).
* `/profiles/[handle]`: Public user reputation profiles.


* `(auth)`: Unauthenticated session flows with centered container layout.
* `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`.


* `(onboarding)`: Full-screen onboarding wizard for new accounts (`/onboarding`).
* `(dashboard)`: Core authenticated experience wrapped in a standard app shell (Sidebar + Header on desktop; Bottom Nav + Header on mobile).
* `/dashboard`: Home overview (upcoming sessions, active listings).
* `/offers`, `/offers/create`: Service offer management.
* `/requests`, `/requests/create`: Help request management.
* `/bookings`, `/bookings/[id]`: Booking lifecycle and session container.
* `/wallet`: Balance summary and ledger history table.
* `/messages`, `/messages/[threadId]`: Direct messaging interface.
* `/notifications`: In-app notification center.
* `/profile/edit`: Profile details and skill tags.
* `/disputes/[id]`: Participant dispute progress tracker.


* `(admin)`: Restricted views for `MODERATOR` and `ADMIN` roles (`/admin/disputes`, `/admin/moderation`).

---

## 6. Backend Domain Architecture (`apps/api`)

The backend is partitioned into domain modules within `apps/api/src/modules/`:

| Module Directory | Primary Domain Responsibility | Exported Services & Gateways |
| --- | --- | --- |
| `auth/` | Credentials, session cookie issuance, password hashing. | `AuthService`, `SessionService` |
| `users/` | Base user account records and account status. | `UsersService` |
| `profiles/` | Public profiles, bios, coarse location, avatar updates. | `ProfilesService` |
| `skills/` | Curated category taxonomy and skill associations. | `SkillsService` |
| `marketplace/` | Supply (`ServiceOffer`) and demand (`HelpRequest`) CRUD. | `OffersService`, `RequestsService` |
| `discovery/` | Full-text search and category/location indexing. | `DiscoveryService` |
| `bookings/` | Calendar agreements, duration validation, session state machine. | `BookingsService`, `SessionsService` |
| `ledger/` | Protected double-entry accounting, escrow, and wallets. | `LedgerService`, `EscrowService`, `WalletService` |
| `reviews/` | Double-blind ratings, feedback, reputation metrics. | `ReviewsService` |
| `messaging/` | Context-gated direct chat threads and WebSocket push. | `MessagingService`, `MessagingGateway` |
| `notifications/` | In-app notification records and queue dispatches. | `NotificationsService` |
| `moderation/` | Dispute arbitration, audit logs, and account suspensions. | `DisputesService`, `AuditLogService` |

---

## 7. Protected Credit & Ledger Subsystem

Located strictly in `apps/api/src/modules/ledger/`:

```
apps/api/src/modules/ledger/
├── ledger.module.ts
├── ledger.controller.ts
├── ledger.service.ts              # Core double-entry balance engine
├── escrow.service.ts              # Escrow hold, lock, settlement, and refund methods
├── wallet.service.ts              # Available vs escrowed balance computations
├── reconciliation.service.ts      # Automated zero-sum invariant audit cron
└── invariants/
    └── double-entry-guard.ts      # Runtime sum(Debits) - sum(Credits) == 0 validation

```

### 7.1 Structural Invariant

* No other module (`BookingsModule`, `UsersModule`, `ModerationModule`) contains database write operations for wallet balances.
* All credit transfers must call `LedgerService` or `EscrowService`, passing the active Prisma transaction client (`tx`).

---

## 8. Database Package Architecture (`packages/database`)

Located in `packages/database/`:

* `prisma/schema.prisma`: The single declarative schema defining all models, enums, indexes, and foreign keys.
* `prisma/migrations/`: Automated, timestamped SQL migration files generated via `prisma migrate dev`.
* `prisma/seed.ts`: Curated skill categories, standard skills, and the root `SYSTEM_RESERVE` ledger account seed logic.
* `src/client.ts`: Instantiates and exports the singleton `PrismaClient` configured with connection pooling.
* `src/extensions/audit-extension.ts`: Prisma Client extension logging mutating operations to `AuditLog`.

---

## 9. Shared Packages Architecture

| Package Name | Physical Path | Consumed By | Purpose & Contents |
| --- | --- | --- | --- |
| `@timeswap/contracts` | `packages/contracts` | `apps/web`, `apps/api` | Zod validation schemas, API request DTOs, and response payload definitions. |
| `@timeswap/types` | `packages/types` | All Apps & Packages | Core domain enums, model interfaces, session shapes, and auth types. |
| `@timeswap/database` | `packages/database` | `apps/api`, `apps/worker` | Prisma schema, database client, migration runner, and seed scripts. |
| `@timeswap/ui` | `packages/ui` | `apps/web` | Reusable presentational UI primitives (buttons, modals, badges, inputs). |
| `@timeswap/config` | `packages/config` | All Apps & Packages | Shared ESLint configurations, base TypeScript configs, and Tailwind presets. |

---

## 10. Background Worker Structure (`apps/worker`)

Located in `apps/worker/src/`:

* `main.ts`: Entry point initializing BullMQ workers.
* `queues/queue.constants.ts`: Queue name definitions (`AUTO_SETTLEMENT_QUEUE`, `NOTIFICATION_QUEUE`, `EMAIL_QUEUE`).
* `processors/auto-settlement.processor.ts`: Cron consumer settling unconfirmed sessions after 24 hours.
* `processors/session-reminder.processor.ts`: Dispatches alerts 24 hours and 2 hours prior to scheduled start.
* `processors/review-reveal.processor.ts`: Reveals single submitted reviews after the 7-day timer elapses.
* `processors/email-dispatch.processor.ts`: Handles SMTP/API email delivery with exponential backoff retries.

---

## 11. Testing Structure & Organization

```
timeswap/
├── tests/
│   ├── e2e/                             # Playwright browser end-to-end test suites
│   │   ├── playwright.config.ts
│   │   ├── auth.spec.ts
│   │   ├── onboarding.spec.ts
│   │   ├── booking-lifecycle.spec.ts
│   │   └── dispute-resolution.spec.ts
│   └── setup/
│       ├── testcontainers.ts            # Spins up ephemeral PostgreSQL & Redis for integration tests
│       └── global-setup.ts
│
├── apps/api/src/modules/
│   ├── auth/__tests__/                  # Unit and integration tests for Auth
│   ├── bookings/__tests__/              # Booking state machine tests
│   └── ledger/__tests__/                # High-priority ledger invariant tests
│       ├── double-entry.spec.ts         # Zero-sum validation
│       └── concurrency-race.spec.ts     # Row-level lock / double-spend immunity
│
└── apps/web/src/components/
    └── [feature]/__tests__/             # Component and form unit tests (Vitest + React Testing Library)

```

---

## 12. Configuration & Environment Variables

### 12.1 Environment Structure

* Root `.env.example`: Template listing all required keys with development defaults.
* `apps/api/.env`: API-specific secrets (`DATABASE_URL`, `REDIS_URL`, `SESSION_SECRET`, `CORS_ORIGIN`).
* `apps/worker/.env`: Worker-specific credentials (`DATABASE_URL`, `REDIS_URL`, `RESEND_API_KEY`).
* `apps/web/.env.local`: Frontend public URLs (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_WS_URL`).

### 12.2 Invariant

Secrets (e.g., `SESSION_SECRET`, database passwords) must never be prefixed with `NEXT_PUBLIC_` or bundled into client code.

---

## 13. Infrastructure & Deployment Files

Located in `infrastructure/`:

* `docker/Dockerfile.web`: Multi-stage Dockerfile building the Next.js standalone server.
* `docker/Dockerfile.api`: Multi-stage Dockerfile building the NestJS Fastify API bundle.
* `docker/Dockerfile.worker`: Multi-stage Dockerfile building the BullMQ worker daemon.
* `docker-compose.yml`: Production-like local orchestration (PostgreSQL 16, Redis 7, MinIO).
* `ci/workflows/ci.yml`: GitHub Actions pipeline running lint, type-check, migrations, and unit/integration tests on pull requests.

---

## 14. Dependency Direction & Import Hierarchy

To prevent circular dependencies and architectural leaks, imports must flow strictly according to this directed graph:

```
[apps/web] ------> [@timeswap/contracts] <------ [apps/api]
    |                      |                         |
    v                      v                         v
[@timeswap/ui]     [@timeswap/types]       [@timeswap/database]
    |                                                ^
    v                                                |
[@timeswap/config] ----------------------------------+
                                                     |
[apps/worker] ---------------------------------------+

```

### Prohibited Import Paths

* `apps/web` **MUST NEVER** import from `apps/api`, `apps/worker`, or `@timeswap/database`.
* `packages/contracts` **MUST NEVER** import from `@timeswap/database` or `apps/*`.
* `packages/types` **MUST NEVER** import from any other internal package (it is the root type layer).
* `apps/api/src/modules/bookings` **MUST NEVER** import directly from `apps/api/src/modules/messaging` (use events or shared database client).

---

## 15. Domain Ownership Matrix

| Domain | Owning Directory | Allowed Module Dependencies | Prohibited Direct Action |
| --- | --- | --- | --- |
| **Auth** | `apps/api/.../auth/` | `users/` | Must not mutate profile data or credit accounts. |
| **Users** | `apps/api/.../users/` | None | Must not execute booking state transitions. |
| **Profiles** | `apps/api/.../profiles/` | `users/`, `skills/` | Must not alter booking statuses or credit balances. |
| **Skills** | `apps/api/.../skills/` | None | Must not modify user records. |
| **Marketplace** | `apps/api/.../marketplace/` | `profiles/`, `skills/` | Must not lock escrow or transition booking states. |
| **Discovery** | `apps/api/.../discovery/` | `marketplace/`, `skills/` | Read-only module; cannot perform write operations. |
| **Bookings** | `apps/api/.../bookings/` | `marketplace/`, `users/`, `ledger/` | Must not mutate ledger tables directly; must invoke `LedgerService`. |
| **Ledger** | `apps/api/.../ledger/` | `users/` (Isolated Core) | Must not manage UI state, scheduling, or chat messages. |
| **Reviews** | `apps/api/.../reviews/` | `bookings/`, `users/` | Must not reveal reviews before both submit or 7 days elapse. |
| **Messaging** | `apps/api/.../messaging/` | `users/`, `bookings/` | Must not allow unsolicited messaging without listing context. |
| **Notifications** | `apps/api/.../notifications/` | `users/` | Must not modify core domain entities. |
| **Moderation** | `apps/api/.../moderation/` | `bookings/`, `ledger/`, `users/` | Must not execute unbalanced dispute payouts. |

---

## 16. High-Risk Protected Subsystems

The following directories represent high-risk code that Antigravity must modify with extreme care:

1. `apps/api/src/modules/ledger/`: Contains the double-entry accounting engine and escrow locks. Unbalanced entries or missing row locks cause financial corruption.
2. `packages/database/prisma/migrations/`: Contains immutable schema migration scripts. Casual edits or drops corrupt existing environments.
3. `apps/api/src/common/guards/`: Contains session verification and role-based access controllers. Regressions cause security bypasses.
4. `packages/contracts/`: Defines cross-application validation rules. Breaking changes break both frontend and backend compilation.

---

## 17. Antigravity Coding Agent Guidelines

When Antigravity implements features within this repository:

1. **Consult `docs/07_IMPLEMENTATION.md`:** Ensure the task corresponds to the active implementation phase.
2. **Follow File Placement Rules:** Place new controllers, services, components, and DTOs in their designated domain directory. Do not create unstructured `utils/` or `helpers/` folders at the root.
3. **Use Shared Contracts:** Define all request payloads and response shapes in `packages/contracts` first; import them into both NestJS controllers and Next.js form components.
4. **Preserve Isolation:** Never add `@timeswap/database` to `apps/web/package.json`.
5. **Write Tests in Parallel:** Add unit tests directly in the domain's `__tests__/` directory.

---

## 18. File Structure Decision Summary

| Repository Area | Final Structure Choice | Architectural Rationale |
| --- | --- | --- |
| **Monorepo Layout** | Turborepo + `pnpm` workspaces | Fast caching, shared type contracts, and strict dependency boundaries. |
| **Frontend Framework** | Next.js 14+ App Router (`apps/web`) | Combines server rendering for discovery with client interactivity for bookings. |
| **Backend Framework** | NestJS Fastify (`apps/api`) | Modular monolith structure with native dependency injection and Fastify speed. |
| **Ledger Isolation** | Dedicated `modules/ledger` | Isolates double-entry accounting math from general CRUD modules. |
| **Contract Sharing** | Single `packages/contracts` | Guarantees end-to-end type safety and unified validation via Zod schemas. |
| **Worker Architecture** | Standalone Service (`apps/worker`) | Keeps time-consuming cron and email tasks from blocking HTTP request execution. |
| **Database Management** | Single Package (`packages/database`) | Centralizes Prisma schema, migrations, and seed scripts in one auditable location. |

---

## 19. Open Structural Questions

All repository structural decisions have been determined from the approved specification documents. There are no remaining structural ambiguities.