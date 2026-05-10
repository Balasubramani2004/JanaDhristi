/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { SIDEBAR_MODULES, getTieredModules, MOBILE_TAB_MODULES } from "@/lib/constants/sidebar-modules";
import { useTranslations } from "next-intl";

// 4 fixed bottom tabs (5th slot = "More" button). Defined once in
// sidebar-modules.ts; citizens use these most frequently.
const FIXED_TABS = MOBILE_TAB_MODULES;

// Drawer categories derived from the single source of truth — no
// hardcoded slug arrays in this component.
const DRAWER_CATEGORIES = getTieredModules().map((g) => ({
  label: g.label,
  slugs: g.modules.map((m) => m.slug),
}));

interface MobileTabNavProps {
  locale: string;
  stateSlug: string;
  districtSlug: string;
}

export default function MobileTabNav({ locale, stateSlug, districtSlug }: MobileTabNavProps) {
  const t = useTranslations("navigation");
  const tm = useTranslations("modules");
  const pathname = usePathname();
  function getModuleLabel(slug: string, fallback: string) {
    const keyMap: Record<string, string | undefined> = {
      "finance": "budget",
      "power": "power",
      "leadership": "leadership",
      "crops": "crops",
      "weather": "weather",
      "water": "dams",
      "infrastructure": "infrastructure",
      "schemes": "schemes",
      "police": "police",
      "transport": "transport",
      "schools": "schools",
      "housing": "housing",
      "offices": "offices",
      "services": "services",
      "news": "news",
      "gram-panchayat": "panchayat",
      "responsibility": "responsibility",
      "jjm": "jjm",
      "famous-personalities": "famous",
      "tourism": "tourism",
      "industries": "sugar",
      "farm": "soil",
    };
    const key = keyMap[slug];
    return key ? tm(key) : fallback;
  }

  function getCategoryLabel(label: string) {
    const key = label.toLowerCase();
    if (key.includes("live data")) return t("categoryLiveData");
    if (key.includes("governance")) return t("categoryGovernance");
    if (key.includes("community")) return t("categoryCommunity");
    if (key.includes("transparency")) return t("categoryTransparency");
    if (key.includes("local info")) return t("categoryLocalInfo");
    if (key.includes("economy")) return t("categoryEconomy");
    return label;
  }

  const parts = pathname.split("/").filter(Boolean);
  const activeSlug = parts[3] ?? "overview";
  const [drawerOpen, setDrawerOpen] = useState(false);

  const baseUrl = `/${locale}/${stateSlug}/${districtSlug}`;

  const tabs = FIXED_TABS.map((slug) => SIDEBAR_MODULES.find((m) => m.slug === slug)!).filter(Boolean);

  // Is any non-fixed-tab module active? Highlight "More" if so.
  const moreIsActive = !FIXED_TABS.includes(activeSlug as typeof FIXED_TABS[number]) && activeSlug !== "overview";

  return (
    <>
      {/* ── Bottom tab bar ──────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          bottom: 36,
          left: 0,
          right: 0,
          height: 60,
          background: "var(--surface)",
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "stretch",
          zIndex: 41,
        }}
        className="md:hidden"
      >
        {tabs.map((mod) => {
          const Icon = mod.icon;
          const isActive = activeSlug === mod.slug;
          return (
            <Link
              key={mod.slug}
              href={mod.slug === "overview" ? baseUrl : `${baseUrl}/${mod.slug}`}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                textDecoration: "none",
                color: isActive ? "var(--color-accent-blue)" : "var(--color-text-muted)",
                minWidth: 0,
                minHeight: 44,
              }}
            >
              <Icon size={20} />
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, whiteSpace: "nowrap" }}>
                {getModuleLabel(mod.slug, mod.label)}
              </span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            border: "none",
            background: "transparent",
            color: moreIsActive ? "var(--color-accent-blue)" : "var(--color-text-muted)",
            cursor: "pointer",
            minHeight: 44,
            padding: 0,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>⋯</span>
          <span style={{ fontSize: 10, fontWeight: moreIsActive ? 600 : 400 }}>{t("more")}</span>
        </button>
      </nav>

      {/* ── Drawer overlay + sheet ───────────────────────────────────────── */}
      {drawerOpen && (
        <>
          {/* Background overlay — tap to close */}
          <div
            onClick={() => setDrawerOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              zIndex: 50,
            }}
            className="md:hidden"
          />

          {/* Slide-up sheet */}
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: "82vh",
              background: "var(--surface)",
              borderRadius: "20px 20px 0 0",
              zIndex: 51,
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
              WebkitOverflowScrolling: "touch",
            }}
            className="md:hidden"
          >
            {/* Sheet handle + header */}
            <div
              style={{
                position: "sticky",
                top: 0,
                background: "var(--surface)",
                borderBottom: "1px solid var(--border-color)",
                padding: "12px 20px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                zIndex: 1,
                flexShrink: 0,
              }}
            >
              <div>
                <div style={{ width: 36, height: 4, background: "var(--border-color)", borderRadius: 99, margin: "0 auto 8px" }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: "var(--foreground)" }}>{t("allModules")}</span>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                style={{
                  width: 32, height: 32, borderRadius: "50%",
                  border: "1px solid var(--border-color)", background: "var(--surface-muted)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <X size={16} style={{ color: "var(--color-text-secondary)" }} />
              </button>
            </div>

            {/* Category groups */}
            <div style={{ padding: "8px 0 24px" }}>
              {DRAWER_CATEGORIES.map((cat) => {

                const mods = cat.slugs
                  .map((slug) => SIDEBAR_MODULES.find((m) => m.slug === slug))
                  .filter(Boolean) as typeof SIDEBAR_MODULES;

                return (
                  <div key={cat.label} style={{ marginBottom: 4 }}>
                    {/* Category label */}
                    <div
                      style={{
                        padding: "10px 20px 6px",
                        fontSize: 11, fontWeight: 600,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {getCategoryLabel(cat.label)}
                    </div>

                    {/* Module rows — 44px tap targets */}
                    {mods.map((mod) => {
                      const Icon = mod.icon;
                      const isActive = activeSlug === mod.slug;
                      return (
                        <Link
                          key={mod.slug}
                          href={mod.slug === "overview" ? baseUrl : `${baseUrl}/${mod.slug}`}
                          onClick={() => setDrawerOpen(false)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            padding: "0 20px",
                            minHeight: 52,
                            textDecoration: "none",
                            background: isActive ? "var(--color-selected-bg)" : "transparent",
                            borderLeft: isActive ? "3px solid var(--color-accent-blue)" : "3px solid transparent",
                          }}
                        >
                          {/* Icon circle */}
                          <div
                            style={{
                              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                              background: isActive ? "color-mix(in srgb, var(--color-accent-blue) 14%, transparent)" : "var(--surface-muted)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >
                            <Icon size={18} style={{ color: isActive ? "var(--color-accent-blue)" : "var(--color-text-secondary)" }} />
                          </div>

                          {/* Labels */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontSize: 14, fontWeight: isActive ? 600 : 500,
                              color: isActive ? "var(--color-accent-blue)" : "var(--foreground)",
                            }}>
                              {mod.emoji} {getModuleLabel(mod.slug, mod.label)}
                            </div>
                            <div style={{ fontSize: 11, color: "var(--color-text-muted)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {mod.description}
                            </div>
                          </div>

                          {isActive && (
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--color-accent-blue)", flexShrink: 0 }} />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                );
              })}

            </div>
          </div>
        </>
      )}
    </>
  );
}
