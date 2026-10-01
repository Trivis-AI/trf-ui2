import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

/**
 * Floating bar for what to do with the selected rows: optional facts about the
 * selection on their own row (net, VAT, total), then "N selected", grouped actions,
 * and an X that clears the selection. It slides up from the bottom when a selection
 * starts and slides back down when it ends, whether by X, Esc, or a finished action.
 *
 * Tables render it for you (ServerDataTable `bulkActions`); use it directly only
 * for a custom list. Place it inside a positioned, full-width container.
 */
export interface SelectionBarProps {
  /** Shown while true. When it turns false the bar slides out with its last content. */
  open: boolean;
  count: number;
  /** The count line. Default `${count} selected`; pass a translated one. */
  countLabel?: React.ReactNode;
  /**
   * Facts about the selection, on their own row above the actions. May run to
   * several lines; `SelectionBarFacts` lays out label/value pairs.
   */
  info?: React.ReactNode;
  /** Clears the selection. Bound to the X button and to Esc. */
  onClear: () => void;
  /** Tooltip and accessible name of the X. Default "Clear selection". */
  clearLabel?: string;
  /** Actions: `SelectionBarAction`s, optionally split into `SelectionBarGroup`s. */
  children?: React.ReactNode;
  className?: string;
}

const EXIT_MS = 220;

// Esc belongs to whatever is on top: a dialog, a menu, or the field being typed in.
function escapeIsForSomethingElse(e: KeyboardEvent): boolean {
  if (e.defaultPrevented) return true;
  // The target is the document itself when nothing has focus, so check it is an element.
  const target = e.target instanceof Element ? e.target : null;
  if (target?.closest("input, textarea, select, [contenteditable='true'], [role='menu'], [role='listbox']")) return true;
  return !!document.querySelector("[role='dialog'][data-state='open'], [role='alertdialog'][data-state='open']");
}

export function SelectionBar({
  open, count, countLabel, info, onClear, clearLabel = "Clear selection", children, className,
}: SelectionBarProps) {
  const [mounted, setMounted] = React.useState(open);
  const [shown, setShown] = React.useState(false);

  // While sliding out, keep showing what was selected rather than "0 selected".
  const current = { count, countLabel, info, children };
  const last = React.useRef(current);
  if (open) last.current = current;
  const view = open ? current : last.current;

  React.useEffect(() => {
    if (open) {
      setMounted(true);
      // Two frames: the first paints the off-screen position, the second slides in.
      let second = 0;
      const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setShown(true)); });
      return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
    }
    setShown(false);
    const t = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [open]);

  const clearRef = React.useRef(onClear);
  clearRef.current = onClear;
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || escapeIsForSomethingElse(e)) return;
      clearRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!mounted) return null;
  const countText = view.countLabel ?? `${view.count} selected`;
  const clearButton = <SelectionBarAction label={clearLabel} icon={<X />} iconOnly variant="secondary" onClick={onClear} />;

  return (
    <TooltipProvider delayDuration={300}>
      <div
        role="toolbar"
        aria-label={typeof view.countLabel === "string" ? view.countLabel : `${view.count} selected`}
        className={cn(
          // The table header's band (--table-head over an opaque background), so the
          // bar reads as part of the table and stays solid over the rows beneath it.
          "pointer-events-auto flex max-w-[calc(100vw-2rem)] flex-col gap-2 overflow-hidden rounded-2xl border border-border bg-background p-2 text-foreground shadow-2xl",
          "[background-image:linear-gradient(var(--table-head),var(--table-head))]",
          "transition-transform duration-200 ease-out motion-reduce:transition-none",
          shown ? "translate-y-0" : "translate-y-[calc(100%+2.5rem)]",
          className,
        )}
      >
        {/* With facts: a full-width box (the invoice totals card's bg-muted) holds the
            count on the left and the facts right-aligned, and the buttons follow on
            their own row, without group dividers. Without facts: one row, the count
            first, groups split by dividers. The X is a bordered button, always last. */}
        {view.info ? (
          <>
            <div className="flex items-start justify-between gap-6 rounded-lg bg-muted px-3 py-2.5 text-sm">
              <span className="whitespace-nowrap font-semibold tabular-nums">{countText}</span>
              <div className="flex flex-col items-end text-right">{view.info}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <GroupDividers.Provider value={false}>{view.children}</GroupDividers.Provider>
              {clearButton}
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="whitespace-nowrap px-2 text-sm font-semibold tabular-nums">{countText}</span>
            <div className="flex flex-wrap items-center gap-2">
              <GroupDividers.Provider value={true}>{view.children}</GroupDividers.Provider>
            </div>
            {clearButton}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// Whether groups show their dividing rule: on in the one-row bar, off in the
// stacked bar (with facts), where the button row stands on its own.
const GroupDividers = React.createContext(true);

/** A run of related actions; in the one-row bar, groups are divided by a thin rule. */
export function SelectionBarGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  const dividers = React.useContext(GroupDividers);
  return (
    <div
      className={cn(
        "flex items-center gap-2",
        dividers && "[&:not(:first-child)]:border-l [&:not(:first-child)]:border-border [&:not(:first-child)]:pl-2",
        className,
      )}
    >
      {children}
    </div>
  );
}

export interface SelectionFact {
  label: React.ReactNode;
  value: React.ReactNode;
  /** The line that matters most, e.g. the total. */
  strong?: boolean;
}

/** Label/value lines for the bar's info row: amounts right-aligned, digits tabular. */
export function SelectionBarFacts({ items }: { items: SelectionFact[] }) {
  return (
    <dl className="grid grid-cols-[max-content_max-content] gap-x-8 gap-y-1">
      {items.map((f, i) => (
        <React.Fragment key={i}>
          <dt className={cn(f.strong ? "font-semibold" : "text-muted-foreground")}>{f.label}</dt>
          <dd className={cn("text-right font-mono tabular-nums", f.strong && "font-semibold")}>{f.value}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

export interface SelectionBarActionProps {
  /** Button text, tooltip and accessible name. */
  label: string;
  icon?: React.ReactNode;
  /** Only the icon; the label moves to the tooltip. */
  iconOnly?: boolean;
  /** secondary (default), primary, success (confirm-like) or destructive (delete-like). */
  variant?: "secondary" | "primary" | "success" | "destructive" | "ghost";
  /** Tooltip text when it should say more than the label. */
  tooltip?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  /** Shows a spinner in place of the icon and disables the button. */
  loading?: boolean;
}

export function SelectionBarAction({
  label, icon, iconOnly, variant = "secondary", tooltip, onClick, disabled, loading,
}: SelectionBarActionProps) {
  const glyph = loading ? <Spinner size="sm" /> : icon;
  const button = (
    <Button
      type="button"
      size={iconOnly ? "icon" : "md"}
      variant={variant}
      aria-label={iconOnly ? label : undefined}
      disabled={disabled || loading}
      onClick={onClick}
    >
      {glyph}
      {!iconOnly && label}
    </Button>
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="top">{tooltip ?? label}</TooltipContent>
    </Tooltip>
  );
}
