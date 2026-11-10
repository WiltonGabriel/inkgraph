import React, { useState } from "react";
import type { LoreItem } from "../data/mockData";
import { BookOpen, FileText, Save, Info } from "lucide-react";

interface Props {
  lore: LoreItem[];
}

export const ManuscriptView: React.FC<Props> = ({ lore }) => {
  const [activeScene, setActiveScene] = useState("cena_01_prologue");
  const [content, setContent] = useState(
    `# O Portão Cinzento\n\nA neve caía pesada sobre os ombros de Elias Vance enquanto ele observava os estandartes rasgados da Ordem de Ferro. O exílio não lhe tirara a visão do único olho bom, mas o frio corroía as velhas juntas.\n\nNas sombras das árvores ao leste, um vulto aguardava. Morrigan enviara seu emissário com o selo da Coroa Noturna.`
  );
  const [detectedMentions, setDetectedMentions] = useState<{ entity: LoreItem; match: string }[]>([]);

  // Scan text for Aliases and Names
  React.useEffect(() => {
    const found: { entity: LoreItem; match: string }[] = [];
    const textLower = content.toLowerCase();

    lore.forEach((item) => {
      if (textLower.includes(item.name.toLowerCase())) {
        found.push({ entity: item, match: item.name });
      } else {
        item.aliases.forEach((alias) => {
          if (textLower.includes(alias.toLowerCase())) {
            found.push({ entity: item, match: alias });
          }
        });
      }
    });

    setDetectedMentions(found);
  }, [content, lore]);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 340px", gap: "1rem", height: "100%" }}>
      {/* Manuscript Binder / Scene Tree */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.8rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--accent)", fontSize: "0.85rem", fontWeight: 700 }}>
          <BookOpen size={16} /> Fichário
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", marginTop: "0.4rem" }}>
            Ato I
          </div>
          <button
            onClick={() => setActiveScene("cena_01_prologue")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.6rem",
              borderRadius: "4px",
              background: activeScene === "cena_01_prologue" ? "var(--bg-card)" : "transparent",
              color: activeScene === "cena_01_prologue" ? "var(--text-main)" : "var(--text-muted)",
              border: activeScene === "cena_01_prologue" ? "1px solid var(--border)" : "1px solid transparent",
              fontSize: "0.8rem",
              textAlign: "left",
            }}
          >
            <FileText size={14} /> 1. O Portão Cinzento
          </button>
          <button
            onClick={() => setActiveScene("cena_02_embassy")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.6rem",
              borderRadius: "4px",
              background: activeScene === "cena_02_embassy" ? "var(--bg-card)" : "transparent",
              color: activeScene === "cena_02_embassy" ? "var(--text-main)" : "var(--text-muted)",
              border: activeScene === "cena_02_embassy" ? "1px solid var(--border)" : "1px solid transparent",
              fontSize: "0.8rem",
              textAlign: "left",
            }}
          >
            <FileText size={14} /> 2. Embaixada da Meia-Noite
          </button>
        </div>
      </div>

      {/* Editor */}
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
        <div
          style={{
            padding: "0.8rem 1.2rem",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-card)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Cena 1 • O Portão Cinzento</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#10b981" }}>
            <Save size={14} /> Salvo localmente
          </div>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          style={{
            flex: 1,
            padding: "1.5rem",
            outline: "none",
            border: "none",
            resize: "none",
            fontSize: "1rem",
            lineHeight: 1.7,
            fontFamily: "Charter, Georgia, serif",
            color: "#e2e8f0",
            background: "#0a0d14",
          }}
        />
      </div>

      {/* Live Mentions & Aliases */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          overflowY: "auto",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--accent)", fontSize: "0.85rem", fontWeight: 700 }}>
            <Info size={16} /> Entidades no Texto
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            Aliases e referências identificadas
          </span>
        </div>

        {detectedMentions.length === 0 ? (
          <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", textAlign: "center", padding: "1.5rem 0" }}>
            Nenhuma entidade citada neste trecho.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
            {detectedMentions.map((mention, idx) => (
              <div
                key={idx}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  padding: "0.8rem",
                  borderLeft: "3px solid var(--accent)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{mention.entity.name}</span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    "{mention.match}"
                  </span>
                </div>

                <p style={{ fontSize: "0.8rem", color: "#94a3b8", marginTop: "0.4rem", lineHeight: 1.4 }}>
                  {mention.entity.summary}
                </p>

                {mention.entity.secrets.length > 0 && (
                  <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#f87171" }}>
                    <strong>Segredo:</strong> {mention.entity.secrets[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
