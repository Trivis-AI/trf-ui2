import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Button, type ButtonVariant } from "../../ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";

/**
 * ActionsCell — the right-aligned per-row action buttons. The verb set is open
 * (Open, Review, Edit, Delete, Restore, Post, Void, Confirm, Ignore, Unlink,
 * Send, Download, Match, Sync, Remove, ...) so pages pass what they need rather
 * than picking from a fixed list. Clicks stop propagation so the buttons coexist
 * with whole-row click navigation (guardrail 4.6).
 *
 * Give `actions` for the common case (consistent sizing, and icon-only buttons
 * that carry a tooltip + aria-label as the guardrail requires), or pass custom
 * `children` for anything bespoke.
 */
export interface ActionItem {
  /** Full text of the action. Also the tooltip and aria-label when icon-only. */
  label: string;
  /** Optional Lucide icon. Required when `iconOnly` is set. */
  icon?: LucideIcon;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  /** Render as a link instead of a button. */
  href?: string;
  /** Button variant. Default "ghost". */
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Show only the icon (to save width); the label becomes the tooltip + aria-label. */
  iconOnly?: boolean;
}

export interface ActionsCellProps {
  actions?: ActionItem[];
  /** Escape hatch for custom controls. Ignored when `actions` is provided. */
  children?: React.ReactNode;
  className?: string;
}

function ActionButton({ action }: { action: ActionItem }) {
  const { label, icon: Icon, onClick, href, variant = "ghost", disabled, iconOnly } = action;

  const commonProps = {
    variant,
    size: iconOnly ? ("icon-xs" as const) : ("sm" as const),
    disabled,
    "aria-label": iconOnly ? label : undefined,
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onClick?.(e);
    },
  };

  const content = iconOnly ? (
    Icon ? <Icon aria-hidden /> : null
  ) : (
    <>
      {Icon && <Icon aria-hidden />}
      {label}
    </>
  );

  const button = href ? (
    <Button {...commonProps} asChild>
      <a href={href}>{content}</a>
    </Button>
  ) : (
    <Button {...commonProps}>{content}</Button>
  );

  if (!iconOnly) return button;

  // Icon-only buttons must carry the full text (guardrail 4.6).
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function ActionsCell({ actions, children, className }: ActionsCellProps) {
  const hasIconOnly = actions?.some((a) => a.iconOnly) ?? false;

  const body = actions ? (
    actions.map((action, i) => <ActionButton key={i} action={action} />)
  ) : (
    children
  );

  return (
    // Stop clicks here from reaching a row-click handler.
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn("flex items-center justify-end gap-1", className)}
    >
      {hasIconOnly ? <TooltipProvider delayDuration={300}>{body}</TooltipProvider> : body}
    </div>
  );
}
