import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

export interface RadioCardProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "title"> {
  selected?: boolean;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional leading icon (Lucide). */
  icon?: React.ReactNode;
}

/**
 * A selectable card — a large, descriptive radio option (e.g. picking a document type or series).
 * Controlled: the parent owns selection (`selected` + `onClick`). Group several together.
 */
export const RadioCard = React.forwardRef<HTMLButtonElement, RadioCardProps>(
  ({ selected, title, description, icon, className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="radio"
      aria-checked={selected}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:bg-accent",
        className
      )}
      {...props}
    >
      {icon != null && (
        <span className={cn("[&_svg]:size-5", selected ? "text-primary" : "text-muted-foreground")}>
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        {description != null && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
      </span>
      {selected && <Check className="ml-auto size-4 shrink-0 text-primary" />}
    </button>
  )
);
RadioCard.displayName = "RadioCard";
