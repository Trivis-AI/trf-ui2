import * as React from "react";

// A tiny stand-in for @tanstack/react-query. Real apps use react-query; this hook
// mirrors its isLoading / isFetching / keepPreviousData behaviour plus a
// stale-while-revalidate cache, so the demo builds with no extra dependency.
//
//   - isLoading  : a cold fetch with no data ever shown yet (-> skeleton).
//   - isFetching : any request in flight, including a background revalidate
//                  (-> the header progress line while the previous rows stay).
//   - keepPreviousData: when the key changes, the last data stays on screen until
//                  the new data arrives, so rows never blank out (no flicker).
//   - cache: a previously seen key renders its cached rows instantly, then
//                  revalidates in the background.

export interface MockQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  refetch: () => void;
}

export function useMockQuery<T>(key: unknown[], fetcher: () => Promise<T>): MockQueryResult<T> {
  const keyStr = React.useMemo(() => JSON.stringify(key), [key]);

  // Cache survives key changes; the request id guards against out-of-order
  // resolutions (a slow older request must not overwrite a newer one).
  const cacheRef = React.useRef(new Map<string, T>());
  const reqIdRef = React.useRef(0);
  const fetcherRef = React.useRef(fetcher);
  fetcherRef.current = fetcher;

  const [data, setData] = React.useState<T | undefined>(() => cacheRef.current.get(keyStr));
  const [isFetching, setFetching] = React.useState(false);
  const [error, setError] = React.useState<unknown>(undefined);

  const run = React.useCallback((k: string) => {
    const cached = cacheRef.current.get(k);
    // Cached hit: show it instantly (stale), then revalidate. Otherwise the
    // previous key's data stays on screen (keepPreviousData) while we fetch.
    if (cached !== undefined) setData(cached);

    const id = ++reqIdRef.current;
    setFetching(true);
    setError(undefined);

    fetcherRef.current().then(
      (result) => {
        cacheRef.current.set(k, result);
        if (reqIdRef.current !== id) return; // superseded by a newer request
        setData(result);
        setFetching(false);
      },
      (err) => {
        if (reqIdRef.current !== id) return;
        setError(err);
        setFetching(false);
      }
    );
  }, []);

  React.useEffect(() => {
    run(keyStr);
  }, [keyStr, run]);

  const refetch = React.useCallback(() => run(keyStr), [keyStr, run]);

  // Cold load: fetching with nothing ever shown yet. Once any data has arrived a
  // refetch is a background revalidate, not a cold load.
  const isLoading = isFetching && data === undefined;

  return { data, isLoading, isFetching, error, refetch };
}
