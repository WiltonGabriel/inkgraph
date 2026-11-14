import { useState } from 'react';
import { Cpu, Plus, Trash2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { useViewport } from '../../hooks/useViewport';
import { scoreRuleSystemMaturity } from '../../domain/canonScoreCalculator';
import type { CanonStatus, RuleSystem, World } from '../../types/project';
import { CanonBadgePill, worldStyles } from './WorldScoreChecklistBanner';

export function WorldSystemsTab({ world, onUpdateWorld }: { world: World; onUpdateWorld: (next: World) => void }) {
  const { project, requestConfirm, notify } = useProject();
  const { width } = useViewport();
  const isNarrow = width < 820;

  const [name, setName] = useState('');
  const [subtype, setSubtype] = useState('Sistema de Magia');
  const [coreSource, setCoreSource] = useState('');
  const [rulesText, setRulesText] = useState('');
  const [costsAndToll, setCostsAndToll] = useState('');
  const [limitsText, setLimitsText] = useState('');
  const [socialTaboos, setSocialTaboos] = useState('');

  const handleAddSystem = () => {
    if (!name.trim()) return;
    const newSys: RuleSystem = {
      id: `sys_${Date.now()}`,
      worldId: world.id,
      name: name.trim(),
      subtype: subtype.trim() || 'Sistema de Regras',
      status: 'canon',
      coreSource: coreSource.trim(),
      fundamentalRules: rulesText.split('\n').map((r) => r.trim()).filter(Boolean),
      costsAndToll: costsAndToll.trim(),
      hardLimits: limitsText.split('\n').map((l) => l.trim()).filter(Boolean),
      socialTaboos: socialTaboos.trim(),
      knownPractitionerIds: [],
      notes: '',
    };
    onUpdateWorld({ ...world, systems: [...world.systems, newSys] });
    setName('');
    setCoreSource('');
    setRulesText('');
    setCostsAndToll('');
    setLimitsText('');
    setSocialTaboos('');
    notify(`Sistema "${newSys.name}" adicionado ao mundo.`, 'success');
  };

  const handleUpdateSystem = (sysId: string, patch: Partial<RuleSystem>) => {
    onUpdateWorld({
      ...world,
      systems: world.systems.map((s) => (s.id === sysId ? { ...s, ...patch } : s)),
    });
  };

  const handleDeleteSystem = async (sys: RuleSystem) => {
    const confirmed = await requestConfirm({
      title: 'Excluir sistema de regras',
      message: `Deseja remover "${sys.name}" do catálogo de sistemas do mundo?`,
      confirmLabel: 'Excluir',
      cancelLabel: 'Cancelar',
      tone: 'danger',
    });
    if (!confirmed) return;
    onUpdateWorld({ ...world, systems: world.systems.filter((s) => s.id !== sys.id) });
    notify(`Sistema "${sys.name}" removido.`, 'info');
  };

  const togglePractitioner = (sys: RuleSystem, charId: string) => {
    const exists = sys.knownPractitionerIds.includes(charId);
    handleUpdateSystem(sys.id, {
      knownPractitionerIds: exists
        ? sys.knownPractitionerIds.filter((id) => id !== charId)
        : [...sys.knownPractitionerIds, charId],
    });
  };

  return (
    <div style={{ maxWidth: 940, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={worldStyles.card}>
        <label htmlFor="world-magic-tech-summary" style={{ ...worldStyles.label, marginBottom: 0, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Cpu size={14} color="var(--accent-primary, #3b82f6)" />
          Leis Naturais, Magia ou Tecnologia (Resumo do Universo)
        </label>
        <textarea
          id="world-magic-tech-summary"
          rows={3}
          value={world.magicOrTechSummary}
          onChange={(e) => onUpdateWorld({ ...world, magicOrTechSummary: e.target.value })}
          placeholder="Descreva as forças fundamentais, matrizes tecnológicas, sistemas jurídicos ou princípios físicos que governam este mundo..."
          style={worldStyles.textarea}
        />
      </div>

      {world.systems.map((sys) => {
        const badge = scoreRuleSystemMaturity(sys);
        return (
          <div key={sys.id} style={worldStyles.card}>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', flex: 1, flexWrap: 'wrap', alignItems: 'center', gap: 8, minWidth: 220 }}>
                <input aria-label={`Nome do sistema ${sys.name}`} value={sys.name} onChange={(e) => handleUpdateSystem(sys.id, { name: e.target.value })} style={{ ...worldStyles.input, flex: 1, minWidth: 180, fontWeight: 700, fontSize: 14.5 }} />
                <input aria-label={`Subtipo de ${sys.name}`} value={sys.subtype} onChange={(e) => handleUpdateSystem(sys.id, { subtype: e.target.value })} style={{ ...worldStyles.input, width: 180 }} />
                <select aria-label={`Status canônico de ${sys.name}`} value={sys.status ?? 'canon'} onChange={(e) => handleUpdateSystem(sys.id, { status: e.target.value as CanonStatus })} style={{ ...worldStyles.input, width: 130 }}>
                  <option value="canon">Cânone</option>
                  <option value="provisional">Provisório</option>
                  <option value="draft">Rascunho</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CanonBadgePill badge={badge} />
                <button type="button" onClick={() => handleDeleteSystem(sys)} aria-label={`Excluir sistema ${sys.name}`} style={worldStyles.dangerBtn}>
                  <Trash2 size={13} /> Excluir
                </button>
              </div>
            </div>

            {badge.missingItems.length > 0 && (
              <div style={{ padding: '6px 10px', borderRadius: 'var(--radius-sm, 6px)', backgroundColor: 'var(--bg-elevated, #171d2e)', borderLeft: `3px solid ${badge.color}`, fontSize: 11.5, color: 'var(--text-secondary, #94a3b8)' }}>
                Para 10/10: {badge.missingItems.join(' · ')}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: 10 }}>
              <div>
                <label htmlFor={`sys-source-${sys.id}`} style={worldStyles.label}>Fonte Primária / Fundamento</label>
                <input id={`sys-source-${sys.id}`} value={sys.coreSource} onChange={(e) => handleUpdateSystem(sys.id, { coreSource: e.target.value })} style={worldStyles.input} />
              </div>
              <div>
                <label htmlFor={`sys-cost-${sys.id}`} style={worldStyles.label}>Custos, Restrições & Pedágio</label>
                <input id={`sys-cost-${sys.id}`} value={sys.costsAndToll} onChange={(e) => handleUpdateSystem(sys.id, { costsAndToll: e.target.value })} style={worldStyles.input} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: 10 }}>
              <div>
                <label htmlFor={`sys-rules-${sys.id}`} style={worldStyles.label}>Leis Fundamentais (uma por linha)</label>
                <textarea
                  id={`sys-rules-${sys.id}`}
                  rows={3}
                  value={sys.fundamentalRules.join('\n')}
                  onChange={(e) => handleUpdateSystem(sys.id, { fundamentalRules: e.target.value.trim() ? e.target.value.split('\n') : [] })}
                  onBlur={() => handleUpdateSystem(sys.id, { fundamentalRules: sys.fundamentalRules.map((r) => r.trim()).filter(Boolean) })}
                  style={worldStyles.textarea}
                />
              </div>
              <div>
                <label htmlFor={`sys-limits-${sys.id}`} style={worldStyles.label}>Limites Absolutos (um por linha)</label>
                <textarea
                  id={`sys-limits-${sys.id}`}
                  rows={3}
                  value={sys.hardLimits.join('\n')}
                  onChange={(e) => handleUpdateSystem(sys.id, { hardLimits: e.target.value.trim() ? e.target.value.split('\n') : [] })}
                  onBlur={() => handleUpdateSystem(sys.id, { hardLimits: sys.hardLimits.map((l) => l.trim()).filter(Boolean) })}
                  style={worldStyles.textarea}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: 10 }}>
              <div>
                <label htmlFor={`sys-taboos-${sys.id}`} style={worldStyles.label}>Tabus Sociais & Sanções Legais</label>
                <input id={`sys-taboos-${sys.id}`} value={sys.socialTaboos} onChange={(e) => handleUpdateSystem(sys.id, { socialTaboos: e.target.value })} placeholder="Práticas proibidas, crimes capitais ou estigmas sociais..." style={worldStyles.input} />
              </div>
              <div>
                <label htmlFor={`sys-notes-${sys.id}`} style={worldStyles.label}>Notas & Exceções Canônicas</label>
                <input id={`sys-notes-${sys.id}`} value={sys.notes} onChange={(e) => handleUpdateSystem(sys.id, { notes: e.target.value })} placeholder="Observações de consistência..." style={worldStyles.input} />
              </div>
            </div>

            {project.characters.length > 0 && (
              <div>
                <span style={worldStyles.label}>Praticantes / Usuários Conhecidos</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {project.characters.map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      aria-pressed={sys.knownPractitionerIds.includes(ch.id)}
                      onClick={() => togglePractitioner(sys, ch.id)}
                      style={worldStyles.chip(sys.knownPractitionerIds.includes(ch.id))}
                    >
                      {ch.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      <div style={worldStyles.card}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
          + Novo Sistema de Regras (Magia, Tecnologia, Código Legal ou Economia)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: 10 }}>
          <input aria-label="Nome do novo sistema" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do sistema..." style={worldStyles.input} />
          <input aria-label="Subtipo do novo sistema" value={subtype} onChange={(e) => setSubtype(e.target.value)} placeholder="Subtipo (ex.: Magia, Cyberware, Direito)..." style={worldStyles.input} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: 10 }}>
          <input aria-label="Fonte primária do novo sistema" value={coreSource} onChange={(e) => setCoreSource(e.target.value)} placeholder="Fonte primária / origem..." style={worldStyles.input} />
          <input aria-label="Custos e pedágio do novo sistema" value={costsAndToll} onChange={(e) => setCostsAndToll(e.target.value)} placeholder="Pedágio e custo de uso..." style={worldStyles.input} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isNarrow ? '1fr' : '1fr 1fr', gap: 10 }}>
          <textarea aria-label="Leis fundamentais do novo sistema" rows={2} value={rulesText} onChange={(e) => setRulesText(e.target.value)} placeholder="Leis fundamentais (uma por linha)..." style={worldStyles.textarea} />
          <textarea aria-label="Limites absolutos do novo sistema" rows={2} value={limitsText} onChange={(e) => setLimitsText(e.target.value)} placeholder="Limites intransponíveis (um por linha)..." style={worldStyles.textarea} />
        </div>
        <input aria-label="Tabus sociais do novo sistema" value={socialTaboos} onChange={(e) => setSocialTaboos(e.target.value)} placeholder="Tabus sociais ou sanções legais associadas..." style={worldStyles.input} />
        <button type="button" onClick={handleAddSystem} style={{ ...worldStyles.primaryBtn, alignSelf: 'flex-start', backgroundColor: '#10b981', color: '#052e16' }}>
          <Plus size={14} /> Adicionar Sistema
        </button>
      </div>
    </div>
  );
}
