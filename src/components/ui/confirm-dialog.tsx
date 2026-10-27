import * as React from "react";
import { TriangleAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { tr } from "../../lib/i18n";
import { Button } from "./button";
import { Spinner } from "./spinner";
import { Alert, AlertDescription } from "./alert";

export interface ConfirmDialogProps {
  /** Controlled open state. */
  open: boolean;
  /** Confirm handler. If it returns a promise, the dialog stays busy until it settles. */
  onConfirm: () => void | Promise<void>;
  /** Cancel handler — also fired on Esc, overlay click, or the close button. */
  onCancel: () => void;
  /** Heading. Defaults to "Please confirm". */
  title?: React.ReactNode;
  /** The message (required). */
  description: React.ReactNode;
  /** Confirm button label. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Cancel button label. Defaults to "Cancel". */
  cancelLabel?: string;
  /** `"destructive"` renders a red confirm button. */
  variant?: "default" | "destructive";
  /** Force the busy state (disables both buttons, spinner on confirm). Auto-managed for async `onConfirm`. */
  busy?: boolean;
  /** Optional warning shown in an `Alert` above the footer. */
  warning?: React.ReactNode;
}

/**
 * Declarative confirm dialog built on `Dialog` + `Button`. Use directly when you already track the
 * open state; for imperative `await confirm(...)` call sites use {@link useConfirm}.
 */
export function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title = tr("<trn-please-confirm>", "Please confirm"),
  description,
  confirmLabel = tr("<trn-confirm>", "Confirm"),
  cancelLabel = tr("<trn-cancel>", "Cancel"),
  variant = "default",
  busy: busyProp,
  warning,
}: ConfirmDialogProps) {
  const [pending, setPending] = React.useState(false);
  const busy = busyProp || pending;

  const handleConfirm = async () => {
    const result = onConfirm();
    if (result && typeof (result as Promise<void>).then === "function") {
      try {
        setPending(true);
        await result;
      } finally {
        setPending(false);
      }
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Esc / overlay / close button → cancel, unless a confirm is in flight.
        if (!next && !busy) onCancel();
      }}
    >
      <DialogContent
        onEscapeKeyDown={(e) => busy && e.preventDefault()}
        onInteractOutside={(e) => busy && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {warning ? (
          <Alert variant="warning">
            <TriangleAlert />
            <AlertDescription>{warning}</AlertDescription>
          </Alert>
        ) : null}
        <DialogFooter>
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "primary"}
            onClick={handleConfirm}
            disabled={busy}
          >
            {busy ? <Spinner size="sm" className="text-current" /> : null}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Options for {@link useConfirm}'s `confirm()` — the declarative props minus the wiring. */
export type ConfirmOptions = Omit<ConfirmDialogProps, "open" | "onConfirm" | "onCancel">;

/**
 * Imperative, promise-based confirm. Reads like the native `confirm()` it replaces:
 *
 * ```tsx
 * const { confirm, dialog } = useConfirm();
 * if (!(await confirm({ description: "Delete this?", variant: "destructive", confirmLabel: "Delete" }))) return;
 * // …and render {dialog} once in the component.
 * ```
 *
 * Self-contained — no app-root provider required.
 */
export function useConfirm() {
  const [state, setState] = React.useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const stateRef = React.useRef(state);
  stateRef.current = state;

  const confirm = React.useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => setState({ options, resolve })),
    []
  );

  const resolveWith = React.useCallback((value: boolean) => {
    stateRef.current?.resolve(value);
    setState(null);
  }, []);

  const dialog = state ? (
    <ConfirmDialog
      {...state.options}
      open
      onConfirm={() => resolveWith(true)}
      onCancel={() => resolveWith(false)}
    />
  ) : null;

  return { confirm, dialog };
}
