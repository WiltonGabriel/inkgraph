import { useState, useEffect, useMemo, useCallback } from 'react';
import { useProject } from '../context/ProjectContext';
import {
  applyAutoCatalogBatch,
  createStagingProposalFromFinding,
  scanProjectCanon,
  type CanonRadarFinding,
  type CanonRadarScanResult,
} from '../domain/canonRadarEngine';
import { computeProjectCanonScoreSummary } from '../domain/canonScoreCalculator';
import { CanonRadarHeader } from '../components/canon-radar/CanonRadarHeader';
import { CanonPermissionCard } from '../components/canon-radar/CanonPermissionCard';
import { CanonStagingQueueCard } from '../components/canon-radar/CanonStagingQueueCard';
import { CanonReadinessCard } from '../components/canon-radar/CanonReadinessCard';
import { CanonFindingsListCard } from '../components/canon-radar/CanonFindingsListCard';
import { CanonScoreBreakdownCard } from '../components/canon-radar/CanonScoreBreakdownCard';

export function CanonRadarView() {
  const {
    project,
    settings,
    updateProject,
    setActiveView,
    navigateToBreadcrumbPath,
    notify,
    t,
  } = useProject();

  const [scanResult, setScanResult] = useState<CanonRadarScanResult | null>(() =>
    scanProjectCanon(project, settings)
  );

  const scoreSummary = useMemo(
    () => computeProjectCanonScoreSummary(project),
    [project]
  );

  const pendingProposals = useMemo(
    () => project.stagingProposals.filter((p) => p.status === 'pending'),
    [project.stagingProposals]
  );

  const runFullScan = useCallback(
    (withNotify = true) => {
      const result = scanProjectCanon(project, settings);
      setScanResult(result);
      if (withNotify) {
        const count = result.findings.length;
        if (count === 0) {
          notify(
            `Varredura concluída (${result.scenesScanned} cenas): nenhum achado pendente.`,
            'success'
          );
        } else {
          notify(
            `Varredura concluída: ${count} ${count === 1 ? 'achado' : 'achados'} em ${result.scenesScanned} ${result.scenesScanned === 1 ? 'cena' : 'cenas'}.`,
            result.epistemicWarningsCount > 0 ? 'warning' : 'info'
          );
        }
      }
    },
    [project, settings, notify]
  );

  useEffect(() => {
    setScanResult(scanProjectCanon(project, settings));
  }, [project, settings]);

  useEffect(() => {
    const handleShortcut = (ev: Event) => {
      const detail = (ev as CustomEvent<{ action?: string }>).detail;
      if (detail?.action === 'scanCanonNow') {
        runFullScan(true);
      }
    };
    window.addEventListener('inkgraph:shortcut', handleShortcut);
    return () => window.removeEventListener('inkgraph:shortcut', handleShortcut);
  }, [runFullScan]);

  const findings = useMemo<CanonRadarFinding[]>(
    () =>
      (scanResult?.findings ?? []).map((f) => ({
        ...f,
        alreadyStaged:
          f.alreadyStaged ||
          pendingProposals.some(
            (p) =>
              p.rationale === f.rationale ||
              (f.category.startsWith('uncataloged_') &&
                p.entityName.toLowerCase() === f.term.toLowerCase())
          ),
      })),
    [scanResult, pendingProposals]
  );

  const stageableFindings = findings.filter((f) => !f.alreadyStaged);
  const autoCatalogableFindings = findings.filter(
    (f) => f.category !== 'epistemic_leak'
  );

  const handleBatchStageAll = () => {
    if (stageableFindings.length === 0) {
      notify('Todos os achados já possuem propostas pendentes em Staging.', 'info');
      return;
    }
    const proposals = stageableFindings.map((finding, idx) => {
      const created = createStagingProposalFromFinding(finding);
      return { ...created, id: `${created.id}_${idx}` };
    });
    updateProject((prev) => ({
      ...prev,
      stagingProposals: [...proposals, ...prev.stagingProposals],
    }));
    notify(
      `${proposals.length} ${proposals.length === 1 ? 'proposta enviada' : 'propostas enviadas'} para Staging.`,
      'success'
    );
  };

  const handleBatchAutoCatalogAll = () => {
    const { updatedProject, catalogedCount } = applyAutoCatalogBatch(
      project,
      autoCatalogableFindings
    );
    if (catalogedCount === 0) {
      notify('Nenhum item elegível para auto-catalogação nesta varredura.', 'info');
      return;
    }
    updateProject(() => updatedProject);
    notify(
      `${catalogedCount} ${catalogedCount === 1 ? 'item catalogado' : 'itens catalogados'} automaticamente no universo.`,
      'success'
    );
  };

  const openAiSettings = () => {
    navigateToBreadcrumbPath('InkGraph / Configurações / IA & Servidor MCP');
  };

  return (
    <div
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: 24,
        backgroundColor: 'var(--bg-canvas, var(--bg-primary, #0b0e16))',
        color: 'var(--text-primary, #f1f5f9)',
      }}
    >
      <div
        style={{
          maxWidth: 1080,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <CanonRadarHeader
          title={t.views['canon-radar']}
          pendingCount={pendingProposals.length}
          scanResult={scanResult}
          permissionMode={settings.canonAiPermission}
          scanShortcut={settings.shortcuts.scanCanonNow}
          stageableCount={stageableFindings.length}
          autoCatalogableCount={autoCatalogableFindings.length}
          onScanNow={() => runFullScan(true)}
          onBatchStageAll={handleBatchStageAll}
          onBatchAutoCatalogAll={handleBatchAutoCatalogAll}
          onOpenVersions={() => setActiveView('versions')}
          onOpenAiSettings={openAiSettings}
        />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 14,
          }}
        >
          <CanonPermissionCard onOpenAiSettings={openAiSettings} />
          <CanonStagingQueueCard
            pendingProposals={pendingProposals}
            onOpenVersions={() => setActiveView('versions')}
          />
        </div>

        <CanonReadinessCard
          project={project}
          settings={settings}
          scoreSummary={scoreSummary}
        />

        <CanonFindingsListCard
          findings={findings}
          permissionMode={settings.canonAiPermission}
          onRescan={() => runFullScan(false)}
        />

        <CanonScoreBreakdownCard scoreSummary={scoreSummary} />
      </div>
    </div>
  );
}
