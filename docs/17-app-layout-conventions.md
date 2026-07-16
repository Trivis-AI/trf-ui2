# App layout and navigation conventions

Status: ACTIVE. Decided 2026-07-16 (frontpurchase design review). These rules apply to every
TRF frontend (front*, frontinvoices). They exist because the suite had drifted into three
page-width conventions and four back-link styles. When you touch a page that violates a rule
here, fix it as part of your change.

Reference implementations: **frontpurchase** (width helper, breadcrumb migration),
**frontinvoices** (list-page recipe).

## 1. Page width

- List/table pages: `TablePage` (default `size="full"`, edge to edge). Never wrap a
  `TablePage` in a `Page`.
- Every other page: `<Page size="xl">`.
- Apply the size at the **router level** with a single helper, never per page, so pages
  cannot drift:

```tsx
// main.tsx (reference: frontpurchase/src/main.tsx)
const constrained = (el: React.ReactNode) => <Page size="xl">{el}</Page>
...
<Route path="invoices" element={<InvoiceList />} />            {/* TablePage page: bare */}
<Route path="invoices/:id" element={constrained(<InvoiceEdit />)} />
```

- No inner `max-w-*` caps inside page content. If a form feels too wide, that is a design
  question for the system, not a local override.

## 2. Navigation chrome: no inline back links

Inline "Back" links/buttons on pages are banned. The shell owns way-finding:

- `@trf/app-shell` >= v0.29.0 renders a desktop breadcrumb top bar (App > Section > tail)
  automatically. Section comes from the discovery menu; nothing to wire for list pages.
- Detail/edit/wizard pages publish their tail crumb (renders nothing in place):

```tsx
import { ShellCrumb } from '@trf/app-shell'
...
<ShellCrumb label={pageTitle} />           /* last crumb, plain text */
```

- Multi-level tails pass `href` on intermediate crumbs. Crumbs clear on unmount.
- Cancel buttons on forms are form actions, not navigation chrome; they stay.
- Full-bleed screens (chat) can pass `topBar={false}` to `AppShellLayout`.

Since app-shell v0.30.0 the bar also carries the page's actions and status, and pages
drop their `PageHeader`/`TablePage` heading (the crumb already names the page):

- `<ShellBarActions>` portals the page's action buttons into the right side of the
  crumb row. Workflow actions keep text labels; utility actions (attach, copy, new,
  delete) are icon buttons (`size="sm" className="px-2"`, `title` + `aria-label`).
- `<ShellBarMeta>` portals status badge + meta text into a second bar row.
- The bar is desktop-only: pages render the same nodes again in a `md:hidden`
  fallback row so mobile keeps them (share one JSX variable; keep hidden file
  inputs and similar ref-holders outside the shared node so refs stay unique).

## 3. Unsaved-changes guard

Guard in-app navigation with react-router's `useBlocker` driving the ui2 `ConfirmDialog`,
not with a per-link handler (the breadcrumb, sidebar, and browser back all bypass those).

- **Requires a data router**: `createBrowserRouter(createRoutesFromElements(...))` +
  `RouterProvider`. Plain `<BrowserRouter>` makes `useBlocker` throw at render.
- Keep a `dirtyRef` and a `leave(to)` helper that clears the ref before deliberate
  post-action navigations (after delete/copy), or the blocker will challenge them.
- Keep a `beforeunload` listener while dirty: cross-app sidebar links use
  `window.location.href` and bypass the blocker.

Reference: frontpurchase `src/pages/invoices/InvoiceEdit.tsx`.

## 4. List page recipe

`useTableQuery` (state + queryKey) > `TablePage` (`search`, `TableFilterBar` filters,
`TableColumnOptions`, `pagination`) > `ServerDataTable`.

- No `title` on `TablePage` (optional since ui2 v7.0.24): the shell bar names the page.
  The primary action ("New X") goes in `<ShellBarActions>`, with a `md:hidden`
  fallback row inside the page for mobile.

- react-query: `placeholderData: keepPreviousData` on the list query (flicker-free
  refetch; pass `fetching={query.isFetching && !query.isLoading}`).
- Row click navigates to detail (`onRowClick`); no link column.
- Where bulk operations exist, wire `enableRowSelection` + `enableSelectAll` +
  `getRowId` + `selectedRowIds` + `bulkActions`, with a `useConfirm` dialog per action.

Reference: frontinvoices `src/pages/invoices/InvoiceList.tsx`.

## 5. QueryClient standard

```tsx
new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
})
```

## 6. Icons, not glyphs

Lucide components only. Never bake arrows/symbols into translation strings or JSX text
(no `← Back`, `▼ Show`, `Open →`, `↗`, `✕`). External links get a trailing
`<ExternalLink />`; expanders get `<ChevronDown />`/`<ChevronUp />`.

## 7. Rhythm

Page-level `Stack gap={5}`. All spacing on the Stack/Row gap scale; no arbitrary margins
between page sections.

## 8. Shared components rule

Anything that is navigation chrome or suite-wide behavior lives in `@trf/ui2` or
`@trf/app-shell`, never copy-pasted between app repos. If you find yourself copying a
component from a sibling app, propose promoting it instead (see 16-component-graduation.md).
Known promotion backlog: token-based Toaster config, section-header typography, shared
series CRUD list.
