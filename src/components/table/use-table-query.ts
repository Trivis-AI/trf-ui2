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
  clearFilters(): void;

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

  const [core, setCore] = React.useState<CoreState>(() =>
    adapter ? parseFromUrl(adapter.get(), resolved) : {
      pageIndex: 0,
      pageSize: defaultPageSize,
      sorting: defaultSort,
      search: "",
      filters: {},
    }
  );

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

  const clearFilters = React.useCallback(() => {
    setSearchInput("");
    clearTimeout(debounceTimer.current);
    setCore((s) => ({ ...s, filters: {}, search: "", pageIndex: 0 }));
  }, []);

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
    clearFilters,
    queryKey,
    params,
  };
}
