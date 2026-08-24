"use client";

import * as React from "react";
import { Toaster as SonnerToaster, toast, type ToasterProps } from "sonner";
import { CircleCheck, CircleX, Info, Loader2, TriangleAlert } from "lucide-react";

/*
 * Toaster — sonner, bridged onto the token contract.
 *
 * Mount ONE <Toaster /> at the app root (next to the router/providers). Fire
 * toasts from anywhere via the re-exported `toast`:
 *
 *   import { toast } from "@trf/ui2";
 *   toast.success("Invoice sent");
 *
 * The visual bridge (colors, font, type-scale size, status-token icons) lives in
 * `styles/tokens.css` under "Toasts (sonner)", so toasts follow the active theme
 * AND palette. Keep `richColors` off — its pastel backgrounds are hardcoded in
 * sonner and ignore our tokens.
 */

/** Track the `dark` class on <html> so sonner's theme follows the app's. */
function useResolvedTheme(): "light" | "dark" {
  const [dark, setDark] = React.useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  React.useEffect(() => {
    const el = document.documentElement;
    const observer = new MutationObserver(() => setDark(el.classList.contains("dark")));
    observer.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark ? "dark" : "light";
}

export function Toaster(props: ToasterProps) {
  const theme = useResolvedTheme();
  return (
    <SonnerToaster
      theme={theme}
      // Lucide icons (doc 05) instead of sonner's built-ins; colored per type in tokens.css.
      icons={{
        success: <CircleCheck className="size-4" />,
        info: <Info className="size-4" />,
        warning: <TriangleAlert className="size-4" />,
        error: <CircleX className="size-4" />,
        loading: <Loader2 className="size-4 animate-spin" />,
      }}
      // Sonner's contract for theming is these inline CSS vars; they point at
      // tokens, so light/dark/palette switching keeps working (and inline wins
      // over sonner's own [data-sonner-theme] defaults regardless of style
      // injection order).
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { toast };
export type { ToasterProps };
