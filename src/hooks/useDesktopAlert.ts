import { useCallback, useEffect, useRef, useState } from 'react';

// Desktop notifications — the attention channel that survives a page reload.
//
// This exists because audio does not. A browser withdraws permission to play
// audible sound on every load and only grants it back after the page has been
// interacted with, so an alarm that depends on audio alone is silent exactly
// when a console has been opened and left alone — which is the state a support
// console spends its day in.
//
// Notification permission works the other way round: asked for once, remembered
// for the profile, and honoured on every load afterwards with no gesture at
// all. The notification also carries the operating system's own alert sound and
// appears over other applications, so it works when the tab is hidden AND when
// the browser is not the focused window, which no in-page mechanism can do.
//
// Pair it with the audible alert rather than choosing: the chime is better when
// somebody is at the machine with the console open, the notification is better
// when they are not.

export interface DesktopAlertOptions {
  /** Raise the notification while true; withdraw it when false. */
  when: boolean;
  title: string;
  body?: string;
  /**
   * Collapses repeats into one OS notification instead of a stack. Required for
   * `signal` to re-alert.
   */
  tag?: string;
  /**
   * Re-fire while `when` stays true and this changes — e.g. the number of
   * people waiting going from 1 to 2, which is worth being told about.
   */
  signal?: string | number;
  /** Keep it on screen until dismissed rather than auto-hiding. */
  requireInteraction?: boolean;
  /**
   * Only notify while the console is not the focused window (default true).
   * Somebody looking straight at the queue does not need an OS toast about it;
   * they have the badge and the chime.
   */
  onlyWhenUnfocused?: boolean;
  /** Clicking the notification. Focus the window here if that is wanted. */
  onClick?: () => void;
}

export interface DesktopAlertState {
  /** False in browsers without the API, and in insecure contexts. */
  supported: boolean;
  permission: NotificationPermission;
  /**
   * Ask for permission. Call it from a click: some browsers require a gesture,
   * and all of them show a prompt the operator has to answer, which is only
   * fair when they have just pressed a button asking for it.
   */
  request: () => void;
}

const supported = typeof window !== 'undefined' && 'Notification' in window;

export function useDesktopAlert({
  when,
  title,
  body,
  tag,
  signal,
  requireInteraction = false,
  onlyWhenUnfocused = true,
  onClick,
}: DesktopAlertOptions): DesktopAlertState {
  const [permission, setPermission] = useState<NotificationPermission>(
    supported ? Notification.permission : 'denied',
  );
  const noticeRef = useRef<Notification | null>(null);
  // Held in a ref so a changing handler does not re-fire the notification.
  const onClickRef = useRef(onClick);
  onClickRef.current = onClick;

  const close = useCallback(() => {
    if (noticeRef.current) {
      noticeRef.current.close();
      noticeRef.current = null;
    }
  }, []);

  const show = useCallback(() => {
    if (!supported || Notification.permission !== 'granted') return;
    if (onlyWhenUnfocused && typeof document !== 'undefined' && document.hasFocus()) return;
    close();
    try {
      const notice = new Notification(title, {
        body,
        tag,
        requireInteraction,
        // Tagged notifications are otherwise replaced SILENTLY, which would
        // make "a second customer is now waiting" arrive without a sound.
        renotify: !!tag,
      } as NotificationOptions);
      notice.onclick = () => {
        window.focus();
        onClickRef.current?.();
        notice.close();
      };
      noticeRef.current = notice;
    } catch {
      // Some platforms throw on construction (notably older Android WebViews,
      // where notifications must come from a service worker). The in-page
      // alert is unaffected.
    }
  }, [body, close, onlyWhenUnfocused, requireInteraction, tag, title]);

  useEffect(() => {
    if (!when) {
      close();
      return;
    }
    show();
    // `when` and `signal` are the triggers. title/body are read at fire time
    // and deliberately do not re-fire on their own — they change as the count
    // is formatted, and that must not become a second notification.
  }, [when, signal, permission]); // eslint-disable-line react-hooks/exhaustive-deps

  // Withdraw it on unmount: a toast left on screen after the console is closed
  // points at a queue nobody can act on.
  useEffect(() => close, [close]);

  const request = useCallback(() => {
    if (!supported) return;
    void Notification.requestPermission().then((result) => {
      setPermission(result);
      // Granted while somebody is already waiting: tell them now rather than at
      // the next change, which might be an hour away.
      if (result === 'granted' && when) show();
    });
  }, [show, when]);

  return { supported, permission, request };
}
