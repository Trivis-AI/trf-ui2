import * as React from "react";
import { Calendar as CalendarIcon, Check, X } from "lucide-react";
import { dateMatchModifiers } from "react-day-picker";
import type { DateRange, Matcher } from "react-day-picker";
import { cn } from "../lib/utils";
import { tr } from "../lib/i18n";
import { formatDate as formatDateShared, useDateTimePrefs } from "../lib/datetime";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";

export type { DateRange, Matcher };

interface DatePickerBaseProps {
  /** Trigger text when nothing is selected. */
  placeholder?: string;
  /** Format a single date for the trigger label. Defaults to the shared locale medium date. */
  formatDate?: (date: Date) => string;
  /**
   * Calendar header navigation. `"dropdown"` (default) shows month + year dropdowns for fast
   * jumping by month and year; `"label"` shows just the month title with prev/next arrows (one
   * month at a time, no year jump). Also `"dropdown-months"` / `"dropdown-years"`.
   */
  captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years";
  /** Earliest selectable/navigable month. Bounds the year dropdown. */
  startMonth?: Date;
  /** Latest selectable/navigable month. Bounds the year dropdown. */
  endMonth?: Date;
  /**
   * Dates that can't be selected, as a react-day-picker matcher (greyed out in the calendar).
   * E.g. `{ after: new Date() }` to forbid future dates, or `{ before: min }`. Distinct from the
   * boolean `disabled` below, which disables the whole trigger.
   */
  disabledDates?: Matcher | Matcher[];
  /**
   * Show a clear (✕) button in the trigger when a value is set, to reset the field to empty
   * (emits `undefined`). Opt-in — for optional/filter fields where unsetting the date is valid.
   */
  clearable?: boolean;
  /**
   * "cell" draws nothing of its own: no border, background, ring or radius,
   * and it fills the cell. Pair it with `<TableCell editable>`, which shows
   * the hover, focus and open states in its place, so a date in a table row
   * is the cell itself.
   */
  variant?: "default" | "cell";
  id?: string;
  disabled?: boolean;
  className?: string;
}

export interface SingleDatePickerProps extends DatePickerBaseProps {
  mode?: "single";
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  /**
   * Keep the selected **day** when the user navigates to another month/year and re-emit it in the
   * new month — e.g. with Jun 10 selected, jumping to April emits Apr 10 in a single action. Best
   * paired with `captionLayout="dropdown"` so the month/year jump is one click. The day is clamped
   * for shorter months (Jan 31 → Feb → Feb 28/29) and the auto-select is skipped when the target
   * day is excluded by `disabledDates` (you navigate, but pick a valid day yourself). Opt-in;
   * single mode only (meaningless for a range).
   */
  keepDayOnNavigate?: boolean;
}

/** Named ranges the picker can date by itself; see {@link dateRangePresetBounds}. */
export const DATE_RANGE_PRESET_IDS = [
  "current_month",
  "last_month",
  "current_quarter",
  "last_quarter",
  "current_year",
  "last_year",
  "last_30_days",
] as const;
export type DateRangePresetId = (typeof DATE_RANGE_PRESET_IDS)[number];

export function isDateRangePresetId(v: string | null | undefined): v is DateRangePresetId {
  return !!v && (DATE_RANGE_PRESET_IDS as readonly string[]).includes(v);
}

/**
 * The first and last day of a built-in preset, relative to `today` (local calendar). A list that
 * stores the preset rather than its dates calls this each time, so a saved "current month" rolls
 * over with the calendar.
 */
export function dateRangePresetBounds(
  preset: DateRangePresetId,
  today = new Date()
): { from: Date; to: Date } {
  const y = today.getFullYear();
  const m = today.getMonth();
  const d = today.getDate();
  const quarter = m - (m % 3);
  switch (preset) {
    case "current_month":
      return { from: new Date(y, m, 1), to: new Date(y, m + 1, 0) };
    case "last_month":
      return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0) };
    case "current_quarter":
      return { from: new Date(y, quarter, 1), to: new Date(y, quarter + 3, 0) };
    case "last_quarter":
      return { from: new Date(y, quarter - 3, 1), to: new Date(y, quarter, 0) };
    case "current_year":
      return { from: new Date(y, 0, 1), to: new Date(y, 11, 31) };
    case "last_year":
      return { from: new Date(y - 1, 0, 1), to: new Date(y - 1, 11, 31) };
    case "last_30_days":
      // Today and the 29 days before it.
      return { from: new Date(y, m, d - 29), to: new Date(y, m, d) };
  }
}

/**
 * A named range listed beside the calendar. A built-in id dates itself; any other id brings its
 * own `range`. The label is the consumer's, in the app's language.
 */
export type DateRangePreset =
  | { value: DateRangePresetId; label: string; range?: undefined }
  | { value: string; label: string; range: (today: Date) => { from: Date; to: Date } };

const presetBounds = (preset: DateRangePreset, today: Date) =>
  preset.range ? preset.range(today) : dateRangePresetBounds(preset.value, today);

export interface RangeDatePickerProps extends DatePickerBaseProps {
  mode: "range";
  value?: DateRange;
  /**
   * `preset` is the picked preset's id, and `undefined` when days were picked by hand or the field
   * was cleared, so a filter can store the preset itself instead of its dates.
   */
  onChange?: (range: DateRange | undefined, preset?: string) => void;
  /**
   * Named ranges listed beside the calendar ("Current month", "Last month"). Picking one emits its
   * dates with its id and closes the popover; picking a day afterwards turns it into a plain range
   * that starts from the preset's dates. Opt-in.
   */
  presets?: DateRangePreset[];
  /**
   * The active preset's id, controlled. While it names one of `presets`, the trigger shows that
   * preset's label, the list marks it, and the calendar shows its dates as of today; `value` is
   * not consulted.
   */
  preset?: string;
}

export type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps;

// Shared locale-aware format (lib/datetime.ts) so triggers match DateCell everywhere.
const defaultFormat = (date: Date) => formatDateShared(date);

/**
 * Token-styled date picker — a `Button`-like trigger that opens a `Popover` with a `Calendar`.
 * The on-system replacement for the native `<input type="date">` when you want a calendar that
 * matches the design system (light + dark). Supports single dates and start–end ranges.
 */
export function DatePicker(props: DatePickerProps) {
  const {
    placeholder = tr("<trn-pick-a-date>", "Pick a date…"),
    formatDate = defaultFormat,
    captionLayout = "dropdown",
    startMonth,
    endMonth,
    disabledDates,
    clearable,
    variant = "default",
    id,
    disabled,
    className,
  } = props;
  const [open, setOpen] = React.useState(false);
  // Re-render when suite date/time prefs change (they can arrive after mount via async token mint).
  useDateTimePrefs();

  // When a dropdown layout is used without explicit bounds, default the year dropdown to a usable
  // window (past-heavy for accounting: historical periods/dates are common) around now, otherwise
  // the year list has nothing to range over. Callers can override via startMonth/endMonth.
  const usesDropdown = captionLayout !== "label";
  const now = new Date();
  const resolvedStart = startMonth ?? (usesDropdown ? new Date(now.getFullYear() - 15, 0) : undefined);
  const resolvedEnd = endMonth ?? (usesDropdown ? new Date(now.getFullYear() + 10, 11) : undefined);
  const navProps = { captionLayout, startMonth: resolvedStart, endMonth: resolvedEnd } as const;

  // An active preset is dated from today on every render, so it wins over `value`.
  const activePreset =
    props.mode === "range" && props.preset ? props.presets?.find((p) => p.value === props.preset) : undefined;
  const range = props.mode === "range" ? (activePreset ? presetBounds(activePreset, now) : props.value) : undefined;

  // The calendar opens on the month of what is already selected, not on today:
  // react-day-picker starts at `today` unless it is told otherwise, so editing a
  // date on an invoice from March meant paging back from the current month every
  // time. Re-read on each open — the popover unmounts its content when closed.
  const selectedMonth = props.mode === "range" ? range?.from : props.value;

  let label: string | undefined;
  let dates: string | undefined;
  if (props.mode === "range") {
    if (range?.from) dates = range.to ? `${formatDate(range.from)} – ${formatDate(range.to)}` : formatDate(range.from);
    label = activePreset?.label ?? dates;
  } else if (props.value) {
    label = formatDate(props.value);
  }

  // keepDayOnNavigate (single mode): when the displayed month changes, carry the selected day into
  // the new month and re-emit it, so jumping months/years also moves the selection in one action.
  let handleMonthChange: ((displayedMonth: Date) => void) | undefined;
  if (props.mode !== "range" && props.keepDayOnNavigate) {
    const { value: selected, onChange } = props;
    handleMonthChange = (displayedMonth: Date) => {
      if (!selected) return;
      const year = displayedMonth.getFullYear();
      const month = displayedMonth.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const day = Math.min(selected.getDate(), daysInMonth);
      const next = new Date(
        year,
        month,
        day,
        selected.getHours(),
        selected.getMinutes(),
        selected.getSeconds(),
        selected.getMilliseconds()
      );
      // Don't auto-select a day that disabledDates forbids — just navigate.
      if (disabledDates && dateMatchModifiers(next, disabledDates)) return;
      onChange?.(next);
    };
  }

  const hasValue = props.mode === "range" ? !!range?.from : !!props.value;
  const showClear = !!clearable && hasValue && !disabled;
  const clear = () => {
    if (props.mode === "range") props.onChange?.(undefined);
    else props.onChange?.(undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            // A preset's label hides which dates it means today; the tooltip says.
            title={activePreset ? dates : undefined}
            className={cn(
              "flex h-9 w-full items-center gap-2 py-2 text-sm transition-colors",
              variant === "default" && [
                "rounded-md border border-input bg-field px-3 shadow-xs",
                "focus-visible:ring-2 focus-visible:ring-field-ring focus-visible:ring-offset-1 focus-visible:ring-offset-field-ring-offset focus-visible:border-input-focus focus-visible:bg-field-focus data-[state=open]:border-input-focus data-[state=open]:bg-field-focus",
              ],
              variant === "cell" && "rounded-none border-0 bg-transparent px-2 shadow-none",
              "focus-visible:outline-none",
              "disabled:cursor-not-allowed disabled:opacity-50",
              !label && "text-muted-foreground",
              showClear && "pr-9",
              className
            )}
          >
            <CalendarIcon className="size-4 shrink-0 opacity-50" />
            <span className="truncate">{label ?? placeholder}</span>
          </button>
        </PopoverTrigger>
        {showClear ? (
          <button
            type="button"
            aria-label={tr("<trn-ui-clear-date>", "Clear date")}
            onClick={(e) => {
              e.stopPropagation();
              clear();
            }}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground opacity-70 transition-opacity hover:opacity-100",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4"
            )}
          >
            <X />
          </button>
        ) : null}
      </div>
      <PopoverContent align="start" className="w-auto p-0">
        {props.mode === "range" ? (
          <div className="flex flex-col sm:flex-row">
            {props.presets?.length ? (
              // On a phone the list wraps above the calendar; w-0 + min-w-full keeps it from
              // widening the popover past the calendar (and the screen).
              <div className="flex w-0 min-w-full flex-wrap gap-0.5 border-b border-border p-2 sm:w-auto sm:min-w-0 sm:shrink-0 sm:flex-col sm:flex-nowrap sm:border-b-0 sm:border-r">
                {props.presets.map((preset) => {
                  const active = preset === activePreset;
                  return (
                    <button
                      key={preset.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        props.onChange?.(presetBounds(preset, new Date()), preset.value);
                        setOpen(false);
                      }}
                      className={cn(
                        "relative flex items-center whitespace-nowrap rounded-sm py-1.5 pl-2 pr-8 text-left text-sm outline-none transition-colors sm:w-full",
                        "hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
                      )}
                    >
                      {preset.label}
                      {active ? <Check className="absolute right-2 size-4" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <Calendar
              mode="range"
              numberOfMonths={2}
              // Side by side, the first month's trailing days would repeat (and show as selected)
              // in the second month's grid; a month-long range made that the usual case.
              showOutsideDays={false}
              autoFocus
              selected={range}
              defaultMonth={selectedMonth}
              // Days picked by hand are a plain range, even when they started from a preset.
              onSelect={(next) => props.onChange?.(next, undefined)}
              disabled={disabledDates}
              {...navProps}
            />
          </div>
        ) : (
          <Calendar
            mode="single"
            autoFocus
            selected={props.value}
            defaultMonth={selectedMonth}
            onSelect={(date) => {
              props.onChange?.(date);
              setOpen(false);
            }}
            onMonthChange={handleMonthChange}
            disabled={disabledDates}
            {...navProps}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
