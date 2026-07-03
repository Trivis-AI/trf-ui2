# Attachment

> **Status: ready** · `import { Attachment, ... } from "@trf/ui2"` · source: `src/components/ui/attachment.tsx`

A file/image attachment chip with media, metadata, upload state, and actions. For chat composers,
message threads, and upload lists.

## Usage

```tsx
<Attachment state="done">
  <AttachmentMedia><FileText /></AttachmentMedia>
  <AttachmentContent>
    <AttachmentTitle>invoice-1042.pdf</AttachmentTitle>
    <AttachmentDescription>PDF · 214 KB</AttachmentDescription>
  </AttachmentContent>
  <AttachmentActions>
    <AttachmentAction aria-label="Remove"><X /></AttachmentAction>
  </AttachmentActions>
</Attachment>

// Image preview
<Attachment>
  <AttachmentMedia variant="image"><img src={url} alt="" /></AttachmentMedia>
  <AttachmentContent>
    <AttachmentTitle>receipt.png</AttachmentTitle>
    <AttachmentDescription>PNG · 1.1 MB</AttachmentDescription>
  </AttachmentContent>
</Attachment>

// Whole-card click target (e.g. open a preview) — actions stay independently clickable
<Attachment>
  <AttachmentTrigger onClick={openPreview} aria-label="Open receipt.png" />
  <AttachmentMedia variant="image"><img src={url} alt="" /></AttachmentMedia>
  <AttachmentContent>
    <AttachmentTitle>receipt.png</AttachmentTitle>
  </AttachmentContent>
  <AttachmentActions>
    <AttachmentAction aria-label="Remove" onClick={remove}><X /></AttachmentAction>
  </AttachmentActions>
</Attachment>

// Horizontally scrolling list
<AttachmentGroup>
  <Attachment>…</Attachment>
  <Attachment>…</Attachment>
</AttachmentGroup>
```

## Props

| Component | Key props |
|---|---|
| `Attachment` | `state`: `idle \| uploading \| processing \| error \| done` (default `done`) · `size`: `default \| sm \| xs` · `orientation`: `horizontal \| vertical` |
| `AttachmentMedia` | `variant`: `icon \| image` — icon slot or `<img>` preview |
| `AttachmentTitle` / `AttachmentDescription` | plain text slots; title shimmers (`animate-pulse`) while `state` is `uploading`/`processing` |
| `AttachmentAction` | a `Button` defaulting to `variant="ghost" size="icon-xs"` — pass an `aria-label` |
| `AttachmentTrigger` | absolutely-positioned overlay button covering the whole card; supports `asChild`. Actions stay above it (`z-20` vs the trigger's `z-10`) so they remain independently clickable |
| `AttachmentGroup` | horizontally scrolling, snapping wrapper with an edge fade — wrap multiple `Attachment`s |

## Rules

- Upload state drives styling via `data-state` — don't hand-roll error/uploading colors.
- `AttachmentAction` icons are **Lucide only**, icon-only → `aria-label` (per house rules).
- Use `AttachmentTrigger` only when the whole card should be clickable (e.g. open a preview);
  otherwise omit it and put the click handler directly on an `AttachmentAction`.
- Don't recreate this as a `Card` + manual classes — the state/size/orientation variants exist so
  you don't have to.

## Related

- [Chat](chat.md) (composer this is typically used inside) · [Badge](badge.md) ·
  [13 AI Coding Guidelines](../13-ai-coding-guidelines.md)
