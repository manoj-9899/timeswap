# docs/01_PRODUCT.md: TimeSwap Product Specification

This document defines the functional scope, economic rules, user experience, and behavioral invariants for the TimeSwap platform. It serves as the primary product reference for engineers, designers, and AI implementation agents.

---

## 1. Product Overview

### 1.1 What TimeSwap Is

TimeSwap is a community-driven, non-monetary skill exchange marketplace where individuals exchange their time, knowledge, and practical assistance using time credits rather than money. The platform operates on a single egalitarian metric: one hour of service provided equals one TimeSwap credit, which can be redeemed for one hour of service from any other participating member.

### 1.2 The Core Problem Solved

Accessing personalized, one-on-one mentorship, tutoring, or practical help is traditionally gated by monetary wealth. Conventional marketplaces require cash payments, price negotiations, payment gateway fees, and commercial transactional dynamics. This creates a structural barrier for students, hobbyists, career switchers, and community members who need assistance and have valuable skills to contribute, but lack the financial liquidity to purchase private services.

### 1.3 Core Value Proposition

TimeSwap decouples personal development and mutual aid from fiat currency. It converts an individual's latent skills and available time into purchasing power within a reciprocal community economy.

### 1.4 Target Audience

* **University and College Students:** Seeking programming help, academic tutoring, resume critiques, or spoken language practice without spending money.
* **Career Switchers and Self-Taught Learners:** Requiring mock interviews, portfolio reviews, or tool walkthroughs (e.g., Figma, React, Python).
* **Creative Practitioners and Hobbyists:** Looking for music coaching, photography basics, craft advice, or fitness accountability.
* **Local Community Members:** Exchanging localized assistance such as home tech setup, basic bike repairs, or conversation practice.

### 1.5 Why a Time-Based Exchange Is Useful

A time-based economy eliminates commercial price discrimination and wage hierarchies. In standard markets, an hour of software consulting commands a dramatically higher cash price than an hour of conversational language practice. Within TimeSwap, both contributions are valued equally in time: one hour is one hour. This removes the psychological barrier of commercial rate negotiation and fosters a collaborative peer-to-peer learning environment.

### 1.6 Competitive Differentiation

| Platform Type | Core Medium | Transaction Dynamic | Primary Limitation | TimeSwap Difference |
| --- | --- | --- | --- | --- |
| **Freelance Marketplaces** (Fiverr, Upwork) | Fiat Currency (USD, INR) | Client $\to$ Vendor commercial contracting

 | High financial cost, platform cuts, commercial pressure

 | Non-monetary, reciprocal peer learning; no bidding wars or payment processing.

 |
| **Traditional Barter** | Direct Good / Service Trade | Strictly bilateral ($A \leftrightarrow B$)

 | Fails without a "double coincidence of wants"

 | Uncoupled asynchronous exchange ($A \to B \to C \to A$) mediated by credits.

 |
| **Social Networks** (Reddit, Discord) | Attention / Informal Chat | Unstructured public discussions | High coordination friction, no booking, zero accountability | Structured listings, calendar bookings, escrowed commitment, and verified reviews. |
| **Paid Tutoring Platforms** | Subscription / Hourly Cash | Student $\to$ Tutor purchase | Prohibitive costs for continuous, long-term learning | 100% cashless; learners pay by contributing their own skills back to the network.

 |

---

## 2. Core Product Principle

The fundamental axiom of TimeSwap is: Human time is the universal unit of exchange.

### 2.1 The Time-Credit Rule

* **Standard Session:** $60\text{ minutes of completed service} = 1.0\text{ credit}$.


* **Half Session:** $30\text{ minutes of completed service} = 0.5\text{ credits}$.

### 2.2 Non-Monetary Credit Rules

Credits are strictly units of participation and mutual aid, not financial assets.

* Credits **cannot** be purchased with money.
* Credits **cannot** be sold or converted into cash.
* Credits **cannot** be gifted or transferred outside an authorized session exchange.
* Credits **cannot** be traded on external platforms or secondary markets.
* Credits carry **zero monetary value** outside the TimeSwap application.

### 2.3 Economic Simplicity Guarantee (MVP)

To ensure clarity and avoid artificial economic distortions, the MVP deliberately omits:

* No credit expiration dates.
* No balance decay or demurrage fees.


* No dynamic or surge pricing.
* No skill-based tiering or premium multipliers.
* No complex monetary reserve equations or algorithmic sinking funds.



---

## 3. Users and Roles

TimeSwap rejects the rigid separation between "buyers" and "sellers". All participants operate as prosumers who can both provide and receive help.

### 3.1 Standard User

Every authenticated account is a `User`. A User occupies contextual states depending on the transaction:

* **Provider (State):** The role a User occupies when publishing a Service Offer, managing calendar availability, or delivering a booked session.
* **Requester (State):** The role a User occupies when publishing a Help Request, booking a session, or receiving assistance.

A user may simultaneously act as a Provider in one exchange (e.g., teaching Python) and as a Requester in another (e.g., learning guitar).

### 3.2 Administrative Roles

* **Moderator:** An authorized platform role with permissions to review reported listings, inspect dispute cases, view chat logs of disputed exchanges, and execute binding escrow settlements (refund, release, or split).
* **Administrator:** A system-level role with full platform oversight, including role assignments, configuration parameters, global ledger audits, and account suspension capabilities.

---

## 4. Core User Journey

The standard lifecycle of a TimeSwap participant progresses through ten sequential milestones:

1. **Account Registration:** The user registers using an email address and secure password.
2. **Email Verification:** The user verifies ownership of their email address via a secure activation link.
3. **Profile Setup:** The user adds their display name, bio, location (City/District), at least one skill they can offer, and at least one skill they want to learn.
4. **Starter Credit Grant:** Upon completing the required profile setup, the user receives an initial $1.0\text{ starter credit}$ from the platform reserve.
5. **Opportunity Discovery:** The user searches for Service Offers or Help Requests using category tags, format filters (Online or In-Person), and location filters.
6. **Exchange Initiation & Booking:**
* *Path A:* The Requester selects an available time slot on a Provider’s Service Offer.
* *Path B:* A Provider responds to an open Help Request, proposing a time slot that the Requester confirms.


7. **Credit Escrow Lock:** The platform locks the required credits ($0.5$ or $1.0$) from the Requester’s wallet into Escrow.
8. **Session Execution:** Both parties meet at the agreed time (via an external video link or at an agreed public physical location) and conduct the session.
9. **Completion & Settlement:** Both participants mark the session as complete in the application. Escrow immediately releases the locked credits into the Provider’s wallet.
10. **Bilateral Review:** Both participants submit double-blind star ratings and written reviews to update their public reputation profiles.

---

## 5. Onboarding Experience

The onboarding sequence is optimized to eliminate friction while ensuring new participants are equipped to engage immediately.

### 5.1 Onboarding Steps (MVP)

1. **Sign Up:** Provide email, display name, and password.
2. **Verify Email:** Confirm email via a one-time verification link.
3. **Mandatory Profile Completion:**
* Select primary location (City and General District).
* Add a brief bio (minimum 30 characters).
* Select or enter at least one skill they can **offer**.
* Select or enter at least one skill they want to **receive/learn**.


4. **Starter Credit Receipt:** The system automatically credits $1.0\text{ credit}$ to the user's wallet.

### 5.2 Verification Scope

* **MVP Policy:** No phone verification, government identity document verification, or academic credentials are required to receive the starter credit.
* **Product Recommendation:** If automated registration abuse or Sybil account creation is detected post-launch, the platform will introduce lightweight phone OTP verification or require the user to publish their first validated Service Offer before unlocking the starter credit.

---

## 6. User Profile

A TimeSwap profile establishes identity, capability, and trust within the community.

### 6.1 Profile Elements

* **Identity:** Display name, unique username/handle, and profile avatar.
* **Bio & Intent:** A personal description highlighting background, learning goals, and mutual aid philosophy.
* **Skills Offered:** Tagged skills the user is confident teaching or assisting with.
* **Skills Wanted:** Tagged topics or tasks the user is actively seeking help with.
* **Location & Format Preferences:** City, General District, and delivery preference (`ONLINE`, `IN_PERSON`, or `BOTH`).
* **General Availability:** Indicative availability tags (e.g., "Weekday Evenings", "Weekend Mornings").
* **Trust & Track Record:**
* Total completed exchanges (separated by "Helped Others" vs. "Received Help").
* Aggregate star rating (1.0 to 5.0 scale).
* Reliability percentage ($100 \times \frac{\text{Completed Sessions}}{\text{Completed Sessions} + \text{Late Cancellations} + \text{No-Shows}}$).
* Public reviews from past exchange partners.



---

## 7. Service Offers ("I Can Help With X")

A **Service Offer** is a public listing created by a Provider detailing specific help they are willing to provide.

### 7.1 Purpose and Function

* Communicates an available skill or practical service to the community.
* Defines the session duration options supported by the Provider ($30\text{ minutes}$ or $60\text{ minutes}$).
* Defines whether the session can take place online, in-person, or both.
* Enables Requesters to book directly from the listing.

### 7.2 Core Listing Information

* **Title:** Clear summary (e.g., *"Beginner Python: Functions, Loops, and Debugging"*).
* **Category Tag:** Taxonomy classification (e.g., `Programming`, `Languages`, `Design`, `Music`, `Academics`, `Lifestyle`).
* **Detailed Description:** Scope of help, expectations, and prerequisites.
* **Duration:** 30 minutes ($0.5\text{ credit}$) or 60 minutes ($1.0\text{ credit}$).
* **Format:** `ONLINE` (video meeting) or `IN_PERSON` (local meetup).
* **Location:** Required if in-person (City and General District).

### 7.3 Discovery & Interaction

Requesters discover offers via search, category filters, or location filters. Clicking **"Request Booking"** prompts the Requester to choose an available duration, propose a date/time, include a contextual message, and reserve the required credits in Escrow.

---

## 8. Help Requests ("I Need Help With X")

A **Help Request** is a public listing created by a Requester seeking assistance for a specific task or topic.

### 8.1 Purpose and Function

* Broadcasts an unmet learning or task need to the community when a matching Service Offer is not immediately available.
* Allows prospective Providers with matching skills to discover opportunities to earn credits.

### 8.2 Core Listing Information

* **Title:** Clear request summary (e.g., *"Need help preparing for a frontend React interview"*).
* **Category Tag:** Taxonomy classification.
* **Detailed Description:** What the user is trying to accomplish and their current skill level.
* **Target Duration:** 30 minutes ($0.5\text{ credit}$) or 60 minutes ($1.0\text{ credit}$).
* **Preferred Format:** `ONLINE` or `IN_PERSON`.
* **Urgency / Timeframe:** Target timeframe (e.g., *"This weekend"*, *"Within the next 7 days"*).

### 8.3 Discovery & Interaction

Providers discover Help Requests via search and filter interfaces. A Provider responds by clicking **"Offer Help"**, which opens a proposal workflow where the Provider suggests a date/time and meeting format. If the Requester accepts the proposal, credits are locked in Escrow and the booking is confirmed.

---

## 9. Discovery Experience

The discovery experience connects Requesters and Providers through simple, deterministic filtering without hidden algorithmic ranking.

### 9.1 Discovery Channels (MVP)

* **Explore Service Offers:** Browse all active offers filtered by Category, Duration, Format (`ONLINE` vs. `IN_PERSON`), and City/District.
* **Explore Help Requests:** Browse all active community requests filtered by Category, Format, and Recency.
* **Member Directory:** Search for users by skill tags, display name, or city.
* **Keyword Search:** PostgreSQL full-text search across listing titles, descriptions, and skill tags.

### 9.2 Explicit Non-Requirements for MVP

To keep development grounded, the following mechanisms are excluded from MVP discovery:

* No graph-based multi-hop cycle clearing.


* No vector embeddings or semantic search (deferred to Phase 2).


* No algorithmic feed ranking based on engagement metrics.

---

## 10. Booking and Exchange

The booking workflow manages scheduling, credit escrow, and completion confirmation.

### 10.1 Supported Durations

* **30-Minute Session:** Costs $0.5\text{ credits}$.
* **60-Minute Session:** Costs $1.0\text{ credit}$.
* Custom durations (e.g., 45 minutes, 90 minutes) are **not supported** in MVP.

### 10.2 Booking Stages

1. **Initiation:** The Requester submits a booking request specifying duration, date, time, and session goals.
2. **Escrow Lock:** The system checks the Requester’s wallet. If available balance is sufficient, the required credit ($0.5$ or $1.0$) is debited from available balance and locked in Escrow. If balance is insufficient, booking creation is blocked.
3. **Provider Response:**
* **Accept:** The booking transitions to `CONFIRMED`.
* **Decline:** The booking is rejected; Escrow immediately refunds the locked credits to the Requester.


4. **Session Execution:** At the scheduled time, the participants meet using an external video conferencing URL (provided in booking details) or at the agreed physical location.
5. **Completion Attestation:**
* Following session end, both parties are prompted: *"Did this session take place successfully?"*
* Once both parties confirm, or if the Requester confirms unilaterally, the session transitions to `COMPLETED`.


6. **Auto-Settlement Window:** If the Provider confirms completion but the Requester fails to confirm or dispute within 24 hours of session end, the system automatically marks the session as `COMPLETED` and releases the credits to the Provider.

---

## 11. Cancellation and No-Show Policies

To protect participant time and prevent frivolous bookings, TimeSwap enforces clear cancellation boundaries.

### 11.1 The Cancellation Window Threshold

The late cancellation threshold is fixed at **12 hours prior to the scheduled session start time**.

### 11.2 Cancellation Rules Matrix

| Cancellation Scenario | Timing | Escrow Treatment | Reputation Impact |
| --- | --- | --- | --- |
| **Requester Early Cancellation** | $\ge 12\text{ hours}$ before start | $100\%$ refunded to Requester wallet | None |
| **Requester Late Cancellation** | $< 12\text{ hours}$ before start | $100\%$ forfeited and awarded to Provider as indemnity | Recorded as Late Cancel on Requester profile |
| **Requester No-Show** | Missed session without notice | $100\%$ forfeited and awarded to Provider | Recorded as No-Show on Requester profile |
| **Provider Early Cancellation** | $\ge 12\text{ hours}$ before start | $100\%$ refunded to Requester wallet | None |
| **Provider Late Cancellation** | $< 12\text{ hours}$ before start | $100\%$ refunded to Requester wallet | Recorded as Late Cancel on Provider profile |
| **Provider No-Show** | Missed session without notice | $100\%$ refunded to Requester wallet | Strike recorded; recurring strikes lead to suspension |
| **Mutual Cancellation** | Agreed before session | $100\%$ refunded to Requester wallet | None |

### 11.3 Fairness Rationale

Because TimeSwap cannot financially penalize a defaulting Provider, accountability is enforced via profile reputation metrics. A Provider who cancels late or fails to show up receives a public strike on their reliability score, directly reducing their ability to attract future exchange partners.

---

## 12. Dispute Resolution

A dispute occurs when participants disagree regarding attendance, session completion, or quality.

### 12.1 Dispute Workflow

1. **Initiation:** Either participant can file a dispute within **24 hours** of the scheduled session end time by clicking *"Report Issue / Dispute"*.
2. **Escrow Freeze:** The escrowed credits remain locked. Auto-settlement timers are immediately halted.
3. **Evidence Submission:** The initiator and respondent provide written explanations and optional screenshots/evidence.
4. **Moderator Review:** A platform Moderator reviews the case, booking history, and contextual messages.

### 12.2 Permitted Moderator Outcomes

To maintain operational consistency, the Moderator must select one of three outcomes:

1. **Full Refund to Requester:** $100\%$ of escrowed credits are returned to the Requester wallet (used if Provider failed to show, was unprepared, or misrepresented skills).
2. **Full Release to Provider:** $100\%$ of escrowed credits are awarded to the Provider wallet (used if Requester attended but refused to confirm completion, or made false claims).
3. **50/50 Credit Split:** Escrowed credits are divided equally ($0.25$ / $0.25$ for 30-min sessions; $0.5$ / $0.5$ for 60-min sessions) between Requester and Provider (used for partial sessions, technical disruptions, or mutual misunderstandings).

Following resolution, the case is closed, the ledger transaction is executed, and both users receive an explanation summary.

---

## 13. Direct Messaging Rules

To maintain high user safety and prevent platform misuse, TimeSwap is not an open, unsolicited chat network.

### 13.1 Messaging Triggers

Direct messaging between two users is enabled **only** after a meaningful marketplace action occurs:

* A Requester sends a booking request on a Service Offer.
* A Provider submits a proposal to an open Help Request.
* A user sends an inquiry regarding a specific listing (limited to 1 message until the recipient responds).

### 13.2 Message Thread Lifecycle

* **Active Exchanges:** The chat thread remains open throughout the booking lifecycle.
* **Post-Completion:** The thread remains active for **48 hours** following session settlement to allow follow-up resource sharing, after which it transitions to read-only mode.
* **Post-Cancellation:** The thread transitions immediately to read-only mode.
* **Safety Controls:** Users can block or report conversation partners at any time from the chat header.

---

## 14. Location and Privacy

TimeSwap supports both online and local in-person skill sharing while strictly protecting physical privacy.

### 14.1 Public Listings Privacy

All public profile cards, Service Offers, and Help Requests display coarse location data only:

* **Allowed Publicly:** City, General District / Neighborhood (e.g., *"Pune, Kothrud"* or *"Austin, Downtown"*).
* **Prohibited Publicly:** Street address, residential building name, house/flat number, precise GPS coordinates.

### 14.2 Confirmed Exchange Location Sharing

For in-person sessions, the specific meeting place (e.g., a university campus library, coffee shop, or co-working space) is agreed upon and shared within the private booking details or chat **only after the booking is confirmed**. The platform terms of service explicitly advise conducting in-person sessions in public locations.

---

## 15. Reviews and Reputation

Trust on TimeSwap is established through transparent, earned reputation rather than monetary signals.

### 15.1 Double-Blind Review Mechanism

To prevent retaliatory reviews and social pressure:

* After a session is completed, both parties are invited to leave a review.
* Reviews remain **hidden** until both participants have submitted their feedback, or until **7 days** have passed.
* Once both submit (or 7 days elapse), reviews become permanently visible on public profiles.

### 15.2 Review Structure

* **Numeric Score:** 1 to 5 stars.
* **Categorical Skill Tags:** Positive attribute selections (e.g., *"Punctual"*, *"Great Explanations"*, *"Patient"*, *"Highly Prepared"*).
* **Written Feedback:** A concise narrative of the experience.

### 15.3 Public Trust Metrics

A user’s profile publicly displays:

* Overall average star rating.
* Total hours contributed (as Provider) and total hours received (as Requester).
* Reliability score (% of bookings completed without late cancellation or no-show).
* Chronological list of verified exchange reviews.

---

## 16. Group Activities (Community Layer)

Group Activities represent 1-to-N group sessions (e.g., group language conversation circles, photography walks, coding study groups).

### 16.1 Concept and Vision

Group activities allow a single host to organize a shared learning or collaborative meetup for multiple community members simultaneously, building social cohesion and local network density.

### 16.2 MVP Status and Phase 2 Scoping

* **MVP Status:** **Excluded from MVP.** All MVP exchanges are strictly 1-on-1 bilateral sessions ($30\text{ minutes} = 0.5\text{ credit}$; $60\text{ minutes} = 1.0\text{ credit}$).
* **Phase 2 Implementation Plan:** Group activities will be introduced in Phase 2 with a simplified host earnings model (e.g., attendees contribute $1.0\text{ credit}$ each, the host earns a capped maximum of $2.0\text{ credits}$ for a 60-minute workshop, and excess attendee credits are directed to the platform community reserve).

---

## 17. Credit Economy (Product Rules Summary)

| Economic Action | Rule / Mechanism |
| --- | --- |
| **Earning Credits** | Delivered verified 1-on-1 sessions ($30\text{ min} = +0.5\text{ credits}$; $60\text{ min} = +1.0\text{ credit}$). |
| **Spending Credits** | Booking 1-on-1 sessions ($30\text{ min} = -0.5\text{ credits}$; $60\text{ min} = -1.0\text{ credit}$). |
| **Starter Allocation** | $+1.0\text{ credit}$ granted once upon completed profile onboarding. |
| **Custody & Escrow** | Credits are locked in Escrow upon booking creation and released upon verified completion. |
| **Transfers** | No arbitrary peer-to-peer gifts or unlinked credit transfers permitted. |
| **Monetary Conversion** | Zero cash conversion, zero purchasing, zero fiat redemption.

 |
| **Balance Validity** | Credits never expire; no carrying charges or demurrage fees.

 |

*(Note: Detailed double-entry accounting specifications, account schemas, and balance invariants are formally defined in `docs/05_CREDIT_LEDGER.md`.)*

---

## 18. MVP Scope Matrix

| Feature / Domain | MVP | Phase 2 | Future / Experimental |
| --- | --- | --- | --- |
| **Email + Password Authentication** | **Yes** | — | — |
| **User Profile Management** | **Yes** | — | — |
| **Curated Taxonomy & Custom Skill Tags** | **Yes** | — | — |
| **Service Offers ("I Can Help")** | **Yes** | — | — |
| **Help Requests ("I Need Help")** | **Yes** | — | — |
| **30-Minute & 60-Minute 1-on-1 Sessions** | **Yes** | — | — |
| **PostgreSQL Full-Text Search & Category Filters** | **Yes** | — | — |
| **Credit Wallet & Escrow State Locking** | **Yes** | — | — |
| **Double-Entry Ledger Core** | **Yes** | — | — |
| **12-Hour Cancellation & Indemnity Policy** | **Yes** | — | — |
| **Moderator Dispute Resolution (Refund, Release, Split)** | **Yes** | — | — |
| **Double-Blind 5-Star Reviews & Trust Metrics** | **Yes** | — | — |
| **Gated 1-on-1 Direct Messaging** | **Yes** | — | — |
| **In-App Notifications & Email Booking Alerts** | **Yes** | — | — |
| **City/District Coarse Location Privacy** | **Yes** | — | — |
| **Group Activities (1-to-N Workshops)** | No | **Yes** | — |
| **Semantic / Vector Matching (`pgvector`)** | No | **Yes** | — |
| **Institutional Single Sign-On (SSO / Campus Domains)** | No | **Yes** | — |
| **External Calendar Sync (Google / iCal)** | No | **Yes** | — |
| **Multi-Hop Circular Clearing Graph Algorithms** | No | No | Rejected / Unnecessary |
| **EigenTrust Matrix Propagation** | No | No | Rejected / Experimental |
| **Demurrage / Balance Decay Engines** | No | No | Rejected / Counterproductive |
| **Automated WebRTC Telemetry Verification** | No | No | Rejected / Over-engineered |

---

## 19. Core Product Invariants

The following product invariants must never be violated in code or workflow design:

1. **Strict Temporal Valuation:** $60\text{ minutes of completed exchange} = 1.0\text{ credit}$, and $30\text{ minutes} = 0.5\text{ credits}$.
2. **Absolute Non-Monetization:** Credits cannot be purchased, sold, converted to fiat, or redeemed for commercial currency.


3. **No Unbacked Peer Gifting:** Credits can only move between users through a verified booking and escrow exchange.
4. **No Negative Balances:** A user cannot initiate a booking if their available credit balance is less than the required session cost.
5. **Universal Prosumer Status:** Every standard account possesses the structural capability to act as both a Provider and a Requester.


6. **Location Privacy Preservation:** Public endpoints and views must never expose exact residential addresses or coordinates.
7. **No Unsolicited Cold Outreach:** Direct messaging is strictly gated behind listing inquiries, booking requests, or active exchanges.
8. **Deterministic Dispute Scope:** Moderator dispute resolutions are restricted strictly to Full Refund, Full Release, or 50/50 Split.
9. **Ledger Integrity:** Every credit state transition must correspond to balanced, double-entry journal records.



---

## 20. Future and Experimental Ideas (Post-MVP)

The following concepts from preliminary strategic research are preserved for future exploration:

* **Semantic Vector Matching (`pgvector`):** Using natural language embeddings to match complex Help Requests with relevant Service Offers across varying terminology (e.g., matching *"statistical learning with pandas"* to *"Python data analysis"*). *Reason for Deferral:* Curated tags and full-text search are sufficient for initial cohort scale.


* **Institutional Campus Verification (SSO):** Allowing students to verify institutional `.edu` / university email addresses to earn verified campus trust badges. *Reason for Deferral:* Generic email verification is prioritized for the open MVP launch.


* **External Calendar Integration:** Bi-directional synchronization with Google Calendar and Apple Calendar via iCal feeds. *Reason for Deferral:* Adds third-party OAuth complexity; manual slot selection suffices for MVP.
* **Multi-Hop Circular Matching (Johnson Cycle Detection / Hopcroft-Karp):** Algorithmic routing to clear multi-party reciprocal trades simultaneously. *Reason for Rejection:* Asynchronous time credits already resolve the double coincidence of wants; forced multi-party synchronous scheduling introduces severe coordination failure risks.


* **Demurrage (Carrying Cost on Idle Balances):** Programmatic decay of stagnant credit balances. *Reason for Rejection:* Punishes casual learners and undermines trust in credit value. Re-engagement will be driven by discovery recommendations rather than balance confiscation.


* **EigenTrust Global Graph Scoring:** Matrix-iterated trust propagation across the interaction graph. *Reason for Rejection:* Overkill for early-stage sparse networks; bilateral star ratings and completion records provide sufficient trust signals.



---

## 21. Product Decisions Resolved

The following product decisions have been finalized for the MVP.

### 1. Starter Credit Abuse Mitigation

Keep starter credits simple for the MVP.

The platform will not require manual identity verification or require a user to host their first session before spending starter credit.

Basic account-level protections may be applied to reduce obvious abuse, but advanced anti-abuse systems are deferred to a future iteration.

### 2. Auto-Settlement Timeframe

The automatic settlement grace period is fixed at **24 hours after the scheduled session end time**.

No special weekend or extended settlement window applies in the MVP.

### 3. Meeting URL Handling

The platform will provide a dedicated meeting URL field associated with the confirmed booking/session.

Providers may add a third-party meeting link such as Google Meet, Zoom, or Jitsi.

The meeting URL is visible only to the confirmed booking participants.

Direct messaging may be used for communication, but the meeting URL must not depend exclusively on chat messages.

### 4. Partial Session Accounting

The MVP will not implement automatic prorated credit calculations for partially completed sessions.

If a technical failure interrupts a session, the parties may mutually agree to arrange a makeup session without filing a dispute.

If the parties cannot agree, the existing dispute resolution process applies.

The credit outcome remains governed by the normal booking, settlement, cancellation, and dispute rules.