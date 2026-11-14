import { Radar, GitBranch, SlidersHorizontal, Send, Sparkles } from 'lucide-react';
import type { CanonAiPermission } from '../../types/project';
import type { CanonRadarScanResult } from '../../domain/canonRadarEngine';

interface CanonRadarHeaderProps {
  title: string;
  pendingCount: number;
  scanResult: CanonRadarScanResult | null;
  permissionMode: CanonAiPermission;
  scanShortcut: string;
  stageableCount: number;
  autoCatalogableCount: number;
  onScanNow: () => void;
  onBatchStageAll: () => void;
  onBatchAutoCatalogAll: () => void;
  onOpenVersions: () => void;
  onOpenAiSettings: () => void;
}

export function CanonRadarHeader({
  title,
  pendingCount,
  scanResult,
  permissionMode,
  scanShortcut,
  stageableCount,
  autoCatalogableCount,
  onScanNow,
  onBatchStageAll,
  onBatchAutoCatalogAll,
  onOpenVersions,
  onOpenAiSettings,
}: CanonRadarHeaderProps) {
  const findingsCount = scanResult?.findings.length ?? 0;
  const formattedTime = scanResult
    ? new Date(scanResult.scannedAt).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
        border: '1px solid var(--border-subtle, var(--border, #263046))',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: 'var(--card-shadow, none)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 'var(--radius-md, 8px)',
              backgroundColor: 'var(--accent-soft, rgba(59, 130, 246, 0.14))',
              color: 'var(--accent-primary, #3b82f6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Radar size={19} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h2>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 12.5,
                color: 'var(--text-secondary, #94a3b8)',
              }}
            >
              Varredura completa de manuscrito, maturidade de cânone (1–10) e fila de revisão em staging.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onScanNow}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm, 6px)',
              backgroundColor: 'var(--accent-primary, #3b82f6)',
              border: 'none',
              color: '#ffffff',
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Radar size={14} />
            <span>Escanear Tudo Agora</span>
            <kbd
              style={{
                fontSize: 10,
                fontWeight: 600,
                padding: '1px 5px',
                borderRadius: 4,
                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                color: '#ffffff',
                fontFamily: 'monospace',
              }}
            >
              {scanShortcut}
            </kbd>
          </button>

          {findingsCount > 0 && permissionMode === 'staging' && (
            <button
              type="button"
              onClick={onBatchStageAll}
              disabled={stageableCount === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 'var(--radius-sm, 6px)',
                backgroundColor:
                  stageableCount > 0
                    ? 'rgba(245, 158, 11, 0.16)'
                    : 'var(--bg-elevated, var(--bg-card, #171d2e))',
                border:
                  stageableCount > 0
                    ? '1px solid #f59e0b'
                    : '1px solid var(--border-subtle, var(--border, #263046))',
                color: stageableCount > 0 ? '#f59e0b' : 'var(--text-secondary, #94a3b8)',
                fontSize: 12,
                fontWeight: 700,
                cursor: stageableCount > 0 ? 'pointer' : 'not-allowed',
                opacity: stageableCount > 0 ? 1 : 0.65,
              }}
            >
              <Send size={13} />
              Enviar Todos p/ Staging
              {stageableCount > 0 ? ` (${stageableCount})` : ''}
            </button>
          )}

          {findingsCount > 0 && permissionMode === 'auto' && (
            <button
              type="button"
              onClick={onBatchAutoCatalogAll}
              disabled={autoCatalogableCount === 0}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 'var(--radius-sm, 6px)',
                backgroundColor:
                  autoCatalogableCount > 0
                    ? 'rgba(16, 185, 129, 0.16)'
                    : 'var(--bg-elevated, var(--bg-card, #171d2e))',
                border:
                  autoCatalogableCount > 0
                    ? '1px solid #10b981'
                    : '1px solid var(--border-subtle, var(--border, #263046))',
                color:
                  autoCatalogableCount > 0 ? '#10b981' : 'var(--text-secondary, #94a3b8)',
                fontSize: 12,
                fontWeight: 700,
                cursor: autoCatalogableCount > 0 ? 'pointer' : 'not-allowed',
                opacity: autoCatalogableCount > 0 ? 1 : 0.65,
              }}
            >
              <Sparkles size={13} />
              Auto-Catalogar Todos no Universo
              {autoCatalogableCount > 0 ? ` (${autoCatalogableCount})` : ''}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenVersions}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm, 6px)',
              backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
              border: '1px solid var(--border-subtle, var(--border, #263046))',
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <GitBranch size={13} style={{ color: '#10b981' }} />
            {pendingCount === 1
              ? '1 pendente no Staging'
              : `${pendingCount} pendentes no Staging`}
          </button>

          <button
            type="button"
            onClick={onOpenAiSettings}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              borderRadius: 'var(--radius-sm, 6px)',
              backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
              border: '1px solid var(--border-subtle, var(--border, #263046))',
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={13} />
            Configurar IA & MCP
          </button>
        </div>
      </div>

      {scanResult && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 8,
            paddingTop: 10,
            borderTop: '1px solid var(--border-subtle, var(--border, #263046))',
            fontSize: 11.5,
            color: 'var(--text-secondary, #94a3b8)',
          }}
        >
          <span>
            Última varredura: <strong style={{ color: 'var(--text-primary, #f1f5f9)' }}>{formattedTime}</strong> ·{' '}
            {scanResult.scenesScanned}{' '}
            {scanResult.scenesScanned === 1 ? 'cena analisada' : 'cenas analisadas'} ·{' '}
            {scanResult.wordsScanned.toLocaleString('pt-BR')} palavras
          </span>
          <span>
            {findingsCount === 0
              ? 'Nenhum achado pendente nesta varredura'
              : `${findingsCount} ${findingsCount === 1 ? 'achado detectado' : 'achados detectados'}`}
            {scanResult.epistemicWarningsCount > 0
              ? ` · ${scanResult.epistemicWarningsCount} alerta(s) epistêmico(s)`
              : ''}
          </span>
        </div>
      )}
    </div>
  );
}
