import { useState } from "react";
import { AlertTriangle, Info, RefreshCw } from "lucide-react";
import type { LoreItem, SceneBeat } from "../data/mockData";

interface Props {
  lore: LoreItem[];
  timeline: SceneBeat[];
}

interface Issue {
  id: string;
  severity: "error" | "warning" | "info";
  entityName: string;
  category: "epistemic" | "relationship" | "pacing";
  description: string;
  sceneRef?: string;
}

export const ConsistencyCheckerView: React.FC<Props> = () => {
  const [isAuditing, setIsAuditing] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<"all" | "error" | "warning">("all");

  const [issues, setIssues] = useState<Issue[]>([
    {
      id: "iss_01",
      severity: "warning",
      entityName: "Elias Vance",
      category: "epistemic",
      description: "No Capítulo 1, Cena 1, Elias Vance menciona a rota das catacumbas antes da conversa formal com o espião no bosque.",
      sceneRef: "Cena 1 (O Voo do Corvo)",
    },
    {
      id: "iss_02",
      severity: "info",
      entityName: "Ordem de Ferro",
      category: "relationship",
      description: "A relação de hostilidade entre a Ordem de Ferro e a Rainha Morrigan não tem registro de batalhas prévias descritas no lore.",
      sceneRef: "Dossiê Canônico",
    },
    {
      id: "iss_03",
      severity: "warning",
      entityName: "Alarme na Muralha Cinzenta",
      category: "pacing",
      description: "A curva de tensão salta bruscamente de 60% para 88% sem um beat intermediário de suspeita no portão dos fundos.",
      sceneRef: "Cena 3",
    },
  ]);

  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
    }, 800);
  };

  const filteredIssues = issues.filter(
    (i) => filterSeverity === "all" || i.severity === filterSeverity
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "100%", overflowY: "auto" }}>
      {/* Control Banner */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          padding: "1.2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>Auditoria de Consistência & Cânone</h2>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
            Verificação epistêmica, cronológica e de relações entre cenas do manuscrito e dossiês de lore.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <select
            value={filterSeverity}
            onChange={(e: any) => setFilterSeverity(e.target.value)}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "6px",
              padding: "0.4rem 0.8rem",
              fontSize: "0.8rem",
              outline: "none",
            }}
          >
            <option value="all">Todas as Severidades</option>
            <option value="error">Erros Críticos</option>
            <option value="warning">Alertas</option>
          </select>

          <button
            onClick={handleRunAudit}
            disabled={isAuditing}
            style={{
              background: "var(--accent)",
              color: "#fff",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <RefreshCw size={14} className={isAuditing ? "animate-spin" : ""} />
            {isAuditing ? "Auditando..." : "Executar Auditoria"}
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1rem" }}>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Fatos Verificados</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: "0.2rem", color: "#fff" }}>42</div>
        </div>

        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1rem" }}>
          <div style={{ fontSize: "0.75rem", color: "#f59e0b", textTransform: "uppercase" }}>Alertas Epistêmicos</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: "0.2rem", color: "#f59e0b" }}>
            {issues.filter((i) => i.severity === "warning").length}
          </div>
        </div>

        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1rem" }}>
          <div style={{ fontSize: "0.75rem", color: "#10b981", textTransform: "uppercase" }}>Coerência Geral</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 700, marginTop: "0.2rem", color: "#10b981" }}>94%</div>
        </div>
      </div>

      {/* Issues List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
        {filteredIssues.map((issue) => {
          const isError = issue.severity === "error";
          const isWarning = issue.severity === "warning";
          const color = isError ? "#ef4444" : isWarning ? "#f59e0b" : "#38bdf8";

          return (
            <div
              key={issue.id}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderLeft: `4px solid ${color}`,
                borderRadius: "6px",
                padding: "1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {isWarning ? <AlertTriangle size={15} color={color} /> : <Info size={15} color={color} />}
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>
                    {issue.entityName}
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      background: "var(--bg-card)",
                      padding: "0.15rem 0.4rem",
                      borderRadius: "3px",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    {issue.category}
                  </span>
                  {issue.sceneRef && (
                    <span style={{ fontSize: "0.75rem", color: "var(--accent)" }}>
                      Ref: {issue.sceneRef}
                    </span>
                  )}
                </div>

                <p style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "0.5rem", lineHeight: 1.5 }}>
                  {issue.description}
                </p>
              </div>

              <button
                onClick={() => setIssues((prev) => prev.filter((i) => i.id !== issue.id))}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  color: "var(--text-muted)",
                  padding: "0.3rem 0.6rem",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  whiteSpace: "nowrap",
                }}
              >
                Dispensar
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
