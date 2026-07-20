import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/utils";

export interface CollapsibleProps {
  /** Controlled open state. Omit to let the component own it. */
  open?: boolean;
  /** Initial state when uncontrolled. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Trigger label (the chevron is supplied). */
  label: React.ReactNode;
  /** Tint the block while open, setting the expanded content apart from the page. */
  tintWhenOpen?: boolean;
  className?: string;
  /** Classes for the content wrapper (e.g. padding, `Stack`-style spacing). */
  contentClassName?: string;
  children: React.ReactNode;
}

/**
 * A disclosure section: a chevron + label trigger over content that expands and
 * collapses smoothly.
 *
 * The height animation uses the CSS grid `0fr → 1fr` technique rather than
 * measuring in JS, so it stays smooth for content of any height and needs no
 * ResizeObserver. Content is kept mounted (hidden via `overflow-hidden` and
 * `invisible`) so form state inside survives collapsing.
 */
export function Collapsible({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  label,
  tintWhenOpen = false,
  className,
  contentClassName,
  children,
}: CollapsibleProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultOpen);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : uncontrolled;
  const contentId = React.useId();

  const toggle = () => {
    if (!isControlled) setUncontrolled((v) => !v);
    onOpenChange?.(!open);
  };

  return (
    <div
      className={cn(
        "rounded-lg transition-colors",
        // Padding is constant in both states — only the tint toggles — so the
        // header does not shift when the section opens.
        tintWhenOpen && "p-3",
        tintWhenOpen && open && "bg-muted/40",
        className
      )}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center justify-between gap-2 rounded-md text-xs font-medium text-primary outline-none transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:size-4"
      >
        {label}
        <ChevronDown
          className={cn(
            "shrink-0 transition-transform duration-200 motion-reduce:transition-none",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        id={contentId}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out motion-reduce:transition-none",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className={cn("overflow-hidden", !open && "invisible")}>
          <div className={cn("pt-3", contentClassName)}>{children}</div>
        </div>
      </div>
    </div>
  );
}
