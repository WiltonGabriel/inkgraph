import { Settings, ArrowLeft, Globe, Layers } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

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
        padding: '14px 28px',
        backgroundColor: '#0c0f16',
        borderBottom: '1px solid #1e2330',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      {/* Left: Quiet Brand & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 6,
            backgroundColor: '#171c28',
            border: '1px solid #2b3346',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#60a5fa',
          }}
        >
          <Layers size={14} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#f3f4f6',
            }}
          >
            INKGRAPH
          </span>
          <span style={{ color: '#4b5563', fontSize: 13 }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#9ca3af' }}>
            {t.home.title}
          </span>
        </div>
      </div>

      {/* Right: Language Pill, Program Settings Toggle, Return to Active Workspace */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Language Switcher Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            backgroundColor: '#131722',
            border: '1px solid #242b3b',
            borderRadius: 6,
            padding: 2,
            gap: 2,
          }}
          title="Idioma / Language"
        >
          <Globe
            size={12}
            style={{ color: '#6b7280', marginLeft: 6, marginRight: 2 }}
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
                settings.language === 'pt-BR' ? '#2563eb' : 'transparent',
              color: settings.language === 'pt-BR' ? '#ffffff' : '#9ca3af',
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
                settings.language === 'en' ? '#2563eb' : 'transparent',
              color: settings.language === 'en' ? '#ffffff' : '#9ca3af',
            }}
          >
            EN
          </button>
        </div>

        {/* Program Settings Toggle */}
        <button
          type="button"
          onClick={() =>
            onToggleMode(activeMode === 'settings' ? 'catalog' : 'settings')
          }
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor:
              activeMode === 'settings' ? '#2563eb' : '#151924',
            color: activeMode === 'settings' ? '#ffffff' : '#d1d5db',
            border:
              activeMode === 'settings'
                ? '1px solid #3b82f6'
                : '1px solid #262d3d',
          }}
        >
          <Settings size={14} />
          {t.common.programSettings}
        </button>

        {/* Return to Active Workspace */}
        <button
          type="button"
          onClick={() => setShowPortal(false)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 500,
            cursor: 'pointer',
            backgroundColor: '#131722',
            color: '#9ca3af',
            border: '1px solid #242b3b',
          }}
        >
          <ArrowLeft size={14} />
          {t.common.backToWorkspace}
        </button>
      </div>
    </header>
  );
}
