# Date/time formatting (`lib/datetime`)

> **Status: ready**

The single source of truth for how the TRF suite renders dates and times. Never hand-roll
`toLocaleDateString(...)` / `new Intl.DateTimeFormat(...)` in app code; use these formatters,
or the components built on them (`DateCell`, `DatePicker`, `DateTimePicker`, `MonthPicker`).

## The format

- Dates: fully numeric in the locale's own order and punctuation: `25.06.2026` (et-EE),
  `25/06/2026` (en-GB). Compact and scannable in accounting tables; month names would bloat
  columns (et-EE "medium" would spell out `25. juuni 2026`).
- Times: 24h `HH:mm` by default (finance-suite convention); `12h` is a per-account opt-in.
- Datetimes: `formatDate + ", " + formatTime`: `25.06.2026, 14:30`.
- Explicit overrides: an account can pick a fixed date preset (`DD.MM.YYYY`, `DD/MM/YYYY`,
  `YYYY-MM-DD`, `MMM D, YYYY`) and time preset (`24h`/`12h`) in account settings; these win
  over the locale default and travel in the JWT (`a.df`, `a.tf`).

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
| `setDateTimePrefs({locale?, dateFormat?, timeFormat?})` | Set all display prefs at once. |
| `getDateTimePrefs()` / `useDateTimePrefs()` | Read / subscribe to all prefs. |
| `dateTimePrefsFromToken(token?)` | Resolve locale + format overrides from a TRF JWT. Never throws. |
| `DATE_FORMAT_PRESETS` / `TIME_FORMAT_PRESETS` | The valid preset lists (for settings UIs). |
| `setDateTimeLocale(locale?)` | Locale-only setter (kept for compat; prefer setDateTimePrefs). |
| `getDateTimeLocale()` / `useDateTimeLocale()` | Locale-only read / subscription. |
| `dateTimeLocaleFromToken(token?)` | Locale-only token resolve (kept for compat). |
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
