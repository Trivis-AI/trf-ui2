import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

/*
 * Chat message. Two roles:
 *  - user      → primary-filled bubble, right-aligned, sharp bottom-right corner
 *  - assistant → card surface with border, left-aligned, sharp bottom-left corner
 * Place messages inside a vertical flex container (e.g. `Stack`); the `self-*`
 * utilities align each message to its side.
 * `fill` drops the 80% cap and stretches the bubble across the column: for narrow
 * columns such as the AI side panel, where the cap only wastes a fifth of the width.
 * `plain` takes the bubble off altogether: the message is text on the page, across the
 * column. For what the assistant answers, so that only the person's own messages are
 * bubbles; what asks the person to act (a question, an approval) keeps its frame.
 */
const chatMessageVariants = cva(
  "w-fit max-w-[80%] whitespace-pre-wrap break-words rounded-lg px-4 py-2.5 text-sm shadow-sm",
  {
    variants: {
      role: {
        user: "self-end rounded-br-sm bg-primary font-medium text-primary-foreground",
        assistant:
          "self-start rounded-bl-sm border border-border bg-card text-card-foreground",
      },
      fill: {
        true: "w-full max-w-none",
        false: "",
      },
      // After role and fill on purpose: `cn` lets the later class win, so these take the
      // surface, the border, the padding and the width cap off whichever role it is.
      plain: {
        true: "w-full max-w-none rounded-none border-0 bg-transparent px-0 py-0 font-normal text-foreground shadow-none",
        false: "",
      },
    },
    defaultVariants: { role: "assistant", fill: false, plain: false },
  }
);

export type ChatMessageRole = NonNullable<
  VariantProps<typeof chatMessageVariants>["role"]
>;

export interface ChatMessageProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "role">,
    VariantProps<typeof chatMessageVariants> {}

export const ChatMessage = React.forwardRef<HTMLDivElement, ChatMessageProps>(
  ({ role, fill, plain, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(chatMessageVariants({ role, fill, plain }), className)}
      {...props}
    />
  )
);
ChatMessage.displayName = "ChatMessage";

export { chatMessageVariants };
