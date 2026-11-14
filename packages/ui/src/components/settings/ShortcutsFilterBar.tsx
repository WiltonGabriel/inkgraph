import { AlertTriangle, Keyboard, RotateCcw, Search, X } from 'lucide-react';
import {
  SHORTCUT_CATEGORY_LABELS,
  SHORTCUT_DEFINITIONS,
  type ShortcutCategoryId,
} from '../../domain/shortcutManager';
import {
  THEME_VAR,
  controlInputStyle,
  secondaryButtonStyle,
  sectionCardStyle,
  sectionHeaderStyle,
} from './settingsStyles';

const CATEGORY_ORDER: ShortcutCategoryId[] = ['navigation', 'views', 'editor', 'canvas'];

interface ShortcutsFilterBarProps {
  isEn: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  categoryFilter: ShortcutCategoryId | 'all';
  onCategoryChange: (cat: ShortcutCategoryId | 'all') => void;
  modifiedCount: number;
  conflictCombos: string[];
  onResetAll: () => void;
}

export function ShortcutsFilterBar({
  isEn,
  searchQuery,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  modifiedCount,
  conflictCombos,
  onResetAll,
}: ShortcutsFilterBarProps) {
  return (
    <section style={sectionCardStyle}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.65rem',
        }}
      >
        <div style={sectionHeaderStyle}>
          <Keyboard size={16} color={THEME_VAR.accentPrimary} />
          <span>
            {isEn
              ? `Keyboard Shortcuts (${SHORTCUT_DEFINITIONS.length} Commands)`
              : `Atalhos de Teclado (${SHORTCUT_DEFINITIONS.length} Comandos)`}
          </span>
          <span
            style={{
              padding: '0.16rem 0.55rem',
              borderRadius: '999px',
              fontSize: '0.7rem',
              fontWeight: 600,
              background: modifiedCount > 0 ? THEME_VAR.accentSoft : THEME_VAR.bgElevated,
              color: modifiedCount > 0 ? THEME_VAR.accentPrimary : THEME_VAR.textMuted,
              border: `1px solid ${THEME_VAR.borderSubtle}`,
            }}
          >
            {modifiedCount > 0
              ? isEn
                ? `${modifiedCount} modified`
                : `${modifiedCount} modificado(s)`
              : isEn
                ? 'Factory defaults'
                : 'Padrão de fábrica'}
          </span>
        </div>

        <button
          type="button"
          onClick={onResetAll}
          style={{ ...secondaryButtonStyle, fontSize: '0.76rem' }}
        >
          <RotateCcw size={13} />
          {isEn ? 'Restore All Defaults' : 'Restaurar 26 Atalhos'}
        </button>
      </div>

      <search>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search
            size={14}
            color={THEME_VAR.textMuted}
            style={{ position: 'absolute', left: '0.7rem', pointerEvents: 'none' }}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={
              isEn
                ? 'Filter 26 shortcuts by action, description, or key...'
                : 'Filtrar 26 atalhos por comando, descrição ou tecla...'
            }
            aria-label={isEn ? 'Filter keyboard shortcuts' : 'Filtrar atalhos de teclado'}
            style={{
              ...controlInputStyle,
              paddingLeft: '2.1rem',
              paddingRight: searchQuery ? '2rem' : '0.65rem',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              aria-label={isEn ? 'Clear search' : 'Limpar busca'}
              onClick={() => onSearchChange('')}
              style={{
                position: 'absolute',
                right: '0.45rem',
                background: 'transparent',
                color: THEME_VAR.textMuted,
                padding: '0.2rem',
                display: 'inline-flex',
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </search>

      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          aria-pressed={categoryFilter === 'all'}
          onClick={() => onCategoryChange('all')}
          style={{
            ...secondaryButtonStyle,
            padding: '0.35rem 0.7rem',
            fontSize: '0.75rem',
            background:
              categoryFilter === 'all' ? THEME_VAR.accentSoft : THEME_VAR.bgElevated,
            borderColor:
              categoryFilter === 'all' ? THEME_VAR.accentPrimary : THEME_VAR.borderSubtle,
            color:
              categoryFilter === 'all' ? THEME_VAR.accentPrimary : THEME_VAR.textSecondary,
          }}
        >
          {isEn
            ? `All (${SHORTCUT_DEFINITIONS.length})`
            : `Todos (${SHORTCUT_DEFINITIONS.length})`}
        </button>

        {CATEGORY_ORDER.map((cat) => {
          const count = SHORTCUT_DEFINITIONS.filter((d) => d.category === cat).length;
          const active = categoryFilter === cat;
          return (
            <button
              key={cat}
              type="button"
              aria-pressed={active}
              onClick={() => onCategoryChange(cat)}
              style={{
                ...secondaryButtonStyle,
                padding: '0.35rem 0.7rem',
                fontSize: '0.75rem',
                background: active ? THEME_VAR.accentSoft : THEME_VAR.bgElevated,
                borderColor: active ? THEME_VAR.accentPrimary : THEME_VAR.borderSubtle,
                color: active ? THEME_VAR.accentPrimary : THEME_VAR.textSecondary,
              }}
            >
              {SHORTCUT_CATEGORY_LABELS[cat][isEn ? 'en' : 'pt']} ({count})
            </button>
          );
        })}
      </div>

      {conflictCombos.length > 0 && (
        <div
          role="status"
          aria-live="polite"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.55rem 0.75rem',
            borderRadius: THEME_VAR.radiusSm,
            background: 'rgba(245, 158, 11, 0.14)',
            border: '1px solid rgba(245, 158, 11, 0.38)',
            color: '#d97706',
            fontSize: '0.78rem',
            fontWeight: 600,
          }}
        >
          <AlertTriangle size={14} />
          <span>
            {isEn
              ? `${conflictCombos.length} conflicting shortcut combo(s): ${conflictCombos.join(', ')}`
              : `${conflictCombos.length} combinação(ões) em conflito: ${conflictCombos.join(', ')}`}
          </span>
        </div>
      )}
    </section>
  );
}
