import * as React from "react";
import { cn } from "../lib/utils";
import { RadioCard } from "./ui/radio-card";

export interface PaletteOption {
  /** The palette's key: `theme-<value>` is its class, except the base "trivis" (no class). */
  value: string;
  label: string;
}

/** True while <html> carries `.dark`; follows the light/dark switch live. */
function useDocumentDark(): boolean {
  const [dark, setDark] = React.useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  React.useEffect(() => {
    const el = document.documentElement;
    const sync = () => setDark(el.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

export interface PaletteSwatchesProps {
  palette: string;
  /** Force light or dark; by default it follows `.dark` on <html>. */
  dark?: boolean;
  className?: string;
}

/*
 * Four swatches of one palette (primary, secondary, accent, muted). The wrapper carries
 * the palette's class, plus `.dark` in dark mode because `.theme-x.dark` needs both on
 * one element, so the dots show THAT palette's tokens wherever they sit.
 */
export function PaletteSwatches({ palette, dark, className }: PaletteSwatchesProps) {
  const documentDark = useDocumentDark();
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center gap-0.5",
        palette !== "trivis" && `theme-${palette}`,
        (dark ?? documentDark) && "dark",
        className,
      )}
    >
      {["bg-primary", "bg-secondary", "bg-accent", "bg-muted"].map((c) => (
        <span key={c} className={cn("size-3 rounded-full ring-1 ring-black/10 dark:ring-white/20", c)} />
      ))}
    </span>
  );
}

export interface PalettePickerProps {
  options: PaletteOption[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  "aria-label"?: string;
}

/**
 * Choose a colour palette: a RadioCard per palette with its swatches and name.
 * Presentational: the caller stores and applies the choice (app-shell's `usePalette`).
 */
export function PalettePicker({ options, value, onValueChange, className, ...aria }: PalettePickerProps) {
  return (
    <div role="radiogroup" className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)} {...aria}>
      {options.map((o) => (
        <RadioCard
          key={o.value}
          selected={o.value === value}
          onClick={() => onValueChange(o.value)}
          icon={<PaletteSwatches palette={o.value} />}
          title={o.label}
          className="items-center p-3"
        />
      ))}
    </div>
  );
}
