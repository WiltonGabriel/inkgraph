import { useCallback, useEffect, useState } from 'react';
import { Check, RotateCcw, Save, Undo2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useSettings } from '../../context/SettingsContext';
import {
  THEME_VAR,
  primaryButtonStyle,
  secondaryButtonStyle,
} from './settingsStyles';

interface SettingsSaveBarProps {
  position?: 'top' | 'bottom';
  showResetButton?: boolean;
}

export function SettingsSaveBar({
  position = 'bottom',
  showResetButton = true,
}: SettingsSaveBarProps) {
  const {
    draftSettings,
    hasUnsavedChanges,
    unsavedCount,
    lastSavedAt,
    saveSettings,
    discardSettingsChanges,
    resetDraftToDefaults,
  } = useSettings();
  const { requestConfirm, notify, t } = useProject();
  const [justSaved, setJustSaved] = useState(false);

  const isEn = draftSettings.language === 'en';
  const reduceMotion = draftSettings.reducedMotion || !draftSettings.enableAnimations;

  const handleSave = useCallback(() => {
    const ok = saveSettings();
    if (!ok) {
      notify(
        isEn
          ? 'Could not write settings to local storage.'
          : 'Não foi possível gravar as configurações no armazenamento local.',
        'warning'
      );
      return;
    }
    setJustSaved(true);
    notify(isEn ? 'Settings saved.' : 'Configurações salvas.', 'success');
  }, [saveSettings, notify, isEn]);

  useEffect(() => {
    if (!justSaved) return;
    const timer = window.setTimeout(() => setJustSaved(false), 2000);
    return () => window.clearTimeout(timer);
  }, [justSaved]);

  useEffect(() => {
    const onKeyDown = (ev: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl?.getAttribute('data-shortcut-capture') === 'true') return;
      if (
        (ev.ctrlKey || ev.metaKey) &&
        !ev.altKey &&
        !ev.shiftKey &&
        ev.key.toLowerCase() === 's'
      ) {
        ev.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSave]);

  const handleResetDefaults = async () => {
    const accepted = await requestConfirm({
      title: t.settings.resetDefaults,
      message: isEn
        ? 'Restore all program preferences and 26 keyboard shortcuts to their default values? Save afterwards to persist.'
        : 'Restaurar todas as preferências do programa e os 26 atalhos para os valores padrão? Salve em seguida para confirmar.',
      confirmLabel: t.settings.resetDefaults,
      cancelLabel: t.common.cancel,
      tone: 'danger',
    });
    if (accepted) {
      resetDraftToDefaults();
      notify(
        isEn
          ? 'Default settings staged. Save to apply.'
          : 'Padrões carregados no rascunho. Salve para aplicar.',
        'info'
      );
    }
  };

  const pendingLabel = isEn
    ? `${unsavedCount} pending ${unsavedCount === 1 ? 'change' : 'changes'}`
    : `${unsavedCount} ${unsavedCount === 1 ? 'alteração pendente' : 'alterações pendentes'}`;

  const cleanLabel = isEn
    ? lastSavedAt
      ? `No pending changes • Saved at ${lastSavedAt}`
      : 'No pending changes'
    : lastSavedAt
      ? `Sem alterações pendentes • Salvo às ${lastSavedAt}`
      : 'Sem alterações pendentes';

  return (
    <div
      style={{
        position: 'sticky',
        ...(position === 'top' ? { top: 0 } : { bottom: 0 }),
        zIndex: 20,
        background: THEME_VAR.bgSurface,
        border: `1px solid ${THEME_VAR.borderSubtle}`,
        borderRadius: THEME_VAR.radiusMd,
        boxShadow: THEME_VAR.cardShadow,
        padding: '0.7rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}
    >
      <div
        role="status"
        aria-live="polite"
        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}
      >
        {justSaved ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.28rem 0.65rem',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: 'rgba(16, 185, 129, 0.16)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#10b981',
              transition: reduceMotion ? 'none' : 'all 220ms ease',
            }}
          >
            <Check size={13} />
            {isEn ? 'Settings saved ✓' : 'Configurações salvas ✓'}
          </span>
        ) : hasUnsavedChanges ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.28rem 0.65rem',
              borderRadius: '999px',
              fontSize: '0.78rem',
              fontWeight: 600,
              background: 'rgba(245, 158, 11, 0.14)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#d97706',
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#f59e0b',
              }}
            />
            {pendingLabel}
          </span>
        ) : (
          <span style={{ fontSize: '0.78rem', color: THEME_VAR.textMuted }}>
            {cleanLabel}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        {showResetButton && (
          <button
            type="button"
            onClick={() => void handleResetDefaults()}
            style={{
              ...secondaryButtonStyle,
              color: THEME_VAR.textSecondary,
            }}
          >
            <RotateCcw size={13} />
            {t.settings.resetDefaults}
          </button>
        )}

        <button
          type="button"
          onClick={discardSettingsChanges}
          disabled={!hasUnsavedChanges}
          aria-disabled={!hasUnsavedChanges}
          style={{
            ...secondaryButtonStyle,
            opacity: hasUnsavedChanges ? 1 : 0.45,
            cursor: hasUnsavedChanges ? 'pointer' : 'not-allowed',
          }}
        >
          <Undo2 size={13} />
          {isEn ? 'Discard Changes' : 'Descartar Alterações'}
        </button>

        <button
          type="button"
          onClick={handleSave}
          style={{
            ...primaryButtonStyle,
            opacity: hasUnsavedChanges || justSaved ? 1 : 0.9,
          }}
        >
          <Save size={13} />
          {isEn ? 'Save Settings' : 'Salvar Configurações'}
          <kbd
            style={{
              fontSize: '0.68rem',
              padding: '0.05rem 0.32rem',
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.18)',
              fontFamily: 'monospace',
            }}
          >
            Ctrl+S
          </kbd>
        </button>
      </div>
    </div>
  );
}
