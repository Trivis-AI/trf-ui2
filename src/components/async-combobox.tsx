import * as React from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

export interface AsyncComboboxProps<T> {
  /** Latest results from the async search. The consumer owns fetching. */
  items: T[];
  /** Stable identity for an item — also the selected `value`. */
  getKey: (item: T) => string;
  /** Trigger text + default row content for an item. */
  getLabel: (item: T) => string;
  /** Optional rich row renderer (mono code + description + badge, etc.). */
  renderItem?: (item: T) => React.ReactNode;

  /** Controlled search box value. */
  query: string;
  /** Called as the user types. Debounce + fetch live here (the consumer owns it). */
  onQueryChange: (query: string) => void;
  /**
   * Optional built-in debounce. When set, `onQueryChange` fires `debounceMs` after the user
   * stops typing instead of on every keystroke. The input itself stays responsive.
   */
  debounceMs?: number;

  /** Currently-selected key. */
  value?: string;
  /** Fires when an item is picked. `item` is omitted only if it isn't in the latest `items`. */
  onChange?: (value: string, item?: T) => void;
  /**
   * Label to show on the trigger when `value` is set but the matching item isn't in the latest
   * `items` (e.g. after a reload, before re-fetching the selected row).
   */
  selectedLabel?: string;

  /** Show a spinner + loading text while a search is in flight. */
  loading?: boolean;
  /** Don't search until the query reaches this length. */
  minChars?: number;

  /** Trigger text when nothing is selected. */
  placeholder?: string;
  /** Search box placeholder. */
  searchPlaceholder?: string;
  /** Shown when a search returns nothing. */
  emptyText?: string;
  /** Shown while `loading`. */
  loadingText?: string;
  /** Shown when the query is shorter than `minChars`. */
  minCharsText?: string;

  id?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Single-select autocomplete whose options come from an async/server search — debounced,
 * server-side filtered (`Command` runs with `shouldFilter={false}`). Use this when the option set
 * is too large to ship to the client or lives behind a query; use {@link Combobox} when you already
 * have the full options array and can filter it client-side.
 */
export function AsyncCombobox<T>({
  items,
  getKey,
  getLabel,
  renderItem,
  query,
  onQueryChange,
  debounceMs,
  value,
  onChange,
  selectedLabel,
  loading,
  minChars = 0,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results.",
  loadingText = "Searching…",
  minCharsText,
  id,
  disabled,
  className,
}: AsyncComboboxProps<T>) {
  const [open, setOpen] = React.useState(false);
  // The input is uncontrolled-feeling: it tracks keystrokes immediately, while `onQueryChange`
  // (the fetch trigger) is debounced when `debounceMs` is set.
  const [input, setInput] = React.useState(query);

  // Keep local input in sync if the parent resets `query` externally.
  React.useEffect(() => {
    setInput(query);
  }, [query]);

  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const handleInput = React.useCallback(
    (next: string) => {
      setInput(next);
      if (!debounceMs) {
        onQueryChange(next);
        return;
      }
      clearTimeout(timer.current);
      timer.current = setTimeout(() => onQueryChange(next), debounceMs);
    },
    [debounceMs, onQueryChange]
  );

  const selectedItem = value != null ? items.find((it) => getKey(it) === value) : undefined;
  const triggerLabel = selectedItem ? getLabel(selectedItem) : selectedLabel;
  const belowMin = input.trim().length < minChars;
  const resolvedMinCharsText =
    minCharsText ?? `Type at least ${minChars} character${minChars === 1 ? "" : "s"}…`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !triggerLabel && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{triggerLabel || placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-auto min-w-[max(var(--radix-popover-trigger-width),12rem)] max-w-[26rem] p-0"
      >
        {/* shouldFilter={false}: results are already filtered server-side. */}
        <Command shouldFilter={false}>
          <CommandInput
            value={input}
            onValueChange={handleInput}
            placeholder={searchPlaceholder}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                {loadingText}
              </div>
            ) : belowMin ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                {resolvedMinCharsText}
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {items.map((item) => {
                    const key = getKey(item);
                    return (
                      <CommandItem
                        key={key}
                        value={key}
                        onSelect={() => {
                          onChange?.(key, item);
                          setOpen(false);
                        }}
                      >
                        {renderItem ? (
                          renderItem(item)
                        ) : (
                          <>
                            <Check
                              className={cn(value === key ? "opacity-100" : "opacity-0")}
                            />
                            {getLabel(item)}
                          </>
                        )}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
