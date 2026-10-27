import * as React from "react";
import { KeyRound, X } from "lucide-react";
import { Alert, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";
import { CopyField } from "./copy-field";
import { tr } from "../lib/i18n";

export interface SecretRevealProps {
  /** The secret to reveal and copy (API/MCP key, token, one-time invite link…). */
  value: string;
  /** Headline message, e.g. "Copy your API key — it won't be shown again". */
  message: React.ReactNode;
  /** Optional dismiss handler — renders a close (✕) button when provided. */
  onDismiss?: () => void;
  /** Fired after a successful copy — wire your app's toast here (the DS stays toast-free). */
  onCopy?: (value: string) => void;
  /** Label on the copy button. Default "Copy". */
  copyLabel?: string;
  /** Label after copy. Default "Copied". */
  copiedLabel?: string;
  className?: string;
}

/**
 * One-time secret reveal — surfaces a freshly created secret that can't be retrieved again
 * (API/MCP key, token, invite link) with a copy affordance and an optional dismiss. Built on
 * `Alert` (success) + `CopyField`. Toast-free: fire your app's toast from `onCopy`.
 */
export function SecretReveal({
  value,
  message,
  onDismiss,
  onCopy,
  copyLabel,
  copiedLabel,
  className,
}: SecretRevealProps) {
  return (
    <Alert variant="success" className={className}>
      <KeyRound />
      <div className="min-w-0 flex-1">
        <AlertTitle>{message}</AlertTitle>
        <CopyField
          value={value}
          className="mt-2"
          onCopy={onCopy}
          copyLabel={copyLabel}
          copiedLabel={copiedLabel}
        />
      </div>
      {onDismiss && (
        <Button type="button" variant="ghost" size="icon" aria-label={tr("<trn-dismiss>", "Dismiss")} onClick={onDismiss}>
          <X />
        </Button>
      )}
    </Alert>
  );
}
