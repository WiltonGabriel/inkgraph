import React, { useState } from "react";
import { PhysicsForceGraphView } from "./views/PhysicsForceGraphView";
import { CharacterStudioView } from "./views/CharacterStudioView";
import { WorldbuildingStudioView } from "./views/WorldbuildingStudioView";
import { ObjectsStudioView } from "./views/ObjectsStudioView";
import { PlotBoardView } from "./views/PlotBoardView";
import { ManuscriptView } from "./views/ManuscriptView";
import { CharacterInterviewsView } from "./views/CharacterInterviewsView";
import { ConsistencyCheckerView } from "./views/ConsistencyCheckerView";
import { StagingApprovalView } from "./views/StagingApprovalView";
import { INITIAL_LORE, INITIAL_TIMELINE, type LoreItem } from "./data/mockData";
import { Network, Users, Globe, Package, Activity, Edit3, MessageSquare, ShieldCheck, Feather } from "lucide-react";

type Tab =
  | "graph"
  | "characters"
  | "world"
  | "objects"
  | "plotboard"
  | "manuscript"
  | "interviews"
  | "consistency"
  | "staging";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("graph");
  const [lore] = useState<LoreItem[]>(INITIAL_LORE);
  const [timeline] = useState(INITIAL_TIMELINE);
  const [selectedEntity, setSelectedEntity] = useState<LoreItem | null>(lore[0] || null);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "var(--bg-primary)" }}>
      {/* Top Application Bar */}
      <header
        style={{
          height: "54px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.2rem",
          background: "var(--bg-secondary)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              borderRadius: "6px",
              padding: "0.35rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather size={16} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: "0.95rem", fontWeight: 700, letterSpacing: "-0.02em" }}>InkGraph</h1>
          </div>
        </div>

        {/* Clean, Silent, Functional Tabs */}
        <nav style={{ display: "flex", gap: "0.3rem" }}>
          <button
            onClick={() => setActiveTab("graph")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.35rem 0.65rem",
              borderRadius: "5px",
              fontSize: "0.78rem",
              fontWeight: 500,
              background: activeTab === "graph" ? "var(--bg-card)" : "transparent",
              color: activeTab === "graph" ? "var(--text-main)" : "var(--text-muted)",
              border: activeTab === "graph" ? "1px solid var(--border)" : "1px solid transparent",
            }}
          >
            <Network size={13} /> Grafo
          </button>

          <button
            onClick={() => setActiveTab("characters")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.35rem 0.65rem",
              borderRadius: "5px",
              fontSize: "0.78rem",
              fontWeight: 500,
              background: activeTab === "characters" ? "var(--bg-card)" : "transparent",
              color: activeTab === "characters" ? "var(--text-main)" : "var(--text-muted)",
              border: activeTab === "characters" ? "1px solid var(--border)" : "1px solid transparent",
            }}
          >
            <Users size={13} /> Personagens
          </button>

          <button
            onClick={() => setActiveTab("world")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.35rem 0.65rem",
              borderRadius: "5px",
              fontSize: "0.78rem",
              fontWeight: 500,
              background: activeTab === "world" ? "var(--bg-card)" : "transparent",
              color: activeTab === "world" ? "var(--text-main)" : "var(--text-muted)",
              border: activeTab === "world" ? "1px solid var(--border)" : "1px solid transparent",
            }}
          >
            <Globe size={13} /> Mundo & Facções
          </button>

          <button
            onClick={() => setActiveTab("objects")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.35rem 0.65rem",
              borderRadius: "5px",
              fontSize: "0.78rem",
              fontWeight: 500,
              background: activeTab === "objects" ? "var(--bg-card)" : "transparent",
              color: activeTab === "objects" ? "var(--text-main)" : "var(--text-muted)",
              border: activeTab === "objects" ? "1px solid var(--border)" : "1px solid transparent",
            }}
          >
            <Package size={13} /> Objetos
          </button>

          <button
            onClick={() => setActiveTab("plotboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.35rem 0.65rem",
              borderRadius: "5px",
              fontSize: "0.78rem",
              fontWeight: 500,
              background: activeTab === "plotboard" ? "var(--bg-card)" : "transparent",
              color: activeTab === "plotboard" ? "var(--text-main)" : "var(--text-muted)",
              border: activeTab === "plotboard" ? "1px solid var(--border)" : "1px solid transparent",
            }}
          >
            <Activity size={13} /> Roteiro & Tensão
          </button>

          <button
            onClick={() => setActiveTab("manuscript")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.35rem 0.65rem",
              borderRadius: "5px",
              fontSize: "0.78rem",
              fontWeight: 500,
              background: activeTab === "manuscript" ? "var(--bg-card)" : "transparent",
              color: activeTab === "manuscript" ? "var(--text-main)" : "var(--text-muted)",
              border: activeTab === "manuscript" ? "1px solid var(--border)" : "1px solid transparent",
            }}
          >
            <Edit3 size={13} /> Manuscrito
          </button>

          <button
            onClick={() => setActiveTab("interviews")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.35rem 0.65rem",
              borderRadius: "5px",
              fontSize: "0.78rem",
              fontWeight: 500,
              background: activeTab === "interviews" ? "var(--bg-card)" : "transparent",
              color: activeTab === "interviews" ? "var(--text-main)" : "var(--text-muted)",
              border: activeTab === "interviews" ? "1px solid var(--border)" : "1px solid transparent",
            }}
          >
            <MessageSquare size={13} /> Entrevistas
          </button>

          <button
            onClick={() => setActiveTab("consistency")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.35rem 0.65rem",
              borderRadius: "5px",
              fontSize: "0.78rem",
              fontWeight: 500,
              background: activeTab === "consistency" ? "var(--bg-card)" : "transparent",
              color: activeTab === "consistency" ? "var(--text-main)" : "var(--text-muted)",
              border: activeTab === "consistency" ? "1px solid var(--border)" : "1px solid transparent",
            }}
          >
            <ShieldCheck size={13} /> Auditoria
          </button>

          <button
            onClick={() => setActiveTab("staging")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0.35rem 0.65rem",
              borderRadius: "5px",
              fontSize: "0.78rem",
              fontWeight: 500,
              background: activeTab === "staging" ? "var(--bg-card)" : "transparent",
              color: activeTab === "staging" ? "var(--text-main)" : "var(--text-muted)",
              border: activeTab === "staging" ? "1px solid var(--border)" : "1px solid transparent",
            }}
          >
            Staging
          </button>
        </nav>

        {/* Quiet Connection Indicator */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.7rem",
              color: "#10b981",
              background: "rgba(16, 185, 129, 0.1)",
              padding: "0.2rem 0.5rem",
              borderRadius: "4px",
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />
            MCP Ativo
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <main style={{ flex: 1, padding: "1rem", overflow: "hidden" }}>
        {activeTab === "graph" && (
          <PhysicsForceGraphView
            lore={lore}
            selectedEntity={selectedEntity}
            onSelectEntity={setSelectedEntity}
          />
        )}
        {activeTab === "characters" && <CharacterStudioView lore={lore} />}
        {activeTab === "world" && <WorldbuildingStudioView lore={lore} />}
        {activeTab === "objects" && <ObjectsStudioView lore={lore} />}
        {activeTab === "plotboard" && <PlotBoardView timeline={timeline} />}
        {activeTab === "manuscript" && <ManuscriptView lore={lore} />}
        {activeTab === "interviews" && <CharacterInterviewsView lore={lore} />}
        {activeTab === "consistency" && <ConsistencyCheckerView lore={lore} timeline={timeline} />}
        {activeTab === "staging" && <StagingApprovalView />}
      </main>
    </div>
  );
};
