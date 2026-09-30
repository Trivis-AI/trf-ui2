# Layout rollout: shell bar, page-scrolling tables, doc 17 page structure

Started 2026-09-29. Status is kept here, not in chat. Update the checkboxes as work lands.

## Goal

1. **Top area** (app-shell): the breadcrumb bar and the sidebar org header are the same
   height (56px + 1px border). Page meta (`ShellBarMeta`) moves out of the bar into a pill
   under it, on the new `bg-sunken` token (black 5% light, 50% dark).
2. **Tables**: list pages scroll as a whole. Title and filters scroll away, the column
   header sticks under the shell bar (`stickyHeader="page"`). A table wider than its
   container falls back to its own scroll box. Pure CSS sticky, nothing runs on scroll.
3. **Page structure**: every page follows `17-app-layout-conventions.md`: actions in
   `ShellBarActions` (+ `md:hidden` fallback row), meta in `ShellBarMeta`, `ShellCrumb`
   on detail pages, no `PageHeader`/title duplicating the crumb, no inline back links,
   width from a router-level helper, no inner `max-w-*` caps, no glyph arrows.

## Decisions

- Page mode is opted in per table (`stickyHeader="page"`), not defaulted by `TablePage`:
  React context flows through portals, so a dialog opened from a list page would inherit
  it and stick its header at the wrong offset.
- Mode switching uses a 24px hysteresis (`FIT_SLACK` in table-view.tsx), wider than any
  classic scrollbar, so Windows/Linux scrollbars appearing cannot make it oscillate.
  Verified in the ui2 demo with a 2px width sweep both ways: 0 flips.
- The ui2 and app-shell pins move together in each app: the shell's `bg-sunken` needs
  the ui2 token.
- frontsupport is out of scope for the shell parts: it has no app-shell by design. Its 5
  `DataTable` lists can take `stickyHeader="page"` once it bumps ui2 from v7.6.4.
- Tom signed off the shell chrome change (via Jaak, 2026-09-29).

## Phases

- [x] **1. ui2 v7.11.0** (7d0ba67, staging demo deployed): `--sunken` token; `stickyHeader="page"` in TableView,
      ServerDataTable and DataTable; sticky header cells above pinned cells (z-20) with
      an inset divider; demo publishes `--trf-topbar-h`; docs 03 and 17.
- [x] **2. app-shell v0.39.0** (43e47d8): org header `h-14`; crumb row border on a wrapper; meta
      pill on `bg-sunken`.
- [x] **3. Pins + ready lists, all apps** (13 apps pushed and tagged 2026-09-29; frontinvoices verified live on invoices.trf.is): bump both pins, add `stickyHeader="page"` to
      the lists that are ready (table below), ship each to staging. frontinvoices first.
- [x] **4. Page structure**, all 13 shell apps restructured and on staging (2026-09-29).
- [x] **4b. Record headers** (decided 2026-09-29 after staging review): record pages get
      their title back as a scrolling `RecordHeader` (ui2 v7.12.0) on frontcrm
      ContactDetail, frontitems ItemDetail, frontproducts ProductEdit, frontcontracts
      ContractDetail, frontsettings PersonnelDetail, fronttables TableDetailPage,
      frontledger EntryDetail and PeriodDetail. Identity leaves the pill, which keeps
      status only. Invoice and payment detail pages keep the pill as designed.
- [ ] **5. Prod**: promote each app after Jaak signs off staging.

## Inventory (audit 2026-09-29, read at origin/main)

Pins at audit time: app-shell v0.38.0 everywhere except frontsupport (none). ui2 v7.8.2
in most apps; frontcrm v7.8.5, frontlogin v7.9.1, frontinvoices and frontpurchase
v7.10.0, frontsupport v7.6.4. Only frontinvoices, frontpurchase and frontsupport use a
data router; the rest use `BrowserRouter`, which rules out doc 17 §3's `useBlocker`.

| App | Lists ready for page mode (phase 3) | Lists needing a rewrite first | Structure | Main structure items |
|---|---|---|---|---|
| frontinvoices | InvoiceList | none | S | `+ Add row` glyph; Draft badge in actions instead of meta |
| frontpurchase | InvoiceList, InvoiceImport (drop its `stickyHeader={false}`) | none | S | ApprovalFlowPage back link + inline Save; doubled "Approvals" crumb; 2 `max-w-xl`; glyphs |
| frontpayments | PaymentList | none | S | "New payment" CTA on Overview; `→` glyph; `max-w-md` |
| frontai | none | HistoryPage (raw Table in Card) | S | per-page `Page size="lg"`; PageHeaders |
| fronttables | none | TableDetailPage (EditableGrid has no sticky support) | S | AppLayout `max-w-6xl` cap; back button; PageHeaders |
| frontaudit | none | AuditLogList (to the list recipe) | S | AppLayout cap; `← Prev` / `Next →` glyphs |
| frontproducts | ProductList | none | M | ProductEdit: heading, badges, Save/Archive to shell bar; nested Page; glyphs; router helper |
| frontitems | ItemList | FixedAssetRegister (later) | M | 4 back links; ItemDetail to shell bar; per-page widths |
| frontcontracts | none | ContractList, SeriesPage (raw Table in TableCard) | M | AppLayout cap; ContractDetail back button, meta, actions |
| frontreports | none | AnnualReportList, VatReportList | M | AppLayout cap; back buttons; em-dashes in UI strings; `window.confirm` |
| frontlogin | none (no lists) | none | M | PageHeaders on 10 pages; router helper; glyphs in wizard strings |
| frontcrm | ContactList, TaskList | none | L | never adopted the shell bar (13 pages); per-page widths; ContactDetail back link |
| frontledger | EntryList; Account/Currency/Mapping/TaxRate/UnitList (DataTable, prop only) | DimensionTypeList, PeriodList | L | 31 pages, no shell bar; 3 back buttons; 17 `max-w` caps; stale AGENTS.md contradicts doc 17 |
| frontsettings | none | all 11 lists (raw Table in TableCard, inline-edit rows) | L | 27 pages; AppLayout cap; no react-query |
| frontsupport | 5 DataTable lists, after ui2 bump | none | S | own frame: nested width caps only |

Structure order (phase 4): frontinvoices, frontpurchase, frontpayments, frontai,
fronttables, frontaudit, frontproducts, frontitems, frontcontracts, frontreports,
frontlogin, frontcrm, frontledger, frontsettings.

Known ui2 follow-ups: `EditableGrid` (fronttables) and `EditableDataTable` have no
page-sticky support; `TableCard` is `overflow-hidden`, so lists must not use it.

## Follow-ups found on the way

- **Considered, deferred (2026-09-30): infinite scroll instead of pagination.** Feasible
  with page-mode tables (a sentinel under the last row, `useInfiniteQuery`, prefetch a
  screen ahead), but it costs page jumps and shareable positions, needs scroll
  restoration on back-navigation, a clear "select all" meaning, virtualization past
  ~500 rows, and cursor paging to avoid duplicate rows. If revisited: try one list first,
  or a "Load more" button.

- **Seed translations**: services 7e312af fixes 11 stored values that still carried
  glyphs or em dashes and adds 7 new keys. Needs the POST to `/v1/translations` (admin
  token) on staging, and again on prod when promoting.
- **ui2 DataTable**: has no `onRowClick` or `loading`. Client-side lists that need row
  click use `ServerDataTable` holding the whole list as one page (frontai History,
  frontcontracts ContractList, frontreports Annual/VAT lists, frontsettings lists,
  frontledger DimensionType/Period lists). Add both props, then switch them back.
- **ui2 TablePage**: the "Clear" button and pagination text ("Page x of y", "total",
  Previous/Next) are hard-coded English. Accept labels or a translate function.
- **ui2 EditableGrid / EditableDataTable**: no page-sticky support (fronttables).
- **Lists still on TableCard** (inline-edit CRUD, kept on purpose): frontsettings bank,
  location and project types, API keys, MCP keys; frontcrm admin pages; the Series lists
  in frontinvoices, frontpurchase, frontpayments, frontcontracts; frontledger's fiscal
  year and quarter editors.
- **Unsaved-changes guards** (doc 17 §3) need a data router; only frontinvoices,
  frontpurchase and frontsupport have one.
- **frontsupport** was left out (no app-shell). Its 5 DataTable lists can take
  `stickyHeader="page"` after it bumps ui2 from v7.6.4.
- **Discovery menu**: frontlogin's Overview row points at `/app/manage-organization/list`,
  so the portal landing page shows no section in the bar.
- **Design calls to confirm on staging**: frontcrm ContactNew grows from sm to xl
  (no inner caps allowed); page actions moved to the bar are `size="sm"`.
- **Stale AGENTS.md branch notes** (`feat/trf-ui2-adoption`) in frontproducts, frontitems,
  frontcontracts, frontai, frontaudit.
- **Em dashes left on purpose**: the `—` empty-cell placeholder (ui2's convention) and
  `code — name` select labels in frontledger.
- **About 100 keys from other features** have no entry in services/translations.json
  (for example `<trn-fx-revaluation-*>`, `<trn-hr-*>`); not part of this rollout.

- app-shell: the active section is the first menu leaf whose path equals or prefixes the
  URL, not the most specific one. On `/app/settings/approvals` the bar names "Purchase
  settings" and the sidebar highlights both it and "Approval flow". Longest-match would
  fix it, but pages relying on today's behaviour (ApprovalFlowPage adds its own crumb)
  would then double their crumb. Tom's call.
- frontinvoices/frontpurchase: `<trn-add-row>` defaults no longer carry "+", but
  translations already stored for that key may still contain it.
- frontpayments: StatementList keeps a "Review" link column instead of row click; the
  statement progress bar stays in the page (a visual the meta pill would lose).
- frontpurchase: ApprovalFlowPage has no unsaved-changes guard (doc 17 §3).

## Log

- 2026-09-29: audit done. ui2 v7.11.0 and app-shell v0.39.0 released. All 13 shell apps
  bumped, ready lists opted in, pushed to staging. Phase 4 done for frontinvoices,
  frontpurchase, frontpayments (on staging); the other 11 repos in progress.
- 2026-09-29: phase 4 done in all 13 shell apps, each built, committed and deployed to
  staging. Translation fixes committed in services. Prod waits for sign-off.
- 2026-09-29: ui2 v7.12.0 (RecordHeader) released; the 8 record pages in 7 apps show their
  title again and are on staging. `<trn-dates>` added to services (f3fc5ca), needs seeding.
- 2026-09-29: ui2 v7.13.0 adds `--table-head` (black 2.5% light, 25% dark), the band behind
  every table's column headers. All 15 apps bumped and on staging, frontsupport included
  (its first bump since v7.6.4; staging sits behind auth, so verified by build and deploy).
