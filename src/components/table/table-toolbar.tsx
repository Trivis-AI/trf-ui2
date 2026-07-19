import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, ChevronRight, GripVertical, SlidersHorizontal, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { SearchInput } from "../ui/search-input";
import { Popover, PopoverTrigger, PopoverContent } from "../ui/popover";

/* -------------------------------------------------------- TableSearch */

export interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /**
   * Debounce onChange by this many ms. Leave unset when the state owner already
   * debounces (e.g. useTableQuery.setSearch), so debouncing does not double up.
   */
  debounceMs?: number;
  className?: string;
}

/**
 * The quick-filter search input. Always toolbar-left (via TablePage.search), also
 * exported for standalone use. Clears via the trailing button.
 */
export function TableSearch({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs,
  className,
}: TableSearchProps) {
  const [local, setLocal] = React.useState(value);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Keep local in sync when the source value changes externally (e.g. Clear).
  React.useEffect(() => setLocal(value), [value]);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const emit = (next: string) => {
    setLocal(next);
    if (!debounceMs) {
      onChange(next);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(next), debounceMs);
  };

  return (
    <SearchInput
      value={local}
      onChange={(e) => emit(e.target.value)}
      onClear={() => emit("")}
      placeholder={placeholder}
      className={cn("w-full sm:w-64", className)}
    />
  );
}

/* ------------------------------------------------- TableColumnOptions */

export interface TableColumnOption {
  id: string;
  /** Display label in the menu. */
  label: string;
  /** If false, the column cannot be hidden (checkbox stays on and disabled). Default true. */
  hideable?: boolean;
}

export interface TableColumnOptionsProps {
  /** Columns the menu can toggle / reorder, in their current display order source. */
  columns: TableColumnOption[];
  /** Controlled visibility map; a missing id counts as visible. */
  visibility: Record<string, boolean>;
  onVisibilityChange: (next: Record<string, boolean>) => void;
  /** Controlled column order (ids). */
  order: string[];
  onOrderChange: (next: string[]) => void;
  /** Allow drag reordering. Default true. */
  enableReorder?: boolean;
  /** Render a compact icon-only trigger (for attaching to the table's top-right). */
  iconOnly?: boolean;
  className?: string;
}

function SortableColumnRow({
  option,
  visible,
  onToggle,
  enableReorder,
}: {
  option: TableColumnOption;
  visible: boolean;
  onToggle: (visible: boolean) => void;
  enableReorder: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: option.id, disabled: !enableReorder });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 1 : undefined,
  };
  const hideable = option.hideable !== false;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-muted/60"
    >
      {enableReorder && (
        <span
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder ${option.label}`}
          className="cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing [&_svg]:size-4"
        >
          <GripVertical />
        </span>
      )}
      <Checkbox
        id={`col-opt-${option.id}`}
        checked={visible}
        disabled={!hideable}
        onCheckedChange={(v) => onToggle(!!v)}
      />
      <label
        htmlFor={`col-opt-${option.id}`}
        className={cn("flex-1 cursor-pointer truncate text-sm", !hideable && "cursor-default")}
      >
        {option.label}
      </label>
    </div>
  );
}

/**
 * A menu to hide/show and drag-reorder columns. Fully controlled: pass the same
 * columnVisibility / columnOrder you give ServerDataTable. Always toolbar-right
 * (via TablePage.columnOptions).
 */
export function TableColumnOptions({
  columns,
  visibility,
  onVisibilityChange,
  order,
  onOrderChange,
  enableReorder = true,
  iconOnly = false,
  className,
}: TableColumnOptionsProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Resolve the display order: honor `order`, then append any columns it omits.
  const byId = new Map(columns.map((c) => [c.id, c]));
  const ordered: TableColumnOption[] = [];
  for (const id of order) {
    const opt = byId.get(id);
    if (opt) {
      ordered.push(opt);
      byId.delete(id);
    }
  }
  for (const c of columns) if (byId.has(c.id)) ordered.push(c);
  const orderedIds = ordered.map((c) => c.id);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = orderedIds.indexOf(active.id as string);
    const to = orderedIds.indexOf(over.id as string);
    if (from < 0 || to < 0) return;
    onOrderChange(arrayMove(orderedIds, from, to));
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="secondary"
          size={iconOnly ? "icon" : "sm"}
          aria-label="Columns"
          title="Columns"
          className={className}
        >
          <SlidersHorizontal />
          {!iconOnly && "Columns"}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-2">
        <p className="px-1.5 py-1 text-xs font-medium text-muted-foreground">Columns</p>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col">
              {ordered.map((option) => (
                <SortableColumnRow
                  key={option.id}
                  option={option}
                  visible={visibility[option.id] !== false}
                  onToggle={(v) => onVisibilityChange({ ...visibility, [option.id]: v })}
                  enableReorder={enableReorder}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </PopoverContent>
    </Popover>
  );
}

/* ---------------------------------------------------- TablePagination */

export interface TablePaginationProps {
  pageIndex: number;
  pageCount: number;
  rowCount?: number;
  onPageChange: (index: number) => void;
  className?: string;
}

/** The table footer: "Page X of Y", "N total", and Prev/Next. */
export function TablePagination({
  pageIndex,
  pageCount,
  rowCount,
  onPageChange,
  className,
}: TablePaginationProps) {
  const totalPages = pageCount > 0 ? pageCount : 1;
  const canPrev = pageIndex > 0;
  const canNext = pageCount < 0 ? true : pageIndex < pageCount - 1;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 text-sm text-muted-foreground",
        className
      )}
    >
      <span>
        Page {pageIndex + 1} of {totalPages}
        {rowCount != null && (
          <>
            {" · "}
            {rowCount} total
          </>
        )}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={!canPrev}
        >
          <ChevronLeft />
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={!canNext}
        >
          Next
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------ TableFilterBar */

export interface TableFilterBarProps {
  children: React.ReactNode;
  /** Whether any filter is currently active (drives the auto Clear button). */
  active?: boolean;
  /** Called when the Clear button is pressed. Shown only when `active`. */
  onClear?: () => void;
  className?: string;
}

/**
 * Wraps filter controls with uniform spacing and shows a primary "Clear" button
 * automatically whenever any filter is active.
 */
export function TableFilterBar({ children, active, onClear, className }: TableFilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      {children}
      {active && onClear && (
        // md matches the h-9 filter controls, so the items-end row stays flush.
        <Button variant="primary" size="md" onClick={onClear}>
          <X />
          Clear
        </Button>
      )}
    </div>
  );
}
