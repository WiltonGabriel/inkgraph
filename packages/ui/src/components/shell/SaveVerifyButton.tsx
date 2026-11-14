import { useState, useRef, useEffect } from 'react';
import { CheckCircle2, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export function SaveVerifyButton() {
  const { verifyAndSaveNow, lastVerifyResult, settings } = useProject();
  const [verifying, setVerifying] = useState(false);
  const [justVerified, setJustVerified] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const isEn = settings.language === 'en';

  const handleVerifyAndSave = async () => {
    if (verifying) return;
    setVerifying(true);
    const startedAt = Date.now();
    const res = await verifyAndSaveNow();

    if (!settings.reducedMotion) {
      const elapsed = Date.now() - startedAt;
      if (elapsed < 220) {
        await new Promise((resolve) => setTimeout(resolve, 220 - elapsed));
      }
    }

    setVerifying(false);

    if (res.ok) {
      setJustVerified(true);
      if (!settings.reducedMotion && buttonRef.current && typeof buttonRef.current.animate === 'function') {
        buttonRef.current.animate(
          [
            { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.45)' },
            { transform: 'scale(1.04)', boxShadow: '0 0 0 6px rgba(16, 185, 129, 0)' },
            { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' },
          ],
          { duration: 600, easing: 'ease-out' }
        );
      }
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        setJustVerified(false);
      }, 3600);
    }
  };

  const tooltip = lastVerifyResult?.ok
    ? isEn
      ? `Verified at ${lastVerifyResult.verifiedAt} · ${lastVerifyResult.sizeKb} KB · ${lastVerifyResult.workspaceCount} ${lastVerifyResult.workspaceCount === 1 ? 'workspace' : 'workspaces'} · ${lastVerifyResult.sceneCount} ${lastVerifyResult.sceneCount === 1 ? 'scene' : 'scenes'}`
      : `Verificado às ${lastVerifyResult.verifiedAt} · ${lastVerifyResult.sizeKb} KB · ${lastVerifyResult.workspaceCount} ${lastVerifyResult.workspaceCount === 1 ? 'workspace' : 'workspaces'} · ${lastVerifyResult.sceneCount} ${lastVerifyResult.sceneCount === 1 ? 'cena' : 'cenas'}`
    : lastVerifyResult?.error
      ? lastVerifyResult.error
      : isEn
        ? 'Save now and verify local storage integrity'
        : 'Salvar agora e verificar integridade do armazenamento local';

  const hasError = Boolean(lastVerifyResult && !lastVerifyResult.ok);
  const isVerifiedOk = Boolean(lastVerifyResult?.ok);

  const backgroundColor = hasError
    ? 'rgba(245, 158, 11, 0.14)'
    : justVerified
      ? 'rgba(16, 185, 129, 0.18)'
      : isVerifiedOk
        ? 'rgba(16, 185, 129, 0.11)'
        : 'var(--bg-elevated, var(--bg-card, #171d2e))';

  const borderColor = hasError
    ? 'rgba(245, 158, 11, 0.42)'
    : justVerified
      ? 'rgba(16, 185, 129, 0.55)'
      : isVerifiedOk
        ? 'rgba(16, 185, 129, 0.34)'
        : 'var(--border-subtle, var(--border, #263046))';

  const textColor = hasError
    ? '#f59e0b'
    : isVerifiedOk
      ? '#10b981'
      : 'var(--text-secondary, #94a3b8)';

  return (
    <>
      <style>{`@keyframes inkVerifySpin { to { transform: rotate(360deg); } }`}</style>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => void handleVerifyAndSave()}
        disabled={verifying}
        title={tooltip}
        aria-label={tooltip}
        aria-live="polite"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px 8px',
          borderRadius: 'var(--radius-sm, 6px)',
          border: `1px solid ${borderColor}`,
          backgroundColor,
          color: textColor,
          cursor: verifying ? 'wait' : 'pointer',
          flexShrink: 0,
          transition: settings.reducedMotion ? 'none' : 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease',
        }}
      >
        {verifying ? (
          <Loader2
            size={14}
            style={{
              animation: settings.reducedMotion ? undefined : 'inkVerifySpin 0.75s linear infinite',
            }}
          />
        ) : hasError ? (
          <AlertTriangle size={14} />
        ) : isVerifiedOk ? (
          <CheckCircle2 size={14} />
        ) : (
          <ShieldCheck size={14} />
        )}
      </button>
    </>
  );
}
