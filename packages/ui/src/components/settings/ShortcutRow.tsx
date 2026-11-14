import { useEffect, useState } from 'react';
import { AlertTriangle, Keyboard, RotateCcw } from 'lucide-react';
import {
  formatKeyEventToShortcut,
  normalizeShortcutString,
  type ShortcutDefinition,
} from '../../domain/shortcutManager';
import {
  THEME_VAR,
  controlInputStyle,
  innerCardStyle,
  secondaryButtonStyle,
} from './settingsStyles';

interface ShortcutRowProps {
  definition: ShortcutDefinition;
  value: string;
  defaultValue: string;
  isEn: boolean;
  isCapturing: boolean;
  conflictCount: number;
  onStartCapture: () => void;
  onStopCapture: () => void;
  onChange: (nextCombo: string) => void;
}

function buildModifierPreview(ev: KeyboardEvent): string {
  const mods: string[] = [];
  if (ev.ctrlKey || ev.metaKey) mods.push('Ctrl');
  if (ev.altKey) mods.push('Alt');
  if (ev.shiftKey) mods.push('Shift');
  return mods.length > 0 ? `${mods.join('+')}+...` : '';
}

export function ShortcutRow({
  definition,
  value,
  defaultValue,
  isEn,
  isCapturing,
  conflictCount,
  onStartCapture,
  onStopCapture,
  onChange,
}: ShortcutRowProps) {
  const [livePreview, setLivePreview] = useState('');
  const label = isEn ? definition.labelEn : definition.labelPt;
  const desc = isEn ? definition.descEn : definition.descPt;

  const isModified =
    normalizeShortcutString(value || '') !== normalizeShortcutString(defaultValue || '');
  const hasConflict = conflictCount > 1;

  useEffect(() => {
    if (!isCapturing) {
      setLivePreview('');
      return;
    }

    const onKeyDown = (ev: KeyboardEvent) => {
      ev.preventDefault();
      ev.stopPropagation();

      if (ev.key === 'Escape' && !ev.ctrlKey && !ev.altKey && !ev.shiftKey && !ev.metaKey) {
        onStopCapture();
        return;
      }

      const formatted = formatKeyEventToShortcut(ev);
      if (formatted) {
        onChange(formatted);
        onStopCapture();
        return;
      }

      setLivePreview(buildModifierPreview(ev));
    };

    const onKeyUp = (ev: KeyboardEvent) => {
      setLivePreview(buildModifierPreview(ev));
    };

    window.addEventListener('keydown', onKeyDown, { capture: true });
    window.addEventListener('keyup', onKeyUp, { capture: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown, { capture: true });
      window.removeEventListener('keyup', onKeyUp, { capture: true });
    };
  }, [isCapturing, onChange, onStopCapture]);

  return (
    <div
      style={{
        ...innerCardStyle,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.75rem',
        borderColor: hasConflict
          ? 'rgba(245, 158, 11, 0.7)'
          : isCapturing
            ? THEME_VAR.accentPrimary
            : THEME_VAR.borderSubtle,
      }}
    >
      <div style={{ minWidth: 220, flex: '1 1 260px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            flexWrap: 'wrap',
            fontSize: '0.82rem',
            fontWeight: 600,
            color: THEME_VAR.textPrimary,
          }}
        >
          <span>{label}</span>
          {hasConflict && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                fontSize: '0.68rem',
                fontWeight: 700,
                background: 'rgba(245, 158, 11, 0.16)',
                color: '#d97706',
                border: '1px solid rgba(245, 158, 11, 0.35)',
              }}
            >
              <AlertTriangle size={11} />
              {isEn ? `Conflict (${conflictCount})` : `Conflito (${conflictCount})`}
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.74rem', color: THEME_VAR.textMuted, marginTop: '0.15rem' }}>
          {desc}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            const norm = normalizeShortcutString(value);
            if (norm && norm !== value) onChange(norm);
          }}
          aria-label={label}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect="off"
          style={{
            ...controlInputStyle,
            width: 132,
            textAlign: 'center',
            fontFamily: 'monospace',
            fontSize: '0.77rem',
            fontWeight: 600,
            padding: '0.38rem 0.5rem',
            color: hasConflict ? '#d97706' : THEME_VAR.accentPrimary,
          }}
        />

        <button
          type="button"
          data-shortcut-capture={isCapturing ? 'true' : undefined}
          aria-pressed={isCapturing}
          aria-label={
            isCapturing
              ? isEn
                ? `Cancel key capture for ${label}`
                : `Cancelar gravação de tecla para ${label}`
              : isEn
                ? `Record key for ${label}`
                : `Gravar tecla para ${label}`
          }
          onClick={() => (isCapturing ? onStopCapture() : onStartCapture())}
          style={{
            ...secondaryButtonStyle,
            padding: '0.38rem 0.65rem',
            fontSize: '0.74rem',
            minWidth: 112,
            justifyContent: 'center',
            background: isCapturing ? THEME_VAR.accentSoft : THEME_VAR.bgSurface,
            borderColor: isCapturing ? THEME_VAR.accentPrimary : THEME_VAR.borderSubtle,
            color: isCapturing ? THEME_VAR.accentPrimary : THEME_VAR.textSecondary,
          }}
        >
          <Keyboard size={12} />
          {isCapturing
            ? livePreview || (isEn ? 'Press keys...' : 'Pressione...')
            : isEn
              ? 'Record Key'
              : 'Gravar Tecla'}
        </button>

        <button
          type="button"
          onClick={() => onChange(defaultValue)}
          disabled={!isModified}
          aria-disabled={!isModified}
          aria-label={
            isEn ? `Restore default for ${label}` : `Restaurar padrão de ${label}`
          }
          title={
            isEn
              ? `Restore default (${defaultValue})`
              : `Restaurar padrão (${defaultValue})`
          }
          style={{
            ...secondaryButtonStyle,
            padding: '0.38rem 0.5rem',
            fontSize: '0.75rem',
            opacity: isModified ? 1 : 0.35,
            cursor: isModified ? 'pointer' : 'not-allowed',
          }}
        >
          <RotateCcw size={12} />
        </button>
      </div>
    </div>
  );
}
