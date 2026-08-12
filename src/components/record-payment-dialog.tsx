import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Field } from "./ui/field";
import { Input } from "./ui/input";
import { Spinner } from "./ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Stack } from "./stack";
import { Row } from "./row";
import { Text } from "./typography";
import { cn } from "../lib/utils";

/** An account money can move from or into. */
export interface PaymentAccountOption {
  id: string;
  /** What a person calls it — the IBAN, or the bank name for a cash drawer. */
  label: string;
  kind: "iban" | "cash";
  /**
   * How money leaves this account, as a SENTENCE the user reads — "Will be sent
   * to LHV via Connect", "Will be added to the next bank file". Never a rail
   * dropdown: the rail is a property of the account, not a decision to make per
   * payment.
   */
  railSentence?: string;
  isDefault?: boolean;
}

export interface RecordPaymentSubmit {
  accountId: string;
  amount: string;
  paymentDate: string;
}

export interface RecordPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  /**
   * "pay" records an INTENTION to pay — money has not moved, so the dialog
   * promises a queued payment. "record" states money HAS moved and the document
   * settles now. The two differ only in copy and in what the caller's onSubmit
   * does; the form is the same because the act is the same.
   */
  mode: "pay" | "record";
  /** What is being settled, for the header line. */
  documentLabel: string;
  counterpartyName?: string;
  currencyCode?: string;
  /** Pre-fills the amount and is offered as "pay it all". */
  outstandingAmount: string;
  accounts: PaymentAccountOption[];
  defaultAccountId?: string;
  /** Defaults to today. */
  defaultDate?: string;
  /** Shown above the form — e.g. an IBAN that is not among the supplier's known
   *  accounts. The caller decides severity; this only renders it. */
  warning?: React.ReactNode;
  busy?: boolean;
  onSubmit: (v: RecordPaymentSubmit) => void;
  labels: RecordPaymentDialogLabels;
}

/** Every string the dialog renders. Supplied by the app so this component holds
 *  no copy and no translation dependency of its own. */
export interface RecordPaymentDialogLabels {
  payTitle: string;
  recordTitle: string;
  payDescription: string;
  recordDescription: string;
  fromAccount: string;
  intoAccount: string;
  change: string;
  amount: string;
  date: string;
  payAction: string;
  recordAction: string;
  cancel: string;
  noAccounts: string;
  working: string;
}

const today = () => new Date().toISOString().slice(0, 10);

/**
 * One dialog for the two moments a person settles a document: paying a purchase
 * invoice from the bank, and stating that a sales invoice was just paid.
 *
 * It exists to end an app switch. Both actions used to hand the user to the
 * Payments app to finish the job, which meant leaving the document they were
 * looking at to answer a question the invoice already knew the answer to.
 *
 * Two rules give it its shape:
 *
 *  - **A single account is not a question.** With one funding account the picker
 *    collapses to a sentence naming it, with a "change" link. Asking someone to
 *    choose from a list of one is the archetypal form-not-flow.
 *  - **The rail is never asked.** How money leaves an account is a property of
 *    the account, so it is stated as a sentence, not offered as a dropdown.
 *
 * Presentational on purpose: it takes accounts and returns a choice. Each app
 * talks to its OWN backend, so the submit belongs to the caller.
 */
export function RecordPaymentDialog({
  open,
  onClose,
  mode,
  documentLabel,
  counterpartyName,
  currencyCode,
  outstandingAmount,
  accounts,
  defaultAccountId,
  defaultDate,
  warning,
  busy,
  onSubmit,
  labels,
}: RecordPaymentDialogProps) {
  const preferred =
    defaultAccountId ??
    accounts.find((a) => a.isDefault)?.id ??
    accounts[0]?.id ??
    "";

  const [accountId, setAccountId] = React.useState(preferred);
  const [amount, setAmount] = React.useState(outstandingAmount);
  const [date, setDate] = React.useState(defaultDate ?? today());
  // Only shown once the user asks for it: with one account there is nothing to
  // pick, and with several the preselection is usually right.
  const [picking, setPicking] = React.useState(false);

  // Re-seed when the dialog is opened for a different document.
  React.useEffect(() => {
    if (!open) return;
    setAccountId(preferred);
    setAmount(outstandingAmount);
    setDate(defaultDate ?? today());
    setPicking(false);
    // preferred is derived from the two deps below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, outstandingAmount, defaultAccountId, defaultDate]);

  const chosen = accounts.find((a) => a.id === accountId);
  const amountNumber = Number.parseFloat(amount);
  const amountValid = Number.isFinite(amountNumber) && amountNumber > 0;
  const canSubmit = !busy && !!accountId && amountValid;

  const isPay = mode === "pay";
  const accountFieldLabel = isPay ? labels.fromAccount : labels.intoAccount;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isPay ? labels.payTitle : labels.recordTitle}</DialogTitle>
          <DialogDescription>
            {isPay ? labels.payDescription : labels.recordDescription}
          </DialogDescription>
        </DialogHeader>

        <Stack gap={3}>
          <Text size="sm" tone="muted">
            {documentLabel}
            {counterpartyName ? ` · ${counterpartyName}` : ""}
          </Text>

          {warning && (
            <Alert variant="warning">
              <AlertDescription>{warning}</AlertDescription>
            </Alert>
          )}

          {accounts.length === 0 ? (
            <Alert variant="destructive">
              <AlertDescription>{labels.noAccounts}</AlertDescription>
            </Alert>
          ) : picking ? (
            <Field label={accountFieldLabel} htmlFor="rp-account">
              <Select value={accountId} onValueChange={setAccountId}>
                <SelectTrigger id="rp-account">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : (
            // The no-question case: state the account, offer a way to change it.
            <Stack gap={0}>
              <Text size="xs" tone="muted">
                {accountFieldLabel}
              </Text>
              <Row gap={2} className="items-center">
                <Text weight="medium">{chosen?.label ?? "—"}</Text>
                {accounts.length > 1 && (
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => setPicking(true)}
                  >
                    {labels.change}
                  </Button>
                )}
              </Row>
              {chosen?.railSentence && (
                <Text size="xs" tone="muted">
                  {chosen.railSentence}
                </Text>
              )}
            </Stack>
          )}

          <Row gap={3} className={cn("items-start")}>
            <Field label={labels.amount} htmlFor="rp-amount" className="flex-1">
              <Input
                id="rp-amount"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                aria-invalid={!amountValid}
              />
            </Field>
            <Field label={labels.date} htmlFor="rp-date" className="flex-1">
              <Input
                id="rp-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Field>
          </Row>
          {currencyCode && (
            <Text size="xs" tone="muted">
              {currencyCode}
            </Text>
          )}
        </Stack>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            {labels.cancel}
          </Button>
          <Button
            disabled={!canSubmit}
            onClick={() => onSubmit({ accountId, amount, paymentDate: date })}
          >
            {busy && <Spinner />}
            {busy
              ? labels.working
              : isPay
                ? labels.payAction
                : labels.recordAction}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
