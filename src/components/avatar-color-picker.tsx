import { Shuffle } from "lucide-react";
import { cn } from "../lib/utils";
import { Avatar, AVATAR_COLORS, asAvatarColor, type AvatarColor, type AvatarColorInput } from "./avatar";

/*
 * AvatarColorPicker: the eleven palette colours as swatches, plus an "automatic"
 * swatch that clears the choice and goes back to the colour hashed from the key.
 * Each swatch is the real Avatar in that colour, so what you pick is what you get.
 */

export interface AvatarColorPickerProps {
  /** Current colour; anything outside the palette reads as "automatic". */
  value?: AvatarColorInput | null;
  /** Fires with the picked colour, or `null` for automatic. */
  onChange: (color: AvatarColor | null) => void;
  /** Name the swatches show the initial of. */
  name?: string | null;
  /** Key the automatic swatch hashes (the org slug), as `Avatar` does. */
  colorKey?: string | null;
  /** Swatch diameter in px. */
  size?: number;
  autoLabel?: string;
  disabled?: boolean;
  className?: string;
}

export function AvatarColorPicker({
  value,
  onChange,
  name,
  colorKey,
  size = 28,
  autoLabel = "Automatic",
  disabled = false,
  className,
}: AvatarColorPickerProps) {
  const current = asAvatarColor(value);
  const swatch = (
    key: string,
    label: string,
    color: AvatarColor | null,
    selected: boolean
  ) => (
    <button
      key={key}
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(color)}
      className={cn(
        "relative inline-flex rounded-full transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background"
      )}
    >
      <Avatar name={name} colorKey={colorKey} color={color} size={size} />
      {/* The automatic swatch shows the hashed colour, which is one of the eleven,
          so it needs a mark of its own or it reads as a duplicate of that colour. */}
      {color === null && (
        <Shuffle
          className="pointer-events-none absolute inset-0 m-auto size-3.5 text-white"
          strokeWidth={2.5}
        />
      )}
    </button>
  );
  return (
    <div role="radiogroup" className={cn("flex flex-wrap items-center gap-2", className)}>
      {swatch("auto", autoLabel, null, !current)}
      <span className="mx-1 h-6 w-px shrink-0 bg-border" aria-hidden />
      {AVATAR_COLORS.map((c) => swatch(c, c, c, current === c))}
    </div>
  );
}
