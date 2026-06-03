import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

const SIZE = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
} as const;

export type SpinnerSize = keyof typeof SIZE;

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: SpinnerSize;
}

export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("inline-flex text-muted-foreground", className)}
      {...props}
    >
      <Loader2 className={cn("animate-spin", SIZE[size])} />
    </span>
  );
}
