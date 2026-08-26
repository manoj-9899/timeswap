# docs/03_DOMAIN_DATABASE.md: TimeSwap Domain Model & Database Specification

This document defines the authoritative domain model, entity responsibilities, relational structures, lifecycles, and database constraints for TimeSwap. It establishes the persistent data specification for implementation in Google AI Studio without introducing premature complexity.

---

## 1. Domain Model Overview

The TimeSwap domain model is organized into core functional modules designed for a modular monolith architecture.

| Entity | Domain Area | Target Phase | Core Purpose |
| --- | --- | --- | --- |
| **User** | Identity | MVP | Represents the core authenticated account, role flags, and operational status. |
| **UserCredential** | Identity | MVP | Encapsulates password hashes and authentication credentials away from base user data. |
| **SessionToken** | Identity | MVP | Tracks active server-managed user sessions and cookie validity. |
| **Profile** | Profiles | MVP | Represents the public-facing persona, bio, location, and derived trust metrics. |
| **SkillCategory** | Skills | MVP | High-level taxonomy grouping for organized discovery (e.g., Programming, Languages). |
| **Skill** | Skills | MVP | Standardized skills and user-defined tags for matching. |
| **ProfileSkill** | Skills | MVP | Junction mapping connecting profiles to skills offered and skills sought. |
| **ServiceOffer** | Marketplace | MVP | Structured listing for services a Provider can provide ("I can help with X"). |
| **HelpRequest** | Marketplace | MVP | Structured listing for tasks a Requester needs ("I need help with X"). |
| **Booking** | Bookings | MVP | The formal scheduling contract, participant agreement, and credit reservation container. |
| **Session** | Bookings | MVP | Operational session container tracking meeting location, attestations, and auto-settle deadlines. |
| **LedgerAccount** | Ledger | MVP | Represents double-entry accounts (`USER_WALLET`, `ESCROW_HOLD`, `SYSTEM_RESERVE`, `TREASURY_SINK`).

 |
| **LedgerTransaction** | Ledger | MVP | Atomic economic events (onboarding grant, escrow lock, settlement, refund, split).

 |
| **JournalEntry** | Ledger | MVP | Immutable debit and credit lines enforcing the zero-sum ledger invariant.

 |
| **EscrowHold** | Escrow | MVP | State record tracking credits locked during active bookings prior to settlement. |
| **Review** | Reputation | MVP | Double-blind ratings, attribute tags, and textual feedback exchanged post-session. |
| **MessageThread** | Messaging | MVP | Context-gated conversation container linked to a booking or listing inquiry. |
| **Message** | Messaging | MVP | Individual direct communication entries within an active thread. |
| **Notification** | Notifications | MVP | In-app alerts for booking state changes, reminders, and moderation notices. |
| **DisputeCase** | Moderation | MVP | Arbitration record for unfulfilled or problematic sessions. |
| **AuditLog** | Moderation | MVP | Immutable append-only audit trail for administrative overrides and security events. |
| **Activity** | Activities | Phase 2 | Group sessions (1-to-N meetups, workshops, and study groups). |
| **ActivityParticipant** | Activities | Phase 2 | Registration and attendance records for group activities. |
| **SkillEmbedding** | Discovery | Phase 2 | High-dimensional vector representations for `pgvector` semantic search. |
| **ExternalCalendarSync** | Bookings | Phase 2 | OAuth tokens and iCal feed connections for external calendar integration. |

---

## 2. Entity Responsibilities

### 2.1 User

* **Purpose:** Represents the fundamental identity and security principal.
* **Represents:** An individual account holder registered on TimeSwap.
* **Owns:** Authentication references, account status flags, role definitions, and relationship linkages.
* **Relationships:** One-to-one with `Profile`, `UserCredential`, and `LedgerAccount` (User Wallet); one-to-many with `ServiceOffer`, `HelpRequest`, `Booking`, `Notification`, and `MessageThread`.
* **Lifecycle States:** `UNVERIFIED`, `ACTIVE`, `SUSPENDED`, `DEACTIVATED`.
* **Business Constraints:** Email must be globally unique and normalized to lowercase. Cannot be deleted if associated with active escrow holds or pending bookings.

### 2.2 Profile

* **Purpose:** Stores public persona information, preferences, and aggregate trust statistics.
* **Represents:** The community-facing presentation of a User.
* **Owns:** Display name, handle, avatar URL, bio, location, format preferences, and cached reputation scores.
* **Relationships:** Belongs to exactly one `User`; many-to-many with `Skill` via `ProfileSkill`.
* **Lifecycle States:** `INCOMPLETE`, `ACTIVE`.
* **Business Constraints:** Handle must be unique, URL-safe, and alphanumeric.

### 2.3 SkillCategory & Skill

* **Purpose:** Provides taxonomy for categorization, search indexing, and filtering.
* **Represents:** A knowledge domain (Category) and a specific capability or topic (Skill).
* **Owns:** Category names, skill names, and standardized classification slugs.
* **Relationships:** `SkillCategory` has many `Skill` records; `Skill` is linked to `Profile` via `ProfileSkill`, and to `ServiceOffer` and `HelpRequest`.
* **Business Constraints:** Skill names must be unique within a category. System-curated skills are protected from arbitrary public deletion.

### 2.4 ProfileSkill

* **Purpose:** Connects users to the skills they teach or want to learn.
* **Represents:** The explicit association of a skill to a user profile, parameterized by intent.
* **Attributes:** Profile reference, Skill reference, and Skill Role (`OFFERED` vs `LEARNING`).
* **Relationships:** Links `Profile` to `Skill`.
* **Business Constraints:** A profile cannot link to the same skill in the same role multiple times.

### 2.5 Service Offer ("I Can Help With X")

* **Purpose:** Public listing detailing assistance a user is willing to provide.
* **Represents:** A supply listing in the peer marketplace.
* **Owns:** Title, description, category, supported durations (30 min, 60 min), format (`ONLINE`, `IN_PERSON`), and location data.
* **Relationships:** Belongs to a `User` (Provider); references `SkillCategory` and `Skill` tags; one-to-many with `Booking`.
* **Lifecycle States:** `DRAFT`, `PUBLISHED`, `PAUSED`, `ARCHIVED`.
* **Business Constraints:** Must have at least one valid duration and one format selected.

### 2.6 Help Request ("I Need Help With X")

* **Purpose:** Public listing broadcasting an unmet skill or task need.
* **Represents:** A demand listing in the peer marketplace.
* **Owns:** Title, description, category, target duration, format preference, location data, and timeframe urgency.
* **Relationships:** Belongs to a `User` (Requester); references `SkillCategory` and `Skill` tags; one-to-many with `Booking`.
* **Lifecycle States:** `OPEN`, `IN_FULFILLMENT`, `FULFILLED`, `CLOSED`.
* **Business Constraints:** Requires explicit target duration (30 or 60 minutes).

### 2.7 Booking & Session

* **Purpose:** Formalizes the exchange agreement (`Booking`) and manages the operational execution container (`Session`).
* **Represents:** `Booking` represents the scheduling contract and credit commitment between Requester and Provider. `Session` represents the execution details (meeting location/URL, completion attestations, dispute tracking, auto-settle deadline).
* **Owns:**
* `Booking`: Scheduled start/end times, selected duration, committed credit amount, booking status.
* `Session`: Meeting location string or URL, requester attestation timestamp, provider attestation timestamp, auto-settlement cutoff.


* **Relationships:** Connects Requester (`User`) and Provider (`User`); references `ServiceOffer` or `HelpRequest`; one-to-one with `EscrowHold`; one-to-one between `Booking` and `Session`; one-to-many with `Review`; one-to-one with `DisputeCase`.
* **Booking Lifecycle States:** `PENDING_ACCEPTANCE`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `DISPUTED`.
* **Business Constraints:** Requester and Provider must be distinct users. Scheduled duration must be exactly 30 or 60 minutes.

### 2.8 LedgerAccount, LedgerTransaction & JournalEntry

* **Purpose:** Enforces an immutable, double-entry financial ledger for all time-credit movements.


* **Represents:** Complete economic history and authoritative balances.
* **Owns:**
* `LedgerAccount`: Account type (`USER_WALLET`, `ESCROW_HOLD`, `SYSTEM_RESERVE`, `TREASURY_SINK`), owner reference, operational status.
* `LedgerTransaction`: Event type classification, reference IDs, transaction timestamp.
* `JournalEntry`: Direction (`DEBIT` or `CREDIT`), decimal credit amount, account reference.


* **Relationships:** A `LedgerTransaction` owns $\ge 2$ `JournalEntry` records; `JournalEntry` links to `LedgerAccount`.
* **Business Constraints:** The sum of debits must equal the sum of credits for every transaction ($\sum \text{Debits} = \sum \text{Credits}$). All entries are strictly append-only and immutable.



### 2.9 EscrowHold

* **Purpose:** Tracks credits locked during active bookings.
* **Represents:** The temporary restriction on spendable credits while an exchange is pending.
* **Owns:** Reference to the specific `ESCROW_HOLD` ledger account, locked amount, hold status.
* **Relationships:** One-to-one with `Booking` and `Session`; linked to `LedgerTransaction`.
* **Lifecycle States:** `HELD`, `SETTLED`, `REFUNDED`, `SPLIT`.
* **Business Constraints:** Cannot be released or refunded more than once.

### 2.10 Review

* **Purpose:** Facilitates post-exchange bilateral evaluation and builds community trust.


* **Represents:** Feedback submitted by one participant regarding another for a completed session.
* **Owns:** Star rating (1 to 5), qualitative attribute tags, written text, visibility flag (`is_revealed`).
* **Relationships:** Belongs to `Session`; authored by `User`; targets `User` (Subject).
* **Business Constraints:** Exactly one review per participant per session. Reviews remain hidden until both parties submit or 7 days elapse.

### 2.11 MessageThread & Message

* **Purpose:** Facilitates context-gated communication between exchange participants.
* **Represents:** A direct communication channel established for a booking or listing inquiry.
* **Owns:**
* `MessageThread`: Participant links, associated booking/listing reference, status (`ACTIVE`, `READ_ONLY`, `BLOCKED`).
* `Message`: Sender reference, text payload, read status, creation timestamp.


* **Relationships:** Links two `User` accounts; optional one-to-one link to `Booking`.
* **Business Constraints:** Direct cold outreach is prohibited; threads require an active listing inquiry or booking reference.

### 2.12 DisputeCase

* **Purpose:** Encapsulates formal arbitration for failed, incomplete, or contested sessions.
* **Represents:** An open grievance submitted by a participant requiring moderator review.
* **Owns:** Initiator reference, dispute reason, submitted evidence, resolution outcome (`FULL_REFUND_REQUESTER`, `FULL_RELEASE_PROVIDER`, `SPLIT_50_50`), moderator notes.
* **Relationships:** Belongs to `Session`; references resolving `User` (Moderator).
* **Lifecycle States:** `OPEN`, `UNDER_REVIEW`, `RESOLVED`.
* **Business Constraints:** Can only be opened within 24 hours post-session. Resolution must execute balanced ledger settlement.

### 2.13 AuditLog

* **Purpose:** Provides a tamper-evident audit record for administrative actions and security events.
* **Represents:** A historical log of privileged system modifications.
* **Owns:** Actor user ID, action type, target entity identifier, change payload (JSON), IP address, timestamp.
* **Business Constraints:** Strictly append-only; records cannot be updated or deleted.

---

## 3. User and Identity Domain

TimeSwap decouples core authentication credentials from the public user profile.

```
+-------------------+       1:1       +-------------------+
|  UserCredential   | <-------------> |       User        |
| - password_hash   |                 | - email           |
| - updated_at      |                 | - status          |
+-------------------+                 | - roles           |
                                      +-------------------+
                                                |
                                                | 1:1
                                                v
                                      +-------------------+
                                      |      Profile      |
                                      | - display_name    |
                                      | - handle          |
                                      | - bio             |
                                      | - location        |
                                      +-------------------+

```

### 3.1 Separation of Concerns

* **`User` Entity:** Handles security identity, normalized email, verification state, suspension status, and role assignments (`USER`, `MODERATOR`, `ADMIN`).
* **`UserCredential` Entity:** Stores sensitive cryptographic password hashes (`Argon2id`/`bcrypt`) and password reset timestamps, isolated from profile and marketplace queries.
* **`SessionToken` Entity:** Tracks active server-managed sessions, refresh tokens, IP addresses, and user-agent metadata.
* **`Profile` Entity:** Contains public-facing data (display name, unique handle, bio, avatar URL, coarse location, rating summaries).

### 3.2 Prosumer Architecture

The database model does not distinguish between "Provider Accounts" and "Requester Accounts". Every `User` record possesses equal structural capability to publish Service Offers, create Help Requests, book sessions, and earn/spend credits. "Provider" and "Requester" are contextual roles attached to individual `Booking` records.

### 3.3 Administrative Roles

Administrative capabilities are represented via a standardized role enum on the `User` entity:

* `USER`: Standard participant.
* `MODERATOR`: Authorized to manage reported content and arbitrate `DisputeCase` records.
* `ADMIN`: Full system authorization, user management, and ledger audit access.

---

## 4. Skills Domain

The skills architecture supports standardized discovery while allowing community flexibility.

### 4.1 Taxonomy Structure

* **`SkillCategory`:** High-level administrative groupings (e.g., `Technology & Programming`, `Design & Creative`, `Languages`, `Academics & Writing`, `Music & Audio`, `Lifestyle & Wellness`).
* **`Skill`:** Distinct capability records within a category (e.g., `Python`, `Figma`, `Spanish Conversation`, `Guitar Basics`, `Resume Review`).
* **`ProfileSkill`:** Junction entity linking `Profile` to `Skill`. Includes an enum attribute `SkillRole`:
* `OFFERED`: The user is competent and available to teach or help with this skill.
* `LEARNING`: The user is actively seeking help or mentorship in this skill.



### 4.2 Data Simplicity

The MVP intentionally omits complex proficiency matrices, years-of-experience sliders, or subjective numerical skill scores. Community trust is derived from completed session counts and post-exchange reviews.

---

## 5. Marketplace Domain

The marketplace domain models supply (`ServiceOffer`) and demand (`HelpRequest`).

### 5.1 Service Offer Structure

A Service Offer represents a Provider's availability to help.

* **Attributes:** Title, description, category reference, duration options (supports 30 min, 60 min, or both), delivery format (`ONLINE`, `IN_PERSON`, `HYBRID`), and coarse location data.
* **Lifecycle:**
* `DRAFT`: Private to the user; incomplete.
* `PUBLISHED`: Discoverable and bookable in the public marketplace.
* `PAUSED`: Temporarily hidden from public search by the provider.
* `ARCHIVED`: Permanently closed; historical references preserved.



### 5.2 Help Request Structure

A Help Request represents a Requester's open need for assistance.

* **Attributes:** Title, description, category reference, target duration (30 or 60 min), preferred format (`ONLINE`, `IN_PERSON`), coarse location data, and timeframe urgency tag (`URGENT`, `THIS_WEEK`, `FLEXIBLE`).
* **Lifecycle:**
* `OPEN`: Discoverable; accepting provider proposals.
* `IN_FULFILLMENT`: Booking accepted and scheduled.
* `FULFILLED`: Session completed and settled.
* `CLOSED`: Cancelled or expired by the requester.



---

## 6. Booking & Exchange Domain

The exchange domain separates the scheduling contract (`Booking`) from the operational execution and verification container (`Session`).

```
+-------------------------------------------------------------------------+
| BOOKING ENTITY                                                          |
| - requester_id                                                          |
| - provider_id                                                           |
| - service_offer_id / help_request_id                                    |
| - scheduled_start_time / scheduled_end_time                             |
| - duration_minutes (30 or 60)                                           |
| - credit_amount (0.50 or 1.00)                                          |
| - status (PENDING, CONFIRMED, CANCELLED, COMPLETED, DISPUTED)           |
+-------------------------------------------------------------------------+
                                     |
                                     | 1:1 Relationship
                                     v
+-------------------------------------------------------------------------+
| SESSION ENTITY                                                          |
| - booking_id                                                            |
| - delivery_format (ONLINE, IN_PERSON)                                   |
| - meeting_link / meeting_location_text                                  |
| - requester_attested_at (timestamp)                                     |
| - provider_attested_at (timestamp)                                      |
| - auto_settle_at (scheduled_end + 24 hours)                             |
+-------------------------------------------------------------------------+

```

### 6.1 Entity Separation Rationale

* **`Booking`** models the calendar commitment, participant pairing, credit pricing, and high-level workflow state machine.
* **`Session`** models the execution context: meeting URLs, location notes, completion confirmations (dual attestation timestamps), dispute flags, and the 24-hour auto-settlement countdown timer.

### 6.2 Booking Lifecycle States

* `PENDING_ACCEPTANCE`: Booking created by Requester; credits locked in Escrow; waiting for Provider approval.
* `CONFIRMED`: Provider accepted booking; session scheduled on calendars.
* `IN_PROGRESS`: Scheduled session time has arrived.
* `COMPLETED`: Session delivered; completion confirmed by both parties or auto-settlement elapsed; credits transferred to Provider.
* `CANCELLED`: Booking cancelled prior to or during session; credits refunded or indemnity paid based on policy.
* `DISPUTED`: A participant flagged an issue within 24 hours post-session; escrow frozen pending moderation.

---

## 7. Session Duration & Credit Mapping

The data model enforces strict temporal determinism. Custom or arbitrary session durations are rejected.

| Duration Setting | Stored Duration Value | Stored Credit Amount | Required Escrow Lock |
| --- | --- | --- | --- |
| **Half Session** | `30` (minutes) | `0.50` | `0.50` Time Credit |
| **Standard Session** | `60` (minutes) | `1.00` | `1.00` Time Credit |

The credit amount is stored as a fixed-precision decimal (`DECIMAL(6,2)`) directly on the `Booking` entity to prevent floating-point rounding errors and ensure explicit financial recording.

---

## 8. Credit Domain

The TimeSwap credit economy operates under strict non-monetary principles:

* **Valuation:** $1\text{ hour} = 1.00\text{ credit}$; $30\text{ minutes} = 0.50\text{ credits}$.


* **Starter Allocation:** $1.00\text{ credit}$ issued from `SYSTEM_RESERVE` upon completed onboarding.
* **Non-Convertible:** Credits cannot be purchased, sold, converted to fiat, or transferred outside verified session exchanges.


* **Balance Integrity:** A user's spendable balance is computed from double-entry ledger entries. Negative balances are structurally prohibited by database check constraints.

---

## 9. Ledger Domain (Double-Entry Accounting)

All credit modifications are recorded via balanced, double-entry journal records.

### 9.1 Account Infrastructure (`LedgerAccount`)

Every account in the system belongs to one of four classifications:

1. `USER_WALLET`: Prosumer asset account holding spendable credits.
2. `ESCROW_HOLD`: Segregated platform liability account holding credits committed to an active booking.
3. `SYSTEM_RESERVE`: Root platform equity account used for onboarding grants and system subsidies.
4. `TREASURY_SINK`: Platform account holding retired credits, dispute forfeitures, or future fees.



### 9.2 Transaction Modeling (`LedgerTransaction` & `JournalEntry`)

* A **`LedgerTransaction`** represents an atomic economic event. It stores the event classification (`transaction_type`), optional `booking_id` reference, and immutable creation timestamp.
* A **`JournalEntry`** represents a single debit or credit posting. It references a `LedgerTransaction`, a `LedgerAccount`, an `entry_type` (`DEBIT` or `CREDIT`), and an `amount`.

### 9.3 Accounting Conventions

TimeSwap follows standard deposit liability accounting:

* **`USER_WALLET` / `ESCROW_HOLD`:** Crediting an account increases its balance; debiting an account decreases its balance.
* **`SYSTEM_RESERVE`:** Debiting the reserve issues new credits into the ecosystem; crediting the reserve absorbs credits back into the platform.

```
Example: Onboarding Starter Credit ($1.00)
  Debit:  SYSTEM_RESERVE       $1.00
  Credit: USER_WALLET:{user}   $1.00
  Total Debits ($1.00) = Total Credits ($1.00)

Example: Booking Escrow Lock ($1.00)
  Debit:  USER_WALLET:{requester}    $1.00
  Credit: ESCROW_HOLD:{booking_id}   $1.00
  Total Debits ($1.00) = Total Credits ($1.00)

Example: Normal Session Settlement ($1.00)
  Debit:  ESCROW_HOLD:{booking_id}   $1.00
  Credit: USER_WALLET:{provider}     $1.00
  Total Debits ($1.00) = Total Credits ($1.00)

```

---

## 10. Escrow Domain

The `EscrowHold` entity models the custodial lifecycle of credits during an active exchange.

### 10.1 Escrow State Transitions

* **`HELD`:** Created simultaneously with a `Booking`. Credits are debited from the Requester's wallet and credited to the booking's dedicated `ESCROW_HOLD` account.
* **`SETTLED`:** Triggered upon dual completion confirmation or 24-hour auto-settlement timeout. Credits move from `ESCROW_HOLD` to the Provider's `USER_WALLET`.
* **`REFUNDED`:** Triggered upon eligible cancellation or moderator refund ruling. Credits move from `ESCROW_HOLD` back to the Requester's `USER_WALLET`.
* **`SPLIT`:** Triggered upon moderator 50/50 dispute arbitration. $50\%$ of credits are refunded to the Requester and $50\%$ are released to the Provider.

---

## 11. Cancellation, No-Show & Dispute Data

### 11.1 Cancellation Tracking

Cancellations are recorded directly on the `Booking` entity:

* `cancelled_by_user_id`: Reference to the initiating user.
* `cancellation_reason`: Text explanation provided by the user.
* `cancellation_type`:
* `REQUESTER_EARLY`: Cancelled $\ge 12\text{ hours}$ before start (Full refund).
* `REQUESTER_LATE`: Cancelled $< 12\text{ hours}$ before start (Full credit awarded to Provider as indemnity).
* `PROVIDER_EARLY`: Cancelled $\ge 12\text{ hours}$ before start (Full refund).
* `PROVIDER_LATE`: Cancelled $< 12\text{ hours}$ before start (Full refund; Provider reliability penalized).
* `MUTUAL`: Agreed cancellation (Full refund).



### 11.2 Dispute Tracking (`DisputeCase`)

* **Attributes:** `session_id`, `initiator_user_id`, `respondent_user_id`, `dispute_reason`, `evidence_text`, `status` (`OPEN`, `UNDER_REVIEW`, `RESOLVED`), `resolution_outcome` (`FULL_REFUND_REQUESTER`, `FULL_RELEASE_PROVIDER`, `SPLIT_50_50`), `resolution_notes`, `resolved_by_user_id` (Moderator), `resolved_at`.
* **Escrow Impact:** Opening a dispute immediately suspends auto-settlement timers and freezes the `EscrowHold` in a locked state until moderator resolution.

---

## 12. Reviews & Reputation Domain

### 12.1 Review Entity

* **Attributes:** `session_id`, `author_user_id`, `subject_user_id`, `rating` (Integer: 1 to 5), `attribute_tags` (Array/JSON: e.g., `["Punctual", "Clear Explanations", "Patient"]`), `comment_text`, `is_revealed` (Boolean, default `false`), `created_at`.
* **Double-Blind Mechanism:** `is_revealed` transitions to `true` if and only if both parties have submitted their review for the session, or 7 days have elapsed since session completion.

### 12.2 Reputation Storage & Computation

Reputation metrics are maintained as cached summary attributes on the `Profile` entity:

* `rating_average`: Decimal average of all revealed reviews received as a Provider and Requester.
* `completed_exchanges_count`: Integer count of successfully completed sessions.
* `reliability_score`: Percentage calculated as:

$$\text{Reliability} = 100 \times \frac{\text{Completed Sessions}}{\text{Completed Sessions} + \text{Late Cancellations} + \text{No-Shows}}$$

These values are updated asynchronously upon review revelation and cancellation events to ensure fast profile rendering.

---

## 13. Messaging Domain

TimeSwap restricts direct messaging to relevant marketplace interactions to prevent platform spam.

### 13.1 Entity Model

* **`MessageThread`:** Represents a conversation between two users. References `participant_one_id`, `participant_two_id`, optional `booking_id`, optional `listing_id`, and `thread_status` (`ACTIVE`, `READ_ONLY`, `BLOCKED`).
* **`Message`:** Represents an individual message. References `thread_id`, `sender_user_id`, `content_text`, `is_read` (Boolean), and `created_at`.

### 13.2 Access Constraints

* A thread is initialized only when a user sends a booking request, responds to a help request, or submits an inquiry on an active listing.
* The thread automatically transitions to `READ_ONLY` **48 hours** following session settlement, or immediately upon booking cancellation.

---

## 14. Activity / Community Domain (Phase 2)

Group Activities (1-to-N group sessions) are classified as **Phase 2**.

* **`Activity` (Phase 2):** Represents a group workshop, study group, or meetup organized by a host. Contains title, description, max participants, duration, location/meeting URL, and status.
* **`ActivityParticipant` (Phase 2):** Junction table tracking registered attendees, attendance status, and escrow links.
* *Note:* No tables or foreign keys for `Activity` are required in the MVP schema.

---

## 15. Location Data Privacy

To ensure physical safety, the platform enforces strict separation between public and private location data:

| Location Field | Storage Entity | Publicly Exposed? | Access Rule |
| --- | --- | --- | --- |
| **City** | `Profile`, `ServiceOffer`, `HelpRequest` | **Yes** | Visible in public search directories and listing cards. |
| **General District** | `Profile`, `ServiceOffer`, `HelpRequest` | **Yes** | Coarse neighborhood indicator (e.g., "Kothrud", "Downtown"). |
| **Meeting Location Details** | `Session` | **No** | Specific meeting notes (e.g., "Library Room 302") visible **only to confirmed participants**. |
| **Exact GPS / Residential Address** | N/A | **Never** | TimeSwap does not collect, store, or display residential street addresses. |

---

## 16. Notifications Domain

The notification model supports transactional alerts and unread count tracking.

### 16.1 Notification Entity

* **Attributes:** `user_id`, `notification_type`, `title`, `body_text`, `action_url`, `is_read` (Boolean, default `false`), `created_at`.
* **Types:**
* `BOOKING_REQUESTED`: Sent to Provider when a booking is created.
* `BOOKING_CONFIRMED`: Sent to Requester when Provider accepts.
* `BOOKING_CANCELLED`: Sent to partner when a session is cancelled.
* `SESSION_REMINDER`: Dispatched 24h and 2h prior to scheduled start.
* `COMPLETION_REQUIRED`: Prompt to attest session completion.
* `REVIEW_RECEIVED`: Notification that a partner submitted a review.
* `DISPUTE_OPENED` / `DISPUTE_RESOLVED`: Moderation case updates.



---

## 17. Auditability

The data architecture provides complete traceability for critical security and financial events.

### 17.1 Immutable Economic Audit

The double-entry ledger (`LedgerTransaction` and `JournalEntry`) is inherently immutable. No credit balance can be altered without an append-only transaction linking back to a specific operational event.

### 17.2 System Audit Log (`AuditLog`)

Tracks administrative and privileged operations:

* Authentication anomalies (repeated failed logins, credential resets).
* Role upgrades (`USER` $\to$ `MODERATOR` / `ADMIN`).
* Account suspensions and unsuspensions.
* Moderator dispute resolutions and manual escrow overrides.
* Listing moderation and content takedowns.

---

## 18. Entity Relationships

The following map defines the relational links, foreign key dependencies, and cardinalities across all MVP entities.

| Parent Entity | Child Entity | Cardinality | Foreign Key / Link | Cascade Rule |
| --- | --- | --- | --- | --- |
| **User** | `UserCredential` | 1 : 1 | `UserCredential.user_id -> User.id` | CASCADE |
| **User** | `Profile` | 1 : 1 | `Profile.user_id -> User.id` | CASCADE |
| **User** | `SessionToken` | 1 : N | `SessionToken.user_id -> User.id` | CASCADE |
| **User** | `LedgerAccount` | 1 : 1 | `LedgerAccount.user_id -> User.id` | RESTRICT |
| **User** | `ServiceOffer` | 1 : N | `ServiceOffer.provider_id -> User.id` | RESTRICT |
| **User** | `HelpRequest` | 1 : N | `HelpRequest.requester_id -> User.id` | RESTRICT |
| **User** | `Booking` (as Requester) | 1 : N | `Booking.requester_id -> User.id` | RESTRICT |
| **User** | `Booking` (as Provider) | 1 : N | `Booking.provider_id -> User.id` | RESTRICT |
| **User** | `Notification` | 1 : N | `Notification.user_id -> User.id` | CASCADE |
| **Profile** | `ProfileSkill` | 1 : N | `ProfileSkill.profile_id -> Profile.id` | CASCADE |
| **SkillCategory** | `Skill` | 1 : N | `Skill.category_id -> SkillCategory.id` | RESTRICT |
| **Skill** | `ProfileSkill` | 1 : N | `ProfileSkill.skill_id -> Skill.id` | RESTRICT |
| **Booking** | `Session` | 1 : 1 | `Session.booking_id -> Booking.id` | RESTRICT |
| **Booking** | `EscrowHold` | 1 : 1 | `EscrowHold.booking_id -> Booking.id` | RESTRICT |
| **Booking** | `MessageThread` | 1 : 1 | `MessageThread.booking_id -> Booking.id` | SET NULL |
| **Session** | `Review` | 1 : N (Max 2) | `Review.session_id -> Session.id` | RESTRICT |
| **Session** | `DisputeCase` | 1 : 1 | `DisputeCase.session_id -> Session.id` | RESTRICT |
| **LedgerAccount** | `JournalEntry` | 1 : N | `JournalEntry.account_id -> LedgerAccount.id` | RESTRICT |
| **LedgerTx** | `JournalEntry` | 1 : N ($\ge 2$) | `JournalEntry.transaction_id -> LedgerTx.id` | RESTRICT |
| **MessageThread** | `Message` | 1 : N | `Message.thread_id -> MessageThread.id` | CASCADE |

---

## 19. State Machines and Lifecycle Transitions

### 19.1 ServiceOffer Lifecycle

* **`DRAFT` $\to$ `PUBLISHED`:** Provider completes required fields and publishes listing.
* **`PUBLISHED` $\to$ `PAUSED`:** Provider temporarily hides listing.
* **`PAUSED` $\to$ `PUBLISHED`:** Provider unpauses listing.
* **`PUBLISHED` / `PAUSED` $\to$ `ARCHIVED`:** Provider permanently closes listing.
* *Invalid Transition:* `ARCHIVED` $\to$ `PUBLISHED` (Archived listings are immutable).

### 19.2 HelpRequest Lifecycle

* **`OPEN` $\to$ `IN_FULFILLMENT`:** Provider proposal accepted; booking confirmed.
* **`IN_FULFILLMENT` $\to$ `OPEN`:** Booking cancelled prior to session; request reopened.
* **`IN_FULFILLMENT` $\to$ `FULFILLED`:** Session successfully settled.
* **`OPEN` $\to$ `CLOSED`:** Requester manually withdraws request.
* *Invalid Transition:* `FULFILLED` $\to$ `OPEN`.

### 19.3 Booking Lifecycle

* **`PENDING_ACCEPTANCE` $\to$ `CONFIRMED`:** Provider accepts booking.
* **`PENDING_ACCEPTANCE` $\to$ `CANCELLED`:** Provider declines or Requester cancels before acceptance.
* **`CONFIRMED` $\to$ `IN_PROGRESS`:** System time reaches scheduled start time.
* **`CONFIRMED` / `IN_PROGRESS` $\to$ `CANCELLED`:** Cancelled by Requester or Provider.
* **`IN_PROGRESS` $\to$ `COMPLETED`:** Completion attested by both parties or auto-settle window elapses.
* **`IN_PROGRESS` / `COMPLETED` $\to$ `DISPUTED`:** Dispute raised within 24 hours of session end.
* **`DISPUTED` $\to$ `COMPLETED`:** Moderator resolves dispute in favor of Provider.
* **`DISPUTED` $\to$ `CANCELLED`:** Moderator resolves dispute in favor of Requester (Full refund).
* *Invalid Transitions:* `COMPLETED` $\to$ `PENDING_ACCEPTANCE`; `CANCELLED` $\to$ `COMPLETED`.

### 19.4 Escrow Lifecycle

* **`HELD` $\to$ `SETTLED`:** Booking transitions to `COMPLETED`.
* **`HELD` $\to$ `REFUNDED`:** Booking transitions to `CANCELLED` (with eligible refund).
* **`HELD` $\to$ `SPLIT`:** Moderator executes 50/50 dispute resolution.
* *Invalid Transitions:* `SETTLED` $\to$ `REFUNDED`; `REFUNDED` $\to$ `SETTLED` (Terminal states are irreversible).

### 19.5 Dispute Lifecycle

* **`OPEN` $\to$ `UNDER_REVIEW`:** Moderator opens ticket for investigation.
* **`UNDER_REVIEW` $\to$ `RESOLVED`:** Moderator submits binding resolution (`FULL_REFUND_REQUESTER`, `FULL_RELEASE_PROVIDER`, or `SPLIT_50_50`).
* *Invalid Transition:* `RESOLVED` $\to$ `OPEN` (Arbitrations are final).

---

## 20. Database Constraints and Invariants

The database layer and application boundaries enforce the following strict invariants:

1. **Email Uniqueness:** `User.email` must be globally unique and stored in lowercase format.
2. **Handle Uniqueness:** `Profile.handle` must be globally unique, alphanumeric, and lowercase.
3. **No Self-Booking:** A database constraint must reject any `Booking` where `requester_id = provider_id`.
4. **No Self-Review:** A database constraint must reject any `Review` where `author_user_id = subject_user_id`.
5. **Exact Session Durations:** `Booking.duration_minutes` must be strictly `30` or `60`.
6. **Deterministic Credit Mapping:** `Booking.credit_amount` must equal `0.50` if duration is `30`, and `1.00` if duration is `60`.
7. **Single Profile per User:** Exactly one `Profile` record per `User`.
8. **Single Wallet per User:** Exactly one `USER_WALLET` ledger account per `User`.
9. **Review Constraint:** At most one review per user per session (maximum of two reviews per `Session`).
10. **Non-Negative Balance Constraint:** A check constraint on `LedgerAccount` balances ensures user wallet balances never drop below zero (`balance >= 0.00`).
11. **Double-Entry Equilibrium:** Every transaction must have balanced journal entries:

$$\sum \text{Debits} - \sum \text{Credits} = 0.00$$

12. **Immutable Financial History:** `LedgerTransaction` and `JournalEntry` records cannot be updated (`UPDATE`) or deleted (`DELETE`) under any circumstance.
13. **Rating Score Boundary:** `Review.rating` must satisfy $1 \le \text{rating} \le 5$.

---

## 21. Indexing and Query Requirements

To ensure sub-millisecond query execution on PostgreSQL, the database design mandates the following indexes:

### 21.1 Identity & Profile Indexes

* Unique B-tree index on `User(email)`.
* Unique B-tree index on `Profile(handle)`.
* B-tree index on `Profile(user_id)`.
* Compound B-tree index on `Profile(city, general_district)`.

### 21.2 Marketplace & Search Indexes

* GIN index on `ServiceOffer` using `to_tsvector('english', title |

| ' ' |
| description)`.

* GIN index on `HelpRequest` using `to_tsvector('english', title |

| ' ' |
| description)`.

* Compound B-tree index on `ServiceOffer(status, category_id, delivery_format)`.
* Compound B-tree index on `HelpRequest(status, category_id, urgency)`.
* B-tree index on `ProfileSkill(profile_id, skill_role)`.
* B-tree index on `ProfileSkill(skill_id, skill_role)`.

### 21.3 Booking & Session Indexes

* Compound B-tree index on `Booking(requester_id, status)`.
* Compound B-tree index on `Booking(provider_id, status)`.
* B-tree index on `Booking(scheduled_start_time)`.
* Compound B-tree index on `Session(auto_settle_at)` where status is pending attestation.

### 21.4 Ledger & Escrow Indexes

* Unique B-tree index on `LedgerAccount(user_id, account_type)`.
* B-tree index on `JournalEntry(account_id, created_at)`.
* B-tree index on `JournalEntry(transaction_id)`.
* B-tree index on `EscrowHold(booking_id)`.

### 21.5 Communication & Notification Indexes

* Compound B-tree index on `MessageThread(participant_one_id, participant_two_id)`.
* Compound B-tree index on `Message(thread_id, created_at ASC)`.
* Compound B-tree index on `Notification(user_id, is_read, created_at DESC)`.

---

## 22. Soft Delete and Retention Policies

| Entity | Deletion Strategy | Retention Policy / Reason |
| --- | --- | --- |
| **User** | Soft Delete (`status = 'DEACTIVATED'`) | Retained for historical booking references, ledger integrity, and reputation context. |
| **UserCredential** | Hard Delete on Deactivation | Cryptographic hashes purged upon account deletion; replaced with random invalid string. |
| **SessionToken** | Hard Delete on Logout/Expiry | Expired sessions are pruned periodically by background worker cron. |
| **ServiceOffer** | Soft Delete (`status = 'ARCHIVED'`) | Preserved to maintain historical references in past bookings. |
| **HelpRequest** | Soft Delete (`status = 'CLOSED'`) | Preserved for auditability and historical matching references. |
| **Booking & Session** | Immutable (No Deletion) | Permanent transactional records required for user history, dispute logs, and ledger audit. |
| **Ledger Tables** | Strictly Immutable | `LedgerAccount`, `LedgerTransaction`, and `JournalEntry` must **never** be deleted or updated.

 |
| **EscrowHold** | Immutable State Machine | Holds transition through states (`HELD` $\to$ `SETTLED` / `REFUNDED`); records are permanently retained. |
| **Review** | Immutable | Public reviews remain permanently attached to profiles to protect reputation integrity. |
| **Message & Thread** | Soft Delete (`status = 'DELETED'`) | User can hide chat view, but messages remain stored for 90 days for dispute investigation. |
| **AuditLog** | Strictly Immutable | Retained indefinitely for security and compliance audits. |

---

## 23. MVP Data Model vs. Future Capabilities

| Entity / Data Capability | MVP | Phase 2 | Future / Rejected |
| --- | --- | --- | --- |
| **User & Authentication Entities** | **Yes** | — | — |
| **Profile & Taxonomy Entities** | **Yes** | — | — |
| **ServiceOffer & HelpRequest Entities** | **Yes** | — | — |
| **Booking & Session (30/60 min) Entities** | **Yes** | — | — |
| **Double-Entry Ledger & Escrow Entities** | **Yes** | — | — |
| **Cancellation & DisputeCase Entities** | **Yes** | — | — |
| **Double-Blind Review & Reputation Summaries** | **Yes** | — | — |
| **Gated MessageThread & Message Entities** | **Yes** | — | — |
| **In-App Notification Entity** | **Yes** | — | — |
| **AuditLog Entity** | **Yes** | — | — |
| **Activity & ActivityParticipant (Group Sessions)** | No | **Yes** | — |
| **`pgvector` Skill Embedding Columns** | No | **Yes** | — |
| **External Calendar Sync Token Storage** | No | **Yes** | — |
| **Multi-Hop Circular Clearing Graph Entities** | No | No | Rejected |
| **EigenTrust Matrix Iteration Tables** | No | No | Rejected |
| **Demurrage Decay Transaction Logs** | No | No | Rejected |
| **WebRTC Telemetry Session Logs** | No | No | Rejected |

---

## 24. Domain & Database Decision Summary

| Decision Dimension | Final Architectural Choice | Rationale |
| --- | --- | --- |
| **Account Modeling** | Unified Prosumer `User` Entity | Eliminates duplicate schemas; users dynamically act as Providers or Requesters per booking.

 |
| **Auth Credential Storage** | Isolated `UserCredential` Entity | Shields password hashes from general profile and marketplace SQL queries. |
| **Ledger Architecture** | Relational Double-Entry Bookkeeping | Guarantees zero-sum balance integrity, auditable history, and concurrency safety.

 |
| **Exchange Representation** | Two Entities: `Booking` + `Session` | Decouples calendar/financial agreements (`Booking`) from execution/attestation tracking (`Session`). |
| **Duration Enforcement** | Strict Enums (30 or 60 Minutes) | Prevents fractional credit ambiguity and guarantees deterministic temporal valuation. |
| **Reputation Calculation** | Hybrid: Cached Summary on Profile | Provides fast UI rendering while retaining double-blind review records as underlying proof. |
| **Location Representation** | Coarse Public Location + Private Session Details | Balances marketplace local discovery with physical user privacy. |
| **Messaging Scope** | Context-Gated `MessageThread` | Prevents unsolicited platform spam by requiring listing inquiries or active bookings. |
| **Search Engine** | Native PostgreSQL Full-Text Search (GIN) | High performance without introducing external Elasticsearch or OpenSearch infrastructure. |

---

## 25. Domain & Database Decisions Resolved

The following domain and database parameters have been finalized for the MVP.

### 1. Review Expiration Grace Period

The double-blind review grace period is fixed at **7 days after the session**.

Submitted feedback remains hidden until either:

- both participants submit their reviews, or
- 7 days have elapsed after the session.

After the 7-day grace period, any submitted review is automatically revealed even if the other participant did not submit feedback.

### 2. Message Soft Deletion Retention Window

Soft-deleted chat messages will be retained for **90 days** before permanent deletion.

During the retention period, deleted messages remain unavailable to normal users but may be retained for authorized moderation or dispute investigation according to the application's access rules.

After 90 days, eligible soft-deleted messages may be permanently purged.

### 3. Dispute Resolution Evidence Limit

For the MVP, dispute evidence submissions are limited to:

- **Maximum 5 file attachments per dispute submission**
- **Maximum 5 MB per individual file**
- **Maximum 5,000 characters for textual evidence**

Accepted file types should be restricted to safe, relevant evidence formats such as common images and documents.

These limits are intended to keep storage, moderation, and evidence handling manageable during the MVP while still allowing users to provide sufficient context.