import { Settings, ArrowLeft, Globe, Layers, FolderKanban } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { BreadcrumbBar } from '../shell/BreadcrumbBar';
import { SaveVerifyButton } from '../shell/SaveVerifyButton';

interface MySpaceTopBarProps {
  activeMode: 'catalog' | 'settings';
  onToggleMode: (mode: 'catalog' | 'settings') => void;
}

export function MySpaceTopBar({ activeMode, onToggleMode }: MySpaceTopBarProps) {
  const { settings, updateSettings, setShowPortal, t } = useProject();

  const handleSetLanguage = (lang: 'pt-BR' | 'en') => {
    updateSettings((prev) => ({ ...prev, language: lang }));
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 24px',
        backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
        borderBottom: '1px solid var(--border-subtle, var(--border, #263046))',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      {/* Left: Quiet Brand & Breadcrumb */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flex: '1 1 280px',
          minWidth: 0,
        }}
      >
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 'var(--radius-sm, 6px)',
            backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
            border: '1px solid var(--border-subtle, var(--border, #263046))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary, #3b82f6)',
            flexShrink: 0,
          }}
        >
          <Layers size={14} />
        </div>
        <BreadcrumbBar
          modeLabel={activeMode === 'settings' ? t.views.settings : undefined}
          onHomeSegmentClick={() => onToggleMode('catalog')}
        />
      </div>

      {/* Right: Portal Mode Pills, Language Switcher, Save & Verify, Return */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexWrap: 'wrap',
          flexShrink: 0,
        }}
      >
        {/* Meu Espaço | Configurações Mode Switcher */}
        <div
          role="tablist"
          aria-label={t.home.title}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
            border: '1px solid var(--border-subtle, var(--border, #263046))',
            borderRadius: 'var(--radius-sm, 6px)',
            padding: 2,
            gap: 2,
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'catalog'}
            onClick={() => onToggleMode('catalog')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 600,
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              backgroundColor:
                activeMode === 'catalog'
                  ? 'var(--accent-primary, #3b82f6)'
                  : 'transparent',
              color:
                activeMode === 'catalog'
                  ? '#ffffff'
                  : 'var(--text-secondary, #94a3b8)',
            }}
          >
            <FolderKanban size={13} />
            {t.home.title}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeMode === 'settings'}
            onClick={() => onToggleMode('settings')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              fontSize: 11.5,
              fontWeight: 600,
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              backgroundColor:
                activeMode === 'settings'
                  ? 'var(--accent-primary, #3b82f6)'
                  : 'transparent',
              color:
                activeMode === 'settings'
                  ? '#ffffff'
                  : 'var(--text-secondary, #94a3b8)',
            }}
          >
            <Settings size={13} />
            {t.views.settings}
          </button>
        </div>

        {/* Language Switcher Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
            border: '1px solid var(--border-subtle, var(--border, #263046))',
            borderRadius: 'var(--radius-sm, 6px)',
            padding: 2,
            gap: 2,
          }}
          title="Idioma / Language"
        >
          <Globe
            size={12}
            style={{
              color: 'var(--text-muted, #64748b)',
              marginLeft: 6,
              marginRight: 2,
            }}
          />
          <button
            type="button"
            onClick={() => handleSetLanguage('pt-BR')}
            style={{
              padding: '4px 8px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              backgroundColor:
                settings.language === 'pt-BR'
                  ? 'var(--accent-primary, #3b82f6)'
                  : 'transparent',
              color:
                settings.language === 'pt-BR'
                  ? '#ffffff'
                  : 'var(--text-secondary, #94a3b8)',
            }}
          >
            PT-BR
          </button>
          <button
            type="button"
            onClick={() => handleSetLanguage('en')}
            style={{
              padding: '4px 8px',
              fontSize: 11,
              fontWeight: 600,
              borderRadius: 4,
              border: 'none',
              cursor: 'pointer',
              backgroundColor:
                settings.language === 'en'
                  ? 'var(--accent-primary, #3b82f6)'
                  : 'transparent',
              color:
                settings.language === 'en'
                  ? '#ffffff'
                  : 'var(--text-secondary, #94a3b8)',
            }}
          >
            EN
          </button>
        </div>

        <SaveVerifyButton />

        {/* Return to Active Workspace */}
        <button
          type="button"
          onClick={() => setShowPortal(false)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm, 6px)',
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
            color: 'var(--text-secondary, #94a3b8)',
            border: '1px solid var(--border-subtle, var(--border, #263046))',
          }}
        >
          <ArrowLeft size={14} />
          {t.common.backToWorkspace}
        </button>
      </div>
    </header>
  );
}
