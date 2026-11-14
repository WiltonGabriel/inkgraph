import React from 'react';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export interface SilentToastItem {
  id: string;
  message: string;
  tone: 'success' | 'info' | 'warning';
}

interface SilentToastProps {
  items: SilentToastItem[];
  onDismiss: (id: string) => void;
}

/**
 * Unobtrusive corner notification stack aligned with InkGraph's Silent Design rules.
 */
export const SilentToast: React.FC<SilentToastProps> = ({ items, onDismiss }) => {
  if (items.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2 pointer-events-none"
      aria-live="polite"
    >
      {items.map((item) => {
        const iconColor =
          item.tone === 'success'
            ? '#10b981'
            : item.tone === 'warning'
            ? '#f59e0b'
            : 'var(--accent-primary, #60a5fa)';
        const Icon =
          item.tone === 'success'
            ? CheckCircle2
            : item.tone === 'warning'
            ? AlertCircle
            : Info;

        return (
          <div
            key={item.id}
            className="pointer-events-auto flex items-center gap-2.5 rounded-lg border px-3 py-2 text-xs shadow-lg transition-all"
            style={{
              backgroundColor: 'var(--bg-elevated, #121622)',
              borderColor: 'var(--border-subtle, #273043)',
              color: 'var(--text-primary, #f1f5f9)',
            }}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: iconColor }} />
            <span className="min-w-0 flex-1 leading-snug">{item.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              aria-label="Fechar aviso"
              className="rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
              style={{ color: 'var(--text-secondary, #94a3b8)' }}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
