import React, { useState } from "react";
import type { LoreItem } from "../data/mockData";
import { Network, Search, Filter, ShieldAlert, Sparkles, BookOpen } from "lucide-react";

interface Props {
  lore: LoreItem[];
  onSelectEntity: (item: LoreItem) => void;
  selectedEntity: LoreItem | null;
}

export const GraphVisualizer: React.FC<Props> = ({ lore, onSelectEntity, selectedEntity }) => {
  const [filterType, setFilterType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = lore.filter((item) => {
    const matchesType = filterType === "all" || item.type === filterType;
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.aliases.some((a) => a.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1rem", height: "100%" }}>
      {/* Interactive Graph Canvas / Matrix */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          padding: "1rem",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Controls */}
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--bg-card)",
              padding: "0.4rem 0.8rem",
              borderRadius: "6px",
              border: "1px solid var(--border)",
              flex: 1,
            }}
          >
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar por nome, alias ou tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: "100%", outline: "none", border: "none" }}
            />
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--bg-card)",
              padding: "0.4rem 0.8rem",
              borderRadius: "6px",
              border: "1px solid var(--border)",
            }}
          >
            <Filter size={16} color="var(--text-muted)" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ outline: "none", border: "none" }}
            >
              <option value="all">Todas Categorias</option>
              <option value="character">Personagens</option>
              <option value="faction">Facções</option>
              <option value="location">Locais</option>
              <option value="rule_system">Sistemas & Regras</option>
            </select>
          </div>
        </div>

        {/* Visual Map / Nodes Grid */}
        <div
          style={{
            flex: 1,
            background: "radial-gradient(circle, #1a2233 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            borderRadius: "6px",
            padding: "1.5rem",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1rem",
            overflowY: "auto",
            alignContent: "start",
          }}
        >
          {filtered.map((item) => {
            const isSelected = selectedEntity?.id === item.id;
            const typeColor =
              item.type === "character"
                ? "#3b82f6"
                : item.type === "faction"
                ? "#eab308"
                : item.type === "location"
                ? "#10b981"
                : "#a855f7";

            return (
              <div
                key={item.id}
                onClick={() => onSelectEntity(item)}
                style={{
                  background: isSelected ? "var(--bg-card)" : "#131a29",
                  border: `2px solid ${isSelected ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "8px",
                  padding: "1rem",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 0 16px rgba(99, 102, 241, 0.3)" : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                      color: typeColor,
                    }}
                  >
                    {item.subtype || item.type}
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      background: "rgba(255,255,255,0.06)",
                      padding: "0.1rem 0.4rem",
                      borderRadius: "4px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {item.status}
                  </span>
                </div>

                <h3 style={{ fontSize: "1.1rem", marginBottom: "0.4rem", color: "#fff" }}>{item.name}</h3>

                {item.aliases.length > 0 && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginBottom: "0.6rem" }}>
                    "{item.aliases.join(", ")}"
                  </div>
                )}

                <p style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.4, marginBottom: "0.75rem" }}>
                  {item.summary}
                </p>

                {/* Relationships badge count */}
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginTop: "auto" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      background: "#1e293b",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.3rem",
                    }}
                  >
                    <Network size={12} /> {item.relationships.length} conexões
                  </span>

                  {item.secrets.length > 0 && (
                    <span
                      style={{
                        fontSize: "0.75rem",
                        background: "rgba(239, 68, 68, 0.15)",
                        color: "#f87171",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.3rem",
                      }}
                    >
                      <ShieldAlert size={12} /> {item.secrets.length} segredo
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Side Dossier Inspector */}
      <div
        style={{
          background: "var(--bg-secondary)",
          borderRadius: "8px",
          border: "1px solid var(--border)",
          padding: "1.2rem",
          overflowY: "auto",
        }}
      >
        {selectedEntity ? (
          <div>
            <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "1rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--accent)", textTransform: "uppercase", fontWeight: 700 }}>
                {selectedEntity.type} • {selectedEntity.subtype || "Geral"}
              </div>
              <h2 style={{ fontSize: "1.4rem", marginTop: "0.2rem" }}>{selectedEntity.name}</h2>
              {selectedEntity.aliases.length > 0 && (
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  Aliases: {selectedEntity.aliases.join(", ")}
                </div>
              )}
            </div>

            {/* Relationships Details */}
            <div style={{ marginBottom: "1.2rem" }}>
              <h4 style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>
                RELAÇÕES CANÔNICAS
              </h4>
              {selectedEntity.relationships.length === 0 ? (
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Nenhuma relação mapeada.</div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {selectedEntity.relationships.map((rel, idx) => {
                    const sentimentColor =
                      rel.sentiment < -0.3 ? "#ef4444" : rel.sentiment > 0.3 ? "#10b981" : "#eab308";
                    return (
                      <div
                        key={idx}
                        style={{
                          background: "var(--bg-card)",
                          padding: "0.6rem",
                          borderRadius: "6px",
                          borderLeft: `3px solid ${sentimentColor}`,
                        }}
                      >
                        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{rel.targetName}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          Relação: <strong>{rel.relation}</strong> (Sentimento: {rel.sentiment > 0 ? "+" : ""}
                          {rel.sentiment})
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Epistemic Secrets */}
            <div style={{ marginBottom: "1.2rem" }}>
              <h4 style={{ fontSize: "0.9rem", color: "#f87171", marginBottom: "0.5rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <ShieldAlert size={14} /> SEGREDOS & EPISTEMOLOGIA
              </h4>
              {selectedEntity.secrets.map((sec, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "1px dashed rgba(239, 68, 68, 0.3)",
                    padding: "0.6rem",
                    borderRadius: "6px",
                    fontSize: "0.85rem",
                    marginBottom: "0.4rem",
                    lineHeight: 1.4,
                  }}
                >
                  "{sec}"
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.4rem" }}>
                    Conhecido por: {selectedEntity.knownBy.join(", ")}
                  </div>
                </div>
              ))}
            </div>

            {/* Antigravity / AI Action Box */}
            <div
              style={{
                marginTop: "1.5rem",
                padding: "0.8rem",
                borderRadius: "6px",
                background: "rgba(99, 102, 241, 0.08)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--accent)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.4rem" }}>
                <Sparkles size={14} /> Antigravity / MCP
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                Esta entidade é indexada no SQLite. Ao conversar com a IA no Antigravity, ela pode consultar e atualizar esta ficha via ferramenta MCP <code>get_entity("{selectedEntity.id}")</code>.
              </p>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)", textAlign: "center" }}>
            <BookOpen size={32} style={{ marginBottom: "0.5rem", opacity: 0.5 }} />
            <p style={{ fontSize: "0.9rem" }}>Selecione uma entidade no mapa para inspecionar dossiê e relações.</p>
          </div>
        )}
      </div>
    </div>
  );
};
