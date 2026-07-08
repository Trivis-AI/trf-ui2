import * as React from "react";
import { cn } from "../lib/utils";
import { H1 } from "./typography";

const SIZE = {
  sm: "max-w-xl",
  md: "max-w-3xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  "2xl": "max-w-screen-2xl",
  full: "max-w-none",
} as const;

export type PageSize = keyof typeof SIZE;

/** The max-width class for a page size. Lets other layout organisms (e.g. TablePage)
 *  reuse the size scale without re-declaring it. */
export function pageSizeClass(size: PageSize = "lg"): string {
  return SIZE[size];
}

export interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max content width. Default "lg". */
  size?: PageSize;
}

/** Width-constrained, centered page content container. Compose PageHeader + Stack inside. */
export function Page({ size = "lg", className, ...props }: PageProps) {
  return (
    <div className={cn("mx-auto w-full px-6 py-8", SIZE[size], className)} {...props} />
  );
}

export interface PageHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  description?: React.ReactNode;
  /** Right-aligned actions (usually Buttons). */
  actions?: React.ReactNode;
}

/** Page title + optional description + actions row. */
export function PageHeader({
  title,
  description,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn("mb-6 flex items-start justify-between gap-4", className)}
      {...props}
    >
      <div className="flex flex-col gap-1">
        {title != null && <H1>{title}</H1>}
        {description != null && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions != null && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
