import { useEffect, useRef, useState } from 'react';
import { Check, LayoutTemplate, X } from 'lucide-react';
import {
  NARRATIVE_TEMPLATES,
  type NarrativeTemplate,
} from '../../data/templatesCatalog';
import { OutlineTemplatePreview } from './OutlineTemplatePreview';

interface OutlineTemplateModalProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: NarrativeTemplate, replaceManuscript: boolean) => void;
}

export function OutlineTemplateModal({
  open,
  onClose,
  onSelectTemplate,
}: OutlineTemplateModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [filter, setFilter] = useState<'Todos' | 'Estrutura' | 'Gênero'>('Todos');
  const [selectedId, setSelectedId] = useState<string>(
    NARRATIVE_TEMPLATES[0]?.id ?? 'three_act'
  );
  const [contextConcept, setContextConcept] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const visibleTemplates = NARRATIVE_TEMPLATES.filter(
    (tpl) => filter === 'Todos' || tpl.category === filter
  );
  const selectedTemplate =
    NARRATIVE_TEMPLATES.find((tpl) => tpl.id === selectedId) ?? NARRATIVE_TEMPLATES[0];

  const handleApply = (replaceManuscript: boolean) => {
    const concept = contextConcept.trim();
    const customized: NarrativeTemplate = {
      ...selectedTemplate,
      sections: selectedTemplate.sections.map((sec) => ({
        ...sec,
        description: concept ? `${sec.description} [Premissa: ${concept}]` : sec.description,
      })),
    };
    onClose();
    onSelectTemplate(customized, replaceManuscript);
  };

  return (
    <>
      <style>{`
        dialog.ink-template-modal:modal {
          overscroll-behavior: contain;
          margin: auto;
          padding: 0;
          border: 1px solid var(--border-subtle, #263046);
          border-radius: var(--radius-lg, 12px);
          background-color: var(--bg-surface, #111623);
          color: var(--text-primary, #f1f5f9);
          width: min(920px, calc(100vw - 32px));
          max-height: calc(100vh - 48px);
          box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
          overflow: hidden;
        }
        dialog.ink-template-modal::backdrop {
          background: rgba(5, 7, 11, 0.62);
          backdrop-filter: blur(4px);
          overflow: hidden;
          overscroll-behavior: contain;
        }
      `}</style>
      <dialog
        ref={dialogRef}
        className="ink-template-modal"
        aria-labelledby="outline-template-modal-title"
        onCancel={(e) => {
          e.preventDefault();
          onClose();
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) onClose();
        }}
      >
        {open && (
          <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 48px)' }}>
            <div style={headerStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LayoutTemplate size={16} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
                <h3 id="outline-template-modal-title" style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                  Carregar Estrutura de Modelo
                </h3>
              </div>
              <button type="button" onClick={onClose} aria-label="Fechar seletor de modelo" style={closeBtnStyle}>
                <X size={16} />
              </button>
            </div>

            <div style={bodySplitStyle}>
              <div style={sidebarListStyle}>
                <div style={filterRowStyle}>
                  {(['Todos', 'Estrutura', 'Gênero'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFilter(cat)}
                      style={filterBtnStyle(filter === cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {visibleTemplates.map((tpl) => {
                    const active = tpl.id === selectedTemplate.id;
                    const secCount = tpl.sections.length;
                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => setSelectedId(tpl.id)}
                        style={tplBtnStyle(active)}
                      >
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)', marginBottom: 2 }}>
                          {tpl.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>
                          {tpl.category} · {secCount === 1 ? '1 seção' : `${secCount} seções`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <OutlineTemplatePreview
                template={selectedTemplate}
                contextConcept={contextConcept}
                onChangeConcept={setContextConcept}
              />
            </div>

            <div style={footerStyle}>
              <button type="button" onClick={onClose} style={cancelBtnStyle}>
                Cancelar
              </button>
              <button type="button" onClick={() => handleApply(false)} style={primaryBtnStyle}>
                <Check size={13} /> Carregar no Contorno
              </button>
              <button type="button" onClick={() => handleApply(true)} style={confirmBtnStyle}>
                Carregar no Contorno e Manuscrito
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

const headerStyle: React.CSSProperties = { padding: '14px 18px', borderBottom: '1px solid var(--border-subtle, #263046)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: 'var(--bg-elevated, #171d2e)' };
const closeBtnStyle: React.CSSProperties = { background: 'transparent', border: 'none', color: 'var(--text-muted, #64748b)', padding: 4, cursor: 'pointer', display: 'flex' };
const bodySplitStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'minmax(250px, 310px) 1fr', flex: 1, minHeight: 0, overflow: 'hidden' };
const sidebarListStyle: React.CSSProperties = { borderRight: '1px solid var(--border-subtle, #263046)', display: 'flex', flexDirection: 'column', minHeight: 0, backgroundColor: 'var(--bg-surface, #111623)' };
const filterRowStyle: React.CSSProperties = { padding: 10, display: 'flex', gap: 6, borderBottom: '1px solid var(--border-subtle, #263046)' };
const footerStyle: React.CSSProperties = { padding: '12px 18px', borderTop: '1px solid var(--border-subtle, #263046)', backgroundColor: 'var(--bg-elevated, #171d2e)', display: 'flex', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' };
const cancelBtnStyle: React.CSSProperties = { padding: '7px 12px', borderRadius: 'var(--radius-sm, 6px)', backgroundColor: 'transparent', border: '1px solid var(--border-subtle, #263046)', color: 'var(--text-secondary, #94a3b8)', fontSize: 12, cursor: 'pointer' };
const primaryBtnStyle: React.CSSProperties = { padding: '7px 14px', borderRadius: 'var(--radius-sm, 6px)', backgroundColor: 'var(--accent-primary, #3b82f6)', border: 'none', color: '#ffffff', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 };
const confirmBtnStyle: React.CSSProperties = { padding: '7px 14px', borderRadius: 'var(--radius-sm, 6px)', backgroundColor: '#10b981', border: 'none', color: '#052e16', fontSize: 12, fontWeight: 700, cursor: 'pointer' };
const filterBtnStyle = (active: boolean): React.CSSProperties => ({ flex: 1, padding: '5px 8px', borderRadius: 'var(--radius-sm, 6px)', border: '1px solid var(--border-subtle, #263046)', backgroundColor: active ? 'var(--accent-primary, #3b82f6)' : 'var(--bg-elevated, #171d2e)', color: active ? '#ffffff' : 'var(--text-secondary, #94a3b8)', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' });
const tplBtnStyle = (active: boolean): React.CSSProperties => ({ textAlign: 'left', padding: 10, borderRadius: 'var(--radius-md, 8px)', backgroundColor: active ? 'var(--accent-soft, rgba(59, 130, 246, 0.14))' : 'var(--bg-elevated, #171d2e)', border: active ? '1px solid var(--accent-primary, #3b82f6)' : '1px solid var(--border-subtle, #263046)', cursor: 'pointer' });
