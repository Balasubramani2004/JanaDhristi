/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SIDEBAR_MODULES, getTieredModules, getOrderedSlugs } from "@/lib/constants/sidebar-modules";
import { useTranslations } from "next-intl";

interface SidebarProps {
  locale: string;
  stateSlug: string;
  districtSlug: string;
}

// Categories + flat order are derived from the priority field in
// sidebar-modules.ts — no hardcoded slug lists live in this file.
const SIDEBAR_CATEGORIES = getTieredModules().map((g) => ({
  label: g.label.toUpperCase(),
  slugs: g.modules.map((m) => m.slug),
}));

const ALL_SLUGS = getOrderedSlugs();

const MODULE_MAP = Object.fromEntries(SIDEBAR_MODULES.map((m) => [m.slug, m]));

export default function Sidebar({ locale, stateSlug, districtSlug }: SidebarProps) {
  const t = useTranslations("navigation");
  const tm = useTranslations("modules");
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const baseUrl = `/${locale}/${stateSlug}/${districtSlug}`;
  const pathParts = pathname.split("/").filter(Boolean);
  const activeSlug = pathParts[3] ?? "overview";

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

  function renderLink(slug: string) {
    const mod = MODULE_MAP[slug];
    if (!mod) return null;
    const Icon = mod.icon;
    const isActive = activeSlug === slug;
    const href = slug === "overview" ? baseUrl : `${baseUrl}/${slug}`;

    return (
      <Link
        key={slug}
        href={href}
        title={collapsed ? mod.label : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: collapsed ? "8px 14px" : "6px 12px",
          textDecoration: "none",
          background: isActive ? "var(--color-selected-bg)" : "transparent",
          borderLeft: isActive ? "3px solid var(--color-accent-blue)" : "3px solid transparent",
          color: isActive ? "var(--color-accent-blue)" : "var(--color-text-secondary)",
          fontSize: 13,
          fontWeight: isActive ? 600 : 400,
          transition: "background 150ms ease, color 150ms ease",
          borderRadius: "0 6px 6px 0",
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.background = "var(--surface-muted)";
            (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
          }
        }}
      >
        {collapsed ? (
          <Icon size={15} style={{ flexShrink: 0, color: isActive ? "var(--color-accent-blue)" : "var(--color-text-muted)" }} />
        ) : (
          <>
            <span style={{ fontSize: 14, flexShrink: 0, lineHeight: 1 }}>{mod.emoji}</span>
            <span style={{ flex: 1, lineHeight: 1.3 }}>{getModuleLabel(mod.slug, mod.label)}</span>
          </>
        )}
      </Link>
    );
  }

  return (
    <aside
      style={{
        width: collapsed ? 52 : 240,
        minWidth: collapsed ? 52 : 240,
        height: "calc(100vh - 58px - 36px)",
        position: "sticky",
        top: 58,
        overflowY: "auto",
        overflowX: "hidden",
        background: "var(--surface)",
        borderRight: "1px solid var(--border-color)",
        transition: "width 200ms ease, min-width 200ms ease",
        flexShrink: 0,
        scrollbarWidth: "thin",
        scrollbarColor: "var(--border-color) transparent",
      }}
      className="hidden md:block"
    >
      {/* ◀ / ▶ Collapse toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "flex-end",
          padding: "10px 10px 6px",
          borderBottom: "1px solid var(--border-color)",
        }}
      >
        <button
          onClick={() => setCollapsed((v) => !v)}
          title={collapsed ? t("expandSidebar") : t("collapseSidebar")}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 26,
            height: 26,
            border: "1px solid var(--border-color)",
            borderRadius: 6,
            background: "var(--surface-muted)",
            cursor: "pointer",
            color: "var(--color-text-secondary)",
          }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {collapsed ? (
        /* Collapsed: icon-only list of all modules */
        <>
          <div style={{ paddingTop: 4 }}>
            {ALL_SLUGS.map(renderLink)}
          </div>
          <div style={{ borderTop: "1px solid var(--border-color)", marginTop: 4 }}>
            <Link
              href={`/${locale}/compare?a=${districtSlug}`}
              title={t("compareDistricts")}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px 14px", textDecoration: "none", color: "var(--color-text-secondary)" }}
            >
              <span style={{ fontSize: 14 }}>⚖️</span>
            </Link>
            <div style={{ height: 8 }} />
          </div>
        </>
      ) : (
        /* Expanded: full categorized list — always visible */
        <div style={{ paddingBottom: 8 }}>
          {SIDEBAR_CATEGORIES.map((cat, catIdx) => (
            <div key={cat.label}>
              {catIdx > 0 && (
                <div style={{ height: 1, background: "var(--border-color)", margin: "5px 0" }} />
              )}
              <div
                style={{
                  padding: catIdx === 0 ? "10px 12px 4px" : "7px 12px 3px",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                  color: "var(--color-text-muted)",
                }}
              >
                {getCategoryLabel(cat.label)}
              </div>
              {cat.slugs.map(renderLink)}
            </div>
          ))}

          {/* Bottom: Compare + Support */}
          <div style={{ height: 1, background: "var(--border-color)", margin: "10px 0 4px" }} />
          <Link
            href={`/${locale}/compare?a=${districtSlug}`}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 12px", textDecoration: "none",
              color: "var(--color-text-secondary)", fontSize: 13,
              borderLeft: "3px solid transparent",
              borderRadius: "0 6px 6px 0",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--surface-muted)";
              (e.currentTarget as HTMLElement).style.color = "var(--foreground)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--color-text-secondary)";
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>⚖️</span>
            <span>{t("compareDistricts")}</span>
          </Link>
          <div style={{ height: 12 }} />
        </div>
      )}
    </aside>
  );
}
