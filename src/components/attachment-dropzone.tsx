import * as React from "react";
import { FilePlus, FileText, Upload, X } from "lucide-react";
import { cn } from "../lib/utils";
import { useFileDrop } from "../hooks/useFileDrop";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  type AttachmentState,
} from "./ui/attachment";
import { Text } from "./typography";
import { Button } from "./ui/button";

export interface AttachmentDropzoneFile {
  id: string;
  file: File;
  /** Defaults to "done" — set "uploading"/"processing"/"error" while the caller's upload runs. */
  state?: AttachmentState;
  /** Overrides the auto-generated "PDF · 214 KB" line (e.g. an error message). */
  description?: string;
}

export interface AttachmentDropzoneProps {
  files: AttachmentDropzoneFile[];
  /** Dropped, pasted, or picked files — add them to `files` (assign ids) in the parent. */
  onFilesAdded: (files: File[]) => void;
  onRemove: (id: string) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  /** Shown in the empty state and as the "add more" affordance's label. */
  placeholder?: string;
  className?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function fileKind(file: File): string {
  return file.name.split(".").pop()?.toUpperCase() ?? (file.type || "File");
}

function ImagePreview({ file }: { file: File }) {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    // Create + revoke in the same effect — with a memo/effect split, Strict Mode's
    // mount-cleanup-remount cycle revokes the memoized URL before it's ever validly rendered.
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  if (!url) return null;
  return <img src={url} alt="" />;
}

/**
 * A drag-and-drop / paste / click-to-browse file picker that renders selected files as
 * `Attachment` chips. Controlled — the caller owns `files` and handles the actual upload;
 * per-file `state` drives the chip's uploading/processing/error styling.
 */
export function AttachmentDropzone({
  files,
  onFilesAdded,
  onRemove,
  accept,
  multiple = true,
  disabled = false,
  placeholder = "Drag files here, paste, or click to browse",
  className,
}: AttachmentDropzoneProps) {
  const { isDragging, dropzoneProps, inputProps, open } = useFileDrop({
    onFiles: onFilesAdded,
    accept,
    multiple,
    disabled,
  });

  const images = files.filter(({ file }) => file.type.startsWith("image/"));
  const otherFiles = files.filter(({ file }) => !file.type.startsWith("image/"));

  const addButton = (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={open}
      disabled={disabled}
      className="self-center shrink-0"
    >
      <FilePlus className="size-4" />
      Select files...
    </Button>
  );

  return (
    <div
      {...dropzoneProps}
      data-dragging={isDragging || undefined}
      data-disabled={disabled || undefined}
      tabIndex={disabled ? undefined : 0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      }}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-dashed border-input p-4 transition-colors focus-visible:outline-none",
        "data-[dragging]:border-primary data-[dragging]:bg-accent",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <input {...inputProps} className="sr-only" />

      {files.length === 0 ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={open}
            disabled={disabled}
            className="flex flex-col items-center gap-2 py-4 text-muted-foreground"
          >
            <Upload className="size-5" />
            <Text size="sm" tone="muted">{placeholder}</Text>
          </button>
          {addButton}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {images.length > 0 && (
            <AttachmentGroup className="py-0">
              {images.map(({ id, file, state = "done", description }) => (
                <Attachment key={id} state={state} orientation="vertical">
                  <AttachmentMedia variant="image">
                    <ImagePreview file={file} />
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{file.name}</AttachmentTitle>
                    <AttachmentDescription>
                      {description ?? `${fileKind(file)} · ${formatSize(file.size)}`}
                    </AttachmentDescription>
                  </AttachmentContent>
                  <AttachmentActions>
                    <AttachmentAction aria-label={`Remove ${file.name}`} onClick={() => onRemove(id)}>
                      <X />
                    </AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              ))}
            </AttachmentGroup>
          )}
          {otherFiles.map(({ id, file, state = "done", description }) => (
            <Attachment key={id} state={state} className="w-full">
              <AttachmentMedia>
                <FileText />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{file.name}</AttachmentTitle>
                <AttachmentDescription>
                  {description ?? `${fileKind(file)} · ${formatSize(file.size)}`}
                </AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction aria-label={`Remove ${file.name}`} onClick={() => onRemove(id)}>
                  <X />
                </AttachmentAction>
              </AttachmentActions>
            </Attachment>
          ))}
          {addButton}
        </div>
      )}
    </div>
  );
}
