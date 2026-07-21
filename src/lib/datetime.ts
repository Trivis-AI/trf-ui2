// Locale-aware date/time formatting — the single source of truth for how the TRF suite
// renders dates and times. Apps stop hand-rolling `toLocaleDateString('et-EE', ...)` /
// `Intl.DateTimeFormat(undefined, ...)` at call sites and use these formatters (or the
// components built on them: DateCell, DatePicker, DateTimePicker, MonthPicker).
//
// The locale is module state, not a React prop, because the same format must apply in
// component code and in plain functions (CSV export, document titles). Set it once at app
// startup via `setDateTimeLocale(dateTimeLocaleFromToken(token))`. Components subscribe via
// `useDateTimeLocale()` (useSyncExternalStore) so a locale that arrives after first render
// (the org token is minted asynchronously) still re-renders them.
//
// Resolution order (dateTimeLocaleFromToken): account locale claim (`a.l`, the per-user
// Language in account settings) → org country claim (`o.c`) → undefined (browser default).

import * as React from "react";

/** Explicit date-format presets a user can pick in account settings (JWT claim `a.df`).
 *  When set, they win over the locale-derived format. */
export const DATE_FORMAT_PRESETS = ["DD.MM.YYYY", "DD/MM/YYYY", "YYYY-MM-DD", "MMM D, YYYY"] as const;
export type DateFormatPreset = (typeof DATE_FORMAT_PRESETS)[number];

/** Time-format presets (JWT claim `a.tf`). Default (unset) is 24h. */
export const TIME_FORMAT_PRESETS = ["24h", "12h"] as const;
export type TimeFormatPreset = (typeof TIME_FORMAT_PRESETS)[number];

export interface DateTimePrefs {
  locale: string | undefined;
  dateFormat: DateFormatPreset | undefined;
  timeFormat: TimeFormatPreset | undefined;
}

let currentLocale: string | undefined;
let currentDateFormat: DateFormatPreset | undefined;
let currentTimeFormat: TimeFormatPreset | undefined;
const listeners = new Set<() => void>();

// Account locale values ("et"/"en" today) → full BCP 47 tags so date output is
// deterministic per language, not per browser region. "en" maps to en-GB on purpose:
// day-first ordering, which is what every market this product serves expects.
const LANG_LOCALE: Record<string, string> = {
  et: "et-EE",
  ee: "et-EE", // legacy translation-client code for Estonian
  en: "en-GB",
  lv: "lv-LV",
  lt: "lt-LT",
};

// Org country (OrganizationClaim.Country, full English name) → locale fallback.
const COUNTRY_LOCALE: Record<string, string> = {
  Estonia: "et-EE",
  Latvia: "lv-LV",
  Lithuania: "lt-LT",
};

interface Formatters {
  date: Intl.DateTimeFormat;
  time: Intl.DateTimeFormat;
  month: Intl.DateTimeFormat;
}

let formatters: Formatters | null = null;

// A user-picked date preset renders identically in every locale; implemented with a fixed
// Intl locale per preset so punctuation/order can't drift with the viewer's browser.
const PRESET_LOCALE: Record<DateFormatPreset, [string, Intl.DateTimeFormatOptions]> = {
  "DD.MM.YYYY": ["et-EE", { day: "2-digit", month: "2-digit", year: "numeric" }],
  "DD/MM/YYYY": ["en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }],
  "YYYY-MM-DD": ["sv-SE", { year: "numeric", month: "2-digit", day: "2-digit" }],
  "MMM D, YYYY": ["en-US", { month: "short", day: "numeric", year: "numeric" }],
};

function getFormatters(): Formatters {
  if (!formatters) {
    // Explicit user preset wins; otherwise the suite-wide default: fully numeric in the
    // locale's own order and punctuation ("25.06.2026" et-EE, "25/06/2026" en-GB).
    // Numeric beats month names in accounting tables: compact, scannable. (dateStyle
    // "medium" would spell the month out in Estonian: "25. juuni 2026".)
    const [dateLocale, dateOpts]: [string | undefined, Intl.DateTimeFormatOptions] =
      currentDateFormat
        ? PRESET_LOCALE[currentDateFormat]
        : [currentLocale, { day: "2-digit", month: "2-digit", year: "numeric" }];
    formatters = {
      date: new Intl.DateTimeFormat(dateLocale, dateOpts),
      // Time defaults to 24h (finance suite convention); "12h" is a user opt-in.
      time:
        currentTimeFormat === "12h"
          ? new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", hour12: true })
          : new Intl.DateTimeFormat(currentLocale, {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }),
      month: new Intl.DateTimeFormat(currentLocale, { month: "long", year: "numeric" }),
    };
  }
  return formatters;
}

/** Normalize a language code or BCP 47 tag to something Intl accepts, or undefined. */
function canonicalize(tag: string | null | undefined): string | undefined {
  const trimmed = (tag ?? "").trim();
  if (!trimmed) return undefined;
  const mapped = LANG_LOCALE[trimmed.toLowerCase()] ?? trimmed;
  try {
    return Intl.getCanonicalLocales(mapped)[0];
  } catch {
    return undefined;
  }
}

/**
 * Set the suite-wide date/time locale (`undefined` = browser default). Call once at app
 * startup, and again whenever the auth token (re)arrives. Accepts short account-locale
 * codes ("et", "en") or full tags ("et-EE"); invalid input falls back to the browser.
 */
export function setDateTimeLocale(locale: string | undefined): void {
  setDateTimePrefs({ locale, dateFormat: currentDateFormat, timeFormat: currentTimeFormat });
}

function asDatePreset(v: string | null | undefined): DateFormatPreset | undefined {
  return DATE_FORMAT_PRESETS.includes(v as DateFormatPreset) ? (v as DateFormatPreset) : undefined;
}

function asTimePreset(v: string | null | undefined): TimeFormatPreset | undefined {
  return TIME_FORMAT_PRESETS.includes(v as TimeFormatPreset) ? (v as TimeFormatPreset) : undefined;
}

/**
 * Set all display preferences at once (locale + explicit format overrides). Unknown or
 * missing values fall back to the locale-derived defaults. One change notification.
 */
export function setDateTimePrefs(prefs: {
  locale?: string | null;
  dateFormat?: string | null;
  timeFormat?: string | null;
}): void {
  const nextLocale = canonicalize(prefs.locale);
  const nextDate = asDatePreset(prefs.dateFormat);
  const nextTime = asTimePreset(prefs.timeFormat);
  if (nextLocale === currentLocale && nextDate === currentDateFormat && nextTime === currentTimeFormat) return;
  currentLocale = nextLocale;
  currentDateFormat = nextDate;
  currentTimeFormat = nextTime;
  formatters = null;
  listeners.forEach((fn) => fn());
}

/** The full current preference set. */
export function getDateTimePrefs(): DateTimePrefs {
  return { locale: currentLocale, dateFormat: currentDateFormat, timeFormat: currentTimeFormat };
}

/** The locale formatters currently use, or undefined when on the browser default. */
export function getDateTimeLocale(): string | undefined {
  return currentLocale;
}

function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Subscribe to the current date/time locale from a component. DateCell and the pickers use
 * this so they re-format when `setDateTimeLocale` runs after mount (async token mint).
 */
export function useDateTimeLocale(): string | undefined {
  return React.useSyncExternalStore(subscribe, getDateTimeLocale, getDateTimeLocale);
}

function prefsKey(): string {
  return `${currentLocale ?? ""}|${currentDateFormat ?? ""}|${currentTimeFormat ?? ""}`;
}

/**
 * Subscribe to ALL date/time preferences (locale + format overrides) from a component.
 * Returns a composite key that changes whenever any preference changes; DateCell and the
 * pickers use this so a format override arriving after mount re-renders them.
 */
export function useDateTimePrefs(): string {
  return React.useSyncExternalStore(subscribe, prefsKey, prefsKey);
}

/**
 * Resolve the display locale from a TRF org/session JWT: the account's chosen language
 * (`a.l`) wins, else the org country (`o.c`), else undefined (browser default).
 * Tolerates missing/malformed tokens — never throws.
 */
export function dateTimeLocaleFromToken(token: string | null | undefined): string | undefined {
  return dateTimePrefsFromToken(token).locale;
}

/**
 * Resolve all display preferences from a TRF org/session JWT: locale from the account
 * language claim (`a.l`) else the org country claim (`o.c`), plus the explicit format
 * overrides (`a.df`, `a.tf`) when the account has picked them.
 * Tolerates missing/malformed tokens — never throws.
 */
export function dateTimePrefsFromToken(token: string | null | undefined): DateTimePrefs {
  const empty: DateTimePrefs = { locale: undefined, dateFormat: undefined, timeFormat: undefined };
  if (!token) return empty;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return empty;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = new TextDecoder().decode(Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)));
    const claims = JSON.parse(json) as {
      a?: { l?: string; df?: string; tf?: string };
      o?: { c?: string };
    };
    const fromAccount = canonicalize(claims?.a?.l);
    const country = (claims?.o?.c ?? "").trim();
    return {
      locale: fromAccount ?? COUNTRY_LOCALE[country],
      dateFormat: asDatePreset(claims?.a?.df),
      timeFormat: asTimePreset(claims?.a?.tf),
    };
  } catch {
    return empty;
  }
}

/**
 * Parse a date-ish value. Date-only "YYYY-MM-DD" strings parse as LOCAL midnight so they
 * never shift a day across timezones (new Date("YYYY-MM-DD") would parse as UTC). Full ISO
 * datetimes, epoch numbers, and Date instances pass through. Returns null when unparseable.
 */
export function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string") {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (m) {
      const local = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
      return Number.isNaN(local.getTime()) ? null : local;
    }
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "25.06.2026" (et-EE) / "25/06/2026" (en-GB). Empty string when missing/unparseable. */
export function formatDate(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  return d ? getFormatters().date.format(d) : "";
}

/** "14:30" — always 24h. Empty string when missing/unparseable. */
export function formatTime(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  return d ? getFormatters().time.format(d) : "";
}

/** "25.06.2026, 14:30" — formatDate + 24h time. Empty string when missing/unparseable. */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  return d ? `${getFormatters().date.format(d)}, ${getFormatters().time.format(d)}` : "";
}

/** "June 2026" (locale month name) — for period/month labels. Empty when missing. */
export function formatMonth(value: string | number | Date | null | undefined): string {
  const d = toDate(value);
  return d ? getFormatters().month.format(d) : "";
}
