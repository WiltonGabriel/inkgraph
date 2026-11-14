import React, { useEffect } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'neutral';
}

interface ConfirmDialogProps {
  open: boolean;
  options: ConfirmDialogOptions | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Silent, keyboard-accessible modal replacement for native window.confirm().
 * Respects Escape to cancel and themed CSS variables across Light/Dark/Sepia.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  options,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
        onConfirm();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [open, onCancel, onConfirm]);

  if (!open || !options) return null;

  const isDanger = options.tone !== 'neutral';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-[2px] animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ink-confirm-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl border p-5 shadow-2xl transition-all"
        style={{
          backgroundColor: 'var(--bg-elevated, #121622)',
          borderColor: 'var(--border-subtle, #273043)',
          color: 'var(--text-primary, #f1f5f9)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border"
            style={{
              backgroundColor: isDanger ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
              borderColor: isDanger ? 'rgba(239,68,68,0.28)' : 'rgba(59,130,246,0.28)',
              color: isDanger ? '#f87171' : 'var(--accent-primary, #60a5fa)',
            }}
          >
            {isDanger ? <AlertTriangle className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />}
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="ink-confirm-title"
              className="text-sm font-semibold leading-snug"
              style={{ color: 'var(--text-primary, #f8fafc)' }}
            >
              {options.title}
            </h2>
            <p
              className="mt-1.5 text-xs leading-relaxed whitespace-pre-line"
              style={{ color: 'var(--text-secondary, #94a3b8)' }}
            >
              {options.message}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-90"
            style={{
              backgroundColor: 'var(--bg-surface, #1a2030)',
              borderColor: 'var(--border-subtle, #2c3549)',
              color: 'var(--text-secondary, #cbd5e1)',
            }}
          >
            {options.cancelLabel ?? 'Cancelar'}
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className="rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-opacity hover:opacity-90"
            style={{
              backgroundColor: isDanger ? '#dc2626' : 'var(--accent-primary, #2563eb)',
              color: '#ffffff',
            }}
          >
            {options.confirmLabel ?? 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
};
