import * as React from "react";
import { flexRender, type CellContext, type ColumnDef } from "@tanstack/react-table";
import { cn } from "../../lib/utils";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../ui/select";
import type { CellEditor } from "./table-view";

/**
 * Inline editing for read-heavy tables.
 *
 * `EditableDataTable` renders a live control in every editable cell, which is
 * right for a short config grid where editing *is* the point. A list view is the
 * opposite: it is read most of the time, and a screenful of always-open selects
 * turns into visual noise that competes with the data.
 *
 * So this variant stays quiet. The cell shows the column's normal rendered
 * content (badge, text, whatever the column already draws); the control only
 * announces itself on hover or keyboard focus, and opens on click. A cell that
 * looks static but reacts to clicks is worse than either extreme, so the
 * affordance is deliberately visible before the click, not after it.
 */

// Shared quiet-affordance styling: invisible until hover/focus/open, at which
// point the cell picks up a border and a muted background.
const QUIET =
  "rounded-md border border-transparent transition-colors " +
  "hover:border-input hover:bg-muted/50 " +
  "focus-visible:outline-none focus-visible:border-input focus-visible:bg-muted/50 " +
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background";

/** Renders the column's own cell output, so display never diverges from the
 *  non-editable version of the same column. */
function Display<TData>({
  ctx,
  display,
}: {
  ctx: CellContext<TData, unknown>;
  display: ColumnDef<TData, any>["cell"];
}) {
  if (display) return <>{flexRender(display, ctx)}</>;
  const v = ctx.getValue();
  return <>{v == null ? "" : String(v)}</>;
}

// Click (or focus + Enter) to swap the display for an input. Commits on blur and
// Enter, reverts on Escape.
function QuietTextEditor<TData>({
  ctx,
  display,
  editor,
  align,
  onCommit,
}: {
  ctx: CellContext<TData, unknown>;
  display: ColumnDef<TData, any>["cell"];
  editor: Extract<CellEditor, { type: "text" | "number" }>;
  align?: "left" | "right" | "center";
  onCommit: (value: unknown) => void;
}) {
  const initial = ctx.getValue();
  const initialStr = initial == null ? "" : String(initial);
  const [editing, setEditing] = React.useState(false);
  const [value, setValue] = React.useState(initialStr);
  React.useEffect(() => setValue(initialStr), [initialStr]);
  // Escape sets this so the ensuing blur skips the commit.
  const reverting = React.useRef(false);

  const commit = () => {
    setEditing(false);
    if (reverting.current) {
      reverting.current = false;
      return;
    }
    if (value === initialStr) return;
    onCommit(editor.type === "number" ? (value === "" ? null : Number(value)) : value);
  };

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className={cn(
          QUIET,
          "flex w-full items-center gap-1 px-1.5 py-0.5 text-left",
          align === "right" && "justify-end text-right",
          align === "center" && "justify-center text-center"
        )}
      >
        <Display ctx={ctx} display={display} />
      </button>
    );
  }

  return (
    <Input
      autoFocus
      type={editor.type === "number" ? "number" : "text"}
      value={value}
      placeholder={editor.placeholder}
      min={editor.type === "number" ? editor.min : undefined}
      max={editor.type === "number" ? editor.max : undefined}
      step={editor.type === "number" ? editor.step : undefined}
      className={cn(
        "h-8",
        align === "right" && "text-right tabular-nums",
        align === "center" && "text-center"
      )}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          e.preventDefault();
          reverting.current = true;
          setValue(initialStr);
          e.currentTarget.blur();
        }
      }}
    />
  );
}

export interface InlineEditCellProps<TData> {
  ctx: CellContext<TData, unknown>;
  /** The column's original `cell`, reused for the read-only display. */
  display: ColumnDef<TData, any>["cell"];
}

export function InlineEditCell<TData>({ ctx, display }: InlineEditCellProps<TData>) {
  const { row, column, table } = ctx;
  const meta = column.columnDef.meta;
  const editor: CellEditor = meta?.editor ?? { type: "text" };
  const align = meta?.align;
  const readOnly = table.options.meta?.inlineEditReadOnly;

  const commit = React.useCallback(
    (value: unknown) => table.options.meta?.updateData?.(row.index, column.id, value),
    [table, row.index, column.id]
  );

  // Permission-gated tables render the plain display with no affordance at all.
  // A disabled-looking control still invites the click; nothing to click is
  // clearer, and matches how the column reads when it is not editable.
  if (readOnly) {
    return (
      <div
        className={cn(
          "flex px-1.5",
          align === "right" && "justify-end",
          align === "center" && "justify-center"
        )}
      >
        <Display ctx={ctx} display={display} />
      </div>
    );
  }

  let control: React.ReactNode;
  if (editor.type === "select") {
    const current = ctx.getValue();
    control = (
      <Select
        value={current == null ? "" : String(current)}
        onValueChange={commit}
      >
        <SelectTrigger
          className={cn(
            QUIET,
            // Override the default bordered-input look: no chrome until hover.
            "h-auto w-full gap-1 border-transparent bg-transparent px-1.5 py-0.5 shadow-none",
            "data-[state=open]:border-input data-[state=open]:bg-muted/50",
            // The chevron is the affordance: hidden at rest, shown on
            // hover/focus/open. Scoped to the trigger's own direct-child svg —
            // a descendant selector would also blank out any icon the column's
            // display cell renders (IconCell, a status glyph, an avatar).
            "[&>span]:line-clamp-none [&>svg]:opacity-0 [&>svg]:transition-opacity",
            "hover:[&>svg]:opacity-60 focus-visible:[&>svg]:opacity-60 data-[state=open]:[&>svg]:opacity-60"
          )}
        >
          <Display ctx={ctx} display={display} />
        </SelectTrigger>
        <SelectContent>
          {editor.options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  } else if (editor.type === "switch") {
    // Already compact and self-evident; no quiet treatment needed.
    control = <Switch checked={!!ctx.getValue()} onCheckedChange={commit} />;
  } else {
    control = (
      <QuietTextEditor
        ctx={ctx}
        display={display}
        editor={editor}
        align={align}
        onCommit={commit}
      />
    );
  }

  // Stop clicks inside the editor from reaching the row's click handler, or
  // every status change would also expand/navigate the row.
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "flex",
        align === "right" && "justify-end",
        align === "center" && "justify-center"
      )}
    >
      {control}
    </div>
  );
}
