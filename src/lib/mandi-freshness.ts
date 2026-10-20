/**
 * Mandi (crop) arrival date vs "today" in Asia/Kolkata for UI live indicators.
 */

const IST = "Asia/Kolkata";

function istCalendarKey(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: IST });
}

function parseEnCaYmd(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/**
 * True if the mandi arrival date (from API meta lastUpdated / DB date) is today or yesterday in IST.
 */
export function mandiIsTodayOrYesterdayIst(lastUpdatedIso: string | null | undefined): boolean {
  if (!lastUpdatedIso) return false;
  const mandi = new Date(lastUpdatedIso);
  if (Number.isNaN(mandi.getTime())) return false;

  const mandiKey = istCalendarKey(mandi);
  const todayKey = istCalendarKey(new Date());
  const mandiUtc = parseEnCaYmd(mandiKey);
  const todayUtc = parseEnCaYmd(todayKey);
  const diffDays = (todayUtc - mandiUtc) / 86400000;
  return diffDays >= 0 && diffDays <= 1;
}
