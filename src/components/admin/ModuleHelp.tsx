"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";

interface Props {
  text: string;
  size?: number;
  placement?: "right" | "bottom";
}

export default function ModuleHelp({ text, size = 14, placement = "bottom" }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const popoverStyle: React.CSSProperties =
    placement === "right"
      ? { left: "calc(100% + 8px)", top: 0 }
      : { left: 0, top: "calc(100% + 6px)" };

  return (
    <span
      ref={ref}
      style={{ position: "relative", display: "inline-flex", alignItems: "center" }}
    >
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Help"
        style={{
          background: "none",
          border: "none",
          padding: 2,
          cursor: "pointer",
          color: "#9B9B9B",
          display: "inline-flex",
          alignItems: "center",
        }}
      >
        <Info size={size} />
      </button>
      {open && (
        <span
          role="tooltip"
          style={{
            position: "absolute",
            zIndex: 50,
            background: "#1A1A1A",
            color: "#FFFFFF",
            fontSize: 11,
            lineHeight: 1.5,
            padding: "8px 10px",
            borderRadius: 6,
            width: 260,
            whiteSpace: "normal",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            fontWeight: 500,
            ...popoverStyle,
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
}
