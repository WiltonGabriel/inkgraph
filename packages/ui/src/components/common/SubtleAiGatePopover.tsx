import { useEffect, useRef } from 'react';
import { AlertCircle, SlidersHorizontal, X } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { checkAiAvailability } from '../../domain/aiAvailability';

interface SubtleAiGatePopoverProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
  align?: 'left' | 'right';
}

export function SubtleAiGatePopover({
  open,
  onClose,
  title,
  message,
  secondaryLabel,
  onSecondaryAction,
  align = 'left',
}: SubtleAiGatePopoverProps) {
  const { settings, navigateToBreadcrumbPath } = useProject();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const status = checkAiAvailability(settings);
  const isEn = settings.language === 'en';

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') {
        onClose();
      }
    };
    const handleClickOutside = (ev: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(ev.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open, onClose]);

  if (!open) return null;

  const heading = title ?? (isEn ? 'No AI connected' : 'Nenhuma IA conectada');
  const body = message ?? (isEn ? status.reasonEn : status.reasonPt);

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={heading}
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        ...(align === 'right' ? { right: 0 } : { left: 0 }),
        zIndex: 120,
        width: 288,
        padding: 12,
        backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
        border: '1px solid rgba(245, 158, 11, 0.35)',
        borderRadius: 'var(--radius-md, 8px)',
        boxShadow: '0 10px 28px rgba(0, 0, 0, 0.38)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        color: 'var(--text-primary, #f1f5f9)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            color: '#f59e0b',
          }}
        >
          <AlertCircle size={13} />
          <span>{heading}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          title={isEn ? 'Close' : 'Fechar'}
          aria-label={isEn ? 'Close' : 'Fechar'}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted, #64748b)',
            cursor: 'pointer',
            padding: 2,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={13} />
        </button>
      </div>

      <p
        style={{
          margin: 0,
          fontSize: 11.5,
          lineHeight: 1.45,
          color: 'var(--text-secondary, #94a3b8)',
        }}
      >
        {body}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
        <button
          type="button"
          onClick={() => {
            onClose();
            navigateToBreadcrumbPath('InkGraph / Configurações / IA & Servidor MCP');
          }}
          style={{
            padding: '5px 10px',
            borderRadius: 'var(--radius-sm, 6px)',
            backgroundColor: 'var(--accent-primary, #3b82f6)',
            color: '#ffffff',
            border: 'none',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <SlidersHorizontal size={11} />
          {isEn ? 'Configure AI' : 'Configurar IA'}
        </button>

        {secondaryLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onSecondaryAction();
            }}
            style={{
              padding: '5px 9px',
              borderRadius: 'var(--radius-sm, 6px)',
              backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
              color: 'var(--text-primary, #f1f5f9)',
              border: '1px solid var(--border-subtle, var(--border, #263046))',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}
