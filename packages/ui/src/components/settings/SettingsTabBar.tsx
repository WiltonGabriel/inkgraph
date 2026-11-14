import {
  Cpu,
  HardDrive,
  Info,
  Keyboard,
  Palette,
  Settings,
  Sliders,
  Type,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useSettings } from '../../context/SettingsContext';
import { THEME_VAR, sectionCardStyle } from './settingsStyles';

export type SettingsTabId =
  | 'general'
  | 'appearance'
  | 'editor'
  | 'ai'
  | 'shortcuts'
  | 'storage'
  | 'about';

export const VALID_SETTINGS_TABS = new Set<SettingsTabId>([
  'general',
  'appearance',
  'editor',
  'ai',
  'shortcuts',
  'storage',
  'about',
]);

interface SettingsTabBarProps {
  activeTab: SettingsTabId;
  onSelectTab: (tabId: SettingsTabId) => void;
}

export function SettingsTabBar({ activeTab, onSelectTab }: SettingsTabBarProps) {
  const { t } = useProject();
  const { draftSettings } = useSettings();

  const tabs: { id: SettingsTabId; label: string; icon: typeof Sliders }[] = [
    { id: 'general', label: t.settings.tabs.general, icon: Sliders },
    { id: 'appearance', label: t.settings.tabs.appearance, icon: Palette },
    { id: 'editor', label: t.settings.tabs.editor, icon: Type },
    { id: 'ai', label: t.settings.tabs.ai, icon: Cpu },
    { id: 'shortcuts', label: t.settings.tabs.shortcuts, icon: Keyboard },
    { id: 'storage', label: t.settings.tabs.storage, icon: HardDrive },
    { id: 'about', label: t.settings.tabs.about, icon: Info },
  ];

  return (
    <>
      <header
        style={{
          ...sectionCardStyle,
          padding: '1rem 1.25rem',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '0.65rem',
        }}
      >
        <Settings size={20} color={draftSettings.accentColor || THEME_VAR.accentPrimary} />
        <div>
          <h1
            style={{
              fontSize: '1.05rem',
              fontWeight: 700,
              margin: 0,
              color: THEME_VAR.textPrimary,
            }}
          >
            {t.settings.title}
          </h1>
          <p style={{ fontSize: '0.78rem', color: THEME_VAR.textMuted, margin: 0 }}>
            {t.settings.subtitle}
          </p>
        </div>
      </header>

      <nav aria-label={t.settings.title} style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onSelectTab(tab.id)}
              style={{
                padding: '0.48rem 0.85rem',
                borderRadius: THEME_VAR.radiusSm,
                fontSize: '0.8rem',
                fontWeight: 600,
                border: isActive
                  ? '1px solid transparent'
                  : `1px solid ${THEME_VAR.borderSubtle}`,
                background: isActive ? THEME_VAR.accentPrimary : THEME_VAR.bgSurface,
                color: isActive ? '#ffffff' : THEME_VAR.textSecondary,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                cursor: 'pointer',
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </>
  );
}
