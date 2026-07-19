import * as React from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { formatMonth, useDateTimeLocale } from "../lib/datetime";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";

export interface MonthPickerProps {
  /** Selected month as a `Date` at the 1st of that month. */
  value?: Date;
  /** Fires with the 1st of the picked month (or `undefined`). */
  onChange?: (date: Date | undefined) => void;
  /** Trigger text when nothing is selected. */
  placeholder?: string;
  /** Format the trigger label. Defaults to a locale month + year (`June 2026`). */
  formatMonth?: (date: Date) => string;
  /** Inclusive year bounds for the year navigation. */
  minYear?: number;
  maxYear?: number;
  id?: string;
  disabled?: boolean;
  className?: string;
}

// Shared locale-aware format (lib/datetime.ts) so triggers match the rest of the suite.
const defaultFormatMonth = (date: Date) => formatMonth(date);

/**
 * Whole-month picker — a `Button`-like trigger that opens a `Popover` with a 12-month grid and
 * year navigation. For selecting a month as the unit (invoice/accounting/report period), where a
 * day would be meaningless. Use {@link DatePicker} when a specific day is needed.
 */
export function MonthPicker({
  value,
  onChange,
  placeholder = "Pick a month…",
  formatMonth = defaultFormatMonth,
  minYear,
  maxYear,
  id,
  disabled,
  className,
}: MonthPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [viewYear, setViewYear] = React.useState(() => (value ?? new Date()).getFullYear());
  // Re-render (and rebuild the month-name grid) when the suite locale changes.
  const locale = useDateTimeLocale();

  // Re-centre the grid on the selected (or current) year each time the popover opens.
  React.useEffect(() => {
    if (open) setViewYear((value ?? new Date()).getFullYear());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const months = React.useMemo(() => {
    const fmt = new Intl.DateTimeFormat(locale, { month: "short" });
    return Array.from({ length: 12 }, (_, m) => fmt.format(new Date(2000, m, 1)));
  }, [locale]);

  const label = value ? formatMonth(value) : undefined;
  const canPrev = minYear == null || viewYear > minYear;
  const canNext = maxYear == null || viewYear < maxYear;

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
      <PopoverContent align="start" className="w-auto p-3">
        <div className="flex items-center justify-between pb-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-muted-foreground hover:text-foreground"
            aria-label="Previous year"
            disabled={!canPrev}
            onClick={() => setViewYear((y) => y - 1)}
          >
            <ChevronLeft />
          </Button>
          <span className="text-sm font-medium">{viewYear}</span>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 text-muted-foreground hover:text-foreground"
            aria-label="Next year"
            disabled={!canNext}
            onClick={() => setViewYear((y) => y + 1)}
          >
            <ChevronRight />
          </Button>
        </div>
        <div className="grid w-60 grid-cols-3 gap-1">
          {months.map((m, i) => {
            const selected = value?.getFullYear() === viewYear && value?.getMonth() === i;
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  onChange?.(new Date(viewYear, i, 1));
                  setOpen(false);
                }}
                className={cn(
                  "h-9 rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected &&
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                )}
              >
                {m}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
