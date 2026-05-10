/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { X } from "lucide-react";
import { SIDEBAR_MODULES, getTieredModules } from "@/lib/constants/sidebar-modules";
import { useTranslations } from "next-intl";

// Derived from the priority field in sidebar-modules.ts. Single source
// of truth for tier order + labels across desktop + mobile nav.
const SIDEBAR_CATEGORIES = getTieredModules().map((g) => ({
  label: g.label.toUpperCase(),
  slugs: g.modules.map((m) => m.slug),
}));

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  locale: string;
  stateSlug?: string;
  districtSlug?: string;
}

export default function MobileSidebar({
  open, onClose, locale, stateSlug, districtSlug,
}: MobileSidebarProps) {
  const t = useTranslations("navigation");
  const tm = useTranslations("modules");
  const pathname = usePathname();
  const [search, setSearch] = useState("");

  const pathParts = pathname.split("/").filter(Boolean);
  const activeSlug = pathParts[3] ?? "overview";
  const base = stateSlug && districtSlug ? `/${locale}/${stateSlug}/${districtSlug}` : null;
  const q = search.trim().toLowerCase();

  const getModuleLabel = useCallback((slug: string, fallback: string) => {
    const keyMap: Record<string, string | undefined> = {
      finance: "budget",
      power: "power",
      leadership: "leadership",
      crops: "crops",
      weather: "weather",
      water: "dams",
      infrastructure: "infrastructure",
      schemes: "schemes",
      police: "police",
      transport: "transport",
      schools: "schools",
      housing: "housing",
      offices: "offices",
      services: "services",
      news: "news",
      "gram-panchayat": "panchayat",
      responsibility: "responsibility",
      jjm: "jjm",
      "famous-personalities": "famous",
      "tourism": "tourism",
      industries: "sugar",
      farm: "soil",
    };
    const key = keyMap[slug];
    return key ? tm(key) : fallback;
  }, [tm]);

  const filteredCategories = useMemo(() => {
    return SIDEBAR_CATEGORIES.map((cat) => {
      const mods = cat.slugs
        .map((slug) => SIDEBAR_MODULES.find((m) => m.slug === slug))
        .filter(Boolean) as typeof SIDEBAR_MODULES;

      const filtered = q
        ? mods.filter((mod) => {
            const label = getModuleLabel(mod.slug, mod.label).toLowerCase();
            const text = `${label} ${mod.description} ${mod.slug}`.toLowerCase();
            return text.includes(q);
          })
        : mods;

      return { ...cat, mods: filtered };
    }).filter((cat) => cat.mods.length > 0);
  }, [q, getModuleLabel]);

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

  function moduleHref(slug: string) {
    if (!base) return `/${locale}`;
    return slug === "overview" ? base : `${base}/${slug}`;
  }

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 200,
        }}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 280,
          background: "var(--surface)",
          zIndex: 201,
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
          animation: "slideInLeft 200ms ease",
        }}
      >
        <style>{`
          @keyframes slideInLeft {
            from { transform: translateX(-100%); }
            to { transform: translateX(0); }
          }
        `}</style>

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 16px",
          borderBottom: "1px solid var(--border-color)",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)" }}>
            🗣️ JanaDhristi
          </span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              border: "1px solid var(--border-color)",
              borderRadius: 6,
              background: "var(--surface-muted)",
              cursor: "pointer",
              color: "var(--color-text-secondary)",
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: "10px 16px 8px", borderBottom: "1px solid var(--border-color)" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search modules"
            aria-label="Search modules"
            style={{
              width: "100%",
              minHeight: 40,
              border: "1px solid var(--border-color)",
              borderRadius: 10,
              background: "var(--surface-muted)",
              fontSize: 14,
              padding: "8px 12px",
              color: "var(--foreground)",
              outline: "none",
            }}
          />
        </div>

        {/* Module list */}
        <div style={{ flex: 1, paddingBottom: 16 }}>
          {filteredCategories.length === 0 && (
            <div style={{ padding: "14px 16px", color: "var(--color-text-secondary)", fontSize: 13 }}>
              No modules found for this search.
            </div>
          )}
          {filteredCategories.map((cat) => {
            return (
              <div key={cat.label}>
                {/* Category header */}
                <div style={{
                  padding: "12px 16px 4px",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: "var(--color-text-muted)",
                }}>
                  {getCategoryLabel(cat.label)}
                </div>

                {/* Module links */}
                {cat.mods.map((mod) => {
                  const isActive = activeSlug === mod.slug || (mod.slug === "overview" && activeSlug === "overview");
                  return (
                    <Link
                      key={mod.slug}
                      href={moduleHref(mod.slug)}
                      onClick={onClose}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "11px 16px",
                        textDecoration: "none",
                        background: isActive ? "var(--color-selected-bg)" : "transparent",
                        borderLeft: isActive ? "3px solid var(--color-accent-blue)" : "3px solid transparent",
                        color: isActive ? "var(--color-accent-blue)" : "var(--foreground)",
                        fontSize: 14,
                        fontWeight: isActive ? 600 : 400,
                        minHeight: 44,
                        transition: "background 120ms ease",
                      }}
                    >
                      <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{mod.emoji}</span>
                      <span>{getModuleLabel(mod.slug, mod.label)}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}

          {/* Divider */}
          <div style={{ height: 1, background: "var(--border-color)", margin: "8px 0" }} />

          {/* Compare Districts */}
          {base && (
            <Link
              href={`/${locale}/compare?a=${districtSlug}`}
              onClick={onClose}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 16px",
                textDecoration: "none",
                color: "var(--color-text-secondary)",
                fontSize: 14,
                minHeight: 44,
              }}
            >
              <span style={{ fontSize: 16, lineHeight: 1 }}>⚖️</span>
              <span>{t("compareDistricts")}</span>
            </Link>
          )}

        </div>
      </div>
    </>
  );
}
