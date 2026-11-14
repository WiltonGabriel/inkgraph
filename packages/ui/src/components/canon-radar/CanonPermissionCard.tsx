import { ShieldCheck, ArrowUpRight, Sliders } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { CanonAiPermission } from '../../types/project';
import {
  canonCardStyle,
  canonCardHeaderStyle,
  canonCardTitleStyle,
  canonLinkBtnStyle,
} from './canonRadarStyles';

const PERMISSION_MODES: {
  id: CanonAiPermission;
  label: string;
  desc: string;
}[] = [
  {
    id: 'observer',
    label: '1. Somente Visão / Observador',
    desc: 'Apenas destaca citações inéditas e furos sem escrever em Staging nem alterar o cânone.',
  },
  {
    id: 'staging',
    label: '2. Rascunho Automático (Staging)',
    desc: 'Gera fichas candidatas YAML+Markdown em ./workspace/staging/ para revisão humana.',
  },
  {
    id: 'auto',
    label: '3. Auto-Catalogar Universo',
    desc: 'Cria fichas provisórias e restaura vínculos de cenas automaticamente (sem nunca reescrever a prosa literária do autor).',
  },
];

type CanonScopeKey =
  | 'canonScopeEntities'
  | 'canonScopeWorld'
  | 'canonScopeGraphTimeline';

const SCAN_SCOPES: { key: CanonScopeKey; label: string }[] = [
  {
    key: 'canonScopeEntities',
    label: 'Entidades & Elenco (Personagens, Facções, Objetos)',
  },
  {
    key: 'canonScopeWorld',
    label: 'Mundo & Construção Mundial (Locais, Sistemas, Atlas)',
  },
  {
    key: 'canonScopeGraphTimeline',
    label: 'Grafo, Cronologia & Epistemologia (Vínculos de Cena & Vazamentos)',
  },
];

interface CanonPermissionCardProps {
  onOpenAiSettings: () => void;
}

export function CanonPermissionCard({ onOpenAiSettings }: CanonPermissionCardProps) {
  const { settings, updateSettings, notify } = useProject();

  const handleSelectMode = (mode: (typeof PERMISSION_MODES)[number]) => {
    if (settings.canonAiPermission === mode.id) return;
    updateSettings((prev) => ({ ...prev, canonAiPermission: mode.id }));
    notify(`Permissão IA alterada para: ${mode.label}`, 'info');
  };

  const handleToggleScope = (key: CanonScopeKey, label: string) => {
    const nextValue = !settings[key];
    updateSettings((prev) => ({ ...prev, [key]: nextValue }));
    notify(
      `${label}: ${nextValue ? 'ativado na varredura' : 'pausado na varredura'}.`,
      'info'
    );
  };

  return (
    <section style={canonCardStyle}>
      <div style={canonCardHeaderStyle}>
        <span style={canonCardTitleStyle}>
          <ShieldCheck size={15} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
          Permissão de IA & Escopo
        </span>
        <button type="button" onClick={onOpenAiSettings} style={canonLinkBtnStyle}>
          Abrir IA & MCP <ArrowUpRight size={12} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {PERMISSION_MODES.map((mode) => {
          const isActive = settings.canonAiPermission === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              onClick={() => handleSelectMode(mode)}
              aria-pressed={isActive}
              style={{
                textAlign: 'left',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm, 6px)',
                backgroundColor: isActive
                  ? 'var(--accent-soft, rgba(59, 130, 246, 0.14))'
                  : 'var(--bg-elevated, var(--bg-card, #171d2e))',
                border: isActive
                  ? '1px solid var(--accent-primary, #3b82f6)'
                  : '1px solid var(--border-subtle, var(--border, #263046))',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 2,
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: isActive
                      ? 'var(--accent-primary, #3b82f6)'
                      : 'var(--text-primary, #f1f5f9)',
                  }}
                >
                  {mode.label}
                </span>
                {isActive && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 999,
                      backgroundColor: 'var(--accent-primary, #3b82f6)',
                      color: '#ffffff',
                      flexShrink: 0,
                    }}
                  >
                    Ativo
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-secondary, #94a3b8)', lineHeight: 1.4 }}>
                {mode.desc}
              </div>
            </button>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 2,
          paddingTop: 10,
          borderTop: '1px solid var(--border-subtle, var(--border, #263046))',
          display: 'flex',
          flexDirection: 'column',
          gap: 7,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 11.5,
            fontWeight: 700,
            color: 'var(--text-primary, #f1f5f9)',
          }}
        >
          <Sliders size={12} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
          <span>Escopos Granulares de Varredura</span>
        </div>

        {SCAN_SCOPES.map((scope) => (
          <label
            key={scope.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 9px',
              borderRadius: 'var(--radius-sm, 6px)',
              backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
              border: '1px solid var(--border-subtle, var(--border, #263046))',
              fontSize: 11.5,
              color: 'var(--text-primary, #f1f5f9)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={settings[scope.key]}
              onChange={() => handleToggleScope(scope.key, scope.label)}
              style={{ accentColor: 'var(--accent-primary, #3b82f6)', cursor: 'pointer' }}
            />
            <span>{scope.label}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
