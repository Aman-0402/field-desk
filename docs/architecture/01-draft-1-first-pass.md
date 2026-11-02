# 01. Draft 1: first pass

Status: first draft, written after reading the code and before any research.
It records the approach I would take by instinct. Later drafts are expected to
change it, and the reasons for each change are recorded in those drafts.

## Problem in one paragraph

Rules are spread across services as imperative code, written once at write time
and again as audit checks. FDSK-169 and FDSK-170 both need to undo settled money
and points, which the code can only do inside Returns. Adding two more
hand-written services in the same style would work, but would add roughly 400
lines of branching and a third copy of the release logic.

## Approach: middle ground, no framework

Keep the existing layering and the action contract. Do two things:

1. **Extract shared ledger primitives** from `returns.service.ts` into
   `accounts/settlement.ts`:
   - `releaseSettlement(c, charge, newFace)` reduces what a charge can hold and
     releases cash, then credit, then points (WF-003 order), returning the released
     cash per receipt.
   - `reverseAllocation(c, receiptId, chargeId, amount)`.
     `RECORD_RETURN` is rewritten to call these, with no behaviour change. The 251
     existing tests are the safety net for this refactor.
2. **Add two commands** in the existing style:
   - `MOVE_PAYMENT { receiptId, toCustomerId, reason }` handled by `AccountsService`.
   - `CORRECT_DELIVERY { deliveryId, correctedQty, reason }` handled by `FulfillmentService`.

### FDSK-169 flow (`MOVE_PAYMENT`)

1. Authorize `ACCOUNTS`, `ADMIN`. Reject when `toCustomerId` equals the current customer.
2. For each allocation of the receipt, append a negative allocation (releases the charge).
3. If the receipt funds a credit note: reject when any of that note was applied
   or refunded; otherwise delete the funding and the note.
4. Mark the receipt as moved and insert a new receipt on the target customer with
   the same bank reference.
5. Run `allocateCash` and `rewards.refresh` for the source customer, then for the target.
6. Review both customers.

### FDSK-170 flow (`CORRECT_DELIVERY`)

1. Authorize `KAM`, `ADMIN`. Require `0 < correctedQty < delivery.qty` and
   `correctedQty >= returned units` for the shipment line.
2. Append a negative `CORRECTION` charge for `(delivery.qty - correctedQty) * price`,
   linked to the original charge.
3. Call `releaseSettlement`. Released cash becomes free cash on its receipts.
4. Mark the delivery as reduced. If the shipment was `DELIVERED`, set it back to `DISPATCHED`.
5. Run `allocateCash` and `rewards.refresh`.

## Schema changes

- `payment_receipts`: add `moved_to_receipt_id` (nullable) and `moved_at`.
- `deliveries`: add `reduced_by` (nullable action id) and `corrected_qty`.
- Relax nothing else. The `> 0` checks stay.

## What is wrong with this draft (known before research)

1. **It adds code, not leverage.** Each new correction (edit a payment amount,
   void a shipment) costs another hand-written flow plus another audit check.
2. **WF-002 stays a convention.** I would call `allocateCash` and `refresh` by hand
   a sixth and seventh time. This is the exact bug class the assignment describes.
3. **The business rules are still not readable** by a non-technical person. They
   remain TypeScript, so the "express more rules in less space" criterion is not met.
4. **Two-customer actions are bolted on.** `ActionsService` still assumes
   `c.customerId` is a single value, so FDSK-169 needs special cases in the shell.
5. **Rule and audit check stay duplicated.** The two features add two more pairs.
6. **Mutating the receipt in place** (`moved_to_receipt_id`) weakens WF-001. A
   linked reversal row would be cleaner, but I have not yet worked out how to
   keep the `amount > 0` check.

## Open questions to settle in draft 2

- Should released cash from FDSK-170 sit as free cash, or be reserved as credit as
  returns do? (Draft 1 assumption: free cash, then ACC-003 re-allocates it.)
- What happens to points already redeemed against a charge that is being reduced?
- Can a receipt that funds an unused credit note be moved, or must credit be
  withdrawn first? (Draft 1 assumption: unused funding is released.)
- Is the delivery correction an ambiguity (rule 7.2) when the shipment was
  partially returned?
