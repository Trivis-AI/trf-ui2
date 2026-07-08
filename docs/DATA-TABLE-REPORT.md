# Data-table revamp — shipped summary

_Living summary, updated as work ships. Last updated: 2026-07-09._

**On staging, trialing (not yet prod):** bulk row-selection + a **"Print selected"** action on the
sales invoice list — select invoices, get one merged PDF (each invoice its own page) in a single print
job. Reuses the existing per-invoice PDF render (no backend change).

We rebuilt the big list pages on one shared, server-driven table system in `@trf/ui2` and
shipped it across all four to prod.

## Live on prod (trivis.ee) — all four list pages
Sales invoices · Purchase invoices · Products · Payments

- **New table system** — full-width layout, drag-and-drop column show/hide/reorder, unified
  toolbar (search + filters + column options on one row), standard cell renderers.
- **Server-side search, filtering, and sorting** (sortable headers on the indexed columns).
- **Invoice status as one traffic-light** — Draft → Unpaid → Partial → Paid, with Overdue,
  Cancelled, Credited — merging document status + payment status into a single pill, plus a
  **status filter whose options match the pills**.
- **Payments** — real pagination + working method filter + consistent 2-decimal amounts +
  icon-only method column.
- **Consistency** — one date format, one amount style, one status treatment across the apps.

## Under the hood
- ui2: `ServerDataTable`, `TablePage`, `useTableQuery`, the cell renderers, and a shared
  invoice-status helper (`deriveInvoiceStatus` / `InvoiceStatusCell`).
- Backends: a standard `sort`/`dir` list contract + btree indexes (`CREATE INDEX CONCURRENTLY`,
  non-blocking) on backinvoices / backpurchase / backproducts / backpayments.

## Remaining (small, non-blocking)
- **One ops step (perf-only):** run `POST /v1/migrate` per prod tenant on **backinvoices** and
  **backproducts** to build their sort indexes — sorting already works, just unindexed until then.
  Details: `SORTING-INDEXES-OPS-HANDOFF.md`.
- Optional follow-ups (user table prefs, status on detail pages, etc.): `TABLE-TODO.md`.

Design & decisions: `PLAN-server-data-table.md`.
