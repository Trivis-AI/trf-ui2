import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

/*
 * Typography components. Sizes come from the type-scale tokens (scaled by --font-scale),
 * so they respect the browser font-size and any app-level S/M/L setting.
 * Hierarchy is weight- and color-driven (per the Claude/dense-UI benchmark), not big size jumps.
 * Headings use font-semibold (600) — never font-bold/700.
 */

export interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {}

/** Page title. */
export function H1({ className, ...props }: HeadingProps) {
  return (
    <h1
      className={cn("text-2xl font-semibold leading-tight tracking-tight", className)}
      {...props}
    />
  );
}

/** Section heading. */
export function H2({ className, ...props }: HeadingProps) {
  return (
    <h2
      className={cn("text-xl font-semibold leading-tight tracking-tight", className)}
      {...props}
    />
  );
}

/** Subsection heading. Small size, heavy weight — hierarchy by weight, not size. */
export function H3({ className, ...props }: HeadingProps) {
  return <h3 className={cn("text-base font-semibold leading-snug", className)} {...props} />;
}

const textVariants = cva("", {
  variants: {
    size: {
      xs: "text-xs",
      sm: "text-sm",
      base: "text-base",
      lg: "text-lg",
    },
    tone: {
      default: "",
      muted: "text-muted-foreground",
      destructive: "text-destructive",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
    },
  },
  defaultVariants: {
    size: "sm",
    tone: "default",
    weight: "normal",
  },
});

type TextElement = "p" | "span" | "div" | "label";

export interface TextProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof textVariants> {
  /** Element to render. Default "p". */
  as?: TextElement;
  /** Monospace + tabular-nums — for numbers, IDs, amounts. */
  mono?: boolean;
}

/** Body text. Variants for size / tone / weight; `mono` for figures. */
export function Text({
  as: Tag = "p",
  size,
  tone,
  weight,
  mono = false,
  className,
  ...props
}: TextProps) {
  return (
    <Tag
      className={cn(
        textVariants({ size, tone, weight }),
        mono && "font-mono tabular-nums",
        className
      )}
      {...props}
    />
  );
}
