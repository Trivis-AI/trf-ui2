import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { tr } from "../../lib/i18n";

/**
 * FloatingWindow — a movable, resizable, non-modal panel for viewing reference material
 * (e.g. a source document) alongside a form the user keeps working in. Unlike Dialog, it
 * never traps focus, dims the page, or closes on outside interaction: drag it aside by its
 * header, resize it from the corner handle, and the rest of the page stays fully usable.
 */
const FloatingWindow: React.FC<React.ComponentPropsWithoutRef<typeof DialogPrimitive.Root>> = ({
  modal = false,
  ...props
}) => <DialogPrimitive.Root modal={modal} {...props} />;

const FloatingWindowTrigger = DialogPrimitive.Trigger;
const FloatingWindowClose = DialogPrimitive.Close;
const FloatingWindowPortal = DialogPrimitive.Portal;

interface DragHandle {
  onPointerDown: (e: React.PointerEvent) => void;
}
const DragHandleContext = React.createContext<DragHandle | null>(null);

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref && "current" in ref) (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

const FloatingWindowContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    /** Let the user drag the panel by its header. Default true. */
    draggable?: boolean;
    /** Let the user resize the panel from its bottom-right corner. Default true. */
    resizable?: boolean;
  }
>(({ className, style, children, draggable = true, resizable = true, ...props }, ref) => {
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null);

  const onHandlePointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      if (!draggable) return;
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startOffset = offset;
      const onPointerMove = (ev: PointerEvent) => {
        setOffset({ x: startOffset.x + (ev.clientX - startX), y: startOffset.y + (ev.clientY - startY) });
      };
      const onPointerUp = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [draggable, offset]
  );

  const onResizeHandlePointerDown = (e: React.PointerEvent) => {
    if (!resizable) return;
    e.preventDefault();
    const el = contentRef.current;
    if (!el) return;
    const startWidth = size?.width ?? el.offsetWidth;
    const startHeight = size?.height ?? el.offsetHeight;
    const startOffset = offset;
    const startX = e.clientX;
    const startY = e.clientY;
    const onPointerMove = (ev: PointerEvent) => {
      const width = Math.max(320, startWidth + (ev.clientX - startX));
      const height = Math.max(240, startHeight + (ev.clientY - startY));
      // The panel is centered via a -50%/-50% transform, so growing width/height alone would
      // shift the top-left corner too. Nudge the offset by half the growth to keep the
      // top-left corner anchored — only the bottom-right corner (where the handle is) moves.
      setOffset({
        x: startOffset.x + (width - startWidth) / 2,
        y: startOffset.y + (height - startHeight) / 2,
      });
      setSize({ width, height });
    };
    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  return (
    <FloatingWindowPortal>
      <DialogPrimitive.Content
        ref={mergeRefs(ref, contentRef)}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex w-full max-w-lg flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-lg",
          className
        )}
        style={{
          transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`,
          ...(size ? { width: size.width, height: size.height, maxWidth: "none" } : null),
          ...style,
        }}
        {...props}
      >
        <DragHandleContext.Provider value={draggable ? { onPointerDown: onHandlePointerDown } : null}>
          {children}
        </DragHandleContext.Provider>
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none [&_svg]:size-4"
          aria-label={tr("<trn-close>", "Close")}
        >
          <X />
        </DialogPrimitive.Close>
        {resizable && (
          <div
            role="separator"
            aria-label={tr("<trn-ui-resize-window>", "Resize")}
            aria-orientation="horizontal"
            onPointerDown={onResizeHandlePointerDown}
            className="absolute bottom-1 right-1 flex size-4 cursor-nwse-resize touch-none select-none items-center justify-center text-muted-foreground/50 hover:text-muted-foreground"
          >
            <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 3 3 13M13 8 8 13" />
            </svg>
          </div>
        )}
      </DialogPrimitive.Content>
    </FloatingWindowPortal>
  );
});
FloatingWindowContent.displayName = "FloatingWindowContent";

function FloatingWindowHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const drag = React.useContext(DragHandleContext);
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 text-left",
        drag && "cursor-grab touch-none select-none active:cursor-grabbing",
        className
      )}
      onPointerDown={drag?.onPointerDown}
      {...props}
    />
  );
}

const FloatingWindowTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("truncate text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
FloatingWindowTitle.displayName = "FloatingWindowTitle";

export {
  FloatingWindow,
  FloatingWindowTrigger,
  FloatingWindowClose,
  FloatingWindowPortal,
  FloatingWindowContent,
  FloatingWindowHeader,
  FloatingWindowTitle,
};
