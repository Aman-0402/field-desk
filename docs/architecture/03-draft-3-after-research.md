# 03. Draft 3: after research and discussion with an LLM

Status: the design after comparing draft 2 against the patterns listed in the
assignment hints. Honest note on method: this stage is a structured discussion
with a coding assistant (Claude) over the hinted patterns and the repository
metrics below. No external web research was done; the comparison draws on the
assistant's general knowledge of these patterns, so treat the claims about
other tools (for example Drools) as design reasoning rather than benchmarks.

## Measurements that frame the choice

From `pnpm metrics` at the baseline commit:

| Area          | Non-blank TS lines | Decision nodes |
| ------------- | ------------------ | -------------- |
| `server/src`  | 6,906              | 425            |
| `server/test` | 3,288              | 94             |
| `client`      | 4,249              | 415            |
| `shared`      | 432                | 5              |

The business logic is a few thousand lines. The assignment's own rule of thumb
says a roughly 10,000-line engine for 3,000 to 4,000 lines of business code is
overkill. A general rules engine here would be at least as large as what it
governs.

## The hinted patterns, one by one

| Pattern                                | What it would buy here                                       | What it would cost here                                                                                                                                          | Verdict                                                                                                                          |
| -------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **when/then rules DSL (Drools style)** | Rules readable by non-engineers                              | A parser, a matcher and a fact model for about 20 commands. Rules over ledger sums need aggregates, which a Rete-style engine handles awkwardly.                 | **Reject.** Take the readable table idea, not the engine.                                                                        |
| **State machines per table**           | Illegal states unrepresentable                               | Order and shipment already have small status sets. Money state is quantities and sums, not a status.                                                             | **Use narrowly.** Derive shipment status from quantities instead of storing transitions.                                         |
| **Reactive modeling**                  | Points and ledgers follow orders and shipments automatically | Event plumbing and ordering bugs                                                                                                                                 | **Adopt in a simple form.** One reconcile step after each command, recomputing from the ledger. The code already works this way. |
| **Dependency chains**                  | Know what to refresh after a change                          | Dynamic discovery is more machinery than static order                                                                                                            | **Adopt statically.** Order is fixed: cash allocation, then rewards.                                                             |
| **State reconciliation engine**        | Commands return mutations or questions                       | Already present: `DomainDecision` is the question channel                                                                                                        | **Keep as is.**                                                                                                                  |
| **Saga with compensating events**      | Cross-module undo                                            | Everything runs in one SQLite transaction, so the database already gives atomic rollback. Sagas add compensation code for failures that cannot partially commit. | **Reject the saga machinery. Keep the idea of compensating entries** for history (WF-001).                                       |

## Findings from the discussion that changed the design

1. **The expensive duplication is the procedure, not the invariant.** Three
   places implement settlement release logic in spirit (Returns, and now two new
   stories). Collapse that to one primitive. Leave the audit checks independent.
2. **Reversal by signed rows beats status flags** for anything quantity-like.
   Existing sums (delivered quantity, order totals, recognized value) become
   correct with no edits. Receipts are the exception, because their sign is
   constrained, so they use a link table.
3. **Shipment status should be derived, not set.** Draft 2 would have written
   `DELIVERED` back to `DISPATCHED` in the correction. A single function
   `shipmentStatusFor(lines)` used by both delivery and correction removes the
   chance of the two disagreeing.
4. **Authorization belongs in the table.** Role checks are the one rule that
   every service repeated in the same shape, and the shell can check them before
   dispatch with identical error ordering.
5. **Two-customer actions need version semantics.** The shell checks the expected
   version for the primary customer only. The target customer's version is
   bumped but not checked. This is a stated limitation, not an accident.

## Resulting decision

Build a **thin declarative layer, not an engine**:

- `COMMAND_RULES` table (roles, whether the command reconciles, rule IDs).
- Shell-owned reconcile over touched customers.
- One settlement-release primitive and one status-derivation function.
- Signed compensating rows for deliveries; reversal link for receipts.
- New canonical rules (ACC-004, FUL-007) added to the canonical rules document in
  the same numbered style, so the specification stays the source of truth.

This keeps framework code to a few hundred lines. The decision document
(`docs/architecture/decision-tree.md`) says when this stops being enough.

## Open risks carried into the final draft

- Applying the rules table to all existing commands removes about 20 per-service
  role checks. Risk: changed error ordering. Mitigation: authorize after the
  aggregate lookup and version check, exactly where the services did, and rely on
  the 251 existing tests.
- Deleting the allocation and refresh calls from five services moves them to the
  shell. Risk: ordering relative to version bump and audit. Mitigation: run them
  immediately after the command, before bumping versions.
