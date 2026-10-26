/*
 * Preference cookies shared by every app on the apex domain (and by every port on localhost,
 * since cookies ignore the port): path=/, one year, samesite=lax, domain=.<last two labels>.
 * A single-label host or a bare IP gets a host cookie instead (a domain like `.0.1` would be
 * rejected). Mirrors @trf/app-shell appearance.ts cookieAttrs(), which stores the theme and
 * the AI panel state the same way; the sidebar stores its collapsed flag and width here.
 */

export function readPrefCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function writePrefCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  const host = window.location.hostname;
  const parts = host.split(".");
  const isIp = /^[\d.]+$/.test(host) || host.includes(":");
  const domain = parts.length >= 2 && !isIp ? `; domain=.${parts.slice(-2).join(".")}` : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax${domain}`;
}
