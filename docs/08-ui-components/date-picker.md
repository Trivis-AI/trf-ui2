# DatePicker (+ Calendar, MonthPicker, DateTimePicker)

> **Status: ready** · `import { DatePicker, MonthPicker, DateTimePicker, Calendar } from "@trf/ui2"`
> · source: `src/components/date-picker.tsx` (built on `Popover` + `Calendar`),
> `src/components/month-picker.tsx`, `src/components/date-time-picker.tsx`, and
> `src/components/ui/calendar.tsx` (`react-day-picker`, skinned with tokens)

A token-styled date picker — a `Button`-like trigger that opens a `Popover` with a month-grid
`Calendar`. The **on-system replacement for the native `<input type="date">`** when you want a
calendar that matches the design system (light + dark, Geist, rounded, Lucide chevrons) instead of
the unstyleable browser picker. Supports single dates and start–end ranges.

## When to use which

| | `<input type="date">` | `DatePicker` |
| --- | --- | --- |
| Calendar popup | browser-native (unstyleable, varies per OS) | our `Calendar`, fully themed |
| Range selection | no | yes (`mode="range"`) |
| Weight | zero JS | adds `react-day-picker` |
| Use when | a quick, low-stakes date field is fine | the picker should look on-system / needs a range |

## Usage

```tsx
import { DatePicker, type DateRange, Field } from "@trf/ui2";

// Single date
const [due, setDue] = useState<Date>();
<Field label="Due date" htmlFor="due">
  <DatePicker id="due" value={due} onChange={setDue} placeholder="Pick a date…" />
</Field>

// Range
const [period, setPeriod] = useState<DateRange>();
<Field label="Report period" htmlFor="period">
  <DatePicker mode="range" id="period" value={period} onChange={setPeriod} />
</Field>

// Clearable (optional/filter date — ✕ in the trigger resets to undefined)
<Field label="From" htmlFor="from">
  <DatePicker id="from" value={from} onChange={setFrom} clearable />
</Field>
```

### Props

| Prop | Type | Notes |
| --- | --- | --- |
| `mode?` | `"single"` \| `"range"` | Default `"single"`. |
| `value?` | `Date` (single) / `DateRange` (range) | Controlled selection. |
| `onChange?` | `(date \| undefined)` / `(range \| undefined)` | Fires on select. Single mode closes the popover. |
| `placeholder?` | `string` | Trigger text when empty. |
| `formatDate?` | `(date: Date) => string` | Trigger label formatter. Defaults to the shared locale-numeric date (`09.06.2026` for et-EE, see `datetime.md`). |
| `captionLayout?` | `"label"` \| `"dropdown"` \| `"dropdown-months"` \| `"dropdown-years"` | Header nav. Default `"label"` (month title + arrows). `"dropdown"` adds month **and** year dropdowns for fast jumping. |
| `startMonth?` / `endMonth?` | `Date` | Bound the year dropdown. Default ±10 years around now when a dropdown layout is used. |
| `disabledDates?` | `Matcher \| Matcher[]` | react-day-picker matcher for non-selectable dates (greyed out). E.g. `{ after: new Date() }` to forbid future dates. Distinct from the boolean `disabled` (which disables the whole trigger). |
| `keepDayOnNavigate?` | `boolean` | **Single mode, opt-in.** Carry the selected day to the new month when navigating, re-emitting it in one action (Jun 10 → pick April → Apr 10). See below. |
| `clearable?` | `boolean` | **Opt-in.** Show a clear (✕) button in the trigger when a value is set; clicking it resets the field to empty (emits `undefined`). For optional/filter dates where unsetting is valid. |
| `id` / `disabled` / `className` | | Trigger mirrors the Combobox / Select trigger styling. |

### Fast navigation (month + year dropdowns)

For dates far from today (birth dates, historical periods), enable dropdown navigation so users
don't click through months:

```tsx
<DatePicker
  value={date}
  onChange={setDate}
  captionLayout="dropdown"
  startMonth={new Date(1950, 0)}
  endMonth={new Date(2035, 11)}
/>
```

### Keep the day when switching month (`keepDayOnNavigate`)

For fields where the **day stays put but the month moves** — an invoicing/period start date that the
user re-bases to an earlier month — `keepDayOnNavigate` makes a month/year jump also move the
selection. With a date already selected, navigating to another month re-emits the **same day** in
that month, so it's a single action rather than "navigate, then click the day again". Pair it with
`captionLayout="dropdown"` so the jump itself is one click:

```tsx
// Today is 10 Jun. User opens the month dropdown and picks April → value becomes 10 Apr instantly.
<DatePicker
  value={periodStart}
  onChange={setPeriodStart}
  captionLayout="dropdown"
  keepDayOnNavigate
/>
```

- **Single mode only** (a range has no single "day" to keep) and **opt-in** — existing dropdown
  users are unaffected unless they set it.
- The day is **clamped** for shorter months (Jan 31 → Feb → Feb 28/29).
- If `disabledDates` excludes the target day, the auto-select is **skipped** — you still navigate,
  but pick a valid day yourself.
- With nothing selected yet, navigation behaves normally (pick a day to select).

`DateRange` is `{ from: Date | undefined; to?: Date | undefined }` (re-exported from
`react-day-picker`).

## MonthPicker (pick a whole month)

When the unit is a **month**, not a day — invoice / accounting / report periods — use `MonthPicker`.
It opens a 12-month grid with year navigation; a day would be meaningless. The value is a `Date` at
the **1st of the selected month**, so it round-trips like `DatePicker`.

```tsx
import { MonthPicker, Field } from "@trf/ui2";

const [period, setPeriod] = useState<Date>();
<Field label="Accounting period" htmlFor="period">
  <MonthPicker id="period" value={period} onChange={setPeriod} minYear={2015} maxYear={2035} />
</Field>
```

Props: `value` (`Date` at 1st of month), `onChange`, `placeholder`, `formatMonth?` (defaults to a
locale month + year, `June 2026`), `minYear?` / `maxYear?` (bound the year nav), `id`, `disabled`,
`className`.

> Don't confuse this with `DatePicker`'s `captionLayout="dropdown"` — that still selects a **day**
> (the dropdowns are just faster navigation). `MonthPicker`'s value *is* the month.

## DateTimePicker (pick a date **and** time)

When the value needs a time-of-day — task due-at, an interaction timestamp, a scheduled event —
use `DateTimePicker`. It's the on-system replacement for `<input type="datetime-local">`: the same
trigger + a `Calendar` popover with a time field in the footer. The value is a single `Date`
carrying both day and time, so it round-trips like `DatePicker`.

```tsx
import { DateTimePicker, Field } from "@trf/ui2";

const [dueAt, setDueAt] = useState<Date>();
<Field label="Due" htmlFor="due">
  <DateTimePicker id="due" value={dueAt} onChange={setDueAt} minuteStep={15} />
</Field>
```

Selecting a day keeps the current time (or seeds it from "now" on the first pick) and the popover
stays open so the time can be set too; changing the time updates the same `Date`. Props: `value`,
`onChange`, `placeholder`, `formatDateTime?` (defaults to the shared locale date + 24h time,
`09.06.2026, 14:30` for et-EE, see `datetime.md`), `minuteStep?` (time field granularity,
default 5), plus the same
`captionLayout?` / `startMonth?` / `endMonth?` / `disabledDates?` navigation props as `DatePicker`,
and `id` / `disabled` / `className`.

## Calendar (the primitive)

`Calendar` wraps `react-day-picker`, skinned entirely from tokens (no default stylesheet imported).
Use it directly for an **inline** calendar; otherwise prefer `DatePicker`.

```tsx
import { Calendar } from "@trf/ui2";

<Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border border-border" />
```

It forwards all `react-day-picker` props (`mode`, `numberOfMonths`, `disabled`, `min`/`max`, …).

## Rules

- Use `DatePicker` (not native `<input type="date">`) when the calendar should match the system or
  you need a range. Wrap in a `Field` for label/error.
- Don't import `react-day-picker/style.css` — the skin is token-driven; the default stylesheet
  would fight it.
- Don't hand-roll a calendar grid — `Calendar` handles layout, keyboard nav, and ARIA.

## Related

- [Combobox](combobox.md) · [Select](select.md) · [Inputs & Field](inputs.md) ·
  [13 AI Coding Guidelines](../13-ai-coding-guidelines.md)
