import * as React from "react";
import { LIVE_GLOW_MS } from "../components/table/live-change";

/**
 * Glow a detail-page value that changed because of somebody else's write.
 *
 * `trigger` changes when the page refreshes for an external reason (a live
 * change event, a resync); the hook then compares the value before and after
 * that refresh and reports `changed` for LIVE_GLOW_MS. A value that changes
 * without a trigger (the person typing) never glows, and a trigger without a
 * value change glows nothing.
 *
 *   const due = useChangeHighlight(invoice.due_date, liveVersion);
 *   <Input value={due_date} {...due.props} />
 */
export function useChangeHighlight(
  value: unknown,
  trigger: number | string | boolean | undefined
): { changed: boolean; props: { "data-live"?: "field" } } {
  const [changed, setChanged] = React.useState(false);
  const armed = React.useRef<{ trigger: typeof trigger; value: unknown; at: number } | null>(null);
  const lastTrigger = React.useRef(trigger);
  const lastValue = React.useRef(value);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    if (trigger !== lastTrigger.current) {
      // Arm with the value as it was before this refresh.
      armed.current = { trigger, value: lastValue.current, at: Date.now() };
      lastTrigger.current = trigger;
    }
    const arm = armed.current;
    if (arm && Date.now() - arm.at < 10_000 && !Object.is(arm.value, value)) {
      armed.current = null;
      setChanged(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setChanged(false), LIVE_GLOW_MS);
    }
    lastValue.current = value;
  }, [trigger, value]);

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return { changed, props: changed ? { "data-live": "field" } : {} };
}
