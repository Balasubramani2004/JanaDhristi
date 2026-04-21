/**
 * ForThePeople.in — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

"use client";
import { useEffect, useState } from "react";

const KEY = "ftp_theme";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    const isDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(isDark);
    if (isDark) document.documentElement.setAttribute("data-theme", "dark");
    setMounted(true);
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem(KEY, "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem(KEY, "light");
    }
  }

  if (!mounted) return null;

  return (
    <button
      onClick={toggle}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 34,
        height: 34,
        border: "1px solid #E8E8E4",
        borderRadius: 8,
        background: "#FAFAF8",
        cursor: "pointer",
        fontSize: 15,
        flexShrink: 0,
      }}
    >
      {dark ? "☀️" : "🌙"}
    </button>
  );
}
