/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * Open Graph image — teal rebrand (distinct from legacy blue gradient).
 */
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "JanaDhristi — Your District. Your Data. Your Right.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "linear-gradient(135deg, #0f766e 0%, #0d9488 42%, #115e59 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px 100px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 40 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              background: "linear-gradient(145deg, rgba(255,255,255,0.25), rgba(255,255,255,0.08))",
              border: "2px solid rgba(255,255,255,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 38,
              fontWeight: 800,
            }}
          >
            J
          </div>
          <div style={{ color: "rgba(255,255,255,0.88)", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>
            JanaDhristi
          </div>
        </div>

        <div style={{
          color: "#FFFFFF",
          fontSize: 56,
          fontWeight: 800,
          lineHeight: 1.12,
          marginBottom: 26,
          maxWidth: 920,
          letterSpacing: "-0.03em",
        }}>
          Your District.{"\n"}Your Data.{"\n"}Your Right.
        </div>

        <div style={{
          color: "rgba(255,255,255,0.82)",
          fontSize: 26,
          fontWeight: 400,
          marginBottom: 44,
          maxWidth: 820,
          lineHeight: 1.35,
        }}>
          India&apos;s citizen transparency platform — free district-level government data for every Indian.
        </div>

        <div style={{ display: "flex", gap: 28, flexWrap: "wrap" }}>
          {["780+ Districts", "28 Data Modules", "Live Updates", "Free Forever"].map((s) => (
            <div
              key={s}
              style={{
                background: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.22)",
                borderRadius: 14,
                padding: "12px 22px",
                color: "#FFFFFF",
                fontSize: 17,
                fontWeight: 600,
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
