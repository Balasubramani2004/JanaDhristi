/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";

import { useState, useRef, useEffect } from "react";

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  delay?: number;
}

export function Tooltip({ content, children, side = "top", delay = 300 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function show() {
    timerRef.current = setTimeout(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = side === "bottom" ? rect.bottom + 6 : rect.top - 6;
      setPos({ x, y });
      setVisible(true);
    }, delay);
  }

  function hide() {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        style={{ display: "inline-flex" }}
      >
        {children}
      </span>

      {visible && (
        <div
          style={{
            position: "fixed",
            left: pos.x,
            top: pos.y,
            transform: side === "bottom"
              ? "translateX(-50%)"
              : "translateX(-50%) translateY(-100%)",
            background: "#1A1A1A",
            color: "#fff",
            fontSize: 11,
            padding: "5px 9px",
            borderRadius: 6,
            pointerEvents: "none",
            whiteSpace: "nowrap",
            zIndex: 9999,
            boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
            maxWidth: 240,
            textAlign: "center",
            lineHeight: 1.4,
          }}
          role="tooltip"
        >
          {content}
        </div>
      )}
    </>
  );
}
