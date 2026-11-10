import { useState } from 'react';
import {
  Settings,
  Sliders,
  Palette,
  Type,
  Cpu,
  Keyboard,
  HardDrive,
  RotateCcw,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { GeneralSettingsTab } from '../components/settings/GeneralSettingsTab';
import { AppearanceSettingsTab } from '../components/settings/AppearanceSettingsTab';
import { EditorSettingsTab } from '../components/settings/EditorSettingsTab';
import { AiAndMcpSettingsTab } from '../components/settings/AiAndMcpSettingsTab';
import { ShortcutsSettingsTab } from '../components/settings/ShortcutsSettingsTab';
import { NotificationsAndStorageTab } from '../components/settings/NotificationsAndStorageTab';

type SettingsTabId = 'general' | 'appearance' | 'editor' | 'ai' | 'shortcuts' | 'storage';

export function SettingsView() {
  const { t, resetSettingsToDefault, settings } = useProject();
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general');

  const tabs: { id: SettingsTabId; label: string; icon: typeof Sliders }[] = [
    { id: 'general', label: t.settings.tabs.general, icon: Sliders },
    { id: 'appearance', label: t.settings.tabs.appearance, icon: Palette },
    { id: 'editor', label: t.settings.tabs.editor, icon: Type },
    { id: 'ai', label: t.settings.tabs.ai, icon: Cpu },
    { id: 'shortcuts', label: t.settings.tabs.shortcuts, icon: Keyboard },
    { id: 'storage', label: t.settings.tabs.storage, icon: HardDrive },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
      {/* Cabeçalho */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Settings size={20} color={settings.accentColor || 'var(--accent)'} />
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{t.settings.title}</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
              {t.settings.subtitle}
            </p>
          </div>
        </div>

        <button
          onClick={resetSettingsToDefault}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '0.42rem 0.8rem',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
          }}
        >
          <RotateCcw size={13} />
          {t.settings.resetDefaults}
        </button>
      </div>

      {/* Abas de Categoria */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.48rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: isActive ? 'none' : '1px solid var(--border)',
                background: isActive ? settings.accentColor || 'var(--accent)' : 'var(--bg-secondary)',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                display: 'flex',
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
      </div>

      {/* Conteúdo da Aba */}
      <div style={{ flex: 1 }}>
        {activeTab === 'general' && <GeneralSettingsTab />}
        {activeTab === 'appearance' && <AppearanceSettingsTab />}
        {activeTab === 'editor' && <EditorSettingsTab />}
        {activeTab === 'ai' && <AiAndMcpSettingsTab />}
        {activeTab === 'shortcuts' && <ShortcutsSettingsTab />}
        {activeTab === 'storage' && <NotificationsAndStorageTab />}
      </div>
    </div>
  );
}
