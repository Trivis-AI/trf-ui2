import * as React from "react";
import type { SortingState } from "@tanstack/react-table";
import {
  createHistoryUrlState,
  type UrlStateAdapter,
  type UrlStateFactory,
} from "./url-state";

export interface UseTableQueryOptions {
  defaultSort?: SortingState;
  /** Page size. Default 50. */
  defaultPageSize?: number;
  /**
   * Enable the user-saved default view, stored in localStorage under this key
   * (so it is per browser user, not per organisation). Give each list its own
   * key, e.g. "purchase-invoices". Omit to disable the feature entirely.
   *
   * A saved view is applied only when the URL carries no table state, so a link
   * someone sent you always wins over your own default.
   */
  defaultViewKey?: string;
  /** Debounce before `search` (and the query) updates. Default 300ms. */
  searchDebounceMs?: number;
  /** Sync state to the URL. Default true (History-API adapter). */
  syncToUrl?: boolean;
  /** Filter param names to track and serialize. Filters outside this list are ignored. */
  filterKeys?: string[];
  /**
   * Supply a custom URL-state adapter (e.g. a react-router one). Defaults to the
   * History-API adapter. Only used when `syncToUrl` is true.
   */
  urlState?: UrlStateFactory;
}

/**
 * The saved default view: one filter/search/sort combination the user chose to
 * open this list with. Page number is deliberately not part of it.
 */
export interface TableDefaultView {
  /** False when `defaultViewKey` was not given; controls render nothing then. */
  enabled: boolean;
  /** A view is stored for this list. */
  saved: boolean;
  /** The stored view matches what is on screen right now. */
  isCurrent: boolean;
  /** This page load started from the stored view (no table state in the URL). */
  restored: boolean;
  /** Store the current filters/search/sort. Storing an empty view forgets it. */
  save(): void;
  /** Forget the stored view; the list opens unfiltered again. */
  clear(): void;
}

export interface TableQuery {
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  /** Debounced search, used for fetching. */
  search: string;
  /** Immediate search, bound to the input. */
  searchInput: string;
  filters: Record<string, string>;

  // Setters. All reset pageIndex to 0 except setPageIndex.
  setPageIndex(index: number): void;
  setPageSize(size: number): void;
  setSorting(sorting: SortingState): void;
  setSearch(value: string): void;
  setFilter(key: string, value: string): void;
  /**
   * Merge several filter keys in one update: sets each key, an empty-string value
   * clears that key, resets pageIndex to 0, and writes the URL a single time.
   */
  setFilters(next: Record<string, string>): void;
  /**
   * Clear filters and search, and forget this list's saved default view — after
   * this the list opens unfiltered until the user saves a new default.
   */
  clearFilters(): void;

  /** The user-saved default view for this list. */
  defaultView: TableDefaultView;

  /** Stable react-query key. */
  queryKey: unknown[];
  /** Flat param map for the fetcher: page, limit, sort, dir, search, ...filters. */
  params: Record<string, string>;
}

interface CoreState {
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  search: string;
  filters: Record<string, string>;
}

function parseFromUrl(
  snapshot: Record<string, string>,
  opts: Required<Pick<UseTableQueryOptions, "defaultPageSize" | "defaultSort" | "filterKeys">>
): CoreState {
  const page = Number.parseInt(snapshot.page ?? "", 10);
  const limit = Number.parseInt(snapshot.limit ?? "", 10);
  const sortField = snapshot.sort;
  const dir = snapshot.dir === "desc" ? true : snapshot.dir === "asc" ? false : undefined;

  const filters: Record<string, string> = {};
  for (const key of opts.filterKeys) {
    if (snapshot[key] != null && snapshot[key] !== "") filters[key] = snapshot[key];
  }

  return {
    pageIndex: Number.isFinite(page) && page > 0 ? page - 1 : 0,
    pageSize: Number.isFinite(limit) && limit > 0 ? limit : opts.defaultPageSize,
    sorting:
      sortField && dir !== undefined ? [{ id: sortField, desc: dir }] : opts.defaultSort,
    search: snapshot.q ?? "",
    filters,
  };
}

/* ------------------------------------------------- saved default view */

const VIEW_STORAGE_PREFIX = "trf.table-view.";

/**
 * The part of the state a saved view covers: filters, search and sort. Page and
 * page size are left out on purpose — reopening a list on page 4 is never what
 * anyone meant by "make this my default".
 */
function viewParams(state: CoreState): Record<string, string> {
  const out: Record<string, string> = {};
  if (state.sorting[0]) {
    out.sort = state.sorting[0].id;
    out.dir = state.sorting[0].desc ? "desc" : "asc";
  }
  if (state.search) out.q = state.search;
  for (const [key, value] of Object.entries(state.filters)) {
    if (value) out[key] = value;
  }
  return out;
}

/** A view with nothing but the default sort in it is the unfiltered list. */
function isEmptyView(view: Record<string, string>, defaultSort: SortingState): boolean {
  const keys = Object.keys(view);
  if (keys.length === 0) return true;
  if (!defaultSort[0]) return false;
  const onlySort = keys.every((k) => k === "sort" || k === "dir");
  return (
    onlySort &&
    view.sort === defaultSort[0].id &&
    view.dir === (defaultSort[0].desc ? "desc" : "asc")
  );
}

function sameView(a: Record<string, string>, b: Record<string, string>): boolean {
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((k) => a[k] === b[k]);
}

// localStorage can throw (private mode, disabled storage, quota); a default view
// is a convenience, so every failure degrades to "no saved view" rather than
// taking the list down with it.
function readView(key: string): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(VIEW_STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof v === "string" && v !== "") out[k] = v;
    }
    return Object.keys(out).length > 0 ? out : null;
  } catch {
    return null;
  }
}

function writeView(key: string, view: Record<string, string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VIEW_STORAGE_PREFIX + key, JSON.stringify(view));
  } catch {
    /* storage unavailable: the view simply does not persist */
  }
}

function removeView(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(VIEW_STORAGE_PREFIX + key);
  } catch {
    /* as above */
  }
}

/** Keys the hook itself owns in the URL; used to detect "the URL carries state". */
const URL_STATE_KEYS = ["page", "limit", "sort", "dir", "q"];

function urlHasTableState(snapshot: Record<string, string>, filterKeys: string[]): boolean {
  for (const key of URL_STATE_KEYS.concat(filterKeys)) {
    if (snapshot[key] != null && snapshot[key] !== "") return true;
  }
  return false;
}

function serialize(state: CoreState, defaultPageSize: number): Record<string, string> {
  const out: Record<string, string> = {};
  if (state.pageIndex > 0) out.page = String(state.pageIndex + 1);
  if (state.pageSize !== defaultPageSize) out.limit = String(state.pageSize);
  if (state.sorting[0]) {
    out.sort = state.sorting[0].id;
    out.dir = state.sorting[0].desc ? "desc" : "asc";
  }
  if (state.search) out.q = state.search;
  for (const [key, value] of Object.entries(state.filters)) {
    if (value) out[key] = value;
  }
  return out;
}

/**
 * Owns page/sort/filter/search state for a server-driven table, debounces search,
 * and optionally syncs to the URL. Does not fetch: feed `queryKey` + `params` to
 * your data layer (e.g. react-query) and drive ServerDataTable from the result.
 */
export function useTableQuery(opts: UseTableQueryOptions = {}): TableQuery {
  const {
    defaultSort = [],
    defaultPageSize = 50,
    searchDebounceMs = 300,
    syncToUrl = true,
    filterKeys = [],
    defaultViewKey,
    urlState,
  } = opts;

  const resolved = React.useMemo(
    () => ({ defaultPageSize, defaultSort, filterKeys }),
    // defaultSort / filterKeys are expected to be stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [defaultPageSize]
  );

  // The adapter is created once. When syncToUrl is off there is no adapter.
  const adapterRef = React.useRef<UrlStateAdapter | null>(null);
  if (syncToUrl && adapterRef.current === null) {
    adapterRef.current = (urlState ?? createHistoryUrlState)();
  }
  const adapter = adapterRef.current;

  // Read once, before the state initializers below run.
  const initialSaved = React.useMemo(
    () => (defaultViewKey ? readView(defaultViewKey) : null),
    [defaultViewKey]
  );

  // True when this load started from the saved view rather than from a link or
  // a plain visit. Held in a ref: it describes how the page opened, and must not
  // re-trigger renders.
  const openedFromViewRef = React.useRef(false);

  const [savedView, setSavedView] = React.useState<Record<string, string> | null>(
    () => initialSaved
  );

  const [core, setCore] = React.useState<CoreState>(() => {
    const snapshot = adapter ? adapter.get() : {};
    // A link with table state in it always wins over the user's own default:
    // someone sent you that URL to show you those exact rows.
    if (initialSaved && !urlHasTableState(snapshot, filterKeys)) {
      openedFromViewRef.current = true;
      return parseFromUrl(initialSaved, resolved);
    }
    if (adapter) return parseFromUrl(snapshot, resolved);
    return {
      pageIndex: 0,
      pageSize: defaultPageSize,
      sorting: defaultSort,
      search: "",
      filters: {},
    };
  });

  // searchInput is the immediate (undebounced) value bound to the input.
  const [searchInput, setSearchInput] = React.useState(core.search);
  const debounceTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Push state to the URL whenever it changes.
  React.useEffect(() => {
    if (!adapter) return;
    adapter.set(serialize(core, defaultPageSize));
  }, [adapter, core, defaultPageSize]);

  // React to external URL changes (back/forward).
  React.useEffect(() => {
    if (!adapter) return;
    return adapter.subscribe(() => {
      const next = parseFromUrl(adapter.get(), resolved);
      setCore(next);
      setSearchInput(next.search);
    });
  }, [adapter, resolved]);

  React.useEffect(() => () => clearTimeout(debounceTimer.current), []);

  const setPageIndex = React.useCallback((index: number) => {
    setCore((s) => ({ ...s, pageIndex: index }));
  }, []);

  const setPageSize = React.useCallback((size: number) => {
    setCore((s) => ({ ...s, pageSize: size, pageIndex: 0 }));
  }, []);

  const setSorting = React.useCallback((sorting: SortingState) => {
    setCore((s) => ({ ...s, sorting, pageIndex: 0 }));
  }, []);

  const setSearch = React.useCallback(
    (value: string) => {
      setSearchInput(value);
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        setCore((s) => ({ ...s, search: value, pageIndex: 0 }));
      }, searchDebounceMs);
    },
    [searchDebounceMs]
  );

  const setFilter = React.useCallback((key: string, value: string) => {
    setCore((s) => {
      const filters = { ...s.filters };
      if (value) filters[key] = value;
      else delete filters[key];
      return { ...s, filters, pageIndex: 0 };
    });
  }, []);

  const setFilters = React.useCallback((next: Record<string, string>) => {
    setCore((s) => {
      const filters = { ...s.filters };
      for (const [key, value] of Object.entries(next)) {
        if (value) filters[key] = value;
        else delete filters[key];
      }
      return { ...s, filters, pageIndex: 0 };
    });
  }, []);

  const clearFilters = React.useCallback(() => {
    setSearchInput("");
    clearTimeout(debounceTimer.current);
    setCore((s) => ({ ...s, filters: {}, search: "", pageIndex: 0 }));
    // Clear means clear for good: a saved default view that survives the click
    // would bring the same filters back on the next visit, which reads as the
    // list ignoring you. Forgetting it here is why Clear needs no follow-up.
    if (defaultViewKey) {
      removeView(defaultViewKey);
      setSavedView(null);
      openedFromViewRef.current = false;
    }
  }, [defaultViewKey]);

  const currentView = React.useMemo(() => viewParams(core), [core]);

  const saveDefaultView = React.useCallback(() => {
    if (!defaultViewKey) return;
    // "Make the unfiltered list my default" is the same wish as "forget my
    // default", so it is stored as no view at all.
    if (isEmptyView(currentView, defaultSort)) {
      removeView(defaultViewKey);
      setSavedView(null);
      return;
    }
    writeView(defaultViewKey, currentView);
    setSavedView(currentView);
  }, [defaultViewKey, currentView, defaultSort]);

  const clearDefaultView = React.useCallback(() => {
    if (!defaultViewKey) return;
    removeView(defaultViewKey);
    setSavedView(null);
  }, [defaultViewKey]);

  const defaultView = React.useMemo<TableDefaultView>(() => {
    const isCurrent = !!savedView && sameView(savedView, currentView);
    return {
      enabled: !!defaultViewKey,
      saved: !!savedView,
      isCurrent,
      // Stops describing the load as restored the moment the user edits a filter.
      restored: openedFromViewRef.current && isCurrent,
      save: saveDefaultView,
      clear: clearDefaultView,
    };
  }, [defaultViewKey, savedView, currentView, saveDefaultView, clearDefaultView]);

  const params = React.useMemo(() => {
    const out: Record<string, string> = {
      page: String(core.pageIndex + 1),
      limit: String(core.pageSize),
    };
    if (core.sorting[0]) {
      out.sort = core.sorting[0].id;
      out.dir = core.sorting[0].desc ? "desc" : "asc";
    }
    if (core.search) out.search = core.search;
    for (const [key, value] of Object.entries(core.filters)) {
      if (value) out[key] = value;
    }
    return out;
  }, [core]);

  const queryKey = React.useMemo(
    () => [core.pageIndex, core.pageSize, core.sorting, core.search, core.filters],
    [core]
  );

  return {
    pageIndex: core.pageIndex,
    pageSize: core.pageSize,
    sorting: core.sorting,
    search: core.search,
    searchInput,
    filters: core.filters,
    setPageIndex,
    setPageSize,
    setSorting,
    setSearch,
    setFilter,
    setFilters,
    clearFilters,
    defaultView,
    queryKey,
    params,
  };
}
