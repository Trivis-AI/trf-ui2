import { LayoutGrid, List } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import type { TableViewMode } from "./card-view";

export interface TableViewToggleProps {
  value: TableViewMode;
  onChange: (next: TableViewMode) => void;
  /** Override the labels when the rows are not documents (tooltip + aria-label). */
  listLabel?: string;
  cardsLabel?: string;
  className?: string;
}

/**
 * List / gallery switch for a table page. Sits in `TablePage`'s toolbar row next to
 * the column options, so the two view controls share one place.
 *
 * A segmented pair rather than a single toggling button: the current view is a state
 * the user should be able to read at a glance, not infer from an icon that changes
 * meaning depending on what is on screen.
 */
export function TableViewToggle({
  value,
  onChange,
  listLabel = "List view",
  cardsLabel = "Gallery view",
  className,
}: TableViewToggleProps) {
  const options: { mode: TableViewMode; label: string; Icon: typeof List }[] = [
    { mode: "list", label: listLabel, Icon: List },
    { mode: "cards", label: cardsLabel, Icon: LayoutGrid },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div
        role="group"
        aria-label={listLabel + " / " + cardsLabel}
        className={cn("inline-flex items-center gap-0.5 rounded-md border border-input p-0.5", className)}
      >
        {options.map(({ mode, label, Icon }) => {
          const active = value === mode;
          return (
            <Tooltip key={mode}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon-xs"
                  variant={active ? "secondary" : "ghost"}
                  aria-label={label}
                  aria-pressed={active}
                  className={cn(!active && "text-muted-foreground", active && "border-transparent")}
                  onClick={() => onChange(mode)}
                >
                  <Icon aria-hidden />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
