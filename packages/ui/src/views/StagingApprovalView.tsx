import React, { useState } from "react";
import { CheckCircle2, XCircle, FileDiff, Sparkles, ShieldCheck } from "lucide-react";

interface StagedProposal {
  id: string;
  filename: string;
  source: string;
  rationale: string;
  targetCategory: string;
  previewDiff: string;
}

export const StagingApprovalView: React.FC = () => {
  const [proposals, setProposals] = useState<StagedProposal[]>([
    {
      id: "prop_01",
      filename: "proposed_valdor_sword.md",
      source: "Google Antigravity (MCP propose_lore)",
      targetCategory: "items",
      rationale:
        "Criado para dar sustentação causal à quebra da barreira no Capítulo 2: Vance precisa de uma lâmina rúnica capaz de cortar selos espirituais.",
      previewDiff: `---
id: "item_valdor_blade"
type: "item"
subtype: "runic_weapon"
name: "Lâmina de Valdor"
aliases: ["O Cortador de Névoa"]
status: "provisional"
tags: ["arma", "antiguidade"]
relationships:
  - target: "char_vance"
    relation: "portador"
    since_scene: "scene_02"
    sentiment: 0.5
epistemic:
  secrets_kept: ["Forjada com cinzas do Primeiro Conselho"]
  known_by: ["char_morrigan", "char_vance"]
---
Uma espada curta forjada com aço temperado em sangue de espectro.
`,
    },
  ]);

  const [, setApprovedList] = useState<string[]>([]);

  const handleApprove = (id: string) => {
    setApprovedList((prev) => [...prev, id]);
    setProposals((prev) => prev.filter((p) => p.id !== id));
  };

  const handleReject = (id: string) => {
    setProposals((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "100%", overflowY: "auto" }}>
      <div
        style={{
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          padding: "1.2rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.4rem" }}>
          <ShieldCheck color="#10b981" size={20} />
          <h2 style={{ fontSize: "1.1rem" }}>Staging Gatekeeper (Proteção do Cânone Oficial)</h2>
        </div>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
          Qualquer proposta criada por agentes de IA (via MCP ou Google AI Studio) é salva em <code>./workspace/staging/</code>.
          O cânone oficial em <code>./workspace/lore/</code> nunca é contaminado automaticamente sem o seu aval explícito aqui.
        </p>
      </div>

      {proposals.length === 0 ? (
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--bg-secondary)",
            border: "1px dashed var(--border)",
            borderRadius: "8px",
            color: "var(--text-muted)",
            padding: "2rem",
          }}
        >
          <CheckCircle2 size={36} color="#10b981" style={{ marginBottom: "0.8rem" }} />
          <h3 style={{ fontSize: "1.1rem", color: "#fff", marginBottom: "0.3rem" }}>Nenhuma proposta pendente</h3>
          <p style={{ fontSize: "0.85rem" }}>
            Seu cânone está 100% alinhado. Quando a IA gerar sugestões via MCP, elas aparecerão aqui para revisão de diff.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {proposals.map((prop) => (
            <div
              key={prop.id}
              style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "1.2rem",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.8rem" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <Sparkles size={14} color="var(--accent)" />
                    <span style={{ fontSize: "0.75rem", color: "var(--accent)", fontWeight: 700 }}>
                      ORIGEM: {prop.source}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "1.1rem", marginTop: "0.2rem" }}>Proposta: {prop.filename}</h3>
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handleReject(prop.id)}
                    style={{
                      background: "rgba(239, 68, 68, 0.15)",
                      color: "#ef4444",
                      padding: "0.5rem 0.8rem",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                    }}
                  >
                    <XCircle size={14} /> Rejeitar
                  </button>
                  <button
                    onClick={() => handleApprove(prop.id)}
                    style={{
                      background: "#10b981",
                      color: "#fff",
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      fontWeight: 600,
                      fontSize: "0.8rem",
                    }}
                  >
                    <CheckCircle2 size={14} /> Canonizar Proposta
                  </button>
                </div>
              </div>

              {/* Rationale */}
              <div
                style={{
                  background: "var(--bg-card)",
                  padding: "0.8rem",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  color: "#cbd5e1",
                  marginBottom: "1rem",
                  borderLeft: "3px solid var(--accent)",
                }}
              >
                <strong>Justificativa da IA:</strong> {prop.rationale}
              </div>

              {/* Code Preview */}
              <div style={{ position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.3rem" }}>
                  <FileDiff size={12} /> Visualização do Markdown & Frontmatter
                </div>
                <pre
                  style={{
                    background: "#070a10",
                    border: "1px solid var(--border)",
                    borderRadius: "6px",
                    padding: "0.8rem",
                    fontSize: "0.8rem",
                    fontFamily: "monospace",
                    color: "#94a3b8",
                    overflowX: "auto",
                  }}
                >
                  {prop.previewDiff}
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
