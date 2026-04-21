// ── ForThePeople.in — Graceful Empty State Component ───────
import { getEmptyState } from "@/lib/empty-states";

interface EmptyStateProps {
  module: string;
  compact?: boolean;
}

export default function EmptyState({ module, compact = false }: EmptyStateProps) {
  const { title, message, icon } = getEmptyState(module);

  if (compact) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0" }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
        <span style={{ fontSize: 12, color: "#9B9B9B", lineHeight: 1.4 }}>{message}</span>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#F9F9F7",
        border: "1px dashed #D0D0CC",
        borderRadius: 12,
        padding: "24px 20px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 36, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "#6B6B6B", marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: "#9B9B9B", lineHeight: 1.6, maxWidth: 320, margin: "0 auto" }}>
        {message}
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: "#C0C0BA" }}>Expected: Within 1 week</div>
    </div>
  );
}
