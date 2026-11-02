# Progress

Assignment: Business Rules Engine (Tejas take-home). Features: FDSK-169, FDSK-170.
Started: 2026-11-02. Original deadline: 2026-10-31 (late-submission status to be confirmed with Srijan).

## Status

- [x] Private repo created (`Aman-0402/field-desk`)
- [x] Upstream `AviKKi/field-desk` imported with original history (47 commits preserved, merged via unrelated-histories)
- [x] Read candidate walkthrough, canonical business rules, business terms, architecture doc
- [ ] Run app locally (install, migrate, seed, tests)
- [ ] Map current code against canonical rules (where rules live today)
- [ ] Architecture draft 1
- [ ] Architecture draft 2 (refined)
- [ ] Architecture draft 3 (post-research / LLM discussion)
- [ ] Architecture final
- [ ] Decision-tree doc: when to invest in a rules framework
- [ ] Rules framework / refactor
- [ ] FDSK-169: move payment recorded against wrong customer
- [ ] FDSK-170: correct overstated delivery confirmation
- [ ] Bonus: second solution with different framework/business tradeoff
- [ ] Evaluator_notes.md (with time spent)
- [ ] Export agent chat history
- [ ] Add collaborators: atul@patcorn.in, srijan_sahay@patcorn.in, prince@patcorn.in
- [ ] Submit repo link on Google Form

## Notes

- Stack: pnpm workspaces (client React/Vite, server NestJS + Drizzle + SQLite, shared Zod contracts).
- Canonical rules: `docs/candidate-walkthrough/canonical_business_rules.md` (version 2026-10-26.1).
- Rules most relevant to the features:
  - FDSK-169: CUS-001 (settlement can't cross customer accounts), ACC-001/002/003, CRD-001, REW-002/003, WF-001 (posted entries are corrected by compensating entries, never edited), WF-002 (when cash allocation re-runs).
  - FDSK-170: FUL-001 (0 <= r <= d <= s), FUL-006, WF-001, WF-003 (release order: cash, credit, points), WF-005 (one goods charge per delivery confirmation), REW-002/003 (points clawback).
- Keep history un-squashed; commit each architecture stage separately.
