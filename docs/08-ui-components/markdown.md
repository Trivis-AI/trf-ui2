# Markdown & MarkdownEditor

> **Status: ready** · `import { Markdown, MarkdownEditor } from "@trf/ui2"` ·
> source: `src/components/markdown.tsx`, `src/components/markdown-editor.tsx`

`Markdown` renders markdown (AI responses, notes fields, rich text). `MarkdownEditor` is the
matching write side: a plain textarea with a formatting toolbar.

## Markdown

Built on `react-markdown` + `remark-gfm` (tables, strikethrough, task lists, autolinks). Every
element maps to a token-styled tag rather than a `prose` plugin, so it inherits the surrounding
bubble's colour and stays in sync with the design system. Links open in a new tab with
`rel="noopener noreferrer"`.

```tsx
<Markdown>{message.content}</Markdown>

// Replace just one renderer; the rest of the defaults stay.
<Markdown components={{ a: (props) => <RouterLink {...props} /> }}>
  {doc.body}
</Markdown>
```

Props: `children` (the markdown source string), `className` (wrapper, controls base text
size/colour and block spacing), `components` (merged over the defaults).

**Raw HTML in the source is not rendered.** react-markdown escapes it by default and `rehype-raw`
is deliberately absent, so untrusted model output cannot inject markup. Do not add it.

### Syntax highlighting

Code fences are highlighted by `rehype-highlight` against **ten explicitly registered grammars**:
bash, css, diff, go, javascript, json, sql, typescript, xml, yaml (tsx/jsx map onto the
typescript/javascript grammars; xml covers html and svg). highlight.js ships ~190 grammars and
pulls all of them in if left to auto-register, so the set is capped to what actually appears in
TRF code blocks.

Colours come from the `--syntax-*` tokens (see [03 Design Tokens](../03-design-tokens.md)), not a
highlight.js theme stylesheet, so blocks follow the app's light/dark switch.

Two behaviours worth knowing:

- A fence tagged with a language the tokeniser does not know has that class **stripped**, so the
  block falls through to auto-detection instead of rendering with no colour at all. (A pasted Go
  file whose `package` line ended up on the fence produced `language-package` and a completely
  flat block.)
- Detection is on, so a bare ` ``` ` fence, which is how most people write one, still gets
  highlighted. That is only risky against the full grammar set; against ten it has few ways to go
  wrong.

## MarkdownEditor

A textarea with a markdown toolbar. Notes fields render as markdown, but nothing in the UI said
so, and the syntax people got wrong most often was the one that mattered most: a fenced code
block. The toolbar is the affordance that the field is markdown at all.

It edits **text**, not a rich-text model: what you type is what gets stored, and the buttons only
insert the same characters you could type yourself. Nothing here can produce markup the plain
textarea could not.

```tsx
<Field label="Notes" htmlFor="notes">
  <MarkdownEditor
    id="notes"
    value={notes}
    onChange={setNotes}
    rows={8}
    placeholder="Markdown supported"
  />
</Field>
```

Props: `value`, `onChange(next: string)`, `className` (outer bordered container),
`textareaClassName` (the textarea itself, e.g. a font or row count), plus every native textarea
prop except `value` / `onChange`.

Toolbar actions: bold, italic, inline code, code block, link, bulleted list, numbered list,
quote. Wrapping actions insert a placeholder when there is no selection; list and quote actions
prefix every line the selection touches; a code fence lands on its own lines with the caret parked
on the language tag. The caret is restored after each edit.

## Rules

- Pair the two: if a field is edited with `MarkdownEditor`, render it with `Markdown`.
- Do not add `rehype-raw` or otherwise enable raw HTML.
- Adding a language means registering its grammar in `markdown.tsx` **and** adding its aliases to
  `KNOWN_LANGUAGES`. Miss the second and the fence tag gets stripped as unknown.

## Related

- [Chat](chat.md) · [Inputs & Field](inputs.md) · [03 Design Tokens](../03-design-tokens.md)
