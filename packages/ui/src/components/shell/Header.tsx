import {
  Search,
  Sparkles,
  GitBranch,
  LayoutGrid,
  CheckCircle2,
  Settings,
  PlusCircle,
  Menu,
} from 'lucide-react';
import { isAiGenerativeEnabled } from '@inkgraph/domain';
import { useProject } from '../../context/ProjectContext';
import { useViewport } from '../../hooks/useViewport';

export function Header() {
  const {
    project,
    workspaces,
    switchWorkspace,
    updateProject,
    totalWordCount,
    setShowPortal,
    setShowCommandPalette,
    setShowQuickCapture,
    setShowMobileSidebar,
    showCopilot,
    setShowCopilot,
    setActiveView,
    settings,
    t,
  } = useProject();
  const { isMobile, isDesktop } = useViewport();
  const aiActive = isAiGenerativeEnabled(settings.aiMode);

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
        padding: isMobile ? '0 10px' : '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        flexShrink: 0,
      }}
    >
      {/* Left: Mobile Drawer, My Space Button, Workspace Switcher & Editable Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: isMobile ? 1 : undefined }}>
        {isMobile && (
          <button
            onClick={() => setShowMobileSidebar(true)}
            aria-label={t.common.menu}
            style={{
              background: '#141822',
              border: '1px solid #252b3b',
              color: '#e5e7eb',
              borderRadius: 6,
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Menu size={15} />
          </button>
        )}

        <button
          onClick={() => setShowPortal(true)}
          title={t.common.mySpace}
          style={{
            background: '#141822',
            border: '1px solid #252b3b',
            color: '#e5e7eb',
            borderRadius: 6,
            padding: '5px 9px',
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            flexShrink: 0,
          }}
        >
          <LayoutGrid size={13} color={settings.accentColor || '#3b82f6'} />
          {!isMobile && t.common.mySpace}
        </button>

        {!isMobile && workspaces.length > 1 && (
          <select
            value={project.id}
            onChange={(e) => switchWorkspace(e.target.value)}
            aria-label={t.common.workspaces}
            style={{
              background: '#131722',
              border: '1px solid #242a38',
              color: '#9ca3af',
              borderRadius: 6,
              padding: '3px 6px',
              fontSize: 11,
              cursor: 'pointer',
              maxWidth: 145,
            }}
          >
            {workspaces
              .filter((w) => !w.isArchived || w.id === project.id)
              .map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))}
          </select>
        )}

        <input
          value={project.title}
          onChange={(e) =>
            updateProject((prev) => ({ ...prev, title: e.target.value }))
          }
          aria-label="Título do workspace"
          style={{
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: 4,
            color: '#f3f4f6',
            fontWeight: 600,
            fontSize: 13,
            padding: '3px 6px',
            width: isMobile ? '100%' : 185,
            minWidth: 0,
          }}
        />

        {isDesktop && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: '#10b981',
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={12} /> {t.common.saved}
          </span>
        )}
      </div>

      {/* Center: Command Palette Trigger */}
      {!isMobile && (
        <button
          onClick={() => setShowCommandPalette(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: isDesktop ? 290 : 210,
            padding: '5px 10px',
            backgroundColor: '#131722',
            border: '1px solid #242a38',
            borderRadius: 6,
            color: '#9ca3af',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            <Search size={13} style={{ flexShrink: 0 }} /> {t.common.searchPlaceholder}
          </span>
          {isDesktop && (
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
              {settings.shortcuts.commandPalette}
            </kbd>
          )}
        </button>
      )}

      {/* Right: Metrics, Quick Capture, Staging, Settings & Copilot */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {isMobile && (
          <button
            onClick={() => setShowCommandPalette(true)}
            title={t.common.searchPlaceholder}
            style={{
              padding: '6px 8px',
              backgroundColor: '#131722',
              border: '1px solid #242a38',
              borderRadius: 6,
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search size={14} />
          </button>
        )}

        {isDesktop && (
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
              {totalWordCount.toLocaleString(settings.language)}
            </strong>{' '}
            / {project.wordCountGoal.toLocaleString(settings.language)} {t.common.words}
          </div>
        )}

        <button
          onClick={() => setShowQuickCapture(true)}
          title={t.quickCapture.modalTitle}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 9px',
            backgroundColor: '#131722',
            border: '1px solid #242a38',
            borderRadius: 6,
            color: '#34d399',
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <PlusCircle size={13} />
          {!isMobile && <span>{t.quickCapture.buttonLabel}</span>}
        </button>

        <button
          onClick={() => setActiveView('versions')}
          title={t.views.versions}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            padding: '5px 8px',
            backgroundColor: '#131722',
            border: '1px solid #242a38',
            borderRadius: 6,
            color: '#d1d5db',
            fontSize: 11.5,
            cursor: 'pointer',
          }}
        >
          <GitBranch size={13} color="#60a5fa" />
          {!isMobile && <span>{activeBranch}</span>}
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

        {!isMobile && (
          <button
            onClick={() => setActiveView('settings')}
            title={t.common.programSettings}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '5px 7px',
              backgroundColor: '#131722',
              border: '1px solid #242a38',
              borderRadius: 6,
              color: '#9ca3af',
              cursor: 'pointer',
            }}
          >
            <Settings size={14} />
          </button>
        )}

        {aiActive && settings.copilotEnabled && (
          <button
            onClick={() => setShowCopilot(!showCopilot)}
            title={t.common.copilot}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              backgroundColor: showCopilot ? settings.accentColor || '#2563eb' : '#171f30',
              border: `1px solid ${settings.accentColor || '#2563eb'}`,
              borderRadius: 6,
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Sparkles size={13} /> {!isMobile && t.common.copilot}
          </button>
        )}
      </div>
    </header>
  );
}
