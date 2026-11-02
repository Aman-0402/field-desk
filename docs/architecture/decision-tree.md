# When to build a rules framework, and when not to

Question: should the next feature be built on a rules engine / saga / event-sourcing framework, or on a lighter middle ground?

## Decision tree

1. **Do business people need to change rules without a deploy?**
   Yes -> an external rules engine or a rules-as-data store is justified. No -> go to 2.
2. **Are there more than ~50 independent rules that interact in order-dependent ways, owned by different teams?**
   Yes -> a framework (engine, DSL) starts paying for itself. No -> go to 3.
3. **Does each new feature mostly add a command that reuses existing steps?**
   Yes -> a rules table plus shared primitives (the middle ground we chose). No -> go to 4.
4. **Do operations span services or need long-running compensation?**
   Yes -> saga/workflow engine. No (single database transaction) -> keep one transaction and an after-the-fact audit.
5. **Do you need a full history replay or time-travel queries?**
   Yes -> event sourcing. No -> append-only compensating rows are enough.

For this codebase: single SQLite transaction, about 22 commands, ~60 canonical rules, rules owned by one team, deploys are cheap. We land on step 3.

## Signals to watch (re-check each quarter)

| Metric | Source | Move toward a framework if |
|---|---|---|
| Commands per file / service that repeat the same prologue (role check, reconcile) | code review, `COMMAND_RULES` | Rows need more than ~5 attributes, or conditions that a table cannot express |
| Decision nodes per feature | `pnpm metrics` | A feature adds more than ~100 nodes, or complexity grows faster than features |
| Audit failures caught in review that tests missed | audit rollbacks in logs | Rising trend: invariants are no longer being kept by hand |
| Time to add a feature that follows an existing pattern | team estimate | More than a few days for pattern-following work |
| Rule changes requested by non-engineers | tickets | Frequent, and blocked on deploys |
| Features that need two customers or two aggregates in one action | design review | Common; today only the shell's `touched` set handles it |

## Options compared

| Option | Cost now | Fits today | Risk |
|---|---|---|---|
| Hand-code each command (status quo) | lowest | works, but repeats prologue code | rules and code drift apart |
| **Rules table + shell reconcile + shared primitives (chosen)** | low | fits: both features added with small, local code | table is only a summary; domain logic stays in services |
| Drools-style engine | high | poor: rules here are arithmetic over ledgers, not if/then facts | learning curve, hard to debug and test |
| Saga / workflow | high | poor: one transaction already gives atomicity | complexity without benefit |
| Event sourcing | very high | not needed: append-only rows already give audit | rewrite of storage |

## Why not the bonus second solution

The assignment asks for a second solution with different tradeoffs as a bonus. A fully built second implementation was not done. The tradeoff alternatives are documented above and in draft 3 (engine and saga were evaluated and rejected on the evidence of the code).
