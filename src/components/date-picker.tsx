import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import type { DateRange, Matcher } from "react-day-picker";
import { cn } from "../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";

export type { DateRange, Matcher };

interface DatePickerBaseProps {
  /** Trigger text when nothing is selected. */
  placeholder?: string;
  /** Format a single date for the trigger label. Defaults to a locale medium date. */
  formatDate?: (date: Date) => string;
  /**
   * Calendar header navigation. `"label"` (default) shows the month title with prev/next arrows;
   * `"dropdown"` shows month + year dropdowns for faster jumping (also `"dropdown-months"` /
   * `"dropdown-years"`).
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
  id?: string;
  disabled?: boolean;
  className?: string;
}

export interface SingleDatePickerProps extends DatePickerBaseProps {
  mode?: "single";
  value?: Date;
  onChange?: (date: Date | undefined) => void;
}

export interface RangeDatePickerProps extends DatePickerBaseProps {
  mode: "range";
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
}

export type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps;

const defaultFormat = (date: Date) =>
  new Intl.DateTimeFormat(undefined, { day: "2-digit", month: "short", year: "numeric" }).format(
    date
  );

/**
 * Token-styled date picker — a `Button`-like trigger that opens a `Popover` with a `Calendar`.
 * The on-system replacement for the native `<input type="date">` when you want a calendar that
 * matches the design system (light + dark). Supports single dates and start–end ranges.
 */
export function DatePicker(props: DatePickerProps) {
  const {
    placeholder = "Pick a date…",
    formatDate = defaultFormat,
    captionLayout = "label",
    startMonth,
    endMonth,
    disabledDates,
    id,
    disabled,
    className,
  } = props;
  const [open, setOpen] = React.useState(false);

  // When a dropdown layout is requested without explicit bounds, default the year dropdown to a
  // usable ±10-year window around now (otherwise the year list has nothing to range over).
  const usesDropdown = captionLayout !== "label";
  const now = new Date();
  const resolvedStart = startMonth ?? (usesDropdown ? new Date(now.getFullYear() - 10, 0) : undefined);
  const resolvedEnd = endMonth ?? (usesDropdown ? new Date(now.getFullYear() + 10, 11) : undefined);
  const navProps = { captionLayout, startMonth: resolvedStart, endMonth: resolvedEnd } as const;

  let label: string | undefined;
  if (props.mode === "range") {
    const r = props.value;
    if (r?.from) label = r.to ? `${formatDate(r.from)} – ${formatDate(r.to)}` : formatDate(r.from);
  } else if (props.value) {
    label = formatDate(props.value);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
            className
          )}
        >
          <CalendarIcon className="size-4 shrink-0 opacity-50" />
          <span className="truncate">{label ?? placeholder}</span>
        </button>
      </PopoverTrigger>
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
            disabled={disabledDates}
            {...navProps}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
