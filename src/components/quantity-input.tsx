import * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem } from "./ui/select";

export interface QuantityInputUnit {
  id: string;
  /** Short unit code shown in the field ("tk", "h", "kg"). */
  label: string;
}

export interface QuantityInputProps {
  /** Quantity, as the string the caller stores (numeric input semantics). */
  value: string;
  onValueChange: (value: string) => void;
  /** Units offered by the in-field picker. */
  units: QuantityInputUnit[];
  unitId?: string;
  /** Omit to render the unit as a plain read-only suffix. */
  onUnitChange?: (unitId: string) => void;
  /** "quiet" is the editable-table cell style; "default" the form chrome. */
  variant?: "default" | "quiet";
  disabled?: boolean;
  className?: string;
  /** Accessible name for the quantity input. */
  "aria-label"?: string;
  /** Accessible name for the unit picker. Default "Unit". */
  unitLabel?: string;
}

/**
 * A numeric quantity input with its unit riding inside the field ("1 tk").
 *
 * The unit code is always readable, so the cell still says what it measures at
 * rest; hovering the field surfaces the picker's chevron, and clicking the code
 * opens a unit dropdown. Built for editable table cells (invoice rows, order
 * lines) where a separate unit column would cost width the description needs,
 * but works in forms too via variant="default".
 */
export function QuantityInput({
  value,
  onValueChange,
  units,
  unitId,
  onUnitChange,
  variant = "quiet",
  disabled,
  className,
  "aria-label": ariaLabel,
  unitLabel = "Unit",
}: QuantityInputProps) {
  const unit = units.find((u) => u.id === unitId);
  const canPickUnit = !disabled && !!onUnitChange && units.length > 0;

  return (
    <div className={cn("group/qty relative flex items-center", className)}>
      <Input
        type="number"
        step="any"
        variant={variant}
        disabled={disabled}
        aria-label={ariaLabel}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        // Right padding reserves the unit's lane so digits never run under it.
        className={cn(
          "text-right font-mono tabular-nums",
          canPickUnit ? "pr-12" : unit ? "pr-9" : undefined
        )}
      />
      {canPickUnit ? (
        <Select value={unitId} onValueChange={onUnitChange}>
          {/* A bare primitive trigger, not the house SelectTrigger: this is a
              chip inside an input, not a form field, so it must not bring the
              h-9 / border / full-width chrome with it. */}
          <SelectPrimitive.Trigger
            aria-label={unitLabel}
            className={cn(
              "absolute right-1 flex h-6 items-center gap-0.5 rounded px-1 text-xs text-muted-foreground transition-colors",
              "hover:bg-accent hover:text-accent-foreground",
              "data-[state=open]:bg-accent data-[state=open]:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              // The code always reads; the chevron only surfaces when the
              // pointer is over the field (or the picker is open/focused), so
              // the resting cell stays quiet.
              "[&_svg]:opacity-0 [&_svg]:transition-opacity",
              "group-hover/qty:[&_svg]:opacity-60 focus-visible:[&_svg]:opacity-60 data-[state=open]:[&_svg]:opacity-60"
            )}
          >
            <span>{unit?.label ?? "—"}</span>
            <SelectPrimitive.Icon asChild>
              <ChevronDown className="size-3 shrink-0" />
            </SelectPrimitive.Icon>
          </SelectPrimitive.Trigger>
          <SelectContent align="end" className="min-w-[6rem]">
            {units.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                {u.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : unit ? (
        <span className="pointer-events-none absolute right-2 text-xs text-muted-foreground">
          {unit.label}
        </span>
      ) : null}
    </div>
  );
}
