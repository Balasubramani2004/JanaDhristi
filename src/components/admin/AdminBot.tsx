"use client";

/**
 * ForThePeople.in — Floating admin bot widget
 * Bottom-right bubble. Pattern-matched queries are free (zero AI cost);
 * open-ended "analyze" prompts nudge the user to the Dashboard's AI Report card.
 *
 * Messages persist in AdminBotMessage (pulled back via GET on open).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Bot, Send, X } from "lucide-react";

interface BotMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  action?: string | null;
}

export default function AdminBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const loadHistory = useCallback(() => {
    fetch("/api/admin/bot?limit=30")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { messages: BotMessage[] } | null) => {
        if (d) setMessages(d.messages);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (open && !loaded) loadHistory();
  }, [open, loaded, loadHistory]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages.length, open]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    const optimistic: BotMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    try {
      const res = await fetch("/api/admin/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json().catch(() => ({}));
      const reply: BotMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.reply ?? "(no reply)",
        timestamp: new Date().toISOString(),
        action: data.action ?? null,
      };
      setMessages((prev) => [...prev, reply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "Network error — try again.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open admin bot"
          style={bubbleStyle}
        >
          <Bot size={22} />
        </button>
      )}
      {open && (
        <div style={panelStyle}>
          <div style={headerStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Bot size={16} color="#7C3AED" />
              <strong style={{ fontSize: 13, color: "#1A1A1A" }}>Admin Bot</strong>
              <span style={{ fontSize: 10, color: "#9B9B9B" }}>
                · DB queries · zero AI cost
              </span>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: "none",
                border: "none",
                padding: 4,
                cursor: "pointer",
                color: "#6B6B6B",
              }}
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>

          <div ref={listRef} style={listStyle}>
            {messages.length === 0 && (
              <div style={{ fontSize: 12, color: "#6B6B6B", padding: 10 }}>
                Ask things like <em>how much revenue this week?</em>, <em>show stale districts</em>,
                or <em>Add expense: Vercel Pro ₹1680</em>. Type <strong>help</strong> to see all patterns.
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "85%",
                    padding: "7px 10px",
                    borderRadius: 10,
                    fontSize: 12,
                    whiteSpace: "pre-wrap",
                    lineHeight: 1.45,
                    background: m.role === "user" ? "#2563EB" : "#F3F4F6",
                    color: m.role === "user" ? "#fff" : "#1A1A1A",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={send} style={inputBarStyle}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything… (type 'help')"
              disabled={sending}
              style={{
                flex: 1,
                padding: "7px 10px",
                border: "1px solid #E8E8E4",
                borderRadius: 6,
                fontSize: 12,
                outline: "none",
              }}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              style={{
                padding: "6px 10px",
                background: sending || !input.trim() ? "#E8E8E4" : "#2563EB",
                color: sending || !input.trim() ? "#9B9B9B" : "#fff",
                border: "none",
                borderRadius: 6,
                cursor: sending || !input.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
              aria-label="Send"
            >
              <Send size={12} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

const bubbleStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 20,
  right: 20,
  width: 52,
  height: 52,
  borderRadius: "50%",
  background: "#7C3AED",
  color: "#fff",
  border: "none",
  cursor: "pointer",
  boxShadow: "0 4px 16px rgba(124, 58, 237, 0.4)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 55,
};

const panelStyle: React.CSSProperties = {
  position: "fixed",
  bottom: 20,
  right: 20,
  width: 360,
  maxWidth: "calc(100vw - 32px)",
  height: 480,
  maxHeight: "75vh",
  background: "#FFFFFF",
  border: "1px solid #E8E8E4",
  borderRadius: 12,
  boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
  zIndex: 55,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderBottom: "1px solid #F0F0EC",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const listStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
  padding: 10,
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const inputBarStyle: React.CSSProperties = {
  display: "flex",
  gap: 6,
  padding: 10,
  borderTop: "1px solid #F0F0EC",
};
