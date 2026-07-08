# Data-table revamp — shipped summary

_Living summary, updated as work ships. Last updated: 2026-07-09._

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
- **Bulk print (sales)** — row selection + "Print selected": one merged PDF, each invoice its own
  page, in a single print job (reuses the existing per-invoice PDF render).

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

Design & decisions: `PLAN-server-data-table.md` · Backlog: `TABLE-TODO.md` · Ops: `SORTING-INDEXES-OPS-HANDOFF.md`.

---

## Release log — 2026-07-08 → 07-09

**@trf/ui2 (tags consumed by the apps):**
- v7.0.8 ServerDataTable system (ServerDataTable, TablePage, useTableQuery, TableView core, 14 cell
  renderers, toolbar subcomponents, demo)
- v7.0.9 drag-and-drop column reorder, in-header bulk actions, one-row filter bar
- v7.0.10 SelectTrigger autoWidth, unified p-4 table padding, robust DateCell
- v7.0.11 deriveInvoiceStatus + InvoiceStatusCell (traffic-light helper)
- v7.0.12 one-word status labels (Unpaid, Partial)
- v7.0.14 unified status-filter helpers + useTableQuery.setFilters
- Demo site (ui.trivis.ee) refreshed to v7.0.14. (v7.0.13 was Tom's OrgSwitcher, parallel.)

**Frontends — all migrated & on prod:**
- frontinvoices (sales): migration · column hide/reorder · full-width + refinements · traffic-light
  status · one-word labels · sortable headers (+ sort forwarding) · unified status filter · Print-selected
- frontpurchase: migration · column options · refinements · status · labels · sortable headers · unified filter
- frontproducts: migration · column options · refinements · sortable headers · SKU search
- frontpayments: migration · refinements · real pagination ({items,total}) + method filter · 2-decimal
  amounts · icon-only method · sortable headers

**Backends — sort contract + CONCURRENTLY indexes, on prod:**
- backinvoices: sort/dir + search + indexes (await per-tenant migrate)
- backpurchase: sort/dir + indexes (auto-indexes per tenant)
- backproducts: sort/dir + SKU search + indexes (await migrate)
- backpayments: {items,total} pagination + method filter + sort + sort-index CONCURRENTLY (on prod)

**Not released:** backitems inventory pagination (draft on a branch, deferred).

**Ops follow-up (perf-only):** per-tenant POST /v1/migrate on backinvoices / backproducts / backpayments
to materialize sort indexes — sorting works unindexed meanwhile.
