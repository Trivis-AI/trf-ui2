import * as React from "react";
import {
  Bold,
  Code,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  SquareCode,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

/**
 * A textarea with a markdown toolbar.
 *
 * Notes fields render as markdown, but nothing in the UI said so, and the
 * syntax people got wrong most often was the one that mattered most: a fenced
 * code block. The toolbar is the affordance that the field is markdown at all.
 *
 * It edits the text rather than owning a rich-text model: what you type is what
 * gets stored, and the buttons only insert the same characters you could type
 * yourself. Nothing here can produce markup the plain textarea could not.
 */

type Edit = { next: string; selStart: number; selEnd: number };

// Wrap the selection (or a placeholder, when there is none) in delimiters.
function surround(
  value: string,
  start: number,
  end: number,
  before: string,
  after: string,
  placeholder: string
): Edit {
  const selected = value.slice(start, end) || placeholder;
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  return {
    next,
    selStart: start + before.length,
    selEnd: start + before.length + selected.length,
  };
}

// Prefix every line the selection touches. Ordered lists number as they go.
function prefixLines(value: string, start: number, end: number, prefix: string): Edit {
  const from = value.lastIndexOf("\n", start - 1) + 1;
  const toIdx = value.indexOf("\n", end);
  const to = toIdx === -1 ? value.length : toIdx;
  const lines = value.slice(from, to).split("\n");
  const ordered = prefix === "1. ";
  const body = lines
    .map((line, i) => (ordered ? `${i + 1}. ` : prefix) + line)
    .join("\n");
  const next = value.slice(0, from) + body + value.slice(to);
  return { next, selStart: from, selEnd: from + body.length };
}

// A fenced block always sits on its own lines, with the caret parked on the
// language tag, which is the part worth changing straight away.
function fence(value: string, start: number, end: number): Edit {
  const selected = value.slice(start, end) || "";
  const leading = start > 0 && value[start - 1] !== "\n" ? "\n" : "";
  const opening = `${leading}\`\`\``;
  const next =
    value.slice(0, start) + `${opening}\n${selected}\n\`\`\`\n` + value.slice(end);
  const tagAt = start + opening.length;
  return { next, selStart: tagAt, selEnd: tagAt };
}

interface Action {
  key: string;
  label: string;
  icon: React.ReactNode;
  run: (value: string, start: number, end: number) => Edit;
}

const ACTIONS: Action[] = [
  { key: "bold", label: "Bold", icon: <Bold />, run: (v, s, e) => surround(v, s, e, "**", "**", "bold text") },
  { key: "italic", label: "Italic", icon: <Italic />, run: (v, s, e) => surround(v, s, e, "*", "*", "italic text") },
  { key: "code", label: "Inline code", icon: <Code />, run: (v, s, e) => surround(v, s, e, "`", "`", "code") },
  { key: "fence", label: "Code block", icon: <SquareCode />, run: fence },
  { key: "link", label: "Link", icon: <Link2 />, run: (v, s, e) => surround(v, s, e, "[", "](url)", "text") },
  { key: "ul", label: "Bulleted list", icon: <List />, run: (v, s, e) => prefixLines(v, s, e, "- ") },
  { key: "ol", label: "Numbered list", icon: <ListOrdered />, run: (v, s, e) => prefixLines(v, s, e, "1. ") },
  { key: "quote", label: "Quote", icon: <Quote />, run: (v, s, e) => prefixLines(v, s, e, "> ") },
];

export interface MarkdownEditorProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange"> {
  value: string;
  onChange: (next: string) => void;
  /** Classes for the outer bordered container. */
  className?: string;
  /** Classes for the textarea itself (e.g. a font or a row count). */
  textareaClassName?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  className,
  textareaClassName,
  disabled,
  ...props
}: MarkdownEditorProps) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  const apply = (action: Action) => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart, selectionEnd } = el;
    const edit = action.run(value, selectionStart, selectionEnd);
    onChange(edit.next);
    // The value lands on the next render, so restore the caret after it.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(edit.selStart, edit.selEnd);
    });
  };

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-background shadow-xs transition-colors",
        "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 focus-within:ring-offset-background",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-wrap items-center gap-0.5 border-b border-border px-1 py-1">
          {ACTIONS.map((action) => (
            <Tooltip key={action.key}>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  disabled={disabled}
                  aria-label={action.label}
                  // Keep the textarea's selection: focusing a button would drop it.
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => apply(action)}
                >
                  {action.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{action.label}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </TooltipProvider>
      <Textarea
        ref={ref}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
          textareaClassName
        )}
        {...props}
      />
    </div>
  );
}
