/**
 * Normalise stored portal URLs so <a href> opens off-site correctly.
 * Many seeds omit the scheme; without it the browser treats the value as a same-origin path.
 */
export function ensureHttpUrl(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const u = raw.trim();
  if (!u) return null;
  const lower = u.toLowerCase();
  if (lower.startsWith("mailto:") || lower.startsWith("tel:")) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (u.startsWith("//")) return `https:${u}`;
  // Host or host/path without scheme (e.g. sevasetu.karnataka.gov.in/…)
  if (/^([\w-]+\.)+[a-z]{2,}(\/.*)?$/i.test(u) && !u.includes("..")) {
    return `https://${u.replace(/^\/+/, "")}`;
  }
  return u;
}
