import { AppearanceCanvasAndA11ySection } from './AppearanceCanvasAndA11ySection';
import { AppearanceLayoutSection } from './AppearanceLayoutSection';
import { AppearanceThemeSection } from './AppearanceThemeSection';

export function AppearanceSettingsTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <AppearanceThemeSection />
      <AppearanceLayoutSection />
      <AppearanceCanvasAndA11ySection />
    </div>
  );
}
