/**
 * Pluggable URL-state adapter for useTableQuery. The table state (page, sort,
 * search, filters) is serialized to a flat string map; an adapter decides where
 * that map lives. ui2 ships a zero-dependency History-API adapter (below); apps
 * that use a router can pass their own (e.g. a react-router adapter wrapping
 * useSearchParams) so URL sync stays integrated with the router.
 */
export interface UrlStateAdapter {
  /** Read the current params as a flat string map. */
  get(): Record<string, string>;
  /** Replace the current params with `next` (empty values are dropped). */
  set(next: Record<string, string>): void;
  /** Subscribe to external changes (back/forward). Returns an unsubscribe fn. */
  subscribe(callback: () => void): () => void;
}

/** Factory apps pass to useTableQuery to supply a custom adapter. */
export type UrlStateFactory = () => UrlStateAdapter;

// No-op adapter for non-browser environments (SSR) or when sync is disabled.
const memoryUrlState: UrlStateAdapter = {
  get: () => ({}),
  set: () => {},
  subscribe: () => () => {},
};

/**
 * Default adapter: reads/writes `window.location.search` via URLSearchParams and
 * history.replaceState (no new history entry per keystroke), and listens to
 * `popstate` for back/forward. No router dependency.
 */
export function createHistoryUrlState(): UrlStateAdapter {
  if (typeof window === "undefined") return memoryUrlState;
  return {
    get() {
      const params = new URLSearchParams(window.location.search);
      const out: Record<string, string> = {};
      params.forEach((value, key) => {
        out[key] = value;
      });
      return out;
    },
    set(next) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(next)) {
        if (value != null && value !== "") params.set(key, value);
      }
      const query = params.toString();
      const url = query
        ? `${window.location.pathname}?${query}${window.location.hash}`
        : `${window.location.pathname}${window.location.hash}`;
      window.history.replaceState(window.history.state, "", url);
    },
    subscribe(callback) {
      window.addEventListener("popstate", callback);
      return () => window.removeEventListener("popstate", callback);
    },
  };
}
