import { useRef, useState } from 'react';
import { Blocks, Puzzle, Upload, Trash2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import {
  installOrUpdatePlugin,
  listConfigurableModules,
  togglePluginEnabled,
  uninstallPlugin,
  validatePluginManifest,
} from '../../domain/registry';
import { DynamicFieldRenderer } from '../common/DynamicFieldRenderer';
import {
  sectionCardStyle,
  innerCardStyle,
  sectionHeaderStyle,
  secondaryButtonStyle,
  THEME_VAR,
} from '../settings/settingsStyles';

export function WorkspaceModulesAndPluginsTab() {
  const { project, updateWorkspaceConfig, notify } = useProject();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [expandedPluginId, setExpandedPluginId] = useState<string | null>(null);

  const disabledModules = project.workspaceConfig?.disabledModules ?? [];
  const modules = listConfigurableModules();
  const plugins = project.workspaceConfig?.plugins ?? [];

  const toggleModule = (moduleId: string, enable: boolean) => {
    updateWorkspaceConfig((cfg) => {
      const next = new Set(cfg.disabledModules ?? []);
      if (enable) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return { ...cfg, disabledModules: Array.from(next) };
    });
  };

  const handleImportPluginFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const res = validatePluginManifest(parsed);
        if (!res.ok || !res.manifest) {
          notify(res.error ?? 'Manifesto de plugin inválido.', 'warning');
          return;
        }
        const manifest = res.manifest;
        updateWorkspaceConfig((cfg) => installOrUpdatePlugin(cfg, manifest));
        notify(`Plugin "${manifest.name}" instalado neste workspace.`, 'success');
      } catch {
        notify('Não foi possível ler o arquivo JSON do plugin.', 'warning');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
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
            <Puzzle size={16} style={{ color: THEME_VAR.accentPrimary }} />
            Plugins Declarativos do Workspace ({plugins.filter((p) => p.enabled).length} ativos)
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.inkplugin.json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportPluginFile(file);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={secondaryButtonStyle}
            >
              <Upload size={14} /> Importar .inkplugin.json
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {plugins.map((plugin) => (
            <div
              key={plugin.id}
              style={{
                ...innerCardStyle,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.55rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: THEME_VAR.textPrimary }}>
                      {plugin.name}
                    </span>
                    <span style={{ fontSize: 11, color: THEME_VAR.textMuted }}>
                      v{plugin.version}
                    </span>
                    {plugin.isBuiltinSample && (
                      <span
                        style={{
                          fontSize: 10,
                          padding: '1px 6px',
                          borderRadius: 999,
                          backgroundColor: THEME_VAR.accentSoft,
                          color: THEME_VAR.accentPrimary,
                        }}
                      >
                        Nativo
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: THEME_VAR.textSecondary, marginTop: 2 }}>
                    {plugin.description}
                  </div>
                  <div style={{ fontSize: 11, color: THEME_VAR.textMuted, marginTop: 4 }}>
                    {plugin.entityTypes?.length ? `${plugin.entityTypes.length} tipo(s) · ` : ''}
                    {plugin.fieldExtensions?.length
                      ? `${plugin.fieldExtensions.length} extensão(ões) de ficha · `
                      : ''}
                    {plugin.snippets?.length ? `${plugin.snippets.length} snippet(s) · ` : ''}
                    {plugin.consistencyRules?.length
                      ? `${plugin.consistencyRules.length} regra(s)`
                      : 'Esquema modular'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {plugin.settingsSchema && plugin.settingsSchema.length > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedPluginId((cur) => (cur === plugin.id ? null : plugin.id))
                      }
                      style={secondaryButtonStyle}
                    >
                      Ajustes
                    </button>
                  )}
                  {!plugin.isBuiltinSample && (
                    <button
                      type="button"
                      onClick={() => {
                        updateWorkspaceConfig((cfg) => uninstallPlugin(cfg, plugin.id));
                        notify(`Plugin "${plugin.name}" removido.`, 'info');
                      }}
                      style={{ ...secondaryButtonStyle, color: '#ef4444' }}
                      title="Desinstalar plugin"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={plugin.enabled}
                      onChange={(e) => {
                        updateWorkspaceConfig((cfg) =>
                          togglePluginEnabled(cfg, plugin.id, e.target.checked)
                        );
                        notify(
                          `${plugin.name} ${e.target.checked ? 'ativado' : 'desativado'} neste workspace.`,
                          'info'
                        );
                      }}
                    />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>
                      {plugin.enabled ? 'Ativo' : 'Inativo'}
                    </span>
                  </label>
                </div>
              </div>

              {expandedPluginId === plugin.id && plugin.settingsSchema && (
                <DynamicFieldRenderer
                  title={`Configurações de ${plugin.name}`}
                  fields={plugin.settingsSchema}
                  values={plugin.settingsValues ?? {}}
                  onChange={(nextValues) =>
                    updateWorkspaceConfig((cfg) => ({
                      ...cfg,
                      plugins: cfg.plugins.map((p) =>
                        p.id === plugin.id ? { ...p, settingsValues: nextValues } : p
                      ),
                    }))
                  }
                />
              )}
            </div>
          ))}
        </div>
      </section>

      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <Blocks size={16} style={{ color: THEME_VAR.accentPrimary }} />
          Módulos Visíveis neste Workspace
        </div>
        <div style={{ fontSize: 12, color: THEME_VAR.textSecondary }}>
          Oculte ferramentas que este livro não precisa sem perder nenhum dado salvo. Manuscrito e Painel permanecem sempre ativos.
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '0.55rem',
          }}
        >
          {modules.map((mod) => {
            const enabled = mod.essential || !disabledModules.includes(mod.id);
            return (
              <label
                key={mod.id}
                style={{
                  ...innerCardStyle,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  cursor: mod.essential ? 'not-allowed' : 'pointer',
                  opacity: mod.essential ? 0.78 : 1,
                }}
              >
                <input
                  type="checkbox"
                  disabled={mod.essential}
                  checked={enabled}
                  onChange={(e) => toggleModule(mod.id, e.target.checked)}
                  style={{ marginTop: 2 }}
                />
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: THEME_VAR.textPrimary }}>
                    {mod.label} {mod.essential ? '(Essencial)' : ''}
                  </div>
                  <div style={{ fontSize: 11, color: THEME_VAR.textSecondary }}>{mod.description}</div>
                </div>
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );
}
