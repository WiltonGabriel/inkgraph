import { useState } from "react";
import { Plus, Search } from "lucide-react";
import type { LoreItem } from "../data/mockData";

interface StoryObject {
  id: string;
  name: string;
  type: "prop" | "weapon" | "vehicle" | "artifact" | "document" | "place-item" | "other";
  significance: string;
  holder: string;
  firstSeenScene: string;
  notes: string;
}

interface Props {
  lore: LoreItem[];
}

export const ObjectsStudioView: React.FC<Props> = () => {
  const [objects] = useState<StoryObject[]>([
    {
      id: "obj_obsidian",
      name: "Obsidiana da Alma",
      type: "artifact",
      significance: "Artefato pré-cataclisma capaz de gravar padrões de memória e traços de personalidade.",
      holder: "Rainha Morrigan",
      firstSeenScene: "Cena 2 • A Embaixada da Meia-Noite",
      notes: "Cobiçada pelo Alto Marechal da Ordem de Ferro.",
    },
    {
      id: "obj_iron_seal",
      name: "Selo do Portão Cinzento",
      type: "document",
      significance: "Cilindro de ferro com ordens assinadas pelo Grão-Mestre autorizando a evacuação militar.",
      holder: "Elias Vance",
      firstSeenScene: "Cena 1 • O Voo do Corvo",
      notes: "A prova cabal de que a legião de Vance foi sacrificada propositalmente.",
    },
  ]);

  const [selectedId, setSelectedId] = useState<string>(objects[0]?.id || "");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const selectedObj = objects.find((o) => o.id === selectedId) || objects[0];

  const filtered = objects.filter((o) => {
    const matchesType = typeFilter === "all" || o.type === typeFilter;
    const matchesSearch =
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.significance.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1rem", height: "100%" }}>
      {/* List */}
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
        <div style={{ padding: "0.8rem", borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>Objetos & Artefatos</span>
            <button
              style={{
                background: "var(--accent)",
                color: "#fff",
                padding: "0.25rem 0.5rem",
                borderRadius: "4px",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.2rem",
              }}
            >
              <Plus size={13} /> Criar
            </button>
          </div>

          <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{
                width: "100%",
                padding: "0.3rem",
                borderRadius: "4px",
                background: "var(--bg-primary)",
                border: "1px solid var(--border)",
                fontSize: "0.75rem",
              }}
            >
              <option value="all">Todos os Tipos</option>
              <option value="artifact">Artefatos</option>
              <option value="weapon">Armas</option>
              <option value="document">Documentos</option>
              <option value="prop">Itens Comuns</option>
            </select>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "var(--bg-primary)",
              padding: "0.3rem 0.6rem",
              borderRadius: "4px",
              border: "1px solid var(--border)",
            }}
          >
            <Search size={13} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Buscar objetos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", outline: "none", border: "none", fontSize: "0.75rem" }}
            />
          </div>
        </div>

        <div style={{ padding: "0.5rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {filtered.map((obj) => {
            const isSelected = obj.id === selectedId;
            return (
              <div
                key={obj.id}
                onClick={() => setSelectedId(obj.id)}
                style={{
                  padding: "0.6rem 0.8rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: isSelected ? "var(--bg-card)" : "transparent",
                  border: isSelected ? "1px solid var(--accent)" : "1px solid transparent",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600, color: isSelected ? "#fff" : "#cbd5e1" }}>
                    {obj.name}
                  </span>
                  <span style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "var(--text-muted)" }}>
                    {obj.type}
                  </span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  Portador: {obj.holder}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail */}
      {selectedObj ? (
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
          <div style={{ padding: "1.2rem", borderBottom: "1px solid var(--border)", background: "var(--bg-card)" }}>
            <span style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--accent)", fontWeight: 700 }}>
              {selectedObj.type}
            </span>
            <h2 style={{ fontSize: "1.3rem", marginTop: "0.2rem" }}>{selectedObj.name}</h2>
            <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
              Portado atualmente por: <strong>{selectedObj.holder}</strong>
            </div>
          </div>

          <div style={{ padding: "1.2rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            <div>
              <h4 style={{ fontSize: "0.75rem", textTransform: "uppercase", color: "var(--text-muted)", marginBottom: "0.4rem" }}>
                Significado Narrativo & Poder
              </h4>
              <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "#cbd5e1" }}>{selectedObj.significance}</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)" }}>Primeira Aparição</span>
                <p style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "0.3rem" }}>{selectedObj.firstSeenScene}</p>
              </div>

              <div style={{ background: "var(--bg-card)", padding: "1rem", borderRadius: "6px", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--accent)" }}>Notas & Desdobramentos</span>
                <p style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "0.3rem" }}>{selectedObj.notes}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
