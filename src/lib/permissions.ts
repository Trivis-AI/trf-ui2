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
  try {
    const [, encoded] = token.split('.');
    const payload = JSON.parse(atob(encoded.replace(/-/g, '+').replace(/_/g, '/')));
    // p is safe as a JSON number for up to 26 services (52 bits < Number.MAX_SAFE_INTEGER).
    return payload.p ? BigInt(Math.trunc(payload.p)) : 0n;
  } catch {
    return 0n;
  }
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
