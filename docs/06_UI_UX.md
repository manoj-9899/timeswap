# docs/06_UI_UX.md: TimeSwap UI/UX Specification

This document defines the user experience, interface patterns, visual design standards, responsive behaviors, screen flows, and usability invariants for TimeSwap. It translates the product definitions and architectural rules into an implementation blueprint for Google AI Studio.

---

## 1. UI/UX Objective

TimeSwap is designed to feel trustworthy, friendly, human, and community-oriented. It prioritizes clarity and mutual reciprocity over commercial transactional pressure.

The primary objective is to make the non-monetary time-exchange model instantly intuitive to any new user:

* **The Core Mental Model:** "I contribute my skills and time to help someone $\to$ I earn Time Credits ($1\text{ hour} = 1\text{ credit}$) $\to$ I use those credits to receive help from someone else."
* **Human-Centric Language:** Replace financial terminology (e.g., "cost", "pay", "charge", "invoice", "vendor") with reciprocal community terms (e.g., "time required", "reserve credits", "contribute", "receive help", "exchange").
* **Frictionless Trust:** Highlight verifiable reputation, clear cancellation terms, escrowed credit safety, and transparent participant history across every screen without feeling bureaucratic.

---

## 2. Design Principles

* **Clarity over Ornamentation:** Visual styling must support fast comprehension. Avoid gratuitous glassmorphism, distracting multi-color gradients, dense card nests, and floating decorative elements that obscure content hierarchy.
* **Progressive Disclosure:** Present users with the minimum required information to make an informed decision, revealing deeper configuration options and historical logs on demand.
* **Predictable Hierarchy:** Every screen must have one distinct primary call-to-action (CTA). Secondary and destructive actions must be visually differentiated through muted borders and danger styling.
* **Explicit State & Feedback:** Every interaction involving calendar bookings, credit locks, attestation submissions, or cancellations must provide immediate, unambiguous visual confirmation and status indicators.
* **Zero Dark Patterns:** No hidden cancellation penalties, pre-selected marketing checkboxes, or ambiguous confirmation dialogs. All credit deductions, release rules, and dispute paths must be explicitly stated before confirmation.

---

## 3. Responsive Strategy

TimeSwap is built mobile-first. The user experience adapts seamlessly across device form factors without sacrificing core capabilities.

| Viewport Tier | Breakpoint Width | Navigation Model | Marketplace & Booking Layout | Form & Modal Presentation |
| --- | --- | --- | --- | --- |
| **Mobile** | $< 768\text{px}$ | Persistent Bottom Navigation Bar ($4\text{ items}$) + Top App Bar | Single-column stacked vertical cards; full-width action sheets | Full-screen overlays or slide-up Bottom Sheets |
| **Tablet** | $768\text{px} \text{ to } 1023\text{px}$ | Collapsible Left Icon Rail + Header | 2-column responsive grid; split view for direct messaging | Centered standard modals ($500\text{px} \text{ max-width}$) |
| **Desktop** | $\ge 1024\text{px}$ | Fixed Left Navigation Sidebar + Global Header | 3-column discovery grid; side-by-side booking and chat panels | Centered multi-column dialogs and dedicated dashboard cards |

---

## 4. Visual Design System

The visual language establishes a warm, approachable community aesthetic balanced with professional typography and structured layouts.

### 4.1 Color Palette Philosophy

* **Primary (Community Accent):** Warm Indigo / Deep Teal — communicates trust, calm collaboration, and stability without mimicking corporate banking blue.
* **Secondary (Action & Focus):** Warm Amber / Ochre — represents earned time, vitality, and primary callouts.
* **Background & Surfaces:** Crisp off-white (`#F8FAFC` or `#FAFAF9`) with clean white (`#FFFFFF`) card surfaces to maintain visual warmth and prevent stark contrast fatigue.
* **Border & Dividers:** Subtle, low-contrast neutral slate (`#E2E8F0` / `#E5E7EB`) providing structural separation without visual clutter.
* **Semantic Tones:**
* *Success:* Emerald Green (for verified reviews, completed sessions, and credit earnings).
* *Warning:* Amber Orange (for upcoming booking cutoffs and pending attestations).
* *Danger:* Crimson Red (for cancellations, late-cancellation penalties, and open disputes).
* *Info / Neutral:* Slate Gray (for metadata tags, category chips, and read-only labels).



### 4.2 Elevation, Borders, and Radii

* **Border Radius:** Consistent, gentle rounding:
* Small chips and badges: $6\text{px}$ (`rounded-md`).
* Standard cards, buttons, and form inputs: $10\text{px}$ (`rounded-lg`).
* Large modal sheets and dashboard containers: $16\text{px}$ (`rounded-2xl`).


* **Elevation & Shadows:** Soft, diffuse ambient drop shadows (`0 1px 3px rgba(0,0,0,0.05)`) to lift interactive cards above background planes. Heavy, dark drop shadows are strictly avoided.

---

## 5. Typography

Typography utilizes standard, highly legible system font stacks or clean modern geometric sans-serif typefaces (e.g., Inter, Plus Jakarta Sans).

| Typography Level | Intended Usage | Font Size / Line Height | Font Weight |
| --- | --- | --- | --- |
| **Display Heading** | Public Landing hero titles | $36\text{px} \text{ to } 44\text{px} / 1.15$ | Bold ($700$) |
| **Heading 1 (H1)** | Primary page titles (Dashboard, Discovery) | $28\text{px} \text{ to } 32\text{px} / 1.25$ | Bold ($700$) |
| **Heading 2 (H2)** | Section titles, listing card headers | $20\text{px} \text{ to } 24\text{px} / 1.30$ | Semi-Bold ($600$) |
| **Heading 3 (H3)** | Modal titles, subsection headers | $16\text{px} \text{ to } 18\text{px} / 1.35$ | Semi-Bold ($600$) |
| **Body (Default)** | Listing descriptions, messages, reviews | $14\text{px} \text{ to } 16\text{px} / 1.50$ | Regular ($400$) |
| **Body (Muted)** | Metadata, timestamps, helper labels | $12\text{px} \text{ to } 13\text{px} / 1.40$ | Regular ($400$) / Medium ($500$) |
| **Credit Numerals** | Available credit balances on wallets | $24\text{px} \text{ to } 32\text{px} / 1.10$ | Bold ($700$) |
| **Button Text** | Interactive controls, form submissions | $14\text{px} \text{ to } 15\text{px} / 1.00$ | Medium ($500$) / Semi-Bold ($600$) |

---

## 6. Iconography

* **Library Standard:** Lucide Icons or Tabler Icons (clean, balanced, geometric line icons).
* **Stroke & Scale:** Standard $1.75\text{px}$ stroke width; standard component sizes are $16\text{px}$ (inline metadata), $20\text{px}$ (buttons and form fields), and $24\text{px}$ (primary navigation).
* **Usage Rule:** Icons must always accompany descriptive text in primary navigation and actionable buttons. Standalone icon buttons must include an accessible `aria-label` and tooltip.

---

## 7. Navigation Architecture

Navigation is organized to allow rapid movement between discovery, active bookings, messaging, and credit management.

### 7.1 Desktop Navigation (Fixed Left Sidebar + Top Bar)

* **Left Sidebar:**
* App Logo & Wordmark.
* Primary Links: **Discover** (Offers & Requests), **My Bookings** (Active & Past Sessions), **Messages** (Chat Threads with unread badge), **Community** (Members & Skills).
* Quick Action CTA: Primary button `+ Create Listing` (opens modal: Offer vs. Request).
* Bottom Sidebar Section: **My Profile**, **Settings**, **Help/Disputes**.


* **Global Top Bar:**
* Location Scope Selector (e.g., *"Pune, All Districts"*).
* Notification Bell (popover with unread counter).
* Wallet Capsule (displays: `1.5 credits available`; clicking routes to `/wallet`).
* User Avatar dropdown menu.



### 7.2 Mobile Navigation (Top App Bar + Persistent Bottom Bar)

* **Top App Bar:** Left: App Wordmark; Right: Notifications Bell and Wallet Capsule (`1.5 cr`).
* **Bottom Navigation Bar (4 Core Tabs):**
* `Discover` (Search & Browse listings).
* `Bookings` (Active schedules & exchange calendar).
* `Messages` (Active chats + badge).
* `Profile` (User profile & wallet access).


* **Floating Action Button (FAB):** Positioned bottom-right or center docked: `+` button to create an Offer or Request.

---

## 8. Information Architecture

The application layout is structured across four primary security and access contexts:

* **Public Context:**
* `/`: Landing Page (Value proposition, how it works, testimonials).
* `/how-it-works`: Step-by-step guide to time credits, escrow, and safety.
* `/discover`: Public catalog of Service Offers and Help Requests (browseable without login; booking requires authentication).
* `/profiles/:handle`: Public user reputation profiles.


* **Authentication Context:**
* `/auth/login`: Email and password login.
* `/auth/register`: Account creation.
* `/auth/verify-email`: Token verification screen.
* `/auth/forgot-password` & `/auth/reset-password`: Credential recovery.


* **Onboarding Context:**
* `/onboarding`: Step-by-step profile setup wizard and starter credit grant screen.


* **Authenticated Member Context:**
* `/dashboard`: Home feed displaying upcoming sessions, recommended offers, and active requests.
* `/discover/offers` & `/discover/requests`: Filterable marketplace directories.
* `/offers/create` & `/requests/create`: Listing creation forms.
* `/bookings`: Unified booking list (tabs: *Upcoming*, *Needs Attestation*, *Past / History*).
* `/bookings/:id`: Comprehensive session container (meeting details, chat, status, actions).
* `/messages` & `/messages/:threadId`: Direct messaging interface.
* `/wallet`: Balance overview, escrowed funds breakdown, immutable ledger history.
* `/users/me/profile`: Profile editor and skill tag management.


* **Moderation Context (`MODERATOR` & `ADMIN` only):**
* `/admin/disputes`: List of open dispute cases with evidence and resolution triggers.
* `/admin/moderation`: User reporting logs, account suspensions, and content takedowns.



---

## 9. Public Landing Experience

The landing page must articulate TimeSwap's non-monetary value proposition within 5 seconds of scanning.

### 9.1 Hero Section

* **Headline:** *"Exchange Your Time and Skills. Learn Anything Without Money."*
* **Subheadline:** *"A community marketplace where 1 hour of help equals 1 time credit. Share what you know, get help with what you need."*
* **Primary CTAs:** Primary Button: `Join the Community (Get 1 Free Credit)`; Secondary Button: `Explore Offers & Requests`.
* **Visual Supporting Graphic:** Interactive preview card illustrating a reciprocal exchange (e.g., *"Rahul teaches 1 hour of Python $\to$ Earns 1 Credit $\to$ Spends 1 Credit to learn Guitar from Maya"*).

### 9.2 Explanatory Sections

* **The 3-Step Loop:** Visual diagram showing: (1) Share a Skill, (2) Earn Time Credits, (3) Redeem for Any Skill.
* **No Money Guarantee:** Callout highlights: $0\text{ fees}$, no cash negotiations, no paid tier advantages.
* **Live Community Preview:** Grid showing 4 to 6 popular Service Offers and active Help Requests with real category tags and coarse locations.

---

## 10. Onboarding UX Wizard

The onboarding flow must be concise, gathering only information necessary for marketplace matching before issuing the starter credit.

### 10.1 Multi-Step Wizard Flow

1. **Step 1: Public Identity:** Input Display Name, unique Handle, and optional Avatar photo.
2. **Step 2: Location & Format:** Select Primary City and General District; choose preference (`Online Only`, `In-Person Only`, or `Both`).
3. **Step 3: What Can You Share? (Supply):** Select or add 1 to 5 skill tags you can help others with (e.g., `Python`, `Resume Design`, `Spoken Spanish`).
4. **Step 4: What Do You Want to Learn? (Demand):** Select or add 1 to 5 skill tags you are seeking assistance with.
5. **Step 5: Bio:** Short personal introduction (minimum 30 characters).
6. **Step 6: Activation & Starter Credit Grant:**
* Visual celebration modal (restrained illustration, non-gamified):
* Banner: *"Welcome to TimeSwap! Your profile is verified."*
* Highlight: *"+1.00 Time Credit has been added to your wallet. You can now book your first 60-minute session or two 30-minute sessions."*
* CTA: `Browse Service Offers` or `Publish Your First Offer`.



---

## 11. Profile UX

Public profiles serve as the foundation of community trust and skill validation.

### 11.1 Profile Header & Trust Banner

* **Avatar & Badges:** User photo, display name, handle (`@username`), and join date.
* **Location Capsule:** Coarse location display (e.g., *"Pune, Kothrud (Open to Online & In-Person)"*).
* **Trust Metrics Capsule:**
* Star Rating: Average score (e.g., `⭐ 4.9`) and total review count.
* Community Hours: Displayed as *"14 hours shared (Provider)"* and *"8 hours received (Requester)"*.
* Reliability Score: Percentage badge (e.g., `96% Reliability`).


* **Profile Bio:** Personal narrative and teaching/learning philosophy.

### 11.2 Skills Matrix

* **"Skills I Can Help With":** Green-tinted skill chips indicating offered capabilities.
* **"Skills I'm Looking For":** Blue-tinted skill chips indicating learning interests.

### 11.3 Public Reviews Feed

* Chronological list of revealed double-blind reviews.
* Each card includes: Reviewer avatar, reviewer display name, session skill tag, star rating, verified session duration (30 min or 60 min), date, and written testimonial.

---

## 12. Discovery UX (Search & Marketplace Catalog)

The discovery catalog connects users with matching offers and requests through fast, deterministic filtering.

### 12.1 Discovery Controls

* **Primary Toggle Switch:** Seamless switch between `Service Offers ("I can help")` and `Help Requests ("I need help")`.
* **Universal Search Bar:** Live search with instant debounce querying listing titles, descriptions, and skill tags.
* **Filter Bar (Horizontal Scroll on Mobile):**
* Category Dropdown (e.g., `Programming`, `Languages`, `Design`, `Music`).
* Format Filter (`All`, `Online`, `In-Person`).
* Duration Filter (`30 min`, `60 min`).
* City / District Selector.


* **Sort Dropdown:** `Most Recent`, `Highest Rated Provider`, `Most Exchanges Completed`.

### 12.2 Listing Card Components

#### Service Offer Card

* **Header:** Provider avatar, display name, coarse location, and aggregate star rating.
* **Title:** Clear offer headline (e.g., *"Beginner Python & Pandas Practice"*).
* **Skill Badges:** Standardized category and skill tags.
* **Format & Duration Badge:** E.g., `Online • 30 or 60 min`.
* **Footer:** Action button: `Request Session (0.5 - 1.0 cr)`.

#### Help Request Card

* **Header:** Requester avatar, display name, urgency badge (e.g., `Urgent • Needs this week`).
* **Title:** Clear need headline (e.g., *"Need Mock Interview for React Junior Role"*).
* **Format & Duration Badge:** E.g., `Online • 60 min (1.0 cr)`.
* **Footer:** Action button: `Offer to Help`.

---

## 13. Service Offer Lifecycle UX

### 13.1 Offer Creation Workflow

* Form with structured inputs: Title, Category selector, Skill tag multi-select, Description textarea with formatting hints, Supported Durations checkboxes (`30 min`, `60 min`), Format radio selector, and Location inputs.
* Live preview pane on desktop showing how the listing card will appear to other members.

### 13.2 Offer Management Controls (Owner View)

* Active listings display management controls: `Edit`, `Pause Listing` (temporarily hides from discovery), and `Archive Listing`.

---

## 14. Help Request Lifecycle UX

### 14.1 Request Creation Workflow

* Form inputs: Title, Category, Skill tags, Description, Target Duration (Radio: `30 min (0.5 cr)` or `60 min (1.0 cr)`), Urgency tag, and Format preference.

### 14.2 Proposal Flow (Provider Responding to Request)

* When a Provider clicks `Offer to Help` on a Help Request:
* A slide-up modal opens displaying the request summary.
* Provider inputs proposed date/time, preferred meeting format, and a brief introductory message.
* Submitting sends a formal proposal to the Requester and initializes a direct messaging thread.



---

## 15. Booking & Exchange UX

The booking interface guides participants through scheduling, credit reservation, and session delivery.

### 15.1 Booking Request Modal

1. **Duration Selection:** Choose `30 Minutes (0.50 Credit)` or `60 Minutes (1.00 Credit)`.
2. **Schedule Selection:** Date picker and proposed start time selector.
3. **Session Format:** Choose `Online` or `In-Person`. If in-person, input proposed public meeting venue notes (e.g., *"Central Library Study Room"*).
4. **Context Message:** Text input explaining specific session goals.
5. **Credit Reservation Callout:**
* Clear breakdown: *"1.00 Credit will be locked in Escrow from your available balance (Current Available: 2.50 cr). Credits will be transferred to the Provider only after the session is completed."*


6. **Action CTA:** Primary button `Confirm & Reserve Credits`.

### 15.2 Active Booking Container Screen (`/bookings/:id`)

* **Status Banner:** Prominent color-coded status capsule (e.g., `Pending Provider Acceptance`, `Confirmed - Upcoming`, `In Progress`, `Needs Attestation`, `Completed`).
* **Session Details Card:** Scheduled date/time, countdown timer, duration, credit amount, participant contact cards, and meeting link / location address.
* **Integrated Direct Chat Tab:** Slide-in or side-by-side messaging panel for coordinating session details.
* **Cancellation Safeguard Panel:** Displays current time relative to the 12-hour cancellation deadline with explicit explanations of refund vs. indemnity outcomes.

---

## 16. Credit & Wallet UX

The credit dashboard demystifies time-credit accounting through simple, transparent visual breakdowns.

### 16.1 Wallet Balance Capsule

* **Available Credits:** Large bold numeral (e.g., `2.50 Credits`) with subtext: *"Available to spend on 2.5 hours of help"*.
* **Escrowed Credits:** Secondary numeral (e.g., `1.00 Credit`) with subtext: *"Locked in 1 upcoming booking"*.
* **Lifetime Statistics:** Small informational pills: *"Total Contributed: 12.0 hrs"*, *"Total Received: 9.5 hrs"*.

### 16.2 Immutable Transaction History Table

* Chronological ledger feed displaying:
* Date and Time.
* Transaction Type badge (`Starter Grant`, `Escrow Lock`, `Session Completed`, `Cancellation Refund`, `Dispute Split`).
* Exchange Partner and Skill Tag.
* Direction and Amount (e.g., `+1.00 cr` in green for earnings/refunds, `-1.00 cr` in slate for escrow locks).
* Status indicator (`Settled`).



---

## 17. Booking & Session Visual States

| State Identifier | Visual Badge Style | User-Facing Label | Primary Action Available |
| --- | --- | --- | --- |
| **`PENDING_ACCEPTANCE`** | Amber Pill (Clock Icon) | *"Awaiting Provider Acceptance"* | Requester can Cancel (100% refund); Provider can Accept / Decline. |
| **`CONFIRMED`** | Blue Pill (Calendar Icon) | *"Scheduled & Confirmed"* | View meeting details; cancel booking (subject to 12h policy). |
| **`IN_PROGRESS`** | Indigo Pill (Pulse Dot) | *"Session In Progress"* | Join meeting; attest completion. |
| **`NEEDS_ATTESTATION`** | Purple Pill (Checkmark Icon) | *"Awaiting Completion Confirmation"* | Both parties prompted to click `Confirm Session Completed`. |
| **`COMPLETED`** | Green Pill (Shield Check Icon) | *"Completed & Settled"* | Submit double-blind review; view ledger settlement. |
| **`CANCELLED`** | Slate Pill (X Icon) | *"Cancelled"* | View cancellation reason and credit refund/indemnity summary. |
| **`DISPUTED`** | Red Pill (Alert Triangle Icon) | *"Under Moderator Dispute"* | View dispute case; submit evidence; auto-settlement paused. |

---

## 18. Cancellation UX

Cancellations must clearly communicate timing rules and credit consequences before the user confirms.

### 18.1 Pre-Cancellation Confirmation Dialog

* The dialog dynamically computes remaining hours until session start:
* **If $\ge 12\text{ hours}$ before start:**
* Banner: *"Early Cancellation Notice"*
* Message: *"You are cancelling more than 12 hours in advance. 100% of your escrowed credit (1.00 cr) will be refunded immediately to your available wallet balance."*


* **If $< 12\text{ hours}$ before start (Requester Late Cancel):**
* Banner: *"Late Cancellation Notice (Within 12 Hours)"*
* Message: *"Because this cancellation is within 12 hours of the session, your escrowed credit (1.00 cr) will be awarded to the Provider as compensation for their reserved time. This will be recorded on your reliability score."*




* **Mandatory Reason Selector:** Dropdown (e.g., *Schedule Conflict*, *Emergency*, *Misunderstanding*) + optional comment.
* **Action CTAs:** Destructive Button `Confirm Cancellation` vs. Neutral Button `Keep Booking`.

---

## 19. Dispute Resolution UX

### 19.1 User Dispute Filing Workflow

* **Trigger:** Available on any session within 24 hours of scheduled end time via `Report Issue / Open Dispute`.
* **Dispute Form:**
* Reason Selector (e.g., *Provider Did Not Show Up*, *Requester Did Not Show Up*, *Severe Technical Failure*, *Skill Misrepresentation*).
* Detailed Narrative textarea (minimum 50 characters).
* Evidence Attachment Uploader (screenshots, meeting logs).


* **Submission Notice:** Informs the user that escrowed credits are frozen and auto-settlement timers are suspended while a moderator reviews the case.

### 19.2 Moderator Resolution Interface (`/admin/disputes/:id`)

* **Case Dossier View:** Side-by-side participant profiles, original booking details, complete message thread transcript, and submitted evidence.
* **Permitted Resolution Selector (Radio Group):**
* `Full Refund to Requester (100% Escrow -> Requester Wallet)`
* `Full Release to Provider (100% Escrow -> Provider Wallet)`
* `50/50 Credit Split (50% -> Requester, 50% -> Provider)`


* **Mandatory Resolution Notes:** Rationale recorded in the permanent audit log.
* **Action CTA:** Primary Button `Execute Resolution & Settle Ledger`.

---

## 20. Direct Messaging UX

Direct messaging provides a focused, context-gated communication channel between participants.

### 20.1 Thread View Architecture

* **Top Header Context Banner:** Displays the linked booking or listing preview (e.g., *"Booking: Python Tutoring • Sat, 14:00 • 1.0 Credit"*). Clicking opens booking details.
* **Message Area:** Clean chronological chat bubbles with sender avatar, text payload, and delivery timestamps.
* **Composer:** Multi-line text input with standard emoji support and an attachment button.
* **Thread States:**
* *Active:* Full bidirectional messaging enabled.
* *Read-Only (Post-Settlement + 48h or Cancelled):* Composer replaced with an informational banner: *"This conversation is now closed. Further messaging is disabled."*
* *Blocked:* Informational banner: *"You have blocked this user."*



---

## 21. Group Activities UX (Phase 2 Preview)

* **Discovery View:** Filterable catalog of 1-to-N group workshops and study meetups.
* **Activity Card:** Host avatar, activity title, category tag, maximum attendee progress bar (e.g., `7 / 10 spots filled`), scheduled date/time, and format.
* **Join Workflow:** Attendee confirms registration; $1.0\text{ credit}$ is locked into activity escrow.
* *(Note: Phase 2 only; not rendered in MVP).*

---

## 22. Reviews & Reputation UX

### 22.1 Double-Blind Review Modal

* Triggered automatically upon session completion confirmation.
* **Star Rating:** Interactive 1 to 5 star selector.
* **Positive Attribute Tags:** Multi-select chips (e.g., `Punctual`, `Clear Explanations`, `Patient`, `Well Prepared`, `Encouraging`).
* **Written Feedback:** Textarea for qualitative feedback.
* **Double-Blind Privacy Notice:** *"Your review will remain private until both you and your exchange partner have submitted feedback, or until 7 days have passed."*

---

## 23. Notification Center UX

* **In-App Popover & Dedicated Page (`/notifications`):**
* Displays unread badge counter in top navigation.
* Actionable list items with distinct icons (Calendar for bookings, Shield for disputes, Chat for messages).
* Direct deep linking: Clicking a notification navigates directly to the relevant booking container or chat thread.
* `Mark All as Read` utility button.



---

## 24. Empty States

Every empty state must explain why it is empty and provide a clear next step:

| Section | Empty State Message | Action CTA |
| --- | --- | --- |
| **Discovery (No Results)** | *"No listings match your filter criteria. Try expanding your search radius or selecting different categories."* | `Reset All Filters` |
| **My Bookings (Upcoming)** | *"You have no upcoming sessions scheduled. Discover skills you want to learn or publish an offer to help others."* | `Explore Marketplace` |
| **Messages (No Threads)** | *"No active conversations. Messages are created when you book an exchange or inquire about a listing."* | `Browse Offers` |
| **Notifications (Empty)** | *"You're all caught up! Booking updates and session reminders will appear here."* | None |
| **Wallet (No History)** | *"No past transactions yet. Complete your first session to see your ledger activity."* | `Find a Session` |

---

## 25. Loading States

* **Skeleton Screens:** Shimmer placeholder skeletons used for listing cards, profile summaries, and booking containers during initial data fetch.
* **Disabled Mutating Buttons:** Buttons display an inline spinner and disabled state upon click (e.g., *"Reserving Credits..."*, *"Confirming Completion..."*) to prevent duplicate submissions.
* **Non-Optimistic Financial Feedback:** Wallet balances and booking states update on screen only after the backend API returns a verified HTTP response.

---

## 26. Error Handling UX

* **Form Validation Errors:** Displayed directly beneath the offending input field with clear inline error text.
* **Insufficient Credits Modal:** Triggered when attempting a booking with insufficient balance. Displays current available balance, required amount, and CTA: `Offer Help to Earn Credits`.
* **Toast Notifications:** Transient bottom-right toast alerts for non-blocking network anomalies or action confirmations.
* **Global Error Boundaries:** Friendly fallback screens for unexpected exceptions with a `Reload Page` or `Contact Support` action.

---

## 27. Success & Confirmation States

* **Restrained Celebrations:** Use subtle micro-interactions and green confirmation badges rather than disruptive confetti or gamified popups.
* **Actionable Next Steps:** Every success dialog immediately routes the user to the logical next milestone (e.g., After booking creation $\to$ *"View Booking Details"* or *"Add to Calendar"*).

---

## 28. Accessibility Standards (WCAG 2.2 AA)

* **Keyboard Navigability:** All interactive cards, modal dialogs, and dropdowns are fully navigable via `Tab`, `Enter`, `Escape`, and arrow keys. Modals trap focus appropriately.
* **Color Contrast:** Text and interactive elements maintain a minimum contrast ratio of $4.5:1$ against backgrounds ($3:1$ for large headings).
* **Multi-Modal State Signaling:** State badges combine distinct color fills with explicit textual labels and iconography; status is never communicated by color alone.
* **Touch Target Size:** All interactive touch targets on mobile viewports are sized to at least $44\text{px} \times 44\text{px}$ with adequate padding.
* **Screen Reader Labels:** Form controls include explicit `<label>` tags and descriptive `aria-describedby` error hints.

---

## 29. Motion & Animation System

* **Functional Motion Only:** Animations exist solely to communicate state transitions, drawer expansions, and modal appearances.
* **Standard Timing:** Fast, smooth transition durations between $150\text{ms}$ and $250\text{ms}$ utilizing cubic bezier curves (`ease-out`).
* **Accessibility Override:** The interface strictly respects user OS preferences for `prefers-reduced-motion: reduce`, disabling decorative transitions instantly.

---

## 30. Trust and Safety UI Patterns

* **Coarse Location Safeguards:** Public listing cards display only City and General District. A visual lock icon accompanies meeting venue details, with the label: *"Meeting location details are private and shared only with confirmed participants."*
* **In-Person Public Venue Advisory:** When confirming an in-person exchange, the UI displays a safety notice advising users to meet in well-lit, public locations (e.g., campus libraries, cafes).
* **Report & Block Action:** Contextual `...` action menus on profiles and message headers allow users to report abusive conduct or block participants instantly.

---

## 31. Responsive Component Patterns

* **Modal / Bottom Sheet Adaptation:** Centered modal dialogs on desktop viewports automatically transform into slide-up Bottom Sheets with pull handles on mobile screens.
* **Filter Trays:** Desktop left-hand facet sidebars collapse into a slide-out drawer on mobile viewports accessible via a `Filters (Count)` floating button.
* **Split Chat Panels:** Desktop message views present threads on the left and active chat on the right; mobile viewports present a full-screen thread list transitioning into a full-screen chat view.

---

## 32. MVP Screen Inventory

| Screen Identifier | Screen Name | Route Path | Primary Purpose & Content | Primary User Action |
| --- | --- | --- | --- | --- |
| **SCR-01** | Landing Page | `/` | Public value proposition, how time credits work, live preview. | `Join Community` / `Discover` |
| **SCR-02** | Login Screen | `/auth/login` | Email and password authentication. | `Log In` |
| **SCR-03** | Register Screen | `/auth/register` | Account registration and display name capture. | `Create Account` |
| **SCR-04** | Onboarding Wizard | `/onboarding` | Multi-step profile setup, skill tags, location, starter credit. | `Complete Setup` |
| **SCR-05** | Home Dashboard | `/dashboard` | Feed of upcoming sessions, active bookings, recommended offers. | `View Next Session` |
| **SCR-06** | Discover Catalog | `/discover` | Searchable grid of Service Offers and Help Requests with filters. | `Request Exchange` |
| **SCR-07** | Offer Details | `/offers/:id` | Full service offer description, provider trust stats, booking trigger. | `Book Session` |
| **SCR-08** | Request Details | `/requests/:id` | Full help request description, requester background, proposal trigger. | `Offer Help` |
| **SCR-09** | Create Offer | `/offers/create` | Form to publish a new Service Offer ("I can help with X"). | `Publish Offer` |
| **SCR-10** | Create Request | `/requests/create` | Form to broadcast a new Help Request ("I need help with X"). | `Publish Request` |
| **SCR-11** | Bookings List | `/bookings` | Tabbed view of upcoming, pending attestation, and past bookings. | `Open Booking` |
| **SCR-12** | Booking Container | `/bookings/:id` | Session hub: status, meeting link, cancellation, attest completion. | `Attest Completion` |
| **SCR-13** | Wallet & Ledger | `/wallet` | Balance breakdown (available vs escrowed) and transaction table. | `View Ledger History` |
| **SCR-14** | Messages Hub | `/messages` | List of active conversations and chat thread interface. | `Send Message` |
| **SCR-15** | Public Profile | `/profiles/:handle` | Public persona, skill matrix, trust metrics, and revealed reviews. | `View Listings` |
| **SCR-16** | Edit Profile | `/users/me/profile` | Update bio, avatar, skills offered/wanted, and coarse location. | `Save Changes` |
| **SCR-17** | Dispute Case | `/disputes/:id` | Participant dispute view: evidence logs and moderation updates. | `Submit Evidence` |
| **SCR-18** | Dispute Admin | `/admin/disputes` | Moderator dashboard to review grievances and execute settlements. | `Resolve Dispute` |

---

## 33. Core User Flows

### Flow A: New User Onboarding & Starter Credit

1. User lands on `/` $\to$ clicks `Join the Community`.
2. Fills registration form $\to$ verifies email via verification link.
3. Steps through Onboarding Wizard: enters bio, selects city/district, chooses offered and learning skills.
4. Completes setup $\to$ Starter Credit celebration modal displays $+1.00\text{ credit}$ grant $\to$ redirects to `/dashboard`.

### Flow B: Discover & Book a 60-Minute Service Offer

1. User navigates to `/discover` $\to$ filters by Category: `Programming` and Format: `Online`.
2. Selects a Service Offer: *"Beginner Python Mentorship"*.
3. Clicks `Request Session` on the offer detail page.
4. Booking Modal opens: selects `60 Minutes (1.00 Credit)`, chooses date/time, inputs learning goals.
5. Reviews credit lock notice $\to$ clicks `Confirm & Reserve Credits`.
6. Escrow locks $1.00\text{ credit}$ from available wallet balance $\to$ Booking transitions to `PENDING_ACCEPTANCE` $\to$ chat thread initialized.

### Flow C: Session Execution, Attestation & Settlement

1. Scheduled session time arrives $\to$ participants meet via external video meeting link.
2. Session concludes $\to$ both participants open `/bookings/:id` and click `Confirm Session Completed`.
3. Dual attestation is satisfied $\to$ Booking transitions to `COMPLETED`.
4. Double-entry ledger settles: $1.00\text{ credit}$ moves from Escrow to Provider wallet.
5. Review Modal prompts both users for double-blind rating and feedback.

### Flow D: Booking Cancellation (Early vs. Late)

1. Requester opens `/bookings/:id` and clicks `Cancel Booking`.
2. Dialog calculates cutoff window:
* *If $\ge 12\text{ hours}$ before start:* Informs user that $100\%$ ($1.00\text{ cr}$) will be refunded immediately $\to$ Requester confirms $\to$ credits returned to wallet.
* *If $< 12\text{ hours}$ before start:* Informs user that $1.00\text{ cr}$ will be forfeited and paid to Provider as indemnity $\to$ Requester confirms $\to$ credits transferred to Provider.



### Flow E: Dispute Lodging & Moderation Resolution

1. Participant flags unfulfilled session within 24 hours post-session via `Report Issue`.
2. Fills dispute reason and attaches evidence $\to$ Booking transitions to `DISPUTED` $\to$ Auto-settle timer halts.
3. Moderator opens `/admin/disputes/:id`, reviews message transcripts and evidence.
4. Moderator selects `50/50 Credit Split` and submits resolution notes.
5. Ledger executes split ($0.50\text{ cr}$ to Requester, $0.50\text{ cr}$ to Provider) $\to$ Case transitions to `RESOLVED`.

---

## 34. UI/UX Invariants

The following non-negotiable rules must be enforced across all frontend code:

1. **Mobile-First Responsiveness:** All layouts, forms, and dialogs must function seamlessly on mobile viewports ($\ge 360\text{px}$) without horizontal clipping.
2. **Accessible by Standard:** Adhere to WCAG 2.2 AA standards for keyboard focus, contrast ratios, and touch target sizing.
3. **No Unbacked Optimistic Balances:** Never optimistically increment or decrement wallet balances before receiving verified API confirmation.
4. **Explicit Cancellation Warning:** The UI must display the exact credit consequences (full refund vs. provider indemnity) before confirming any cancellation.
5. **No Blind Financial Terms:** Do not display speculative or fiat currency symbols ($, ₹, €) for session bookings; use explicit `credits` or `hours` labels.
6. **Multi-Modal Status Indicators:** Never communicate state, alerts, or validation status by color alone; always pair color with text and iconography.
7. **Gated Direct Messaging:** Never present an unsolicited "Send Direct Message" button on public profile cards.
8. **Protected Location Data:** Never collect or display exact residential street addresses or GPS coordinates on public listing cards.
9. **Double-Blind Integrity:** Never display unrevealed peer reviews until both participants have submitted or the 7-day timer elapses.

---

## 35. UI/UX Decision Summary

| Dimension | Final Design Choice | Primary Rationale |
| --- | --- | --- |
| **Design Direction** | Warm, Modern Community Aesthetic | Fosters collaboration and approachable mutual aid without corporate stiffness. |
| **Responsive Model** | Mobile-First with Bottom Navigation | Ensures complete feature parity for mobile-heavy university student cohorts. |
| **Credit Terminology** | Explicit *"Credits (Hours)"* | Clarifies that $1.0\text{ credit}$ equals 1 hour of help without crypto confusion. |
| **Modal Strategy** | Modals (Desktop) / Bottom Sheets (Mobile) | Provides native, ergonomic interaction patterns across all form factors. |
| **Accessibility Target** | WCAG 2.2 AA Compliance | Guarantees usability for keyboard-only and screen-reader users. |
| **Motion Guidelines** | Functional transitions only ($150\text{-}250\text{ms}$) | Communicates state without causing visual fatigue or interaction lag. |

---

## 36. UI/UX Decisions Resolved

The following UI and user experience decisions have been finalized for the MVP.

### 1. Brand Color Palette

The primary TimeSwap brand color will use **Deep Teal**:

- Primary: `#0F766E`
- Primary hover/dark: `#115E59`
- Primary light/accent: `#CCFBF1`

Supporting neutral colors should remain clean and minimal to maintain a trustworthy, community-focused interface.

The final Tailwind theme should define these as reusable design tokens rather than using raw color values throughout UI components.

### 2. Timezone Display Format

Session times will automatically display in the **viewer's local browser timezone**.

The interface should clearly indicate the timezone abbreviation or offset where appropriate to reduce confusion for remote exchanges.

The MVP will not display both participants' timezones simultaneously on standard booking cards.

### 3. Calendar Integration

The MVP booking confirmation screen will include an **Add to Calendar** action using a standard `.ics` calendar file.

The `.ics` file should contain the confirmed session details, including:

- Session title
- Scheduled start and end time
- Correct timezone information
- Session location or online meeting URL where applicable

The `.ics` format allows users to add the confirmed session to Google Calendar, Apple Calendar, and other compatible calendar applications without requiring separate calendar provider integrations.