// Shared auth-recovery for the app API clients.
//
// Every micro-frontend (invoices, payments, …) is a SEPARATE origin, so its per-tab
// `sessionStorage` org-token cache (see renewToken.ts) starts empty when you switch
// service. The org token is then minted lazily/asynchronously, so a data request can race
// ahead of the mint and come back 401/403 `<trn-no-organization>` — a transient,
// self-correcting failure that nonetheless used to surface as a scary error toast ("your
// session keeps dropping").
//
// `installAuthInterceptors` moves auth-error handling DOWN into the token layer so pages
// never see a transient auth failure:
//   • request  — attaches a fresh org token (awaiting a mint if the cached one is stale),
//                so requests can't outrun token acquisition.
//   • response — on 401/403 it re-mints once and retries the original request. Only if the
//                re-mint itself fails (real membership loss / expired session) does it hand
//                off to `onUnauthorized` (default: redirect to the login portal) and leave
//                the caller's promise pending, so no error toast fires while we navigate
//                away.
//
// It is intentionally axios-free (structural typing only) so trf-ui2 keeps no axios
// dependency — the app passes in its own axios instance.

import { getOrgToken, mintOrgToken } from './renewToken';
import { noticeRefusal } from './refusals';

/** Minimal structural view of the bits of an axios request config we touch. */
interface RequestConfig {
  headers?: Record<string, unknown>;
  /** Marker we set to stop a retried request from retrying again (avoids loops). */
  _trfAuthRetried?: boolean;
  [k: string]: unknown;
}
interface AxiosLikeError {
  config?: RequestConfig;
  response?: { status?: number; data?: unknown };
}
/**
 * Loosely-typed axios instance. `use` callbacks are `any` so we don't couple trf-ui2 to a
 * specific axios version's generics (its `InternalAxiosRequestConfig` has a stricter index
 * signature than a plain structural type); the callback bodies below still use the precise
 * `RequestConfig` / `AxiosLikeError` shapes.
 */
interface AxiosLike {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (config: any): Promise<unknown>;
  interceptors: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    request: { use: (onFulfilled: (c: any) => any, onRejected?: (e: any) => any) => number };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response: { use: (onFulfilled: (r: any) => any, onRejected?: (e: any) => any) => number };
  };
}

export interface AuthInterceptorOptions {
  /** How to find the current org slug. Defaults to parsing `/app/:slug/*` from the URL. */
  getSlug?: () => string | null;
  /** Override the login API base (mainly for tests). */
  apiBase?: string;
  /**
   * Called when auth is genuinely lost (no session / membership revoked), after retry has
   * failed. Default: redirect to the login portal. Return value is ignored.
   */
  onUnauthorized?: () => void;
}

/** Extracts the org slug from an `/app/:slug/*` pathname, or null if not on such a route. */
export function slugFromPath(pathname?: string): string | null {
  const p = pathname ?? (typeof window !== 'undefined' ? window.location.pathname : '');
  const parts = p.split('/').filter(Boolean); // ['app', '<slug>', ...]
  return parts[0] === 'app' && parts[1] ? parts[1] : null;
}

/** Apex host, e.g. `payments.trivis.ee` -> `trivis.ee`. Mirrors renewToken.ts. */
function apexHost(): string {
  if (typeof window === 'undefined') return 'trf.is';
  const parts = window.location.hostname.split('.');
  return parts.length >= 2 ? parts.slice(-2).join('.') : 'trf.is';
}

function defaultOnUnauthorized(): void {
  if (typeof window !== 'undefined') window.location.href = `https://login.${apexHost()}`;
}

/**
 * Installs request + response auth interceptors on `instance`. Idempotent per instance is
 * NOT guaranteed — call once per axios client at module init.
 */
export function installAuthInterceptors(instance: AxiosLike, opts: AuthInterceptorOptions = {}): void {
  const getSlug = opts.getSlug ?? (() => slugFromPath());
  const onUnauthorized = opts.onUnauthorized ?? defaultOnUnauthorized;

  instance.interceptors.request.use(async (config: RequestConfig) => {
    const slug = getSlug();
    if (!slug) return config; // not on an org route — leave whatever the caller set
    // Fresh token beats any (possibly stale/null) Bearer a caller passed manually. If the
    // cached token is still fresh this resolves immediately without a network round-trip.
    const { token } = await getOrgToken(slug, { apiBase: opts.apiBase });
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Bearer = token;
    }
    return config;
  });

  instance.interceptors.response.use(
    (res: unknown) => res,
    async (error: AxiosLikeError) => {
      const status = error.response?.status;
      const config = error.config;
      const slug = getSlug();

      // Out of tokens, a locked company, a module outside the package, the next price
      // range: <RefusalDialogs/> explains it. Not an auth problem, so no re-mint.
      if (noticeRefusal(status, error.response?.data)) return Promise.reject(error);

      if ((status === 401 || status === 403) && config && !config._trfAuthRetried && slug) {
        // Re-mint once and retry — this is the transient "raced the mint" case.
        const { token, unauthorized } = await mintOrgToken(slug, { apiBase: opts.apiBase });
        if (token) {
          config._trfAuthRetried = true;
          config.headers = config.headers ?? {};
          config.headers.Bearer = token;
          return instance(config);
        }
        if (unauthorized) {
          // Session/membership is genuinely gone. Navigate to login and leave the caller's
          // promise pending so no error toast flashes on the way out.
          onUnauthorized();
          return new Promise(() => {});
        }
      }
      return Promise.reject(error);
    },
  );
}

/**
 * `fetch` with the same org-token auth recovery as {@link installAuthInterceptors}, for the
 * cross-service raw-`fetch` calls that don't go through an axios client (e.g. docrender /
 * crm). Attaches a fresh org token as the `Bearer` header, and on a 401/403 re-mints once
 * and retries; a genuine auth loss redirects to login and leaves the promise pending so no
 * error toast fires. Public (token-less) endpoints don't need this — use plain `fetch`.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
  opts: AuthInterceptorOptions = {},
): Promise<Response> {
  const getSlug = opts.getSlug ?? (() => slugFromPath());
  const onUnauthorized = opts.onUnauthorized ?? defaultOnUnauthorized;
  const slug = getSlug();

  const send = (token: string | null): Promise<Response> => {
    const headers = new Headers(init.headers);
    if (token) headers.set('Bearer', token);
    return fetch(input, { ...init, headers });
  };

  const token = slug ? (await getOrgToken(slug, { apiBase: opts.apiBase })).token : null;
  const res = await send(token);

  if (res.status === 402 || res.status === 403 || res.status === 423) {
    const body = await res.clone().json().catch(() => null);
    if (noticeRefusal(res.status, body)) return res;
  }

  if ((res.status === 401 || res.status === 403) && slug) {
    const { token: minted, unauthorized } = await mintOrgToken(slug, { apiBase: opts.apiBase });
    if (minted) return send(minted);
    if (unauthorized) {
      onUnauthorized();
      return new Promise<Response>(() => {}); // navigating to login; never resolves
    }
  }
  return res;
}
