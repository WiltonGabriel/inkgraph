import React from "react";
import type { SceneBeat } from "../data/mockData";
import { TrendingUp, ArrowRight, Activity } from "lucide-react";

interface Props {
  timeline: SceneBeat[];
}

export const TimelineVisualizer: React.FC<Props> = ({ timeline }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", height: "100%" }}>
      {/* Narrative Tension Graph Header */}
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "1.2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <Activity color="var(--accent)" size={20} />
          <h2 style={{ fontSize: "1.1rem" }}>Curva de Tensão Narrativa (WorldScript Pacing Engine)</h2>
        </div>

        {/* Dynamic Tension Curve Bars */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: "1.5rem",
            height: "140px",
            padding: "0.5rem 1rem",
            background: "var(--bg-card)",
            borderRadius: "6px",
            border: "1px solid var(--border)",
          }}
        >
          {timeline.map((beat) => {
            const barHeight = `${beat.tension}%`;
            const tensionColor =
              beat.tension > 75 ? "#ef4444" : beat.tension > 45 ? "#eab308" : "#10b981";

            return (
              <div
                key={beat.id}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  height: "100%",
                  justifyContent: "flex-end",
                }}
              >
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: tensionColor, marginBottom: "0.3rem" }}>
                  {beat.tension}%
                </div>
                <div
                  style={{
                    width: "100%",
                    maxWidth: "48px",
                    height: barHeight,
                    background: `linear-gradient(to top, #1e293b, ${tensionColor})`,
                    borderRadius: "4px 4px 0 0",
                    transition: "height 0.3s ease",
                  }}
                />
                <div
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    marginTop: "0.4rem",
                    textAlign: "center",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: "100%",
                  }}
                >
                  Cena {beat.order}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Causal Scene Flow */}
      <div
        style={{
          flex: 1,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "1.2rem",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <TrendingUp color="var(--accent)" size={20} />
          <h3 style={{ fontSize: "1rem" }}>Cadeia Causal de Cenas (Causa & Efeito)</h3>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {timeline.map((beat) => (
            <div
              key={beat.id}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "6px",
                padding: "1rem",
                display: "grid",
                gridTemplateColumns: "120px 1fr 280px",
                gap: "1rem",
                alignItems: "center",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.7rem",
                    background: "rgba(99, 102, 241, 0.15)",
                    color: "var(--accent)",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "4px",
                    fontWeight: 700,
                  }}
                >
                  {beat.chapter}
                </span>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, marginTop: "0.4rem" }}>
                  Cena {beat.order}: {beat.title}
                </div>
              </div>

              <div>
                <p style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.4 }}>{beat.summary}</p>
                <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.4rem" }}>
                  {beat.characters.map((char, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "0.7rem",
                        background: "#1e293b",
                        color: "var(--text-muted)",
                        padding: "0.1rem 0.4rem",
                        borderRadius: "3px",
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </div>
              </div>

              {/* Causality links */}
              <div
                style={{
                  borderLeft: "1px solid var(--border)",
                  paddingLeft: "1rem",
                  fontSize: "0.75rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.3rem",
                }}
              >
                <div style={{ color: "var(--text-muted)" }}>
                  <strong>Causado por:</strong> {beat.causes.join(", ")}
                </div>
                <div style={{ color: "#38bdf8", display: "flex", alignItems: "center", gap: "0.2rem" }}>
                  <ArrowRight size={12} /> <strong>Gera:</strong> {beat.effects.join(", ")}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
