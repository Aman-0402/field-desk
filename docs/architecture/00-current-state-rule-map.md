# 00. Current state: where the canonical rules live today

Baseline: commit `e331fa2`, 251 server tests passing. Rule IDs refer to
`docs/candidate-walkthrough/canonical_business_rules.md` (version 2026-10-26.1).

## How an action runs today

`ActionsService.execute` opens one immediate SQLite transaction, then:

1. checks idempotency key and fingerprint,
2. dispatches on `command.type` through a 20-case `switch` to a domain service,
3. bumps the **one** customer's version and **all** of that customer's order versions,
4. appends an audit event,
5. runs `AuditService.review(customerId)`, about 25 invariant checks written as
   imperative code, and rolls the whole action back if any check fails,
6. returns effects and trace, or `NEEDS_DECISION` when a service throws `DomainDecision`.

Two things here are already framework-like and worth keeping:
the **post-condition review** (verify after mutate) and the **decision channel**
(`DomainDecision` gives rule 7.2 "ambiguity questions" for free).

## Where each rule is enforced

| Rule                           | Enforced in                                                                          | How                                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| CUS-001 account boundary       | `AccountsRepository` queries filter by `customer_id`                                 | Implicit in every query, never stated or checked as a rule                                             |
| ORD-001/003/004/005/006        | `orders.service.ts`, `orders.model.ts`                                               | Imperative if/else on order status                                                                     |
| FUL-001 `0 <= r <= d <= s`     | `ShipmentQuantity`, `ReturnQuantity` models, plus audit check `shipment-quantities`  | Written twice: once at write time, once at review time                                                 |
| FUL-003/004/005/006            | `fulfillment.service.ts`                                                             | Imperative; approval check copy-pasted in `load` and `dispatch`                                        |
| WF-005 one charge per delivery | `fulfillment.service.deliver`, also `correct`                                        | Charge insert is inlined in both; audit check `delivery-charge` re-verifies                            |
| ACC-003 cash priority          | `AccountsService.allocateCash`                                                       | Re-derives from scratch each call (idempotent), good                                                   |
| WF-002 when to allocate        | Hand-called at the end of `receive`, `allocate`, `deliver`, `correct`, `returnItems` | Five call sites; forgetting one silently breaks the rule                                               |
| REW-001/002/003                | `RewardsService.refresh`                                                             | Re-derives entitlement, earned and locked per line; handles clawback; hand-called after every mutation |
| WF-003 return settlement       | `returns.service.ts` (about 150 lines)                                               | Release order cash, then credit, then points, written inline and not reusable                          |
| WF-001 append-only history     | Convention                                                                           | Reversals are negative rows (`allocations`, `credit_applications`, `redemptions`, `RETURN` charges)    |
| CRD-001..006                   | `credits.service.ts`, `credits.model.ts`                                             | Imperative                                                                                             |

## Findings that shape the design

1. **Derived state is already recomputed, not patched.** `allocateCash` and
   `rewards.refresh` read the ledger and write only the difference. That is the
   reconciliation-engine hint from the assignment, already half built. The weak
   point is that every caller must remember to invoke them (WF-002).
2. **The same logic exists in three forms**: write-time guard, audit check, and
   canonical doc. Nothing links them. A rule change touches all three.
3. **Release-of-settlement is trapped inside Returns.** Reversing cash, credit and
   points off a reduced charge (WF-003) is exactly what a delivery correction needs
   (FDSK-170) and partly what moving a payment needs (FDSK-169), but it cannot be
   called from elsewhere.
4. **The action context assumes one customer.** `c.customerId` is a single value,
   and `ActionsService` bumps versions and runs `review()` for that customer only.
   FDSK-169 touches two customers in one action.
5. **Schema constraints block naive reversal.** `payment_receipts.amount_paise > 0`
   and `deliveries.qty > 0` rule out negative rows. Allocations, credit
   applications and redemptions may be negative, which is why returns reverse by
   appending negatives there. Receipts and deliveries need another way to be
   reversed (a reversal row that links to the original, or a status flag).
6. **Credit funding links receipts to credit notes.** A receipt that already funds
   a credit note (`credit_funds`) that was applied or refunded cannot simply move
   customers (CRD-001, CUS-001). This is the main ambiguity in FDSK-169.

## Feature impact (what each story must touch)

**FDSK-169, move payment from customer A to customer B**

- Reverse the receipt's allocations on A's charges (negative allocations).
- Handle credit funding reserved from the receipt: if unused, release it; if
  applied or refunded, reject or ask (decision).
- Remove the receipt from A and record it on B with the same bank reference.
- Re-run ACC-003 and REW on **both** customers. A may gain outstanding charges and
  lose points (possible clawback); B gets cash and earns points.
- Review invariants for both customers; bump both versions.

**FDSK-170, correct an overstated delivery from 10 to 6**

- Record a compensating reduction of 4 against the delivery (cannot edit the row, WF-001).
- Reduce the matching goods charge by 4 x price and release settlement in WF-003 order.
- Reopen the shipment (`DELIVERED` back to `DISPATCHED`) so Warehouse can confirm
  the remaining 4 later (FUL-006).
- Refresh rewards. Released cash returns to free cash or credit.
- `FUL-001` must still hold: `r <= d` means the correction cannot go below returned units.

Both stories sit outside the current operation boundary
(`business_terms.md`: "no general receipt-edit action, or arbitrary historical
shipment editor"), so each needs new canonical rules, written in the same
numbered style, before code.
