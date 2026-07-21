import * as React from "react";
import { CalendarClock, Clock } from "lucide-react";
import type { Matcher } from "react-day-picker";
import { cn } from "../lib/utils";
import { formatDateTime as formatDateTimeShared, useDateTimePrefs } from "../lib/datetime";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Calendar } from "./ui/calendar";

export interface DateTimePickerProps {
  /** Controlled value — a `Date` carrying both day and time. */
  value?: Date;
  /** Fires on day or time change with the combined `Date` (or `undefined` when cleared). */
  onChange?: (date: Date | undefined) => void;
  /** Trigger text when nothing is selected. */
  placeholder?: string;
  /** Format the trigger label. Defaults to the shared locale date + 24h time (`09.06.2026, 14:30`). */
  formatDateTime?: (date: Date) => string;
  /** Minute granularity of the time field (the native step). Default 5. */
  minuteStep?: number;
  /**
   * Calendar header navigation. `"label"` (default) shows the month title with prev/next arrows;
   * `"dropdown"` adds month + year dropdowns for faster jumping.
   */
  captionLayout?: "label" | "dropdown" | "dropdown-months" | "dropdown-years";
  startMonth?: Date;
  endMonth?: Date;
  /** Dates that can't be selected, as a react-day-picker matcher (greyed out in the calendar). */
  disabledDates?: Matcher | Matcher[];
  id?: string;
  disabled?: boolean;
  className?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

// Shared locale-aware format (lib/datetime.ts) so triggers match DateCell everywhere.
const defaultFormat = (date: Date) => formatDateTimeShared(date);

/**
 * Token-styled date **and** time picker — `DatePicker`'s trigger + a `Calendar` popover with a
 * time field in the footer. The on-system replacement for `<input type="datetime-local">`. The
 * value is a single `Date` carrying both day and time; selecting a day keeps the existing time
 * (or seeds it from "now" the first time), and the popover stays open so the time can be set too.
 */
export function DateTimePicker({
  value,
  onChange,
  placeholder = "Pick date & time…",
  formatDateTime = defaultFormat,
  minuteStep = 5,
  captionLayout = "label",
  startMonth,
  endMonth,
  disabledDates,
  id,
  disabled,
  className,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  // Re-render when suite date/time prefs change (they can arrive after mount via async token mint).
  useDateTimePrefs();

  // Default the year dropdown to a ±10-year window around now when a dropdown layout is used.
  const usesDropdown = captionLayout !== "label";
  const now = new Date();
  const resolvedStart = startMonth ?? (usesDropdown ? new Date(now.getFullYear() - 10, 0) : undefined);
  const resolvedEnd = endMonth ?? (usesDropdown ? new Date(now.getFullYear() + 10, 11) : undefined);

  const label = value ? formatDateTime(value) : undefined;
  const timeValue = value ? `${pad(value.getHours())}:${pad(value.getMinutes())}` : "";

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) {
      onChange?.(undefined);
      return;
    }
    // Keep the current time (or seed from "now" on first pick), apply it to the chosen day.
    const time = value ?? new Date();
    onChange?.(
      new Date(day.getFullYear(), day.getMonth(), day.getDate(), time.getHours(), time.getMinutes())
    );
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (!v) return;
    const [h, m] = v.split(":").map(Number);
    const base = value ?? new Date();
    onChange?.(new Date(base.getFullYear(), base.getMonth(), base.getDate(), h || 0, m || 0));
  };

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
          <CalendarClock className="size-4 shrink-0 opacity-50" />
          <span className="truncate">{label ?? placeholder}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          autoFocus
          selected={value}
          onSelect={handleDaySelect}
          disabled={disabledDates}
          captionLayout={captionLayout}
          startMonth={resolvedStart}
          endMonth={resolvedEnd}
        />
        <div className="flex items-center gap-2 border-t border-border p-3">
          <Clock className="size-4 shrink-0 text-muted-foreground" />
          <input
            type="time"
            step={minuteStep * 60}
            value={timeValue}
            onChange={handleTimeChange}
            aria-label="Time"
            className={cn(
              "h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
            )}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
