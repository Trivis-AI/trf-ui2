import { Check } from "lucide-react";
import { cn } from "../lib/utils";
import {
  SWATCH_COLORS,
  asSwatchColor,
  swatchFill,
  type SwatchColor,
  type SwatchColorInput,
} from "./ui/color-badge";

/*
 * ColorSwatchPicker: the eleven swatch colours as round radio buttons. Pairs
 * with ColorBadge, which renders whatever was picked here.
 */

export interface ColorSwatchPickerProps {
  /** Current colour; anything outside the palette reads as nothing selected. */
  value?: SwatchColorInput | null;
  onChange: (color: SwatchColor) => void;
  /** Accessible and hover names per colour, for translation. Defaults to the English name. */
  labels?: Partial<Record<SwatchColor, string>>;
  disabled?: boolean;
  className?: string;
}

export function ColorSwatchPicker({ value, onChange, labels, disabled = false, className }: ColorSwatchPickerProps) {
  const current = asSwatchColor(value);
  return (
    <div role="radiogroup" className={cn("flex flex-wrap items-center gap-2", className)}>
      {SWATCH_COLORS.map((color) => {
        const selected = color === current;
        const label = labels?.[color] ?? color[0].toUpperCase() + color.slice(1);
        return (
          <button
            key={color}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={label}
            title={label}
            disabled={disabled}
            onClick={() => onChange(color)}
            className={cn(
              "inline-flex size-6 items-center justify-center rounded-full text-background transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:opacity-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              swatchFill[color],
              selected && "ring-2 ring-ring ring-offset-2 ring-offset-background"
            )}
          >
            {selected && <Check className="size-3.5" strokeWidth={3} />}
          </button>
        );
      })}
    </div>
  );
}
