// Refusals a person can act on: out of tokens, a locked company, a module the package
// doesn't include, and growing into the next price range (BUROO-AND-ACCESS.md phase 7).
//
// Every app's API client goes through installAuthInterceptors / authFetch, which call
// noticeRefusal on an error response. A recognised refusal is raised as a `trf:refusal`
// window event; <RefusalDialogs/> (mounted once by trf-app-shell) explains it. The
// caller's promise still rejects exactly as before, so pages keep their own handling.

import { getOrgToken } from './renewToken';
import { slugFromPath } from './apiClient';

export type RangeQuote = {
  module?: string;
  from?: number;
  to?: number | null;
  current_total?: string;
  new_total?: string;
};

export type Refusal =
  | { kind: 'tokens' }
  | { kind: 'locked' }
  | { kind: 'package'; service: number }
  | { kind: 'range'; module: string; quote: RangeQuote };

export const REFUSAL_EVENT = 'trf:refusal';

/** The refusal a response body stands for, or null for any other error. */
export function classifyRefusal(status: number | undefined, body: unknown): Refusal | null {
  const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
  const message = typeof b.message === 'string' ? b.message : '';
  if (message === '<trn-insufficient-balance>' && (status === 402 || status === 403)) return { kind: 'tokens' };
  if (status === 423 && message === '<trn-org-read-only>') return { kind: 'locked' };
  if (status === 403 && message === '<trn-module-not-in-package>' && typeof b.service === 'number') {
    return { kind: 'package', service: b.service };
  }
  if (status === 402 && message === '<trn-module-range-confirm>' && b.quote && typeof b.quote === 'object') {
    const quote = b.quote as RangeQuote & { module?: string };
    return { kind: 'range', module: quote.module ?? '', quote };
  }
  return null;
}

/** Raises a refusal for <RefusalDialogs/>. Safe to call where nothing listens. */
export function raiseRefusal(r: Refusal): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<Refusal>(REFUSAL_EVENT, { detail: r }));
}

/** Classifies and raises; returns the refusal so the caller can skip a pointless retry. */
export function noticeRefusal(status: number | undefined, body: unknown): Refusal | null {
  const r = classifyRefusal(status, body);
  if (r) raiseRefusal(r);
  return r;
}

// ── What the dialogs need: backlogin GET /v1/billing/access-info ─────────────────────

export type ModuleOffer = {
  key: string;
  service: number;
  name_et: string;
  name_en: string;
  entitled: boolean;
  included: boolean;
  addon: boolean;
  ends_at?: string;
  monthly_net?: string;
  buyable: boolean;
};

export type AccessInfo = {
  package: string;
  package_name_et: string;
  package_name_en: string;
  role: string;
  is_owner: boolean;
  can_buy: boolean;
  admins: { name: string; role: string }[];
  modules: ModuleOffer[];
  balance: number;
  own?: number;
  pool?: number;
  low_balance_warning: number;
  locked: boolean;
  group?: { org_id: string; name: string };
};

function apexHost(): string {
  if (typeof window === 'undefined') return 'trf.is';
  const parts = window.location.hostname.split('.');
  return parts.length >= 2 ? parts.slice(-2).join('.') : 'trf.is';
}

/** The login portal (frontlogin), where buying and plan changes happen. */
export function loginPortalUrl(slug: string, path: string): string {
  return `https://login.${apexHost()}/app/${encodeURIComponent(slug)}${path}`;
}

const cache = new Map<string, { at: number; info: AccessInfo }>();
const TTL_MS = 60_000;

/**
 * The access info for the org in the URL (or `slug`), cached for a minute per org.
 * `fresh` skips the cache (after a refusal the balance may have changed).
 */
export async function fetchAccessInfo(opts: { slug?: string; fresh?: boolean; apiBase?: string } = {}): Promise<AccessInfo | null> {
  const slug = opts.slug ?? slugFromPath();
  if (!slug) return null;
  const hit = cache.get(slug);
  if (!opts.fresh && hit && Date.now() - hit.at < TTL_MS) return hit.info;
  const { token } = await getOrgToken(slug, { apiBase: opts.apiBase });
  if (!token) return null;
  const base = opts.apiBase ?? `https://login-api.${apexHost()}`;
  try {
    const res = await fetch(`${base}/v1/billing/access-info`, { credentials: 'include', headers: { Bearer: token } });
    if (!res.ok) return null;
    const info = (await res.json()) as AccessInfo;
    cache.set(slug, { at: Date.now(), info });
    return info;
  } catch {
    return null;
  }
}

/** Confirms growing `module` into its next range (owner/admin), echoing the quoted total. */
export async function confirmRange(module: string, newTotal: string, opts: { slug?: string; apiBase?: string } = {}): Promise<boolean> {
  const slug = opts.slug ?? slugFromPath();
  if (!slug) return false;
  const { token } = await getOrgToken(slug, { apiBase: opts.apiBase });
  if (!token) return false;
  let org = '';
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    org = payload?.o?.i ?? '';
  } catch {
    return false;
  }
  if (!org) return false;
  const base = opts.apiBase ?? `https://login-api.${apexHost()}`;
  const res = await fetch(`${base}/v1/organization/${org}/modules/${encodeURIComponent(module)}/confirm-range`, {
    method: 'POST',
    credentials: 'include',
    headers: { Bearer: token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ confirm_total: newTotal }),
  });
  return res.ok;
}
