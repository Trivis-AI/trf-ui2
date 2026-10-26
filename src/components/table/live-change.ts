import * as React from "react";
import type { Row, Table as TanStackTable } from "@tanstack/react-table";

/**
 * Live changes: a table that refetches because something changed elsewhere (the
 * assistant acting for the person, a colleague, another tab, a plugin) shows
 * what moved without a reload: changed cells glow and crossfade from the old
 * value, a new row glows whole, a row that no longer belongs to the view glows
 * and collapses while the rows below slide up, rows that paged in to fill the
 * gap fade in, and a row that re-sorted slides to its new place.
 *
 * The page owns the signal and the refetch. It tells the table, through the
 * `liveChange` prop, that a refetch is coming and why; the table snapshots the
 * rows it shows (data and DOM), waits for the next data, and animates the
 * difference. Only the rows the events named animate (`reason: "external"`),
 * or every row that differs after a gap in the signal (`"resync"`). A refetch
 * the page caused itself (`"local"`) or a page, sort or filter change
 * (`"navigation"`) animates nothing and just sets a new baseline.
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

/** What the table renders after a batch settled. */
export interface LiveEffects {
  glow: LiveGlow;
  /** Rows that paged in to fill a gap: fade in, no glow. */
  enters: Set<string>;
}

/** How long a glow stays on screen; matches the CSS animation. */
export const LIVE_GLOW_MS = 1300;
/** The old value fades out over the new one. */
export const LIVE_CROSSFADE_MS = 220;
/** An exiting row: glow, then collapse. */
export const LIVE_EXIT_GLOW_MS = 600;
export const LIVE_EXIT_COLLAPSE_MS = 300;
/** Rows leaving together start this far apart, so it reads as one wave. */
export const LIVE_EXIT_STAGGER_MS = 40;
/** A re-sorted row slides to its new place. */
export const LIVE_MOVE_MS = 300;
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

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

interface RowCapture {
  /** An inert copy of the row as it was, for the crossfade and the exit. Only rows the batch named carry one. */
  clone?: HTMLTableRowElement;
  /** Offset from the body's top, for the slide. Every row has one. */
  top: number;
}

interface Baseline<TData> {
  version: number;
  view: string;
  reason: LiveRefreshReason;
  ids: Set<string>;
  rows: Map<string, TData>;
  order: string[];
  dom: Map<string, RowCapture>;
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

/** Rows that were on screen, were named, and are not in the new rows: they left the view. */
export function exitedRows<TData>(rows: Row<TData>[], baseline: Pick<Baseline<TData>, "reason" | "ids" | "order">): string[] {
  const present = new Set(rows.map((r) => r.id));
  return baseline.order.filter((id) => !present.has(id) && (baseline.reason === "resync" || baseline.ids.has(id)));
}

/** Rows that are new to the view but were not named: they paged in to fill a gap. */
export function enteredRows<TData>(rows: Row<TData>[], baseline: Pick<Baseline<TData>, "reason" | "ids" | "rows">): Set<string> {
  const out = new Set<string>();
  for (const r of rows) if (!baseline.rows.has(r.id) && !(baseline.reason === "external" && baseline.ids.has(r.id))) out.add(r.id);
  return out;
}

/** Positions of every row (for the slides) and a clone of the wanted ones (null: all). */
function captureRows(body: HTMLTableSectionElement | null, ids: Iterable<string> | null): Map<string, RowCapture> {
  const out = new Map<string, RowCapture>();
  if (!body) return out;
  const wanted = ids ? new Set(ids) : null;
  const bodyTop = body.getBoundingClientRect().top;
  for (const tr of Array.from(body.querySelectorAll<HTMLTableRowElement>(":scope > tr[data-row-id]"))) {
    const id = tr.dataset.rowId!;
    const top = tr.getBoundingClientRect().top - bodyTop;
    out.set(id, wanted && !wanted.has(id) ? { top } : { clone: tr.cloneNode(true) as HTMLTableRowElement, top });
  }
  return out;
}

/* ── DOM effects ─────────────────────────────────────────────────────────── */

function crossfadeCell(td: HTMLTableCellElement, oldTd: Element | undefined): void {
  if (!oldTd || typeof td.animate !== "function") return;
  const overlay = document.createElement("div");
  overlay.setAttribute("aria-hidden", "true");
  overlay.dataset.liveOverlay = "";
  const cs = getComputedStyle(td);
  overlay.style.cssText = `position:absolute;inset:0;pointer-events:none;display:flex;align-items:center;` +
    `padding:${cs.padding};text-align:${cs.textAlign};justify-content:${cs.textAlign === "right" ? "flex-end" : cs.textAlign === "center" ? "center" : "flex-start"}`;
  for (const child of Array.from(oldTd.childNodes)) overlay.appendChild(child.cloneNode(true));
  td.appendChild(overlay);
  const newContent = Array.from(td.childNodes).filter((n) => n !== overlay) as HTMLElement[];
  for (const n of newContent) if (n instanceof HTMLElement) n.animate([{ opacity: 0 }, { opacity: 1 }], { duration: LIVE_CROSSFADE_MS, easing: "ease-out" });
  const anim = overlay.animate([{ opacity: 1 }, { opacity: 0 }], { duration: LIVE_CROSSFADE_MS, easing: "ease-out", fill: "forwards" });
  anim.onfinish = () => overlay.remove();
  anim.oncancel = () => overlay.remove();
}

function exitRow(body: HTMLTableSectionElement, clone: HTMLTableRowElement, before: Element | null, delayMs: number, onDone: () => void): void {
  clone.setAttribute("inert", "");
  clone.setAttribute("aria-hidden", "true");
  clone.removeAttribute("data-row-id");
  clone.removeAttribute("data-state");
  clone.dataset.live = "exit";
  clone.dataset.liveClone = "";
  body.insertBefore(clone, before);
  const cells = Array.from(clone.children) as HTMLTableCellElement[];
  // Each cell's content goes into a wrapper whose height can collapse; the
  // row's own height follows, and the rows below slide up with it.
  const wrappers = cells.map((td) => {
    const w = document.createElement("div");
    w.style.overflow = "hidden";
    while (td.firstChild) w.appendChild(td.firstChild);
    td.appendChild(w);
    w.style.height = `${w.getBoundingClientRect().height}px`;
    return w;
  });
  const finish = () => {
    clone.remove();
    onDone();
  };
  if (typeof clone.animate !== "function") {
    setTimeout(finish, delayMs + LIVE_EXIT_GLOW_MS);
    return;
  }
  const start = delayMs + LIVE_EXIT_GLOW_MS;
  let pending = cells.length;
  cells.forEach((td, i) => {
    const w = wrappers[i]!;
    w.animate([{ height: w.style.height }, { height: "0px" }], { duration: LIVE_EXIT_COLLAPSE_MS, delay: start, easing: "ease-in-out", fill: "forwards" });
    const a = td.animate(
      [{ paddingTop: getComputedStyle(td).paddingTop, paddingBottom: getComputedStyle(td).paddingBottom }, { paddingTop: "0px", paddingBottom: "0px" }],
      { duration: LIVE_EXIT_COLLAPSE_MS, delay: start, easing: "ease-in-out", fill: "forwards" }
    );
    a.onfinish = a.oncancel = () => { if (--pending === 0) finish(); };
  });
  clone.animate([{ opacity: 1 }, { opacity: 0 }], { duration: LIVE_EXIT_COLLAPSE_MS, delay: start, easing: "ease-in-out", fill: "forwards" });
}

function slideRow(tr: HTMLTableRowElement, deltaY: number, onTop: boolean): void {
  if (!deltaY || typeof tr.animate !== "function") return;
  // The row that re-sorted travels over the ones that only shifted a slot, so
  // it is opaque and above them for the duration; everything else keeps its
  // own paint.
  if (onTop) {
    tr.style.position = "relative";
    tr.style.zIndex = "1";
    tr.style.backgroundColor = "var(--background)";
  }
  const a = tr.animate([{ transform: `translateY(${deltaY}px)` }, { transform: "translateY(0)" }], { duration: LIVE_MOVE_MS, easing: "ease-in-out" });
  if (onTop) a.onfinish = a.oncancel = () => { tr.style.position = ""; tr.style.zIndex = ""; tr.style.backgroundColor = ""; };
}

/* ── The hook ────────────────────────────────────────────────────────────── */

export interface UseLiveGlowOptions {
  /** The table's wrapper; the body and its rows are found inside it. */
  wrapperRef: React.RefObject<HTMLElement | null>;
  /** Rows that left the view and finished exiting; the caller drops them from its selection. */
  onRowsExit?: (ids: string[]) => void;
}

/**
 * The table-side state machine: arm on a new `liveChange`, resolve when the
 * next rows (or the end of the refetch) arrive under the same view, then
 * animate the difference.
 */
export function useLiveGlow<TData>(
  table: TanStackTable<TData>,
  rows: Row<TData>[],
  liveChange: LiveChange | undefined,
  fetching: boolean,
  { wrapperRef, onRowsExit }: UseLiveGlowOptions
): LiveEffects {
  const [effects, setEffects] = React.useState<LiveEffects>(() => ({ glow: new Map(), enters: new Set() }));
  const baselineRef = React.useRef<Baseline<TData> | null>(null);
  const seenVersion = React.useRef<number | undefined>(undefined);
  const rowsRef = React.useRef(rows);
  rowsRef.current = rows;
  const clearTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const onExitRef = React.useRef(onRowsExit);
  onExitRef.current = onRowsExit;
  /** Set by the resolve step, consumed by the layout effect right after the glow render. */
  const pendingDom = React.useRef<{ base: Baseline<TData>; glow: LiveGlow; exits: string[] } | null>(null);

  const body = () => (wrapperRef.current?.querySelector("tbody") as HTMLTableSectionElement | null) ?? null;

  // Arm: a new batch snapshots what is on screen right now, before the refetch
  // lands. Local and navigation refreshes only reset the baseline.
  React.useEffect(() => {
    if (!liveChange || liveChange.version === seenVersion.current) return;
    seenVersion.current = liveChange.version;
    if (liveChange.reason === "external" || liveChange.reason === "resync") {
      const prev = baselineRef.current;
      // A second batch during a pending refetch keeps the older snapshot (the
      // values before anything changed) and unions the named rows; rows it
      // names that were not captured yet are captured now.
      if (prev && prev.view === liveChange.view && prev.reason === liveChange.reason) {
        for (const id of liveChange.ids) prev.ids.add(id);
        if (prev.reason === "external" && !prefersReducedMotion()) {
          const missing = liveChange.ids.filter((id) => !prev.dom.get(id)?.clone);
          for (const [id, cap] of captureRows(body(), missing)) if (cap.clone) prev.dom.set(id, { ...prev.dom.get(id), ...cap });
        }
        prev.version = liveChange.version;
        prev.takenAt = Date.now();
        return;
      }
      const reduced = prefersReducedMotion();
      baselineRef.current = {
        version: liveChange.version,
        view: liveChange.view,
        reason: liveChange.reason,
        ids: new Set(liveChange.ids),
        rows: new Map(rowsRef.current.map((r) => [r.id, r.original])),
        order: rowsRef.current.map((r) => r.id),
        dom: reduced ? new Map() : captureRows(body(), liveChange.reason === "resync" ? null : liveChange.ids),
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
    const glow = diffLiveRows(table, rows, base);
    const exits = exitedRows(rows, base);
    const enters = exits.length || glow.size ? enteredRows(rows, base) : new Set<string>();
    baselineRef.current = null;
    if (!glow.size && !exits.length && !enters.size) return;
    pendingDom.current = { base, glow, exits };
    setEffects({ glow, enters });
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => setEffects({ glow: new Map(), enters: new Set() }), LIVE_GLOW_MS);
  }, [rows, fetching, liveChange, table]);

  // Animate: runs right after the glow render, with the new rows in the DOM and
  // the old ones captured. Reduced motion captured nothing, so this is a no-op.
  React.useLayoutEffect(() => {
    const job = pendingDom.current;
    if (!job) return;
    pendingDom.current = null;
    const tbody = body();
    if (!tbody || !job.base.dom.size) {
      if (job.exits.length) onExitRef.current?.(job.exits);
      return;
    }
    const { base, glow, exits } = job;
    const named = (id: string) => base.reason === "resync" || base.ids.has(id);
    // Exits first: their clones take up the space the rows had, so the slides
    // below are measured against a body that still holds them.
    // Each clone goes back where its row was: before the first row that
    // followed it in the old order and is still here (or just before the
    // clone of the next exiting row, inserted later). Insertion runs in old
    // order, so an earlier clone never displaces a later one.
    const present = new Map<string, HTMLTableRowElement>();
    for (const tr of Array.from(tbody.querySelectorAll<HTMLTableRowElement>(":scope > tr[data-row-id]"))) present.set(tr.dataset.rowId!, tr);
    const anchorFor = (id: string): Element | null => {
      const from = base.order.indexOf(id);
      for (let i = from + 1; i < base.order.length; i++) {
        const tr = present.get(base.order[i]!);
        if (tr) return tr;
      }
      return null;
    };
    let remaining = exits.length;
    exits.forEach((id, i) => {
      const cap = base.dom.get(id);
      if (!cap?.clone) { if (--remaining === 0) onExitRef.current?.(exits); return; }
      exitRow(tbody, cap.clone, anchorFor(id), i * LIVE_EXIT_STAGGER_MS, () => { if (--remaining === 0) onExitRef.current?.(exits); });
    });
    const bodyTop = tbody.getBoundingClientRect().top;
    for (const tr of Array.from(tbody.querySelectorAll<HTMLTableRowElement>(":scope > tr[data-row-id]"))) {
      const id = tr.dataset.rowId!;
      const cap = base.dom.get(id);
      const g = glow.get(id);
      // Crossfade each changed cell from its old content.
      if (cap?.clone && g instanceof Set) {
        const oldCells = Array.from(cap.clone.children);
        Array.from(tr.children).forEach((td, i) => {
          if ((td as HTMLElement).dataset.live === "cell") crossfadeCell(td as HTMLTableCellElement, oldCells[i]);
        });
      }
      // Slide a row that is still here but somewhere else.
      if (cap) {
        const delta = cap.top - (tr.getBoundingClientRect().top - bodyTop);
        if (Math.abs(delta) > 1) slideRow(tr, delta, named(id));
      }
    }
  }, [effects]);

  React.useEffect(() => () => { if (clearTimer.current) clearTimeout(clearTimer.current); }, []);

  return effects;
}
