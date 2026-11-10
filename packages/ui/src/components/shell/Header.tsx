import {
  Search,
  Sparkles,
  GitBranch,
  FolderOpen,
  CheckCircle2,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export function Header() {
  const {
    project,
    updateProject,
    totalWordCount,
    setShowPortal,
    setShowCommandPalette,
    showCopilot,
    setShowCopilot,
    setActiveView,
  } = useProject();

  const activeBranch =
    project.branches.find((b) => b.id === project.activeBranchId)?.name ?? 'Principal';
  const pendingCount = project.stagingProposals.filter(
    (p) => p.status === 'pending'
  ).length;

  return (
    <header
      style={{
        height: 46,
        backgroundColor: '#0c0e14',
        borderBottom: '1px solid #1b202c',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}
    >
      {/* Left: Project Title & Branch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={() => setShowPortal(true)}
          title="Abrir Portal de Projetos"
          style={{
            background: '#141822',
            border: '1px solid #252b3b',
            color: '#9ca3af',
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 11.5,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <FolderOpen size={13} /> Projetos
        </button>

        <input
          value={project.title}
          onChange={(e) =>
            updateProject((prev) => ({ ...prev, title: e.target.value }))
          }
          aria-label="Título do projeto"
          style={{
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: 4,
            color: '#f3f4f6',
            fontWeight: 600,
            fontSize: 13.5,
            padding: '3px 6px',
            width: 220,
          }}
        />

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 11,
            color: '#10b981',
          }}
          title="Todas as alterações salvas localmente"
        >
          <CheckCircle2 size={12} /> Salvo
        </span>
      </div>

      {/* Center: Command Palette Trigger (Ctrl+K) */}
      <button
        onClick={() => setShowCommandPalette(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: 320,
          padding: '5px 10px',
          backgroundColor: '#131722',
          border: '1px solid #242a38',
          borderRadius: 6,
          color: '#9ca3af',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Search size={13} /> Pesquisar comandos, cenas ou lore...
        </span>
        <kbd
          style={{
            fontSize: 10,
            padding: '1px 5px',
            backgroundColor: '#1d2331',
            border: '1px solid #2e3646',
            borderRadius: 4,
            color: '#d1d5db',
          }}
        >
          Ctrl+K
        </kbd>
      </button>

      {/* Right: Metrics, Version Control & Copilot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            fontSize: 11.5,
            color: '#9ca3af',
            padding: '3px 8px',
            backgroundColor: '#131722',
            borderRadius: 5,
            border: '1px solid #1f2430',
          }}
        >
          <strong style={{ color: '#e5e7eb' }}>
            {totalWordCount.toLocaleString('pt-BR')}
          </strong>{' '}
          / {project.wordCountGoal.toLocaleString('pt-BR')} palavras
        </div>

        <button
          onClick={() => setActiveView('versions')}
          title="Controle de Versão, Ramificações e Staging"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 9px',
            backgroundColor: '#131722',
            border: '1px solid #242a38',
            borderRadius: 6,
            color: '#d1d5db',
            fontSize: 11.5,
            cursor: 'pointer',
          }}
        >
          <GitBranch size={13} color="#60a5fa" />
          <span>{activeBranch}</span>
          {pendingCount > 0 && (
            <span
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.2)',
                color: '#fbbf24',
                padding: '0 5px',
                borderRadius: 999,
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setShowCopilot(!showCopilot)}
          title="Alternar Copiloto / Assistente Lateral"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 11px',
            backgroundColor: showCopilot ? '#2563eb' : '#171f30',
            border: '1px solid #2563eb',
            borderRadius: 6,
            color: '#ffffff',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Sparkles size={13} /> Copiloto
        </button>
      </div>
    </header>
  );
}
