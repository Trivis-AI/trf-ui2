import { type CSSProperties, type ReactNode } from "react";
import { cn } from "../lib/utils";
import { avatarHue, type AvatarColorInput } from "./avatar";

/*
 * OrgTag: the short mark that says WHICH organisation this is when two of them
 * share a company name ("ARHIIV", "MERIT", "2024").
 *
 * It is filled in the same hue as the org's Avatar rather than stroked, for two
 * reasons: an outline pill is too quiet to catch the eye on a scan of 17 rows,
 * and matching the circle makes the pair read as one mark instead of two
 * unrelated ones. The hue comes from `avatarHue`, so it tracks the chosen colour
 * and falls back to the hashed one exactly as the circle does.
 */

export interface OrgTagProps {
  /** The mark itself. Rendered uppercase; keep it to ~8 characters. */
  children: ReactNode;
  /** Same three inputs as the org's `Avatar`, so the pill matches the circle. */
  color?: AvatarColorInput | null;
  colorKey?: string | null;
  name?: string | null;
  className?: string;
}

export function OrgTag({ children, color, colorKey, name, className }: OrgTagProps) {
  const hue = avatarHue({ color, colorKey, name });
  const style = {
    backgroundColor: `hsl(${hue} 52% 46%)`,
    color: "#fff",
    "--org-tag-border": `hsl(${hue} 52% 32%)`,
    "--org-tag-border-dark": `hsl(${hue} 60% 68%)`,
  } as CSSProperties;
  return (
    <span
      style={style}
      className={cn(
        "inline-flex shrink-0 select-none items-center rounded-full border px-1.5 text-xs font-semibold uppercase leading-normal tracking-wide",
        "border-[color:var(--org-tag-border)] dark:border-[color:var(--org-tag-border-dark)]",
        className
      )}
    >
      {children}
    </span>
  );
}
