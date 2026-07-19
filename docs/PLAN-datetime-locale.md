# PLAN: suite-wide locale-aware date/time formatting

> Status: built July 16 2026, pending release + rollout. Owner: Jaak.

## What exists now

- `src/lib/datetime.ts`: shared formatters (`formatDate` `25.06.2026` locale-numeric,
  `formatTime` 24h, `formatDateTime`, `formatMonth`) + suite locale state
  (`setDateTimeLocale`, `useDateTimeLocale`, `dateTimeLocaleFromToken`). Doc:
  `08-ui-components/datetime.md`.
- `DateCell`, `DatePicker`, `DateTimePicker`, `MonthPicker` use the shared formatters and
  re-render on locale change.
- Auto-wiring: `renewToken.ts` sets the locale from every org token it caches, so apps on
  `installAuthInterceptors` / `getOrgToken` / `useRenewingOrgToken` need zero setup.
- backlogin (separate repo): JWT `a.l` locale claim minted at login and refreshed from the
  DB at org-token mint and renew. Locale source: account Language in frontlogin
  AccountSettings (existing). Fallback when `a.l` empty: org country claim `o.c`.
- frontinvoices (pilot): built and typechecked July 16, then REVERTED July 19 to keep the
  tree clean for parallel invoice work (the edits need the unreleased ui2 exports).
  Re-apply at bump time: `src/utils/date.ts` → replace local formatDate/formatDateTime
  with `export { formatDate, formatDateTime } from '@trf/ui2'` (keep isoToDate/dateToIso);
  `src/components/DeliveryPanel.tsx` → `fmtDate` uses shared `formatDateTime(iso) || '—'`.

## Remaining rollout (after ui2 release + per-repo bump)

Replace hand-rolled date rendering with `DateCell` / shared formatters:

- frontledger: `TurnoverReport.tsx:24`, `JournalReport.tsx:25` (hardcoded en-GB),
  `EntryDetail.tsx:258`
- frontsettings: `api-keys/APIKeyList.tsx:15`, `mcp-keys/MCPKeyList.tsx:66`,
  `einvoice/EInvoice.tsx:16`
- frontreports: `AnnualReportList.tsx:124`, `VatReportList.tsx:133`,
  `AnnualReportDetail.tsx:165`, `VatReportDetail.tsx:284`
- frontcrm: `Pipeline.tsx:51`, `ContactDetail.tsx:24,569,671`, `TaskList.tsx:51`,
  `Dashboard.tsx:181`
- frontai: `HistoryPage.tsx:77`, `settings/SettingsPage.tsx:418,494`

(line numbers as of July 2026 survey; re-grep `toLocale` before editing)

## Open items

- Calendar popover internals (react-day-picker month/weekday headings) still render in
  English; needs a date-fns locale object if we care. Parked.
- backlogin deploy must precede relying on `a.l`; until then the org-country fallback
  covers Estonian orgs.
