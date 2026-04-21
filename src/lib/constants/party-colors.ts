/**
 * JanaDhristi — Single source of truth for political-party colour tokens.
 *
 * Used by the leadership page (party-coloured card border) and the
 * infrastructure page (party label on "Announced by"). Keeping the
 * mapping here means a new party only has to be added once.
 *
 * Colours are deliberately muted (background tints + saturated border)
 * so the page stays readable. Neutral fallback for unknown / null parties.
 */

export interface PartyTone {
  bg: string;
  border: string;
  text: string;
}

const NEUTRAL: PartyTone = { bg: "#F9FAFB", border: "#D1D5DB", text: "#6B7280" };
const UNKNOWN: PartyTone = { bg: "#F3F4F6", border: "#9CA3AF", text: "#374151" };

export const PARTY_COLORS: Record<string, PartyTone> = {
  "BJP":           { bg: "#FFF7ED", border: "#F97316", text: "#C2410C" },
  "Bharatiya Janata Party": { bg: "#FFF7ED", border: "#F97316", text: "#C2410C" },
  "INC":           { bg: "#F0FDF4", border: "#22C55E", text: "#166534" },
  "Indian National Congress": { bg: "#F0FDF4", border: "#22C55E", text: "#166534" },
  "Congress":      { bg: "#F0FDF4", border: "#22C55E", text: "#166534" },
  "JD(S)":         { bg: "#FEFCE8", border: "#84CC16", text: "#3F6212" },
  "JDS":           { bg: "#FEFCE8", border: "#84CC16", text: "#3F6212" },
  "JDU":           { bg: "#ECFDF5", border: "#10B981", text: "#065F46" },
  "DMK":           { bg: "#FEF2F2", border: "#EF4444", text: "#991B1B" },
  "AIADMK":        { bg: "#FEF2F2", border: "#991B1B", text: "#7F1D1D" },
  "TMC":           { bg: "#F0FDF4", border: "#16A34A", text: "#166534" },
  "AAP":           { bg: "#EFF6FF", border: "#3B82F6", text: "#1E40AF" },
  "BRS":           { bg: "#FDF2F8", border: "#EC4899", text: "#9D174D" },
  "SP":            { bg: "#FEF2F2", border: "#DC2626", text: "#991B1B" },
  "BSP":           { bg: "#EFF6FF", border: "#2563EB", text: "#1E3A8A" },
  "NCP":           { bg: "#F0F9FF", border: "#0EA5E9", text: "#0C4A6E" },
  "SKP":           { bg: "#FEFCE8", border: "#CA8A04", text: "#854D0E" },
  "Shiv Sena":     { bg: "#FFF7ED", border: "#EA580C", text: "#9A3412" },
  "Shiv Sena (UBT)": { bg: "#FFF7ED", border: "#F59E0B", text: "#92400E" },
  "Shiv Sena (Shinde)": { bg: "#FFF7ED", border: "#EA580C", text: "#9A3412" },
  "SHS":           { bg: "#FFF7ED", border: "#EA580C", text: "#9A3412" },
  "TDP":           { bg: "#FEFCE8", border: "#EAB308", text: "#854D0E" },
  "YSRCP":         { bg: "#EFF6FF", border: "#3B82F6", text: "#1E40AF" },
  "RJD":           { bg: "#F0FDF4", border: "#22C55E", text: "#166534" },
  "CPI(M)":        { bg: "#FEF2F2", border: "#DC2626", text: "#991B1B" },
  "CPI":           { bg: "#FEF2F2", border: "#EF4444", text: "#991B1B" },
  "JMM":           { bg: "#F0FDF4", border: "#16A34A", text: "#166534" },
  "SAD":           { bg: "#EFF6FF", border: "#2563EB", text: "#1E3A8A" },
  "BJD":           { bg: "#F0FDF4", border: "#15803D", text: "#166534" },
  "AIMIM":         { bg: "#ECFDF5", border: "#059669", text: "#064E3B" },
  "Independent":   NEUTRAL,
  "INDEPENDENT":   NEUTRAL,
  "N/A":           NEUTRAL,
};

// Track unknown parties seen at runtime so we only log each name once
// per process — keeps logs scannable when an unknown party shows up
// across many cards or many news-pipeline calls.
const _seenUnknown = new Set<string>();

export function getPartyColor(party: string | null | undefined): PartyTone {
  if (!party) return NEUTRAL;
  // Exact match
  const exact = PARTY_COLORS[party];
  if (exact) return exact;
  // Case-insensitive match
  const upper = party.toUpperCase();
  for (const [key, val] of Object.entries(PARTY_COLORS)) {
    if (key.toUpperCase() === upper) return val;
  }
  // Unknown party — return default grey, log once
  if (!_seenUnknown.has(party)) {
    _seenUnknown.add(party);
    console.warn(`[leadership] Unknown party detected: '${party}'. Using default colors. Add to party-colors.ts for branded colors.`);
  }
  return UNKNOWN;
}
