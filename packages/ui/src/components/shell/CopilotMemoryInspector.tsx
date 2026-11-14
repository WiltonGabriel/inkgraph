import { AlertTriangle, Cloud, Layers, ShieldCheck, WifiOff } from 'lucide-react';
import type {
  CompiledMemoryLayer,
  CompiledMemoryPacket,
  MemoryLayerId,
} from '../../domain/memoryCompiler';
import type { CanonAiPermission } from '../../types/project';
import { CopilotMemoryLayerCard } from './CopilotMemoryLayerCard';
import { CopilotPromptPreview } from './CopilotPromptPreview';
import { COPILOT_VAR, TONE } from './CopilotThemeStyles';

export interface CopilotMemoryInspectorProps {
  packet: CompiledMemoryPacket;
  memoryEnabled: boolean;
  onToggleMemory?: (enabled: boolean) => void;
}

const PERMISSION_LABELS: Record<CanonAiPermission, string> = {
  observer: 'Observador',
  staging: 'Staging',
  auto: 'Auto-Catalogar',
};

const CANONICAL_LAYERS: { id: MemoryLayerId; fallbackLabel: string }[] = [
  { id: 'immediate', fallbackLabel: '1. Memória de Trabalho (Cena & POV)' },
  { id: 'epistemic', fallbackLabel: '2. Memória Episódica & Epistêmica' },
  { id: 'world_canon', fallbackLabel: '3. Memória Semântica (Mundo & Cânone)' },
  { id: 'rolling_summary', fallbackLabel: '4. Síntese Contínua & Voz (Procedural)' },
];

export function CopilotMemoryInspector({
  packet,
  memoryEnabled,
  onToggleMemory,
}: CopilotMemoryInspectorProps) {
  const usagePct =
    packet.budgetTokens > 0
      ? Math.min(100, Math.round((packet.totalEstimatedTokens / packet.budgetTokens) * 100))
      : 0;
  const barColor =
    usagePct >= 95 ? '#ef4444' : usagePct >= 80 ? '#d97706' : COPILOT_VAR.accentPrimary;

  const resolvedLayers: CompiledMemoryLayer[] = CANONICAL_LAYERS.map((spec) => {
    const found = packet.layers.find((layer) => layer.id === spec.id);
    return found ?? { id: spec.id, label: spec.fallbackLabel, estimatedTokens: 0, items: [] };
  });

  const pillStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 8px',
    borderRadius: 999,
    fontSize: 10.5,
    fontWeight: 600,
  } as const;

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Privacy / Execution & Canon Permission Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <span
          style={{
            ...pillStyle,
            backgroundColor: packet.cloudAllowed ? COPILOT_VAR.accentSoft : TONE.successBg,
            border: `1px solid ${packet.cloudAllowed ? 'color-mix(in srgb, var(--accent-primary, #3b82f6) 35%, transparent)' : TONE.successBorder}`,
            color: packet.cloudAllowed ? COPILOT_VAR.accentPrimary : TONE.successText,
          }}
        >
          {packet.cloudAllowed ? <Cloud size={11} /> : <WifiOff size={11} />}
          {packet.cloudAllowed ? 'Modo Nuvem/Híbrido' : '100% Local / Offline'}
        </span>

        <span
          style={{
            ...pillStyle,
            gap: 4,
            backgroundColor: COPILOT_VAR.bgElevated,
            border: `1px solid ${COPILOT_VAR.borderSubtle}`,
            color: COPILOT_VAR.textPrimary,
          }}
        >
          <ShieldCheck size={11} style={{ color: COPILOT_VAR.accentPrimary }} />
          {PERMISSION_LABELS[packet.canonPermission]}
        </span>

        {onToggleMemory && (
          <button
            type="button"
            onClick={() => onToggleMemory(!memoryEnabled)}
            aria-pressed={memoryEnabled}
            style={{
              ...pillStyle,
              marginLeft: 'auto',
              gap: 4,
              backgroundColor: memoryEnabled ? COPILOT_VAR.accentSoft : COPILOT_VAR.bgElevated,
              border: `1px solid ${memoryEnabled ? COPILOT_VAR.accentPrimary : COPILOT_VAR.borderSubtle}`,
              color: memoryEnabled ? COPILOT_VAR.accentPrimary : COPILOT_VAR.textMuted,
            }}
          >
            <Layers size={11} />
            {memoryEnabled ? '4 Camadas Ativas' : 'Pausada'}
          </button>
        )}
      </div>

      {/* Token Budget Gauge */}
      <section
        aria-label="Orçamento de tokens"
        style={{
          padding: '9px 10px',
          borderRadius: COPILOT_VAR.radiusSm,
          backgroundColor: COPILOT_VAR.bgElevated,
          border: `1px solid ${COPILOT_VAR.borderSubtle}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
          <span style={{ fontWeight: 600, color: COPILOT_VAR.textPrimary }}>Orçamento de Contexto</span>
          <span style={{ color: COPILOT_VAR.textSecondary, fontVariantNumeric: 'tabular-nums' }}>
            <strong style={{ color: COPILOT_VAR.textPrimary }}>{packet.totalEstimatedTokens}</strong> /{' '}
            {packet.budgetTokens} tokens ({usagePct}%)
          </span>
        </div>

        <div
          role="progressbar"
          aria-label="Uso do orçamento de tokens"
          aria-valuenow={packet.totalEstimatedTokens}
          aria-valuemin={0}
          aria-valuemax={packet.budgetTokens}
          style={{
            width: '100%',
            height: 6,
            borderRadius: 999,
            backgroundColor: COPILOT_VAR.bgSurface,
            border: `1px solid ${COPILOT_VAR.borderSubtle}`,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${usagePct}%`,
              height: '100%',
              backgroundColor: barColor,
              borderRadius: 999,
              transition: 'width 220ms ease, background-color 220ms ease',
            }}
          />
        </div>

        {packet.truncatedCount > 0 && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 7px',
              borderRadius: COPILOT_VAR.radiusSm,
              backgroundColor: TONE.warnBg,
              border: `1px solid ${TONE.warnBorder}`,
              color: TONE.warnText,
              fontSize: 10.5,
              fontWeight: 600,
            }}
          >
            <AlertTriangle size={11} />
            {packet.truncatedCount}{' '}
            {packet.truncatedCount === 1 ? 'item resumido' : 'itens resumidos'} para caber no orçamento
          </div>
        )}
      </section>

      {/* Session Handoff Continuity Banner */}
      <section
        aria-label="Continuidade da Sessão"
        style={{
          padding: '8px 10px',
          borderRadius: COPILOT_VAR.radiusSm,
          backgroundColor: COPILOT_VAR.accentSoft,
          border: '1px solid color-mix(in srgb, var(--accent-primary, #3b82f6) 32%, transparent)',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <div style={{ fontSize: 10.5, fontWeight: 700, color: COPILOT_VAR.accentPrimary }}>
          Continuidade da Sessão
        </div>
        <div style={{ fontSize: 11, color: COPILOT_VAR.textPrimary, lineHeight: 1.4 }}>
          {packet.sessionHandoff}
        </div>
      </section>

      {/* Epistemic Alerts */}
      {packet.epistemicAlerts.length > 0 && (
        <section
          aria-label="Alertas Epistêmicos"
          style={{
            padding: '9px 10px',
            borderRadius: COPILOT_VAR.radiusSm,
            backgroundColor: TONE.warnBg,
            border: `1px solid ${TONE.warnBorder}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: TONE.warnText }}>
            <AlertTriangle size={12} />
            Alertas Epistêmicos ({packet.epistemicAlerts.length})
          </div>
          {packet.epistemicAlerts.map((alert) => (
            <div
              key={alert.id}
              style={{
                padding: '6px 8px',
                borderRadius: COPILOT_VAR.radiusSm,
                backgroundColor: COPILOT_VAR.bgSurface,
                border: `1px solid ${TONE.warnBorder}`,
                fontSize: 10.5,
                lineHeight: 1.4,
                color: COPILOT_VAR.textPrimary,
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 2 }}>
                {alert.entityName} • {alert.severity === 'error' ? 'Crítico' : 'Atenção'}
              </div>
              <div style={{ color: COPILOT_VAR.textSecondary }}>{alert.message}</div>
            </div>
          ))}
        </section>
      )}

      {/* 4 Collapsible Memory Layers */}
      <section aria-label="Camadas de Memória" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {resolvedLayers.map((layer) => (
          <CopilotMemoryLayerCard
            key={layer.id}
            layer={layer}
            defaultOpen={layer.id === 'immediate'}
            pausedNote={
              !memoryEnabled && layer.id !== 'immediate'
                ? 'Camada pausada enquanto o compilador de 4 camadas estiver desativado.'
                : undefined
            }
          />
        ))}
      </section>

      <CopilotPromptPreview formattedPrompt={packet.formattedPrompt} />
    </div>
  );
}
