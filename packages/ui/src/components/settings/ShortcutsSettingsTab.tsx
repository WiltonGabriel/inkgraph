import { useMemo, useState } from 'react';
import { useProject } from '../../context/ProjectContext';
import { useSettings } from '../../context/SettingsContext';
import { DEFAULT_SETTINGS } from '../../data/defaultSettings';
import {
  SHORTCUT_CATEGORY_LABELS,
  SHORTCUT_DEFINITIONS,
  countModifiedShortcuts,
  findShortcutConflicts,
  normalizeShortcutString,
  type ShortcutCategoryId,
} from '../../domain/shortcutManager';
import type { KeyboardShortcutMap } from '../../types/project';
import { ShortcutRow } from './ShortcutRow';
import { ShortcutsFilterBar } from './ShortcutsFilterBar';
import {
  THEME_VAR,
  secondaryButtonStyle,
  sectionCardStyle,
  sectionHeaderStyle,
} from './settingsStyles';

const CATEGORY_ORDER: ShortcutCategoryId[] = ['navigation', 'views', 'editor', 'canvas'];

export function ShortcutsSettingsTab() {
  const { draftSettings, updateDraftShortcut, updateDraftSettings } = useSettings();
  const { requestConfirm, notify } = useProject();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ShortcutCategoryId | 'all'>('all');
  const [capturingKey, setCapturingKey] = useState<keyof KeyboardShortcutMap | null>(null);

  const isEn = draftSettings.language === 'en';
  const shortcuts = draftSettings.shortcuts;

  const conflicts = useMemo(() => findShortcutConflicts(shortcuts), [shortcuts]);
  const conflictCombos = useMemo(() => Object.keys(conflicts), [conflicts]);
  const modifiedCount = useMemo(
    () => countModifiedShortcuts(shortcuts, DEFAULT_SETTINGS.shortcuts),
    [shortcuts]
  );

  const filteredDefs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return SHORTCUT_DEFINITIONS.filter((def) => {
      if (categoryFilter !== 'all' && def.category !== categoryFilter) return false;
      if (!q) return true;
      const combo = (shortcuts[def.key] || '').toLowerCase();
      return (
        def.labelPt.toLowerCase().includes(q) ||
        def.labelEn.toLowerCase().includes(q) ||
        def.descPt.toLowerCase().includes(q) ||
        def.descEn.toLowerCase().includes(q) ||
        combo.includes(q)
      );
    });
  }, [categoryFilter, searchQuery, shortcuts]);

  const groupedDefs = useMemo(() => {
    return CATEGORY_ORDER.map((cat) => ({
      category: cat,
      items: filteredDefs.filter((d) => d.category === cat),
    })).filter((group) => group.items.length > 0);
  }, [filteredDefs]);

  const handleResetAllShortcuts = async () => {
    setCapturingKey(null);
    if (modifiedCount > 0) {
      const ok = await requestConfirm({
        title: isEn ? 'Restore Default Shortcuts' : 'Restaurar Todos os Atalhos',
        message: isEn
          ? `Reset all ${SHORTCUT_DEFINITIONS.length} keyboard shortcuts (${modifiedCount} customized) back to factory defaults?`
          : `Restaurar todos os ${SHORTCUT_DEFINITIONS.length} atalhos de teclado (${modifiedCount} personalizados) para o padrão?`,
        confirmLabel: isEn ? 'Restore Shortcuts' : 'Restaurar Atalhos',
        cancelLabel: isEn ? 'Cancel' : 'Cancelar',
        tone: 'neutral',
      });
      if (!ok) return;
    }
    updateDraftSettings({ shortcuts: { ...DEFAULT_SETTINGS.shortcuts } });
    notify(
      isEn
        ? 'All 26 shortcuts restored in draft.'
        : 'Todos os 26 atalhos restaurados no rascunho.',
      'info'
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <ShortcutsFilterBar
        isEn={isEn}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        categoryFilter={categoryFilter}
        onCategoryChange={setCategoryFilter}
        modifiedCount={modifiedCount}
        conflictCombos={conflictCombos}
        onResetAll={() => void handleResetAllShortcuts()}
      />

      {groupedDefs.length === 0 ? (
        <section style={{ ...sectionCardStyle, alignItems: 'center', padding: '1.6rem' }}>
          <span style={{ fontSize: '0.82rem', color: THEME_VAR.textMuted }}>
            {isEn
              ? 'No shortcuts match your filter.'
              : 'Nenhum atalho corresponde ao filtro atual.'}
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
            }}
            style={secondaryButtonStyle}
          >
            {isEn ? 'Clear filters' : 'Limpar filtros'}
          </button>
        </section>
      ) : (
        groupedDefs.map((group) => (
          <section key={group.category} style={sectionCardStyle}>
            <div style={{ ...sectionHeaderStyle, fontSize: '0.83rem' }}>
              <span>{SHORTCUT_CATEGORY_LABELS[group.category][isEn ? 'en' : 'pt']}</span>
              <span style={{ fontSize: '0.72rem', color: THEME_VAR.textMuted }}>
                ({group.items.length})
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {group.items.map((def) => {
                const combo = shortcuts[def.key] || '';
                const norm = normalizeShortcutString(combo);
                const colliding = norm ? (conflicts[norm]?.length ?? 0) : 0;
                return (
                  <ShortcutRow
                    key={def.key}
                    definition={def}
                    value={combo}
                    defaultValue={DEFAULT_SETTINGS.shortcuts[def.key]}
                    isEn={isEn}
                    isCapturing={capturingKey === def.key}
                    conflictCount={colliding}
                    onStartCapture={() => setCapturingKey(def.key)}
                    onStopCapture={() => setCapturingKey(null)}
                    onChange={(nextCombo) => updateDraftShortcut(def.key, nextCombo)}
                  />
                );
              })}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
