# Server-data-table — TODO / backlog (as of 2026-07-09)

Follow-ups for the ServerDataTable initiative. Everything below is optional / deferred —
the core is shipped and live on prod (all four list pages: sales, purchase, products,
payments — full table system, traffic-light invoice status, unified status filter, sorting,
payments pagination). Full context: `PLAN-server-data-table.md`. Ops handoff (index
materialization): `SORTING-INDEXES-OPS-HANDOFF.md`.

## New ideas (Jaak, 2026-07-09) — user table customization

- [ ] **Rows-per-page selector.** Let users choose how many rows they see (e.g. 20 / 50 / 100).
      Placement options: (a) inside the table-options menu (the same one that hides/reorders
      columns), or (b) below the table near the pagination footer. Plumbing already exists:
      `ServerDataTable` has `pageSize`, `useTableQuery.setPageSize`, and the backends honor
      `limit` — so this is mostly a UI control + wiring + persisting the choice.
- [ ] **Decimal-places setting.** Let users choose amount decimals (0 / 1 / 2); default 2.
      Currently hardcoded (`AMOUNT_DECIMALS = 2` in frontpayments). Best as a ui2 `MoneyCell`
      option (`decimals` prop) fed by a user/org preference, applied consistently everywhere.

These two + column layout persistence (below) are really one theme: **persisted per-user table
preferences** (page size, decimals, column visibility/order). Consider a small shared prefs
mechanism (localStorage first, server-backed later) rather than one-offs. A "Table options" menu
(rename/expand the current column-options popover) is the natural home for page-size + columns.

## Perf follow-ups (functional today, not index-optimized)

- [ ] **Index materialization on prod** (Tom / prod auth): run `POST /v1/migrate` per prod tenant on
      **backinvoices** and **backproducts** (their Migrate is POST-only). Sorting works meanwhile,
      just unindexed. See `SORTING-INDEXES-OPS-HANDOFF.md`.
- [ ] **backpayments indexes**: payments sort is on prod but unindexed AND its index DDL is still
      plain `CREATE INDEX` — needs the same one-line switch to `CREATE INDEX CONCURRENTLY` (like
      invoices/purchase/products got) *then* the per-tenant migrate.
- [ ] **Search index**: products `name`/`sku` and purchase supplier-name search run as unindexed
      `ILIKE` (seq scan). Add a `pg_trgm` GIN index if search needs to scale.

## Deferred features

- [ ] **Traffic-light status everywhere.** The merged invoice status is only on the LIST pages.
      Roll `InvoiceStatusCell` out to invoice detail/edit headers, dashboards, CRM widgets, etc.
      (per the consistency memo — highest-visibility follow-up).
- [ ] **Column layout persistence.** Hide/reorder works per session but resets on reload — wire
      localStorage (per user/org), server-backed later. (Ties into the prefs theme above.)
- [ ] **"Overdue" as a filter option.** Omitted from the unified status filter (no backend
      due-date filter). Add a backend `overdue` param + the filter option.
- [ ] **Row selection / bulk actions in the apps.** ServerDataTable supports it (demo shows it),
      but no app wired it. Targets: purchase InvoiceImport (bulk delete), payments NewRunModal.
- [ ] **Archetype-B sub-tables.** Migrate the read-only detail tables to reuse the cell renderers:
      payment allocations, import-job lists, depreciation entries, delivery dispatch, invoice
      line-item display. (Consistency; still old hand-rolled markup.)
- [x] **backitems / frontitems inventory migration.** DONE (2026-07-09) — frontitems Item list on
      ServerDataTable, backitems `{items,total,page,limit}` contract + sort. Live on prod.
- [ ] **Ledger Periods page inline edits.** The Periods sub-table now uses whole-row click (done
      2026-07-09). Fiscal Years + Quarters are still hand-rolled inline tables with per-row Save
      buttons — prime candidates to convert to ui2 `EditableDataTable` (commit-on-blur, drop the
      explicit Save). Jaak flagged **Quarters** specifically (ledger > periods > quarters) as the
      perfect inline-editing-table candidate.

## Reserved seams (built to support, not implemented)

- [ ] **Saved filters / views** — state is serializable for it; feature not built.
- [ ] **Hover cell cards** — e.g. Total Gross -> net/tax/rounding breakdown (`CellHoverCard` seam exists).
- [ ] **Row virtualization** — prop reserved; needs `@tanstack/react-virtual` (fine while paginated).

## Minor cleanup

- [ ] `SimpleSelect` doesn't forward `autoWidth` (frontinvoices used a className workaround) — tidy.

## Suggested priority

1. Traffic-light status on detail/edit pages (visible consistency).
2. User prefs bundle: rows-per-page selector + column persistence + decimals setting (one theme).
3. backpayments CONCURRENTLY + the prod index migrates (perf; Tom).
4. Everything else as needs arise; backitems last.
