import { Keyboard, RotateCcw } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { DEFAULT_SETTINGS } from '../../data/defaultSettings';
import type { KeyboardShortcutMap } from '../../types/project';

const SHORTCUT_ITEMS: {
  key: keyof KeyboardShortcutMap;
  labelPt: string;
  labelEn: string;
  descPt: string;
  descEn: string;
}[] = [
  {
    key: 'commandPalette',
    labelPt: 'Paleta de Comandos Global',
    labelEn: 'Global Command Palette',
    descPt: 'Busca rápida de cenas, entidades de lore e ações.',
    descEn: 'Quick search across scenes, lore entities, and actions.',
  },
  {
    key: 'openHome',
    labelPt: 'Abrir Meu Espaço (Catálogo)',
    labelEn: 'Open My Space (Catalog)',
    descPt: 'Alterna para a tela inicial de seleção de workspaces.',
    descEn: 'Switches to the home workspace catalog screen.',
  },
  {
    key: 'openSettings',
    labelPt: 'Configurações do Programa',
    labelEn: 'Program Settings',
    descPt: 'Abre esta visão de preferências globais.',
    descEn: 'Opens this global preferences view.',
  },
  {
    key: 'toggleCopilot',
    labelPt: 'Alternar Painel Copiloto',
    labelEn: 'Toggle Copilot Panel',
    descPt: 'Exibe ou recolhe o assistente contextual lateral.',
    descEn: 'Shows or hides the lateral contextual assistant.',
  },
  {
    key: 'toggleZenMode',
    labelPt: 'Alternar Modo Zen',
    labelEn: 'Toggle Zen Mode',
    descPt: 'Oculta barras para foco total no texto literário.',
    descEn: 'Hides sidebars for distraction-free literary writing.',
  },
  {
    key: 'quickSnapshot',
    labelPt: 'Criar Snapshot Rápido',
    labelEn: 'Create Quick Snapshot',
    descPt: 'Salva imediatamente um ponto de restauração do manuscrito.',
    descEn: 'Immediately saves a manuscript restore point.',
  },
  {
    key: 'focusManuscript',
    labelPt: 'Ir para o Manuscrito',
    labelEn: 'Focus Manuscript',
    descPt: 'Navega diretamente para a árvore de capítulos e cenas.',
    descEn: 'Jumps directly to the chapters and scenes tree.',
  },
  {
    key: 'focusGraph',
    labelPt: 'Ir para o Grafo de Relações',
    labelEn: 'Focus Relationship Graph',
    descPt: 'Abre o grafo topológico de personagens e facções.',
    descEn: 'Opens the character and faction relationship graph.',
  },
];

export function ShortcutsSettingsTab() {
  const { settings, updateSettings } = useProject();
  const isEn = settings.language === 'en';

  const updateShortcut = (key: keyof KeyboardShortcutMap, value: string) => {
    updateSettings((prev) => ({
      ...prev,
      shortcuts: {
        ...prev.shortcuts,
        [key]: value,
      },
    }));
  };

  const resetShortcuts = () => {
    updateSettings((prev) => ({
      ...prev,
      shortcuts: { ...DEFAULT_SETTINGS.shortcuts },
    }));
  };

  return (
    <div
      style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        padding: '1.15rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.88rem' }}>
          <Keyboard size={16} color="var(--accent)" />
          <span>{isEn ? 'Keyboard Shortcuts (Niri / Wayland Friendly)' : 'Atalhos de Teclado (Compatível com Niri / Wayland)'}</span>
        </div>

        <button
          onClick={resetShortcuts}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '0.38rem 0.75rem',
            fontSize: '0.76rem',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <RotateCcw size={13} />
          {isEn ? 'Reset Shortcuts' : 'Restaurar Atalhos'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {SHORTCUT_ITEMS.map((item) => (
          <div
            key={item.key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0.65rem 0.85rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {isEn ? item.labelEn : item.labelPt}
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                {isEn ? item.descEn : item.descPt}
              </div>
            </div>

            <input
              value={settings.shortcuts[item.key]}
              onChange={(e) => updateShortcut(item.key, e.target.value)}
              aria-label={isEn ? item.labelEn : item.labelPt}
              style={{
                width: 135,
                textAlign: 'center',
                fontFamily: 'monospace',
                fontSize: '0.78rem',
                fontWeight: 600,
                padding: '0.35rem 0.5rem',
                borderRadius: '5px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                color: 'var(--accent)',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
