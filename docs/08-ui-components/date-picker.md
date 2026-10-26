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
| `onChange?` | `(date \| undefined)` / `(range \| undefined, preset?)` | Fires on select. Single mode closes the popover. In range mode `preset` is the picked preset's id, `undefined` for days picked by hand or a clear. |
| `placeholder?` | `string` | Trigger text when empty. |
| `formatDate?` | `(date: Date) => string` | Trigger label formatter. Defaults to the shared locale-numeric date (`09.06.2026` for et-EE, see `datetime.md`). |
| `captionLayout?` | `"label"` \| `"dropdown"` \| `"dropdown-months"` \| `"dropdown-years"` | Header nav. Default `"label"` (month title + arrows). `"dropdown"` adds month **and** year dropdowns for fast jumping. |
| `startMonth?` / `endMonth?` | `Date` | Bound the year dropdown. Default ±10 years around now when a dropdown layout is used. |
| `disabledDates?` | `Matcher \| Matcher[]` | react-day-picker matcher for non-selectable dates (greyed out). E.g. `{ after: new Date() }` to forbid future dates. Distinct from the boolean `disabled` (which disables the whole trigger). |
| `keepDayOnNavigate?` | `boolean` | **Single mode, opt-in.** Carry the selected day to the new month when navigating, re-emitting it in one action (Jun 10 → pick April → Apr 10). See below. |
| `clearable?` | `boolean` | **Opt-in.** Show a clear (✕) button in the trigger when a value is set; clicking it resets the field to empty (emits `undefined`). For optional/filter dates where unsetting is valid. |
| `presets?` | `DateRangePreset[]` | **Range mode, opt-in.** Named ranges listed beside the calendar ("Current month", "Last month"). See [Presets](#presets-named-ranges). |
| `preset?` | `string` | **Range mode.** The active preset's id, controlled. While set, the trigger shows its label and the calendar its dates as of today; `value` is not consulted. |
| `variant?` | `"default"` \| `"cell"` | `"cell"` draws nothing of its own and fills the cell, for a date that is a cell of an editable table inside `<TableCell editable>`; the cell shows hover, focus and the open state. See [Table, editable cells](table.md#editable-cells). |
| `id` / `disabled` / `className` | | Trigger mirrors the Combobox / Select trigger styling. |

The calendar opens on the month of the current value (the range's `from` in range mode), and on
today's month only when nothing is selected — editing a date on a document from March does not
start in the current month.

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

### Presets (named ranges)

A list filter that offers "Current month" / "Last month" does it inside the range picker, not
with a separate Period select next to From / To. Pass `presets` and the popover lists them
beside the calendar:

```tsx
import { DatePicker, dateRangePresetBounds, isDateRangePresetId, type DateRangePreset } from "@trf/ui2";

const presets: DateRangePreset[] = [
  { value: "current_month", label: t.translate("<trn-current-month>", "Current month") },
  { value: "last_month", label: t.translate("<trn-last-month>", "Last month") },
];

// Store the preset itself, not its dates, so a saved "current month" view rolls over with the
// calendar. The query works the dates out from today each time. isoToDate / dateToIso are the
// app's own YYYY-MM-DD adapters (frontinvoices src/utils/date.ts).
const period = isDateRangePresetId(q.filters.period) ? q.filters.period : undefined;
const range = period
  ? dateRangePresetBounds(period)
  : { from: isoToDate(q.filters.date_from), to: isoToDate(q.filters.date_to) };

<Field label={t.translate("<trn-period>", "Period")} htmlFor="period" className="w-60">
  <DatePicker
    mode="range"
    id="period"
    presets={presets}
    preset={period}
    value={range}
    onChange={(r, preset) =>
      q.setFilters(
        preset
          ? { period: preset, date_from: "", date_to: "" }
          : { period: "", date_from: dateToIso(r?.from), date_to: dateToIso(r?.to) }
      )
    }
    placeholder={t.translate("<trn-any-period>", "Any period")}
    clearable
  />
</Field>
```

- **Picking a preset** emits its dates as of today together with its id, and closes the popover.
- **Picking a day** afterwards turns it into a plain range that starts from the preset's dates
  (`preset` is `undefined`), so "Last month" then a click on the 20th is the 1st to the 20th.
- **While `preset` is set** the trigger shows the preset's label (the tooltip gives its dates), the
  list marks it, and the calendar shows its dates as of today. An id that is not in `presets` is
  ignored and `value` shows instead.
- **"Any period"** is the empty state: the placeholder, and `clearable` for the ✕.
- Labels are the consumer's, so they come translated. ui2 adds no strings.

Built-in ids, dated by the picker itself and by `dateRangePresetBounds(id, today?)`:
`current_month`, `last_month`, `current_quarter`, `last_quarter` (calendar quarters),
`current_year`, `last_year` (calendar years). `DATE_RANGE_PRESET_IDS` lists them and
`isDateRangePresetId(v)` narrows a stored string, such as a URL filter param.

Any other id brings its own `range`, worked out from today:

```tsx
{
  value: "last_30_days",
  label: "Last 30 days",
  range: (today) => ({
    from: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29),
    to: new Date(today.getFullYear(), today.getMonth(), today.getDate()),
  }),
}
```

On a phone the list wraps above the calendar. The two-month range view hides outside days, so
the first month's last days do not repeat, selected, at the top of the second month.

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

**Weeks start on Monday.** react-day-picker defaults to Sunday (en-US); `Calendar` sets
`weekStartsOn={1}` because every market the suite serves (EE/LV/LT, en-GB) is Monday-first, and so
is ISO 8601. This applies to `DatePicker` and `DateTimePicker` too, since both compose `Calendar`.
Pass `weekStartsOn={0}` on a single instance if you ever need Sunday.

## Rules

- Use `DatePicker` (not native `<input type="date">`) when the calendar should match the system or
  you need a range. Wrap in a `Field` for label/error.
- Don't import `react-day-picker/style.css` — the skin is token-driven; the default stylesheet
  would fight it.
- Don't hand-roll a calendar grid — `Calendar` handles layout, keyboard nav, and ARIA.

## Related

- [Combobox](combobox.md) · [Select](select.md) · [Inputs & Field](inputs.md) ·
  [13 AI Coding Guidelines](../13-ai-coding-guidelines.md)
