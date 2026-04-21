/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useEffect, useState } from "react";

interface DistrictStatusBarProps {
  districtName: string;
  stateName: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

export default function DistrictStatusBar({ districtName, stateName }: DistrictStatusBarProps) {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      const ss = String(now.getSeconds()).padStart(2, "0");
      setTimeStr(`${hh}:${mm}:${ss} IST`);
      setDateStr(`${DAYS[now.getDay()]}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="sticky top-[92px] md:top-[56px] flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3"
      style={{
        zIndex: 30,
        minHeight: 32,
        background: "#FAFAF8",
        borderBottom: "1px solid #E8E8E4",
        fontSize: 11,
      }}
    >
      {/* Location dot + name */}
      <span className="flex items-center gap-1" style={{ color: "#6B6B6B" }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#9B9B9B", display: "inline-block", flexShrink: 0 }} />
        {districtName}
        {stateName && <span style={{ color: "#9B9B9B" }}>, {stateName}</span>}
      </span>

      <span style={{ color: "#D4D4D0" }}>|</span>

      {/* Date — hidden on very small screens */}
      {dateStr && (
        <>
          <span className="hidden sm:inline" style={{ color: "#9B9B9B" }}>{dateStr}</span>
          <span className="hidden sm:inline" style={{ color: "#D4D4D0" }}>|</span>
        </>
      )}

      {/* Time */}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          color: "#6B6B6B",
          fontWeight: 500,
          letterSpacing: "0.03em",
        }}
      >
        {timeStr}
      </span>

      <span style={{ color: "#D4D4D0" }}>|</span>

      {/* Live indicator */}
      <span className="flex items-center gap-1" style={{ color: "#16A34A", fontWeight: 600 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#22C55E",
            display: "inline-block",
            boxShadow: "0 0 0 2px rgba(34,197,94,0.25)",
          }}
        />
        Live
      </span>
    </div>
  );
}
