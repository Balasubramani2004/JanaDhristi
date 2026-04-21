// ── ForThePeople.in — Empty State Messages ────────────────
// Used across all module pages when data is not yet available

export interface EmptyStateConfig {
  title: string;
  message: string;
  icon: string;
}

export const EMPTY_STATE_MESSAGES: Record<string, EmptyStateConfig> = {
  weather: {
    title: "Weather",
    message: "Live weather feeds are being configured for this district.",
    icon: "🌦️",
  },
  crops: {
    title: "Crop Prices",
    message: "Mandi price feeds are being connected to local agricultural markets.",
    icon: "🌾",
  },
  water: {
    title: "Dam Levels",
    message: "Reservoir monitoring is being set up for this district.",
    icon: "🚰",
  },
  news: {
    title: "News & Updates",
    message: "Local news aggregation is being configured for this district.",
    icon: "📰",
  },
  leadership: {
    title: "Leadership",
    message: "Leadership data is being compiled from official sources.",
    icon: "👥",
  },
  finance: {
    title: "Finance & Budget",
    message: "Budget data is being sourced from the state finance department.",
    icon: "💰",
  },
  schools: {
    title: "Schools",
    message: "School performance data is being collected from the state board.",
    icon: "🎓",
  },
  health: {
    title: "Health",
    message: "Hospital and health data is being compiled for this district.",
    icon: "🏥",
  },
  elections: {
    title: "Elections",
    message: "Election results and data are being sourced from the Election Commission.",
    icon: "🗳️",
  },
  police: {
    title: "Police & Traffic",
    message: "Police station data is being compiled from district records.",
    icon: "👮",
  },
  transport: {
    title: "Transport",
    message: "Bus routes and transport data are being collected.",
    icon: "🚌",
  },
  jjm: {
    title: "Water Supply (JJM)",
    message: "Jal Jeevan Mission coverage data is being updated.",
    icon: "💧",
  },
  housing: {
    title: "Housing Schemes",
    message: "PMAY and housing scheme data is being sourced.",
    icon: "🏠",
  },
  power: {
    title: "Power & Outages",
    message: "Power outage data is being connected to DISCOM systems.",
    icon: "⚡",
  },
  rti: {
    title: "RTI Tracker",
    message: "RTI filing data is being compiled from the central portal.",
    icon: "🏛️",
  },
  courts: {
    title: "Courts & Judiciary",
    message: "Court case data is being sourced from the National Judicial Data Grid.",
    icon: "⚖️",
  },
  "gram-panchayat": {
    title: "Gram Panchayat",
    message: "MGNREGA and panchayat data is being collected.",
    icon: "🏘️",
  },
  industries: {
    title: "Local Industries",
    message: "Local industry data is being compiled for this district.",
    icon: "🏭",
  },
  farm: {
    title: "Farm Advisory",
    message: "Soil health and KVK advisory data is being set up.",
    icon: "🌱",
  },
  population: {
    title: "Population",
    message: "Census and demographic data is being processed.",
    icon: "📈",
  },
  infrastructure: {
    title: "Infrastructure",
    message: "Project data is being sourced from state PWD records.",
    icon: "🔧",
  },
  schemes: {
    title: "Government Schemes",
    message: "Active schemes and eligibility data are being compiled.",
    icon: "📋",
  },
  alerts: {
    title: "Local Alerts",
    message: "Alert monitoring is being configured for this district.",
    icon: "⚠️",
  },
  default: {
    title: "Data",
    message: "Data collection is in progress for this district. Check back soon.",
    icon: "📊",
  },
};

export function getEmptyState(module: string): EmptyStateConfig {
  return EMPTY_STATE_MESSAGES[module] ?? EMPTY_STATE_MESSAGES.default;
}
