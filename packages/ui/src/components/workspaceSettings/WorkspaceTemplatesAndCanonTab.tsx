import { useRef, useState } from 'react';
import { ShieldCheck, Download, Upload } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  exportWorkspaceTemplateBundle,
  parseWorkspaceTemplateBundle,
} from '../../domain/registry';
import {
  sectionCardStyle,
  sectionHeaderStyle,
  fieldColumnStyle,
  fieldLabelTextStyle,
  controlInputStyle,
  checkboxLabelStyle,
  checkboxInputStyle,
  secondaryButtonStyle,
  primaryButtonStyle,
  THEME_VAR,
} from '../settings/settingsStyles';

export function WorkspaceTemplatesAndCanonTab() {
  const { project, updateProject, updateWorkspaceConfig, requestConfirm, notify } = useProject();
  const importRef = useRef<HTMLInputElement | null>(null);
  const [templateName, setTemplateName] = useState(`${project.title} — Modelo`);
  const [templateDesc, setTemplateDesc] = useState('');

  const canon = project.workspaceConfig?.canonSettings ?? {
    requireStagingForCopilot: true,
    autoTrackEpistemic: true,
    strictEntityRefs: true,
  };

  const handleExportTemplate = () => {
    const bundle = exportWorkspaceTemplateBundle(project, templateName, templateDesc);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeSlug = (templateName || 'modelo').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.download = `${safeSlug}.inktemplate.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('Modelo do workspace exportado em .inktemplate.json.', 'success');
  };

  const handleImportTemplate = (file: File) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const res = parseWorkspaceTemplateBundle(parsed);
        if (!res.ok || !res.bundle) {
          notify(res.error ?? 'Arquivo de modelo inválido.', 'warning');
          return;
        }
        const ok = await requestConfirm({
          title: `Aplicar Modelo "${res.bundle.name}"`,
          message:
            'Isso aplicará os atos, módulos, esquemas de entidades e plugins deste modelo ao workspace atual, preservando seus textos e entidades existentes.',
          confirmLabel: 'Aplicar Modelo',
          cancelLabel: 'Cancelar',
        });
        if (!ok) return;
        updateProject((prev) => ({
          ...prev,
          workspaceConfig: res.bundle!.workspaceConfig,
          compileProfile: { ...prev.compileProfile, ...res.bundle!.compileProfile },
        }));
        notify(`Modelo "${res.bundle.name}" aplicado ao workspace.`, 'success');
      } catch {
        notify('Falha ao interpretar o arquivo .inktemplate.json.', 'warning');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <ShieldCheck size={16} style={{ color: THEME_VAR.accentPrimary }} />
          Regras de Cânone & Segurança Epistêmica do Workspace
        </div>

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={canon.requireStagingForCopilot}
            onChange={(e) =>
              updateWorkspaceConfig((cfg) => ({
                ...cfg,
                canonSettings: { ...canon, requireStagingForCopilot: e.target.checked },
              }))
            }
            style={checkboxInputStyle}
          />
          Exigir aprovação na fila de Staging para propostas assistidas de lore e cena
        </label>

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={canon.autoTrackEpistemic}
            onChange={(e) =>
              updateWorkspaceConfig((cfg) => ({
                ...cfg,
                canonSettings: { ...canon, autoTrackEpistemic: e.target.checked },
              }))
            }
            style={checkboxInputStyle}
          />
          Rastrear automaticamente segredos e estado epistêmico (Autor vs. Leitor vs. Personagem)
        </label>

        <label style={checkboxLabelStyle}>
          <input
            type="checkbox"
            checked={canon.strictEntityRefs}
            onChange={(e) =>
              updateWorkspaceConfig((cfg) => ({
                ...cfg,
                canonSettings: { ...canon, strictEntityRefs: e.target.checked },
              }))
            }
            style={checkboxInputStyle}
          />
          Alertar em Consistência quando menções @ apontarem para entidades inexistentes
        </label>
      </section>

      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <Download size={16} style={{ color: THEME_VAR.accentPrimary }} />
          Exportar & Importar Modelo de Workspace (.inktemplate.json)
        </div>
        <div style={{ fontSize: 12, color: THEME_VAR.textSecondary }}>
          Salve toda a arquitetura deste workspace (atos, tipos de entidades customizados, módulos ativos e plugins) para reutilizar em novos livros ou compartilhar.
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem',
          }}
        >
          <label style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>Nome do Modelo Exportado</span>
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              style={controlInputStyle}
            />
          </label>
          <label style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>Descrição</span>
            <input
              value={templateDesc}
              onChange={(e) => setTemplateDesc(e.target.value)}
              placeholder="Ex: Estrutura de 4 atos + ficha LitRPG"
              style={controlInputStyle}
            />
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button type="button" onClick={handleExportTemplate} style={primaryButtonStyle}>
            <Download size={14} /> Exportar Modelo (.inktemplate.json)
          </button>
          <input
            ref={importRef}
            type="file"
            accept=".json,.inktemplate.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImportTemplate(file);
              e.target.value = '';
            }}
          />
          <button
            type="button"
            onClick={() => importRef.current?.click()}
            style={secondaryButtonStyle}
          >
            <Upload size={14} /> Importar Modelo para este Workspace
          </button>
        </div>
      </section>
    </div>
  );
}
