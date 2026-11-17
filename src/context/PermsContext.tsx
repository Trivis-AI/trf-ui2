import React, { createContext, useContext, useMemo } from 'react';
import { parsePerms, parsePermsClaim, canRead, canManipulate, isLookup, type ServiceKey } from '../lib/permissions';

interface PermsContextValue {
  perms: bigint;
  can: (service: ServiceKey, action?: 'read' | 'manipulate') => boolean;
  needsLookup: (service: ServiceKey) => boolean;
  /** The person's own access would allow it; the company's package is what stops it. */
  limitedByPackage: (service: ServiceKey, action?: 'read' | 'manipulate') => boolean;
}

const PermsContext = createContext<PermsContextValue>({
  perms: 0n,
  can: () => false,
  needsLookup: () => false,
  limitedByPackage: () => false,
});

export function PermsProvider({ token, children }: { token: string; children: React.ReactNode }) {
  const value = useMemo<PermsContextValue>(() => {
    const perms = parsePerms(token);
    const before = parsePermsClaim(token, 'pr');
    const allows = (mask: bigint, service: ServiceKey, action: 'read' | 'manipulate') =>
      action === 'manipulate' ? canManipulate(mask, service) : canRead(mask, service);
    return {
      perms,
      can: (service, action = 'read') => allows(perms, service, action),
      needsLookup: (service) => isLookup(perms, service),
      limitedByPackage: (service, action = 'read') =>
        before !== null && !allows(perms, service, action) && allows(before, service, action),
    };
  }, [token]);

  return <PermsContext.Provider value={value}>{children}</PermsContext.Provider>;
}

export function usePerms() {
  return useContext(PermsContext);
}
