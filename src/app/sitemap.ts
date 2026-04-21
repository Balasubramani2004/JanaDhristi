/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

import { MetadataRoute } from "next";
import { INDIA_STATES } from "@/lib/constants/districts";

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forthepeople.in";
const LOCALE = "en";

const DISTRICT_MODULES = [
  "overview", "weather", "crops", "water", "population", "finance",
  "leadership", "infrastructure", "police", "industries", "schemes",
  "services", "elections", "transport", "jjm", "housing", "power",
  "schools", "farm", "rti", "gram-panchayat", "courts", "health",
  "alerts", "offices", "citizen-corner", "news", "map",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [
    { url: `${BASE}/${LOCALE}`, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
    { url: `${BASE}/${LOCALE}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/${LOCALE}/support`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/${LOCALE}/contribute`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/${LOCALE}/privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/${LOCALE}/disclaimer`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.4 },
  ];

  // Add only ACTIVE state + district + module pages (not locked coming-soon districts)
  for (const state of INDIA_STATES) {
    if (!state.active) continue;
    const stateUrl = `${BASE}/${LOCALE}/${state.slug}`;
    entries.push({ url: stateUrl, changeFrequency: "monthly", priority: 0.6 });

    for (const district of state.districts) {
      if (!district.active) continue;
      const base = `${stateUrl}/${district.slug}`;
      entries.push({ url: base, changeFrequency: "daily", priority: 0.8 });

      for (const mod of DISTRICT_MODULES) {
        entries.push({ url: `${base}/${mod}`, changeFrequency: "daily", priority: 0.65 });
      }
    }
  }

  return entries;
}
