# Backend to-do — Tom (data-table sorting indexes)

**Context:** We shipped server-side sorting to the invoice / payment / product list pages (frontend +
backend, live on prod). Sorting **works** on prod today — but on a few services the sort indexes aren't
built yet, so it's doing full-table-scan sorts. One task makes them index-backed. The index DDL is
already `CREATE INDEX CONCURRENTLY IF NOT EXISTS` (non-locking, idempotent) and non-fatal in the code.

## The task: materialize the sort indexes on prod

Run **`POST /v1/migrate` per prod tenant schema** on:
- **backinvoices**
- **backproducts**
- **backpayments**

(`backpurchase` auto-migrates per tenant on first request — nothing to do there.)

**Why per-tenant:** schema-per-tenant (Postgres `search_path`). On these three, `Migrate()` runs only via
`POST /v1/migrate` and builds indexes in the caller's org schema. The endpoint is authenticated (org JWT /
your service token). Because the DDL is `CONCURRENTLY`, each build is non-blocking; `IF NOT EXISTS` makes it
safe to re-run.

**Indexes it will build** (already in each repo's `GormStore.Migrate()`):
- backinvoices `sales_invoices`: document_date, total_gross, payable_amount, invoice_no, status, created_at
- backproducts `items`: name, type, created_at  (sku already indexed)
- backpayments `payments`: payment_date, amount, status, direction, created_at

**Verify:** on a tenant schema, `\di idx_*`, or EXPLAIN a sorted list query and confirm an Index Scan.

**Priority:** low / non-urgent — sorting works meanwhile; this is a perf optimization for large tables.

## Optional, later (not required)
- **Search index:** a `pg_trgm` GIN index for the `name` / `sku` / supplier-name `ILIKE` search (currently
  a sequential scan) — only if search needs to scale.
- **`overdue` filter param** on the invoice list endpoints — would let the frontend offer "Overdue" as a
  status-filter option (today it's folded into "Unpaid").
- **Bulk PDF endpoint** — a server-side "render N invoices into one PDF" would be more efficient than the
  current client-side merge (fine as-is for now).

Full detail / history: `trf-ui2/docs/SORTING-INDEXES-OPS-HANDOFF.md`.
