import { Plus, Trash2, BookOpen, Target, Layers } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { NARRATIVE_TEMPLATES } from '../../data/templatesCatalog';
import { DEFAULT_ACTS } from '../../data/defaultWorkspaceConfig';
import {
  sectionCardStyle,
  innerCardStyle,
  sectionHeaderStyle,
  fieldColumnStyle,
  fieldLabelTextStyle,
  controlInputStyle,
  secondaryButtonStyle,
  THEME_VAR,
} from '../settings/settingsStyles';

const ACT_COLOR_SWATCHES = ['#6366f1', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4'];

export function WorkspaceGeneralAndModelTab() {
  const { project, updateProject, updateWorkspaceConfig, applyTemplateToProject, requestConfirm, notify } =
    useProject();

  const acts =
    project.workspaceConfig?.acts && project.workspaceConfig.acts.length > 0
      ? [...project.workspaceConfig.acts].sort((a, b) => a.number - b.number)
      : DEFAULT_ACTS;

  const handleAddAct = () => {
    const nextNumber = acts.length > 0 ? Math.max(...acts.map((a) => a.number)) + 1 : 1;
    const color = ACT_COLOR_SWATCHES[(nextNumber - 1) % ACT_COLOR_SWATCHES.length];
    updateWorkspaceConfig((cfg) => ({
      ...cfg,
      acts: [
        ...(cfg.acts ?? DEFAULT_ACTS),
        {
          number: nextNumber,
          title: `Ato ${nextNumber} — Novo Movimento`,
          color,
          description: '',
        },
      ],
    }));
    notify(`Ato ${nextNumber} adicionado à estrutura do workspace.`, 'success');
  };

  const handleRemoveAct = async (actNumber: number) => {
    if (acts.length <= 1) {
      notify('O workspace precisa de pelo menos 1 ato ativo.', 'warning');
      return;
    }
    const scenesInAct = project.scenes.filter((s) => s.act === actNumber).length;
    if (scenesInAct > 0) {
      const ok = await requestConfirm({
        title: `Remover Ato ${actNumber}`,
        message: `Existem ${scenesInAct} cenas atribuídas a este ato. Elas serão movidas automaticamente para o Ato 1.`,
        confirmLabel: 'Mover cenas e remover',
        cancelLabel: 'Cancelar',
        tone: 'danger',
      });
      if (!ok) return;
      const fallbackAct = acts.find((a) => a.number !== actNumber)?.number ?? 1;
      updateProject((prev) => ({
        ...prev,
        scenes: prev.scenes.map((s) => (s.act === actNumber ? { ...s, act: fallbackAct } : s)),
        workspaceConfig: {
          ...(prev.workspaceConfig!),
          acts: (prev.workspaceConfig?.acts ?? DEFAULT_ACTS).filter((a) => a.number !== actNumber),
        },
      }));
      return;
    }
    updateWorkspaceConfig((cfg) => ({
      ...cfg,
      acts: (cfg.acts ?? DEFAULT_ACTS).filter((a) => a.number !== actNumber),
    }));
  };

  const handleTemplateSwitch = async (templateId: string) => {
    const tpl = NARRATIVE_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    const ok = await requestConfirm({
      title: `Aplicar Modelo "${tpl.name}"`,
      message:
        'Aplicar este modelo estrutural atualizará o contorno do projeto com as batidas padrão do template. O texto já escrito nas cenas do manuscrito será preservado.',
      confirmLabel: 'Aplicar Estrutura',
      cancelLabel: 'Cancelar',
    });
    if (!ok) return;
    applyTemplateToProject(tpl, false);
    updateWorkspaceConfig((cfg) => ({ ...cfg, activeTemplateId: tpl.id }));
    notify(`Modelo "${tpl.name}" vinculado ao workspace.`, 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <BookOpen size={16} style={{ color: THEME_VAR.accentPrimary }} />
          Identidade do Workspace
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.85rem',
          }}
        >
          <label style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>Título do Livro / Workspace</span>
            <input
              value={project.title}
              onChange={(e) => updateProject((p) => ({ ...p, title: e.target.value }))}
              style={controlInputStyle}
            />
          </label>
          <label style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>Gênero / Tom</span>
            <input
              value={project.genre}
              onChange={(e) => updateProject((p) => ({ ...p, genre: e.target.value }))}
              style={controlInputStyle}
            />
          </label>
          <label style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>Coleção / Tag no Meu Espaço</span>
            <input
              value={project.folderOrTag ?? ''}
              placeholder="Ex: Trilogia Principal"
              onChange={(e) => updateProject((p) => ({ ...p, folderOrTag: e.target.value }))}
              style={controlInputStyle}
            />
          </label>
        </div>

        <label style={fieldColumnStyle}>
          <span style={fieldLabelTextStyle}>Logline / Premissa Central</span>
          <textarea
            rows={2}
            value={project.logline}
            onChange={(e) => updateProject((p) => ({ ...p, logline: e.target.value }))}
            style={{ ...controlInputStyle, resize: 'vertical' }}
          />
        </label>
      </section>

      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <Target size={16} style={{ color: THEME_VAR.accentPrimary }} />
          Metas & Perfil Editorial
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '0.85rem',
          }}
        >
          <label style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>Meta Total de Palavras</span>
            <input
              type="number"
              min={500}
              value={project.wordCountGoal}
              onChange={(e) =>
                updateProject((p) => ({
                  ...p,
                  wordCountGoal: Math.max(500, Number(e.target.value) || 0),
                }))
              }
              style={controlInputStyle}
            />
          </label>
          <label style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>Meta Diária</span>
            <input
              type="number"
              min={50}
              value={project.dailyWordGoal}
              onChange={(e) =>
                updateProject((p) => ({
                  ...p,
                  dailyWordGoal: Math.max(50, Number(e.target.value) || 0),
                }))
              }
              style={controlInputStyle}
            />
          </label>
          <label style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>Meta Semanal</span>
            <input
              type="number"
              min={200}
              value={project.weeklyWordGoal}
              onChange={(e) =>
                updateProject((p) => ({
                  ...p,
                  weeklyWordGoal: Math.max(200, Number(e.target.value) || 0),
                }))
              }
              style={controlInputStyle}
            />
          </label>
          <label style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>Nome do Autor (Compilação)</span>
            <input
              value={project.compileProfile.authorName}
              onChange={(e) =>
                updateProject((p) => ({
                  ...p,
                  compileProfile: { ...p.compileProfile, authorName: e.target.value },
                }))
              }
              style={controlInputStyle}
            />
          </label>
        </div>
      </section>

      <section style={sectionCardStyle}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.6rem',
          }}
        >
          <div style={sectionHeaderStyle}>
            <Layers size={16} style={{ color: THEME_VAR.accentPrimary }} />
            Modelo Narrativo & Atos do Workspace ({acts.length})
          </div>
          <button type="button" onClick={handleAddAct} style={secondaryButtonStyle}>
            <Plus size={14} /> Adicionar Ato
          </button>
        </div>

        <div style={innerCardStyle}>
          <label style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>Modelo Estrutural Base</span>
            <select
              value={project.workspaceConfig?.activeTemplateId ?? ''}
              onChange={(e) => {
                if (e.target.value) {
                  void handleTemplateSwitch(e.target.value);
                }
              }}
              style={controlInputStyle}
            >
              <option value="">Personalizado / Estrutura Atual</option>
              {NARRATIVE_TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name} ({tpl.category})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {acts.map((act) => (
            <div
              key={act.number}
              style={{
                ...innerCardStyle,
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 999,
                  backgroundColor: `${act.color}22`,
                  color: act.color,
                  minWidth: 52,
                  textAlign: 'center',
                }}
              >
                Ato {act.number}
              </span>
              <input
                type="color"
                value={act.color}
                onChange={(e) =>
                  updateWorkspaceConfig((cfg) => ({
                    ...cfg,
                    acts: (cfg.acts ?? DEFAULT_ACTS).map((item) =>
                      item.number === act.number ? { ...item, color: e.target.value } : item
                    ),
                  }))
                }
                title="Cor do ato"
                style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer' }}
              />
              <input
                value={act.title}
                onChange={(e) =>
                  updateWorkspaceConfig((cfg) => ({
                    ...cfg,
                    acts: (cfg.acts ?? DEFAULT_ACTS).map((item) =>
                      item.number === act.number ? { ...item, title: e.target.value } : item
                    ),
                  }))
                }
                aria-label={`Título do Ato ${act.number}`}
                style={{ ...controlInputStyle, flex: 1, minWidth: 200 }}
              />
              <button
                type="button"
                onClick={() => void handleRemoveAct(act.number)}
                title={`Remover Ato ${act.number}`}
                style={{ ...secondaryButtonStyle, color: '#ef4444', padding: '0.4rem 0.6rem' }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
