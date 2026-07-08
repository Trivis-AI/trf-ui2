# ServerDataTable, TablePage & cell renderers

> **Status: draft** · source: `src/components/table/`
> `import { ServerDataTable, TablePage, useTableQuery, ... } from "@trf/ui2"`

Server-backed table infrastructure for large, server-driven list pages (thousands of
rows) with server-side filter/sort/pagination and a flicker-free loading model. This
is a **sibling** to the client-only `DataTable`, not a replacement: keep `DataTable`
for small in-memory sets, reach for `ServerDataTable` when the server owns paging,
sorting, and filtering. Full design rationale: `docs/PLAN-server-data-table.md`.

ui2 stays data-layer agnostic: nothing here depends on react-query or a router. The
app wires `useTableQuery` to its fetcher (react-query in the apps) and, optionally, a
router URL adapter.

## The pieces

| Symbol | Kind | Role |
|---|---|---|
| `ServerDataTable<TData>` | component | Fully controlled, server-driven table. Holds no data state; pagination, sorting, and filtering are driven by props. |
| `TablePage` | component | Full-width page organism with fixed regions: header, toolbar, filter bar, bulk actions, table, pagination footer. |
| `useTableQuery` | hook | Owns page/sort/filter/search state, debounces search, optionally syncs to the URL. Produces a `queryKey` + `params` for the fetcher. Does not fetch. |
| `createHistoryUrlState` | factory | Default zero-dependency URL adapter (History API). Apps can pass a react-router adapter instead. |
| `TableSearch` | component | Debounced quick-filter input. Toolbar-left. |
| `TableColumnOptions<TData>` | component | Menu to hide/show and reorder columns. Toolbar-right. |
| `TablePagination` | component | The footer: "Page X of Y", "N total", Prev/Next. |
| `TableFilterBar` | component | Wraps filter controls with uniform spacing and an auto "Clear" button. |
| `TableProgress` | component | The thin header progress line for background refetches. |
| `TableView` | component | Shared presentational core (internal; `DataTable` and `ServerDataTable` both render through it). |
| cell renderers | components | Standard cell content: see [Cell renderers](#cell-renderers). |

## Quick start

```tsx
import {
  ServerDataTable, TablePage, TableFilterBar, useTableQuery,
  StatusCell, MoneyCell, DateCell, type ColumnDef,
} from "@trf/ui2";

function InvoiceList() {
  // Owns page / sort / filter / debounced-search state + URL sync.
  const q = useTableQuery({ defaultPageSize: 50, filterKeys: ["status"] });

  // Feed queryKey + params to your data layer (react-query in the apps).
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["invoices", q.queryKey],
    queryFn: () => fetchInvoices(q.params),
    placeholderData: keepPreviousData,
  });

  const columns: ColumnDef<Invoice>[] = [
    { id: "date", header: "Date", cell: ({ row }) => <DateCell value={row.original.date} /> },
    { id: "status", header: "Status",
      cell: ({ row }) => <StatusCell tone={row.original.tone} label={row.original.status} /> },
    { id: "total", header: "Total", enableSorting: true,
      cell: ({ row }) => <MoneyCell value={row.original.total} /> },
  ];

  return (
    <TablePage
      title="Invoices"
      primaryAction={<Button>New invoice</Button>}
      search={{ value: q.searchInput, onChange: q.setSearch }}
      filters={
        <TableFilterBar active={Object.keys(q.filters).length > 0} onClear={q.clearFilters}>
          {/* Select / DatePicker controls bound to q.setFilter */}
        </TableFilterBar>
      }
      pagination={{
        pageIndex: q.pageIndex,
        pageCount: data?.pageCount ?? -1,
        rowCount: data?.rowCount,
        onPageChange: q.setPageIndex,
      }}
    >
      <ServerDataTable
        columns={columns}
        data={data?.rows ?? []}
        pageIndex={q.pageIndex}
        pageSize={q.pageSize}
        pageCount={data?.pageCount ?? -1}
        rowCount={data?.rowCount}
        onPaginationChange={({ pageIndex }) => q.setPageIndex(pageIndex)}
        sorting={q.sorting}
        onSortingChange={q.setSorting}
        loading={isLoading}
        fetching={isFetching && !isLoading}
        onRowClick={(row) => navigate(`/invoices/${row.id}`)}
      />
    </TablePage>
  );
}
```

## Loading model (no flicker)

- **Cold load, no rows yet** (`loading`): skeleton rows, table-shaped, not a spinner.
- **Refetch with rows on screen** (`fetching`): rows stay exactly as they are and a
  thin progress line appears pinned under the header. Rows are never cleared.

Wire `loading` to react-query `isLoading` and `fetching` to `isFetching && !isLoading`,
with `keepPreviousData` (`placeholderData`) so page/sort/filter changes never blank the
table.

## `ServerDataTable` props (selected)

| Prop | Default | Notes |
|---|---|---|
| `columns` / `data` | required | `ColumnDef` re-exported from `@trf/ui2`. `data` is the **current page** of rows. |
| `pageIndex` / `pageSize` / `pageCount` | required | Controlled, server-side. `pageCount` is `-1` when unknown. |
| `rowCount` | optional | Total rows, for the "N total" footer. |
| `onPaginationChange` | required | `(next: { pageIndex, pageSize }) => void`. |
| `sorting` / `onSortingChange` | optional | Controlled, server-side. Per-column via `ColumnDef.enableSorting`; omit `onSortingChange` to disable sorting entirely. |
| `columnVisibility` / `columnOrder` (+ handlers) | uncontrolled | Client-side view state. Pass both value + handler to control/persist (e.g. localStorage). |
| `enableRowSelection` / `enableSelectAll` | `false` / `true` | Per-row checkbox column and header select-all. |
| `renderSubRow` | optional | Expandable detail sub-row. Toggle via `row.toggleExpanded()` from a cell. |
| `loading` / `fetching` | `false` | The two-state loading model above. |
| `onRowClick` | optional | Whole-row click opens the item. No per-row "Open" button (guardrail). |
| `rowClassName` | optional | e.g. archived rows `opacity-60`. |
| `stickyHeader` | `true` | |
| `virtualize` | `false` | Reserved; auto-on above a threshold once virtualization lands. |
| `mode` | `"pagination"` | `"infinite"` is reserved for a later add. |

## `useTableQuery`

```ts
const q = useTableQuery({
  defaultSort,          // SortingState
  defaultPageSize,      // default 50
  searchDebounceMs,     // default 300
  syncToUrl,            // default true (History API)
  filterKeys,           // filter params to track/serialize
  urlState,             // optional custom adapter (e.g. react-router)
});
```

Returns `{ pageIndex, pageSize, sorting, search, searchInput, filters, ...setters, queryKey, params }`.
All setters reset `pageIndex` to 0 except `setPageIndex`. `search` is debounced (feed it
to the fetcher); `searchInput` is immediate (bind it to the input). `params` is the flat
map for the fetcher (`page`, `limit`, `sort`, `dir`, `search`, `...filters`).

### URL sync adapter

`syncToUrl` defaults on, through a pluggable `UrlStateAdapter` (`get` / `set` /
`subscribe`). ui2 ships `createHistoryUrlState` (zero-dep, History API). Router apps
pass a ~5-line adapter wrapping `useSearchParams` so URL sync stays router-integrated.

## Guardrails (fixed regions, `TablePage`)

Flexible in **what** goes in each region; opinionated about **where** it goes and what
it is called. `TablePage` uses structured props, not one free-form slot:

- **Row navigation is whole-row click** (`onRowClick`), never an "Open" button.
- **Quick-filter search**: always toolbar-left (`search`).
- **Column options**: always toolbar-right (`columnOptions`, a `TableColumnOptions`).
- **Primary action** (the CTA, e.g. "New invoice"): rightmost in the header
  (`primaryAction`); utilities sit left of it (`secondaryActions`).
- **Filters**: the filter bar between toolbar and table, with an auto ghost `Clear`.
- **Bulk actions**: a bar above the table when rows are selected (`bulkActions`).
- **Pagination**: always the footer, one consistent format.

Copy conventions baked in as defaults: primary create button `New <Noun>`, search
placeholder `Search...`, filter labels sentence-case nouns, reset labeled `Clear`,
footer `Page X of Y` + `N total`, status column always `StatusBadge`.

## Cell renderers

Standard cell content so the same type looks identical on every page. Each is a small
helper used inside `ColumnDef.cell`, composing existing ui2 primitives.

| Cell | Use |
|---|---|
| `StatusCell` | `StatusBadge` pill, optional inline sub-text. Status column always uses this. |
| `InvoiceStatusCell` | Canonical sell-invoice lifecycle pill. Maps `{ status, paymentStatus, dueDate }` to Draft / Awaiting payment / Partially paid / Paid / Overdue / Credited / Cancelled via `deriveInvoiceStatus`. Use for every invoice status, never re-derive the tone per page. |
| `MoneyCell` | Right-aligned, `tabular-nums`, mono; passes raw backend strings through. `signed` variant colors +/-. |
| `MonoCell` | Codes / SKU / IBAN / numbers, with empty fallback. |
| `DateCell` | Date / datetime / date-range, one canonical format. Never format dates per page. |
| `TextCell` | Truncation + max-width + title tooltip, optional secondary sub-line. |
| `BooleanCell` | Yes/No badge or checkmark. |
| `MeterCell` | Progress/meter bar (e.g. "Matched 12 / 40"). |
| `IconCell` | Lucide icon standing in for text to save width. Icon-only **requires** a tooltip / aria-label. |
| `BadgeListCell` | One or more `Badge`s, including mono badges. |
| `LinkCell` | An inline link cell. |
| `ActionsCell` | Per-row action buttons, right-aligned. Open verb vocabulary via passed-in actions. |
| `AvatarCell` | People/contacts avatar. |
| `ThumbnailCell` | Fixed-size rounded image with placeholder fallback + lazy loading. |
| `CellHoverCard` | The reserved hover-card seam: wrap a cell's content to reveal extra detail on hover without changing the column contract. |

Guardrail: reach for a standard cell before hand-rolling markup. Custom cells are
allowed (`ColumnDef.cell` takes arbitrary React) but reviewed against these.

## Rules

- Keep `DataTable` for small in-memory sets; use `ServerDataTable` when the server
  owns paging/sorting/filtering.
- Sorting is server-side only. A column shows a sortable header only where its backend
  supports that sort field.
- Full width via `Page size="full"` (the `TablePage` default). Table pages own their
  width; detail/form pages wrap in `<Page size="lg">`.

## Related

- [Table & DataTable](./table.md) · [Layout & Page](./layout.md)
- [13 AI Coding Guidelines](../13-ai-coding-guidelines.md) · [03 Design Tokens](../03-design-tokens.md)
- Full plan: `docs/PLAN-server-data-table.md`
