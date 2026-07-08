# Table revamp — plan vs. shipped (Jul 8–9, 2026)

**The morning plan.** Replace the hand-rolled list pages across the apps with one shared,
server-driven table system in `@trf/ui2` — full-width, fast (server-side search / filter / sort,
flicker-free loading, react-query caching), and consistent (unified dates, amounts, status;
drag-and-drop columns; whole-row click). Roll it out purchase → products → sales → payments, and
add a backend "sort contract" since **no list endpoint supported sorting**.

## What we delivered — all live on prod
- The ui2 system: `ServerDataTable`, `TablePage`, `useTableQuery`, a shared render core, and a full
  cell-renderer set.
- **All four list pages migrated and on prod** — purchase, products, sales, payments (payments
  included, which the plan had gated behind a backend fix).
- Full-width layout, the two-state loading model, react-query caching, drag-and-drop show/hide/reorder
  columns, whole-row-click navigation, a one-row filter bar, and unified date/amount formatting.
- **Server-side sorting** — we built the sort contract + indexes into the backends (the plan flagged
  none existed), so sortable headers work on prod. Indexes are non-blocking; one per-tenant migrate
  remains as a perf step.

## Beyond the original plan (found along the way)
- Merged document + payment status into **one traffic-light pill** (Draft → Unpaid → Partial → Paid,
  plus Overdue / Cancelled / Credited), with a **matching status filter**.
- Fixed **payments pagination** (was silently broken server-side) + method filter, **2-decimal
  amounts**, icon-only method column.
- **"Print selected"** bulk action on sales invoices (one merged PDF, each invoice its own page).

## Deliberately deferred (the plan anticipated these)
Read-only sub-tables, inline editors, the inventory-items app, saved views / hover cards /
virtualization, column-layout persistence, bulk actions beyond sales-print, rolling the traffic-light
status onto detail pages, and a user decimals setting — all tracked in `TABLE-TODO.md`.

## Bottom line
The core plan is done and live on prod across all four apps, plus several consistency and UX wins we
picked up en route. What's left is one perf-only ops step (index materialization, see
`SORTING-INDEXES-OPS-HANDOFF.md`) and the consciously-deferred backlog.

_See also: `PLAN-server-data-table.md` (design), `DATA-TABLE-REPORT.md` (shipped summary + release log),
`TABLE-TODO.md` (backlog)._
