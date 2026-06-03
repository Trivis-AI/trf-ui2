// @trf/ui2 — public API barrel.
// Consumed as raw .tsx via `github:triiberg/trf-ui2#master` (no build step).
// NOTE: this barrel is required because trf-ui2 is consumed as a package.

// Utils
export { cn } from "./lib/utils";

// Primitives
export { Button, buttonVariants } from "./components/ui/button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./components/ui/button";

export { Badge, badgeVariants } from "./components/ui/badge";
export type { BadgeProps, BadgeVariant } from "./components/ui/badge";

export { Input } from "./components/ui/input";
export type { InputProps } from "./components/ui/input";

export { Textarea } from "./components/ui/textarea";
export type { TextareaProps } from "./components/ui/textarea";

export { Label } from "./components/ui/label";

export { Field } from "./components/ui/field";
export type { FieldProps } from "./components/ui/field";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./components/ui/card";

export { Spinner } from "./components/ui/spinner";
export type { SpinnerProps, SpinnerSize } from "./components/ui/spinner";

export { Separator } from "./components/ui/separator";

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./components/ui/dialog";
