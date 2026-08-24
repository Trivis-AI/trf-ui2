import * as React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "../lib/utils";
import { Input } from "./ui/input";
import { Button, type ButtonSize } from "./ui/button";

export interface CopyFieldProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onCopy"> {
  /** The value shown (read-only) and written to the clipboard. */
  value: string;
  /** Monospace the value — secrets, links and IDs read better mono. Default true. */
  mono?: boolean;
  /** Size of the copy button. Default "sm". */
  size?: ButtonSize;
  /** Label on the copy button. Default "Copy". */
  copyLabel?: string;
  /** Label shown briefly after a successful copy. Default "Copied". */
  copiedLabel?: string;
  /** Fired after the value is copied — e.g. fire a toast (`toast.success` from the barrel). */
  onCopy?: (value: string) => void;
  /** Fired if the clipboard write fails. */
  onCopyError?: (error: unknown) => void;
}

/**
 * A read-only value paired with a copy-to-clipboard button — for secrets, invite links, IDs.
 * Owns its transient "copied" state (icon + label swap, auto-resets after 2s) and selects the
 * text on focus so manual copy works too. The component shows no toast itself: fire one from
 * `onCopy` / `onCopyError` if the context needs it.
 */
export function CopyField({
  value,
  mono = true,
  size = "sm",
  copyLabel = "Copy",
  copiedLabel = "Copied",
  onCopy,
  onCopyError,
  className,
  ...props
}: CopyFieldProps) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      onCopy?.(value);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      onCopyError?.(error);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)} {...props}>
      <Input
        readOnly
        value={value}
        className={cn(mono && "font-mono text-xs")}
        onFocus={(e) => e.currentTarget.select()}
      />
      <Button type="button" variant="secondary" size={size} onClick={() => void copy()}>
        {copied ? <Check /> : <Copy />}
        {copied ? copiedLabel : copyLabel}
      </Button>
    </div>
  );
}
