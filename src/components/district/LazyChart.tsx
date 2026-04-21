/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
// Lazy-loaded chart container — defers chart rendering until in viewport
// Wraps any Recharts component to prevent them from blocking initial load
import React, { Suspense, useEffect, useRef, useState } from "react";

interface LazyChartProps {
  children: React.ReactNode;
  height?: number;
  label?: string;
}

export function LazyChart({ children, height = 200, label }: LazyChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Use IntersectionObserver to render only when in viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" } // pre-load 200px before visible
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: height }} aria-label={label} role="img">
      {visible ? (
        <Suspense
          fallback={
            <div
              style={{
                height,
                background: "linear-gradient(90deg, #F5F5F0 25%, #EBEBEB 50%, #F5F5F0 75%)",
                backgroundSize: "200% 100%",
                borderRadius: 8,
                animation: "shimmer 1.5s infinite",
              }}
            />
          }
        >
          {children}
        </Suspense>
      ) : (
        <div
          style={{
            height,
            background: "#F5F5F0",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              border: "2px solid #E8E8E4",
              borderTopColor: "#2563EB",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      )}
      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
