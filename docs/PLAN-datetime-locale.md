# PLAN: suite-wide locale-aware date/time formatting

> Status as of July 21 2026: shipped in ui2 v7.0.35 (staging + consumed by tag), backlogin
> claim on staging (v7.0.16), rollout partially propagated by unrelated bumps. Owner: Jaak.

## Shipped

- ui2 v7.0.35 (July 19): `src/lib/datetime.ts` shared formatters (`formatDate`
  `25.06.2026` locale-numeric, `formatTime` 24h, `formatDateTime`, `formatMonth`) + suite
  locale state (`setDateTimeLocale`, `useDateTimeLocale`, `dateTimeLocaleFromToken`).
  DateCell + all pickers use them and re-render on locale change. Auto-wiring in
  `renewToken.ts`: every cached org token sets the locale, zero app setup. Doc:
  `08-ui-components/datetime.md`.
- backlogin v7.0.16 (July 19, staging): JWT `a.l` locale claim minted at login, refreshed
  from DB at org-token mint and renew. Source: account Language (frontlogin
  AccountSettings). Fallback: org country claim `o.c`. NOT yet promoted to prod
  (main is ahead of trivis; prod tokens have no `a.l` until promoted).

## Rollout state per app (July 21, evening)

| app | ui2 pin | status |
| --- | --- | --- |
| frontinvoices | v7.0.45 | DONE: pilot re-applied (v7.0.80 staging + promoted to prod) |
| backlogin | n/a | DONE: a.l claim in PROD (trivis-build green) |
| frontledger | v7.0.45 | DONE on staging (v7.0.16): en-GB reports + EntryDetail migrated; prod pending verify |
| frontcrm | v7.0.45 | DONE on staging (v7.0.17): 5 pages migrated; prod pending verify |
| frontreports | v7.0.45 | DONE on staging (v7.0.11): 4 report pages migrated; prod pending verify |
| frontpurchase | v7.0.37 | engine active via bump, no known hand-rolled sites |
| frontai | v7.0.45 | DONE on staging (v7.8.21): GeneralSection + HistoryPage migrated; prod pending verify |
| frontsettings | v7.0.16 | WAITING for user go-ahead (ongoing work); sites: `api-keys/APIKeyList.tsx:15`, `mcp-keys/MCPKeyList.tsx:66`, `einvoice/EInvoice.tsx:16` |
| frontlogin | v7.0.16 | not migrated; hosts the Language selector |

## Next steps

1. User verifies frontledger/frontcrm/frontreports on trf.is, then promote each to prod.
2. frontai + frontsettings after their in-flight work lands (coordinate first).
3. frontlogin: bump + survey call sites when convenient.
4. ui2 main → trivis promotion only affects the kitchen-sink demo site; low priority.

## Open items

- Calendar popover internals (react-day-picker month/weekday headings) still render in
  English; needs a date-fns locale object if we care. Parked.
