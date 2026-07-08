import * as React from "react";
import { Avatar } from "../../avatar";
import { cn } from "../../../lib/utils";
import { CellHoverCard, type HoverCardSeamProps } from "./hover-card-seam";

/**
 * AvatarCell — the people/contacts variant of a thumbnail. Shows a photo when a
 * source is given, otherwise the deterministic initials avatar. Optional name and
 * a secondary sub-line (email, role, handle) render to the right, both truncated.
 * A fixed avatar size keeps rows uniform for virtualization (plan 4.7).
 */
export interface AvatarCellProps extends HoverCardSeamProps {
  /** Person or contact name. Drives the initials and the primary label. */
  name?: string | null;
  /** Optional photo URL. Falls back to the initials avatar if empty or it fails. */
  src?: string | null;
  /** Stable key for the initials colour (defaults to name). Pass an id to survive renames. */
  colorKey?: string | null;
  /** Avatar diameter in px. Default 28. Keep uniform per table. */
  size?: number;
  /** Optional secondary line under the name. */
  subLine?: React.ReactNode;
  className?: string;
}

export function AvatarCell({
  name,
  src,
  colorKey,
  size = 28,
  subLine,
  className,
  hoverCard,
}: AvatarCellProps) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [src]);

  const displayName = name?.trim() || undefined;
  const showImage = Boolean(src) && !failed;

  return (
    <CellHoverCard hoverCard={hoverCard}>
      <span className={cn("inline-flex items-center gap-2 text-sm", className)}>
        {showImage ? (
          <img
            src={src as string}
            alt={displayName ?? ""}
            loading="lazy"
            width={size}
            height={size}
            style={{ width: size, height: size }}
            onError={() => setFailed(true)}
            className="shrink-0 rounded-full border border-border object-cover"
          />
        ) : (
          <Avatar name={displayName} colorKey={colorKey ?? undefined} size={size} />
        )}

        {(displayName || subLine) && (
          <span className="flex min-w-0 flex-col leading-tight">
            {displayName && <span className="truncate font-medium">{displayName}</span>}
            {subLine && (
              <span className="truncate text-xs text-muted-foreground">{subLine}</span>
            )}
          </span>
        )}
      </span>
    </CellHoverCard>
  );
}
