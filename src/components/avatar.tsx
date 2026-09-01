import { type CSSProperties } from "react";
import { cn } from "../lib/utils";

/*
 * Avatar — a round, bordered badge showing the first letter of a name (e.g. the
 * active organisation). The background colour is derived deterministically from a
 * key (pass the org slug/id as `colorKey` so it stays stable across renames), so
 * the same org always gets the same colour everywhere — no storage needed.
 *
 * `color` overrides that hash with a chosen palette colour, for when the hash is
 * not good enough: two organisations with the same name (a migrated archive and
 * the live copy) hash to two arbitrary hues that say nothing about which is which.
 * An unset (or unrecognised) `color` falls back to the hash, so an org that
 * never picks one looks exactly as it did before this prop existed.
 */

/** The palette, in hash order. Names may not be reordered and the list may not
 *  change length: `hueFor` indexes into it, so either would repaint every org
 *  that relies on the hash. */
export const AVATAR_COLORS = [
  "red", "orange", "amber", "lime", "green", "teal",
  "cyan", "blue", "indigo", "purple", "pink",
] as const;

export type AvatarColor = (typeof AVATAR_COLORS)[number];

/** Palette colour, but any string is accepted so an API field can be passed
 *  straight through; an unknown one just means "keep the hashed colour". */
export type AvatarColorInput = AvatarColor | (string & {});

// A spread of distinct hues; pleasant and legible with white text in both themes.
// Stored as a name, never a hex: the circles work because they are all
// hsl(h 52% 46%) with a computed border, and a free-picked hex would not be.
const HUE: Record<AvatarColor, number> = {
  red: 4, orange: 25, amber: 45, lime: 95, green: 150, teal: 175,
  cyan: 200, blue: 220, indigo: 260, purple: 290, pink: 330,
};

/** Narrow an untrusted value (an API field, a stored preference) to a palette
 *  colour. Anything else is `undefined`, meaning "use the hash". */
export function asAvatarColor(value?: AvatarColorInput | null): AvatarColor | undefined {
  return value && Object.prototype.hasOwnProperty.call(HUE, value)
    ? (value as AvatarColor)
    : undefined;
}

function hueFor(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (Math.imul(h, 31) + key.charCodeAt(i)) >>> 0;
  return HUE[AVATAR_COLORS[h % AVATAR_COLORS.length]];
}

export interface AvatarProps {
  /** Name to take the initial from. */
  name?: string | null;
  /** Stable key for the colour (defaults to `name`). Pass an org slug/id so the
   *  colour survives renames. */
  colorKey?: string | null;
  /** Chosen palette colour. Wins over the hash; unknown values are ignored. */
  color?: AvatarColorInput | null;
  /** Diameter in px. */
  size?: number;
  className?: string;
}

export function Avatar({ name, colorKey, color, size = 28, className }: AvatarProps) {
  const initial = (name?.trim()?.[0] ?? "?").toUpperCase();
  const chosen = asAvatarColor(color);
  const hue = chosen ? HUE[chosen] : hueFor((colorKey ?? name ?? "").toLowerCase());
  // Border contrasts with the page: darker than the fill in light mode, lighter in
  // dark mode (so the circle stays defined on a dark background).
  const style = {
    width: size,
    height: size,
    fontSize: Math.round(size * 0.44),
    backgroundColor: `hsl(${hue} 52% 46%)`,
    color: "#fff",
    "--avatar-border": `hsl(${hue} 52% 32%)`,
    "--avatar-border-dark": `hsl(${hue} 60% 68%)`,
  } as CSSProperties;
  return (
    <span
      aria-hidden
      style={style}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full border font-semibold leading-none",
        "border-[color:var(--avatar-border)] dark:border-[color:var(--avatar-border-dark)]",
        className
      )}
    >
      {initial}
    </span>
  );
}
