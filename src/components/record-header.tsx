import * as React from "react";
import { cn } from "../lib/utils";
import { H1, Text } from "./typography";

/**
 * Identity block at the top of a record page (a contact, a contract, a ledger
 * entry): the record's name, its badges, and the identifiers people read to be
 * sure they opened the right one (Reg code, VAT, contract number, dates).
 *
 * It is page content, not chrome: it scrolls away with the page. The shell bar
 * keeps way-finding (the crumb) and live status (the meta pill), so this is the
 * one place the name reads at title size. Only record pages carry one; list and
 * settings pages leave naming to the shell bar (doc 17 §2).
 */
export interface RecordFact {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Monospace value, for codes and numbers people compare digit by digit. */
  mono?: boolean;
}

export interface RecordHeaderProps {
  title: React.ReactNode;
  /** Badges or tags beside the title (category, Archived, Bundle). */
  badges?: React.ReactNode;
  /** Identifier line under the title, as "label: value" pairs. */
  facts?: RecordFact[];
  /** A sentence under the facts, such as the record's own description. */
  description?: React.ReactNode;
  className?: string;
}

export function RecordHeader({ title, badges, facts, description, className }: RecordHeaderProps) {
  const shown = facts?.filter((f) => f.value !== null && f.value !== undefined && f.value !== "");
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <H1 className="min-w-0 break-words">{title}</H1>
        {badges}
      </div>
      {shown && shown.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {shown.map((f, i) => (
            <Text key={i} size="sm" tone="muted">
              {f.label}: <span className={cn("text-foreground", f.mono && "font-mono")}>{f.value}</span>
            </Text>
          ))}
        </div>
      )}
      {description && <Text size="sm" tone="muted">{description}</Text>}
    </div>
  );
}
