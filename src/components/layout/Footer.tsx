/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * JanaDhristi — MIT License with Attribution.
 * https://github.com/Balasubramani2004/JanaDhristi
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import FeedbackModal from "@/components/common/FeedbackModal";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  const [time, setTime] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Kolkata",
        }) + " IST"
      );
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer
      style={{
        background: "#FFFFFF",
        borderTop: "1px solid #E8E8E4",
        fontSize: 11,
        color: "#9B9B9B",
      }}
    >
      {/* Row 1 — NDSAP notice + live clock */}
      <div
        style={{
          borderBottom: "1px solid #F0F0EC",
          padding: "0 20px",
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {t("topLine")}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            color: "#6B6B6B",
            fontSize: 11,
            flexShrink: 0,
          }}
        >
          {time}
        </span>
      </div>

      {/* Row 2 — branding + nav links */}
      <div
        style={{
          padding: "0 20px",
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          maxWidth: 1200,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <span
          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: "0 1 auto" }}
        >
          <strong style={{ color: "#6B6B6B" }}>JanaDhristi</strong>
          {" — "}
          <span className="hidden sm:inline">{t("subLine")} </span>
          <Link href="/disclaimer" style={{ color: "#2563EB", textDecoration: "none" }}>
            {t("disclaimer")}
          </Link>
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <Link href="/about"       style={{ color: "#9B9B9B", textDecoration: "none" }}>{t("about")}</Link>
          <span style={{ color: "#C0C0C0" }}>·</span>
          <Link href="/disclaimer"  style={{ color: "#9B9B9B", textDecoration: "none" }}>{t("disclaimer")}</Link>
          <span style={{ color: "#C0C0C0" }}>·</span>
          <Link href="/privacy"     style={{ color: "#9B9B9B", textDecoration: "none" }}>{t("privacy")}</Link>
          <span style={{ color: "#C0C0C0" }}>·</span>
          <Link href="/contribute"  style={{ color: "#9B9B9B", textDecoration: "none" }} className="hidden sm:inline">{t("contribute")}</Link>
          <span style={{ color: "#C0C0C0" }} className="hidden sm:inline">·</span>
          <span className="hidden sm:inline"><FeedbackModal label={t("feedback")} /></span>
          <span style={{ color: "#C0C0C0" }} className="hidden sm:inline">·</span>
        </div>
      </div>
    </footer>
  );
}
