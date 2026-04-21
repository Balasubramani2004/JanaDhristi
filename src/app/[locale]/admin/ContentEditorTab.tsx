"use client";

/**
 * ForThePeople.in — Content Editor tab
 * Select district → pick a module → edit rows inline. Changes write to the DB,
 * invalidate Redis cache, and log to UpdateLog + AdminAuditLog.
 *
 * Only a vetted allowlist of modules is editable (see CONTENT_MODULES in the
 * API route). Scraper-generated data (weather, news, crops) is intentionally
 * read-only — edit it upstream in the scraper or the seed.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Lock, Pencil, Plus, Save, Trash2 } from "lucide-react";
import ModuleHelp from "@/components/admin/ModuleHelp";

interface State {
  id: string;
  slug: string;
  name: string;
}
interface District {
  id: string;
  slug: string;
  name: string;
  stateId: string;
}
interface ModuleConfig {
  module: string;
  label: string;
  table: string;
  editableFields: string[];
  districtField?: string;
}

type Row = Record<string, unknown> & { id: string };

const CONTENT_EDITOR_HELP =
  "Edit district data that was originally seeded (leadership, infrastructure, schools, etc.). Saved changes propagate to the public site after Redis cache invalidation. Scraper-generated modules (weather, news, crops) are read-only — fix them upstream. Every edit goes to the Update Log with before/after values.";

const READ_ONLY_MODULES = [
  { slug: "weather", label: "Weather" },
  { slug: "news", label: "News" },
  { slug: "crops", label: "Crop Prices" },
  { slug: "dams", label: "Dams" },
  { slug: "power", label: "Power" },
  { slug: "alerts", label: "Alerts" },
];

const card: React.CSSProperties = {
  background: "#FFFFFF",
  border: "1px solid #E8E8E4",
  borderRadius: 10,
  padding: 16,
};

export default function ContentEditorTab() {
  const [modules, setModules] = useState<ModuleConfig[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [stateId, setStateId] = useState<string>("");
  const [districtSlug, setDistrictSlug] = useState<string>("");
  const [activeModule, setActiveModule] = useState<ModuleConfig | null>(null);

  useEffect(() => {
    // Load module list + states + districts once.
    fetch("/api/admin/content?module=list")
      .then((r) => r.json())
      .then((d: { modules: ModuleConfig[] }) => setModules(d.modules ?? []))
      .catch(() => {});
    fetch("/api/admin/districts")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { states?: State[]; districts?: District[] } | null) => {
        if (d?.states) setStates(d.states);
        if (d?.districts) setDistricts(d.districts);
      })
      .catch(() => {});
  }, []);

  const filteredDistricts = useMemo(
    () => (stateId ? districts.filter((d) => d.stateId === stateId) : districts),
    [districts, stateId]
  );

  const activeDistrict = districts.find((d) => d.slug === districtSlug);

  if (activeModule && activeDistrict) {
    return (
      <ModuleEditor
        module={activeModule}
        district={activeDistrict}
        onBack={() => setActiveModule(null)}
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#1A1A1A" }}>
          Content Editor
        </h2>
        <ModuleHelp text={CONTENT_EDITOR_HELP} size={14} />
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <select value={stateId} onChange={(e) => setStateId(e.target.value)} style={select}>
          <option value="">All states</option>
          {states.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={districtSlug}
          onChange={(e) => setDistrictSlug(e.target.value)}
          style={select}
        >
          <option value="">— Select district —</option>
          {filteredDistricts.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      {!districtSlug ? (
        <div style={{ ...card, color: "#9B9B9B", fontSize: 13 }}>
          Pick a district to see its editable modules.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13, color: "#6B6B6B" }}>
            Editable modules for <strong>{activeDistrict?.name}</strong>:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {modules.map((m) => (
              <button
                key={m.module}
                onClick={() => setActiveModule(m)}
                style={{
                  ...card,
                  textAlign: "left",
                  cursor: "pointer",
                  border: "1px solid #E8E8E4",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A1A" }}>{m.label}</div>
                <div style={{ fontSize: 11, color: "#9B9B9B", marginTop: 4 }}>
                  {m.editableFields.length} editable fields · <code>{m.table}</code>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#2563EB",
                    marginTop: 6,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <Pencil size={10} /> Edit
                </div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#6B6B6B", marginBottom: 6 }}>
              Read-only (scraper-generated)
            </div>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {READ_ONLY_MODULES.map((r) => (
                <span
                  key={r.slug}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 10px",
                    background: "#F3F4F6",
                    color: "#6B6B6B",
                    borderRadius: 6,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  <Lock size={10} /> {r.label}
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ModuleEditor({
  module,
  district,
  onBack,
}: {
  module: ModuleConfig;
  district: District;
  onBack: () => void;
}) {
  const [records, setRecords] = useState<Row[]>([]);
  const [changes, setChanges] = useState<Record<string, Record<string, unknown>>>({});
  const [toDelete, setToDelete] = useState<Set<string>>(new Set());
  const [creates, setCreates] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch(
      `/api/admin/content?district=${encodeURIComponent(district.slug)}&module=${encodeURIComponent(module.module)}`
    )
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { records: Row[] } | null) => d && setRecords(d.records ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [district.slug, module.module]);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (id: string, field: string, value: unknown) => {
    setChanges((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? {}), [field]: value },
    }));
  };

  const hasChanges =
    Object.keys(changes).length > 0 || toDelete.size > 0 || creates.length > 0;

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {
        module: module.module,
        districtSlug: district.slug,
        updates: Object.entries(changes).map(([id, ch]) => ({ id, changes: ch })),
        creates: creates.map((data) => ({ data })),
        deletes: Array.from(toDelete),
      };
      const res = await fetch("/api/admin/content/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setMessage(
        `Saved: ${json.updated} updated, ${json.created} created, ${json.deleted} deleted. Cache cleared.`
      );
      setChanges({});
      setToDelete(new Set());
      setCreates([]);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "1px solid #E8E8E4",
              borderRadius: 6,
              padding: "5px 10px",
              fontSize: 12,
              cursor: "pointer",
              color: "#6B6B6B",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <ArrowLeft size={12} /> Back
          </button>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A" }}>
              Editing {module.label} · {district.name}
            </div>
            <div style={{ fontSize: 11, color: "#9B9B9B" }}>
              {records.length} rows · {module.editableFields.length} editable fields
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={() =>
              setCreates((prev) => [...prev, Object.fromEntries(module.editableFields.map((f) => [f, null]))])
            }
            style={{
              padding: "6px 12px",
              background: "#fff",
              color: "#2563EB",
              border: "1px solid #DBEAFE",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Plus size={12} /> Add row
          </button>
          <button
            onClick={save}
            disabled={!hasChanges || saving}
            style={{
              padding: "6px 12px",
              background: hasChanges ? "#16A34A" : "#E8E8E4",
              color: hasChanges ? "#fff" : "#9B9B9B",
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: hasChanges ? "pointer" : "not-allowed",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Save size={12} /> {saving ? "Saving..." : "Save all changes"}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: "#FEE2E2",
            color: "#991B1B",
            padding: 8,
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          {error}
        </div>
      )}
      {message && (
        <div
          style={{
            background: "#DCFCE7",
            color: "#166534",
            padding: 8,
            borderRadius: 6,
            fontSize: 12,
          }}
        >
          {message}
        </div>
      )}

      {loading ? (
        <div style={{ ...card, color: "#9B9B9B", fontSize: 12, textAlign: "center" }}>
          Loading rows...
        </div>
      ) : records.length === 0 && creates.length === 0 ? (
        <div style={{ ...card, color: "#9B9B9B", fontSize: 12, textAlign: "center" }}>
          No rows yet — click <strong>Add row</strong> to create one.
        </div>
      ) : (
        <div style={{ ...card, padding: 0, overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E8E8E4", background: "#FAFAF8" }}>
                <th style={{ ...th, width: 40 }}></th>
                {module.editableFields.map((f) => (
                  <th key={f} style={th}>
                    {f}
                  </th>
                ))}
                <th style={{ ...th, width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const markedDelete = toDelete.has(r.id);
                return (
                  <tr
                    key={r.id}
                    style={{
                      borderBottom: "1px solid #F5F5F0",
                      opacity: markedDelete ? 0.4 : 1,
                      textDecoration: markedDelete ? "line-through" : "none",
                    }}
                  >
                    <td style={{ padding: "4px 6px" }}>
                      <input
                        type="checkbox"
                        checked={markedDelete}
                        onChange={(e) =>
                          setToDelete((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(r.id);
                            else next.delete(r.id);
                            return next;
                          })
                        }
                        style={{ accentColor: "#DC2626" }}
                      />
                    </td>
                    {module.editableFields.map((f) => {
                      const current = changes[r.id]?.[f];
                      const original = r[f];
                      const value = current !== undefined ? current : original;
                      const changed = current !== undefined && current !== original;
                      return (
                        <td
                          key={f}
                          style={{
                            padding: "2px 4px",
                            background: changed ? "#FEF9C3" : "transparent",
                          }}
                        >
                          <CellInput
                            value={value}
                            onChange={(v) => setField(r.id, f, v)}
                            disabled={markedDelete}
                          />
                        </td>
                      );
                    })}
                    <td style={{ padding: "4px 6px" }}></td>
                  </tr>
                );
              })}
              {creates.map((c, i) => (
                <tr
                  key={`new-${i}`}
                  style={{
                    borderBottom: "1px solid #F5F5F0",
                    background: "#F0FDF4",
                  }}
                >
                  <td style={{ padding: "4px 6px", color: "#16A34A", fontWeight: 700, fontSize: 11 }}>
                    NEW
                  </td>
                  {module.editableFields.map((f) => (
                    <td key={f} style={{ padding: "2px 4px" }}>
                      <CellInput
                        value={c[f]}
                        onChange={(v) =>
                          setCreates((prev) => {
                            const next = [...prev];
                            next[i] = { ...next[i], [f]: v };
                            return next;
                          })
                        }
                      />
                    </td>
                  ))}
                  <td style={{ padding: "4px 6px" }}>
                    <button
                      onClick={() => setCreates((prev) => prev.filter((_, j) => j !== i))}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#DC2626",
                        cursor: "pointer",
                      }}
                      aria-label="Remove new row"
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function CellInput({
  value,
  onChange,
  disabled,
}: {
  value: unknown;
  onChange: (v: unknown) => void;
  disabled?: boolean;
}) {
  if (typeof value === "boolean") {
    return (
      <input
        type="checkbox"
        checked={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: "#2563EB" }}
      />
    );
  }
  return (
    <input
      type="text"
      value={value == null ? "" : String(value)}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "3px 6px",
        border: "1px solid transparent",
        background: "transparent",
        fontSize: 12,
        outline: "none",
      }}
      onFocus={(e) => (e.target.style.background = "#fff")}
      onBlur={(e) => (e.target.style.background = "transparent")}
    />
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: "6px 8px",
  color: "#6B6B6B",
  fontWeight: 600,
  fontSize: 11,
  textTransform: "capitalize",
};

const select: React.CSSProperties = {
  padding: "7px 10px",
  border: "1px solid #E8E8E4",
  borderRadius: 6,
  fontSize: 13,
  background: "#fff",
  color: "#1A1A1A",
  minWidth: 180,
};
