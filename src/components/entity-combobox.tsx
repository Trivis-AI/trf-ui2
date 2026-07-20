import * as React from "react";
import { createPortal } from "react-dom";
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
  /** Badge text on primary rows. Pass null/"" to drop the badge (the row itself
   *  is obviously clickable; the badge earns its place only when rows differ). */
  pickLabel?: string | null;

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
  /** Badge text on secondary rows. Pass null/"" to drop it. */
  fallbackPickLabel?: string | null;
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
  const listRef = React.useRef<HTMLUListElement>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  const [anchor, setAnchor] = React.useState<{ top: number; left: number; width: number } | null>(null);
  const listId = React.useId();
  React.useEffect(() => () => clearTimeout(timer.current), []);

  // Close on click/tap outside. The list is portalled, so it is not inside
  // rootRef — check it separately or picking an option would close first.
  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!rootRef.current?.contains(target) && !listRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Primary items then fallback rows — one flat list so the arrow keys walk the
  // whole dropdown, matching what the user sees.
  const options = React.useMemo(
    () => [
      ...items.map((item) => ({ item, kind: "primary" as const })),
      ...(fallbackLoading ? [] : fallbackItems.map((item) => ({ item, kind: "fallback" as const }))),
    ],
    [items, fallbackItems, fallbackLoading]
  );
  const [activeIndex, setActiveIndex] = React.useState(-1);

  const handleInput = (next: string) => {
    onQueryChange(next);
    setOpen(true);
    setActiveIndex(-1);
    clearTimeout(timer.current);
    if (!next.trim()) return;
    timer.current = setTimeout(() => onSearch(next), debounceMs);
  };

  const pick = (item: EntityComboboxItem) => {
    setOpen(false);
    setActiveIndex(-1);
    onPick(item);
  };

  const pickFallback = (item: EntityComboboxItem) => {
    if (fallbackBusy) return;
    onFallbackPick?.(item);
  };

  const hasContent = items.length > 0 || fallbackItems.length > 0 || fallbackLoading;
  const showDropdown = open && hasContent && !disabled;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      // Consumers may bind Escape too (e.g. reverting a table row); when the
      // dropdown is open Escape belongs to it alone.
      if (showDropdown) e.stopPropagation();
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (e.key === "Tab") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!showDropdown) {
      if (e.key === "ArrowDown" && hasContent) {
        e.preventDefault();
        setOpen(true);
        setActiveIndex(0);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (options.length === 0 ? -1 : (i + 1) % options.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (options.length === 0 ? -1 : i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < options.length) {
      // Only swallow Enter when a row is highlighted, so plain typing + Enter
      // still reaches the surrounding form.
      e.preventDefault();
      e.stopPropagation();
      const option = options[activeIndex];
      if (option.kind === "primary") pick(option.item);
      else pickFallback(option.item);
    }
  };

  // Keep the highlighted row visible when arrowing past the visible window.
  React.useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current
      ?.querySelector(`[data-option-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  React.useLayoutEffect(() => {
    if (!showDropdown) return;
    const track = () => {
      const r = rootRef.current?.getBoundingClientRect();
      if (r) setAnchor({ top: r.bottom + 4, left: r.left, width: r.width });
    };
    track();
    // Capture phase so scrolling of any ancestor (table scrollport, page) is seen.
    window.addEventListener("scroll", track, true);
    window.addEventListener("resize", track);
    return () => {
      window.removeEventListener("scroll", track, true);
      window.removeEventListener("resize", track);
    };
  }, [showDropdown, items.length, fallbackItems.length, fallbackLoading]);

  const rowCls =
    "flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground";

  const renderRow = (item: EntityComboboxItem) => (
    <div className="min-w-0">
      <span className="block truncate font-medium">{item.title}</span>
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
        onKeyDown={handleKeyDown}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        aria-activedescendant={
          showDropdown && activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined
        }
      />
      {showDropdown && anchor && createPortal(
        <ul
          ref={listRef}
          role="listbox"
          // Portalled to the body and fixed-positioned: inside editable tables the
          // scrollport and sticky cells would otherwise clip or cover the list.
          // Width grows with the longest option, floored at the input's width.
          style={{ top: anchor.top, left: anchor.left, minWidth: anchor.width }}
          className="fixed z-50 max-h-64 w-max max-w-[28rem] list-none overflow-y-auto rounded-md border border-border bg-popover p-0 text-popover-foreground shadow-md"
        >
          {items.map((item, i) => (
            <li
              key={item.key}
              id={`${listId}-option-${i}`}
              data-option-index={i}
              role="option"
              aria-selected={activeIndex === i}
              className={cn(rowCls, activeIndex === i && "bg-accent text-accent-foreground")}
              onMouseEnter={() => setActiveIndex(i)}
              onClick={() => pick(item)}
            >
              {renderRow(item)}
              {pickLabel ? (
                <Badge variant="secondary" className="shrink-0">
                  {pickLabel}
                </Badge>
              ) : null}
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
              {fallbackItems.map((item, i) => {
                const index = items.length + i;
                return (
                <li
                  key={item.key}
                  id={`${listId}-option-${index}`}
                  data-option-index={index}
                  role="option"
                  aria-selected={activeIndex === index}
                  className={cn(
                    rowCls,
                    activeIndex === index && "bg-accent text-accent-foreground",
                    fallbackBusy && "pointer-events-none opacity-50"
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => pickFallback(item)}
                >
                  {renderRow(item)}
                  {fallbackPickLabel ? (
                    <Badge variant="warning" className="shrink-0">
                      {fallbackPickLabel}
                    </Badge>
                  ) : null}
                </li>
                );
              })}
            </>
          )}
        </ul>,
        document.body
      )}
    </div>
  );
}
