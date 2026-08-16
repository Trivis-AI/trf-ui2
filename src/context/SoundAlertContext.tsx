import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// Audible alerts — a named, repeating attention signal any app in the suite can
// raise, and the mechanism behind the support console's "somebody is waiting"
// chime.
//
// The point of it being here rather than in the page that needed it first: an
// alert is not a beep in a component. It has to survive navigation, keep
// sounding until the thing it is about is dealt with, respect a person's mute,
// and get out of the way of a more important alert. That is provider-shaped, and
// the second feature that wants it should not reinvent any of it.
//
// WHAT THIS DOES NOT DO: ship the audio. @trf/ui2 is consumed as raw source and
// deliberately carries no raster or binary assets (see src/assets/README.md) —
// an inlined mp3 would be a base64 blob every one of the 14 consumers clones.
// Each app registers its own file, and the ids are the shared vocabulary rather
// than the sounds.
//
// THE PART THAT IS EASY TO GET WRONG: browsers refuse to play audio until the
// page has had a real user gesture, and they refuse SILENTLY — play() returns a
// rejected promise nobody awaited. An alarm that quietly does not sound is worse
// than no alarm, so `blocked` is tracked and exposed: show the operator a button
// when it is true. Nothing else here is subtle.

export interface SoundAlertDefinition {
  /** URL the app serves the audio from — a bundled path like `/sounds/x.mp3`. */
  src: string;
  /** Per-sound trim, multiplied by the user's volume. 0-1, default 1. */
  volume?: number;
}

export interface SoundAlertOptions {
  /**
   * Milliseconds between repeats. Omitted (or 0) plays once — the one-shot
   * case, e.g. "the import finished". A waiting customer is not a one-shot.
   */
  repeatMs?: number;
  /** Higher wins when several alerts are active at once. Default 0. */
  priority?: number;
}

export interface SoundAlertsValue {
  /** Raise an alert. Calling it again with the same key updates its options. */
  start: (key: string, options?: SoundAlertOptions) => void;
  /** Silence one alert. Unknown keys are ignored. */
  stop: (key: string) => void;
  stopAll: () => void;
  /** Keys currently raised, loudest first. Usually a caller wants length > 0. */
  active: string[];
  muted: boolean;
  setMuted: (muted: boolean) => void;
  /** 0-1. */
  volume: number;
  setVolume: (volume: number) => void;
  /**
   * True when the browser has refused to play. Render an "enable sound" control
   * and call enable() from its click handler; a click is the gesture the
   * browser is waiting for.
   */
  blocked: boolean;
  enable: () => void;
}

const NOOP: SoundAlertsValue = {
  start: () => {},
  stop: () => {},
  stopAll: () => {},
  active: [],
  muted: false,
  setMuted: () => {},
  volume: 1,
  setVolume: () => {},
  blocked: false,
  enable: () => {},
};

const SoundAlertContext = createContext<SoundAlertsValue>(NOOP);

interface ActiveAlert extends SoundAlertOptions {
  key: string;
  startedAt: number;
}

interface StoredPrefs {
  muted?: boolean;
  volume?: number;
}

export interface SoundAlertProviderProps {
  /** id -> audio. A bare string is shorthand for `{ src }`. */
  sounds: Record<string, SoundAlertDefinition | string>;
  /**
   * localStorage key for mute and volume. Per app, because "mute the support
   * chime" is not a statement about any other app's sounds.
   */
  storageKey?: string;
  children: React.ReactNode;
}

function readPrefs(storageKey: string): StoredPrefs {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as StoredPrefs) : {};
  } catch {
    return {};
  }
}

export function SoundAlertProvider({
  sounds,
  storageKey = 'trf.sound-alerts',
  children,
}: SoundAlertProviderProps) {
  const stored = useMemo(() => readPrefs(storageKey), [storageKey]);
  const [muted, setMutedState] = useState(stored.muted ?? false);
  const [volume, setVolumeState] = useState(
    typeof stored.volume === 'number' ? Math.min(1, Math.max(0, stored.volume)) : 1,
  );
  const [blocked, setBlocked] = useState(false);
  const [active, setActive] = useState<ActiveAlert[]>([]);

  const audioRef = useRef<Record<string, HTMLAudioElement>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Set once a play has actually resolved — i.e. the browser has let audible
  // media through at least once. Until then the unlock listeners keep trying.
  const unlockedRef = useRef(false);
  // Read inside the ticker, which is created once per alert rather than once
  // per render — without the refs a mute would only take effect on the next
  // repeat, and a volume change never.
  const mutedRef = useRef(muted);
  const volumeRef = useRef(volume);
  mutedRef.current = muted;
  volumeRef.current = volume;

  const setMuted = useCallback(
    (next: boolean) => {
      setMutedState(next);
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({ muted: next, volume: volumeRef.current }),
        );
      } catch {
        // Private mode, quota, a browser with storage switched off. The setting
        // still applies to this tab; only its persistence is lost.
      }
    },
    [storageKey],
  );

  const setVolume = useCallback(
    (next: number) => {
      const clamped = Math.min(1, Math.max(0, next));
      setVolumeState(clamped);
      try {
        window.localStorage.setItem(
          storageKey,
          JSON.stringify({ muted: mutedRef.current, volume: clamped }),
        );
      } catch {
        // See above.
      }
    },
    [storageKey],
  );

  const audioFor = useCallback(
    (key: string): HTMLAudioElement | null => {
      if (typeof window === 'undefined') return null;
      const def = sounds[key];
      if (!def) return null;
      const src = typeof def === 'string' ? def : def.src;
      const existing = audioRef.current[key];
      if (existing && existing.src.endsWith(src)) return existing;
      const el = new Audio(src);
      el.preload = 'auto';
      audioRef.current[key] = el;
      return el;
    },
    [sounds],
  );

  const play = useCallback(
    (key: string) => {
      if (mutedRef.current) return;
      const el = audioFor(key);
      if (!el) return;
      const def = sounds[key];
      const trim = typeof def === 'string' ? 1 : (def?.volume ?? 1);
      el.volume = Math.min(1, Math.max(0, volumeRef.current * trim));
      el.muted = false;
      try {
        // Rewind: a repeat that arrives while the last one is still playing must
        // restart it, not be dropped as "already playing". Guarded because some
        // engines throw setting currentTime before any data has loaded.
        el.currentTime = 0;
      } catch {
        // Nothing to rewind yet.
      }
      const p = el.play();
      if (p && typeof p.then === 'function') {
        p.then(
          () => {
            unlockedRef.current = true;
            setBlocked(false);
          },
          (err: DOMException) => {
            // Only NotAllowedError means "the browser will not let you". A
            // failed decode, a 404 or a play() cut short by the next repeat all
            // reject too, and treating those as an autoplay block puts an
            // "enable sound" button in front of an operator that cannot fix
            // anything. Say which it was — this is the one failure mode that is
            // invisible from the server.
            if (err?.name === 'NotAllowedError') setBlocked(true)
            else
              console.warn(
                `[trf-ui2] sound alert "${key}" failed to play: ${err?.name}: ${err?.message}`,
              );
          },
        );
      }
    },
    [audioFor, sounds],
  );

  // The loudest active alert is the only one that sounds. Priority first, then
  // whoever has been waiting longest — two alerts of equal weight should not
  // interleave into something that sounds like a fault.
  const current = useMemo(() => {
    if (active.length === 0) return null;
    return [...active].sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.startedAt - b.startedAt,
    )[0];
  }, [active]);

  // Read by the unlock handler, which must not re-register its listeners every
  // time the active set changes.
  const currentRef = useRef<ActiveAlert | null>(null);
  currentRef.current = current ?? null;

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (!current) return;

    play(current.key);
    if (!current.repeatMs || current.repeatMs <= 0) return;
    timerRef.current = setInterval(() => play(current.key), current.repeatMs);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // Keyed on the alert's identity, not the array: re-running this on every
    // start() call would restart the chime from the top each poll.
  }, [current?.key, current?.repeatMs, play]); // eslint-disable-line react-hooks/exhaustive-deps

  // Unlock: play each sound for real, at zero volume, inside a user gesture.
  //
  // Two things here were wrong in the first version and both are worth stating,
  // because they are the difference between an alarm and a decoration.
  //
  // MUTED PRIMING GRANTS NOTHING. Muted playback is always permitted, so a
  // muted play() resolves without the browser ever deciding whether audible
  // playback is allowed — the element is no more unlocked afterwards than
  // before. What unlocks an element is having genuinely played AUDIBLE media
  // during a gesture, so this plays unmuted with volume 0: silent to the
  // operator, a real audible-playback grant to the browser.
  //
  // ONE ATTEMPT IS NOT ENOUGH. The listeners used to be {once:true}, so the
  // first click spent the only try whether or not it worked — a click landing
  // before the audio had loaded burned it. They now stay until a play has
  // actually resolved, and only then unregister.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      if (unlockedRef.current) return;
      Object.keys(sounds).forEach((key) => {
        const el = audioFor(key);
        if (!el) return;
        const restore = el.volume;
        el.muted = false;
        el.volume = 0;
        const p = el.play();
        if (p && typeof p.then === 'function') {
          p.then(
            () => {
              el.pause();
              try {
                el.currentTime = 0;
              } catch {
                // Nothing loaded yet; the next play starts from the top anyway.
              }
              el.volume = restore;
              unlockedRef.current = true;
              setBlocked(false);
              // An alert raised before the operator touched the page has been
              // failing silently until now. We are inside the gesture, so this
              // is the one moment it can be started — and the operator gets the
              // chime they were owed rather than waiting out another interval.
              if (currentRef.current) play(currentRef.current.key);
            },
            () => {
              el.volume = restore;
            },
          );
        }
      });
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [audioFor, play, sounds]);

  const start = useCallback((key: string, options?: SoundAlertOptions) => {
    setActive((prev) => {
      const existing = prev.find((a) => a.key === key);
      if (existing) {
        // Same alert, possibly new options. startedAt is preserved: an alert
        // re-raised by every poll must not keep resetting its own age.
        if (
          existing.repeatMs === options?.repeatMs &&
          existing.priority === options?.priority
        ) {
          return prev;
        }
        return prev.map((a) => (a.key === key ? { ...a, ...options } : a));
      }
      return [...prev, { key, startedAt: Date.now(), ...options }];
    });
  }, []);

  const stop = useCallback((key: string) => {
    setActive((prev) => (prev.some((a) => a.key === key) ? prev.filter((a) => a.key !== key) : prev));
    const el = audioRef.current[key];
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
  }, []);

  const stopAll = useCallback(() => {
    setActive([]);
    Object.values(audioRef.current).forEach((el) => {
      el.pause();
      el.currentTime = 0;
    });
  }, []);

  // enable() is called from a click, which is exactly the gesture the browser
  // withholds permission for. Playing audibly rather than priming silently is
  // deliberate: the operator pressed a button labelled "enable sound" and is
  // owed proof that it worked.
  //
  // Every registered sound is touched, not just the one alerting: the grant is
  // per element, and the next alert must not need its own button.
  const enable = useCallback(() => {
    Object.keys(sounds).forEach((key) => {
      const el = audioFor(key);
      if (!el) return;
      const restore = el.volume;
      el.muted = false;
      el.volume = 0;
      const p = el.play();
      if (p && typeof p.then === 'function') {
        p.then(
          () => {
            el.pause();
            el.volume = restore;
            unlockedRef.current = true;
            setBlocked(false);
          },
          () => {
            el.volume = restore;
          },
        );
      }
    });
    play(current ? current.key : Object.keys(sounds)[0]);
  }, [audioFor, current, play, sounds]);

  const value = useMemo<SoundAlertsValue>(
    () => ({
      start,
      stop,
      stopAll,
      active: [...active]
        .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.startedAt - b.startedAt)
        .map((a) => a.key),
      muted,
      setMuted,
      volume,
      setVolume,
      blocked,
      enable,
    }),
    [start, stop, stopAll, active, muted, setMuted, volume, setVolume, blocked, enable],
  );

  return <SoundAlertContext.Provider value={value}>{children}</SoundAlertContext.Provider>;
}

/**
 * Alerts for the current app. Outside a provider every call is a no-op, so a
 * component carrying an alert can be dropped into an app that has no sounds
 * registered without crashing it.
 */
export function useSoundAlerts(): SoundAlertsValue {
  return useContext(SoundAlertContext);
}

/**
 * Declarative form: the alert is raised while `when` is true and silenced when
 * it goes false or the component unmounts. This is what a page usually wants —
 * an alert tied to a condition cannot be left ringing by an early return.
 */
export function useSoundAlert(key: string, when: boolean, options?: SoundAlertOptions): void {
  const { start, stop } = useSoundAlerts();
  const repeatMs = options?.repeatMs;
  const priority = options?.priority;
  useEffect(() => {
    if (!when) {
      stop(key);
      return;
    }
    start(key, { repeatMs, priority });
    return () => stop(key);
  }, [key, when, repeatMs, priority, start, stop]);
}
