import * as React from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import diff from "highlight.js/lib/languages/diff";
import go from "highlight.js/lib/languages/go";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import { cn } from "../lib/utils";

/**
 * Only the languages this product is written in, registered explicitly.
 * highlight.js ships ~190 grammars and pulls all of them in if you let it
 * auto-register; this keeps the bundle to the ones that actually appear in TRF
 * code blocks. tsx/jsx map onto the typescript/javascript grammars, and xml
 * covers html and svg.
 *
 * Colours come from the --syntax-* tokens (see styles/tokens.css), not from a
 * highlight.js theme stylesheet, so blocks follow the app's light/dark switch.
 */
const LANGUAGES = {
  bash, css, diff, go, javascript, json, sql, typescript, xml, yaml,
};

const REHYPE_PLUGINS = [
  // detect: false so an unfenced or unknown language is left as plain text
  // rather than guessed at, which mislabels short snippets more often than not.
  [rehypeHighlight, { languages: LANGUAGES, detect: false, ignoreMissing: true }],
] as const;

export interface MarkdownProps {
  /** Markdown source string (e.g. an AI response). */
  children: string;
  /** Wrapper class — controls base text size/color and block spacing. */
  className?: string;
  /**
   * Override or extend individual element renderers. Merged over the
   * defaults, so you can replace just `a` or `code` without losing the rest.
   */
  components?: Components;
}

/*
 * Markdown renderer for chat / AI responses and other rich text.
 *
 * Built on react-markdown + remark-gfm (tables, strikethrough, task lists,
 * autolinks). Raw HTML in the source is NOT rendered — react-markdown escapes
 * it by default and we deliberately don't add rehype-raw, so untrusted model
 * output can't inject markup. Each element maps to a token-styled tag rather
 * than relying on a `prose` plugin, so it inherits the surrounding bubble's
 * color and stays in sync with the design system.
 *
 * Links open in a new tab with `rel="noopener noreferrer"`.
 */

// react-markdown passes a `node` (hast element) prop to every renderer. We
// strip it so it never reaches the DOM, and type props with the local React
// `…WithoutRef` helpers — this keeps the renderers independent of the
// @types/react copy react-markdown's own types resolve to (avoids a duplicate-
// types `ref` clash when this source is compiled inside a linked workspace).
type Renderer<E extends keyof React.JSX.IntrinsicElements> = (
  props: React.ComponentPropsWithoutRef<E> & { node?: unknown }
) => React.JSX.Element;

const baseComponents = {
  p: ({ node, className, ...props }) => (
    <p className={cn("mb-2 leading-relaxed last:mb-0", className)} {...props} />
  ),
  a: ({ node, className, ...props }) => (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "font-medium text-primary underline underline-offset-2 hover:opacity-80",
        className
      )}
      {...props}
    />
  ),
  ul: ({ node, className, ...props }) => (
    <ul className={cn("mb-2 list-disc space-y-1 pl-5 last:mb-0", className)} {...props} />
  ),
  ol: ({ node, className, ...props }) => (
    <ol className={cn("mb-2 list-decimal space-y-1 pl-5 last:mb-0", className)} {...props} />
  ),
  li: ({ node, className, ...props }) => (
    <li className={cn("leading-relaxed", className)} {...props} />
  ),
  h1: ({ node, className, ...props }) => (
    <h1 className={cn("mb-2 mt-4 text-lg font-semibold first:mt-0", className)} {...props} />
  ),
  h2: ({ node, className, ...props }) => (
    <h2 className={cn("mb-2 mt-4 text-base font-semibold first:mt-0", className)} {...props} />
  ),
  h3: ({ node, className, ...props }) => (
    <h3 className={cn("mb-1 mt-3 text-sm font-semibold first:mt-0", className)} {...props} />
  ),
  h4: ({ node, className, ...props }) => (
    <h4 className={cn("mb-1 mt-3 text-sm font-semibold first:mt-0", className)} {...props} />
  ),
  blockquote: ({ node, className, ...props }) => (
    <blockquote
      className={cn(
        "mb-2 border-l-2 border-border pl-3 italic text-muted-foreground last:mb-0",
        className
      )}
      {...props}
    />
  ),
  hr: ({ node, className, ...props }) => (
    <hr className={cn("my-4 border-border", className)} {...props} />
  ),
  // Inline code. Block code is the same <code> nested in <pre>, where the
  // `pre` styles below neutralise this background/padding.
  //
  // Colour is set explicitly rather than inherited: inherited put
  // muted-foreground on a muted chip, too faint to read, and plain `foreground`
  // was legible but identical to the body text around it, so code did not read
  // as code. `--code` is its own token, with a hue clear of every status colour.
  code: ({ node, className, ...props }) => (
    <code
      className={cn(
        "rounded bg-muted px-1 py-0.5 font-mono text-[0.85em] text-code",
        className
      )}
      {...props}
    />
  ),
  pre: ({ node, className, ...props }) => (
    <pre
      className={cn(
        "mb-2 overflow-x-auto rounded-md bg-muted p-3 text-xs text-code last:mb-0",
        "[&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit",
        className
      )}
      {...props}
    />
  ),
  img: ({ node, className, alt, ...props }) => (
    <img loading="lazy" alt={alt ?? ""} className={cn("my-2 max-w-full rounded-md", className)} {...props} />
  ),
  // GFM tables — wrapped in a rounded, bordered scroll container (same pattern
  // as TableCard) so the outer corners follow the `--radius` token. The wrapper
  // owns the outer border + `overflow-hidden`; cells draw only the inner
  // gridlines (no outer cell border → no square corners poking through). The
  // wrapper lives on `table` since react-markdown has no element above it.
  table: ({ node, className, ...props }) => (
    <div className="mb-2 overflow-hidden rounded-lg border border-border last:mb-0">
      <div className="overflow-x-auto">
        <table
          className={cn(
            "w-full border-collapse text-sm [&_tr:last-child_td]:border-b-0",
            className
          )}
          {...props}
        />
      </div>
    </div>
  ),
  th: ({ node, className, ...props }) => (
    <th
      className={cn(
        "border-b border-border bg-muted px-2 py-1 text-left font-semibold [&:not(:last-child)]:border-r",
        className
      )}
      {...props}
    />
  ),
  td: ({ node, className, ...props }) => (
    <td
      className={cn(
        "border-b border-border px-2 py-1 [&:not(:last-child)]:border-r",
        className
      )}
      {...props}
    />
  ),
} satisfies {
  p: Renderer<"p">; a: Renderer<"a">; ul: Renderer<"ul">; ol: Renderer<"ol">;
  li: Renderer<"li">; h1: Renderer<"h1">; h2: Renderer<"h2">; h3: Renderer<"h3">;
  h4: Renderer<"h4">; blockquote: Renderer<"blockquote">; hr: Renderer<"hr">;
  code: Renderer<"code">; pre: Renderer<"pre">; img: Renderer<"img">;
  table: Renderer<"table">; th: Renderer<"th">; td: Renderer<"td">;
};

export function Markdown({ children, className, components }: MarkdownProps) {
  const merged = React.useMemo(
    () =>
      (components
        ? { ...(baseComponents as Components), ...components }
        : (baseComponents as Components)),
    [components]
  );
  return (
    // `whitespace-normal` guards against a `white-space: pre-wrap` ancestor (e.g.
    // a chat bubble): react-markdown leaves newline text nodes between blocks,
    // and under pre-wrap each one renders as a stray blank line. The DOM
    // structure carries the layout, never the source whitespace.
    <div className={cn("whitespace-normal text-sm leading-relaxed", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={REHYPE_PLUGINS as never}
        components={merged}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
