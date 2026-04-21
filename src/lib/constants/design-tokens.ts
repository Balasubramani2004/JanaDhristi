// ForThePeople.in Design Tokens — mirrors globals.css @theme
export const colors = {
  background:   "#FAFAF8",
  surface:      "#FFFFFF",
  border:       "#E8E8E4",
  textPrimary:  "#1A1A1A",
  textSecondary:"#6B6B6B",
  textMuted:    "#9B9B9B",
  accentBlue:   "#2563EB",
  accentGreen:  "#16A34A",
  accentAmber:  "#D97706",
  accentRed:    "#DC2626",
  accentPurple: "#7C3AED",
  hoverBg:      "#F5F5F0",
  selectedBg:   "#EFF6FF",
} as const;

export const shadows = {
  card:      "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
  cardHover: "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
} as const;

export const radius = {
  card: "16px",
  sm:   "8px",
} as const;

export const fonts = {
  sans:     '"Plus Jakarta Sans", system-ui, sans-serif',
  mono:     '"JetBrains Mono", monospace',
  regional: '"Noto Sans Kannada", sans-serif',
} as const;
