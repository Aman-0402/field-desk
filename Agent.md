# Agent guide: FieldDesk CRM

Local CRM for sales, warehouse, accounts and finance. Orders, fulfillment, customer cash, credit notes and reward points, all driven by one command endpoint. Business rules are canonical and numbered (`CUS-001`, `FUL-007`, `ACC-004`, `WF-002`, ...).

## Stack

pnpm workspace, three packages:

| Package       | Path      | Tech                                                                               |
| ------------- | --------- | ---------------------------------------------------------------------------------- |
| `@crm/shared` | `shared/` | Zod contracts, public types, roles, `COMMAND_RULES` table. Builds to ESM + `.d.ts` |
| `@crm/server` | `server/` | NestJS 11, Drizzle ORM, SQLite (`better-sqlite3`), JWT cookie auth                 |
| `@crm/client` | `client/` | React, Vite, Tailwind, shadcn/ui (Radix), Zustand, react-router-dom 7              |

Node `>=22.14 <25` (`.nvmrc`), pnpm `10.18.3`. Prettier: single quotes, trailing commas `all`. ESLint forbids `any` and requires `import type` for type-only imports; unused args must start with `_`.

## Run it

pnpm may not be on PATH. Use `npx pnpm@10.18.3 <cmd>` if `pnpm` is missing.

```sh
pnpm install
pnpm env:setup        # writes server/.env with a random JWT secret (keeps existing)
pnpm db:migrate       # migrations are explicit; starting the API never changes schema
pnpm admin:create     # prompts, or set ADMIN_NAME / ADMIN_EMAIL / ADMIN_PASSWORD (12-128 chars)
pnpm db:seed          # optional: 10 customers, 24 orders in every state; needs an admin first
pnpm dev              # builds shared, then watches shared + server + client
```

- Client: http://localhost:5173 (strict port, proxies `/api` to the server).
- API: http://localhost:3000/api. Health: `GET /api/health` returns `{"status":"ok"}`.
- No default credentials. Seeded staff desks have no passwords; sign in as admin and use **Working as**.
- If you change `PORT`, change the proxy target in `client/vite.config.ts`. Keep `CLIENT_ORIGIN` equal to the browser URL.
- SQLite file: `server/data/crm-workspace.db` (git-ignored, with `.env`).

## Commands

| Command                                | Purpose                                                                           |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| `pnpm check`                           | lint + typecheck + server tests + build (~2 min). CI runs this and `format:check` |
| `pnpm test`                            | Build shared, then server tests (`node --test`, concurrency 1)                    |
| `pnpm typecheck`                       | `tsc --noEmit` in every package                                                   |
| `pnpm lint` / `format`/ `format:check` | ESLint / Prettier                                                                 |
| `pnpm db:generate`                     | Generate next Drizzle migration after a schema change                             |
| `pnpm db:studio`                       | Drizzle Studio                                                                    |
| `pnpm metrics`                         | Source counts and hashes to `reports/source-metrics.json`                         |

Run a single server test file: `cd server && npx tsc -p tsconfig.test.json && node --test dist-test/test/corrections.test.js`. Always build `@crm/shared` first (`pnpm --filter @crm/shared build`) on a fresh checkout or after editing `shared/`; both apps import its built output, there are no source aliases between packages.

## Layout

```text
shared/src/        crm.ts (command payload schemas, CommandType), command-rules.ts, roles.ts, schemas.ts, types.ts
server/src/        one directory per domain, each with a README.md
  actions/         POST /api/crm/actions: transaction, idempotency, versions, audit
  accounts/ credits/ rewards/ fulfillment/ orders/ returns/ customers/ catalog/ audit/
  crm-queries/     bootstrap + customer snapshot reads only
  auth/ users/     JWT, sessions, guards, staff
  database/        shared connection, migrate.ts, schema.ts (single export entry for drizzle-kit)
  scripts/         create-admin.ts, seed*.ts (CLI only, refuse production)
server/drizzle/    committed SQL migrations + meta (keep together)
server/test/       auth, corrections, crm, customer-workflows, migrations, seed-data (+ support/ fixtures)
client/src/        pages/, features/crm/ (account-panel, activity-dialog, context), components/ui/, store/ (Zustand), lib/api.ts
docs/              api.md, architecture.md, operations.md, candidate-walkthrough/ (canonical rules), architecture/ (design drafts), demo/, pdf/
```

## Architecture rules to respect

- **Per-domain layers**: model (types, Drizzle table, invariants) -> repository (all SQL via Drizzle builders) -> service (authorize + coordinate) -> controller (HTTP + validation). Use only the layers a module needs (Catalog, Workspace, Health are slim). Repositories must not import other domains' services (avoids circular deps).
- **All mutations are commands** sent to `POST /api/crm/actions` with `{ command: {type, payload}, idempotencyKey, expectedVersion }`. `ActionsService` owns the immediate SQLite transaction plus nested savepoint; rejected actions roll back business writes but keep the outcome for idempotency.
- **`COMMAND_RULES`** (`shared/src/command-rules.ts`) is the single table of who may run each command, whether it `reconciles` (WF-002: re-run cash allocation, then refresh reward points) and which rule IDs apply. Services do not check roles or call reconcile themselves; the action shell does. Adding a command means: payload schema in `shared/src/crm.ts`, row in `COMMAND_RULES`, service method, dispatch in `actions.service.ts`.
- **Money** is integer paise. Posted ledger entries are never edited; correct with compensating entries (WF-001). Settlement never crosses customer accounts (CUS-001).
- **Optimistic versions**: every applied action bumps the customer and all that customer's orders. `MOVE_PAYMENT` bumps both customers.
- **Domain outcomes return HTTP 201** with `status` in `APPLIED | REJECTED | NEEDS_DECISION | CONFLICT`. Inspect `status`, not the HTTP code. 400 = malformed, 401/403 = auth.
- **Audit** runs account consistency checks before commit; tests assert every check passes after each action.
- **Schema change**: edit the domain `*.model.ts`, then `pnpm db:generate`, commit SQL + meta together, `pnpm db:migrate`.
- **Auth**: HttpOnly `crm_session` cookie (SameSite Strict, path `/api`), role read from DB each request, origin check on browser writes. Roles: `SALES`, `KAM`, `WAREHOUSE`, `ACCOUNTS`, `ADMIN` (Admin may run everything). Public registration always makes Sales.
- **Client**: server state lives in `features/crm/context.tsx` (bootstrap) and route data hooks; Zustand `auth-store` holds only the public user in memory. Use the `@/` alias for `client/src`. All fetches go through `lib/api.ts`.

## UI conventions (client)

- **Layout**: `AppShell` (`components/app-shell.tsx`) wraps every signed-in page. Top bar and `main` share one centered column, `max-w-[1450px]`. Padding steps 16 / 20 / 32px (base / `sm` / `lg`). Tables scroll horizontally inside their own container.
- **Working as**: Admin-only select in the top bar. Seeded staff desks (Sales, KAM, Warehouse, Accounts) have no passwords, so an Admin acts as them through `actorId`. Actions are attributed to the chosen staff member in the audit trail. Other roles never see it.
- **Theme tokens** live in `index.css`: `:root` (light) and `.dark`. Tailwind color utilities read these variables (`bg-card`, `text-muted-foreground`, `bg-panel`, ...). `.dark` also remaps the few palette colors used directly (`white`, `slate-*`, `blue-*`, `emerald-*`, `amber-*`). Prefer tokens; if you use a raw palette color, check it in dark mode and add the shade to `.dark` if missing. Do not use `text-white`; use `text-primary-foreground` / `text-destructive-foreground`.
- **Dark mode**: `lib/theme.ts` (`useTheme`, `setTheme`) toggles the `dark` class on `<html>` and stores the choice in `localStorage` (`theme`). An inline script in `client/index.html` applies it before first paint and falls back to `prefers-color-scheme`. `ThemeToggle` is in the sidebar, mobile header and login page.
- **Shared page pieces** in `features/crm/ui.tsx`: `PageHeader`, `StatStrip` (one bordered card of 2-4 figures; do not nest cards), `Table` (uses `.crm-table`: uppercase headers, tabular numbers, hover tint), `Status` (pill with dot, tones `good | muted | warn | info`), `Pager`, `SearchInput`, `Tabs`, `Empty`, `Metric`.
- **Motion**: `.page-enter` (220ms fade and slide on route change), button `active:scale-[0.97]`, `.skeleton`, `.progress-track`. `prefers-reduced-motion` is honored globally in `index.css`.
- **Pages**: Customers, Sales orders and Accounts open with a `StatStrip`. Order detail has one summary card with a fulfillment progress bar (delivered, canceled, unshipped, returned units). Login is a split screen (brand panel on `lg+`, form with show/hide password).
- **Checks**: `cd client && npx tsc --noEmit`, `pnpm lint`, `pnpm format:check`. No automated UI tests; verify visually in light and dark at narrow (~375px) and wide (>1450px) widths.

## Business rule sources (read before changing behavior)

1. `docs/candidate-walkthrough/canonical_business_rules.md` (version 2026-10-26.1): authoritative rule IDs.
2. `docs/candidate-walkthrough/business_terms.md` and `docs/business-terms.md`: entities, roles, permissions.
3. `docs/architecture.md`, `docs/api.md`, `docs/operations.md`, and `server/src/<module>/README.md`.
4. `docs/architecture/00..04` and `decision-tree.md`: how the rule table and shell refactor were designed.

## Recent work (see `progress.md`, `Evaluator_notes.md`)

- FDSK-169 `MOVE_PAYMENT` (`AccountsService.movePayment`, rule ACC-004): move a receipt booked to the wrong customer. A receipt funding a credit note cannot be moved.
- FDSK-170 `CORRECT_DELIVERY` (`FulfillmentService.correctDelivery`, rule FUL-007): fix overstated delivery; released cash stays free and is re-allocated by normal priority (WF-003 order: cash, credit, points).
- UI refresh (2026-11-02): 1450px content column, stat strips, status pills, dark mode, split-screen login, order progress bar. See UI conventions above.
- UI: **Correct delivery** on order Shipments tab (KAM/Admin); **Move** on each payment in customer Payments tab (Accounts/Admin). No automated UI tests.
- Tests: `server/test/corrections.test.ts`; 265 server tests total, all pass at last record.

## Working agreements

- Update the matching docs (`docs/api.md`, module README, canonical rules) when behavior or API changes.
- Add server tests through HTTP via `server/test/support/http-desk.ts` and `crm-fixtures.ts`; assert audit checks pass.
- The root `.gitignore` was deleted on request, so `git add -A` will stage `server/.env`, `server/data/*.db*`, `node_modules/`, `dist/` and `reports/`. Add specific paths instead, and never commit `.env` or the database unless the owner explicitly asks. A pushed secret stays in git history; rotate `JWT_SECRET` if it was pushed. Restore a minimal `.gitignore` if sharing the repo more widely.
- Do not put passwords in docs or shell history; pass admin creds via env vars. Local dev admin is created by `admin:create`; credentials are not recorded in the repo.
- Prettier (`pnpm format`) rewrites line endings on Windows; git reports "LF will be replaced by CRLF". Format only the files you edit.
- To share the project, the recipient clones, then runs `pnpm install`, `env:setup`, `db:migrate`, `admin:create`, `db:seed`, `dev`. No need to ship `node_modules`, `dist`, `.env` or the database.
- Seeding and admin creation are CLI only; never expose them over HTTP.
