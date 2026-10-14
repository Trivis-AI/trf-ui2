import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * "quiet" is the editable-table cell style: invisible chrome at rest, border +
   * background on hover, the usual focus ring while editing. Also hides native
   * number spinners, which eat width in dense cells.
   *
   * "cell" draws nothing of its own, ever: no border, no background, no ring,
   * square corners, and it fills the cell. Pair it with `<TableCell editable>`,
   * which carries the hover, focus and invalid states, so the cell is the field
   * and nothing sits inside anything. Alignment and numerals are the caller's
   * (`text-right font-mono tabular-nums` for figures).
   */
  variant?: "default" | "quiet" | "cell";
}

// Number spinners eat width in dense cells; both table variants hide them.
const noSpinners =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none";

const focusRing =
  "focus-visible:ring-2 focus-visible:ring-field-ring focus-visible:ring-offset-1 focus-visible:ring-offset-field-ring-offset";

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-9 w-full py-1 text-sm transition-colors",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          variant === "default" && [
            "rounded-md border border-input bg-field px-3 shadow-xs",
            focusRing,
            "focus-visible:border-input-focus focus-visible:bg-field-focus",
          ],
          variant === "quiet" && [
            "rounded-md border border-transparent bg-transparent px-2",
            "hover:border-input hover:bg-field",
            focusRing,
            "focus-visible:border-input-focus focus-visible:bg-field-focus focus-visible:ring-offset-0",
            noSpinners,
          ],
          variant === "cell" && [
            "min-w-0 rounded-none border-0 bg-transparent px-2 shadow-none",
            noSpinners,
          ],
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
