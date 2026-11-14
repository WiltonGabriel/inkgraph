import { useProject } from '../context/ProjectContext';
import { CanonRadarHeader } from '../components/canon-radar/CanonRadarHeader';
import { CanonPermissionCard } from '../components/canon-radar/CanonPermissionCard';
import { CanonStagingQueueCard } from '../components/canon-radar/CanonStagingQueueCard';
import { CanonReadinessCard } from '../components/canon-radar/CanonReadinessCard';

export function CanonRadarView() {
  const { project, settings, setActiveView, navigateToBreadcrumbPath, t } = useProject();

  const pendingProposals = project.stagingProposals.filter((p) => p.status === 'pending');

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
          maxWidth: 1040,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <CanonRadarHeader
          title={t.views['canon-radar']}
          pendingCount={pendingProposals.length}
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
          <CanonPermissionCard
            activePermission={settings.canonAiPermission}
            onOpenAiSettings={openAiSettings}
          />
          <CanonStagingQueueCard
            pendingProposals={pendingProposals}
            onOpenVersions={() => setActiveView('versions')}
          />
        </div>

        <CanonReadinessCard project={project} settings={settings} />
      </div>
    </div>
  );
}
