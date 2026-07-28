import * as React from "react";
import { cn } from "../lib/utils";

/**
 * Third-party brand marks (Apple, Google, …) as inline SVG components.
 *
 * Why inline and not `import icon from "./assets/apple.svg"`: @trf/ui2 ships raw source, so a
 * file import would push asset handling and `*.svg` type declarations onto all 14 consumer apps.
 * Inline paths need zero consumer config, tree-shake, and can inherit `currentColor`.
 *
 * The .svg files in `src/assets/` stay as the design source of truth — see `src/assets/README.md`
 * for how to add a new mark.
 *
 * Lucide is still the only *icon* library (docs/05-iconography.md). This registry is for company
 * marks Lucide does not and will not carry.
 */

export type BrandMarkName = "apple" | "google";

interface MarkDef {
  /** Accessible label / display name. */
  label: string;
  viewBox: string;
  /** Intrinsic dimensions from the source SVG — drive the aspect ratio. */
  width: number;
  height: number;
  /**
   * True when the mark is a single flat shape we may recolor (it uses `currentColor`, so it
   * follows the surrounding text token). False when the brand's own palette is part of the mark
   * and must not be tinted.
   */
  monochrome: boolean;
  children: React.ReactNode;
}

const MARKS: Record<BrandMarkName, MarkDef> = {
  apple: {
    label: "Apple",
    viewBox: "0 0 15 19",
    width: 15,
    height: 19,
    monochrome: true,
    children: (
      <path
        d="M7.72266 4.38461C8.55469 4.38461 9.59766 3.80483 10.2188 3.03179C10.7812 2.33121 11.1914 1.35283 11.1914 0.374443C11.1914 0.241576 11.1797 0.108709 11.1562 0C10.2305 0.0362365 9.11719 0.640177 8.44922 1.44946C7.92188 2.06548 7.44141 3.03179 7.44141 4.02225C7.44141 4.1672 7.46484 4.31214 7.47656 4.36046C7.53516 4.37254 7.62891 4.38461 7.72266 4.38461ZM4.79297 19C5.92969 19 6.43359 18.2149 7.85156 18.2149C9.29297 18.2149 9.60938 18.9758 10.875 18.9758C12.1172 18.9758 12.9492 17.7921 13.7344 16.6325C14.6133 15.3039 14.9766 13.9994 15 13.939C14.918 13.9148 12.5391 12.9123 12.5391 10.0979C12.5391 7.65798 14.4141 6.5588 14.5195 6.47425C13.2773 4.63827 11.3906 4.58996 10.875 4.58996C9.48047 4.58996 8.34375 5.45963 7.62891 5.45963C6.85547 5.45963 5.83594 4.63827 4.62891 4.63827C2.33203 4.63827 0 6.59504 0 10.2912C0 12.5861 0.867188 15.014 1.93359 16.5842C2.84766 17.9129 3.64453 19 4.79297 19Z"
        fill="currentColor"
      />
    ),
  },
  google: {
    label: "Google",
    viewBox: "0 0 16 16",
    width: 16,
    height: 16,
    monochrome: false,
    children: (
      <>
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M14.4 8.15145C14.4 7.67872 14.3576 7.22417 14.2788 6.78781H8V9.3666H11.5879C11.4333 10.1999 10.9636 10.906 10.2576 11.3787V13.0514H12.4121C13.6727 11.8908 14.4 10.1818 14.4 8.15145Z"
          fill="#4285F4"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8 14.6667C9.8 14.6667 11.3091 14.0697 12.4121 13.0515L10.2576 11.3788C9.6606 11.7788 8.89697 12.0151 8 12.0151C6.26363 12.0151 4.79393 10.8424 4.26969 9.26665H2.04242V10.9939C3.13939 13.1727 5.39393 14.6667 8 14.6667Z"
          fill="#34A853"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M4.26971 9.26663C4.13637 8.86663 4.06062 8.43936 4.06062 7.99997C4.06062 7.56057 4.13637 7.1333 4.26971 6.7333V5.00603H2.04243C1.59092 5.90603 1.33334 6.92421 1.33334 7.99997C1.33334 9.07572 1.59092 10.0939 2.04243 10.9939L4.26971 9.26663Z"
          fill="#FBBC05"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8 3.98485C8.97878 3.98485 9.85757 4.32122 10.5485 4.98182L12.4606 3.0697C11.3061 1.99394 9.79697 1.33334 8 1.33334C5.39393 1.33334 3.13939 2.82728 2.04242 5.00606L4.26969 6.73334C4.79393 5.15758 6.26363 3.98485 8 3.98485Z"
          fill="#EA4335"
        />
      </>
    ),
  },
};

/** Every registered mark, for iteration (pickers, the kitchen-sink demo). */
export const BRAND_MARKS: { name: BrandMarkName; label: string; monochrome: boolean }[] = (
  Object.keys(MARKS) as BrandMarkName[]
).map((name) => ({ name, label: MARKS[name].label, monochrome: MARKS[name].monochrome }));

export interface BrandMarkProps extends Omit<React.SVGAttributes<SVGSVGElement>, "name" | "children"> {
  /** Which mark to render. */
  name: BrandMarkName;
  /** Size of the square box the mark fits into, in px. Default 16. Aspect ratio is preserved. */
  size?: number;
  /**
   * Accessible name. Omit for decoration next to visible text (e.g. "Continue with Apple"),
   * where the mark renders `aria-hidden`.
   */
  label?: string;
}

/**
 * Renders a third-party brand mark by name.
 *
 * ```tsx
 * <Button variant="secondary"><BrandMark name="google" /> Continue with Google</Button>
 * <BrandMark name="apple" size={32} className="text-foreground" label="Apple" />
 * ```
 *
 * Monochrome marks (Apple) inherit `currentColor` like a Lucide icon, so they follow the
 * surrounding text token in both themes and on inverted surfaces — no `className` needed inside a
 * `Button variant="inverse"`. Multicolor marks (Google) keep the brand palette and ignore text
 * color, as their guidelines require.
 */
export function BrandMark({ name, size = 16, label, className, ...props }: BrandMarkProps) {
  const def = MARKS[name];
  if (!def) return null;

  const scale = size / Math.max(def.width, def.height);
  const round = (n: number) => Math.round(n * 100) / 100;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={round(def.width * scale)}
      height={round(def.height * scale)}
      viewBox={def.viewBox}
      fill="none"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={cn("shrink-0", className)}
      {...props}
    >
      {def.children}
    </svg>
  );
}

/** Convenience wrappers — `AppleMark` rather than `Apple`, which is a Lucide fruit icon. */
export function AppleMark(props: Omit<BrandMarkProps, "name">) {
  return <BrandMark name="apple" {...props} />;
}

export function GoogleMark(props: Omit<BrandMarkProps, "name">) {
  return <BrandMark name="google" {...props} />;
}
