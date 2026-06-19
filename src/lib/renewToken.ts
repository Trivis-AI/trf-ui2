// Session-token renewal.
//
// The org-scoped session JWT (cookie `trf_jwt_<slug>`) carries the permission
// bitmask `p`, and trfbacklogin now mints it with a 30-day TTL. Calling
// POST /v1/account/renew-token re-reads the caller's role from the database and
// re-issues a fresh token, so role changes (downgrade / removal) propagate
// without a full re-login, and the expiry rolls forward while the user is active.
//
// Backend contract (trfbacklogin):
//   POST {login-api}/v1/account/renew-token
//   header: `Bearer: <current org jwt>`   (literal "Bearer" header, as billing uses)
//   200 -> { token: "<fresh jwt>", ... }   (ReturnWithHeaders returns the DTO directly)
//   401 -> session expired or membership revoked -> caller should send user to login.

import { useEffect, useRef, useState } from 'react';

/** CORS-enabled login API base derived from the current host, e.g.
 *  `app.trivis.ee` -> `https://login-api.trivis.ee`. Mirrors app-shell apexFor(). */
function apexHost(): string {
  if (typeof window === 'undefined') return 'trf.is';
  const parts = window.location.hostname.split('.');
  return parts.length >= 2 ? parts.slice(-2).join('.') : 'trf.is';
}

/** CORS-enabled login API base, e.g. `app.trivis.ee` -> `https://login-api.trivis.ee`. */
function loginApiBase(): string {
  return `https://login-api.${apexHost()}`;
}

/** User-facing login portal, e.g. `https://login.trivis.ee`. */
function loginPortalBase(): string {
  return `https://login.${apexHost()}`;
}

function readCookie(name: string): string | null {
  // JWT is base64url (cookie-safe), so read it raw — matches app-shell orgJwt().
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? m[1] : null;
}

function writeOrgCookie(name: string, value: string): void {
  const parts = window.location.hostname.split('.');
  const domain = parts.length >= 2 ? `; domain=.${parts.slice(-2).join('.')}` : '';
  const secure = window.location.protocol === 'https:' ? '; secure' : '';
  // 30-day cookie on the apex domain so every *.<apex> app shares it (mirrors the
  // theme cookie + the original login-portal cookie). max-age tracks the JWT TTL.
  document.cookie = `${name}=${value}; path=/; max-age=2592000; samesite=lax${domain}${secure}`;
}

export interface RenewResult {
  token: string | null;
  /** true when the server explicitly rejected the token (expired / revoked). */
  unauthorized: boolean;
}

/**
 * Renews the `trf_jwt_<slug>` token. On success writes the fresh token back to the
 * cookie and returns it. Returns `{ token: null }` on network failure (keep the old
 * token) and `{ token: null, unauthorized: true }` on 401 (session/membership gone).
 */
export async function renewOrgToken(
  slug: string,
  opts?: { apiBase?: string; signal?: AbortSignal },
): Promise<RenewResult> {
  const cookieName = `trf_jwt_${slug}`;
  const current = readCookie(cookieName);
  if (!current) return { token: null, unauthorized: false };

  const base = opts?.apiBase ?? loginApiBase();
  try {
    const res = await fetch(`${base}/v1/account/renew-token`, {
      method: 'POST',
      credentials: 'include',
      headers: { Bearer: current },
      signal: opts?.signal,
    });
    if (res.status === 401) return { token: null, unauthorized: true };
    if (!res.ok) return { token: null, unauthorized: false };
    const data: { token?: string } = await res.json();
    if (!data?.token) return { token: null, unauthorized: false };
    writeOrgCookie(cookieName, data.token);
    return { token: data.token, unauthorized: false };
  } catch {
    return { token: null, unauthorized: false }; // network blip — keep current token
  }
}

export interface UseRenewingTokenOptions {
  /** Renewal cadence in ms (default 30 min). Also renews on mount and tab focus. */
  intervalMs?: number;
  /** Called on a 401 (expired / membership revoked). Default: redirect to /login. */
  onUnauthorized?: () => void;
  /** Override the login API base (mainly for tests). */
  apiBase?: string;
}

/**
 * Returns the current org-scoped token as reactive state, renewing it on mount,
 * on tab focus, and every `intervalMs`. Drop-in replacement for a plain cookie read
 * in each app's `useOrgToken`, so `PermsProvider` re-renders with fresh permissions.
 */
export function useRenewingOrgToken(
  slug: string | null | undefined,
  opts: UseRenewingTokenOptions = {},
): string | null {
  const { intervalMs = 30 * 60 * 1000, onUnauthorized, apiBase } = opts;
  const [token, setToken] = useState<string | null>(() =>
    slug ? readCookie(`trf_jwt_${slug}`) : null,
  );
  // Keep callbacks/options out of the effect deps so they don't re-arm the timer.
  const cbRef = useRef(onUnauthorized);
  cbRef.current = onUnauthorized;

  useEffect(() => {
    if (!slug) {
      setToken(null);
      return;
    }
    setToken(readCookie(`trf_jwt_${slug}`));

    let cancelled = false;
    const controller = new AbortController();

    const run = async () => {
      const { token: fresh, unauthorized } = await renewOrgToken(slug, {
        apiBase,
        signal: controller.signal,
      });
      if (cancelled) return;
      if (unauthorized) {
        if (cbRef.current) cbRef.current();
        else window.location.href = loginPortalBase();
        return;
      }
      if (fresh) setToken(fresh);
    };

    run();
    const id = window.setInterval(run, intervalMs);
    const onFocus = () => run();
    window.addEventListener('focus', onFocus);

    return () => {
      cancelled = true;
      controller.abort();
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [slug, intervalMs, apiBase]);

  return token;
}
