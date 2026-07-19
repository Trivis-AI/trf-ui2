import * as React from "react";
import { cn } from "../../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /**
   * "quiet" is the editable-table cell style: invisible chrome at rest, border +
   * background on hover, the usual focus ring while editing. Also hides native
   * number spinners, which eat width in dense cells.
   */
  variant?: "default" | "quiet";
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md py-1 text-sm transition-colors",
          "placeholder:text-muted-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          variant === "default" && "border border-input bg-background px-3 shadow-xs",
          variant === "quiet" && [
            "border border-transparent bg-transparent px-2",
            "hover:border-input hover:bg-background",
            "focus-visible:border-input focus-visible:bg-background focus-visible:ring-offset-0",
            "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          ],
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
