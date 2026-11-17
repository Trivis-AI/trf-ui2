// 4 states per 2-bit service slot in the permission bitmask (uint64 stored as p in JWT).
// BigInt is used throughout — JS bitwise operators are 32-bit only, which silently
// corrupts slots for services 17+ (bits 32+).

export const SLOT_NONE       = 0b00n;
export const SLOT_READ       = 0b01n;
export const SLOT_LOOKUP     = 0b10n;
export const SLOT_MANIPULATE = 0b11n;

// Slot index for each service — must stay in sync with trflib/auth ServiceID iota.
const SERVICE_SLOTS = {
  AI:        0,
  AUDIT:     1,
  CONTRACTS: 2,
  CRM:       3,
  INVOICES:  4,
  LEDGER:    5,
  PAYMENTS:  6,
  PRODUCTS:  7,
  PURCHASE:  8,
  REPORTS:   9,
  SETTINGS:  10,
  TABLES:    11,
  DOCRENDER: 12,
  FILES:     13,
  HR:        14,
  // Split from PRODUCTS (backitems /v1/stock/*) and CRM (deals) in trflib
  // v1.144.0. Every role holds the same state on them as on the parent slot.
  STOCK:     15,
  CRM_SALES: 16,
} as const;

export type ServiceKey = keyof typeof SERVICE_SLOTS;

export const PERMS = Object.fromEntries(
  Object.entries(SERVICE_SLOTS).map(([key, slot]) => [
    key,
    {
      slot,
      read:       1n << BigInt(slot * 2),
      manipulate: 1n << BigInt(slot * 2 + 1),
    },
  ])
) as {
  [K in ServiceKey]: { slot: number; read: bigint; manipulate: bigint };
};

export function parsePerms(token: string): bigint {
  return parsePermsClaim(token, 'p') ?? 0n;
}

/**
 * A permission-mask claim of the token: `p` (what the person may do), or `pr` (what their
 * role or access would allow before the company's package capped it; only present when the
 * package removed something, BUROO-AND-ACCESS.md phase 3). null when absent.
 */
export function parsePermsClaim(token: string, claim: 'p' | 'pr'): bigint | null {
  try {
    const [, encoded] = token.split('.');
    const payload = JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')));
    // Safe as a JSON number for up to 26 services (52 bits < Number.MAX_SAFE_INTEGER).
    const v = payload[claim];
    return typeof v === 'number' ? BigInt(Math.trunc(v)) : null;
  } catch {
    return null;
  }
}

/** The slot index of a service, as trflib numbers it (the `service` of a refusal). */
export function serviceSlot(service: ServiceKey): number {
  return SERVICE_SLOTS[service];
}

function slotFor(perms: bigint, service: ServiceKey): bigint {
  const idx = SERVICE_SLOTS[service];
  return (perms >> BigInt(idx * 2)) & 0b11n;
}

export function canRead(perms: bigint, service: ServiceKey): boolean {
  const slot = slotFor(perms, service);
  return slot === SLOT_READ || slot === SLOT_MANIPULATE;
}

export function canManipulate(perms: bigint, service: ServiceKey): boolean {
  return slotFor(perms, service) === SLOT_MANIPULATE;
}

export function isLookup(perms: bigint, service: ServiceKey): boolean {
  return slotFor(perms, service) === SLOT_LOOKUP;
}
