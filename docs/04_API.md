# docs/04_API.md: TimeSwap API & Communication Specification

This document defines the authoritative REST API contract, request/response structures, authorization rules, error conventions, and communication protocols for the TimeSwap platform. It serves as the definitive specification for implementation in Google AI Studio.

---

## 1. API Architecture

The TimeSwap communication layer follows a RESTful architecture hosted by a NestJS Fastify backend, consumed by the Next.js web application.

* **Base Path & Versioning:** All endpoints are versioned via the URI path prefix: `/api/v1`.
* **Payload Format:** Requests and responses transmit strictly as `application/json`.
* **Authentication Transport:** State-verified session tokens transmitted exclusively through signed, `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
* **Authorization & RBAC:** Endpoints enforce access guards based on user state (`UNVERIFIED`, `ACTIVE`, `SUSPENDED`) and administrative roles (`USER`, `MODERATOR`, `ADMIN`).
* **Validation Pipe:** Global input validation enforces strict DTO schemas (stripping unrecognized properties via `whitelist: true, forbidNonWhitelisted: true`).
* **Centralized Exception Handling:** Domain exceptions map to predictable HTTP status codes and uniform JSON error envelopes.

---

## 2. API Design Principles

1. **Domain-Driven Endpoints:** Endpoints represent meaningful domain workflows (e.g., `POST /bookings/:id/attest-completion`), never raw database table CRUD.
2. **Zero Client Trust:** All parameters, participant identities, durations, and credit balances are verified authoritatively on the backend.
3. **Non-Authoritative Frontend:** The client cannot transition booking states or manipulate credit balances directly.
4. **Idempotency on Critical Transitions:** Operations that modify balances or advance state machines support idempotency safeguards to prevent duplicate execution.
5. **Privacy by Default:** Endpoints return coarse location data (City, General District) and withhold exact meeting locations until a booking is confirmed.
6. **Uniform Response Envelopes:** All responses follow standard `data` or `error` JSON schemas.

---

## 3. Authentication API (`/api/v1/auth`)

Manages account registration, credential verification, session lifecycles, and password recovery.

### 3.1 Register Account

* **Endpoint:** `POST /api/v1/auth/register`
* **Access:** Public
* **Request Body:**
* `email` (string, required, valid email format)
* `password` (string, required, minimum 8 characters, at least 1 number and 1 special character)
* `display_name` (string, required, 2 to 50 characters)


* **Response (201 Created):**
* `data`: `{ "user_id": string, "email": string, "status": "UNVERIFIED", "message": "Verification email sent." }`


* **Errors:** `400 Bad Request` (validation failed), `409 Conflict` (email already registered).

### 3.2 Verify Email

* **Endpoint:** `POST /api/v1/auth/verify-email`
* **Access:** Public
* **Request Body:**
* `token` (string, required, verification token from email)


* **Response (200 OK):**
* `data`: `{ "user_id": string, "status": "ACTIVE", "email_verified": true }`


* **Errors:** `400 Bad Request` (invalid/expired token).

### 3.3 Login

* **Endpoint:** `POST /api/v1/auth/login`
* **Access:** Public
* **Request Body:**
* `email` (string, required)
* `password` (string, required)


* **Response (200 OK):**
* Sets `Set-Cookie` header with signed session identifier.
* `data`: `{ "user_id": string, "email": string, "roles": ["USER"], "profile_completed": boolean }`


* **Errors:** `401 Unauthorized` (invalid credentials), `403 Forbidden` (account suspended).

### 3.4 Logout

* **Endpoint:** `POST /api/v1/auth/logout`
* **Access:** Authenticated
* **Request Body:** None
* **Response (200 OK):**
* Clears session cookie; invalidates session token in datastore.
* `data`: `{ "success": true }`



### 3.5 Get Current Session (`Me`)

* **Endpoint:** `GET /api/v1/auth/me`
* **Access:** Authenticated
* **Response (200 OK):**
* `data`: `{ "user_id": string, "email": string, "roles": string[], "status": string, "profile": { "id": string, "handle": string, "display_name": string, "avatar_url": string, "is_completed": boolean } }`


* **Errors:** `401 Unauthorized`.

### 3.6 Password Recovery Workflows

* `POST /api/v1/auth/forgot-password` (Public): Accepts `email`, dispatches time-limited reset token. Returns standard success message regardless of email existence to prevent user enumeration.
* `POST /api/v1/auth/reset-password` (Public): Accepts `token` and `new_password`. Resets password and invalidates all existing sessions.
* `POST /api/v1/auth/change-password` (Authenticated): Accepts `current_password` and `new_password`.

---

## 4. User & Profile API (`/api/v1/users` & `/api/v1/profiles`)

Manages user identity details, public profiles, and onboarding setup.

### 4.1 Get Authenticated User Profile

* **Endpoint:** `GET /api/v1/users/me/profile`
* **Access:** Authenticated
* **Response (200 OK):** Detailed profile including account status, bio, location, notification settings, and wallet summary.

### 4.2 Update Authenticated User Profile

* **Endpoint:** `PATCH /api/v1/users/me/profile`
* **Access:** Authenticated
* **Request Body:**
* `display_name` (string, optional)
* `bio` (string, optional, max 500 characters)
* `city` (string, optional)
* `general_district` (string, optional)
* `delivery_preference` (enum: `ONLINE`, `IN_PERSON`, `BOTH`, optional)
* `avatar_url` (string, optional, valid URL)


* **Response (200 OK):** Updated profile record.

### 4.3 Complete Onboarding

* **Endpoint:** `POST /api/v1/users/me/profile/complete`
* **Access:** Authenticated (Requires uncompleted profile)
* **Request Body:**
* `handle` (string, required, unique alphanumeric slug)
* `bio` (string, required, minimum 30 characters)
* `city` (string, required)
* `general_district` (string, required)
* `offered_skill_ids` (array of strings, minimum 1 item)
* `learning_skill_ids` (array of strings, minimum 1 item)


* **Behavior:** Validates profile completeness, transitions profile status to `ACTIVE`, and triggers the one-time $1.0\text{ credit}$ onboarding grant from `SYSTEM_RESERVE`.


* **Response (200 OK):** `{ "profile_completed": true, "starter_credit_awarded": 1.00 }`
* **Errors:** `400 Bad Request` (missing required fields), `409 Conflict` (onboarding already completed).

### 4.4 Get Public Profile

* **Endpoint:** `GET /api/v1/profiles/:handle`
* **Access:** Public
* **Response (200 OK):** Public persona, display name, avatar, bio, coarse location (City/District), offered skills, learning goals, average star rating, completed exchange counts, and revealed reviews.



---

## 5. Skills API (`/api/v1/skills`)

Provides access to standardized taxonomy categories and user skill associations.

* `GET /api/v1/skills/categories` (Public): Lists all skill taxonomy categories.
* `GET /api/v1/skills` (Public): Search and list available skills. Query params: `category_id`, `q` (text search).
* `POST /api/v1/users/me/skills` (Authenticated): Attaches a skill to the authenticated profile. Body: `{ "skill_id": string, "role": "OFFERED" | "LEARNING" }`.
* `DELETE /api/v1/users/me/skills/:skillId` (Authenticated): Removes a skill association from the authenticated profile. Query params: `role`.

---

## 6. Service Offers API (`/api/v1/offers`)

Manages Provider supply listings ("I can help with X").

### 6.1 Create Service Offer

* **Endpoint:** `POST /api/v1/offers`
* **Access:** Authenticated
* **Request Body:**
* `title` (string, required, 5 to 100 characters)
* `description` (string, required, 20 to 2000 characters)
* `category_id` (string, required)
* `skill_ids` (array of strings, required)
* `supported_durations` (array of integers, required, subset of `[30, 60]`)
* `delivery_format` (enum: `ONLINE`, `IN_PERSON`, `HYBRID`, required)
* `city` (string, required if format includes `IN_PERSON`)
* `general_district` (string, required if format includes `IN_PERSON`)


* **Response (201 Created):** Created offer object with status `PUBLISHED`.

### 6.2 Service Offer Lifecycle Operations

* `GET /api/v1/offers/:id` (Public): Retrieves detailed offer listing and Provider reputation preview.
* `PATCH /api/v1/offers/:id` (Authenticated, Owner only): Updates listing content.
* `POST /api/v1/offers/:id/pause` (Authenticated, Owner only): Sets status to `PAUSED` (hidden from discovery).
* `POST /api/v1/offers/:id/publish` (Authenticated, Owner only): Sets status to `PUBLISHED`.
* `POST /api/v1/offers/:id/archive` (Authenticated, Owner only): Permanently archives offer.
* `GET /api/v1/users/me/offers` (Authenticated): Lists all offers owned by the current user.

---

## 7. Help Requests API (`/api/v1/requests`)

Manages Requester demand listings ("I need help with X").

### 7.1 Create Help Request

* **Endpoint:** `POST /api/v1/requests`
* **Access:** Authenticated
* **Request Body:**
* `title` (string, required, 5 to 100 characters)
* `description` (string, required, 20 to 2000 characters)
* `category_id` (string, required)
* `skill_ids` (array of strings, required)
* `target_duration` (integer, required, strictly `30` or `60`)
* `preferred_format` (enum: `ONLINE`, `IN_PERSON`, required)
* `urgency` (enum: `URGENT`, `THIS_WEEK`, `FLEXIBLE`, required)
* `city` (string, optional)
* `general_district` (string, optional)


* **Response (201 Created):** Created request object with status `OPEN`.

### 7.2 Help Request Lifecycle Operations

* `GET /api/v1/requests/:id` (Public): Retrieves request details and Requester profile preview.
* `PATCH /api/v1/requests/:id` (Authenticated, Owner only): Updates request details.
* `POST /api/v1/requests/:id/close` (Authenticated, Owner only): Closes request.
* `GET /api/v1/users/me/requests` (Authenticated): Lists all requests created by the current user.
* `POST /api/v1/requests/:id/proposals` (Authenticated): A Provider submits a proposal to help. Body: `{ "proposed_start_time": ISO8601, "duration_minutes": 30 | 60, "message": string }`.

---

## 8. Discovery & Search API (`/api/v1/discovery`)

Provides multi-parameter search across marketplace listings and community members.

### 8.1 Discover Service Offers

* **Endpoint:** `GET /api/v1/discovery/offers`
* **Access:** Public
* **Query Parameters:**
* `q` (string, optional, full-text search)
* `category_id` (string, optional)
* `skill_id` (string, optional)
* `format` (enum: `ONLINE`, `IN_PERSON`, optional)
* `duration` (integer: `30` or `60`, optional)
* `city` (string, optional)
* `general_district` (string, optional)
* `page` (integer, default 1)
* `limit` (integer, default 20, max 50)


* **Response (200 OK):** Paginated array of active offers with Provider summary data.

### 8.2 Discover Help Requests

* **Endpoint:** `GET /api/v1/discovery/requests`
* **Access:** Public
* **Query Parameters:** Same filtering structure as offers, plus `urgency`.

### 8.3 Discover Community Members

* **Endpoint:** `GET /api/v1/discovery/members`
* **Access:** Public
* **Query Parameters:** `q`, `skill_id`, `city`, `general_district`, `page`, `limit`.

---

## 9. Booking & Exchange API (`/api/v1/bookings`)

Coordinates the core exchange lifecycle, scheduling, credit reservations, and completion attestations.

### 9.1 Create Booking Request

* **Endpoint:** `POST /api/v1/bookings`
* **Access:** Authenticated (Requester)
* **Headers:** `Idempotency-Key` (UUID, recommended)
* **Request Body:**
* `service_offer_id` (string, optional if proposal-based)
* `provider_id` (string, required)
* `scheduled_start_time` (ISO8601 string, required, must be in future)
* `duration_minutes` (integer, required, strictly `30` or `60`)
* `delivery_format` (enum: `ONLINE`, `IN_PERSON`, required)
* `meeting_location_notes` (string, optional, e.g., preferred coffee shop or meeting platform)
* `initial_message` (string, required, 10 to 500 characters)


* **Behavior:** Validates Requester available balance ($\ge 0.50$ for 30 min, $\ge 1.00$ for 60 min). Atomically creates `Booking`, initializes `Session`, and locks credits in `EscrowHold`.


* **Response (201 Created):** Booking details, status `PENDING_ACCEPTANCE`, and escrow hold confirmation.
* **Errors:** `400 Bad Request` (insufficient credits, invalid duration), `409 Conflict` (scheduling collision).

### 9.2 List Bookings

* **Endpoint:** `GET /api/v1/bookings`
* **Access:** Authenticated
* **Query Parameters:** `role` (`REQUESTER` | `PROVIDER`), `status` (`PENDING_ACCEPTANCE`, `CONFIRMED`, `COMPLETED`, `CANCELLED`, `DISPUTED`), `page`, `limit`.

### 9.3 Get Booking Details

* **Endpoint:** `GET /api/v1/bookings/:id`
* **Access:** Authenticated (Must be Requester, Provider, Moderator, or Admin)
* **Response (200 OK):** Full booking record, session execution state, attestation timestamps, meeting notes/links, and linked escrow status.

### 9.4 Accept Booking

* **Endpoint:** `POST /api/v1/bookings/:id/accept`
* **Access:** Authenticated (Provider only)
* **Response (200 OK):** Booking status updated to `CONFIRMED`.

### 9.5 Decline Booking

* **Endpoint:** `POST /api/v1/bookings/:id/decline`
* **Access:** Authenticated (Provider only)
* **Request Body:** `{ "reason": string }`
* **Behavior:** Transitions status to `CANCELLED`; atomically refunds $100\%$ of escrowed credits to Requester wallet.



### 9.6 Attest Session Completion

* **Endpoint:** `POST /api/v1/bookings/:id/attest-completion`
* **Access:** Authenticated (Requester or Provider)
* **Behavior:** Records user attestation timestamp. If both parties have attested (or Requester attests unilaterally post-session), status transitions to `COMPLETED` and credits are settled from `EscrowHold` to Provider `USER_WALLET`.


* **Response (200 OK):** `{ "booking_status": "COMPLETED", "settled": boolean }`

---

## 10. Credit & Wallet API (`/api/v1/wallet`)

Provides read-only access to user credit balances and immutable transaction histories.

### 10.1 Get Wallet Balance

* **Endpoint:** `GET /api/v1/wallet/balance`
* **Access:** Authenticated
* **Response (200 OK):**
* `data`: `{ "available_balance": 2.50, "escrowed_balance": 1.00, "total_balance": 3.50, "currency": "TIME_CREDIT" }`



### 10.2 Get Transaction Ledger History

* **Endpoint:** `GET /api/v1/wallet/transactions`
* **Access:** Authenticated
* **Query Parameters:** `page`, `limit`
* **Response (200 OK):** Paginated list of journal transactions:
* Transaction type (`ONBOARDING_GRANT`, `ESCROW_LOCK`, `SESSION_SETTLEMENT`, `CANCELLATION_REFUND`, `DISPUTE_SPLIT`), credit amount, entry direction (`DEBIT` vs `CREDIT`), timestamp, and associated booking summary.





(Note: There are no endpoints allowing clients to directly mutate wallet balances or execute manual transfers. All credit movements occur via internal domain services.)

---

## 11. Cancellation & No-Show API

Enforces the cancellation rules defined in `docs/01_PRODUCT.md`.

### 11.1 Cancel Booking

* **Endpoint:** `POST /api/v1/bookings/:id/cancel`
* **Access:** Authenticated (Requester or Provider)
* **Request Body:**
* `reason` (string, required, 10 to 500 characters)


* **Behavior Matrix:**
* **Requester Cancel $\ge 12\text{ hours}$ before start:** Booking `CANCELLED`; $100\%$ escrow refunded to Requester.


* **Requester Cancel $< 12\text{ hours}$ before start (Late):** Booking `CANCELLED`; $100\%$ escrow awarded to Provider as indemnity; late cancel recorded on Requester record.


* **Provider Cancel (Any time):** Booking `CANCELLED`; $100\%$ escrow refunded to Requester; cancellation strike recorded on Provider record.




* **Response (200 OK):** `{ "booking_status": "CANCELLED", "refund_issued": boolean, "indemnity_paid": boolean }`

### 11.2 Report No-Show

* **Endpoint:** `POST /api/v1/bookings/:id/report-no-show`
* **Access:** Authenticated (Must be called after scheduled session start time)
* **Request Body:** `{ "details": string }`
* **Behavior:** Transitions booking to `DISPUTED` for moderator review, or applies automatic no-show indemnity if un-contested.

---

## 12. Dispute API (`/api/v1/disputes` & `/api/v1/moderation/disputes`)

Provides dispute lodging and moderator resolution capabilities.

### 12.1 Open Dispute

* **Endpoint:** `POST /api/v1/disputes`
* **Access:** Authenticated (Requester or Provider within 24 hours of session end)
* **Request Body:**
* `booking_id` (string, required)
* `reason` (string, required, 20 to 1000 characters)
* `evidence_text` (string, optional)


* **Behavior:** Transitions `Booking` to `DISPUTED`, freezes `EscrowHold`, and suspends the 24-hour auto-settlement countdown timer.
* **Response (201 Created):** Created `DisputeCase` record.

### 12.2 Get Dispute Details

* **Endpoint:** `GET /api/v1/disputes/:id`
* **Access:** Authenticated (Case participants, Moderator, Admin)

### 12.3 Submit Dispute Evidence

* **Endpoint:** `POST /api/v1/disputes/:id/evidence`
* **Access:** Authenticated (Case participants)
* **Request Body:** `{ "evidence_text": string, "attachment_urls": string[] }`

### 12.4 Moderator Resolve Dispute

* **Endpoint:** `POST /api/v1/moderation/disputes/:id/resolve`
* **Access:** Authenticated (`MODERATOR` or `ADMIN` role only)
* **Request Body:**
* `outcome` (enum: `FULL_REFUND_REQUESTER`, `FULL_RELEASE_PROVIDER`, `SPLIT_50_50`, required)
* `resolution_notes` (string, required)


* **Behavior:** Executes the corresponding double-entry ledger settlement atomically and updates dispute status to `RESOLVED`.


* **Response (200 OK):** `{ "dispute_status": "RESOLVED", "outcome": string, "settled_at": ISO8601 }`

---

## 13. Review & Reputation API (`/api/v1/reviews`)

Enforces double-blind review submissions and public reputation views.

### 13.1 Submit Review

* **Endpoint:** `POST /api/v1/reviews`
* **Access:** Authenticated (Participants of a `COMPLETED` session only)
* **Request Body:**
* `booking_id` (string, required)
* `rating` (integer, required, 1 to 5)
* `attribute_tags` (array of strings, e.g., `["Punctual", "Patient", "Clear Explanations"]`)
* `comment` (string, required, 10 to 1000 characters)


* **Behavior:** Persists review with `is_revealed: false`. If both participants have submitted (or 7 days have elapsed), triggers asynchronous review reveal and updates cached profile reputation metrics.


* **Response (201 Created):** `{ "review_id": string, "is_revealed": boolean }`
* **Errors:** `400 Bad Request` (self-review attempt, invalid rating), `409 Conflict` (review already submitted).

### 13.2 List Public Reviews for User

* **Endpoint:** `GET /api/v1/users/:handle/reviews`
* **Access:** Public
* **Query Parameters:** `page`, `limit`
* **Response (200 OK):** Paginated array of revealed reviews (`is_revealed = true`).

---

## 14. Messaging API (`/api/v1/messages`)

Context-gated direct communication between exchange participants.

### 14.1 List Active Message Threads

* **Endpoint:** `GET /api/v1/messages/threads`
* **Access:** Authenticated
* **Response (200 OK):** List of conversation threads, participant summaries, last message snippets, and unread counts.

### 14.2 Get Thread Messages

* **Endpoint:** `GET /api/v1/messages/threads/:threadId`
* **Access:** Authenticated (Participants only)
* **Query Parameters:** `page`, `limit`
* **Response (200 OK):** Paginated list of messages in chronological order.

### 14.3 Send Message

* **Endpoint:** `POST /api/v1/messages/threads/:threadId/messages`
* **Access:** Authenticated (Participants only)
* **Request Body:**
* `content` (string, required, 1 to 2000 characters)


* **Behavior:** Verifies thread is `ACTIVE` (not `READ_ONLY` or `BLOCKED`). Appends message, broadcasts via WebSocket gateway, and enqueues unread notification.
* **Response (201 Created):** Created message object.

### 14.4 Mark Thread as Read

* **Endpoint:** `POST /api/v1/messages/threads/:threadId/read`
* **Access:** Authenticated
* **Response (200 OK):** `{ "unread_count": 0 }`

---

## 15. Activities API (Phase 2 Specification)

Group Activities (1-to-N workshops) are classified as **Phase 2**.

| Phase 2 Endpoint | Method | Scope | Planned Responsibility |
| --- | --- | --- | --- |
| `/api/v1/activities` | `POST` | Auth | Host creates group activity with max attendee limit. |
| `/api/v1/activities/:id` | `GET` | Public | View activity details, attendee count, and meeting schedule. |
| `/api/v1/activities/:id/join` | `POST` | Auth | Attendee registers and locks time credit. |
| `/api/v1/activities/:id/leave` | `POST` | Auth | Attendee unregisters before start; credit refunded. |

*(Note: These endpoints are excluded from the MVP build and will not be initialized in Phase 1.)*

---

## 16. Notifications API (`/api/v1/notifications`)

Manages in-app alert delivery and read-state synchronization.

* `GET /api/v1/notifications` (Authenticated): Retrieves paginated in-app alerts. Returns `unread_count`.
* `PATCH /api/v1/notifications/:id/read` (Authenticated): Marks a single notification as read.
* `POST /api/v1/notifications/read-all` (Authenticated): Marks all notifications for the user as read.

---

## 17. Admin & Moderation API (`/api/v1/moderation`)

Protected administrative endpoints accessible exclusively to `MODERATOR` and `ADMIN` roles.

* `GET /api/v1/moderation/disputes` (Moderator/Admin): List all disputes filtered by status (`OPEN`, `UNDER_REVIEW`).
* `GET /api/v1/moderation/audit-logs` (Admin only): Query system audit logs with actor, entity, and date filters.
* `POST /api/v1/moderation/users/:id/suspend` (Moderator/Admin): Suspend malicious user account; automatically cancels pending bookings.
* `POST /api/v1/moderation/users/:id/unsuspend` (Admin only): Reactivate suspended user.
* `POST /api/v1/moderation/listings/:id/takedown` (Moderator/Admin): Administratively unpublish abusive Service Offers or Help Requests.

---

## 18. Standard API Response Formats

### 18.1 Success Response Structure

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total_items": 45,
    "total_pages": 3,
    "has_next_page": true,
    "has_previous_page": false
  }
}

```

### 18.2 Error Response Structure

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Your available balance of 0.00 credits is insufficient for a 60-minute session.",
    "details": [
      {
        "field": "duration_minutes",
        "issue": "Requires minimum balance of 1.00 credit"
      }
    ],
    "timestamp": "2026-08-26T15:04:05.000Z",
    "request_id": "req_8f9a2b1c"
  }
}

```

### 18.3 Standard HTTP Status Code Mappings

| HTTP Status | Application Meaning |
| --- | --- |
| **`200 OK`** | Request succeeded; response payload returned. |
| **`201 Created`** | Resource created successfully (e.g., booking, listing). |
| **`400 Bad Request`** | Input validation failure or malformed payload. |
| **`401 Unauthorized`** | Missing, invalid, or expired session cookie. |
| **`403 Forbidden`** | Authenticated user lacks permission (e.g., non-moderator calling dispute resolution). |
| **`404 Not Found`** | Requested resource ID does not exist. |
| **`409 Conflict`** | State conflict (e.g., booking time slot collision, duplicate review). |
| **`422 Unprocessable`** | Domain rule violation (e.g., self-booking, cancellation within locked window). |
| **`429 Too Many Requests`** | Rate limit exceeded. |
| **`500 Internal Error`** | Unhandled backend exception (error details masked from client). |

---

## 19. Pagination Standard

The primary API standardizes on **Offset-Limit Pagination with Metadata Envelopes**.

* **Query Parameters:** `page` (integer, $\ge 1$, default `1`), `limit` (integer, $1 \le \text{limit} \le 50$, default `20`).
* **Response `meta`:** Contains `total_items`, `total_pages`, `has_next_page`, and `has_previous_page`.
* **Rationale:** Predictable for UI page navigation in marketplace directories and audit logs.

---

## 20. Filtering & Sorting Conventions

* **Filters:** Passed as lowercase snake_case query parameters (e.g., `?category_id=cat_123&format=ONLINE`).
* **Sorting:** Controlled via two standardized query parameters:
* `sort_by`: Field identifier (e.g., `created_at`, `rating_average`).
* `sort_order`: Direction strictly restricted to `asc` or `desc` (default `desc`).



---

## 21. Idempotency Specification

To prevent accidental duplicate executions resulting from network retries or double-clicks, mutating endpoints accept an optional `Idempotency-Key` header (UUID v4).

* **Protected Operations:**
* `POST /api/v1/bookings` (Prevents duplicate escrow locks).


* `POST /api/v1/bookings/:id/attest-completion` (Prevents duplicate settlement calls).


* `POST /api/v1/moderation/disputes/:id/resolve` (Prevents duplicate dispute payouts).




* **Mechanism:** The backend records the `Idempotency-Key` in Redis for 120 seconds. Identical requests within this window return the cached response without re-executing domain transactions.

---

## 22. Concurrency & Race Condition Safeguards

* **Credit Reservation Safeguards:** Booking creation and escrow locking execute within explicit PostgreSQL database transactions (`prisma.$transaction`) with row-level locks on `LedgerAccount` records (`SELECT ... FOR UPDATE`).


* **Double-Spending Prevention:** If two booking requests arrive simultaneously for a user with only $1.0\text{ credit}$, the first transaction locks the account row, deducts the credit, and the second transaction fails immediately with `INSUFFICIENT_CREDITS`.
* **Settlement Atomicity:** Session completion confirmation verifies that the associated `EscrowHold` is in state `HELD`. Once settled, the hold transitions to `SETTLED` in the same transaction, blocking any concurrent settlement attempts.



---

## 23. Rate Limiting Rules

Enforced via Redis sliding-window limiters:

| Endpoint Route Pattern | Rate Limit Window | Maximum Requests | Target Key |
| --- | --- | --- | --- |
| `/api/v1/auth/login` | 1 Minute | 5 Requests | Client IP |
| `/api/v1/auth/register` | 1 Hour | 3 Requests | Client IP |
| `/api/v1/auth/forgot-password` | 1 Hour | 3 Requests | Client IP + Email |
| `/api/v1/messages/threads/:id/messages` | 1 Minute | 30 Messages | Authenticated User ID |
| `/api/v1/bookings` | 1 Hour | 10 Bookings | Authenticated User ID |
| `/api/v1/discovery/*` | 1 Minute | 60 Requests | Client IP |

---

## 24. API Security Requirements

* **Cookie Protection:** Session cookies configured with `HttpOnly = true`, `Secure = true`, `SameSite = Lax`, and `Path = /`.
* **Payload Size Constraints:** Body parser limits set to $100\text{ KB}$ for standard JSON payloads; file uploads route directly to S3 via pre-signed URLs.
* **CORS Whitelist:** Explicit origin whitelisting allowing only the Next.js web application domain.
* **Security Headers:** `@fastify/helmet` injects HSTS, X-Content-Type-Options, and Content-Security-Policy headers.

---

## 25. API Versioning Strategy

* **URI Prefixing:** Major versions are declared in the URL path (`/api/v1/`).
* **Backwards Compatibility:** Minor additive changes (e.g., adding a new optional field to a response) do not increment the major version. Breaking changes (e.g., removing fields, changing required request parameters) mandate an `/api/v2/` release.

---

## 26. API Contract Summary

| Domain | Base Route | Authentication | Core Responsibility |
| --- | --- | --- | --- |
| **Auth** | `/api/v1/auth` | Public / Auth | Registration, verification, login, session tokens, passwords. |
| **Users** | `/api/v1/users` | Authenticated | Own profile management, onboarding finalization, settings. |
| **Profiles** | `/api/v1/profiles` | Public | Public user personas, reputation summaries, revealed reviews.

 |
| **Skills** | `/api/v1/skills` | Public / Auth | Taxonomy categories, skill search, profile skill tagging. |
| **Offers** | `/api/v1/offers` | Public / Auth | Service offer listing CRUD and lifecycle states. |
| **Requests** | `/api/v1/requests` | Public / Auth | Help request listing CRUD and provider proposals. |
| **Discovery** | `/api/v1/discovery` | Public | Multi-parameter search across offers, requests, and members. |
| **Bookings** | `/api/v1/bookings` | Authenticated | Booking requests, acceptance, cancellation, attestations. |
| **Wallet** | `/api/v1/wallet` | Authenticated | Balance queries and immutable double-entry ledger history.

 |
| **Disputes** | `/api/v1/disputes` | Authenticated | Lodging disputes and evidence submission. |
| **Reviews** | `/api/v1/reviews` | Public / Auth | Double-blind review submission and public review lists. |
| **Messages** | `/api/v1/messages` | Authenticated | Context-gated direct 1-on-1 participant messaging. |
| **Notifications** | `/api/v1/notifications` | Authenticated | In-app alert feeds and read-status management. |
| **Moderation** | `/api/v1/moderation` | Moderator/Admin | Dispute arbitration, account suspensions, audit logs. |

---

## 27. API Invariants

The following invariants must never be violated in controller, service, or gateway implementations:

1. **Backend Authoritativeness:** No business rule, balance deduction, or role check may rely solely on client assertions.
2. **No Direct Wallet Writes:** The API must not expose endpoints that directly update credit balances outside verified session lifecycles.


3. **Double-Spending Prevention:** Concurrent requests attempting to spend the same credit must fail atomically.


4. **Exact Duration Enforcement:** Booking creation must reject any duration other than `30` or `60` minutes.
5. **Cold Outreach Gating:** Direct messaging threads cannot be created without an associated active booking or listing proposal.
6. **Location Privacy Preservation:** Public discovery and profile endpoints must never expose exact street addresses or coordinates.
7. **Strict Dispute Scope:** Moderator dispute resolution is restricted strictly to `FULL_REFUND_REQUESTER`, `FULL_RELEASE_PROVIDER`, or `SPLIT_50_50`.
8. **Double-Blind Integrity:** Review endpoints must not return unrevealed review text or ratings until both parties submit or 7 days elapse.

---

## 28. API Decisions Resolved

The following API implementation parameters have been finalized for the MVP.

### 1. Pre-Signed Upload Expiration

S3-compatible pre-signed upload URLs will expire after **15 minutes**.

The upload authorization is short-lived and must only grant access to the specific intended upload operation and object path.

Expired URLs must require the client to request a new authorized upload URL.

### 2. Meeting URL Input Timing

For online sessions, meeting URLs may be added or edited by the authorized session provider **any time after booking confirmation and before the scheduled session start time**.

A meeting URL is not required at the exact moment of booking acceptance.

The final meeting URL must be visible only to the confirmed booking participants and authorized moderators where required.

### 3. Dispute Resolution Notifications

A completed dispute resolution must trigger both:

- an immediate **in-app notification**, and
- an **email notification** processed asynchronously through the background job system.

The API request or moderator action must not wait for email delivery to complete.

The background worker is responsible for asynchronous email delivery and retry handling.
