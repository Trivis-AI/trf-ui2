import * as React from "react";
import { ImageOff } from "lucide-react";
import { cn } from "../../../lib/utils";
import { CellHoverCard, type HoverCardSeamProps } from "./hover-card-seam";

/**
 * ThumbnailCell — a fixed-size, rounded image for product photos, logos, and the
 * like. Lazy-loaded, with an icon placeholder when there is no source or the
 * image fails to load. The box is a fixed size so rows keep a uniform height,
 * which keeps virtualization simple (plan 4.7 virtualization note).
 */
export interface ThumbnailCellProps extends HoverCardSeamProps {
  /** Image URL. Empty or a load failure shows the placeholder. */
  src?: string | null;
  /** Accessible description, required. Used as the image alt and placeholder label. */
  alt: string;
  /** Box size in px (square). Default 40. Keep uniform per table. */
  size?: number;
  /** Corner rounding. Default "md". Use "full" for round chips. */
  rounded?: "md" | "lg" | "full";
  className?: string;
}

const radiusClass = {
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
} as const;

export function ThumbnailCell({
  src,
  alt,
  size = 40,
  rounded = "md",
  className,
  hoverCard,
}: ThumbnailCellProps) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [src]);

  const showImage = Boolean(src) && !failed;

  return (
    <CellHoverCard hoverCard={hoverCard}>
      <span
        style={{ width: size, height: size }}
        title={alt}
        role={showImage ? undefined : "img"}
        aria-label={showImage ? undefined : alt}
        className={cn(
          "inline-flex shrink-0 items-center justify-center overflow-hidden border border-border bg-muted text-muted-foreground",
          radiusClass[rounded],
          className
        )}
      >
        {showImage ? (
          <img
            src={src as string}
            alt={alt}
            loading="lazy"
            width={size}
            height={size}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <ImageOff aria-hidden className="size-4" />
        )}
      </span>
    </CellHoverCard>
  );
}
