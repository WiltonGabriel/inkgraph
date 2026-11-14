import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type RefObject } from 'react';
import { Camera, Check, ExternalLink, GitBranch, GitMerge, Plus } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

interface GitBranchPopoverProps {
  popoverId: string;
  isOpen: boolean;
  triggerRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onOpenMergeDiff: (sourceBranchId: string) => void;
}

export function GitBranchPopover({
  popoverId,
  isOpen,
  triggerRef,
  onClose,
  onOpenMergeDiff,
}: GitBranchPopoverProps) {
  const {
    project,
    createBranch,
    switchBranch,
    createSnapshot,
    setActiveView,
    setShowPortal,
    notify,
  } = useProject();

  const popoverRef = useRef<HTMLElement | null>(null);
  const [branchName, setBranchName] = useState('');
  const [branchDesc, setBranchDesc] = useState('');
  const [snapLabel, setSnapLabel] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      onClose();
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        triggerRef.current?.focus();
      }
    };
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const activeBranch = project.branches.find((b) => b.id === project.activeBranchId);
  const otherBranches = project.branches.filter((b) => b.id !== project.activeBranchId);
  const pendingCount = project.stagingProposals.filter((p) => p.status === 'pending').length;

  const handleCreateBranch = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = branchName.trim();
    if (!trimmed) return;
    createBranch(trimmed, branchDesc.trim() || 'Ramificação narrativa');
    notify(`Ramificação "${trimmed}" criada e ativada.`, 'success');
    setBranchName('');
    setBranchDesc('');
  };

  const handleCreateSnapshot = (e: FormEvent) => {
    e.preventDefault();
    const finalLabel = snapLabel.trim() || `Instantâneo (${new Date().toLocaleTimeString('pt-BR')})`;
    createSnapshot(finalLabel);
    notify(`Instantâneo "${finalLabel}" salvo.`, 'success');
    setSnapLabel('');
  };

  return (
    <section
      ref={popoverRef}
      id={popoverId}
      aria-label="Controle rápido de ramificações e instantâneos"
      style={panelStyle}
    >
      <div style={topHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <GitBranch size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <span style={activeNameStyle} title={activeBranch?.name ?? 'Principal'}>
            {activeBranch?.name ?? 'Principal'}
          </span>
        </div>
        <span style={countBadgeStyle}>
          {project.branches.length} {project.branches.length === 1 ? 'ramo' : 'ramos'} ·{' '}
          {project.snapshots.length} instant.
        </span>
      </div>

      <div style={branchListStyle}>
        {project.branches.map((branch) => {
          const isActive = branch.id === project.activeBranchId;
          return (
            <div key={branch.id} style={branchRowStyle(isActive)}>
              <button
                type="button"
                onClick={() => {
                  if (isActive) return;
                  switchBranch(branch.id);
                  notify(`Ramo ativo: ${branch.name}`, 'success');
                }}
                style={branchBtnStyle(isActive)}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {branch.name}
                </span>
                {isActive && (
                  <span style={activeChipStyle}>
                    <Check size={11} /> Ativo
                  </span>
                )}
              </button>

              {!isActive && (
                <button
                  type="button"
                  onClick={() => onOpenMergeDiff(branch.id)}
                  title={`Comparar e mesclar "${branch.name}" no ramo ativo`}
                  aria-label={`Comparar e mesclar ${branch.name}`}
                  style={rowMergeBtnStyle}
                >
                  <GitMerge size={12} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleCreateBranch} style={sectionFormStyle}>
        <span style={sectionLabelStyle}>Nova ramificação</span>
        <div style={{ display: 'flex', gap: 5 }}>
          <input
            type="text"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            placeholder="Nome do ramo..."
            aria-label="Nome da nova ramificação"
            style={inputStyle}
          />
          <button type="submit" disabled={!branchName.trim()} style={primaryMiniBtnStyle(!branchName.trim())}>
            <Plus size={12} /> Criar
          </button>
        </div>
        <input
          type="text"
          value={branchDesc}
          onChange={(e) => setBranchDesc(e.target.value)}
          placeholder="Descrição (opcional)"
          aria-label="Descrição opcional da ramificação"
          style={inputStyle}
        />
      </form>

      <form onSubmit={handleCreateSnapshot} style={sectionFormStyle}>
        <span style={sectionLabelStyle}>Instantâneo rápido</span>
        <div style={{ display: 'flex', gap: 5 }}>
          <input
            type="text"
            value={snapLabel}
            onChange={(e) => setSnapLabel(e.target.value)}
            placeholder="Rótulo do instantâneo..."
            aria-label="Rótulo do instantâneo"
            style={inputStyle}
          />
          <button type="submit" style={snapBtnStyle}>
            <Camera size={12} /> Salvar
          </button>
        </div>
      </form>

      <div style={footerSectionStyle}>
        <button
          type="button"
          disabled={otherBranches.length === 0}
          onClick={() => onOpenMergeDiff(otherBranches[0]?.id ?? '')}
          title={otherBranches.length === 0 ? 'Crie outra ramificação para comparar e mesclar' : 'Comparar e mesclar outra ramificação'}
          style={mergeTriggerBtnStyle(otherBranches.length === 0)}
        >
          <GitMerge size={13} style={{ color: 'var(--accent-primary)' }} />
          <span>Comparar / Mesclar...</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setShowPortal(false);
            setActiveView('versions');
            onClose();
          }}
          style={versionsLinkStyle}
        >
          <span>Abrir Controle de Versões &amp; Staging</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            {pendingCount > 0 && <span style={pendingBadgeStyle}>{pendingCount}</span>}
            <ExternalLink size={12} />
          </span>
        </button>
      </div>
    </section>
  );
}

const panelStyle: CSSProperties = {
  position: 'absolute', top: 'calc(100% + 6px)', right: 0, width: 'min(360px, calc(100vw - 24px))',
  maxHeight: 'min(78vh, 560px)', overflowY: 'auto', zIndex: 170, backgroundColor: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md, 8px)',
  boxShadow: '0 18px 40px rgba(0, 0, 0, 0.36)', color: 'var(--text-primary)', padding: 12,
  display: 'flex', flexDirection: 'column', gap: 10,
};
const topHeaderStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingBottom: 8, borderBottom: '1px solid var(--border-subtle)' };
const activeNameStyle: CSSProperties = { fontSize: 12.5, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const countBadgeStyle: CSSProperties = { fontSize: 10.5, fontWeight: 600, color: 'var(--text-secondary)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 999, padding: '2px 7px', whiteSpace: 'nowrap', flexShrink: 0 };
const branchListStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflowY: 'auto' };
const branchRowStyle = (isActive: boolean): CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px', borderRadius: 'var(--radius-sm, 6px)', backgroundColor: isActive ? 'var(--accent-soft)' : 'var(--bg-surface)', border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)' });
const branchBtnStyle = (isActive: boolean): CSSProperties => ({ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, background: 'transparent', color: 'var(--text-primary)', fontSize: 12, fontWeight: isActive ? 700 : 500, textAlign: 'left', padding: '2px 4px', cursor: isActive ? 'default' : 'pointer' });
const activeChipStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--accent-primary)', flexShrink: 0 };
const rowMergeBtnStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '4px 6px', borderRadius: 'var(--radius-sm, 6px)', backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' };
const sectionFormStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' };
const sectionLabelStyle: CSSProperties = { fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)' };
const inputStyle: CSSProperties = { flex: 1, minWidth: 0, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm, 6px)', padding: '5px 8px', fontSize: 11.5, color: 'var(--text-primary)' };
const primaryMiniBtnStyle = (disabled: boolean): CSSProperties => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 9px', borderRadius: 'var(--radius-sm, 6px)', backgroundColor: disabled ? 'var(--bg-hover)' : 'var(--accent-primary)', color: disabled ? 'var(--text-muted)' : '#ffffff', fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap', cursor: disabled ? 'not-allowed' : 'pointer' });
const snapBtnStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 9px', borderRadius: 'var(--radius-sm, 6px)', backgroundColor: '#10b981', color: '#ffffff', fontSize: 11.5, fontWeight: 600, whiteSpace: 'nowrap' };
const footerSectionStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' };
const mergeTriggerBtnStyle = (disabled: boolean): CSSProperties => ({ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '6px 10px', borderRadius: 'var(--radius-sm, 6px)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: disabled ? 'var(--text-muted)' : 'var(--text-primary)', fontSize: 12, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer' });
const versionsLinkStyle: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '5px 6px', borderRadius: 'var(--radius-sm, 6px)', backgroundColor: 'transparent', color: 'var(--accent-primary)', fontSize: 11.5, fontWeight: 600 };
const pendingBadgeStyle: CSSProperties = { backgroundColor: 'rgba(245, 158, 11, 0.18)', color: '#f59e0b', padding: '0 6px', borderRadius: 999, fontSize: 10, fontWeight: 700 };
