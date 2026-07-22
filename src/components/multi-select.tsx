import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Separator } from "./ui/separator";

/**
 * A filter select that takes several values.
 *
 * The list holds only real values. "All" is not an item in it: mixing a
 * meta-option with real ones forces every implementation to answer awkward
 * questions (does ticking one untick All? does ticking All visibly tick the
 * rest?) and none of the answers are obvious. Instead the trigger summarises
 * what is selected, and select-all / clear live in the popover header as
 * actions, which is what they are.
 */

export interface MultiSelectOption {
  value: string;
  label: React.ReactNode;
  /**
   * Options sharing a group render together, with a separator between groups.
   * Use it to set apart values that are off by default (terminal statuses, say)
   * from the everyday ones.
   */
  group?: string;
  /** Plain text used for search when `label` is not a string. */
  keywords?: string;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (next: string[]) => void;
  /** Trigger text when nothing is selected. Default "None". */
  emptyLabel?: React.ReactNode;
  /** Trigger text when everything is selected, e.g. "All statuses". */
  allLabel?: React.ReactNode;
  /** Show a search box. Default: automatic above 8 options. */
  searchable?: boolean;
  searchPlaceholder?: string;
  selectAllLabel?: string;
  clearLabel?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

function textOf(option: MultiSelectOption): string {
  if (option.keywords) return option.keywords;
  return typeof option.label === "string" ? option.label : option.value;
}

export function MultiSelect({
  options,
  value,
  onChange,
  emptyLabel = "None",
  allLabel = "All",
  searchable,
  searchPlaceholder = "Search…",
  selectAllLabel = "Select all",
  clearLabel = "Clear",
  id,
  disabled,
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const selected = React.useMemo(() => new Set(value), [value]);
  const showSearch = searchable ?? options.length > 8;

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => textOf(o).toLowerCase().includes(q));
  }, [options, query]);

  // The trigger is the only place the selection is summarised, so the list can
  // stay a plain set of values.
  const summary = React.useMemo(() => {
    if (value.length === 0) return emptyLabel;
    if (value.length === options.length) return allLabel;
    const first = options.find((o) => o.value === value[0])?.label ?? value[0];
    return value.length === 1 ? first : (
      <>
        {first} <span className="text-muted-foreground">+{value.length - 1}</span>
      </>
    );
  }, [value, options, emptyLabel, allLabel]);

  const toggle = (v: string) => {
    const next = new Set(selected);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    // Preserve the options' own order rather than click order, so the summary
    // and the serialized URL stay stable.
    onChange(options.filter((o) => next.has(o.value)).map((o) => o.value));
  };

  let lastGroup: string | undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="secondary"
          disabled={disabled}
          className={cn(
            "h-9 w-auto min-w-[7rem] max-w-[16rem] justify-between gap-2 font-normal",
            value.length === 0 && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{summary}</span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <div className="flex items-center gap-1 border-b border-border p-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 flex-1"
            onClick={() => onChange(options.map((o) => o.value))}
          >
            {selectAllLabel}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 flex-1"
            onClick={() => onChange([])}
          >
            {clearLabel}
          </Button>
        </div>

        {showSearch && (
          <div className="border-b border-border p-1">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-8"
            />
          </div>
        )}

        <div className="max-h-64 overflow-y-auto p-1">
          {visible.length === 0 && (
            <div className="px-2 py-3 text-center text-sm text-muted-foreground">
              {/* Deliberately terse: the search box above is the context. */}
              No matches
            </div>
          )}
          {visible.map((option) => {
            const needsSeparator = lastGroup !== undefined && option.group !== lastGroup;
            lastGroup = option.group;
            return (
              <React.Fragment key={option.value}>
                {needsSeparator && <Separator className="my-1" />}
                <label
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm",
                    "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Checkbox
                    checked={selected.has(option.value)}
                    onCheckedChange={() => toggle(option.value)}
                  />
                  <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  {selected.has(option.value) && (
                    <Check className="size-3.5 shrink-0 text-muted-foreground" />
                  )}
                </label>
              </React.Fragment>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
