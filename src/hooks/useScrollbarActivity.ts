import * as React from "react";

/** How long after the last scroll event a box stays marked. */
const SETTLE_MS = 700;

let installed = 0;
let uninstall: (() => void) | null = null;

/**
 * Marks a scrolling box with `data-scrolling` while it scrolls and clears the mark shortly
 * after the last scroll event. tokens.css draws the thin scrollbar thumb only while the pointer
 * is over the box or while this attribute is set, so wheel and keyboard scrolling with the
 * pointer elsewhere still show where the box is. One capturing listener on the document, shared
 * by every caller; AppShell installs it, so apps on the shell need nothing.
 */
export function installScrollbarActivity(): () => void {
  if (typeof document === "undefined") return () => {};
  if (installed++ === 0) {
    const timers = new WeakMap<Element, number>();
    const onScroll = (e: Event) => {
      const target = e.target === document ? document.documentElement : e.target;
      if (!(target instanceof Element)) return;
      target.setAttribute("data-scrolling", "");
      const prev = timers.get(target);
      if (prev !== undefined) window.clearTimeout(prev);
      timers.set(
        target,
        window.setTimeout(() => {
          target.removeAttribute("data-scrolling");
          timers.delete(target);
        }, SETTLE_MS),
      );
    };
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    uninstall = () => document.removeEventListener("scroll", onScroll, { capture: true });
  }
  return () => {
    if (--installed === 0) {
      uninstall?.();
      uninstall = null;
    }
  };
}

/** React form of installScrollbarActivity: installed while the component is mounted. */
export function useScrollbarActivity(enabled = true): void {
  React.useEffect(() => (enabled ? installScrollbarActivity() : undefined), [enabled]);
}
