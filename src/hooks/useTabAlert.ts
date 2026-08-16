import { useEffect, useRef } from 'react';

// Tab-level attention: "(3) Trivis Support" in the title and a red dot on the
// favicon, for as long as there is something to attend to.
//
// It exists because sound is the half of an alert a person can switch off, and
// most people do. The tab strip is where somebody with fifteen tabs open
// actually looks, and a count there survives mute, a muted browser tab, and a
// laptop with the volume down. Pair it with the audible alert rather than
// choosing between them.
//
// The favicon badge is best-effort by design: it is drawn on a canvas from
// whatever icon the page already has, and a page can have no icon, an icon the
// canvas refuses to taint-free draw, or no canvas at all. Every one of those
// falls back to the title alone, which is the part that always works.

export interface TabAlertOptions {
  /** Shown as "(count) title". Zero or less clears the alert. */
  count: number;
  /**
   * The title to count against. Defaults to whatever the document had when the
   * hook first ran, which is the value from index.html.
   */
  title?: string;
  /** Badge colour. Defaults to the destructive red the badges use. */
  color?: string;
}

const BADGE_SIZE = 64;

function drawBadge(baseHref: string | null, color: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = BADGE_SIZE;
      canvas.height = BADGE_SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      const dot = () => {
        // Bottom-right, with a hole punched behind it so the dot reads at 16px
        // against a busy icon instead of blending into it.
        const r = BADGE_SIZE * 0.28;
        const cx = BADGE_SIZE - r - 2;
        const cy = BADGE_SIZE - r - 2;
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(cx, cy, r * 1.25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
        try {
          resolve(canvas.toDataURL('image/png'));
        } catch {
          // Tainted canvas — a cross-origin icon. Title-only from here.
          resolve(null);
        }
      };

      if (!baseHref) {
        dot();
        return;
      }
      const img = new Image();
      // Same-origin icons only; anything else taints the canvas and toDataURL
      // throws, which the catch above turns into the title-only fallback.
      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0, BADGE_SIZE, BADGE_SIZE);
        } catch {
          // An SVG without intrinsic dimensions. The dot alone still reads.
        }
        dot();
      };
      img.onerror = () => dot();
      img.src = baseHref;
    } catch {
      resolve(null);
    }
  });
}

export function useTabAlert({ count, title, color = '#dc2626' }: TabAlertOptions): void {
  // Captured once, before anything has been prefixed, so a re-render during an
  // active alert cannot bake "(1) " into the base title permanently.
  const baseTitleRef = useRef<string | null>(null);
  const baseIconRef = useRef<string | null>(null);
  const linkRef = useRef<HTMLLinkElement | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (baseTitleRef.current === null) baseTitleRef.current = document.title;
    if (linkRef.current === null) {
      const existing = document.querySelector<HTMLLinkElement>('link[rel~="icon"]');
      baseIconRef.current = existing?.href ?? null;
      if (existing) {
        linkRef.current = existing;
      } else {
        // No icon at all (this console ships none). Create one so the badge has
        // somewhere to live; it is removed again when the alert clears.
        const link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
        linkRef.current = link;
      }
    }
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const base = title ?? baseTitleRef.current ?? document.title;
    let cancelled = false;

    if (count > 0) {
      document.title = `(${count}) ${base}`;
      void drawBadge(baseIconRef.current, color).then((href) => {
        if (cancelled || !href || !linkRef.current) return;
        linkRef.current.href = href;
      });
    } else {
      document.title = base;
      if (linkRef.current) {
        if (baseIconRef.current) linkRef.current.href = baseIconRef.current;
        else linkRef.current.removeAttribute('href');
      }
    }

    return () => {
      cancelled = true;
    };
  }, [count, title, color]);

  // Leave the tab as we found it: a console left open on another route must not
  // keep claiming somebody is waiting.
  useEffect(
    () => () => {
      if (typeof document === 'undefined') return;
      if (baseTitleRef.current !== null) document.title = baseTitleRef.current;
      if (linkRef.current && baseIconRef.current) linkRef.current.href = baseIconRef.current;
    },
    [],
  );
}
