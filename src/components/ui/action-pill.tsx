import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const actionPillVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background " +
    "disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-border bg-muted/50 text-foreground hover:bg-muted",
        selected:
          "border-transparent bg-primary font-semibold text-primary-foreground hover:bg-primary/90",
        primary:
          "border-transparent bg-primary font-semibold text-primary-foreground hover:bg-primary/90",
        warning:
          "border-warning/30 bg-warning/10 font-semibold text-warning hover:bg-warning/15",
        destructive:
          "border-destructive/30 bg-destructive/10 font-semibold text-destructive hover:bg-destructive/15",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type ActionPillVariant = NonNullable<VariantProps<typeof actionPillVariants>["variant"]>;

export interface ActionPillProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof actionPillVariants> {}

/**
 * Small pill-shaped action chip — for compact inline actions on table rows and list items where
 * a full `Button` is too heavy (e.g. statement-row "match"/"skip" actions, filter toggles).
 * Use `selected` for the active state of a toggle-like pill.
 */
export const ActionPill = React.forwardRef<HTMLButtonElement, ActionPillProps>(
  ({ className, variant, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(actionPillVariants({ variant }), className)}
      {...props}
    />
  )
);
ActionPill.displayName = "ActionPill";

export { actionPillVariants };
