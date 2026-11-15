# Chat — ChatMessage, TypingIndicator, ChatComposer

> **Status: ready** · source: `src/components/{chat-message,typing-indicator,chat-composer}.tsx`

Primitives for AI / agent conversation UIs (used by `trffrontai`). They are presentational —
the app owns the session state, streaming, dictation, and file handling.

## ChatMessage — a message in a conversation

```tsx
import { ChatMessage, Stack } from "@trf/ui2";

<Stack gap={4}>
  <ChatMessage role="user">How do I file a VAT return?</ChatMessage>
  <ChatMessage role="assistant" plain>Here are the steps…</ChatMessage>
</Stack>
```

`role`: `user` (primary-filled, right-aligned) | `assistant` (card surface, left-aligned).
Default `assistant`. Bubbles self-align, so render them inside a vertical flex container
(`Stack` / `flex flex-col`). Content wraps and preserves newlines (`whitespace-pre-wrap`).
`fill`: the bubble stretches across its column instead of stopping at 80% of it. For narrow
columns, such as the AI side panel (320 to 560 px), where the cap only wastes space; the big
chat keeps the cap. Pass it on assistant bubbles; a user bubble stays its own width.
`plain`: no bubble at all. The message is text on the page, across its column, in the page's
own text colour. Use it for what the assistant answers (prose, a `TypingIndicator`, an error
line), so that the only bubbles in a conversation are the person's own messages. Leave it off
for what asks the person to act, a question with a reply input or an approval with its buttons:
that is a card, and it keeps the frame. `plain` already spans the column, so `fill` adds nothing
to it.
Compose richer content (a `TypingIndicator`, an `Alert`, reply inputs, approve/reject `Button`s)
as children.

## TypingIndicator — streaming / "thinking" dots

```tsx
import { TypingIndicator } from "@trf/ui2";

<TypingIndicator label="Thinking…" />
```

Three bouncing dots that inherit the surrounding text color (`bg-current`). `label` is optional.
Use inside a plain assistant `ChatMessage` while a response streams.

## ChatComposer — the message input shell

```tsx
import { ChatComposer, Textarea, Button } from "@trf/ui2";
import { Mic, Paperclip, ArrowUp } from "lucide-react";

<ChatComposer disabled={outOfCredits}>
  <div className="flex items-end gap-2">
    <Button variant="ghost" size="icon" aria-label="Dictate"><Mic /></Button>
    <Textarea rows={1} placeholder="Message…"
      className="min-h-0 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0" />
    <Button variant="ghost" size="icon" aria-label="Attach file"><Paperclip /></Button>
    <Button size="icon" aria-label="Send"><ArrowUp /></Button>
  </div>
</ChatComposer>
```

The rounded, bordered card surface with a `focus-within` ring. `disabled` dims it and blocks
interaction. Presentational only — fill it with primitives and own the send/upload/dictation
behaviour in the app.

## Related

- [05 Iconography](../05-iconography.md) · [layout](layout.md) · [inputs](inputs.md)
