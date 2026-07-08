# Sorting indexes — ops handoff (for Tom, 2026-07-09 AM)

## STATUS UPDATE (2026-07-09): mostly done — one small task remains for you

The backend sort (backinvoices + backpurchase) is now ON PROD, with the sort indexes switched to
`CREATE INDEX CONCURRENTLY` and made non-fatal. Prod sales + purchase sorting is functional now.
- **backpurchase**: fully self-serve — its Migrate auto-runs per tenant on first request and builds the
  CONCURRENTLY indexes non-blocking. Nothing for you to do.
- **backinvoices AND backproducts**: sorting works but is UNINDEXED until materialized. Both have
  `POST /v1/migrate`-only Migrate (no auto-run), so **the remaining task is: run `POST /v1/migrate` per prod
  tenant on backinvoices and backproducts** (prod auth) to build their sort indexes (now CONCURRENTLY,
  non-blocking). Non-urgent (perf only; sorting works meanwhile).
- backpayments/backproducts: their sort-index DDL is still plain `CREATE INDEX` (backpayments sort is on
  prod but unindexed; backproducts sort not on prod). If/when you materialize those on prod, switch them to
  CONCURRENTLY too (same one-line change as invoices/purchase).

Everything below is the original context; only the backinvoices per-tenant migrate is still outstanding.
---


**Context:** We added server-side sorting to the four migrated list pages (sales invoices,
purchase invoices, payments, products). The backend `sort`/`dir` params and single-column btree
indexes on the sortable columns are deployed to **staging**; the sort-enabled frontends are on
**staging only**. Sorting works on staging today (small data). Two ops tasks remain, both yours
since you own the DB/ops.

## What's deployed where

- **Backend sort + indexes → STAGING** (main + tag, `:prod` image → trf.is):
  backinvoices `v7.0.9`, backpurchase `v7.0.11`, backpayments `v7.1.3`, backproducts (latest staging tag).
  Sort contract: `?sort=<field>&dir=asc|desc`, whitelisted fields only.
- **Sort-enabled frontends → STAGING only:** frontinvoices `v7.0.12`, frontpurchase `v7.0.11`,
  frontpayments `v7.0.14`, frontproducts `v7.0.10`. (NOT on prod — prod backends don't have sort yet.)
- **Nothing sorting-related is on prod.**

The indexes added (plain btree, single-column, `IF NOT EXISTS`, in each repo's `GormStore.Migrate()`
in `internal/store/store.go`). Services are schema-per-tenant (search_path), so single-column is
correct — no `(org_id, …)` composites needed:
- `sales_invoices` / `purchase_invoices`: document_date, total_gross, payable_amount, invoice_no, status, created_at
- `payments`: payment_date, amount, status, direction, created_at
- `items`: name, type, created_at (`sku` was already a unique btree)

## Task 1 — materialize the indexes on STAGING

The index DDL is deployed but only runs when `Migrate()` is invoked, and the trigger differs per service:
- **backpurchase** — auto: migrates once per tenant schema on the first request after the pod rolled.
  Nothing to do; it materializes as staging traffic hits each org.
- **backinvoices / backpayments / backproducts** — only via the authenticated `POST /v1/migrate`,
  **once per tenant schema**. Please trigger it for the staging orgs so the indexes get created.

Verify on a tenant schema: `\di idx_*` (or `EXPLAIN` a sorted list query and confirm an Index Scan).

## ⚠️ URGENT: prod sales + purchase already show (inert) sort headers

A `main → trivis` merge (the one-word-status-label re-bump) inadvertently carried the sort-enable
commits to prod for **frontinvoices** and **frontpurchase**. So those two PROD lists now show
clickable sort headers, but the PROD backends (backinvoices, backpurchase) don't have the sort param
yet, so clicking does nothing (soft, no error). To make it functional, **promoting backend sort to
prod for backinvoices + backpurchase is now the priority** (payments + products frontends are NOT
sort-enabled on prod, so they're unaffected).

Note: the backend *sort param* support is backward-compatible and low-risk to deploy; the LOCKING
concern below is only about the *index creation*, which is separable. For backinvoices, Migrate()
only runs on POST /v1/migrate, so a prod deploy will NOT auto-create indexes (sort works, indexes come
when you run migrate with the CONCURRENTLY fix). For backpurchase, Migrate() auto-runs per-tenant on
first request, so a prod deploy WOULD trigger the (plain, locking) index creation - do the CONCURRENTLY
fix below FIRST for backpurchase.

## Task 2 — PROD rollout of sorting (when you're ready)

**⚠️ Locking gotcha first:** the indexes are added as plain `CREATE INDEX` inside `Migrate()`.
Running `/v1/migrate` on prod would briefly **write-lock** each table while the index builds — fine
on staging, risky on large prod tables. Before prod, either:
- change those statements to `CREATE INDEX CONCURRENTLY` (note: CONCURRENTLY can't run inside a
  transaction — check `Migrate()` isn't wrapping DDL in a tx), **or**
- create the indexes manually with `CREATE INDEX CONCURRENTLY IF NOT EXISTS …` on the prod tenant
  schemas in a quiet window, bypassing `Migrate()`.
The sort-index block is in `internal/store/store.go` in each of backinvoices / backpurchase /
backpayments / backproducts.

**Confirmed safe to use CONCURRENTLY:** verified `Migrate()` runs the sort-index `db.Exec(CREATE INDEX ...)`
directly on the pool, NOT inside a transaction (the existing ivfflat index does the same), so you can
just swap `CREATE INDEX` -> `CREATE INDEX CONCURRENTLY IF NOT EXISTS` in that block without a tx-refactor.
Note backpurchase's Migrate auto-runs per-tenant on first request, so once the CONCURRENTLY change is
deployed the indexes build non-blocking automatically; backinvoices/backpayments/backproducts still need
a `POST /v1/migrate` per tenant.

**FYI — frontends already promoted:** the sales + purchase FRONTENDS (unified status filter + sort UI) are
now on prod (2026-07-09). So prod is waiting only on this backend-sort promotion to make sorting functional
(until then the prod sort headers are inert). The unified status FILTER already works on prod (it uses the
existing status + payment_status params).

Then the promotion order (backend before frontend, so prod frontends' sort params are honored):
1. Promote backend sort + indexes → prod: merge `main` → `trivis` in each `back*` repo; run
   `/v1/migrate` per prod tenant (or the manual concurrent index creation above).
2. Promote the sort-enabled frontends → prod: merge `main` → `trivis` in frontinvoices, frontpurchase,
   frontpayments, frontproducts.

## Reference

- Sortable column whitelists = the index lists above (invoices: invoice_no/document_date/created_at/
  status/total_gross/payable_amount; payments: payment_date/amount/status/direction; products: name/sku/type).
- Indexes are self-maintaining once created (auto-updated on writes); new tenant schemas get them via
  their normal `Migrate()` run. No reindexing needed for new rows.
- Full initiative context: `docs/PLAN-server-data-table.md`.
