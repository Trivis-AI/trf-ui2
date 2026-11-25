import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import { tr } from "../lib/i18n";
import { slugFromPath } from "../lib/apiClient";
import {
  REFUSAL_EVENT,
  confirmRange,
  fetchAccessInfo,
  loginPortalUrl,
  type AccessInfo,
  type ModuleOffer,
  type Refusal,
} from "../lib/refusals";

// The dialogs for refusals a person can act on (BUROO-AND-ACCESS.md phase 7, decisions
// 10, 15, 23): out of tokens, a locked company, a module outside the package, and the
// next price range. Owners and admins get the way forward; everyone else is told whom
// to ask. Neutral tone: nothing here is an error the person caused.

const eur = (amount?: string) =>
  amount ? new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(Number(amount)) : "—";

/** "Mari Maasikas or Jaan Tamm", or a generic "your company's administrator". */
export function adminNames(info: AccessInfo | null): string {
  const names = (info?.admins ?? []).map((a) => a.name).filter(Boolean).slice(0, 2);
  if (names.length === 0) return tr("<trn-ui-your-admin>", "your company's administrator");
  return names.join(` ${tr("<trn-ui-or>", "or")} `);
}

export function moduleName(m: Pick<ModuleOffer, "key" | "name_en"> | undefined): string {
  if (!m) return tr("<trn-ui-this-module>", "This module");
  return tr(`<trn-module-${m.key}>`, m.name_en || m.key);
}

/** The useful part of the access info for a dialog, fetched fresh after a refusal. */
export function useAccessInfo(slug?: string | null, fresh = false): AccessInfo | null {
  const [info, setInfo] = React.useState<AccessInfo | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    const s = slug ?? slugFromPath();
    if (!s) {
      setInfo(null);
      return;
    }
    void fetchAccessInfo({ slug: s, fresh }).then((i) => {
      if (!cancelled) setInfo(i);
    });
    return () => {
      cancelled = true;
    };
  }, [slug, fresh]);
  return info;
}

type Shown = { refusal: Refusal; info: AccessInfo | null; slug: string };

/**
 * Mount once per page (trf-app-shell does). Listens for `trf:refusal` events raised by the
 * shared API clients and shows one dialog at a time; refusals while one is open are dropped.
 */
export function RefusalDialogs() {
  const [shown, setShown] = React.useState<Shown | null>(null);
  const openRef = React.useRef(false);

  React.useEffect(() => {
    const onRefusal = (e: Event) => {
      const refusal = (e as CustomEvent<Refusal>).detail;
      const slug = slugFromPath();
      if (!refusal || !slug || openRef.current) return;
      openRef.current = true;
      setShown({ refusal, info: null, slug });
      void fetchAccessInfo({ slug, fresh: true }).then((info) =>
        setShown((cur) => (cur && cur.refusal === refusal ? { ...cur, info } : cur)),
      );
    };
    window.addEventListener(REFUSAL_EVENT, onRefusal);
    return () => window.removeEventListener(REFUSAL_EVENT, onRefusal);
  }, []);

  const close = () => {
    openRef.current = false;
    setShown(null);
  };

  return (
    <Dialog open={!!shown} onOpenChange={(next) => { if (!next) close(); }}>
      <DialogContent>{shown && <RefusalBody shown={shown} onClose={close} />}</DialogContent>
    </Dialog>
  );
}

function RefusalBody({ shown, onClose }: { shown: Shown; onClose: () => void }) {
  const { refusal, info, slug } = shown;
  const go = (path: string) => {
    window.location.href = loginPortalUrl(slug, path);
  };
  const ask = adminNames(info);
  const admin = !!info?.can_buy;

  if (!info) {
    return (
      <div className="flex justify-center p-6">
        <Spinner />
      </div>
    );
  }

  if (refusal.kind === "tokens" || refusal.kind === "locked") {
    if (info.group) {
      return (
        <Body
          title={tr("<trn-ui-group-out-title>", "{buroo} has run out of resources for your company").replace("{buroo}", info.group.name)}
          text={admin
            ? tr("<trn-ui-group-out-admin>", "You can continue on your own with the Standard package, or wait until {buroo} tops up.").replace("{buroo}", info.group.name)
            : tr("<trn-ui-group-out-member>", "Ask {admin} what to do next.").replace("{admin}", ask)}
          onClose={onClose}
          closeLabel={admin ? tr("<trn-ui-wait-for>", "Wait for {buroo}").replace("{buroo}", info.group.name) : undefined}
          actions={admin ? [{ label: tr("<trn-ui-continue-on-own>", "Continue on my own"), onClick: () => go("/manage-organization/members?group=leave#group") }] : []}
        />
      );
    }
    const title = refusal.kind === "locked"
      ? tr("<trn-ui-locked-title>", "The company is read only until its resources are topped up")
      : tr("<trn-ui-tokens-title>", "Not enough resources for this");
    return (
      <Body
        title={title}
        text={admin
          ? tr("<trn-ui-tokens-admin>", "Top up, or move to a package with more resources each month.")
          : tr("<trn-ui-tokens-member>", "Ask {admin} to top up the company's resources.").replace("{admin}", ask)}
        onClose={onClose}
        actions={admin
          ? [
              { label: tr("<trn-ui-change-plan>", "Change plan"), onClick: () => go("/overview?plan=1#credits"), secondary: true },
              { label: tr("<trn-ui-buy-tokens>", "Top up"), onClick: () => go("/overview#credits") },
            ]
          : []}
      />
    );
  }

  if (refusal.kind === "package") {
    const mod = info.modules.find((m) => m.service === refusal.service);
    const name = moduleName(mod);
    const title = tr("<trn-ui-not-in-package-title>", "{module} isn't in your package").replace("{module}", name);
    if (!admin) {
      return <Body title={title} text={tr("<trn-ui-not-in-package-member>", "Ask {admin} to add it.").replace("{admin}", ask)} onClose={onClose} />;
    }
    if (!mod?.buyable) {
      return <Body title={title} text={tr("<trn-ui-not-in-package-contact>", "Contact us to add it to your package.")} onClose={onClose} />;
    }
    return (
      <Body
        title={title}
        text={tr("<trn-ui-not-in-package-admin>", "Add it for {price} + VAT a month, billed from the next invoice.").replace("{price}", eur(mod.monthly_net))}
        onClose={onClose}
        actions={[{ label: tr("<trn-ui-add-to-package>", "Add to package"), onClick: () => go(`/manage-organization/members?add=${encodeURIComponent(mod.key)}#modules`) }]}
      />
    );
  }

  return <RangeBody refusal={refusal} info={info} ask={ask} onClose={onClose} />;
}

function RangeBody({ refusal, info, ask, onClose }: { refusal: Extract<Refusal, { kind: "range" }>; info: AccessInfo; ask: string; onClose: () => void }) {
  const [state, setState] = React.useState<"idle" | "busy" | "done" | "failed">("idle");
  const mod = info.modules.find((m) => m.key === refusal.module);
  const name = moduleName(mod ?? { key: refusal.module, name_en: refusal.module });
  const title = tr("<trn-ui-range-title>", "{module} is growing into the next price range").replace("{module}", name);
  if (!info.can_buy) {
    return <Body title={title} text={tr("<trn-ui-range-member>", "Ask {admin} to confirm the next price range.").replace("{admin}", ask)} onClose={onClose} />;
  }
  if (state === "done") {
    return <Body title={title} text={tr("<trn-ui-range-done>", "Confirmed. Repeat what you were doing and it will go through.")} onClose={onClose} />;
  }
  const confirm = async () => {
    setState("busy");
    const ok = await confirmRange(refusal.module, refusal.quote.new_total ?? "").catch(() => false);
    setState(ok ? "done" : "failed");
  };
  return (
    <Body
      title={title}
      text={state === "failed"
        ? tr("<trn-ui-range-failed>", "The price could not be confirmed. Please try again.")
        : tr("<trn-ui-range-admin>", "From the next invoice {module} costs {price} + VAT a month.")
            .replace("{module}", name)
            .replace("{price}", eur(refusal.quote.new_total))}
      onClose={onClose}
      busy={state === "busy"}
      actions={[{ label: tr("<trn-confirm>", "Confirm"), onClick: () => void confirm() }]}
    />
  );
}

type Action = { label: string; onClick: () => void; secondary?: boolean };

function Body({ title, text, onClose, actions = [], closeLabel, busy }: {
  title: string;
  text: string;
  onClose: () => void;
  actions?: Action[];
  closeLabel?: string;
  busy?: boolean;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{text}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          {closeLabel ?? (actions.length ? tr("<trn-cancel>", "Cancel") : tr("<trn-close>", "Close"))}
        </Button>
        {actions.map((a) => (
          <Button key={a.label} variant={a.secondary ? "secondary" : "primary"} onClick={a.onClick} disabled={busy}>
            {busy && !a.secondary ? <Spinner size="sm" /> : null}
            {a.label}
          </Button>
        ))}
      </DialogFooter>
    </>
  );
}

/**
 * The shell's quiet notes for owners and admins (decision 51, decision 23): resources below
 * `low_balance_warning` (for a büroo, with how many companies share it, and when it is empty),
 * and each billed module at 90 % of its price range. Links only; no dialog until something is
 * actually refused.
 */
export function LowBalanceNote({ slug, className }: { slug?: string | null; className?: string }) {
  const info = useAccessInfo(slug);
  const s = slug ?? slugFromPath();
  if (!info || !info.can_buy || !s) return null;
  const lines: { key: string; href: string; text: string }[] = [];

  const low = info.low_balance_warning > 0 && info.balance < info.low_balance_warning;
  if (low) {
    const shared = info.group_members ?? 0;
    // Users see resources, never tokens: no amounts here (the token is an internal unit).
    let text = info.balance <= 0 ? tr("<trn-ui-balance-empty>", "Resources used up") : tr("<trn-ui-low-balance>", "Resources running low");
    if (shared === 1) text += ` · ${tr("<trn-ui-shared-with-one>", "shared with 1 company")}`;
    else if (shared > 1) text += ` · ${tr("<trn-ui-shared-with>", "shared with {n} companies").replace("{n}", String(shared))}`;
    lines.push({ key: "balance", href: loginPortalUrl(s, "/overview#credits"), text: `${text} · ${tr("<trn-ui-buy-tokens>", "Top up")}` });
  }
  for (const n of info.range_notes ?? []) {
    lines.push({
      key: `range-${n.module}`,
      href: loginPortalUrl(s, "/manage-organization/members#modules"),
      text: tr("<trn-ui-range-near>", "{module} {count}/{to} · next range {price} a month")
        .replace("{module}", moduleName({ key: n.module, name_en: n.name_en }))
        .replace("{count}", String(n.count))
        .replace("{to}", String(n.range_to))
        .replace("{price}", eur(n.new_total)),
    });
  }
  if (lines.length === 0) return null;
  return (
    <div className={className}>
      {lines.map((l) => (
        <a key={l.key} href={l.href} title={l.text} className="block truncate text-xs text-muted-foreground hover:underline">
          {l.text}
        </a>
      ))}
    </div>
  );
}
