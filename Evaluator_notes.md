# Evaluator notes

Candidate: Aman Raj. Repo: private fork-by-import of `AviKKi/field-desk` (upstream history kept, not squashed).

## What is delivered

| Item                                        | Where                                                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| FDSK-169 move payment to the right customer | `MOVE_PAYMENT`, `AccountsService.movePayment`                                                                                  |
| FDSK-170 correct overstated delivery        | `CORRECT_DELIVERY`, `FulfillmentService.correctDelivery`                                                                       |
| Refactor so both are small                  | `shared/src/command-rules.ts`, shell reconcile, `releaseSettlement`                                                            |
| Screens                                     | `client/src/features/crm/activity-dialog.tsx`, `account-panel.tsx`, `pages/order-detail-page.tsx`; screenshots in `docs/demo/` |
| Tests                                       | `server/test/corrections.test.ts` (14 new; 265 total, all pass)                                                                |
| Architecture stages                         | `docs/architecture/00` rule map, `01` first pass, `02` refined, `03` after research, `04` final                                |
| Decision tree / metrics                     | `docs/architecture/decision-tree.md`                                                                                           |
| Canonical rule additions                    | ACC-004, FUL-007 in `canonical_business_rules.md`                                                                              |
| Progress log                                | `progress.md`                                                                                                                  |

## How to run and check

    pnpm install
    pnpm check            # lint, typecheck, tests (about 2 minutes)
    pnpm test             # tests only; the new ones: corrections.test.ts
    pnpm env:setup && pnpm db:migrate && pnpm db:seed && pnpm dev   # run the app

Both features are API commands (`POST /api/actions`, see `docs/api.md`). The tests drive them through HTTP and assert every audit check passes after each action.

## Decisions and assumptions to confirm

- ACC-004 and FUL-007 are new rules I proposed; `business_terms` says there is no general receipt-edit action, so the business should confirm.
- Cash released by a delivery correction stays as free cash and is re-applied by the normal cash priority rule (so it pays for the missing units when they arrive).
- A receipt that funds a credit note cannot be moved. The other customer's version is not checked during a move (primary only). Both are listed in `04-final-architecture.md`.
- UI added for both commands (screenshots in `docs/demo/`): **Correct delivery** on the order's Shipments tab (KAM/Admin) and **Move** on each payment in the customer's Payments tab (Accounts/Admin). I drove both in a real browser against a seeded database; there are no automated UI tests.
- The second ("bonus") solution with different tradeoffs was not built. The alternatives are compared on paper in draft 3 and the decision tree.

## Honest notes

- The "research" stage in draft 3 was a discussion with a coding agent (Claude) about patterns (rules engine, saga, event sourcing, specification); it was not external literature research.
- I used Claude Code throughout. Export of the chat history is a separate file I add to the submission.
- The original deadline (31 Oct 2026) had passed when I started on 2 Nov 2026; I am confirming late acceptance with Srijan.

## Time spent

Fill in before submitting. Agent working time was roughly one long session (reading and mapping rules, three design drafts, refactor, two features, tests, docs); my own time: ____ hours.
