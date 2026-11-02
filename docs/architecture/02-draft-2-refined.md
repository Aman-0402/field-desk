# 02. Draft 2: refined

Status: refinement of draft 1. Each change below answers a weakness listed in
draft 1 (numbers refer to that list).

## What changed from draft 1

| Draft 1 weakness                         | Draft 2 answer                                                                                                                                           |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2. WF-002 is a convention called by hand | A **command rules table** declares which commands trigger cash allocation and reward refresh. The action shell runs that step. Services stop calling it. |
| 1. Each correction costs another flow    | Both stories reuse one **settlement-release primitive** and the shared reconcile step, so a new correction is mostly its own validation.                 |
| 4. Two-customer actions are bolted on    | The action context tracks a set of **touched customers**. The shell reconciles, version-bumps, audits and reviews every touched customer.                |
| 6. Receipt mutated in place              | Receipts are never edited. A **reversal link row** marks the original receipt reversed and points at its replacement on the target customer.             |
| 5. Duplicated audit pairs                | Not removed, see "Kept on purpose" below.                                                                                                                |
| 3. Rules unreadable to non-engineers     | Partly: the rules table is plain data. The logic inside each command is still code.                                                                      |

## Design

### 1. Command rules table (new, in `shared`)

One entry per command:

```text
MOVE_PAYMENT      roles: ACCOUNTS, ADMIN   reconciles: yes   rules: CUS-001, ACC-003, WF-001, WF-002
CORRECT_DELIVERY  roles: KAM, ADMIN        reconciles: yes   rules: FUL-001, FUL-006, WF-001, WF-003, WF-005
RECORD_RETURN     roles: WAREHOUSE, ADMIN  reconciles: yes   rules: WF-003, WF-002
...
```

The shell authorizes from `roles` and runs reconcile when `reconciles` is true.
A non-engineer can read the table. It also gives a single place to ask "which
commands move cash?".

### 2. Reconcile step

After a command's own writes, for each touched customer in order:
`allocateCash` (ACC-003) then `rewards.refresh` (REW-002/003). Both already
recompute from the ledger and write only differences, so running them for a
customer who did not change is harmless.

### 3. Settlement primitive

`AccountsService.releaseSettlement(c, charge, newFace, sourceId, released)` moves
the WF-003 loop out of Returns. Release order is cash, then credit, then points.
Returns calls it; FDSK-170 calls it. Existing tests prove Returns is unchanged.

### 4. Representing reversals without breaking constraints

- **Deliveries.** The `qty > 0` check becomes `qty <> 0` and a `reverses_id` column
  is added. A correction appends a negative delivery row linked to the original.
  Every existing quantity sum (`deliveredForShipmentLine`, order totals, the
  recognized-value audit check) already adds signed quantities, so they keep working.
  WF-005 still holds: each delivery row, positive or negative, has exactly one
  charge at the shipment-line price.
- **Receipts.** The `amount > 0` check stays. A new `receipt_reversals` table links
  a receipt to its reversal and to the replacement receipt. Reversed receipts are
  excluded from live cash (allocation, unapplied cash, credit funding) but stay
  visible in the ledger.

### 5. Decisions on draft 1's open questions

- **Released cash from a delivery correction stays free cash.** When Warehouse
  confirms the missing 4 boxes, WF-002 allocates that cash to the new charge. This
  matches the story and needs no credit note.
- **Redeemed points** on a reduced charge are restored by the same primitive that
  Returns uses (negative redemption, available up, redeemed down).
- **A receipt that funds a credit note cannot be moved.** CRD-001 requires every
  note to be fully receipt-backed, and there is no operation to withdraw a note.
  The command is rejected with a clear message. This is a stated limitation.
- **Correction below returned units is rejected** (FUL-001: `r <= d`).

## Kept on purpose

The audit `review()` checks stay as an independent oracle. The goal is not to
remove the second copy of each invariant; it is to remove the second copy of the
_procedure_. An invariant check written separately from the code that mutates is
what catches bugs in the mutating code. Draft 1 treated this as duplication to
fix; I now think it is the strongest part of the existing design.

## Still weak in this draft

- Business logic inside each command is still imperative TypeScript.
- I have not compared this against the heavier options in the assignment hints
  (a when/then rules engine, sagas, state machines). Draft 3 does that.
