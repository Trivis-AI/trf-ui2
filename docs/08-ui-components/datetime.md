# Date/time formatting (`lib/datetime`)

> **Status: ready**

The single source of truth for how the TRF suite renders dates and times. Never hand-roll
`toLocaleDateString(...)` / `new Intl.DateTimeFormat(...)` in app code; use these formatters,
or the components built on them (`DateCell`, `DatePicker`, `DateTimePicker`, `MonthPicker`).

## The format

- Dates: fully numeric in the locale's own order and punctuation: `25.06.2026` (et-EE),
  `25/06/2026` (en-GB). Compact and scannable in accounting tables; month names would bloat
  columns (et-EE "medium" would spell out `25. juuni 2026`).
- Times: always 24h `HH:mm`, regardless of locale (finance-suite convention).
- Datetimes: `formatDate + ", " + formatTime`: `25.06.2026, 14:30`.

## Locale resolution

The locale is suite-wide module state. **Apps on the standard auth plumbing get it for
free**: every org token that passes through `getOrgToken` / `useRenewingOrgToken` /
`installAuthInterceptors` (the renewToken cache) sets the locale automatically. Manual
wiring is only needed outside that path:

```ts
import { setDateTimeLocale, dateTimeLocaleFromToken } from "@trf/ui2";

setDateTimeLocale(dateTimeLocaleFromToken(token));
```

`dateTimeLocaleFromToken` resolves: account language claim (`a.l`, the Language picked in
account settings) → org country claim (`o.c`) → `undefined` (browser default). Short codes
map to full tags (`et` → `et-EE`, `en` → `en-GB`, `lv` → `lv-LV`, `lt` → `lt-LT`).

Call `setDateTimeLocale` again whenever the token (re)arrives: the mint is async, and every
DateCell/picker subscribes via `useDateTimeLocale()` so it re-formats live.

## API

| Export | What it does |
| --- | --- |
| `setDateTimeLocale(locale?)` | Set the suite locale (`undefined` = browser default). |
| `getDateTimeLocale()` | Current locale, or `undefined`. |
| `useDateTimeLocale()` | React subscription to the locale (re-render on change). |
| `dateTimeLocaleFromToken(token?)` | Resolve locale from a TRF JWT. Never throws. |
| `toDate(value)` | Parse `Date`/epoch/ISO string; `YYYY-MM-DD` parses as LOCAL (no day shift). |
| `formatDate(value)` | `25.06.2026` (locale-numeric). `""` when missing/unparseable. |
| `formatTime(value)` | `14:30` (24h). |
| `formatDateTime(value)` | `25.06.2026, 14:30`. |
| `formatMonth(value)` | `June 2026` (locale month name), for period labels. |

## Rules

- App code passes raw values (ISO strings, `Date`s) to `DateCell` and friends; only call the
  plain formatters where a component can't go (document titles, CSV export, toasts).
- Don't pass a hardcoded locale anywhere. The user's account language decides.
- Plain formatter calls don't subscribe: they read the locale at call time. Fine anywhere
  that runs after startup; inside React render paths pair them with `useDateTimeLocale()`.
