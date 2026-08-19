import * as React from "react";
import { flexRender, type Cell, type Row } from "@tanstack/react-table";
import { cn } from "../../lib/utils";
import { Checkbox } from "../ui/checkbox";
import { Skeleton } from "../ui/skeleton";

/**
 * Which part of a card a column feeds. Set per column via `meta.card`, so a page
 * defines its data once and gets both views:
 *
 *   { id: "thumb",    meta: { card: "media"  }, cell: ... }
 *   { id: "file",     meta: { card: "title"  }, cell: ... }
 *   { id: "supplier", meta: { card: "meta"   }, cell: ... }
 *   { id: "status",   meta: { card: "status" }, cell: ... }
 *   { id: "actions",  meta: { card: "actions"}, cell: ... }
 *
 * `"none"` keeps a column in the table but off the card, for detail that only
 * earns its space in a dense row.
 */
export type CardSlot = "media" | "title" | "meta" | "status" | "actions" | "none";

export type TableViewMode = "list" | "cards";

export interface CardViewProps<TData> {
  rows: Row<TData>[];
  /** Leading checkbox on each card. Mirrors the table's selection column. */
  enableRowSelection?: boolean;
  onRowClick?: (row: TData) => void;
  loading?: boolean;
  /** Skeleton cards while `loading`. Default 8. */
  skeletonCards?: number;
  emptyMessage?: React.ReactNode;
  /** Minimum card width before the grid reflows to fewer columns. Default 16rem. */
  minCardWidth?: string;
  /**
   * Where the media slot crops from when the image is taller or wider than the slot.
   * Default "top", because the identifying part of a document — letterhead, supplier
   * name, invoice number — is at the top, and a centred crop of a portrait page shows
   * the line items instead. Pass "center" for photos, where the subject is usually
   * middled.
   */
  mediaPosition?: "top" | "center";
  className?: string;
}

function slotOf<TData>(cell: Cell<TData, unknown>): CardSlot | undefined {
  return cell.column.columnDef.meta?.card;
}

/** A column header is only usable as a card label when it is plain text. */
function labelOf<TData>(cell: Cell<TData, unknown>): string | undefined {
  const h = cell.column.columnDef.header;
  return typeof h === "string" && h.trim() !== "" ? h : undefined;
}

function CardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-col gap-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

function RowCard<TData>({
  row,
  enableRowSelection,
  onRowClick,
  mediaPosition,
}: {
  row: Row<TData>;
  enableRowSelection?: boolean;
  onRowClick?: (row: TData) => void;
  mediaPosition?: "top" | "center";
}) {
  const cells = row.getVisibleCells();

  // A page that never sets `meta.card` still gets a usable card: the first column
  // becomes the title and the rest become meta lines. Annotating is an upgrade,
  // not a precondition.
  const annotated = cells.some((c) => slotOf(c) != null);
  const pick = (slot: CardSlot) =>
    annotated
      ? cells.filter((c) => slotOf(c) === slot)
      : slot === "title"
        ? cells.slice(0, 1)
        : slot === "meta"
          ? cells.slice(1)
          : [];

  const media = pick("media")[0];
  const title = pick("title")[0];
  const metas = pick("meta");
  const statuses = pick("status");
  const actions = pick("actions")[0];

  const selected = row.getIsSelected();
  const clickable = !!onRowClick;

  return (
    <div
      data-state={selected ? "selected" : undefined}
      onClick={clickable ? () => onRowClick?.(row.original) : undefined}
      className={cn(
        "group/card relative flex flex-col overflow-hidden rounded-lg border border-border bg-card text-card-foreground transition-colors",
        clickable && "cursor-pointer hover:bg-muted/50",
        selected && "ring-2 ring-ring"
      )}
    >
      {enableRowSelection && (
        <div
          // A round, quiet target rather than a near-opaque square. The backdrop exists only
          // to keep the box legible over arbitrary media, so it is a wash plus a blur instead
          // of a solid panel, and it grows to full opacity once the card is actually selected.
          className={cn(
            "absolute left-2 top-2 z-10 grid size-7 place-items-center rounded-full",
            "bg-background/40 backdrop-blur-sm transition-all",
            "hover:bg-background/70",
            selected && "bg-background/80",
            // Quiet until wanted: the checkbox is chrome over someone's document, so it
            // fades in on hover rather than sitting on every card. Three exceptions, or
            // hiding it makes selection unusable rather than tidy:
            //   selected      — you must be able to see what is selected
            //   focus-within  — a keyboard user never hovers
            //   hover: none   — a touch device never hovers either, so it stays visible
            "opacity-0 group-hover/card:opacity-100 focus-within:opacity-100",
            "[@media(hover:none)]:opacity-100",
            selected && "opacity-100"
          )}
          onClick={(e) => {
            e.stopPropagation();
            if (row.getCanSelect()) row.toggleSelected();
          }}
        >
          <Checkbox
            checked={selected}
            disabled={!row.getCanSelect()}
            onClick={(e) => e.stopPropagation()}
            onCheckedChange={(v) => row.toggleSelected(!!v)}
            aria-label="Select card"
          />
        </div>
      )}

      {media && (
        <div
          // `--trf-media-size` lets a media cell fill the slot without the container
          // having to out-specify its inline styles. ui2's own ThumbnailCell reads it;
          // a custom media cell can too. This is deliberately not a descendant-selector
          // override: Tailwind v4 does not generate two-level arbitrary variants like
          // `[&>*>*]`, so anything wrapped (say a button, to make the image clickable)
          // silently kept its dense-row size.
          style={{ "--trf-media-size": "100%" } as React.CSSProperties}
          className={cn(
            "flex aspect-[4/3] w-full items-center justify-center overflow-hidden border-b border-border bg-muted",
            // A plain custom media cell (a div, an <img>) has no inline size to fight, so a
            // direct-child stretch is enough for it. Note the `!` goes at the END: Tailwind
            // v4's important marker is a suffix, and the v3 prefix form generates nothing.
            "[&>*]:size-full! [&_img]:size-full! [&_img]:object-cover",
            // Crop from the top by default: a portrait page centred in a landscape slot
            // shows its line items, while the letterhead and supplier name that identify
            // it sit at the very top.
            mediaPosition === "center" ? "[&_img]:object-center" : "[&_img]:object-top",
            // Full-bleed media: nothing inside keeps a corner radius or its own border.
            "[&_*]:rounded-none! [&_*]:border-0!"
          )}
        >
          {flexRender(media.column.columnDef.cell, media.getContext())}
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-2 p-3">
        {title && (
          <div className="min-w-0 text-sm font-medium">
            {flexRender(title.column.columnDef.cell, title.getContext())}
          </div>
        )}

        {metas.length > 0 && (
          <dl className="flex min-w-0 flex-col gap-1">
            {metas.map((cell) => {
              const label = labelOf(cell);
              return (
                <div key={cell.id} className="flex min-w-0 items-baseline justify-between gap-2 text-xs">
                  {label && <dt className="shrink-0 text-muted-foreground">{label}</dt>}
                  <dd className={cn("min-w-0", label ? "text-right" : "w-full")}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </dd>
                </div>
              );
            })}
          </dl>
        )}

        {statuses.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {statuses.map((cell) => (
              <React.Fragment key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </React.Fragment>
            ))}
          </div>
        )}

        {actions && (
          <div
            className="mt-auto flex justify-end border-t border-border pt-2"
            onClick={(e) => e.stopPropagation()}
          >
            {flexRender(actions.column.columnDef.cell, actions.getContext())}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * The gallery half of the table infrastructure: the same rows and the same
 * `ColumnDef`s the table renders, laid out as cards. Used through `DataTable` /
 * `ServerDataTable`'s `view` prop rather than directly, so paging, sorting,
 * filtering and selection stay in one place regardless of which view is on.
 */
export function CardView<TData>({
  rows,
  enableRowSelection,
  onRowClick,
  loading,
  skeletonCards = 8,
  emptyMessage,
  minCardWidth = "16rem",
  mediaPosition = "top",
  className,
}: CardViewProps<TData>) {
  const grid = {
    gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}, 1fr))`,
  } as React.CSSProperties;

  if (loading) {
    return (
      <div className={cn("grid gap-3 p-3", className)} style={grid}>
        {Array.from({ length: skeletonCards }, (_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={cn("p-8 text-center text-sm text-muted-foreground", className)}>
        {emptyMessage ?? "No results."}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3 p-3", className)} style={grid}>
      {rows.map((row) => (
        <RowCard
          key={row.id}
          row={row}
          enableRowSelection={enableRowSelection}
          onRowClick={onRowClick}
          mediaPosition={mediaPosition}
        />
      ))}
    </div>
  );
}
