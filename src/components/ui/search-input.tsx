import * as React from "react";
import { Search, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { tr } from "../../lib/i18n";
import { Input, type InputProps } from "./input";

export interface SearchInputProps extends InputProps {
  /**
   * Called when the clear (✕) button is clicked. The button is shown only when
   * there is a value AND this handler is provided. Omit it for a plain (no-clear)
   * search field.
   */
  onClear?: () => void;
}

/**
 * A search field: a leading magnifier icon over a standard `Input`, plus an
 * optional trailing clear button. Purely presentational — it forwards every
 * `Input` prop (`value`, `onChange`, `placeholder`, …) and the ref to the
 * underlying `<input>`, so callers own the state.
 */
export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onClear, value, ...props }, ref) => {
    const hasValue = value != null && String(value).length > 0;
    return (
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={ref}
          type="search"
          value={value}
          className={cn(
            "pl-9 [&::-webkit-search-cancel-button]:appearance-none",
            onClear && "pr-8",
            className,
          )}
          {...props}
        />
        {onClear && hasValue && (
          <button
            type="button"
            onClick={onClear}
            aria-label={tr("<trn-ui-clear-search>", "Clear search")}
            className="absolute right-2.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";
