import * as React from "react";
import { cn } from "../lib/utils";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";

export interface EntityComboboxItem {
  /** Stable identity for the row. */
  key: string;
  /** Main line (e.g. legal name). */
  title: string;
  /** Muted inline code next to the title (e.g. registration code). */
  code?: string;
  /** Muted sub-line (e.g. email or address). */
  description?: string;
}

export interface EntityComboboxProps {
  /** Controlled input text. The parent owns it (and any side effects, e.g. marking a form dirty). */
  query: string;
  /** Fires on every keystroke. */
  onQueryChange: (query: string) => void;
  /**
   * Debounced fetch trigger — do your searching here, then update `items` / `fallbackItems`.
   * Not called for empty/whitespace queries (clear your results in `onQueryChange` instead).
   */
  onSearch: (query: string) => void;
  /** Debounce for `onSearch`. */
  debounceMs?: number;

  /** Primary suggestions (e.g. CRM contacts). The consumer owns fetching. */
  items: EntityComboboxItem[];
  /** Fires when a primary suggestion is chosen. The dropdown closes itself. */
  onPick: (item: EntityComboboxItem) => void;
  /** Badge text on primary rows. */
  pickLabel?: string;

  /** Secondary group shown under a header (e.g. business-registry results). */
  fallbackItems?: EntityComboboxItem[];
  /** Group header for the secondary results. */
  fallbackLabel?: string;
  /** Show the secondary group's loading row. */
  fallbackLoading?: boolean;
  /** Text for the secondary loading row. */
  fallbackLoadingText?: string;
  /** Fires when a secondary row is chosen (e.g. import-from-registry). */
  onFallbackPick?: (item: EntityComboboxItem) => void;
  /** Badge text on secondary rows. */
  fallbackPickLabel?: string;
  /** Disable secondary rows while an import is in flight. */
  fallbackBusy?: boolean;

  id?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  /** Style of the underlying Input — pass "quiet" inside editable table cells. */
  inputVariant?: "default" | "quiet";
}

/**
 * Type-in-place entity search field: an `Input` with a floating suggestion list, plus an optional
 * secondary "fallback" group (e.g. import candidates from an external registry when the primary
 * search comes up empty). Presentational — the consumer owns fetching and what a pick means.
 *
 * Unlike {@link AsyncCombobox} (a button-trigger picker), this reads as a regular form input whose
 * text doubles as the search query — use it where the typed text itself is the field value
 * (customer / supplier / contact names).
 */
export function EntityCombobox({
  query,
  onQueryChange,
  onSearch,
  debounceMs = 300,
  items,
  onPick,
  pickLabel = "Select",
  fallbackItems = [],
  fallbackLabel,
  fallbackLoading = false,
  fallbackLoadingText = "Searching…",
  onFallbackPick,
  fallbackPickLabel = "Import",
  fallbackBusy = false,
  id,
  placeholder = "Search by name…",
  disabled,
  required,
  className,
  inputVariant,
}: EntityComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  // Close on click/tap outside.
  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const handleInput = (next: string) => {
    onQueryChange(next);
    setOpen(true);
    clearTimeout(timer.current);
    if (!next.trim()) return;
    timer.current = setTimeout(() => onSearch(next), debounceMs);
  };

  const pick = (item: EntityComboboxItem) => {
    setOpen(false);
    onPick(item);
  };

  const pickFallback = (item: EntityComboboxItem) => {
    if (fallbackBusy) return;
    onFallbackPick?.(item);
  };

  const hasContent = items.length > 0 || fallbackItems.length > 0 || fallbackLoading;
  const showDropdown = open && hasContent && !disabled;

  const rowCls =
    "flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground";

  const renderRow = (item: EntityComboboxItem) => (
    <div className="min-w-0">
      <span className="font-medium">{item.title}</span>
      {item.code && <span className="ml-2 text-xs text-muted-foreground">{item.code}</span>}
      {item.description && (
        <div className="text-xs text-muted-foreground">{item.description}</div>
      )}
    </div>
  );

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Input
        id={id}
        type="text"
        autoComplete="off"
        variant={inputVariant}
        value={query}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={showDropdown}
      />
      {showDropdown && (
        <ul
          role="listbox"
          className="absolute inset-x-0 z-10 mt-1 max-h-64 list-none overflow-y-auto rounded-md border border-border bg-popover p-0 text-popover-foreground shadow-md"
        >
          {items.map((item) => (
            <li
              key={item.key}
              role="option"
              aria-selected={false}
              className={rowCls}
              onClick={() => pick(item)}
            >
              {renderRow(item)}
              <Badge variant="secondary" className="shrink-0">
                {pickLabel}
              </Badge>
            </li>
          ))}
          {fallbackLoading && (
            <li className="px-3 py-2 text-sm italic text-muted-foreground">
              {fallbackLoadingText}
            </li>
          )}
          {!fallbackLoading && fallbackItems.length > 0 && (
            <>
              {fallbackLabel && (
                <li className="border-t border-border px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {fallbackLabel}
                </li>
              )}
              {fallbackItems.map((item) => (
                <li
                  key={item.key}
                  role="option"
                  aria-selected={false}
                  className={cn(rowCls, fallbackBusy && "pointer-events-none opacity-50")}
                  onClick={() => pickFallback(item)}
                >
                  {renderRow(item)}
                  <Badge variant="warning" className="shrink-0">
                    {fallbackPickLabel}
                  </Badge>
                </li>
              ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
}
