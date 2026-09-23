import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

/*
 * The user-assignable swatch palette. Unlike StatusBadge tones these carry no
 * meaning of their own: an org picks one per record (a task category, say) and
 * the name is what gets stored. Never a hex, so both themes stay in the tokens.
 */
export const SWATCH_COLORS = [
  "gray", "red", "orange", "yellow", "lime", "green",
  "teal", "cyan", "blue", "purple", "pink",
] as const;

export type SwatchColor = (typeof SWATCH_COLORS)[number];

/** Palette colour, but any string is accepted so an API field can be passed
 *  straight through; an unknown or empty one renders as gray. */
export type SwatchColorInput = SwatchColor | (string & {});

/** Narrow an untrusted value (an API field) to a palette colour, or `undefined`. */
export function asSwatchColor(value?: SwatchColorInput | null): SwatchColor | undefined {
  return value && (SWATCH_COLORS as readonly string[]).includes(value)
    ? (value as SwatchColor)
    : undefined;
}

// Class strings are spelled out in full so Tailwind can see them.
const colorBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium [&>span]:size-1.5 [&>span]:shrink-0 [&>span]:rounded-full",
  {
    variants: {
      color: {
        gray: "bg-swatch-gray/12 text-swatch-gray [&>span]:bg-swatch-gray",
        red: "bg-swatch-red/12 text-swatch-red [&>span]:bg-swatch-red",
        orange: "bg-swatch-orange/12 text-swatch-orange [&>span]:bg-swatch-orange",
        yellow: "bg-swatch-yellow/12 text-swatch-yellow [&>span]:bg-swatch-yellow",
        lime: "bg-swatch-lime/12 text-swatch-lime [&>span]:bg-swatch-lime",
        green: "bg-swatch-green/12 text-swatch-green [&>span]:bg-swatch-green",
        teal: "bg-swatch-teal/12 text-swatch-teal [&>span]:bg-swatch-teal",
        cyan: "bg-swatch-cyan/12 text-swatch-cyan [&>span]:bg-swatch-cyan",
        blue: "bg-swatch-blue/12 text-swatch-blue [&>span]:bg-swatch-blue",
        purple: "bg-swatch-purple/12 text-swatch-purple [&>span]:bg-swatch-purple",
        pink: "bg-swatch-pink/12 text-swatch-pink [&>span]:bg-swatch-pink",
      },
    },
    defaultVariants: { color: "gray" },
  }
);

/** Solid fill per colour, for the picker's swatches and bare dots. */
export const swatchFill: Record<SwatchColor, string> = {
  gray: "bg-swatch-gray",
  red: "bg-swatch-red",
  orange: "bg-swatch-orange",
  yellow: "bg-swatch-yellow",
  lime: "bg-swatch-lime",
  green: "bg-swatch-green",
  teal: "bg-swatch-teal",
  cyan: "bg-swatch-cyan",
  blue: "bg-swatch-blue",
  purple: "bg-swatch-purple",
  pink: "bg-swatch-pink",
};

export interface ColorBadgeProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "color"> {
  /** Palette colour name. Unknown or empty falls back to gray. */
  color?: SwatchColorInput | null;
}

/**
 * A soft pill with a leading dot, in a user-chosen palette colour (e.g. a task
 * category). Same shape as StatusBadge; use StatusBadge when the colour means a
 * state, ColorBadge when an org picked it.
 */
export function ColorBadge({ color, className, children, ...props }: ColorBadgeProps) {
  return (
    <span className={cn(colorBadgeVariants({ color: asSwatchColor(color) ?? "gray" }), className)} {...props}>
      <span />
      {children}
    </span>
  );
}

export { colorBadgeVariants };
