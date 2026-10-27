import * as React from "react";
import { cn } from "../lib/utils";
import { tr } from "../lib/i18n";
import { Spinner, type SpinnerSize } from "./ui/spinner";

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: React.ReactNode;
  size?: SpinnerSize;
}

/** Centered spinner with an optional label, for full-area loading. */
export function LoadingState({
  label = tr("<trn-loading>", "Loading…"),
  size = "md",
  className,
  ...props
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground",
        className
      )}
      {...props}
    >
      <Spinner size={size} />
      {label != null && <p className="text-sm">{label}</p>}
    </div>
  );
}
