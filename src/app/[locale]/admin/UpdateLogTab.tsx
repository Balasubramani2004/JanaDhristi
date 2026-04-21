"use client";

/**
 * ForThePeople.in — Update Log tab
 * Shows every content change (admin edits, scraper runs, bot commands) with
 * old/new values. Filters by source, district, module. CSV export.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import ModuleHelp from "@/components/admin/ModuleHelp";

interface UpdateEntry {
  id: string;
  source: string;
  actorLabel: string | null;
  tableName: string;
  recordId: string;
  action: string;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  districtId: string | null;
  districtName: string | null;
  moduleName: string | null;
  description: string | null;
  timestamp: string;
}

const UPDATE_LOG_HELP =
  "Every data change logged with before/after values. Sources: admin_edit (Content Editor), scraper (data refresh), cron (scheduled jobs), ai_bot (bot commands), api (external). Use this to answer 'what changed and when?' questions.";

const SOURCE_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  admin_edit: { bg: "#DBEAFE", text: "#2563EB", label: "Admin Edit" },
  scraper: { bg: "#F3F4F6", text: "#4B5563", label: "Scraper" },
  cron: { bg: "#EDE9FE", text: "#7C3AED", label: "Cron" },
  ai_bot: { bg: "#FCE7F3", text: "#BE185D", label: "AI Bot" },
  api: { bg: "#FEF3C7", text: "#92400E", label: "API" },
};

const ACTION_ICON: Record<string, string> = {
  create: "➕",
  update: "✏️",
  delete: "🗑️",
};

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E8E8E4",
  borderRadius: 10,
  padding: 16,
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function bucketDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function UpdateLogTab() {
  const [entries, setEntries] = useState<UpdateEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [source, setSource] = useState<string>("all");
  const [moduleName, setModuleName] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "50", page: String(page) });
    if (source !== "all") params.set("source", source);
    if (moduleName !== "all") params.set("moduleName", moduleName);
    fetch(`/api/admin/update-log?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(
        (d: { entries: UpdateEntry[]; total: number } | null) => {
          if (d) {
            setEntries(d.entries);
            setTotal(d.total);
          }
        }
      )
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [source, moduleName, page]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const moduleOptions = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) if (e.moduleName) set.add(e.moduleName);
    return Array.from(set).sort();
  }, [entries]);

  const grouped = useMemo(() => {
    const map = new Map<string, UpdateEntry[]>();
    for (const e of entries) {
      const key = bucketDate(e.timestamp);
      const bucket = map.get(key) ?? [];
      bucket.push(e);
      map.set(key, bucket);
    }
    return map;
  }, [entries]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exportCsv = () => {
    const rows = [
      ["timestamp", "source", "actor", "table", "recordId", "action", "field", "oldValue", "newValue", "district", "module", "description"],
      ...entries.map((e) => [
        e.timestamp,
        e.source,
        e.actorLabel ?? "",
        e.tableName,
        e.recordId,
        e.action,
        e.fieldName ?? "",
        e.oldValue ?? "",
        e.newValue ?? "",
        e.districtName ?? "",
        e.moduleName ?? "",
        e.description ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""').replace(/\n/g, " ")}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ftp-updatelog-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1A1A1A" }}>
            Update Log
          </h2>
          <ModuleHelp text={UPDATE_LOG_HELP} size={14} />
          <span style={{ fontSize: 11, color: "#9B9B9B", marginLeft: 4 }}>
            · {total.toLocaleString("en-IN")} entries
          </span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <select
            value={source}
            onChange={(e) => {
              setPage(1);
              setSource(e.target.value);
            }}
            style={selectStyle}
          >
            <option value="all">All sources</option>
            <option value="admin_edit">Admin edits</option>
            <option value="scraper">Scraper</option>
            <option value="cron">Cron</option>
            <option value="ai_bot">AI Bot</option>
            <option value="api">API</option>
          </select>
          {moduleOptions.length > 0 && (
            <select
              value={moduleName}
              onChange={(e) => {
                setPage(1);
                setModuleName(e.target.value);
              }}
              style={selectStyle}
            >
              <option value="all">All modules</option>
              {moduleOptions.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={exportCsv}
            style={{
              padding: "5px 10px",
              background: "#fff",
              color: "#16A34A",
              border: "1px solid #BBF7D0",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Download size={10} /> CSV
          </button>
        </div>
      </div>

      {loading && entries.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: "#9B9B9B", fontSize: 13 }}>
          Loading...
        </div>
      ) : entries.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: "#9B9B9B", fontSize: 13 }}>
          No update log entries yet. Edits made in the Content Editor will appear here.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from(grouped.entries()).map(([bucket, bucketEntries]) => (
            <div key={bucket}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#6B6B6B",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 6,
                }}
              >
                {bucket}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {bucketEntries.map((e) => {
                  const src = SOURCE_COLOR[e.source] ?? SOURCE_COLOR.api;
                  const isExpanded = expanded.has(e.id);
                  return (
                    <div
                      key={e.id}
                      style={{ ...card, padding: 10, cursor: "pointer" }}
                      onClick={() => toggle(e.id)}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 8,
                          flexWrap: "wrap",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ fontSize: 14 }}>{ACTION_ICON[e.action] ?? "•"}</span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 3,
                              background: src.bg,
                              color: src.text,
                            }}
                          >
                            {src.label}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A1A" }}>
                            {e.tableName}
                            {e.fieldName && <span style={{ color: "#6B6B6B" }}> · {e.fieldName}</span>}
                          </span>
                          {e.districtName && (
                            <span style={{ fontSize: 11, color: "#6B6B6B" }}>· {e.districtName}</span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: "#9B9B9B" }}>
                          {fmtDate(e.timestamp)}
                        </span>
                      </div>
                      {e.description && (
                        <div style={{ fontSize: 12, color: "#6B6B6B", marginTop: 4 }}>
                          {e.description}
                        </div>
                      )}
                      {isExpanded && (e.oldValue || e.newValue) && (
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 11,
                            fontFamily: "var(--font-mono, monospace)",
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              background: "#FEE2E2",
                              padding: 6,
                              borderRadius: 4,
                              color: "#991B1B",
                            }}
                          >
                            <strong>Old:</strong> {e.oldValue ?? "—"}
                          </div>
                          <div
                            style={{
                              background: "#DCFCE7",
                              padding: 6,
                              borderRadius: 4,
                              color: "#166534",
                            }}
                          >
                            <strong>New:</strong> {e.newValue ?? "—"}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {entries.length < total && (
        <button
          onClick={() => setPage((p) => p + 1)}
          style={{
            alignSelf: "center",
            padding: "6px 14px",
            background: "#fff",
            color: "#2563EB",
            border: "1px solid #DBEAFE",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Load older ({(total - entries.length).toLocaleString("en-IN")} remaining)
        </button>
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: "5px 10px",
  borderRadius: 6,
  fontSize: 11,
  fontWeight: 600,
  border: "1px solid #E8E8E4",
  background: "#fff",
  color: "#6B6B6B",
  cursor: "pointer",
};
