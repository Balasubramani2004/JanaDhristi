/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Team Decoders. MIT License with Attribution.
 * Apple touch icon — matches favicon rebrand.
 */
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)",
          borderRadius: 36,
        }}
      >
        <span style={{ color: "white", fontSize: 96, fontWeight: 800, fontFamily: "system-ui, sans-serif" }}>
          J
        </span>
      </div>
    ),
    { ...size }
  );
}
