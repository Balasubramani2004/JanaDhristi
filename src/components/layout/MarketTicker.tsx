/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useQuery } from "@tanstack/react-query";
import type { TickerItem } from "@/app/api/data/market-ticker/route";

interface TickerResponse {
  items: TickerItem[];
  asOf: string;
  isMarketHours: boolean;
  fromCache: boolean;
  usingFallback: boolean;
}

function TickerItemView({ item }: { item: TickerItem }) {
  const isUp = item.direction === "up";
  const isDown = item.direction === "down";
  const color = isUp ? "#16A34A" : isDown ? "#DC2626" : "#6B6B6B";
  const arrow = isUp ? "▲" : isDown ? "▼" : "";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        whiteSpace: "nowrap",
        padding: "0 18px",
        borderRight: "1px solid #F0F0EC",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 600, color: "#6B6B6B", letterSpacing: "0.04em" }}>
        {item.label}
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A1A", fontFamily: "var(--font-mono, monospace)" }}>
        {item.value}{item.unit}
      </span>
      {item.direction !== "flat" && (
        <span style={{ fontSize: 11, fontWeight: 600, color, fontFamily: "var(--font-mono, monospace)" }}>
          {arrow}{Math.abs(item.changePct).toFixed(2)}%
        </span>
      )}
    </div>
  );
}

function SkeletonItem() {
  return (
    <div style={{ display: "flex", gap: 6, padding: "0 18px", borderRight: "1px solid #F0F0EC", flexShrink: 0, alignItems: "center" }}>
      <div style={{ width: 40, height: 10, background: "#E8E8E4", borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ width: 60, height: 10, background: "#E8E8E4", borderRadius: 4, animation: "pulse 1.5s ease-in-out infinite" }} />
    </div>
  );
}

function minutesAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

export default function MarketTicker() {
  const { data, isLoading, isError } = useQuery<TickerResponse>({
    queryKey: ["market-ticker"],
    queryFn: () => fetch("/api/data/market-ticker").then((r) => r.json()),
    refetchInterval: 300_000, // 5 min
    staleTime: 240_000,
  });

  if (isError) return null;

  const isOpen = data?.isMarketHours ?? false;
  const updatedMin = data?.asOf ? minutesAgo(data.asOf) : null;

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes market-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          animation: ticker-scroll 40s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
        @media (min-width: 768px) {
          .ticker-track {
            animation: none !important;
          }
        }
      `}</style>
      <div
        style={{
          height: 48,
          background: "#FFFFFF",
          borderBottom: "1px solid #E8E8E4",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Market status badge — left edge */}
        {!isLoading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "0 12px",
              flexShrink: 0,
              borderRight: "1px solid #F0F0EC",
              height: "100%",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: isOpen ? "#16A34A" : "#9B9B9B",
                animation: isOpen ? "market-pulse 1.5s ease-in-out infinite" : "none",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 10, fontWeight: 600, color: isOpen ? "#16A34A" : "#9B9B9B", whiteSpace: "nowrap" }}>
              {isOpen ? "Market Open" : "Market Closed"}
            </span>
          </div>
        )}

        {/* Fade mask — left */}
        <div
          style={{
            position: "absolute",
            left: isLoading ? 0 : 120,
            top: 0,
            bottom: 0,
            width: 32,
            background: "linear-gradient(to right, #FFFFFF, transparent)",
            zIndex: 1,
            pointerEvents: "none",
          }}
          className="md:hidden"
        />

        {/* Ticker content */}
        <div style={{ display: "flex", alignItems: "center", flex: 1, overflow: "hidden" }}>
          {isLoading ? (
            <div style={{ display: "flex", alignItems: "center" }}>
              {Array.from({ length: 6 }).map((_, i) => <SkeletonItem key={i} />)}
            </div>
          ) : (
            <div className="ticker-track" style={{ display: "flex", alignItems: "center" }}>
              {(data?.items ?? []).map((item, i) => (
                <TickerItemView key={`a-${item.symbol}-${i}`} item={item} />
              ))}
              {updatedMin !== null && (
                <div className="hidden md:flex" style={{ padding: "0 12px", fontSize: 10, color: "#9B9B9B", whiteSpace: "nowrap", flexShrink: 0 }}>
                  {updatedMin === 0 ? "Just now" : `${updatedMin}m ago`}
                </div>
              )}
              {/* Duplicate set for infinite scroll — hidden on desktop */}
              <div className="md:hidden" style={{ display: "flex", alignItems: "center" }}>
                {(data?.items ?? []).map((item, i) => (
                  <TickerItemView key={`b-${item.symbol}-${i}`} item={item} />
                ))}
                {updatedMin !== null && (
                  <div style={{ padding: "0 18px", fontSize: 10, color: "#9B9B9B", whiteSpace: "nowrap", flexShrink: 0 }}>
                    Updated {updatedMin === 0 ? "just now" : `${updatedMin}m ago`}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fade mask — right */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 32,
            background: "linear-gradient(to left, #FFFFFF, transparent)",
            zIndex: 1,
            pointerEvents: "none",
          }}
          className="md:hidden"
        />

        {/* Desktop: updated timestamp */}
        {!isLoading && updatedMin !== null && (
          <div
            style={{
              padding: "0 12px",
              fontSize: 10,
              color: "#C0C0BA",
              whiteSpace: "nowrap",
              flexShrink: 0,
              borderLeft: "1px solid #F0F0EC",
            }}
            className="hidden md:block"
          >
            {updatedMin === 0 ? "Live" : `${updatedMin}m ago`}
          </div>
        )}
      </div>
    </>
  );
}
