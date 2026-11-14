import { useEffect, useState } from 'react';
import { useProject } from '../context/ProjectContext';
import { AboutSettingsTab } from '../components/settings/AboutSettingsTab';
import { AiAndMcpSettingsTab } from '../components/settings/AiAndMcpSettingsTab';
import { AppearanceSettingsTab } from '../components/settings/AppearanceSettingsTab';
import { EditorSettingsTab } from '../components/settings/EditorSettingsTab';
import { GeneralSettingsTab } from '../components/settings/GeneralSettingsTab';
import { NotificationsAndStorageTab } from '../components/settings/NotificationsAndStorageTab';
import { SettingsSaveBar } from '../components/settings/SettingsSaveBar';
import {
  SettingsTabBar,
  VALID_SETTINGS_TABS,
  type SettingsTabId,
} from '../components/settings/SettingsTabBar';
import { ShortcutsSettingsTab } from '../components/settings/ShortcutsSettingsTab';

export function SettingsView() {
  const { activeSubPath, setActiveSubPath } = useProject();
  const [activeTab, setActiveTab] = useState<SettingsTabId>('general');

  useEffect(() => {
    if (activeSubPath === 'notifications') {
      setActiveTab('storage');
    } else if (VALID_SETTINGS_TABS.has(activeSubPath as SettingsTabId)) {
      setActiveTab(activeSubPath as SettingsTabId);
    }
  }, [activeSubPath]);

  const handleSelectTab = (tabId: SettingsTabId) => {
    setActiveTab(tabId);
    setActiveSubPath(tabId);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        height: '100%',
        overflowY: 'auto',
        padding: '1rem',
        maxWidth: 1180,
        margin: '0 auto',
      }}
    >
      <SettingsTabBar activeTab={activeTab} onSelectTab={handleSelectTab} />

      <div style={{ flex: 1 }}>
        {activeTab === 'general' && <GeneralSettingsTab />}
        {activeTab === 'appearance' && <AppearanceSettingsTab />}
        {activeTab === 'editor' && <EditorSettingsTab />}
        {activeTab === 'ai' && <AiAndMcpSettingsTab />}
        {activeTab === 'shortcuts' && <ShortcutsSettingsTab />}
        {activeTab === 'storage' && <NotificationsAndStorageTab />}
        {activeTab === 'about' && <AboutSettingsTab />}
      </div>

      <SettingsSaveBar position="bottom" />
    </div>
  );
}
