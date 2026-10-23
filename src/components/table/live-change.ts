import * as React from "react";
import type { Row, Table as TanStackTable } from "@tanstack/react-table";

/**
 * Live changes: a table that refetches because something changed elsewhere (the
 * assistant acting for the person, a colleague, another tab, a plugin) glows the
 * cells whose values changed, so the person sees what moved without a reload.
 *
 * The page owns the signal and the refetch. It tells the table, through the
 * `liveChange` prop, that a refetch is coming and why; the table snapshots the
 * rows it shows, waits for the next data, and glows the difference. Only the
 * rows the events named glow (`reason: "external"`), or every row that differs
 * after a gap in the signal (`"resync"`). A refetch the page caused itself
 * (`"local"`) or a page, sort or filter change (`"navigation"`) glows nothing
 * and just sets a new baseline.
 */
export type LiveRefreshReason = "external" | "local" | "navigation" | "resync";

export interface LiveChange {
  /** Grows with every batch; the table acts when it changes. */
  version: number;
  reason: LiveRefreshReason;
  /** Row ids (as `getRowId` names them) the events named. Ignored for "resync". */
  ids: readonly string[];
  /**
   * Identity of what the table shows: organisation, entity, filters, sort, page.
   * Data arriving under a different identity is a new baseline, never a glow,
   * so paging or filtering during a refetch cannot light up unrelated rows.
   */
  view: string;
}

/** Per row: the changed column ids, or "row" when the whole row is new. */
export type LiveGlow = Map<string, Set<string> | "row">;

/** How long a glow stays on screen; matches the CSS animation. */
export const LIVE_GLOW_MS = 1300;
/** A refetch that never arrives: drop the baseline so a later one cannot glow stale diffs. */
const BASELINE_TTL_MS = 10_000;

function sameValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a == null || b == null) return false;
  if (typeof a === "object" || typeof b === "object") {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }
  return false;
}

interface Baseline<TData> {
  version: number;
  view: string;
  reason: LiveRefreshReason;
  ids: Set<string>;
  rows: Map<string, TData>;
  takenAt: number;
  /** A refetch was seen in flight since the snapshot. */
  fetched: boolean;
}

/**
 * Diff the rows now on screen against a baseline. Exported for tests and for
 * tables that render their own rows.
 */
export function diffLiveRows<TData>(
  table: TanStackTable<TData>,
  rows: Row<TData>[],
  baseline: Pick<Baseline<TData>, "reason" | "ids" | "rows">
): LiveGlow {
  const glow: LiveGlow = new Map();
  const columns = table.getVisibleLeafColumns();
  for (const row of rows) {
    const named = baseline.reason === "resync" || baseline.ids.has(row.id);
    if (!named) continue;
    const old = baseline.rows.get(row.id);
    if (old === undefined) {
      // A resync names nothing: a row that was not on screen before may simply
      // have paged in, so it is not "new". An external event that names a row
      // not seen before is a creation.
      if (baseline.reason === "external") glow.set(row.id, "row");
      continue;
    }
    const changed = new Set<string>();
    for (const col of columns) {
      const accessor = col.accessorFn;
      if (!accessor) continue; // display-only column (actions, selection)
      const before = accessor(old, row.index);
      const after = row.getValue(col.id);
      if (!sameValue(before, after)) changed.add(col.id);
    }
    if (changed.size) glow.set(row.id, changed);
  }
  return glow;
}

/**
 * The table-side state machine: arm on a new `liveChange`, resolve when the
 * next rows (or the end of the refetch) arrive under the same view.
 */
export function useLiveGlow<TData>(
  table: TanStackTable<TData>,
  rows: Row<TData>[],
  liveChange: LiveChange | undefined,
  fetching: boolean
): LiveGlow {
  const [glow, setGlow] = React.useState<LiveGlow>(() => new Map());
  const baselineRef = React.useRef<Baseline<TData> | null>(null);
  const seenVersion = React.useRef<number | undefined>(undefined);
  const rowsRef = React.useRef(rows);
  rowsRef.current = rows;
  const clearTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Arm: a new batch snapshots what is on screen right now, before the refetch
  // lands. Local and navigation refreshes only reset the baseline.
  React.useEffect(() => {
    if (!liveChange || liveChange.version === seenVersion.current) return;
    seenVersion.current = liveChange.version;
    if (liveChange.reason === "external" || liveChange.reason === "resync") {
      const prev = baselineRef.current;
      // A second batch during a pending refetch keeps the older snapshot (the
      // values before anything changed) and unions the named rows.
      if (prev && prev.view === liveChange.view && prev.reason === liveChange.reason) {
        for (const id of liveChange.ids) prev.ids.add(id);
        prev.version = liveChange.version;
        prev.takenAt = Date.now();
        return;
      }
      baselineRef.current = {
        version: liveChange.version,
        view: liveChange.view,
        reason: liveChange.reason,
        ids: new Set(liveChange.ids),
        rows: new Map(rowsRef.current.map((r) => [r.id, r.original])),
        takenAt: Date.now(),
        fetched: false,
      };
    } else {
      baselineRef.current = null;
    }
  }, [liveChange]);

  // Resolve: new rows under the same view, or the refetch finishing with the same
  // rows (structural sharing), both settle the pending batch.
  React.useEffect(() => {
    const base = baselineRef.current;
    if (!base) return;
    if (Date.now() - base.takenAt > BASELINE_TTL_MS) {
      baselineRef.current = null;
      return;
    }
    if (fetching) {
      base.fetched = true;
      return; // still loading: the rows are the old ones
    }
    if (!liveChange || liveChange.view !== base.view) {
      baselineRef.current = null; // paged, sorted or filtered meanwhile
      return;
    }
    // Rows identical to the snapshot and no refetch seen yet: that is the
    // arming render, nothing to compare. Identical rows after a refetch (the
    // page's cache shares unchanged objects) settle the batch with no glow.
    const unchanged =
      base.rows.size === rows.length && rows.every((r) => base.rows.get(r.id) === r.original);
    if (unchanged && !base.fetched) return;
    const next = diffLiveRows(table, rows, base);
    baselineRef.current = null;
    if (!next.size) return;
    setGlow(next);
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setGlow(new Map()), LIVE_GLOW_MS);
  }, [rows, fetching, liveChange, table]);

  React.useEffect(() => () => { if (clearTimer.current) clearTimeout(clearTimer.current); }, []);

  return glow;
}
