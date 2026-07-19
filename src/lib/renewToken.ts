// Org-token acquisition.
//
// Org-scoped session JWTs are no longer stored as one cookie per org. That design sent
// every `trf_jwt_<slug>` cookie on every request to `*.trivis.ee` (the browser auto-
// attaches them even though no backend reads them — backends read the `Bearer` header the
// JS sets), so at ~20 orgs the Cookie header blew past the 8 KB nginx/ALB limit → 400/431.
//
// Instead, each tab MINTS the org token for the slug in its URL via
// `POST /v1/account/org-token`, authenticated by the account session cookie (`jwt_token`),
// and caches it in memory + `sessionStorage` (per tab, never sent as a cookie). The Cookie
// header is now one constant-size account cookie regardless of org count, so an accountant
// can switch between thousands of orgs. The mint re-reads the role from the DB and is
// denied for removed members (see AUTH_UPGRADE.md), so this also keeps permissions fresh.
//
// Backwards-compatible: if a legacy `trf_jwt_<slug>` cookie still exists it is used and
// seeded into the cache, so sessions created before the cutover keep working.

import { useEffect, useRef, useState } from 'react';
import { setDateTimeLocale, dateTimeLocaleFromToken } from './datetime';

const ACCOUNT_COOKIE = 'jwt_token';        // account session, set at login on the apex
const LEGACY_PREFIX = 'trf_jwt_';          // pre-cutover per-org cookies
const CACHE_PREFIX = 'trf_org_jwt_';       // sessionStorage key for the minted org token
const REFRESH_SKEW_MS = 60 * 1000;         // re-mint when within this window of expiry

/** Apex host, e.g. `crm.trivis.ee` -> `trivis.ee`. Mirrors app-shell apexFor(). */
function apexHost(): string {
  if (typeof window === 'undefined') return 'trf.is';
  const parts = window.location.hostname.split('.');
  return parts.length >= 2 ? parts.slice(-2).join('.') : 'trf.is';
}

/** CORS-enabled login API base, e.g. `crm.trivis.ee` -> `https://login-api.trivis.ee`. */
function loginApiBase(): string {
  return `https://login-api.${apexHost()}`;
}

/** User-facing login portal, e.g. `https://login.trivis.ee`. */
function loginPortalBase(): string {
  return `https://login.${apexHost()}`;
}

function readCookie(name: string): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? m[1] : null;
}

/** Expiry (ms) from a JWT's `exp`, or 0 if it can't be read. */
function jwtExpMs(token: string): number {
  try {
    const [, payload] = token.split('.');
    const claims = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return claims?.exp ? claims.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

/** A token is usable if it exists and isn't within the refresh window of expiring.
 *  Unknown-exp tokens are treated as usable (the server is the real gate). */
function fresh(token: string | null): boolean {
  if (!token) return false;
  const exp = jwtExpMs(token);
  return exp === 0 ? true : exp - Date.now() > REFRESH_SKEW_MS;
}

// In-memory cache (per tab / JS context) — the fastest path and the source of truth for
// the current tab; sessionStorage backs it so a reload doesn't force a re-mint.
const mem = new Map<string, string>();

function cacheKey(slug: string): string {
  return CACHE_PREFIX + slug;
}

function writeCache(slug: string, token: string): void {
  mem.set(slug, token);
  // Every org token funnels through here (mint, reload, legacy migration), so this is the
  // one spot that keeps the suite date/time locale in sync with the account's language
  // claim — zero per-app wiring. No-op when the resolved locale hasn't changed.
  setDateTimeLocale(dateTimeLocaleFromToken(token));
  try {
    sessionStorage.setItem(cacheKey(slug), token);
  } catch {
    /* ignore quota/availability errors — memory cache still holds it */
  }
}

function readCache(slug: string): string | null {
  const m = mem.get(slug);
  if (m) return m;
  try {
    const s = sessionStorage.getItem(cacheKey(slug));
    if (s) {
      mem.set(slug, s);
      setDateTimeLocale(dateTimeLocaleFromToken(s));
      return s;
    }
  } catch {
    /* sessionStorage unavailable (rare) — fall through */
  }
  // Migration: a legacy per-org cookie still identifies the org; use and seed it.
  const legacy = readCookie(LEGACY_PREFIX + slug);
  if (legacy) {
    writeCache(slug, legacy);
    return legacy;
  }
  return null;
}

export interface RenewResult {
  token: string | null;
  /** true when the server rejected the credential (expired / membership revoked). */
  unauthorized: boolean;
}

/**
 * Mints a fresh org token for `slug` via POST /v1/account/org-token. The bearer credential
 * is the account session cookie; failing that, any cached/legacy org token (which still
 * identifies the account server-side). Returns `{unauthorized:true}` when there is no
 * session or the server rejects it (401) — caller should send the user to login.
 */
export async function mintOrgToken(
  slug: string,
  opts?: { apiBase?: string; signal?: AbortSignal },
): Promise<RenewResult> {
  // The account session cookie (`jwt_token`) is HttpOnly, so JS can't read it — it is
  // auto-sent with credentials:'include'. Send a Bearer only if we actually have one in JS
  // (a cached org token, or a non-HttpOnly token on native/legacy); never send `Bearer:
  // null`, which would defeat the server's cookie fallback.
  const bearer = readCookie(ACCOUNT_COOKIE) ?? readCache(slug);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (bearer) headers.Bearer = bearer;

  const base = opts?.apiBase ?? loginApiBase();
  try {
    const res = await fetch(`${base}/v1/account/org-token`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ slug }),
      signal: opts?.signal,
    });
    if (res.status === 401) return { token: null, unauthorized: true };
    if (!res.ok) return { token: null, unauthorized: false };
    const data: { token?: string } = await res.json();
    if (!data?.token) return { token: null, unauthorized: false };
    writeCache(slug, data.token);
    return { token: data.token, unauthorized: false };
  } catch {
    return { token: null, unauthorized: false }; // network blip — keep whatever we have
  }
}

/**
 * Returns a usable org token for `slug`: the cached one if still fresh, otherwise a freshly
 * minted one. On a non-auth mint failure (network/5xx) it falls back to the (possibly
 * stale) cached token so the app keeps working; the server validates it regardless.
 */
export async function getOrgToken(
  slug: string,
  opts?: { apiBase?: string; signal?: AbortSignal },
): Promise<RenewResult> {
  const cached = readCache(slug);
  if (fresh(cached)) return { token: cached, unauthorized: false };
  const minted = await mintOrgToken(slug, opts);
  if (minted.token || minted.unauthorized) return minted;
  return { token: cached, unauthorized: false };
}

/** Synchronous best-effort read (memory → sessionStorage → legacy cookie). Use where
 *  awaiting a mint is impractical; pair with `getOrgToken` to refresh. */
export function peekOrgToken(slug: string | null | undefined): string | null {
  return slug ? readCache(slug) : null;
}

/** @deprecated Renamed to {@link getOrgToken}; kept for back-compat. */
export async function renewOrgToken(
  slug: string,
  opts?: { apiBase?: string; signal?: AbortSignal },
): Promise<RenewResult> {
  return getOrgToken(slug, opts);
}

/** Deletes legacy `trf_jwt_<slug>` cookies so they stop bloating the request header. Safe
 *  to call on every app load during/after the cutover — org tokens now live in the cache. */
export function clearLegacyOrgCookies(): void {
  if (typeof document === 'undefined') return;
  const parts = window.location.hostname.split('.');
  const domain = parts.length >= 2 ? `; domain=.${parts.slice(-2).join('.')}` : '';
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0].trim();
    if (name.startsWith(LEGACY_PREFIX)) {
      document.cookie = `${name}=; path=/; max-age=0; samesite=lax${domain}`;
      document.cookie = `${name}=; path=/; max-age=0`; // host-only variant, just in case
    }
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
 * Returns the org-scoped token for `slug` as reactive state, minting it on mount, on tab
 * focus, and every `intervalMs`. Drop-in replacement for the old cookie-reading hook, so
 * `PermsProvider` re-renders with fresh permissions. Tokens are cached per tab; nothing is
 * written to cookies.
 */
export function useRenewingOrgToken(
  slug: string | null | undefined,
  opts: UseRenewingTokenOptions = {},
): string | null {
  const { intervalMs = 30 * 60 * 1000, onUnauthorized, apiBase } = opts;
  const [token, setToken] = useState<string | null>(() => (slug ? readCache(slug) : null));
  const cbRef = useRef(onUnauthorized);
  cbRef.current = onUnauthorized;

  useEffect(() => {
    if (!slug) {
      setToken(null);
      return;
    }
    setToken(readCache(slug));

    let cancelled = false;
    const controller = new AbortController();

    const run = async () => {
      const { token: freshToken, unauthorized } = await getOrgToken(slug, {
        apiBase,
        signal: controller.signal,
      });
      if (cancelled) return;
      if (unauthorized) {
        if (cbRef.current) cbRef.current();
        else window.location.href = loginPortalBase();
        return;
      }
      if (freshToken) setToken(freshToken);
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
