import React, { useState } from "react";
import type { SceneBeat } from "../data/mockData";
import { Activity, Plus, TrendingUp, Sparkles, ArrowRight } from "lucide-react";

interface Props {
  timeline: SceneBeat[];
}

export const PlotBoardView: React.FC<Props> = ({ timeline }) => {
  const [selectedScene, setSelectedScene] = useState<SceneBeat | null>(timeline[0] || null);

  const chapters = ["Capítulo 1", "Capítulo 2", "Capítulo 3"];

  return (
    <div style={{ display: "grid", gridTemplateRows: "180px 1fr", gap: "1rem", height: "100%" }}>
      {/* Narrative Tension Graph */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          padding: "1rem 1.5rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Activity color="var(--accent)" size={18} />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700 }}>Curva de Tensão Contínua</h3>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Dinâmica de ritmo por cena
          </span>
        </div>

        {/* SVG Continuous Wave Curve */}
        <div style={{ flex: 1, position: "relative", width: "100%" }}>
          <svg
            style={{ width: "100%", height: "100%", overflow: "visible" }}
            viewBox="0 0 1000 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="tensionGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <path
              d="M 50,70 Q 250,30 500,12 T 900,75 L 900,100 L 50,100 Z"
              fill="url(#tensionGrad)"
            />

            <path
              d="M 50,70 Q 250,30 500,12 T 900,75"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
            />

            {timeline.map((beat, idx) => {
              const xPos = 50 + idx * 280;
              const yPos = 100 - beat.tension * 0.9;
              const isSelected = selectedScene?.id === beat.id;

              return (
                <g key={beat.id} onClick={() => setSelectedScene(beat)} style={{ cursor: "pointer" }}>
                  <circle
                    cx={xPos}
                    cy={yPos}
                    r={isSelected ? 7 : 5}
                    fill={beat.tension > 70 ? "#ef4444" : "#f59e0b"}
                    stroke="#ffffff"
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  <text
                    x={xPos}
                    y={yPos - 12}
                    textAnchor="middle"
                    fill="#cbd5e1"
                    fontSize="11"
                    fontWeight="600"
                  >
                    {beat.tension}%
                  </text>
                  <text
                    x={xPos}
                    y={95}
                    textAnchor="middle"
                    fill="var(--text-muted)"
                    fontSize="10"
                  >
                    Cena {beat.order}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Swimlanes */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr) 340px",
          gap: "1rem",
          overflow: "hidden",
        }}
      >
        {chapters.map((chap) => {
          const scenesInChap = timeline.filter((s) => s.chapter === chap);

          return (
            <div
              key={chap}
              style={{
                background: "var(--bg-secondary)",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "0.8rem 1rem",
                  borderBottom: "1px solid var(--border)",
                  background: "var(--bg-card)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--accent)" }}>{chap}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {scenesInChap.length} cenas
                </span>
              </div>

              <div
                style={{
                  padding: "0.8rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.8rem",
                  overflowY: "auto",
                  flex: 1,
                }}
              >
                {scenesInChap.map((scene) => {
                  const isSelected = selectedScene?.id === scene.id;

                  return (
                    <div
                      key={scene.id}
                      onClick={() => setSelectedScene(scene)}
                      style={{
                        background: isSelected ? "var(--bg-card)" : "#131a29",
                        border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: "6px",
                        padding: "0.8rem",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        boxShadow: isSelected ? "0 0 12px rgba(99, 102, 241, 0.25)" : "none",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fff" }}>
                          #{scene.order} {scene.title}
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: scene.tension > 70 ? "#ef4444" : "#f59e0b",
                          }}
                        >
                          {scene.tension}%
                        </span>
                      </div>

                      <p style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.4, marginBottom: "0.6rem" }}>
                        {scene.summary}
                      </p>

                      <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
                        {scene.characters.map((c, i) => (
                          <span
                            key={i}
                            style={{
                              fontSize: "0.7rem",
                              background: "#1e293b",
                              padding: "0.15rem 0.4rem",
                              borderRadius: "3px",
                              color: "#cbd5e1",
                            }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <button
                  style={{
                    background: "transparent",
                    border: "1px dashed var(--border)",
                    borderRadius: "6px",
                    padding: "0.6rem",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    fontSize: "0.8rem",
                  }}
                >
                  <Plus size={14} /> Adicionar Cena
                </button>
              </div>
            </div>
          );
        })}

        {/* Selected Scene Inspector */}
        <div
          style={{
            background: "var(--bg-secondary)",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {selectedScene ? (
            <>
              <div style={{ padding: "1rem", borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}>
                <span style={{ fontSize: "0.7rem", textTransform: "uppercase", color: "var(--accent)", fontWeight: 700 }}>
                  Inspetor de Cena • {selectedScene.chapter}
                </span>
                <h3 style={{ fontSize: "1.1rem", marginTop: "0.2rem" }}>
                  Cena {selectedScene.order}: {selectedScene.title}
                </h3>
              </div>

              <div style={{ padding: "1rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <h5 style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                    Resumo do Beat
                  </h5>
                  <p style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.4 }}>{selectedScene.summary}</p>
                </div>

                <div style={{ background: "var(--bg-card)", padding: "0.8rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                  <h5 style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "#38bdf8", marginBottom: "0.4rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <TrendingUp size={14} /> Causalidade Narrativa
                  </h5>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                    <strong>Causado por:</strong> {selectedScene.causes.join(", ")}
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#38bdf8", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <ArrowRight size={14} /> <strong>Desencadeia:</strong> {selectedScene.effects.join(", ")}
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    borderRadius: "6px",
                    padding: "0.8rem",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#10b981", fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.2rem" }}>
                    <Sparkles size={14} /> Auditoria Epistêmica OK
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                    Nenhum personagem presente nesta cena utiliza segredos que ainda não foram revelados até este ponto da linha do tempo.
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Selecione uma cena no quadro.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
