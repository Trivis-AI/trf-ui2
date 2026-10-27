import React from 'react';
import { usePerms } from '../context/PermsContext';
import type { ServiceKey } from '../lib/permissions';
import { tr } from '../lib/i18n';

type Props = {
  service: ServiceKey;
  action?: 'read' | 'manipulate';
  fallback?: React.ReactNode;
  lookupFallback?: React.ReactNode;
  children: React.ReactNode;
};

export function RequireAccess({ service, action = 'read', fallback, lookupFallback, children }: Props) {
  const { can, needsLookup } = usePerms();

  if (needsLookup(service)) {
    return <>{lookupFallback ?? children}</>;
  }

  if (!can(service, action)) {
    return <>{fallback ?? <AccessDenied service={service} />}</>;
  }

  return <>{children}</>;
}

function AccessDenied({ service }: { service: ServiceKey }) {
  const label = service.charAt(0) + service.slice(1).toLowerCase();
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center text-muted-foreground p-10">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <p className="text-lg font-medium">{tr('<trn-ui-no-access-to-module>', 'No access to {module}').replace('{module}', label)}</p>
      <p className="text-sm max-w-[280px]">{tr('<trn-ui-ask-admin-for-access>', 'Ask your organization admin to grant you access to this module.')}</p>
    </div>
  );
}
