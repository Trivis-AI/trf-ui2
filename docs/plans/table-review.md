# Table review: changes log

Started 2026-10-01 from Toomas's review of every list page. The review sheet ("TRF table
review", jaak@trivis.ee Drive) holds his comment, the component each page uses today, the
expected row count and the decision per page. This file records what was actually changed,
batch by batch, so Tom can see it in one place. Item numbers are the sheet's row numbers.

Status: **local** (built and typechecked, waiting for Jaak's local check), **committed**,
**staging**, **prod**.

## Batch 1: items 1 to 10

| # | Page | Change | Repo and files | Status |
|---|---|---|---|---|
| 1, 2 | Invoice and purchase series | None (keep) | | |
| 3 | Payments list | 50 rows per page instead of 20 (every other list pages by 50). Backend: `GET /v1/payments` serves at most 200 rows per request; before, any `limit` was accepted. All known callers ask for 200 or less | frontpayments `PaymentList.tsx`; backpayments `internal/api/router.go` (`paymentsLimit`), test `payments_limit_test.go` | local |
| 4 | Products | None (already the full server table) | | |
| 5 | Chart of accounts | Search on code or name, Type filter with a filter mark, both in the URL. Filtered in the browser (a few hundred rows) | frontledger `AccountList.tsx` | local |
| 6 | Periods | Tabs: Periods, Fiscal Years, Quarters (tab in the URL). Year filter on the Periods tab, by start date, with a filter mark; hint text on the same row. Period actions only on the Periods tab. Now a full-width list page (`TablePage`), no longer the centered `Page size="xl"` | frontledger `PeriodList.tsx`, `main.tsx` | local |
| 7 | Ledger entries | None (filter marks shipped in ui2 v7.14.0) | | |
| 8, 9 | Currencies, mappings | None (keep) | | |
| 10 | Tax rates | Domain and Behaviour filters with filter marks, in the URL | frontledger `TaxRateList.tsx` | local |

New translation keys (services `translations.json`, need seeding): `<trn-all-domains>`,
`<trn-all-behaviors>`, `<trn-all-years>`.

## Batch 2: items 11 to 20

| # | Page | Change | Repo and files | Status |
|---|---|---|---|---|
| 11 | Dimension type edit | Values table untouched (decision). The form above it: Code, Name and Type on one row, Description full width, "Applies to" as one row of checkboxes (labels now translated), Active as a switch under Status. Save stays on the page (values are managed here too) and is enabled only when something changed; Delete follows write permission. Type hint reworded without the em dash | frontledger `DimensionTypeEdit.tsx` | local |
| 12 | Units | None (keep) | | |
| 13 | Journal | Backend: the report query now COALESCEs `description` like `reference`; a NULL description in any posted entry failed the row scan and the whole report (likely the Trivial Trivis failure). Frontend: a failure stays on the page as an error panel with the server's reason, instead of a toast that vanished | backledger `internal/store/store.go`; frontledger `JournalReport.tsx` | local |
| 14 | Journal, turnover sheet, dimensions and person reports | Print, Open PDF and Download PDF in the shell bar once a report is shown. PDFs render through docrender, as frontreports' statements do; Print prints the same document from a hidden frame, so the printout has no sidebar or shell bar. Journal and turnover print landscape | frontledger `hooks/useReportActions.tsx`, `utils/reportPdf.ts`, `utils/download.ts`, `services/docrenderService.ts` (copied from frontreports), the three report pages, `vite.config.ts` (local docrender proxy) | local |
| 15, 16 | Dimensions and person reports (design) | None: waits for Iris and Raavo | | |
| 17 | EE annual report detail | Print, Open PDF, Download PDF beside Download XBRL: one PDF of the whole report (overview, validation errors and warnings, every section with line, tag, current, prior). Print prints that document from a hidden frame. The lone badge in the meta pill was the raw validation status ("validated"/"failed"); it now reads "Validation passed"/"Validation failed". Section tables moved from a hand-built `Card` + `CardHeader` to ui2 `TableCard`, so each title sits in the card's slim header strip as ui2 specifies. The Overview card is split: identity (title with the fiscal year, period, entity type, taxonomy, generated) in a `RecordHeader` with the validation badge beside the title, so the shell bar's meta pill no longer holds a lone badge; the four totals as `StatTile`s. A pass with warnings now shows as an amber "Passed with warnings" (badge and PDF). Year on year: each tile shows the prior year under its value ("2024: 5,461,248 (+8%)") and a compact grouped column chart (a two-column tile in the same row as the four figure tiles, short axis names, full names in the tooltip, legend beside the title) compares the four figures, this year against last (ui2 `ChartContainer` on Recharts; one hue in two shades, as `--chart-1` and `--chart-2` are too alike to tell apart). Prior totals are rebuilt from the lines the way backreports builds the current ones, and a figure is shown only when that rebuild reproduces the stored current total (prior equity also only when last year balances). The PDF has no chart. Note: only `validated` and `failed` ever occur; `draft` and `generated` are defined but never set, and nothing records filing. The double-highlighted menu item is not touched (shell, Tom's call) | frontreports `AnnualReportDetail.tsx`, `components/YearOnYearChart.tsx` (new), `utils/annualFigures.ts` (new), `package.json` (`recharts` ^3.9.1, ui2's range), `utils/annualReportPdf.ts` (new), `utils/printHtml.ts` (new), `utils/statementPdf.ts` (shares its escaping and print styles; statement PDFs unchanged) | local |
| 18 | VAT reports (KMD) | Period filter: Last 3, 6, 12 months, This year, with a filter mark, in the URL. A report counts when its period starts inside the window; "last N months" is the N months before this one plus this one, so in November "Last 3 months" shows August to October | frontreports `VatReportList.tsx` | local |
| 19 | Contacts | Checked: search resets to page 1, the count and the rows use the same filter, page numbering matches. Found and fixed in backcrm: the ORDER BY had no unique last key, so contacts tying on the sort column (no email, same name) could repeat on one page and vanish from another | backcrm `internal/store/store.go` (`, id ASC` on every contacts sort); frontcrm `ContactList.tsx` (search box 320px instead of 256px so the placeholder fits) | local |
| 20 | Interactions | Card feed replaced by a table with type tabs (All, Call, Meeting, Email, Note, Internal) and, under them, a title/notes search, both in the URL, served by the backend's type filter and paging. Notes show up to two lines, the whole note on hover (no expanding row: it only repeated the row). Log interaction stays in the shell bar; a linked interaction (`/interactions/:n`) is highlighted or pinned as before. Full width now. Also fixed: the log form's default time was UTC, the archive confirm said "Archive this deal?", type labels were hard-coded English. backcrm: interactions order by `occurred_at DESC, id DESC` so paging is stable | frontcrm `InteractionList.tsx`, `main.tsx`; backcrm `internal/store/store.go` | local |

New translation keys: `<trn-failed-to-load-journal-report>` (was used, never seeded),
`<trn-report-failed-hint>`, `<trn-no-details>`, `<trn-open-pdf>`, `<trn-journal>`,
`<trn-turnover-sheet>`, `<trn-dimensions-report>`, `<trn-person-report>`,
`<trn-insufficient-permissions>`, `<trn-unassigned>`, `<trn-dimension>`, `<trn-journal-line>`,
`<trn-sales-invoice-row>`, `<trn-purchase-invoice-row>`, `<trn-dim-type-placeholder>`.
Items 17 to 20: `<trn-last-3-months>`, `<trn-last-6-months>`, `<trn-last-12-months>`,
`<trn-this-year>`, `<trn-all-periods>`, `<trn-validation-passed>`, `<trn-validation-passed-with-warnings>`, `<trn-year-on-year>`, `<trn-assets>`, `<trn-liabilities>`, `<trn-equity>`, `<trn-profit>`, `<trn-all>`,
`<trn-interaction-type-call|meeting|note|internal>`, `<trn-source>`, `<trn-source-manual>`,
`<trn-search-title-notes>`, `<trn-archive-interaction-confirm>`; and keys already used but never
seeded: `<trn-validation-errors>`, `<trn-validation-warnings>`, `<trn-section-bs-equity>`,
`<trn-section-employee>`, `<trn-failed-to-archive>`, `<trn-interaction-not-found>`.
Changed: `<trn-dim-type-hint>` (em dash removed, both languages), `<trn-print>` (its English
value was the Estonian "Prindi"), `<trn-section-bs-assets>` and `<trn-section-bs-liabilities>`
(em dashes), `<trn-net-profit>` Estonian typo "Pukaskasum", `<trn-report-detail>` Estonian
"Aastaruport" to "Majandusaasta aruanne".

## Batch 3: items 21 to 30

| # | Page | Change | Repo and files | Status |
|---|---|---|---|---|
| 21 | CRM pipeline | Left-aligned (decision); no page code: the ui2 `Page` change does it | trf-ui2 (see the design system change below) | local |
| 23 | Contracts | Server paging and sorting. backcontracts `GET /v1/contracts`: `page`, `limit` (default 50, max 200), `sort` (allow-list: number, title, type, counterparty, status, effective date, created), `dir`; every order ends with `id` so pages never repeat or skip a row; empty values last; search and filters apply to count and rows alike. `{items,total,page,limit}` when `page` or `limit` is sent, the old bare array otherwise (backlogin's contract console keeps it). ContractList pages by 50 with sortable columns, and falls back to one page against the old API. Tests: paging params, order clause, and a DSN-gated Postgres test (fails without the tiebreaker). No migration | backcontracts `internal/api/handlers.go`, `internal/store/store.go`, `internal/model/model.go`, tests `internal/api/list_contracts_test.go`, `internal/store/contracts_list_test.go`; frontcontracts `ContractList.tsx`, `services/contractService.ts`, `types/contractTypes.ts` | local (paging live after the backcontracts deploy) |
| 22 | CRM new businesses | The paid lead list of newly registered companies. Split into a report history (`/new-businesses`, server-paged: one row per generation, unbounded) and a report page (`/new-businesses/:id`, its up to 2000 stored companies paged, sorted and searched in the browser over the one fetch the PDF needs anyway). Generate report and Download PDF in the shell bar, Beta badge and data date in the meta pill, the intro and generate form in one dialog (Generate also needs write permission now), registry code as the external link, legal form shown on screen. backcrm `GET /v1/new-business-reports`: `{items,total,page,limit}` when `page` is sent, the old array otherwise; ordered `created_at DESC, id DESC`. 33 keys the page already used were never seeded; added with the new one | frontcrm `new-businesses/NewBusinesses.tsx`, `NewBusinessReport.tsx` (new), `GenerateReportDialog.tsx` (new), `shared.tsx` (new), `services/crmService.ts`, `types/crmTypes.ts`, `main.tsx`; backcrm `internal/api/newbusiness.go`, `internal/store/store.go`, `internal/service/service.go`, test `internal/api/newbusiness_test.go` | local (history paging live after the backcrm deploy) |
| 24, 25 | Contract series, items | None (keep / already the full server table) | | |
| 26 | Run depreciation | The period dropdown is now a table of open periods, newest first (name, start, end, status) with a year filter and a Run button per row; the confirm dialog and the results table stay (results below, paged at 50). "Depreciation" column: Done with date, assets and amount, and how many entries never reached the ledger; "Not run" otherwise. backitems: new `GET /v1/depreciation/periods` (GROUP BY over `depreciation_entries`, no schema change). Limits: a run that skipped every asset writes no rows, so it still reads "Not run" (needs a runs table and a fleet migrate); a failed ledger posting is never retried (the column now shows it). `<trn-confirm-run-depreciation>` had "2026" hardcoded; replaced by a `{name}` key | backitems `internal/api/handlers.go`, `internal/store/lists.go` (new), `internal/store/store.go`, `internal/service/service.go`, `internal/model/model.go`; frontitems `depreciation/RunDepreciation.tsx` | local ("Depreciation" column after the backitems deploy) |
| 27 | Pending fixed assets | A server-paged table instead of one card per draft (name, supplier, acquisition date, cost, asset account, created); row click opens the full review form with Dismiss; selection bar with bulk Confirm (one set of depreciation details applied to all, each keeping its own name, cost, date and account; 4 at a time with progress and per-draft errors, failures stay selected) and bulk Dismiss. backitems `GET /v1/fixed-assets/pending`: `page`, `limit`, `sort`, `dir`, envelope only with `page` | backitems as above; frontitems `fixed-assets/PendingFixedAssets.tsx`, `utils/sortRows.ts` (new) | local (server paging after deploy) |
| 28 | Fixed asset register | TablePage + server-paged table, every column sortable, row click opens the item, "Check against general ledger" in the shell bar. backitems: the register is one SQL query (accumulated depreciation and net book value in the database) with paging and sorting; without `page` it returns the whole register as before, and an integration test proves it identical to the old Go computation | backitems as above, tests `internal/store/lists_test.go`, `lists_integration_test.go` (DSN-gated), `internal/api/paging_test.go`, `internal/service/service_test.go`; frontitems `reports/FixedAssetRegister.tsx`, `services/itemsService.ts`, `types/itemsTypes.ts`, `main.tsx` | local (server paging after deploy) |
| 29 | Tables: a table's records | A standard list page: TablePage + server-paged table with page-sticky header, columns from the table's fields, name in the crumb, description and count kept. Text, number and yes/no cells edit inline; a row click opens the whole record in a dialog (dates are edited there until ui2 gets an inline date editor); New record and a Columns dialog (add/remove columns, same confirmation) in the shell bar; records deleted from the selection bar with a confirmation (several at once; before, one at a time with no confirmation); no edit controls without write permission. backtables: optional `sort` (a column of the table, or created), `dir`, `search` (escaped, current columns only, same filter on the count), echoed back so the page shows sortable headers and search only once the backend has them; every order ends on `id`; numbers and dates sort by value, blanks last. The page's `RecordHeader` (added on 2026-09-29) is gone, since lists have no title under doc 17 (confirmed by Jaak 2026-10-01) | fronttables `TableDetailPage.tsx`, `TableColumnsDialog.tsx` (new), `utils/cellValues.ts` (new), `services/tablesService.ts`, `types/tableTypes.ts`, `main.tsx`, `AGENTS.md`; backtables `internal/api/handlers.go`, `internal/api/records_query.go` (new), `internal/store/store.go`, `internal/store/records_query.go` (new), tests (`records_query_test.go` x2, `records_query_db_test.go`, DSN-gated), `PLAN.md` | local (sort and search after the backtables deploy) |
| 30 | Personnel | Sorting on every column and Status and Relationship filters with filter marks, all in the URL; search stays on the server. Filtered and sorted in the browser over the loaded list (decision: backend paging once an org has hundreds of employees) | frontsettings `hr/PersonnelList.tsx` | local |

New translation keys: `<trn-all-relationships>`, 24 tables keys (`<trn-new-record>`, `<trn-columns>`, the column and record dialog texts), 22 depreciation and fixed-asset keys (`<trn-depreciation>`, `<trn-run>`, `<trn-not-run>`, the bulk confirm and dismiss texts, `<trn-confirm-run-depreciation-period>`), `<trn-search-name-code-address>`, and 33 new-businesses keys that were used but never seeded (`<trn-new-businesses>`, the intro, cost and top-up texts, column labels, period presets).

## Batch 4: items 31 to 44

| # | Page | Change | Repo and files | Status |
|---|---|---|---|---|
| 31 | HR absences | backhr already paged `GET /v1/absences` (50, max 200) and filtered by date overlap on count and rows; the page just never used it, so it showed only the newest 50 absences with no way past them. Now: real server paging with the footer, sorting (backhr: `sort`/`dir` on an allow-list, every order ending in `id`, the applied order echoed back), From/To date filter with a filter mark, status and type filters as labelled fields, all in the URL. Against today's staging backhr the headers stay plain (it ignores `sort`); they become sortable by themselves after the deploy. backai's `list_absences` keeps working (page 1 of 50, newest first). Tests: param parsing, order clause, and a DryRun check that every filter reaches both the count and the rows | backhr `internal/api/handlers.go`, `internal/store/store.go`, `internal/model/model.go`, tests `internal/api/absences_test.go`, `internal/store/absences_test.go`; frontsettings `hr/AbsenceList.tsx`, `services/hrService.ts`, `types/hrTypes.ts` | local (sorting live after the backhr deploy) |
| 32 | Settings: employees (legacy) | None: "do not touch" (decision) | | |
| 33 to 41, 43, 44 | Locations, location types, projects, project types, banks, bank types, CRM task statuses, categories, webhooks, API keys, MCP keys | None (keep) | | |
| 42 | AI approvals | Approvals is its own page under Oto AI (`/app/approvals`) with a menu entry, instead of a tab in AI settings. Pointing the menu at `settings?tab=approvals` would not work: the shell drops the query on in-app navigation and matches by path only, so "AI settings" and "Approvals" would both light up. Old `?tab=approvals` links (backai's MCP links among them) redirect to the new page. No pending count: the shell has no badge support on menu items | frontai `pages/approvals/ApprovalsPage.tsx` (new), `main.tsx`, `settings/SettingsPage.tsx`; services `internal/service/service.go` (owner and member menus; audit copies owner) | local |

## Design system change: pages no longer centered

Decided by Jaak 2026-10-01: pages are left-aligned, not centered. ui2 `Page` and `TablePage`
drop `mx-auto`; the width caps (`size`) stay, so a capped page now stops at its width from the
left edge, the same edge as the shell bar and the lists. Docs (`08-ui-components/layout.md`) and
the kitchen-sink section frame follow. Every app picks it up from the next ui2 release and pin
bump; no app code changes. List pages look the same (their `TablePage` is full width already).

| Change | Repo and files | Status |
|---|---|---|
| `Page` and `TablePage` without `mx-auto` | trf-ui2 `src/components/page.tsx`, `src/components/table/table-page.tsx`, `docs/08-ui-components/layout.md`, `demo/src/App.tsx` | local (previewed by patching each app's installed 7.15.0 copy; needs a ui2 release and bumps) |

## Design system change: the Default theme

Decided by Jaak 2026-10-01: a new theme, **Default** (`theme-default`), the localhost default.
It is Trivis with three changes: the sidebar takes the page's tint and the page the sidebar's
white (dark: likewise swapped), input fields share the sidebar's tint, and `--radius` is 6px
instead of 4px. Two new tokens make it possible without touching the other themes: `--sidebar`
(the rail, defaults to `--card`) and `--field` (inside every input surface, defaults to
`--background`). Cards keep `--card`.

| Change | Repo and files | Status |
|---|---|---|
| Tokens `--sidebar`, `--field` (+ Tailwind `bg-sidebar`, `bg-field`); `.theme-default` and `.theme-default.dark` | trf-ui2 `src/styles/tokens.css` | local |
| Sidebar rail on `bg-sidebar`; `Input`, `Textarea`, select trigger, `Combobox`, `AsyncCombobox`, `DatePicker`, `DateTimePicker`, `MonthPicker`, `MarkdownEditor` on `bg-field` (quiet inputs on hover/focus too) | trf-ui2 `src/components/...` | local |
| Default in the kitchen-sink theme picker, opening on it on localhost | trf-ui2 `demo/src/App.tsx` | local |
| Default in the shell's palette picker; localhost switches to it once (cookie marker `trf-palette-default-v1`, shared across the localhost ports), any pick after that stands | trf-app-shell `src/AppShellLayout.tsx` | local |
| Docs: tokens table, `sidebar`/`field`, the Default theme | trf-ui2 `docs/03-design-tokens.md` | local |

Rollout: ui2 release, app-shell release (it needs the ui2 tokens), then both pins bumped in
every app. Previewed locally by patching each app's installed copies.

## Bugs fixed outside the review

| Page | Bug and fix | Repo and files | Status |
|---|---|---|---|
| CRM contact detail | Two scrollbars, and the sidebar scrolled out of view. Radix renders a hidden native `<select>` (position absolute, no inset) for every select inside a `<form>`; with no positioned ancestor up to the root, the five below-the-fold ones on this page were laid out against the viewport, so the document itself grew taller than the screen. Fix: the page root is `relative`. Shared fix proposed below | frontcrm `ContactDetail.tsx` | local |

## Found on the way

- ui2 `useTableQuery` rewrites the whole query string with only its own keys, so it drops
  any other parameter such as `?tab=`. PeriodList keeps its tab and year in the URL with
  `useSearchParams` instead. Fix in ui2 before another tabbed list needs filters.
- The five ledger `DataTable` lists (accounts, currencies, mappings, tax rates, units) cannot
  sort by header: their columns have no `accessorKey`/`accessorFn`, so TanStack has nothing
  to sort on.
- frontreports' Balance sheet and Income statement print with `window.print()`, which prints
  the sidebar and shell bar too (no print stylesheet anywhere). frontledger's reports print
  the PDF document from a hidden frame instead (`printHtml` in `utils/reportPdf.ts`).
- The report PDF client (docrender service, download helpers, the hook) now exists in
  frontreports, frontledger and partly frontcrm. A shared home in ui2 would end the copies.
- docrender allows any origin, so PDFs render from localhost without a Vite proxy.
- backcrm interactions list (`GET /v1/interactions`) returns a bare array with no total, so the
  table probes one row ahead and reads "Page N of N+1" until the last page. Proposed: count with
  the same filters and return `{items,total,page,limit}` when `page` is passed, keeping the bare
  array for skip-based callers (backai tools, the contact page). Its search uses ILIKE, which on
  this C-collated database folds only ASCII case ("õ" does not find "Õ"); contacts already moved
  to `lower(... COLLATE "und-x-icu") LIKE`.
- Same UTC default-time bug as interactions in frontcrm `ContactDetail.tsx` (the contact page's
  log form). `TaskList.tsx` uses `<trn-archive-confirm>`, whose text is "Archive this deal?".
- ui2 table footer ("Page X of Y", "total") is hard-coded English.
- ui2 `SidebarInset` (`sidebar.tsx:452`) is the one scroll container but not `relative`, so any
  absolutely positioned element inside it (Radix's hidden form inputs above all) is placed
  against the viewport and can make the document scroll, taking the sidebar with it. Adding
  `relative` there fixes it in every app; until then a long form with a select, checkbox or
  switch far down a page can bring the bug back. frontcrm forms with the same latent setup:
  WebhookAdmin, StatusAdmin, Pipeline's new-deal form, TaskList's create form, InteractionList's
  log form (all near the top of their pages, so only on very short screens).
- ui2 `ChartContainer`: its selector for axis-label colour no longer matches Recharts 3, so axis
  labels fall back to a fixed #666 that ignores the theme. The annual report chart sets the
  muted colour itself; other ui2 charts (frontai) are likely affected. `--chart-1` and
  `--chart-2` fail the dataviz contrast check against each other (blue vs cyan).
- After the backcontracts deploy, documentation `DATA-MAP.md` (Contract: "no pagination") and
  `CONVENTIONS.md` section 4 (backcontracts as a bare array) are stale; `make refresh` and an edit.
- Contract search does not match counterparty names, so platform contracts (one shared title)
  cannot be found by client name; backinvoices' `OR customer_snapshot->>'legal_name' ILIKE ?` is
  the fix.
- frontitems ItemList: sortable columns set `enableSorting` without an accessor, so TanStack may
  treat them as not sortable (same issue as the five ledger DataTable lists). Unverified.
- backhr was not cloned in the workspace; cloned to `/Users/jaakparik/Coding/backhr` for item 31.
  None of its frontend's `<trn-hr-*>` keys are seeded, so the HR pages show English labels.

- The local `/Users/jaakparik/Coding/trflib` checkout is 2 commits behind and lacks symbols
  backitems needs (go.mod wants v1.42.0); pull it before local Go builds.
- After the backitems deploy: `documentation/DATA-MAP.md` (register "no paging") and the
  generated route list are stale; `make refresh`.

- backai `create_table_record` / `update_table_record` send `values` as a map of column id to
  value, but backtables expects an array of `{column_id, string_value, data_type}`: those MCP calls
  should be failing with 400 "invalid body". Not fixed.
- ui2 inline editors cover text, number, select and switch only; a `date` editor would let the
  Tables page edit dates inline (one-line change in the page after that).
