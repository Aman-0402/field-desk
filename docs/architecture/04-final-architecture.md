# Architecture: final (stage 4)

Status: implemented and tested (265 tests, 14 new). Supersedes drafts 1-3, which stay in the repo to show how the design changed.

## What was built

The code already had a good skeleton: one action shell (`ActionsService.execute`) that runs a command in one SQLite transaction, then an independent audit review that rolls back if any invariant fails. The pain was around it: role checks and "recompute cash and points" calls were repeated by hand in each service, an action could only touch one customer, and the settlement-release logic lived inside Returns. FDSK-169 and FDSK-170 both hit those three walls. So we did not add an engine. We made the existing pattern declarative and removed the walls.

| Piece | Where | Purpose |
|---|---|---|
| Command rules table | `shared/src/command-rules.ts` | One row per command: summary, roles, `reconciles` (WF-002), rule IDs. The compiler forces a row for every command. |
| Shell-owned reconcile | `actions.service.ts` | After a command, for every customer the command touched: allocate free cash (ACC-003), refresh rewards. Services no longer call it. |
| Touched-customers set | `ActionContext.touched` | Lets one action change two accounts (needed by FDSK-169). The primary customer is version-checked; other touched customers just get a version bump and an audit event. |
| Settlement release primitive | `AccountsService.releaseSettlement` | WF-003 (cash, then credit, then points), extracted from Returns, reused by delivery correction. |
| Signed delivery rows | `deliveries.reverses_id` | A correction appends negative rows; nothing is edited (WF-001). |
| Receipt reversal link | `receipt_reversals`, `payment_receipts.moved_from_receipt_id` | A moved receipt is marked reversed and linked to its replacement. |
| Derived shipment status | `shipmentStatusFor` | `DISPATCHED` vs `DELIVERED` follows quantities, so a correction and a later confirmation both land correctly. |
| New audit checks | `audit.service.ts` | `account-boundary` (CUS-001) and `receipt-reversal:<id>`. The audit stays separate from the services on purpose: it is the oracle that catches a service getting it wrong. |

## FDSK-170: correct an overstated delivery

Command `CORRECT_DELIVERY` (KAM). Flow: validate shipment state and that each new quantity is below delivered and not below returned; reverse the latest confirmations first with negative delivery rows; append a negative `DELIVERY_REVERSAL` charge against the original charge; release settlement above the reduced charge; sync shipment status; shell reconciles.

Example (10 delivered and paid, only 6 arrived): charge becomes 6 x price, the extra cash becomes free cash, points on the missing 4 units are locked again. When Warehouse later confirms the 4, WF-002 applies the free cash to the new charge and points come back.

## FDSK-169: move a payment to the right customer

Command `MOVE_PAYMENT` (Accounts). Flow: find a live receipt on the source customer; reject if same customer, target missing, or the receipt funds a credit note; reverse every allocation with negative rows; insert a replacement receipt on the target with the same amount, reference and `created_at`; record the reversal link; add the target to `touched`. The shell then reconciles both customers: the source's charges reopen and may be re-settled from its other free cash, the target's cash settles its own charges, and rewards and clawback follow.

## API

Two new action types on `POST /api/actions` (see `docs/api.md`). Both are idempotent and return both customers' versions where relevant.

## Known limitations (deliberate)

- A receipt that funds a credit note cannot be moved (`RECEIPT_FUNDS_CREDIT`). Moving it would need a credit reversal first; we reject rather than guess.
- The target customer's version is bumped but not checked, so a concurrent edit to the target is not detected by the move itself. The audit still verifies both accounts.
- Delivery correction can only lower quantities; raising a quantity is a normal confirmation.
- No UI forms yet; both commands are available through the API. The client builds and typechecks with the new command types.
- The new commands go beyond `business_terms` ("no general receipt-edit action"), so ACC-004 and FUL-007 were added to the canonical rules as proposals the business should confirm.

## Metrics (`pnpm metrics`, includes tests)

| | Files | Non-blank lines | Decision nodes |
|---|---|---|---|
| Before (upstream) | 126 | 14,875 | 939 |
| After | 128 | 16,010 | 982 |

Two features and 14 tests added about 1,100 lines and 43 decision nodes; the refactor removed repeated role and reconcile code from the services, so the growth is mostly the features and their tests.
