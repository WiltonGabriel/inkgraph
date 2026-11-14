import { describe, it, expect } from 'vitest';
import { createDemoProjectData } from '../../ui/src/data/demoProjectFactory';
import { DEFAULT_SETTINGS } from '../../ui/src/data/defaultSettings';
import {
  WORLD_PILLARS,
  computeProjectCanonScoreSummary,
  computeScoreFromChecks,
  resolveScoreTierAndColor,
  scoreWorldMaturity,
  scoreWorldPillar,
} from '../../ui/src/domain/canonScoreCalculator';
import {
  applyAutoCatalogBatch,
  applyAutoCatalogFinding,
  createStagingProposalFromFinding,
  scanProjectCanon,
} from '../../ui/src/domain/canonRadarEngine';
import { checkAiAvailability } from '../../ui/src/domain/aiAvailability';

describe('Phase 4 Engines: 1-10 Canon Score Calculator & Canon Radar Scanner', () => {
  describe('canonScoreCalculator', () => {
    it('maps checks to normalized 1-10 scores with accurate color tiers and missing checklists', () => {
      const emptyBadge = computeScoreFromChecks([
        { ok: false, missingLabel: 'Falta campo A' },
        { ok: false, missingLabel: 'Falta campo B' },
      ]);
      expect(emptyBadge.score).toBe(1);
      expect(emptyBadge.tier).toBe('critical');
      expect(emptyBadge.color).toBe('#ef4444');
      expect(emptyBadge.missingItems).toEqual(['Falta campo A', 'Falta campo B']);

      const fullBadge = computeScoreFromChecks([
        { ok: true, missingLabel: 'Falta campo A' },
        { ok: true, missingLabel: 'Falta campo B' },
      ]);
      expect(fullBadge.score).toBe(10);
      expect(fullBadge.tier).toBe('canon_ready');
      expect(fullBadge.color).toBe('#10b981');
      expect(fullBadge.missingItems).toEqual([]);

      expect(resolveScoreTierAndColor(2).tier).toBe('critical');
      expect(resolveScoreTierAndColor(5).color).toBe('#f59e0b');
      expect(resolveScoreTierAndColor(8).color).toBe('#3b82f6');
      expect(resolveScoreTierAndColor(9).color).toBe('#10b981');
    });

    it('scores all 10 worldbuilding pillars including politics, economy and atlas', () => {
      const demo = createDemoProjectData();
      const world = demo.worlds[0];
      const report = scoreWorldMaturity(world);

      expect(Object.keys(report.pillars)).toHaveLength(WORLD_PILLARS.length);
      expect(WORLD_PILLARS).toHaveLength(10);

      for (const pillar of WORLD_PILLARS) {
        const badge = report.pillars[pillar.id];
        expect(badge.score).toBeGreaterThanOrEqual(1);
        expect(badge.score).toBeLessThanOrEqual(10);
        expect(badge.totalCount).toBeGreaterThan(0);
      }

      // Adding a primary Atlas map and structured politics improves geography, politics and atlas scores
      const enrichedWorld = {
        ...world,
        politicsSummary: 'Conselho Regente de Ferro governa por decreto.',
        politics: {
          governmentForms: 'Oligarquia Teocrática',
          legalCodeAndPunishments: 'Exílio na Fenda',
          successionRules: 'Eleição do Alto Corvo',
          treatiesAndAlliances: 'Pacto de Cinzas',
          instabilityZones: 'Fronteira Sul',
        },
        maps: [
          {
            id: 'map_demo_primary',
            worldId: world.id,
            name: 'Mapa Continental',
            category: 'world' as const,
            mimeType: 'image/svg+xml',
            isPrimary: true,
            createdAt: new Date().toISOString(),
          },
        ],
      };

      const atlasBefore = scoreWorldPillar(world, 'atlas').score;
      const atlasAfter = scoreWorldPillar(enrichedWorld, 'atlas').score;
      expect(atlasAfter).toBeGreaterThan(atlasBefore);

      const politicsAfter = scoreWorldPillar(enrichedWorld, 'politics');
      expect(politicsAfter.score).toBe(10);
      expect(politicsAfter.missingItems).toHaveLength(0);

      const summary = computeProjectCanonScoreSummary(demo);
      expect(summary.overall.score).toBeGreaterThanOrEqual(1);
      expect(summary.overall.score).toBeLessThanOrEqual(10);
      expect(summary.worldReport?.worldId).toBe(world.id);
      expect(summary.entities.length).toBeGreaterThan(0);
    });
  });

  describe('canonRadarEngine', () => {
    it('scans manuscript prose for uncataloged @/#/&/! mentions, respects scope filters, and supports staging vs auto modes without editing prose', () => {
      const demo = createDemoProjectData();
      const originalScene = demo.scenes[0];
      const customProse =
        `${originalScene.content}\n\n` +
        'Naquele instante, @Kaelen Voros ergueu !Espada Solar diante de #Citadela Branca e desafiou &Ordem Dourada.';

      const modifiedProject = {
        ...demo,
        scenes: [
          {
            ...originalScene,
            content: customProse,
          },
          ...demo.scenes.slice(1),
        ],
      };

      const fullScan = scanProjectCanon(modifiedProject, {
        ...DEFAULT_SETTINGS,
        canonAiPermission: 'staging',
        canonScopeEntities: true,
        canonScopeWorld: true,
        canonScopeGraphTimeline: true,
        enableEpistemicTracking: true,
      });

      const terms = fullScan.findings.map((f) => f.term);
      expect(terms).toContain('Kaelen Voros');
      expect(terms).toContain('Espada Solar');
      expect(terms).toContain('Citadela Branca');
      expect(terms).toContain('Ordem Dourada');

      // Pausing world scope hides #Citadela Branca while preserving character discoveries
      const entitiesOnlyScan = scanProjectCanon(modifiedProject, {
        ...DEFAULT_SETTINGS,
        canonAiPermission: 'observer',
        canonScopeEntities: true,
        canonScopeWorld: false,
        canonScopeGraphTimeline: false,
      });
      const entitiesOnlyTerms = entitiesOnlyScan.findings.map((f) => f.term);
      expect(entitiesOnlyTerms).toContain('Kaelen Voros');
      expect(entitiesOnlyTerms).not.toContain('Citadela Branca');

      // Mode 2 (Staging): creates valid StagingProposal without modifying canon
      const kaelenFinding = fullScan.findings.find((f) => f.term === 'Kaelen Voros');
      expect(kaelenFinding).toBeDefined();
      const proposal = createStagingProposalFromFinding(kaelenFinding!);
      expect(proposal.status).toBe('pending');
      expect(proposal.entityType).toBe('character');
      expect(proposal.targetPath).toContain('workspace/staging/');

      // Mode 3 (Auto): catalogs new provisional records WITHOUT altering scene.content prose
      const { updatedProject, summary } = applyAutoCatalogFinding(
        modifiedProject,
        kaelenFinding!
      );
      expect(summary).toContain('Kaelen Voros');
      expect(
        updatedProject.characters.some(
          (c) => c.name === 'Kaelen Voros' && c.status === 'provisional'
        )
      ).toBe(true);
      expect(updatedProject.scenes[0].content).toBe(customProse);

      const batchResult = applyAutoCatalogBatch(modifiedProject, fullScan.findings);
      expect(batchResult.catalogedCount).toBeGreaterThanOrEqual(4);
      expect(batchResult.updatedProject.scenes[0].content).toBe(customProse);
      expect(
        batchResult.updatedProject.objects.some((o) => o.name === 'Espada Solar')
      ).toBe(true);
      expect(
        batchResult.updatedProject.worlds[0].locations.some(
          (l) => l.name === 'Citadela Branca'
        )
      ).toBe(true);
    });
  });

  describe('aiAvailability', () => {
    it('reports disconnected by default when no API key or explicit local provider is active', () => {
      const defaultStatus = checkAiAvailability(DEFAULT_SETTINGS);
      expect(defaultStatus.connected).toBe(false);
      expect(defaultStatus.reasonPt).toContain('Nenhuma IA conectada');

      const withCloudKey = checkAiAvailability({
        ...DEFAULT_SETTINGS,
        aiProvider: 'gemini',
        geminiApiKey: 'test-key-123',
      });
      expect(withCloudKey.connected).toBe(true);

      const withOllama = checkAiAvailability({
        ...DEFAULT_SETTINGS,
        aiProvider: 'ollama',
        aiMode: 'local',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.2:3b',
      });
      expect(withOllama.connected).toBe(true);

      const ecoMode = checkAiAvailability({
        ...DEFAULT_SETTINGS,
        aiProvider: 'gemini',
        geminiApiKey: 'test-key-123',
        aiMode: 'eco',
      });
      expect(ecoMode.connected).toBe(false);
    });
  });
});
