# Plan: migrate frontledger tables onto ServerDataTable

Status: draft for review. Do not execute until signed off.
Owner: Jaak. Last updated: 2026-07-09.

Companion to `PLAN-server-data-table.md` (the infra plan, archetypes A to E) and
`TABLE-TODO.md` (deferred backlog). This document is ledger-specific: it inventories
every table in `frontledger`, audits `backledger`'s list endpoints, recommends an
editing model per entity, and sequences the work. No code is changed by this document.

Reference implementation for the target pattern:
`frontinvoices/src/pages/invoices/InvoiceList.tsx` (react-query + `keepPreviousData`,
`useTableQuery`, `ServerDataTable`, `TablePage`, `TableFilterBar`, cell renderers).

## 1. Summary of findings

- **14 table surfaces** across the app. Only **one** (Journal Entries) is a true
  archetype-A server list at scale. The rest are small config lists, read-only
  reports/sub-tables, or already-inline editors.
- **Every `backledger` list endpoint returns a bare array** with a single hardcoded
  `ORDER BY` and no `page/limit/sort/dir` and no total count. There is no shared list
  contract, unlike the invoices/purchase/products services that were already migrated.
- **The entries endpoint has a live contract mismatch.** The frontend already sends
  `page/page_size/date_from/date_to/q` and reads `{ items, total }`, but the backend
  handler ignores all of those except `status`/`period_id` and returns a bare array
  with no total. This is the single most important backend gap and a probable
  pre-existing bug (see 3.1).
- **ui2 has no editable-table primitive.** There is only a reserved type seam
  (`meta.editable` + `updateData` in `table-view.tsx:40-53`), no rendering. Any inline
  or modal edit-in-place table is net-new ui2 work (section 4).
- **Two tables are already inline editors** (Fiscal Years, Quarters in `PeriodList`),
  a useful precedent for the inline pattern.
- **Inline/modal editing candidates** (currently open a whole new page to edit a few
  fields): account mappings, units, currencies, tax rates, dimension values, and
  accounts (which today cannot be edited at all). Journal entries and dimension types
  stay full-page (genuinely too complex for a modal, see 5).

## 2. Per-table inventory

Row scale = realistic production magnitude per org. "Server-ready?" = does the backend
list endpoint already support `page/limit/sort/dir` + total. All list endpoints today
answer **no** (bare array), so the column notes what is missing.

| # | Route | Source file | Endpoint | Server-ready? | Row scale | Current edit flow | Recommended edit flow | Archetype |
|---|-------|-------------|----------|---------------|-----------|-------------------|-----------------------|-----------|
| 1 | `entries` | `pages/entries/EntryList.tsx` | `GET /v1/entries` | **No** — FE sends page/date/q, backend ignores all but status; bare array, no total (3.1) | **Thousands** | row "View" -> `EntryDetail` -> `EntryEdit` (full page) | Keep full-page edit; migrate list to ServerDataTable | **A** |
| 2 | `accounts` | `pages/accounts/AccountList.tsx` | `GET /v1/accounts` | No — bare array, `ORDER BY code`, no total (`CountAccounts` exists, unused) | 50 to ~500 | **none** (no edit/view row action; create-only) | Inline toggle `is_active` + modal for name/type | **A** (small) |
| 3 | `currencies` | `pages/currencies/CurrencyList.tsx` | `GET /v1/currencies` | No — bare array, `ORDER BY is_default DESC, code` | <30 | row "Edit" -> `CurrencyEdit` (full page, 4 fields) | **Modal** | A (small) / C |
| 4 | `mappings` | `pages/mappings/MappingList.tsx` | `GET /v1/account-mappings` | No — bare array, `ORDER BY key` | dozens | row "Edit" -> `MappingEdit` (full page, 2 fields) | **Inline** (account select + description) | A (small) / C |
| 5 | `tax-rates` | `pages/taxes/TaxRateList.tsx` | `GET /v1/tax-rates` | No — bare array, `ORDER BY domain, code` | dozens | row "Edit" -> `TaxRateEdit` (full page, 9 fields) | **Modal** (too many fields for inline) | A (small) / C |
| 6 | `dimension-types` | `pages/dimensions/DimensionTypeList.tsx` | `GET /v1/dimension-types` | No — bare array, `ORDER BY code` | handful to dozens | row "Edit" -> `DimensionTypeEdit` (full page) | **Keep full page** (applies_to multi-select + nested values sub-table) | A (small) |
| 7 | `units` | `pages/units/UnitList.tsx` | `GET /v1/units` | No — bare array, `ORDER BY code` | dozens to ~200 | row "Edit" -> `UnitEdit` (full page, 5 fields) | **Modal** (has parent select) | A (small) / C |
| 8 | `periods` (Periods table) | `pages/periods/PeriodList.tsx` | `GET /v1/periods` | No — bare array, `ORDER BY start_date DESC` | dozens | row "View" -> `PeriodDetail` (full page) | Keep full-page detail (status lifecycle actions) | A (small) / B |
| 9 | `periods` (Fiscal Years) | `pages/periods/PeriodList.tsx` | `GET /v1/fiscal-years` | No — bare array, `ORDER BY start_date DESC, name` | <20 | **inline** (Input + DatePicker per row, Save/Delete) | Keep inline; adopt shared editable table when built | **C** |
| 10 | `periods` (Quarters) | `pages/periods/PeriodList.tsx` | `GET /v1/quarters` | No — bare array, `ORDER BY start_date DESC, name` | <40 | **inline** (Input + Select + DatePicker, Save/Delete) | Keep inline; adopt shared editable table when built | **C** |
| 11 | `periods/:id` (Trial Balance) | `pages/periods/PeriodDetail.tsx` | `GET /v1/periods/:id/trial-balance` | n/a — computed view `{ balances, totals }` | dozens to ~500 | read-only + footer totals | Reuse cell renderers + a totals footer; no server features | **B** |
| 12 | `dimension-types/:id/edit` (Values) | `pages/dimensions/DimensionTypeEdit.tsx` | `GET /v1/dimension-types/:id/values` | No — bare array, `ORDER BY code` | handful to dozens | row "Edit" -> `DimensionValueEdit` (full page) | Modal (low priority) | **B** / C |
| 13 | `reports/journal` | `pages/reports/JournalReport.tsx` | `GET /v1/reports/journal` | n/a — computed view, on-demand (Generate) | hundreds of rows | read-only, entry-grouped, footer | Reuse cell renderers; leave as bespoke report | **B** |
| 14 | `reports/turnover` | `pages/reports/TurnoverReport.tsx` | `GET /v1/reports/turnover` | n/a — computed view, on-demand (Generate) | dozens to ~500 | read-only, multi-level header, footer | Leave as bespoke report (complex header) | **E** / B |

Notes:
- Tables 9 and 10 are the app's only existing inline editors and are a good template
  for the inline edit pattern (`PeriodList.tsx:335-401` fiscal years, `:426-524`
  quarters).
- Table 2 (accounts) has **no row action at all** today (`AccountList.tsx` renders code
  / name / type / status with no edit or view link). The only account mutation route is
  `accounts/new`. `updateAccount` exists in the service (`ledgerService.ts:61`) but is
  unused by any page.

## 3. Backend gaps (backledger, Go, chi + GORM)

The service is `internal/api/handlers.go` (routes at `handlers.go:53-190`), store is
`internal/store/store.go`, models `internal/model/model.go`. There is **no shared list
contract**: each `List*` store method (`store.go`) hardcodes one `ORDER BY` and returns
a bare slice. To make any list server-driven, mirror how the other backends did it: a
`ListXParams` struct, a sort-column whitelist, a returned total count, and
`CREATE INDEX CONCURRENTLY` on sortable columns.

### 3.1 Journal entries — the priority gap (and a live bug)

- Handler `listEntries` (`handlers.go:838-864`) reads only `period_id` and `status`.
  It **drops** `page`, `page_size`, `date_from`, `date_to`, and `q`, which the frontend
  already sends (`ledgerService.ts:188-202`, `EntryList.tsx:45-54`).
- Store `ListJournalEntries(ctx, periodID, status)` (`store.go:1042-1058`) returns a
  bare `[]JournalEntry` with `ORDER BY entry_date DESC, entry_number DESC`. No `Limit`,
  no `Offset`, no `Count`.
- The frontend type `EntryListPage` expects `{ items, total }`
  (`ledgerTypes.ts:149-151`); the backend returns a bare array. So `res.items` /
  `res.total` do not line up with the payload. Treat this as a pre-existing
  bug/half-finished contract to fix as step one.

Backend work for entries:
1. Add a `ListJournalEntriesParams` struct: `periodID *uuid.UUID`, `status string`,
   `dateFrom/dateTo string`, `q string` (ILIKE on `description` and/or
   `entry_number`/`reference`), `page/limit int`, `sort/dir string`.
2. Sort whitelist: `entry_date`, `entry_number`, `status` (default
   `entry_date DESC, entry_number DESC`). Reject anything else.
3. Return `{ items, total, page, limit }`; run a `COUNT(*)` with the same `WHERE`.
4. `CREATE INDEX CONCURRENTLY` on `entry_date`, `entry_number`, and `(period_id,
   status)` if not already present. Heavy `Preload("Lines...Dimensions...")` on a
   paged slice is fine; verify it is not N+1 across pages.
5. Keep `page_size` as the param name (the frontend sends `page_size`, not `limit`);
   the invoices services use `limit`. Either align the frontend to `limit` during
   migration or have the backend accept `page_size`. Prefer aligning to `limit` + `page`
   so `useTableQuery`'s default `params` map works unchanged.

### 3.2 Config lists (accounts, currencies, mappings, tax-rates, dimension-types, units)

Each is a bare array today (`store.go`: accounts `:922`, currencies `:530`, mappings
`:439`, tax-rates `:557`, dimension-types `:699`, units `:783`; fiscal-years `:358`,
quarters `:394`). Row scale is small (<500), so pagination is a nice-to-have, not
load-bearing. Two-track recommendation:

- **Cheapest, sufficient for these sizes:** keep the bare-array endpoints and render
  with the client-only `DataTable` + the standard cell renderers (still gets unified
  cells, sorting-in-memory, column options, full width). No backend change. This is the
  right call for currencies, mappings, tax-rates, dimension-types, units, fiscal-years,
  quarters.
- **If we want the whole app on one contract:** add the same `ListXParams` + total +
  sort whitelist to each endpoint and use `ServerDataTable`. More backend churn for
  little runtime gain at these sizes. Reserve for accounts and units if a tenant's chart
  of accounts / unit catalog is genuinely large.

Accounts specifically: `ListAccounts(ctx, codePrefix)` already takes a `code_prefix`
filter and there is an unused `CountAccounts`. Adding page/limit/sort/total here is the
lowest-effort "real" server list after entries, and accounts is the one config list that
can plausibly reach hundreds of rows.

### 3.3 Computed views (trial balance, journal report, turnover)

`GET /v1/periods/:id/trial-balance`, `GET /v1/reports/journal`,
`GET /v1/reports/turnover` are derived views (`report_handlers.go`), returning full
result sets with totals. Per `LEDGER.md` ("reports are views, not data") these should
**not** get a list contract. They are archetype-B/E: reuse the ui2 cell renderers and a
totals footer for visual consistency, but keep them as bespoke, non-paginated tables.

### 3.4 Summary of backend work

| Endpoint | Needs backend work? | What |
|----------|---------------------|------|
| `GET /v1/entries` | **Yes (priority)** | params struct, date/q filters, sort whitelist, total, indexes; fix bare-array/`{items,total}` mismatch |
| `GET /v1/accounts` | Optional (recommended) | page/limit/sort/total (Count exists) |
| `GET /v1/currencies`, `/account-mappings`, `/tax-rates`, `/dimension-types`, `/units`, `/fiscal-years`, `/quarters` | Optional | only if we standardize the whole app; otherwise none (use client DataTable) |
| trial-balance, reports/journal, reports/turnover | No | computed views, stay bare |

## 4. Editing model and the missing ui2 primitive

The user's directive: for tables where editing a few fields means navigating to a whole
new page, prefer **inline** (edit-in-cell) or a **modal**, not a route change. This is
archetype C in `PLAN-server-data-table.md`.

### 4.1 ui2 has no editable-table primitive yet

`src/components/table/` (server-data-table, table-page, table-view, table-toolbar,
cells, use-table-query, url-state) has **no** inline/modal editable table. The only
thing present is a reserved type seam in `table-view.tsx:40-53`:

```ts
interface TableMeta<TData> { updateData?: (rowIndex, columnId, value) => void }
interface ColumnMeta<TData, TValue> { editable?: boolean; align?: ... }
```

No cell reads `editable` and nothing calls `updateData`. So per the monorepo rule (any
net-new visual component is built in ui2 first), the editable table is net-new ui2 work.

### 4.2 Proposed ui2 components

Two complementary primitives, smallest first:

**(a) `RowEditModal` pattern (ship first, lowest risk).** Not a new table, a convention:
a `Dialog` + `Field` form opened from an `ActionsCell` "Edit" button, pre-filled from
the row, submitting via the app's react-query mutation and invalidating the list query.
This directly replaces the full-page edit route for tax-rates, currencies, units, and
dimension-values with no new table engine. Sketch:

```tsx
// ui2 exports a thin, generic wrapper; the app supplies the fields + mutation.
interface RowEditModalProps<TData> {
  open: boolean
  onOpenChange(open: boolean): void
  title: React.ReactNode
  row: TData | null                     // null = closed / creating
  onSubmit(values: TData): Promise<void>
  submitting?: boolean
  children: React.ReactNode             // the Field form, controlled by the app
}
```

The app owns the form state and the mutation; ui2 owns the dialog frame, footer buttons
(Save / Cancel), busy state, and error surface, so every "quick edit" looks identical.

**(b) `EditableDataTable<TData>` (build after the modal, for true inline).** A sibling of
`ServerDataTable` that renders editable cells for columns with `meta.editable`, using the
already-reserved `updateData` seam. For small, fully-in-memory config lists (mappings,
fiscal years, quarters). Rough API:

```ts
interface EditableDataTableProps<TData> {
  columns: ColumnDef<TData, any>[]      // columns opt in via meta.editable + meta.editor
  data: TData[]
  getRowId(row: TData): string
  onRowSave(row: TData): Promise<void>  // per-row explicit save (matches today's UX)
  onRowDelete?(row: TData): Promise<void>
  savingRowId?: string | null
  deletingRowId?: string | null
  editorFor?(columnId: string): "text" | "date" | "select" // or a render fn
  // reuses TableView, cell renderers, sticky header, empty state
}
```

`meta.editor` (a per-column editor descriptor) is the one addition to the existing
`ColumnMeta`. Per-row explicit Save/Delete matches the current fiscal-year/quarter UX
(`PeriodList.tsx`), so those two tables migrate onto it 1:1 and stop being hand-rolled.

Both are added to the kitchen-sink demo before any app consumes them.

### 4.3 Per-entity recommendation

| Entity | Fields | Recommendation | Why |
|--------|--------|----------------|-----|
| Account mappings | 2 (account, description) | **Inline** (`EditableDataTable`) | Two fields, one is a select; ideal inline |
| Fiscal years / quarters | 3 to 4 | **Inline** (already; move to `EditableDataTable`) | Already inline, keep it, dedupe the markup |
| Currencies | 4 (code, name, symbol, rate, default) | **Modal** (`RowEditModal`) | A few fields incl. a default toggle; modal is cleaner than 4 inline editors |
| Units | 5 (code, localisation, label, precision, parent) | **Modal** | Has a parent select; modal |
| Tax rates | 9 (code, domain, rate, behavior, report_code, account, dates) | **Modal** | Too many fields for inline; modal, not full page |
| Dimension values | ~4 (code, name, dates) | Modal (low priority) | Lives inside a detail page already |
| Accounts | code, name, type, is_active | **Inline** toggle for `is_active` + **modal** for name/type | Give accounts an edit affordance it lacks today |
| Dimension types | code, name, type, applies_to[], + nested values | **Keep full page** | Multi-select `applies_to` + a nested values sub-table + soft delete; too complex for a modal |
| Journal entries | multi-line double-entry, balancing, per-line dimensions, period/status rules | **Keep full page** | Genuinely complex; a modal would be hostile. Never inline |

## 5. Phased sequence

Smallest and safest first. ui2 changes are released via `/ui2-release`; consumers bump
via `/ui2-bump`. Verify on staging (`trf.is`) before promoting, per repo rules.

**Phase 0 — backend contract (unblocks everything real).**
1. Fix `GET /v1/entries` (3.1): params struct, date/q filters, sort whitelist, total,
   `{ items, total, page, limit }`, indexes. This also fixes the live mismatch.
2. (Optional, recommended) add page/limit/sort/total to `GET /v1/accounts`.
   Do backend on its own branch; do not touch `.github/workflows/` (Tom owns CI).

**Phase 1 — ui2 primitives (only what the ledger needs beyond what shipped).**
The server-list infra (ServerDataTable, TablePage, useTableQuery, cells) is already
shipped and live. Net-new here:
3. `RowEditModal` wrapper + kitchen-sink demo.
4. `EditableDataTable` + `meta.editor` + kitchen-sink demo.
Release a ui2 tag once both land.

**Phase 2 — migrate Journal Entries (the one real win).**
5. Rebuild `EntryList` on `ServerDataTable` + `TablePage` + `useTableQuery` +
   react-query/`keepPreviousData`, mirroring `frontinvoices/InvoiceList.tsx`. Columns:
   entry_number (mono), entry_date (date), description (text), dimensions (badge list),
   status (StatusBadge), row-click -> detail. Wire date/status filters + debounced
   search into the filter slot. Enable sorting only on the whitelisted columns from
   Phase 0. Keep the full-page edit flow. Verify on staging.

**Phase 3 — config lists to unified cells + quick-edit (no navigation).**
6. Convert currencies, tax-rates, units to client `DataTable` + `RowEditModal`, deleting
   the `*Edit` full-page routes' role in the edit flow (routes can stay for deep links).
7. Convert account mappings to `EditableDataTable` (inline). Convert accounts to a list
   with an inline `is_active` toggle + a `RowEditModal` for name/type (net-new edit
   affordance).
8. Move Fiscal Years and Quarters (`PeriodList`) onto `EditableDataTable`, deleting the
   hand-rolled inline markup. This is a pure dedupe, same UX.

**Phase 4 — read-only sub-tables and reports (archetype B/E, cosmetic).**
9. Re-skin Trial Balance, Journal Report, Turnover, and the Dimension Values sub-table
   with the shared cell renderers + a totals footer. No server features, no backend
   change. Lowest priority.

### Shared-infra / collision watch
- **AppLayout width change.** Per the infra plan (section 6, decision 4), table pages go
  full-width and `AppLayout` becomes padding-only. Do this per app during migration and
  verify non-table pages still look right. `frontledger`'s `AppLayout.tsx` is its own
  copy; changing it only affects this repo.
- **ui2 version churn.** Phase 1 cuts a new ui2 tag that every other consumer will
  eventually pull. Coordinate the release with the ongoing initiative so `RowEditModal` /
  `EditableDataTable` land in a clean tag (Tom develops in parallel; check dirty state
  before releasing).
- **Backend `page_size` vs `limit`.** Decide the param name once in Phase 0 (prefer
  `limit`) so `useTableQuery`'s default `params` map is reused verbatim; otherwise the
  entries fetcher needs a custom mapping.
- **CI files.** Do not edit `.github/workflows/` in backledger or frontledger without
  asking (Tom owns them).
