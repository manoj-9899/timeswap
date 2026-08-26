# docs/05_CREDIT_LEDGER.md: TimeSwap Credit & Ledger Specification

This document defines the authoritative financial engineering, double-entry accounting rules, escrow state transitions, settlement flows, and invariant constraints for the TimeSwap platform. It serves as the definitive specification for implementation in Google Antigravity.

---

## 1. Credit System Principle

The TimeSwap economy operates on an egalitarian temporal standard:

* **Standard Hourly Exchange:** $60\text{ minutes of verified service} = 1.00\text{ Time Credit}$.


* **Half-Hour Exchange:** $30\text{ minutes of verified service} = 0.50\text{ Time Credits}$.
* **Fixed Decimal Precision:** All credit amounts are stored and calculated using fixed two-decimal precision (`DECIMAL(6,2)`).

### 1.1 Fundamental Non-Monetary Rules

TimeSwap credits are internal units of account designed strictly for mutual aid and skill circulation:

* Credits **cannot** be purchased with fiat currency.
* Credits **cannot** be sold, cashed out, or redeemed for money.


* Credits **cannot** be transferred, tipped, or gifted between users outside a verified session booking.
* Credits **do not expire** and carry **zero carrying charges or demurrage fees**.


* There is **no dynamic, surge, or skill-based pricing**; one hour of any service equals exactly one credit.



---

## 2. Credit Sources and Movement Taxonomy

Credits enter, circulate through, and exit active availability through distinct ledger operations.

| Operation Type | Economic Effect | Source Account | Destination Account | Permitted Triggers |
| --- | --- | --- | --- | --- |
| **System Issuance** | Expands aggregate money supply ($\Delta M > 0$) | `SYSTEM_RESERVE` | `USER_WALLET` | One-time Onboarding Starter Grant ($1.00\text{ credit}$). |
| **Escrow Lock** | Zero net change; locks spendable liquidity | `USER_WALLET` | `ESCROW_HOLD` | Confirmed Booking creation. |
| **Escrow Settlement** | Zero net change; transfers earned time | `ESCROW_HOLD` | `USER_WALLET` | Dual attestation or 24-hour auto-settlement timeout. |
| **Escrow Refund** | Zero net change; restores spendable liquidity | `ESCROW_HOLD` | `USER_WALLET` | Eligible cancellation or Moderator refund ruling. |
| **Escrow Split** | Zero net change; divides locked credits | `ESCROW_HOLD` | `USER_WALLET` (both) | Moderator 50/50 dispute resolution. |
| **Treasury Sink** | Zero net change; retires unbacked or forfeited credits | `ESCROW_HOLD` | `TREASURY_SINK` | Administrative dispute penalty or account termination forfeiture.

 |

---

## 3. Starter Credit Architecture

To solve the marketplace cold-start challenge, new participants receive an initial credit allocation upon completing identity onboarding.

* **Grant Amount:** Exactly $1.00\text{ Time Credit}$.
* **Grant Timing:** Awarded immediately upon transition of the user's profile to `ACTIVE` (requires verified email, completed bio, location, and at least one offered and one learning skill).
* **Single-Issuance Guard:** The system enforces a unique database constraint on `(user_id, 'ONBOARDING_GRANT')` within the ledger transaction table. Duplicate starter grants for the same user ID are structurally impossible.
* **Accounting Mechanism:** The platform's root equity account (`SYSTEM_RESERVE`) is debited, and the user's asset account (`USER_WALLET`) is credited.

---

## 4. Earning Credits

Credits are earned strictly through the verified delivery of scheduled sessions.

* **Fulfillment Precondition:** No credit is ever awarded upon booking creation, provider acceptance, or calendar arrival.
* **Settlement Trigger:** Credits move from `ESCROW_HOLD` to the Provider's `USER_WALLET` only when:
1. Both Requester and Provider submit positive completion attestations; OR
2. The Requester attests completion unilaterally following the session end time; OR
3. The 24-hour post-session auto-settlement window elapses without dispute; OR
4. A Moderator resolves an open dispute in favor of the Provider (`FULL_RELEASE_PROVIDER`).



---

## 5. Spending and Reserving Credits

When a Requester initiates a booking, spendable credits must be immediately sequestered to guarantee provider compensation upon session completion.

### 5.1 Balance Classifications

* **Available Balance:** Spendable liquidity currently uncommitted to any active booking ($B_{\text{available}}$).
* **Escrowed (Reserved) Balance:** Credits locked in active, uncompleted bookings ($B_{\text{escrowed}}$).
* **Total Ledger Balance:** Total net credits owned by the user ($B_{\text{total}} = B_{\text{available}} + B_{\text{escrowed}}$).

### 5.2 Reservation Rule

A booking requires $B_{\text{available}} \ge \text{Cost}$ ($0.50$ for 30 minutes, $1.00$ for 60 minutes). Upon booking confirmation, the required amount is transferred from `USER_WALLET` to `ESCROW_HOLD`. The Requester cannot spend or double-commit these credits while the booking remains active.

---

## 6. Wallet and Account Model

The TimeSwap credit architecture decouples user presentation from immutable accounting.

### 6.1 Conceptual Wallet Separation

A user's `CreditWallet` is a query-optimized representation of their ledger status:

* **Authoritative Source:** The sum of all historical immutable journal entries associated with the user's `LedgerAccount`.
* **Cached Summary Snapshot:** For sub-millisecond API response times, the `CreditWallet` entity stores cached `available_balance` and `escrowed_balance` columns.
* **Synchronization Invariant:** Every ledger mutation updates the cached snapshot within the same database transaction. Any drift detected during background audits is reconciled using the ledger journal sum.

---

## 7. Double-Entry Ledger Architecture

TimeSwap implements a classical double-entry accounting engine. Every financial event is recorded as a balanced transaction composed of equal debit and credit journal entries.

### 7.1 Ledger Account Types

| Account Type | Category | Normal Balance | Economic Purpose |
| --- | --- | --- | --- |
| `USER_WALLET:{user_id}` | Prosumer Asset | Credit | Spendable time credits owned by a specific user. |
| `ESCROW_HOLD:{booking_id}` | Platform Liability | Credit | Custodial vault holding credits during active bookings.

 |
| `SYSTEM_RESERVE` | Platform Equity | Debit | Central issuing authority for onboarding grants. |
| `TREASURY_SINK` | Platform Equity | Credit | Holding account for permanently retired or forfeited credits.

 |

### 7.2 Debit and Credit Rules

TimeSwap applies standard deposit-liability banking conventions:

* For `USER_WALLET` and `ESCROW_HOLD` accounts:
* A **Credit Entry** increases the account balance.
* A **Debit Entry** decreases the account balance.


* For the `SYSTEM_RESERVE` account:
* A **Debit Entry** represents the issuance of new credits into circulation.
* A **Credit Entry** represents the absorption of credits back into the reserve.



---

## 8. The Double-Entry Invariant

Every ledger transaction must satisfy the fundamental conservation equation:

$$\sum_{j=1}^{n} \text{Debit}_j - \sum_{j=1}^{n} \text{Credit}_j = 0.00$$

### 8.1 Invariant Rules

1. **Zero-Sum Equilibrium:** A transaction with unbalanced entries is rejected by database constraints.
2. **Strict Immutability:** `LedgerTransaction` and `JournalEntry` records are append-only. They must **never** be updated or deleted.
3. **Compensating Corrections:** Any accounting error, dispute adjustment, or refund must be executed as a new compensating `LedgerTransaction`, preserving full historical auditability.

---

## 9. Escrow Lifecycle

The escrow state machine governs credit custody from booking creation to final resolution.

```
[Booking Created] 
       |
       v
  (HELD)  ------------------------> Debit:  USER_WALLET:{requester}
       |                            Credit: ESCROW_HOLD:{booking_id}
       |
       +-----------------------------------------------------------+
       |                             |                             |
       v (Completion / Auto-Settle)  v (Cancellation / Refund)    v (50/50 Split)
   (SETTLED)                     (REFUNDED)                    (SPLIT)
Debit:  ESCROW_HOLD           Debit:  ESCROW_HOLD           Debit:  ESCROW_HOLD (1.00)
Credit: USER_WALLET:{provider}Credit: USER_WALLET:{requester}Credit: USER_WALLET:{req} (0.50)
                                                            Credit: USER_WALLET:{pro} (0.50)

```

* **`HELD`:** Credits are locked; spendable balance reduced; funds held in custodial escrow.
* **`SETTLED`:** Session successfully executed; escrow emptied; credits deposited into Provider's wallet.
* **`REFUNDED`:** Session cancelled or refunded; escrow emptied; credits restored to Requester's wallet.
* **`SPLIT`:** Dispute resolved via split; escrow emptied; credits divided equally between participants.

---

## 10. Normal Successful Exchange Accounting

### 10.1 60-Minute Session Workflow ($1.00\text{ Credit}$)

* **Initial State:** Requester available balance $= 2.00$; Provider available balance $= 0.00$.
* **Step 1: Booking Confirmed (Escrow Lock)**
* Transaction Type: `BOOKING_ESCROW_LOCK`
* Debit: `USER_WALLET:{requester_id}` $\to 1.00$
* Credit: `ESCROW_HOLD:{booking_id}` $\to 1.00$
* Intermediate State: Requester (Available: $1.00$, Escrowed: $1.00$); Provider (Available: $0.00$, Escrowed: $0.00$).


* **Step 2: Session Completion (Dual Attestation)**
* Transaction Type: `SESSION_SETTLEMENT`
* Debit: `ESCROW_HOLD:{booking_id}` $\to 1.00$
* Credit: `USER_WALLET:{provider_id}` $\to 1.00$
* Final State: Requester (Available: $1.00$, Escrowed: $0.00$); Provider (Available: $1.00$, Escrowed: $0.00$).



### 10.2 30-Minute Session Workflow ($0.50\text{ Credits}$)

* **Step 1: Booking Confirmed:** Debit `USER_WALLET:{requester_id}` $0.50$; Credit `ESCROW_HOLD:{booking_id}` $0.50$.
* **Step 2: Session Settlement:** Debit `ESCROW_HOLD:{booking_id}` $0.50$; Credit `USER_WALLET:{provider_id}` $0.50$.

---

## 11. Early Cancellation Accounting ($\ge 12\text{ Hours}$)

When a session is cancelled at or before the 12-hour threshold:

* **Trigger:** Requester cancels, Provider cancels, or both agree to cancel $\ge 12\text{ hours}$ prior to scheduled start.
* **Ledger Action:**
* Transaction Type: `CANCELLATION_REFUND`
* Debit: `ESCROW_HOLD:{booking_id}` $\to \text{Full Amount}$ ($0.50$ or $1.00$)
* Credit: `USER_WALLET:{requester_id}` $\to \text{Full Amount}$ ($0.50$ or $1.00$)


* **Net Result:** Requester available balance is restored; Provider balance is unchanged; escrow balance returns to $0.00$.

---

## 12. Late Cancellation Accounting ($< 12\text{ Hours}$)

To protect participant time, cancellations within the 12-hour window are subject to non-symmetric indemnity policies.

### 12.1 Requester Late Cancellation (Provider Indemnity)

* **Rule:** If the Requester cancels $< 12\text{ hours}$ before start, the Provider receives full compensation for their reserved time.
* **Ledger Action:**
* Transaction Type: `LATE_CANCELLATION_INDEMNITY`
* Debit: `ESCROW_HOLD:{booking_id}` $\to \text{Full Amount}$ ($0.50$ or $1.00$)
* Credit: `USER_WALLET:{provider_id}` $\to \text{Full Amount}$ ($0.50$ or $1.00$)


* **Net Result:** Escrow is transferred to Provider; Requester forfeits locked credits.

### 12.2 Provider Late Cancellation

* **Rule:** If the Provider cancels $< 12\text{ hours}$ before start, the Requester receives a full refund immediately.
* **Ledger Action:**
* Transaction Type: `CANCELLATION_REFUND`
* Debit: `ESCROW_HOLD:{booking_id}` $\to \text{Full Amount}$
* Credit: `USER_WALLET:{requester_id}` $\to \text{Full Amount}$


* **Reputation Impact:** A late cancellation strike is recorded on the Provider's profile reliability record.

---

## 13. No-Show Accounting

* **Requester No-Show:** The Provider confirms attendance but the Requester fails to appear. The session is marked unfulfilled by Requester. Escrow settles $100\%$ to the Provider via `NO_SHOW_INDEMNITY`.
* **Provider No-Show:** The Requester reports the Provider absent. Escrow is refunded $100\%$ to the Requester via `NO_SHOW_REFUND`, and a reliability penalty is applied to the Provider.

---

## 14. Completion and Settlement Mechanics

Settlement represents the permanent transfer of credit ownership from escrow to the provider.

### 14.1 Attestation Pathways

1. **Dual Attestation:** Both parties click *"Confirm Completion"* $\to$ Instant Settlement.
2. **Unilateral Requester Attestation:** Requester clicks *"Confirm Completion"* $\to$ Instant Settlement.
3. **Unilateral Provider Attestation:** Provider confirms $\to$ System initiates a 24-hour dispute countdown window. If no dispute is filed within 24 hours, background worker triggers Auto-Settlement.
4. **Zero Attestation:** Neither party confirms $\to$ System triggers Auto-Settlement 24 hours post-session end time.

---

## 15. Auto-Settlement Specification

The automated settlement engine runs on a scheduled BullMQ background cron job.

### 15.1 Operational Parameters

* **Scan Frequency:** Runs every 10 minutes.
* **Target Criteria:** Sessions with status `CONFIRMED` or `IN_PROGRESS` where `scheduled_end_time + 24 hours <= NOW()` and `dispute_status IS NULL`.
* **Execution:**
1. Opens atomic database transaction with row-level lock on `Booking` and `EscrowHold`.
2. Verifies `EscrowHold.status == 'HELD'`.
3. Executes `SESSION_SETTLEMENT` ledger transaction.
4. Transitions `Booking.status` to `COMPLETED` and `EscrowHold.status` to `SETTLED`.
5. Enqueues completion notifications to both participants.


* **Dispute Suspension:** If a dispute is lodged at minute 23:59 post-session, the auto-settlement query skips the record entirely.

---

## 16. Refund Accounting

Refunds must never overwrite or delete previous journal entries.

* **Immutable Reversal Rule:** A refund generates a distinct `CANCELLATION_REFUND` or `DISPUTE_REFUND` ledger transaction.
* **Idempotent Execution:** Refund handlers assert that the source `ESCROW_HOLD` has not already been debited. If `EscrowHold.status != 'HELD'`, the operation aborts immediately.

---

## 17. Dispute Resolution Accounting

When a dispute is arbitrated, the Moderator chooses one of three terminal outcomes:

| Outcome | 30-Minute Session ($0.50$) | 60-Minute Session ($1.00$) | Economic Action |
| --- | --- | --- | --- |
| **`FULL_REFUND_REQUESTER`** | Requester $+0.50$; Provider $+0.00$ | Requester $+1.00$; Provider $+0.00$ | $100\%$ of escrowed credit returned to Requester wallet. |
| **`FULL_RELEASE_PROVIDER`** | Requester $+0.00$; Provider $+0.50$ | Requester $+0.00$; Provider $+1.00$ | $100\%$ of escrowed credit released to Provider wallet. |
| **`SPLIT_50_50`** | Requester $+0.25$; Provider $+0.25$ | Requester $+0.50$; Provider $+0.50$ | Escrow divided equally between both participant wallets. |

* **Ledger Invariant:** In all three scenarios, total credits debited from `ESCROW_HOLD` equal the total credits distributed to user wallets. Zero net credits are created.

---

## 18. Partial Completion Handling

To maintain simplicity, TimeSwap MVP does not implement automatic minute-by-minute fractional billing.

* **MVP Rule:** A booking is settled based on its contracted duration ($30\text{ min} = 0.50$, $60\text{ min} = 1.00$).
* **Disrupted Sessions:** If a 60-minute session terminates early (e.g., at minute 20) due to technical failure:
1. *Preferred Path:* Participants mutually agree to schedule a 30-minute makeup session without filing a dispute; OR
2. *Dispute Path:* Either party opens a dispute, and the Moderator applies the `SPLIT_50_50` outcome ($0.50$ returned to Requester, $0.50$ awarded to Provider).



---

## 19. Global Credit Conservation

The TimeSwap ledger enforces closed-loop monetary conservation across all platform accounts.

### 19.1 System-Wide Balance Equation

At any instant $t$, the sum of all balances across all account types equals exactly zero:

$$\text{Balance}(\text{SYSTEM\_RESERVE}) + \sum_{i=1}^{N} \text{Balance}(\text{USER\_WALLET}_i) + \sum_{k=1}^{M} \text{Balance}(\text{ESCROW\_HOLD}_k) + \text{Balance}(\text{TREASURY\_SINK}) = 0.00$$

* Because `SYSTEM_RESERVE` maintains a negative balance corresponding to total issued starter credits, and all other accounts maintain non-negative credit balances, the platform balance sheet remains continuously balanced.

---

## 20. Double-Spending and Concurrency Safeguards

To prevent race conditions where a user attempts to spend the same credit across concurrent booking requests:

1. **Row-Level Locking:** All credit deductions execute within a Prisma transaction that acquires an exclusive row lock on the user's `LedgerAccount` record:
```
SELECT * FROM "LedgerAccount" WHERE "id" = :id FOR UPDATE;

```


2. **Database Check Constraints:** The database schema enforces a strict check constraint on user wallets:
```
CONSTRAINT check_non_negative_balance CHECK (balance >= 0.00)

```


3. **Isolation Level:** Transactions affecting balances execute under `READ COMMITTED` with row locks, or `SERIALIZABLE` isolation.

---

## 21. Idempotency Specification

All ledger-mutating operations must support idempotent execution via unique client-supplied or event-derived keys.

| Operation | Idempotency Key Composition | Duplicate Execution Handling |
| --- | --- | --- |
| **Starter Credit Grant** | `grant:onboarding:{user_id}` | Database unique constraint rejects duplicate; returns existing balance. |
| **Escrow Reservation** | `escrow:lock:{booking_id}` | Returns existing `EscrowHold` record without creating additional debits. |
| **Session Settlement** | `settle:session:{booking_id}` | Verifies hold state; if already `SETTLED`, returns success without re-crediting. |
| **Cancellation Refund** | `refund:cancel:{booking_id}` | Verifies hold state; if already `REFUNDED`, returns success without duplicate credits. |
| **Dispute Resolution** | `dispute:resolve:{dispute_id}` | Verifies dispute state; rejects duplicate settlement commands with `409 Conflict`. |

---

## 22. Immutability and Audit Requirements

1. **Append-Only Journal:** Under no circumstances may an `UPDATE` or `DELETE` SQL statement be executed against `LedgerTransaction` or `JournalEntry` tables.
2. **Audit Trail Completeness:** Every `LedgerTransaction` must store:
* `transaction_type` (Enum)
* `reference_entity_type` (`BOOKING`, `USER`, `DISPUTE`)
* `reference_entity_id` (UUID)
* `created_at` (Immutable UTC timestamp)


3. **Reconciliation Cron:** A nightly background verification job calculates $\sum \text{Debits} - \sum \text{Credits}$ across the entire database and alerts system administrators if any non-zero variance is detected.

---

## 23. Authoritative Balance Computation

The authoritative available balance of a user $u$ is calculated directly from immutable journal entries:

$$B_{\text{available}}(u) = \sum \text{Credits}(u) - \sum \text{Debits}(u) - B_{\text{locked\_in\_active\_escrows}}(u)$$

The cached `available_balance` on `CreditWallet` is maintained synchronously during ledger transactions to eliminate expensive dynamic aggregations during standard API queries.

---

## 24. Database Transaction Boundaries

The following operations must execute within single, atomic database transactions (`prisma.$transaction`):

* **Create Booking & Lock Escrow:**
1. Lock Requester `LedgerAccount`.
2. Verify balance $\ge \text{Cost}$.
3. Create `Booking` (status `PENDING_ACCEPTANCE`).
4. Create `Session`.
5. Create `LedgerTransaction` (`BOOKING_ESCROW_LOCK`).
6. Create Debit `JournalEntry` (Requester Wallet) and Credit `JournalEntry` (`ESCROW_HOLD`).
7. Create `EscrowHold` record.
8. Decrement cached `CreditWallet.available_balance`.


* **Settle Session:**
1. Lock `Booking` and `EscrowHold`.
2. Verify `EscrowHold.status == 'HELD'`.
3. Create `LedgerTransaction` (`SESSION_SETTLEMENT`).
4. Create Debit `JournalEntry` (`ESCROW_HOLD`) and Credit `JournalEntry` (Provider Wallet).
5. Update `EscrowHold.status = 'SETTLED'`.
6. Update `Booking.status = 'COMPLETED'`.
7. Increment cached Provider `CreditWallet.available_balance`.



---

## 25. Failure Scenarios and Recovery Behavior

| Failure Mode | Direct System Impact | Automated Recovery / Guarantee |
| --- | --- | --- |
| **API Process Crash during Escrow Lock** | Incomplete transaction payload | PostgreSQL automatically rolls back uncommitted transaction; zero credits deducted.

 |
| **Network Timeout after Settlement** | Client receives 504 Gateway Timeout | Client retries with `Idempotency-Key`; API detects `SETTLED` state and returns 200 OK without re-crediting. |
| **Duplicate BullMQ Auto-Settle Jobs** | Two workers process same session | First worker acquires row lock and settles; second worker reads `SETTLED` status and terminates safely. |
| **Concurrent Booking Requests** | User with $1.00\text{ credit}$ clicks book twice | Row lock forces sequential execution; first booking locks $1.00$, second fails with `INSUFFICIENT_CREDITS`. |

---

## 26. Credit and Ledger Invariants

The following 14 invariants must never be violated in code, migrations, or database maintenance:

1. **Double-Entry Balance:** Every ledger transaction must have balanced journal entries ($\sum \text{Debits} = \sum \text{Credits}$).


2. **Zero Spontaneous Generation:** Credits can only be issued via `SYSTEM_RESERVE` onboarding grants.
3. **Zero Unbacked Deletion:** Credits can only be retired into `TREASURY_SINK`.
4. **No Negative Wallets:** User wallet balances must never drop below $0.00\text{ credits}$.
5. **No Double-Spending:** Reserved credits in `ESCROW_HOLD` cannot be committed to multiple bookings.
6. **Single Settlement Invariant:** A booking escrow hold can be settled to a provider exactly once.
7. **Single Refund Invariant:** A booking escrow hold can be refunded to a requester exactly once.
8. **Single Starter Grant:** A user account can receive the onboarding credit grant at most once.
9. **Ledger Immutability:** Journal entries and ledger transactions are strictly append-only.
10. **PostgreSQL Authoritativeness:** Ledger balances reside authoritatively in PostgreSQL, never Redis.


11. **No Client Balance Overrides:** No API endpoint may accept direct credit adjustments from the frontend.
12. **Deterministic Duration Valuation:** 30 minutes must equal exactly $0.50$ credits; 60 minutes must equal exactly $1.00$ credit.
13. **Atomic State Transitions:** Booking status updates and ledger entries must execute within unified database transactions.
14. **Global Conservation:** The sum of all accounts across the entire platform must equal $0.00$ at all times.



---

## 27. Excluded Economic Mechanisms (MVP Scope)

The MVP explicitly **rejects and excludes** the following mechanisms:

* No Demurrage / Balance Decay engines.


* No Credit Expiration schedules.
* No Dynamic / Surge / Quality pricing algorithms.
* No Logarithmic Multi-User Sinking Funds (1-on-1 sessions only in MVP).


* No Multi-Hop Graph Clearing or Johnson Cycle detection.


* No Fiat-to-Credit or Credit-to-Fiat conversion gateways.



---

## 28. Worked Accounting Examples

### Example A: Starter Credit Issuance

* **Event:** User completes onboarding verification.
* **Ledger Entries:**
* Debit: `SYSTEM_RESERVE` $\to 1.00$
* Credit: `USER_WALLET:{user_id}` $\to 1.00$


* **Net Balances:** `SYSTEM_RESERVE` ($-1.00$), `USER_WALLET` ($+1.00$). Sum $= 0.00$.

### Example B: 30-Minute Successful Exchange

* **Event:** Requester books 30-min session; Provider delivers; both confirm.
* **Step 1 (Lock):**
* Debit: `USER_WALLET:{requester}` $\to 0.50$
* Credit: `ESCROW_HOLD:{booking_id}` $\to 0.50$


* **Step 2 (Settle):**
* Debit: `ESCROW_HOLD:{booking_id}` $\to 0.50$
* Credit: `USER_WALLET:{provider}` $\to 0.50$



### Example C: 60-Minute Successful Exchange

* **Event:** Requester books 60-min session; Provider delivers; auto-settled after 24h.
* **Step 1 (Lock):**
* Debit: `USER_WALLET:{requester}` $\to 1.00$
* Credit: `ESCROW_HOLD:{booking_id}` $\to 1.00$


* **Step 2 (Settle):**
* Debit: `ESCROW_HOLD:{booking_id}` $\to 1.00$
* Credit: `USER_WALLET:{provider}` $\to 1.00$



### Example D: Early Cancellation ($\ge 12\text{ Hours}$)

* **Event:** Requester cancels 24 hours prior to session start.
* **Step 1 (Lock):** Debit `USER_WALLET:{requester}` $1.00$; Credit `ESCROW_HOLD:{booking_id}` $1.00$.
* **Step 2 (Refund):**
* Debit: `ESCROW_HOLD:{booking_id}` $\to 1.00$
* Credit: `USER_WALLET:{requester}` $\to 1.00$



### Example E: Late Requester Cancellation ($< 12\text{ Hours}$)

* **Event:** Requester cancels 2 hours prior to session start.
* **Step 1 (Lock):** Debit `USER_WALLET:{requester}` $1.00$; Credit `ESCROW_HOLD:{booking_id}` $1.00$.
* **Step 2 (Indemnity):**
* Debit: `ESCROW_HOLD:{booking_id}` $\to 1.00$
* Credit: `USER_WALLET:{provider}` $\to 1.00$



### Example F: Dispute — Full Refund

* **Event:** Provider fails to attend; Moderator rules in favor of Requester.
* **Step 1 (Lock):** Debit `USER_WALLET:{requester}` $1.00$; Credit `ESCROW_HOLD:{booking_id}` $1.00$.
* **Step 2 (Dispute Refund):**
* Debit: `ESCROW_HOLD:{booking_id}` $\to 1.00$
* Credit: `USER_WALLET:{requester}` $\to 1.00$



### Example G: Dispute — Full Provider Release

* **Event:** Requester makes false non-delivery claim; Moderator verifies completion.
* **Step 1 (Lock):** Debit `USER_WALLET:{requester}` $1.00$; Credit `ESCROW_HOLD:{booking_id}` $1.00$.
* **Step 2 (Dispute Settlement):**
* Debit: `ESCROW_HOLD:{booking_id}` $\to 1.00$
* Credit: `USER_WALLET:{provider}` $\to 1.00$



### Example H: Dispute — 50/50 Credit Split

* **Event:** 60-minute session disrupted by technical connection failure at minute 25.
* **Step 1 (Lock):** Debit `USER_WALLET:{requester}` $1.00$; Credit `ESCROW_HOLD:{booking_id}` $1.00$.
* **Step 2 (Dispute Split Settlement):**
* Debit: `ESCROW_HOLD:{booking_id}` $\to 1.00$
* Credit: `USER_WALLET:{requester}` $\to 0.50$
* Credit: `USER_WALLET:{provider}` $\to 0.50$
* Total Debits ($1.00$) = Total Credits ($0.50 + 0.50 = 1.00$).



---

## 29. Credit & Ledger Decision Summary

| Decision Domain | Final Architectural Rule | Primary Rationale |
| --- | --- | --- |
| **Accounting Methodology** | Double-Entry Relational Ledger | Ensures mathematical auditability and eliminates floating-point balance loss.

 |
| **Precision Standard** | `DECIMAL(6,2)` Fixed Precision | Supports exact $0.50$ and $0.25$ splits without binary floating-point rounding errors. |
| **Escrow Management** | Dedicated `ESCROW_HOLD` per Booking | Isolates booking funds, preventing concurrent double-spending. |
| **Starter Credit Supply** | Debited from Root `SYSTEM_RESERVE` | Keeps global balance sheet in continuous zero-sum equilibrium. |
| **Late Cancellation Penalty** | Full Escrow Transferred to Provider | Compensates provider for lost opportunity cost within the 12-hour window. |
| **Dispute Resolution Bounds** | Refund, Release, or 50/50 Split Only | Constrains moderator actions to strictly balanced, non-inflationary operations. |
| **Balance Source of Truth** | PostgreSQL Journal Entry Aggregations | Redis memory volatility cannot guarantee financial ledger correctness.

 |

---

## 30. Credit & Ledger Decisions Resolved

The following credit and ledger implementation detail has been finalized for the MVP.

### 1. System Reserve Initialization

The root `SYSTEM_RESERVE` ledger account will be created through a dedicated database seed script.

The account will use a fixed, documented identifier defined in application configuration rather than being implicitly created inside a Prisma schema migration.

The seed process must be idempotent, meaning it can be executed multiple times without creating duplicate `SYSTEM_RESERVE` accounts.

Application startup and credit operations must verify that the required system ledger account exists before processing any credit transaction.

The `SYSTEM_RESERVE` account is a protected system account and must not be exposed for direct modification through normal user-facing API endpoints.