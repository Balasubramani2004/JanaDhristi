/**
 * JanaDhristi — Your District. Your Data. Your Right.
 * © 2026 Jayanth M B. MIT License with Attribution.
 * https://github.com/jayanthmb14/forthepeople
 */

export default function HowItWorks() {
  const steps = [
    {
      icon: "📡",
      title: "We Collect",
      desc: "Data from government portals every 5–30 minutes",
    },
    {
      icon: "📊",
      title: "We Organize",
      desc: "Into 29 dashboards with charts & maps",
    },
    {
      icon: "👁️",
      title: "You See",
      desc: "Real-time district data. Free. Open source. Yours.",
    },
  ];

  return (
    <div style={{ padding: "0 16px 8px" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "#9B9B9B",
          marginBottom: 12,
        }}
      >
        How It Works
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        {steps.map((s, i) => (
          <div key={s.title} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{s.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 4 }}>
              {s.title}
            </div>
            <div style={{ fontSize: 11, color: "#6B6B6B", lineHeight: 1.5 }}>{s.desc}</div>
            {i < steps.length - 1 && (
              <div
                style={{
                  position: "absolute",
                  right: "-6px",
                  top: "50%",
                  fontSize: 16,
                  color: "#E8E8E4",
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
