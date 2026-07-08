# Sorting indexes — ops handoff (for Tom, 2026-07-09 AM)

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
