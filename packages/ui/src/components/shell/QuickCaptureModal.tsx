import { useState } from 'react';
import { X, PlusCircle, Check } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export function QuickCaptureModal() {
  const { showQuickCapture, setShowQuickCapture, captureToStaging, setActiveView, t } = useProject();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [entityType, setEntityType] = useState<'scene' | 'character' | 'location'>('scene');
  const [savedNotice, setSavedNotice] = useState(false);

  if (!showQuickCapture) return null;

  const handleSave = () => {
    if (!content.trim()) return;
    captureToStaging({ title, content, entityType });
    setTitle('');
    setContent('');
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      setShowQuickCapture(false);
    }, 650);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.quickCapture.modalTitle}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 230,
        backgroundColor: 'rgba(6, 8, 13, 0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={() => setShowQuickCapture(false)}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 500,
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700 }}>
            <PlusCircle size={16} color="var(--accent)" />
            <span>{t.quickCapture.modalTitle}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowQuickCapture(false)}
            aria-label={t.common.close}
            style={{ background: 'none', color: 'var(--text-muted)', padding: 6 }}
          >
            <X size={16} />
          </button>
        </div>

        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.45, margin: 0 }}>
          {t.quickCapture.modalSubtitle}
        </p>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'scene' as const, label: t.quickCapture.kindScene },
            { id: 'character' as const, label: t.quickCapture.kindLore },
            { id: 'location' as const, label: t.quickCapture.kindNote },
          ].map((k) => (
            <button
              key={k.id}
              type="button"
              onClick={() => setEntityType(k.id)}
              style={{
                padding: '6px 11px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                border: entityType === k.id ? '1px solid var(--accent)' : '1px solid var(--border)',
                backgroundColor: entityType === k.id ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-card)',
                color: 'var(--text-primary)',
                minHeight: 36,
              }}
            >
              {k.label}
            </button>
          ))}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.quickCapture.titlePlaceholder}
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: 7,
            padding: '9px 11px',
            fontSize: 13,
          }}
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t.quickCapture.bodyPlaceholder}
          rows={5}
          style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: 7,
            padding: '10px 11px',
            fontSize: 13,
            lineHeight: 1.5,
            resize: 'vertical',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => {
              setShowQuickCapture(false);
              setActiveView('versions');
            }}
            style={{ background: 'none', color: 'var(--text-muted)', fontSize: 12, textDecoration: 'underline' }}
          >
            {t.views.versions}
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!content.trim()}
            style={{
              padding: '8px 16px',
              borderRadius: 7,
              backgroundColor: savedNotice ? '#10b981' : 'var(--accent)',
              color: '#ffffff',
              fontSize: 12.5,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              opacity: !content.trim() ? 0.5 : 1,
              minHeight: 40,
            }}
          >
            {savedNotice ? <Check size={14} /> : <PlusCircle size={14} />}
            {savedNotice ? t.quickCapture.savedNotice : t.quickCapture.saveToStagingBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
