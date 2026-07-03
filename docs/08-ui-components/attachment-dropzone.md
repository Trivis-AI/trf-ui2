# AttachmentDropzone & useFileDrop

> **Status: ready** · `import { AttachmentDropzone, useFileDrop } from "@trf/ui2"` ·
> source: `src/components/attachment-dropzone.tsx`, `src/hooks/useFileDrop.ts`

A working file picker: drag-and-drop, clipboard paste, and click-to-browse, rendered as
`Attachment` chips. Built on the `Attachment` primitive (`attachment.md`) — see that doc for the
chip's own props/states.

## useFileDrop

Presentational-free hook — collects `File[]` from a drop, a paste, or the native file input and
hands them to `onFiles`. Use it directly if `AttachmentDropzone`'s rendering doesn't fit.

```tsx
const { isDragging, dropzoneProps, inputProps, open } = useFileDrop({
  onFiles: (files) => console.log(files),
  accept: "image/*",
  multiple: true,
});

<div {...dropzoneProps} data-dragging={isDragging || undefined}>
  <input {...inputProps} className="sr-only" />
  <button onClick={open}>Browse…</button>
</div>
```

## AttachmentDropzone

Controlled — the caller owns the `files` array (assigns ids) and the actual upload; per-file
`state` drives the chip's uploading/processing/error styling.

```tsx
const [files, setFiles] = useState<AttachmentDropzoneFile[]>([]);

<AttachmentDropzone
  files={files}
  onFilesAdded={(added) => {
    const withIds = added.map((file) => ({ id: crypto.randomUUID(), file, state: "uploading" as const }));
    setFiles((f) => [...f, ...withIds]);
    withIds.forEach((f) => upload(f.file).then(
      () => setFiles((fs) => fs.map((x) => (x.id === f.id ? { ...x, state: "done" } : x))),
      () => setFiles((fs) => fs.map((x) => (x.id === f.id ? { ...x, state: "error", description: "Failed" } : x)))
    ));
  }}
  onRemove={(id) => setFiles((f) => f.filter((x) => x.id !== id))}
  accept="image/*,application/pdf"
/>
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `files` | `{ id, file, state?, description? }[]` | Owned by the caller. |
| `onFilesAdded` | `(files: File[]) => void` | Fires on drop, paste, or file-picker selection. |
| `onRemove` | `(id: string) => void` | Chip's remove action. |
| `accept`, `multiple`, `disabled` | — | Passed to the underlying `<input type="file">`. |
| `placeholder` | `string` | Empty-state prompt and "add more" button label. |

## Rules

- The dropzone does **not** upload — it only collects files. Own the actual upload and drive
  per-file `state`/`description` from the result.
- Image files preview via an object URL (revoked on unmount); everything else shows a `FileText`
  icon.
- Don't reimplement drag/drop/paste by hand — compose `useFileDrop` (or `AttachmentDropzone`
  directly) so behavior stays consistent across apps.
- **Paste is window-level, not focus-based.** Clicking the dropzone opens the native file dialog
  (steals focus), so paste can't depend on the dropzone itself being focused — `useFileDrop`
  listens on `window` instead, skipping the paste only when focus is genuinely in a text
  input/textarea/contenteditable elsewhere. This means Cmd+V works without clicking first, but
  also that **only one `AttachmentDropzone` should be mounted at a time** — with two on the same
  page, a paste would add to both.

## Related

- [Attachment](attachment.md) · [13 AI Coding Guidelines](../13-ai-coding-guidelines.md)
