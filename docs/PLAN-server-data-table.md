# Plan: server-backed data table infra (ServerDataTable + TablePage + useTableQuery)

Status: draft for review. Do not execute until signed off.
Owner: Jaak. Last updated: 2026-07-08.

## 1. Goal

Build a reusable table infrastructure in `@trf/ui2` for large, server-driven list
pages (thousands of rows), with fast perceived loading, server-side filtering,
sorting, and pagination, and a flicker-free loading model. First consumer is
purchase invoices, then payments, then products, then sales invoices later.

The existing client-only `DataTable` stays as-is for small in-memory sets. The new
work is a sibling component, not a rewrite.

## 2. Current state (what we are replacing)

Three pages, each hand-builds the same server-driven table from ui2 low-level
`Table` primitives + `TableCard`, with raw `useState`/`useEffect` fetching:

| Aspect          | Purchase invoices        | Payments                 | Products                 |
|-----------------|--------------------------|--------------------------|--------------------------|
| File            | `frontpurchase/src/pages/invoices/InvoiceList.tsx` | `frontpayments/src/pages/payments/PaymentList.tsx` | `frontproducts/src/pages/products/ProductList.tsx` |
| Table           | ui2 `Table` + `TableCard`| same                     | same                     |
| Fetch           | `useState`/`useEffect`   | same                     | same                     |
| Filtering       | server, URL params       | server, component state  | server, URL params       |
| Pagination      | server offset, 50/page   | server offset, 20/page   | server offset, 50/page   |
| Sorting         | none                     | none                     | none                     |
| Row action      | "Open" link cell         | whole-row click nav      | "Restore" + "Open" cell  |
| Row styling     | none                     | none                     | archived -> `opacity-60` |
| Loading / empty | hand-rolled `colSpan`    | hand-rolled `colSpan`    | hand-rolled `colSpan`    |
| Width           | `max-w-6xl` in AppLayout | `max-w-6xl` in AppLayout | `max-w-6xl` in AppLayout |
| Status column   | `StatusBadge`            | `StatusBadge`            | `StatusBadge`            |

Known bug to fix in passing: products' search input fires a request per keystroke
(no debounce).

The `max-w-6xl` wrapper is the identical `AppLayout.tsx` in every repo.

## 2A. Full inventory and archetypes (scope)

A domain-wide audit found ~35 table surfaces across frontpayments, frontproducts,
frontitems, frontpurchase, and frontinvoices. Every one is hand-rolled from ui2
`Table` primitives with `useState`/`useEffect` (no react-query anywhere). They fall
into five archetypes. Only archetype A is what this work targets in v1.

| # | Archetype | Examples | In v1? |
|---|-----------|----------|--------|
| A | **Server-driven list** (paginated/filtered, primary page) | payments PaymentList, products ProductList, purchase InvoiceList, sales InvoiceList; also list-shaped but unpaginated today: StatementList, ItemList, FixedAssetRegister | **Yes** |
| B | **Read-only detail sub-table** (in-memory, no paging, some poll) | payment allocations, statement import jobs (poll 3s), depreciation entries, run-depreciation results, delivery dispatch history, invoice-rows display | Reuse shared `TableView` + cell renderers with static data; no server features. Fast follow. |
| C | **Inline row editor** (edit-in-place or expand-panel) | invoice line-item editors (purchase + sales), SeriesList x3, product prices/costs/components tabs, settings key/value, account-suggestion matching | **No.** Different component (`EditableTable`, later). Keep as-is. |
| D | **Selection / picker** (checkbox multi-select + bulk bar) | purchase InvoiceImport (select-all, indeterminate, bulk delete), payments NewRunModal (multi-select, footer sum) | API supports it (4.5); wire these two later. |
| E | **Card-list "table"** (functions as a table, not `<table>`) | statement reconciliation (StatementDetail), several settings/product tabs | **No.** Leave as bespoke. |

Content types the audit found in real use (drives 4.7): plain-text (often with a
secondary sub-line), mono-code, money/amount (right, `font-mono tabular-nums`, raw
backend strings, sometimes signed + colored), date + datetime + date-range,
status-pill (`StatusBadge` + occasional inline sub-text), badge/tag (incl. mono
badges), boolean (rendered Yes/No or checkmark), progress/meter (statement Matched
bar), link, action-buttons (a large verb vocabulary), and an expandable error
sub-row. No thumbnails/avatars exist yet (green-field, product photos are coming).

Interactions found: server pagination + filters only on the four main lists (rest
load full sets), zero sorting anywhere, zero column hide/reorder anywhere, selection
on two surfaces, polling on two, and consistent hand-rolled loading/empty via
`colSpan`. This confirms the v1 target and that sorting/column-options are net-new
capabilities, not migrations of existing behavior.

## 2B. Backend capability findings (step 0 result, 2026-07-08)

Each list endpoint is a separate per-domain Go service with its own GORM query
builder (no shared list contract). Audited capabilities:

| Endpoint | Service | Sort param | Filters honored | Search | Pagination | Total count |
|---|---|---|---|---|---|---|
| `GET /v1/invoices` (sales) | backinvoices | **none** (`created_at DESC`) | date_from/to, status, document_type, payment_status, customer_id | none | page+limit, def 50 | yes |
| `GET /v1/invoices` (purchase) | backpurchase | **none** (`created_at DESC`) | date_from/to, status, payment_status, supplier_id | **yes**: `invoice_no` + supplier legal_name, ILIKE | page+limit, def 50 | yes |
| `GET /v1/payments` | backpayments | **none** (`payment_date DESC`) | status, direction, date_from/to. **`method`, `page`, `limit` IGNORED** | none | **broken**: page/limit ignored, always first 50 | **no** |
| `GET /v1/items` (products) | backproducts | **none** (`name ASC`) | type, category_id, is_active, is_bundle, search | **yes**: `name` ILIKE (**SKU not matched**, though UI says "name or SKU") | page+limit, def 50 | yes |
| `GET /v1/items` (inventory) | backitems | **none** (`name ASC`) | include_archived | none | **none** (full list) | no |
| `GET /v1/statements` | backpayments | **none** (`created_at DESC`) | none (org only) | none | limit+**offset**, def 50 | yes |

Hard conclusions:
1. **Sorting is a net-new backend feature everywhere.** Every endpoint has a single
   hardcoded ORDER BY and no sort/direction param. `ServerDataTable` can ship the
   sort UI, but no page shows a sortable column until its service adds a sort param.
2. **Payments is the least ready:** pagination silently ignored (always first 50), no
   total count (so no "N total" / page count), and the `method` filter is dropped.
   These are pre-existing bugs the migration would surface.
3. **Purchase is the most ready:** real pagination + total + search already. Products
   is close (pagination + total + name search; SKU search is a claimed-but-missing
   feature). Sales lacks search entirely.
4. **Contract drift:** page-based (invoices, products) vs offset-based (statements)
   vs ignored (payments); total returned by some, not others; search on two of six.
   A standard list contract is worth defining so all services converge.

This decouples sorting from the migration: we migrate for the other wins now (full
width, unified cells, loading model, react-query cache, debounced search) and light
up sortable columns per table only as each backend gains a sort param.

## 3. Design decisions (settled)

1. **Keep `DataTable` (client-only) untouched.** Right tool for small sets already
   held in memory. Still in the kitchen sink. Zero risk to current consumers.
2. **New sibling `ServerDataTable` (working name).** Fully controlled: pagination,
   sorting, filtering all driven by props. Holds no data state of its own.
3. **Server-side always for filter, sort, and page.** Client-side sort would only
   reorder the loaded page, which is a wrong feature, not a smaller one. Sort is a
   server param regardless of whether filters are applied. Filter, sort, and page
   are the same mechanism: query params where changing filter or sort resets page
   to 0.
4. **Loading model, two states, no flicker:**
   - Cold load, no rows yet -> skeleton rows (table-shaped, not a spinner).
   - Refetch with rows on screen (filter/sort/page change, background revalidate)
     -> keep the current rows exactly, show a thin progress line pinned under the
     header row. Swap rows in place on completion. Rows are never cleared.
5. **Caching via react-query in the apps (stale-while-revalidate).** Cache key is
   page + sort + filters. Revisiting a seen query renders cached rows instantly,
   revalidates in the background. `keepPreviousData` powers the no-flicker refetch.
   - True delta sync ("only load what changed") is rejected: it does not compose
     with a server-sorted/filtered/paginated slice and rebuilds server semantics
     on the client for little gain over caching.
   - Optional, backend-dependent: HTTP conditional requests (ETag / If-None-Match)
     give "only new bytes" (304 Not Modified) per page-query. Nice-to-have, not
     blocking.
   - Polling (import/statement job tables refetch every 3s today via `setInterval`)
     is covered natively by react-query `refetchInterval`, another reason for Full.
6. **Full width via `Page size="full"`.** ui2 already has `Page` with
   `size="full"` (`max-w-none`). The `max-w-6xl` cap currently comes from each
   app's `AppLayout`, so that wrapper changes (see section 6).
7. **ui2 stays data-layer agnostic.** `ServerDataTable`, `useTableQuery`, and
   `TablePage` take no dependency on react-query or any fetcher or on react-router.
   The demo (and later the apps) wire them to react-query + a data source. Going
   from mock to Supabase to the real TRF API changes only the fetcher.
8. **Composition first (see section 4.6).** The organism is reused across pages with
   different needs: variable title-area buttons, different filter bars, optional
   inline quick-filter search, optional column options (hide / reorder), and mixed
   sortable / non-sortable columns. Everything is slots + drop-in subcomponents, not
   a fixed layout. No page should have to fork the organism to add or drop a piece.
9. **Pagination, not infinite scroll, for v1.** Precise filter-to-find workflows
   suit pagination (addressable position, one page in memory, simple backend
   contract). Infinite scroll needs cursor / keyset pagination (compound cursors
   under arbitrary sort) for correctness, mandatory virtualization, and loses
   URL-addressable position. Since we virtualize regardless, `ServerDataTable` is
   designed to accept a `mode: 'pagination' | 'infinite'` later, reusing the same
   query + virtualization core. Not built now.

## 4. Components to build in ui2

### 4.1 Internal shared core `TableView` (refactor)

Extract the pure presentational table out of `DataTable`: header, rows, cells, sort
chevrons, sticky header, row virtualization, empty/skeleton states, and the header
progress line. Both `DataTable` and `ServerDataTable` build a TanStack table
instance and render through `TableView`. `DataTable` uses client row models and
owns its state (public API unchanged). `ServerDataTable` uses manual models with
controlled state. This guarantees the two look identical and keeps a single render
layer to maintain.

`TableView` props (internal): `table` (TanStack instance), `loading`, `fetching`,
`onRowClick`, `rowClassName`, `stickyHeader`, `virtualize`, `emptyMessage`,
`skeletonRows`, `className`.

### 4.2 `ServerDataTable<TData>` (new, exported)

```ts
interface ServerDataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];                    // the current page of rows

  // pagination (controlled, server)
  pageIndex: number;                // 0-based
  pageSize: number;
  pageCount: number;                // total pages from server, -1 if unknown
  rowCount?: number;                // total rows, for "N total"
  onPaginationChange: (next: { pageIndex: number; pageSize: number }) => void;

  // sorting (controlled, server). Per column, ColumnDef.enableSorting decides
  // whether that column is sortable, so mixed sortable / non-sortable is inherent.
  sorting?: SortingState;           // [{ id, desc }]
  onSortingChange?: (next: SortingState) => void;

  // column options (view state, client-side). Uncontrolled by default; pass
  // controlled props to persist (localStorage / URL) via useTableQuery.
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (next: Record<string, boolean>) => void;
  columnOrder?: string[];
  onColumnOrderChange?: (next: string[]) => void;

  // row selection (optional; archetype D: InvoiceImport, NewRunModal)
  enableRowSelection?: boolean;     // per-row checkbox column
  enableSelectAll?: boolean;        // header select-all; decided per table (may be off)
  selectedRowIds?: Record<string, boolean>;
  onSelectedRowIdsChange?: (next: Record<string, boolean>) => void;
  getRowId?: (row: TData) => string;

  // expandable detail sub-row (optional; e.g. delivery-dispatch error row)
  renderSubRow?: (row: TData) => React.ReactNode;

  // loading model
  loading?: boolean;                // cold, no rows -> skeleton
  fetching?: boolean;               // refetch with rows -> header progress line

  // interaction / presentation
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: TData) => string | undefined;
  stickyHeader?: boolean;           // default true
  virtualize?: boolean;             // default auto when rows exceed a threshold
  emptyMessage?: React.ReactNode;
  skeletonRows?: number;            // default = pageSize
  mode?: "pagination" | "infinite"; // v1 = pagination; infinite is a later add
  className?: string;
}
```

Notes:
- No built-in filter UI and no global-filter box: filters live in the page's filter
  slot and drive the query, unlike client `DataTable`'s `enableGlobalFilter`.
- Custom cells (StatusBadge, action buttons like products' Restore/Open) use normal
  `ColumnDef.cell`.
- Sortability is per column via `ColumnDef.enableSorting`; sortable columns render a
  clickable chevron, others are plain headers.
- Column visibility / order state is exposed so a `TableColumnOptions` menu (4.6)
  can drive it, and so a page can persist a user's column layout.

### 4.3 `useTableQuery` (new, exported) — the shared state hook

Owns page/sort/filter state, debounces search, optionally syncs to the URL, and
produces the query object the app feeds to its fetcher and react-query key. Does not
fetch. Router-free: URL sync (opt-in) uses the History API (URLSearchParams +
`replaceState` + `popstate`), so ui2 takes no react-router dependency. Apps that
want router integration can pass an adapter (design detail, see open questions).

```ts
interface UseTableQueryOptions {
  defaultSort?: SortingState;
  defaultPageSize?: number;         // e.g. 50
  searchDebounceMs?: number;        // default 300
  syncToUrl?: boolean;              // default true (History API)
  filterKeys?: string[];            // filter params to track/serialize
}

interface TableQuery {
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  search: string;                   // debounced, used for fetching
  searchInput: string;              // immediate, bound to the input
  filters: Record<string, string>;

  // setters; all reset pageIndex to 0 except setPageIndex
  setPageIndex(i: number): void;
  setPageSize(n: number): void;
  setSorting(s: SortingState): void;
  setSearch(v: string): void;       // updates searchInput now, debounces search
  setFilter(key: string, value: string): void;
  clearFilters(): void;

  queryKey: unknown[];              // stable react-query key
  params: Record<string, string>;  // page, limit, sort, dir, search, ...filters
}

function useTableQuery(opts?: UseTableQueryOptions): TableQuery;
```

### 4.4 `TablePage` (new, exported) — full-width layout organism

Composes the full-width page frame so no page hand-rolls it. Structured props (not
one free-form slot) so the organism owns *where* things go and their order, while
the app owns *what* goes in them. This is the UX-guardrail mechanism (see 4.6):

```ts
interface TablePageProps {
  title: React.ReactNode;
  description?: React.ReactNode;

  // header actions: structured to enforce order + variant
  primaryAction?: React.ReactNode;    // rendered rightmost, primary variant (e.g. "New invoice")
  secondaryActions?: React.ReactNode; // rendered left of primary, secondary/ghost

  // toolbar row: fixed positions, cannot drift
  search?: {                          // always toolbar-left; omit to hide
    value: string;                    // bind to useTableQuery.searchInput
    onChange(v: string): void;        // bind to useTableQuery.setSearch (debounced inside)
    placeholder?: string;             // default "Search..."
  };
  columnOptions?: React.ReactNode;    // always toolbar-right (a TableColumnOptions menu)
  toolbarExtras?: React.ReactNode;    // optional, between search and options; discouraged

  // filter bar: organism arranges with consistent spacing/labels
  filters?: React.ReactNode;

  // bulk action bar: appears above the table when rows are selected (archetype D)
  bulkActions?: React.ReactNode;      // e.g. "N selected" + Delete/Cancel

  size?: PageSize;                    // default "full"
  pagination?: {                      // built-in footer, consistent format
    pageIndex: number;
    pageCount: number;
    rowCount?: number;
    onPageChange(i: number): void;
  };
  children: React.ReactNode;          // the ServerDataTable
}
```

Fixed region order, top to bottom: header (title left, actions right) -> toolbar
(search left, column options right) -> filter bar -> table -> pagination footer.
Search can never end up "in a random place" because there is no free slot that would
allow it, only the fixed `search` capability.

### 4.5 Progress line

Thin 4px bar pinned to the bottom edge of the (sticky) header, absolutely
positioned so it overlays and never shifts rows: gray track (border/muted token)
with a blue (primary token) bar. Indeterminate sweep animation by default, since
response duration is unknown; trickle-to-90 is an alternative to tune in the demo.
To verify: reuse an existing ui2 `Progress` if present, else add a small
token-based `TableProgressBar`.

### 4.6 Composition, fixed layout regions, and UX guardrails

The organism must serve pages with different needs (variable title buttons,
different filters, optional quick search, optional column options, mixed sortable
columns) *without* letting each page arrange things differently. The rule:

> Flexible in **what** goes in each region. Opinionated and fixed about **where**
> it goes, in **what order**, and **what it is called**.

This is why 4.4 uses structured props instead of one `actions` / one `filters` blob.

Fixed positions (guardrails):
- **Row navigation is whole-row click, never an "Open" button.** Clicking a row
  opens the item (`onRowClick`). No per-row "Open ->" link cell anywhere. The
  actions column is only for secondary verbs (Restore, Delete, Download, ...), and
  row-click nav coexists with them (action buttons stop propagation).
- **Quick-filter search**: on the same row as the filters (leftmost), via
  `TablePage.search`. (Filter row gets a visual redesign later; it stays a slot so
  that redesign never touches the table.)
- **Column options** (hide / drag-reorder): a compact icon button attached to the
  table's top-right, via `columnOptions` (pass `TableColumnOptions iconOnly`).
  Reordering is drag-and-drop (dnd-kit), not up/down arrows.
- **Primary action** (the CTA, e.g. "New invoice"): always rightmost in the header,
  primary variant, via `primaryAction`. Secondary/utility buttons sit to its left
  via `secondaryActions`. Structural, so button order cannot drift page to page.
- **Filters**: in the filter bar between toolbar and table, arranged by the organism
  with consistent label style and spacing.
- **Clear**: a ghost `Clear` button that appears automatically whenever any filter
  is active, built into `TableFilterBar` (not per page).
- **Bulk action bar**: when rows are selected, a bar appears in the header region
  showing "N selected" plus the bulk verbs (see 4.5 / below).
- **Pagination**: always the footer, one consistent format.

Drop-in subcomponents (context-light, explicit props, ui2 shadcn style) that apps
mix into the regions:
- `TableSearch` — debounced quick-filter input (the thing `TablePage.search` renders
  internally; also exported for standalone use). Bound to `useTableQuery`.
- `TableColumnOptions` — menu to toggle column visibility and reorder columns; drives
  `ServerDataTable`'s `columnVisibility` / `columnOrder`. Passed to `columnOptions`.
- `TablePagination` — the footer (also used internally by `TablePage.pagination`).
- Filter controls stay the existing ui2 `Select` / `DatePicker` / `Field`, placed in
  the `filters` region; a light `TableFilterBar` wrapper gives them uniform spacing
  and a standard "Clear filters" ghost button.

Per-column sortability is inherent: `ColumnDef.enableSorting` per column, so "some
columns sort, some do not" needs no special handling.

**Naming / copy conventions** (baked as component defaults, documented in
`docs/08-ui-components/`, so consistency is the default not a discipline):
- Primary create button: `New <Noun>` (e.g. "New invoice", "New payment").
- Search placeholder: `Search...` (or `Search by <fields>...` when scoped).
- Filter labels: sentence case, noun ("Status", "Direction", "Category").
- Reset control: a ghost `Clear`, shown only when filters are active.
- Pagination footer: `Page X of Y` with `N total`.
- Status column: always `StatusBadge`, never ad-hoc colored text.
- **Dates**: one canonical table date format via `DateCell` (single helper, agreed
  format for date vs datetime vs range), never per-page date formatting.
- **Amounts**: one canonical style via `MoneyCell` (right-aligned, `font-mono
  tabular-nums`, backend string passthrough), never per-page amount styling.
- **Icons standing in for text** (e.g. payment method Cash / Wire as an icon to save
  width): via `IconCell`, and every icon-only cell MUST carry a tooltip / aria-label
  with the full text. No unlabeled icons.
- Empty state copy and loading skeleton come from the organism, not per page.

The demo page is the reference implementation of these conventions; deviations
should be caught in review against it.

### 4.7 Cell content and cell subcomponents

Cells are not just text. The current tables already render subcomponents in cells
(`StatusBadge` pills, `Badge` for bundle, mono for codes, right-aligned tabular
amounts, action links), and new content types are coming (thumbnails for product
photos, avatars, etc.). Two things follow:

1. **`ColumnDef.cell` already accepts arbitrary React,** so any subcomponent works
   with no special support. `TableView` (4.1) renders whatever the cell returns, so
   `DataTable` and `ServerDataTable` get identical cell rendering for free.
2. **But for the unification goal we ship a set of standard cell renderers** so the
   same content type looks identical on every page, instead of each page styling its
   own amount / status / thumbnail. These are small exported helpers used inside
   `ColumnDef.cell` (they compose existing ui2 primitives):
   - `StatusCell` — a `StatusBadge` pill; optional inline sub-text (hold-until,
     lastError) as the audit found on several pages.
   - `MoneyCell` — right-aligned, `tabular-nums`, mono; passes through raw backend
     strings (apps do not format client-side today); optional `signed` variant that
     colors negative/positive (statement amounts: `-` destructive, `+` success).
   - `MonoCell` — codes / SKU / IBAN / numbers, with the em-dash empty fallback.
   - `DateCell` — date / datetime / date-range, consistent format + empty fallback.
   - `TextCell` — truncation + max-width + title tooltip, plus an optional secondary
     **sub-line** (bank name over IBAN, product name over serial number).
   - `BooleanCell` — Yes/No badge or checkmark ("Matched", "Posted", "Has Profile").
   - `MeterCell` — the progress/meter bar ("Matched 12 / 40") from StatementList.
   - `ThumbnailCell` — fixed-size rounded image with a placeholder fallback and lazy
     loading (product photos, logos). `AvatarCell` variant for people/contacts.
   - `IconCell` — a Lucide icon with an optional label, or icon-only to save width
     (payment method Cash / Wire, direction in/out). Icon-only variant requires a
     tooltip / aria-label carrying the full text (guardrail in 4.6).
   - `BadgeListCell` — one or more `Badge`s, including mono badges (bundle, format,
     CPA code, dimensions, tags).
   - `LinkCell` / `ActionsCell` — the "Open" link and per-row action buttons, right
     aligned, consistent sizing. `ActionsCell` should cover the verb vocabulary the
     audit found (Open, Review, Edit, Delete, Restore, Post, Void, Confirm, Ignore,
     Unlink, Send, Download, Match, Sync, Remove, ...) via passed-in buttons, not a
     fixed set.

Guardrail tie-in: these renderers carry the naming/alignment/formatting conventions
(4.6) so consistency is the default. A page should reach for a standard cell before
hand-rolling markup; custom cells are allowed but reviewed against these.

Future-ready: any cell may opt into a **hover card** (a `HoverCard` popover showing
extra detail on hover, e.g. Total Gross revealing the net / tax / rounding
breakdown; Payable revealing the calculation). Design the cell renderers so a cell
can wrap its content in a hover card without changing the column contract. Built
lazily when the first consumer needs it, but the seam is reserved now.

Virtualization note: thumbnails and multi-line cells change row height. Virtualized
rows are simplest with a known, uniform row height, so `ThumbnailCell` uses a fixed
image box and we set a consistent row height; if a page needs variable-height rows
we rely on TanStack Virtual's dynamic measurement, at some perf cost. Decide row
height per table, keep it uniform where possible.

### 4.8 Bulk actions, preferences, and saved views

**Bulk actions (v1 API, wire per page as needed).** With `enableRowSelection` (4.5),
selecting rows raises the header bulk bar (`TablePage.bulkActions`) showing
"N selected" plus verbs the page supplies: Delete selected, Archive, Add tags, etc.
The set is open (passed-in buttons) so new features add verbs without touching the
organism. Selection state (`selectedRowIds`) lives in the page so bulk mutations know
their targets; "select all" respects the current filter, and because data is
server-paged we must decide whether "select all" means the current page or the whole
filtered set (open question, section 8).

**User preferences persistence.** Column visibility / order (and later saved views)
need a home. Three tiers, in increasing effort:
1. **Session** — in-memory only, resets on reload. Trivial, but forgets everything.
2. **Local (per browser)** — `localStorage`, keyed by a stable `tableId` + user/org.
   Survives reloads, no backend. Good default for column layout.
3. **User (server)** — persisted to a user-preferences store so it follows the user
   across devices. Needs a backend prefs endpoint; required for shareable/saved
   views. This is a backend dependency, not just frontend.

Recommendation: `useTableQuery` (or a sibling `useTablePrefs`) reads/writes column
state through a pluggable `storage` adapter, defaulting to `localStorage` (tier 2).
Apps can pass a server-backed adapter later for tier 3 without changing components.
Decision needed on which tier we commit to for v1 (section 8).

**Saved filters / views (future feature).** Because `useTableQuery` already models
the full view as serializable params (page, sort, filters, search), a "saved view"
is just a named snapshot of those params. Keep the params serializable and
restorable so this later feature is additive: a `views` dropdown that writes/reads
named param sets through the same storage adapter as preferences. Not built in v1,
but the state shape is designed to support it now.

**Complex filters (future).** The filter region is a slot and the filter state is an
open `Record`, so richer filter types (multi-select, ranges, combinators) and a
redesigned filter bar drop in later without changing `ServerDataTable` or
`TablePage`.

## 5. Build and test in ui2 (mock first, Supabase optional)

1. Build 4.1 to 4.5 in `src/`.
2. In `demo/`: add react-query and an in-memory mock server: generate ~5,000 rows,
   implement filter -> sort -> paginate with a tunable artificial delay (600 to
   800ms) so the loading line, keep-previous-data, and cached-first revalidation are
   actually visible.
3. New kitchen-sink page "ServerDataTable" wired via `useTableQuery` + react-query +
   mock, showing filters, sortable headers, server pagination footer, the header
   loading line, skeleton on cold load, and cached revalidation on repeat.
4. Verify visually (run demo / `/shot`), tune animation, skeleton, sticky header,
   virtualization threshold.
5. Optional realism pass: swap the mock fetcher for Supabase (seed a table with a
   few thousand rows) to exercise real network, CORS, latency, and optional
   ETag/304. Only the fetcher changes.

## 6. App migration

Order (by backend readiness, per 2B): **purchase invoices** (most ready: pagination
+ total + search) -> verify -> **products** (needs SKU search fix) -> **sales
invoices** (needs search added) -> **payments last** (needs the backpayments
pagination/total/method fix first, or it migrates with a broken footer). Sortable
columns light up per table only as each service adds the sort param. Each migration:

1. Define `ColumnDef[]` (StatusBadge and action cells via `cell`).
2. Move filters into the `TablePage` `filters` slot.
3. Replace raw `useState`/`useEffect` with react-query keyed on `useTableQuery`'s
   `queryKey`, `keepPreviousData` on.
4. Drive `ServerDataTable` from the query result: `data`, `pageCount`, `rowCount`,
   `loading` (react-query `isLoading`), `fetching` (`isFetching && !isLoading`).
5. Row interaction: `onRowClick` for nav (payments), action-column cells for
   per-row buttons (products Restore/Open), `rowClassName` for archived de-emphasis.
6. Delete the hand-rolled `<Table>` / footer / loading-empty markup.

Per-page specifics:
- **Purchase invoices:** 9 columns, date-range + status + payment + debounced search
  filters, page size 50, "Open" becomes `onRowClick`.
- **Payments:** 7 columns, status + direction + method + date-range filters, no
  search today (can add), page size 20, already whole-row click.
- **Products:** SKU/type/category/bundle/status columns, search + type + category
  (async-loaded options) + status + bundle filters, page size 50, archived rows
  `opacity-60`, Restore + Open action cell. Fix the per-keystroke search.

### Full-width layout change (each repo's `AppLayout.tsx`)

Today: `<div className="mx-auto w-full max-w-6xl p-7 md:p-10"><Outlet/></div>`.

Recommended: make `AppLayout` a padding-only pass-through (no max-width) and let
each page own its width via `Page` / `TablePage`. Table pages use `size="full"`,
detail/form pages wrap in `<Page size="lg">` (or xl). Tradeoff: non-table pages
must be wrapped in `Page` as we touch each app, or they temporarily render
full-width. Do this per app during that app's migration so blast radius stays small
and is verified on staging before moving on. Alternative if we want zero change to
other pages: keep the constrained wrapper as default and add a route-level opt-out;
noted as a decision, section 8.

## 7. Backend dependencies

Step 0 is **done** (findings in 2B). The required backend work that follows:

- **Standard list contract across services.** Define one shape all list endpoints
  adopt: `sort=<field>&dir=asc|desc`, page+limit pagination, a returned total count,
  and a consistent `search` param. Roll it into backinvoices, backpurchase,
  backpayments, backproducts, backitems (each has its own GORM builder today).
- **Sorting (net-new everywhere).** Add the sort param + whitelist of sortable
  fields per service. Frontend enables a sortable header only where its service
  supports that field. This is the gating dependency for the sorting feature.
- **Fix payments (backpayments):** honor `page`/`limit`, return a total count, and
  stop dropping the `method` filter. Blocks the payments pagination footer.
- **Products search (backproducts):** extend `search` to match SKU, not just name
  (the UI already claims "name or SKU").
- **Add pagination to inventory items (backitems)** if that table joins the migration.
- **Indexes on sortable columns** (amount, date, number, name, ...). Server-side sort
  is only fast on indexed columns. Which columns are sortable = which are indexed.
  Jaak's team verifies indexing as the sort whitelist is defined.
- **User-preferences store** (for tier-3 persisted column layouts / saved views, 4.8)
  if we commit to server-side preferences.
- **Optional:** ETag / If-None-Match support per list endpoint for 304 responses.
- Sort params contract to agree with backend: `sort=<col>&dir=asc|desc`.

## 8. Decisions (resolved 2026-07-08)

1. **Name:** `ServerDataTable`.
2. **Progress animation:** indeterminate sweep.
3. **URL sync:** on by default, through a small `urlState` **adapter**. ui2 ships a
   default History-API adapter (zero deps, portable, powers the demo); apps pass a
   ~5-line react-router adapter (wraps `useSearchParams`) so URL sync is fully
   router-integrated inside them and cannot desync from the router. History API alone
   is fine for a library but can desync if used raw inside a react-router app, hence
   the adapter. Shareable / back-safe / refresh-safe state, and the substrate for
   saved views later.
4. **Full width:** Option A (confirmed). AppLayout becomes a padding-only pass-through
   and each page owns its width via `Page` / `TablePage` (table pages `size="full"`,
   others wrapped `size="lg"`/`"xl"`). Done per app during that app's migration.
5. **Supabase realism pass:** deferred, decide later. Mock-first regardless.
6. **Virtualization:** optional per table, default off / auto-on above a row
   threshold. With 20-50/page server pagination most tables never need it, so small
   tables stay simple and Ctrl+F-able; only large renders opt in.
7. **Archetype scope:** v1 = archetype A (server lists). Archetype B (read-only
   sub-tables) is a fast follow reusing the cell renderers. C/D/E deferred.
8. **Guardrails:** search left, column options right, actions right, filter reset
   labeled `Clear`, whole-row click opens the item (no Open buttons). Rest of 4.6
   as written (I have latitude on remaining copy).
9. **Selection/bulk:** build the API in v1 (`enableRowSelection`), wire InvoiceImport
   / NewRunModal later. `enableSelectAll` is a per-table flag (some tables will not
   allow select-all at all). Select-all scope (page vs whole filtered set) decided
   per table when we wire it.
10. **Backend capability map (step 0):** run the audit now, before building.
11. **Preferences persistence:** localStorage for now (tier 2), via a pluggable
    adapter so a server tier can drop in later.

Still genuinely open: item 5 (Supabase) is parked, decide after the mock demo.

## 9. Execution checklist

- [ ] **Step 0 (blocking): backend capability map** — per-endpoint filter/sort/search/
      pagination support, to decide sortable columns per table (section 7).
- [ ] Branch off `main` in trf-ui2 (fresh, not the current chart-types branch).
- [ ] Refactor `DataTable` render layer into internal `TableView`.
- [ ] Build `ServerDataTable`.
- [ ] Build `useTableQuery`.
- [ ] Build `TablePage` (structured regions + guardrails).
- [ ] Build subcomponents: `TableSearch`, `TableColumnOptions`, `TablePagination`,
      `TableFilterBar`.
- [ ] Build standard cell renderers: `StatusCell`, `MoneyCell` (+ signed),
      `MonoCell`, `DateCell`, `TextCell` (+ sub-line), `BooleanCell`, `MeterCell`,
      `IconCell` (+ tooltip), `ThumbnailCell` / `AvatarCell`, `BadgeListCell`,
      `LinkCell` / `ActionsCell`. Reserve the hover-card seam.
- [ ] Column-prefs storage adapter (localStorage default), pluggable for server tier.
- [ ] Progress line (reuse `Progress` or add `TableProgressBar`).
- [ ] Write the UX-conventions doc (4.6) under `docs/08-ui-components/`.
- [ ] Export all from `src/index.ts`; update `docs/STRUCTURE.json` + layout/table docs.
- [ ] Demo: react-query + mock server + "ServerDataTable" kitchen-sink page.
- [ ] Visual verification and tuning.
- [ ] (Optional) Supabase realism pass.
- [ ] `/ui2-release` a tag.
- [ ] Migrate purchase invoices; `/ui2-bump`; verify on staging; sign-off.
- [ ] Migrate payments.
- [ ] Migrate products (fix search debounce).
- [ ] Update this plan's status.
