import * as React from "react";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { dateMatchModifiers } from "react-day-picker";
import type { DateRange, Matcher } from "react-day-picker";
import { cn } from "../lib/utils";
import { formatDate as formatDateShared, useDateTimeLocale } from "../lib/datetime";
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

export interface RangeDatePickerProps extends DatePickerBaseProps {
  mode: "range";
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
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
    placeholder = "Pick a date…",
    formatDate = defaultFormat,
    captionLayout = "dropdown",
    startMonth,
    endMonth,
    disabledDates,
    clearable,
    id,
    disabled,
    className,
  } = props;
  const [open, setOpen] = React.useState(false);
  // Re-render when the suite locale changes (it can arrive after mount via async token mint).
  useDateTimeLocale();

  // When a dropdown layout is used without explicit bounds, default the year dropdown to a usable
  // window (past-heavy for accounting: historical periods/dates are common) around now, otherwise
  // the year list has nothing to range over. Callers can override via startMonth/endMonth.
  const usesDropdown = captionLayout !== "label";
  const now = new Date();
  const resolvedStart = startMonth ?? (usesDropdown ? new Date(now.getFullYear() - 15, 0) : undefined);
  const resolvedEnd = endMonth ?? (usesDropdown ? new Date(now.getFullYear() + 10, 11) : undefined);
  const navProps = { captionLayout, startMonth: resolvedStart, endMonth: resolvedEnd } as const;

  let label: string | undefined;
  if (props.mode === "range") {
    const r = props.value;
    if (r?.from) label = r.to ? `${formatDate(r.from)} – ${formatDate(r.to)}` : formatDate(r.from);
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

  const hasValue = props.mode === "range" ? !!props.value?.from : !!props.value;
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
            className={cn(
              "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
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
            aria-label="Clear date"
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
          <Calendar
            mode="range"
            numberOfMonths={2}
            autoFocus
            selected={props.value}
            onSelect={props.onChange}
            disabled={disabledDates}
            {...navProps}
          />
        ) : (
          <Calendar
            mode="single"
            autoFocus
            selected={props.value}
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
