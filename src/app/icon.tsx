/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Team Decoders. MIT License with Attribution.
 * Dynamic favicon — teal rebrand mark.
 */
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #0f766e 0%, #0d9488 55%, #14b8a6 100%)",
          borderRadius: 9,
        }}
      >
        <span style={{ color: "white", fontSize: 17, fontWeight: 800, fontFamily: "system-ui, sans-serif" }}>
          J
        </span>
      </div>
    ),
    { ...size }
  );
}
