import React from 'react';
import { usePerms } from '../context/PermsContext';
import type { ServiceKey } from '../lib/permissions';
import { tr } from '../lib/i18n';
import { serviceSlot } from '../lib/permissions';
import { slugFromPath } from '../lib/apiClient';
import { loginPortalUrl } from '../lib/refusals';
import { adminNames, moduleName, useAccessInfo } from './refusal-dialogs';
import { Button } from './ui/button';

type Props = {
  service: ServiceKey;
  action?: 'read' | 'manipulate';
  fallback?: React.ReactNode;
  lookupFallback?: React.ReactNode;
  children: React.ReactNode;
};

export function RequireAccess({ service, action = 'read', fallback, lookupFallback, children }: Props) {
  const { can, needsLookup, limitedByPackage } = usePerms();

  if (needsLookup(service)) {
    return <>{lookupFallback ?? children}</>;
  }

  if (!can(service, action)) {
    return <>{fallback ?? <AccessDenied service={service} byPackage={limitedByPackage(service, action)} />}</>;
  }

  return <>{children}</>;
}

// Opening a page you can't use (e.g. from a bookmark), decision 10b: either the
// company's package doesn't include the module (owners/admins get the price and a way
// to add it), or the person's access doesn't (they are told whom to ask). Neutral tone.
function AccessDenied({ service, byPackage }: { service: ServiceKey; byPackage: boolean }) {
  const info = useAccessInfo();
  const slot = serviceSlot(service);
  const mod = info?.modules.find((m) => m.service === slot);
  const label = mod ? moduleName(mod) : service.charAt(0) + service.slice(1).toLowerCase();
  const ask = adminNames(info);
  const slug = slugFromPath();

  let title = tr('<trn-ui-no-access-to-module>', 'No access to {module}').replace('{module}', label);
  let text = tr('<trn-ui-ask-admin-for-access-named>', 'Ask {admin} to give you access.').replace('{admin}', ask);
  let action: React.ReactNode = null;
  if (byPackage) {
    title = tr('<trn-ui-not-in-package-title>', "{module} isn't in your package").replace('{module}', label);
    if (!info?.can_buy) {
      text = tr('<trn-ui-not-in-package-member>', 'Ask {admin} to add it.').replace('{admin}', ask);
    } else if (mod?.buyable && slug) {
      text = tr('<trn-ui-not-in-package-admin>', 'Add it for {price} + VAT a month, billed from the next invoice.')
        .replace('{price}', new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' }).format(Number(mod.monthly_net)));
      action = (
        <Button onClick={() => { window.location.href = loginPortalUrl(slug, `/manage-organization/members?add=${encodeURIComponent(mod.key)}#modules`); }}>
          {tr('<trn-ui-add-to-package>', 'Add to package')}
        </Button>
      );
    } else {
      text = tr('<trn-ui-not-in-package-contact>', 'Contact us to add it to your package.');
    }
  }
  return (
    <div className="flex flex-col items-center justify-center h-full gap-3 text-center text-muted-foreground p-10">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <p className="text-lg font-medium">{title}</p>
      <p className="text-sm max-w-[320px]">{text}</p>
      {action}
    </div>
  );
}
