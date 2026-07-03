import * as React from "react";

export interface UseFileDropOptions {
  /** Called with the files from a drop, a clipboard paste, or the native file picker. */
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
}

export interface UseFileDropResult {
  /** True while a drag carrying files is over the dropzone element. */
  isDragging: boolean;
  /** Spread onto the dropzone container. */
  dropzoneProps: {
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
  /** Spread onto a hidden `<input type="file">`. */
  inputProps: {
    ref: React.RefObject<HTMLInputElement | null>;
    type: "file";
    accept?: string;
    multiple?: boolean;
    disabled?: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    tabIndex: -1;
  };
  /** Opens the native file picker (trigger from a "browse" button). */
  open: () => void;
}

/**
 * Drag-and-drop + clipboard-paste + click-to-browse file selection. Presentational-free: it only
 * collects `File[]` and hands them to `onFiles` — rendering the result (previews, upload state,
 * remove) is the caller's job, e.g. with `Attachment` / `AttachmentGroup`.
 */
export function useFileDrop({
  onFiles,
  accept,
  multiple = true,
  disabled = false,
}: UseFileDropOptions): UseFileDropResult {
  const [isDragging, setIsDragging] = React.useState(false);
  const dragCounter = React.useRef(0);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const emit = React.useCallback(
    (list: FileList | File[] | null | undefined) => {
      if (disabled || !list || list.length === 0) return;
      onFiles(multiple ? Array.from(list) : Array.from(list).slice(0, 1));
    },
    [disabled, multiple, onFiles]
  );

  const onDragOver = React.useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
    },
    [disabled]
  );

  const onDragEnter = React.useCallback(
    (e: React.DragEvent) => {
      if (disabled || !e.dataTransfer?.types.includes("Files")) return;
      e.preventDefault();
      dragCounter.current += 1;
      setIsDragging(true);
    },
    [disabled]
  );

  const onDragLeave = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const onDrop = React.useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      emit(e.dataTransfer?.files);
    },
    [emit]
  );

  // Window-level (not element-focus-based): clicking the dropzone to browse opens the native
  // file dialog and steals focus, so pasting can't depend on the dropzone itself being focused.
  // Skipped when focus is genuinely in a text field elsewhere on the page — that field owns paste.
  React.useEffect(() => {
    if (disabled) return;
    const onWindowPaste = (e: ClipboardEvent) => {
      if (!e.clipboardData?.files.length) return;
      const target = e.target as HTMLElement | null;
      const isEditable =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (isEditable) return;
      emit(e.clipboardData.files);
    };
    window.addEventListener("paste", onWindowPaste);
    return () => window.removeEventListener("paste", onWindowPaste);
  }, [disabled, emit]);

  const onChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      emit(e.target.files);
      // Reset so selecting the same file again still fires onChange.
      e.target.value = "";
    },
    [emit]
  );

  const open = React.useCallback(() => {
    if (!disabled) inputRef.current?.click();
  }, [disabled]);

  return {
    isDragging,
    dropzoneProps: { onDragOver, onDragEnter, onDragLeave, onDrop },
    inputProps: {
      ref: inputRef,
      type: "file",
      accept,
      multiple,
      disabled,
      onChange,
      tabIndex: -1,
    },
    open,
  };
}
