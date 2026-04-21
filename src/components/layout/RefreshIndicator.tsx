/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export default function RefreshIndicator() {
  const [time, setTime] = useState("");
  const [isRefreshing] = useState(false);

  useEffect(() => {
    function updateTime() {
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
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: 36,
        background: "#FFFFFF",
        borderTop: "1px solid #E8E8E4",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        zIndex: 40,
        fontSize: 11,
        color: "#9B9B9B",
      }}
    >
      {/* Left: data source note */}
      <span>
        Data sourced under NDSAP Open Data Policy &nbsp;·&nbsp; Built for the citizens of India
      </span>

      {/* Right: live clock + refresh status */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {isRefreshing && (
          <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#2563EB" }}>
            <RefreshCw size={11} style={{ animation: "spin 1s linear infinite" }} />
            Refreshing...
          </span>
        )}
        <span
          className="font-data"
          style={{ fontFamily: "var(--font-mono)", color: "#6B6B6B", fontSize: 11 }}
        >
          {time}
        </span>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
