import { describe, it, expect } from 'vitest';
import { createDemoProjectData } from '../../ui/src/data/demoProjectFactory';
import { DEFAULT_SETTINGS } from '../../ui/src/data/defaultSettings';
import {
  buildFilteredGraphData,
  computeOneHopNeighborhood,
} from '../../ui/src/components/graph/graphDataBuilder';
import {
  checkoutBranchState,
  computeLineDiff,
  computeWordDiff,
  computeWorkspaceBranchDiff,
  createBranchFromActive,
  deleteBranchSafely,
  mergeBranchIntoActive,
  restoreSnapshotWithAutoBackup,
} from '../../ui/src/domain/gitEngine';
import {
  compileFourLayerContext,
  estimateTokens,
} from '../../ui/src/domain/memoryCompiler';

describe('Phase 2 & 3 Engines: 1-Hop Force Graph, Git Branch/Diff/Merge & 4-Layer Memory Compiler', () => {
  describe('graphDataBuilder & computeOneHopNeighborhood', () => {
    it('builds graph across entity kinds and computes exact 1-hop neighborhood', () => {
      const demo = createDemoProjectData();
      const { nodes, links, allEntities } = buildFilteredGraphData(demo, 'all');

      expect(allEntities.length).toBeGreaterThanOrEqual(nodes.length);
      expect(nodes.some((n) => n.kind === 'character')).toBe(true);
      expect(nodes.some((n) => n.kind === 'faction')).toBe(true);
      expect(nodes.some((n) => n.kind === 'location')).toBe(true);

      const sysObjOnly = buildFilteredGraphData(demo, 'system_object');
      expect(
        sysObjOnly.nodes.every((n) => n.kind === 'system' || n.kind === 'object')
      ).toBe(true);

      const multiChecked = buildFilteredGraphData(demo, ['character', 'faction']);
      expect(
        multiChecked.nodes.every((n) => n.kind === 'character' || n.kind === 'faction')
      ).toBe(true);
      expect(multiChecked.nodes.some((n) => n.kind === 'character')).toBe(true);
      expect(multiChecked.nodes.some((n) => n.kind === 'faction')).toBe(true);

      const firstChar = demo.characters[0];
      const hood = computeOneHopNeighborhood(links, firstChar.id);
      expect(hood.incidentLinkIds.size).toBeGreaterThan(0);
      expect(hood.neighborNodeIds.has(firstChar.id)).toBe(false);

      const emptyHood = computeOneHopNeighborhood(links, null);
      expect(emptyHood.incidentLinkIds.size).toBe(0);
      expect(emptyHood.neighborNodeIds.size).toBe(0);
    });
  });

  describe('gitEngine', () => {
    it('computes accurate LCS line diffs and word diffs', () => {
      const base = 'Linha 1\nLinha original\nLinha 3';
      const target = 'Linha 1\nLinha revisada\nLinha 3\nLinha 4';

      const lineDiff = computeLineDiff(base, target);
      expect(lineDiff.some((d) => d.type === 'delete' && d.text === 'Linha original')).toBe(true);
      expect(lineDiff.some((d) => d.type === 'insert' && d.text === 'Linha revisada')).toBe(true);
      expect(lineDiff.some((d) => d.type === 'insert' && d.text === 'Linha 4')).toBe(true);

      const wordDiff = computeWordDiff('O corvo cego voou', 'O corvo dourado planou');
      expect(wordDiff.some((w) => w.type === 'delete' && w.value === 'cego')).toBe(true);
      expect(wordDiff.some((w) => w.type === 'insert' && w.value === 'dourado')).toBe(true);
    });

    it('isolates branch state on checkout, detects conflicts, and merges with resolutions', () => {
      const baseProject = createDemoProjectData();
      const mainBranchId = baseProject.activeBranchId;
      const targetSceneId = baseProject.scenes[0].id;
      const originalContent = baseProject.scenes[0].content;

      // Create experimental branch and modify scene + add extra scene
      let working = createBranchFromActive(
        baseProject,
        'Ramo Alternativo',
        'Teste de enredo alternativo'
      );
      const altBranchId = working.activeBranchId;
      expect(altBranchId).not.toBe(mainBranchId);

      working = {
        ...working,
        scenes: [
          {
            ...working.scenes[0],
            content: `${originalContent}\nParágrafo novo do ramo alternativo.`,
          },
          ...working.scenes.slice(1),
          {
            ...working.scenes[0],
            id: 'scene_extra_alt',
            title: 'Cena Exclusiva do Ramo',
            content: 'Conteúdo exclusivo adicionado no ramo alternativo.',
          },
        ],
      };

      // Switch back to main branch and confirm main was NOT overwritten
      working = checkoutBranchState(working, mainBranchId);
      expect(working.activeBranchId).toBe(mainBranchId);
      expect(working.scenes.some((s) => s.id === 'scene_extra_alt')).toBe(false);
      expect(working.scenes[0].content).toBe(originalContent);

      // Edit same first scene in main to create a conflict
      working = {
        ...working,
        scenes: [
          {
            ...working.scenes[0],
            content: `${originalContent}\nParágrafo concorrente no ramo principal.`,
          },
          ...working.scenes.slice(1),
        ],
      };

      const diff = computeWorkspaceBranchDiff(working, altBranchId);
      expect(diff.scenesAdded).toContain('scene_extra_alt');
      expect(diff.scenesModified).toContain(targetSceneId);
      expect(diff.conflicts.some((c) => c.sceneId === targetSceneId)).toBe(true);

      // Merge keeping 'ours' for conflicting scene, still adopting added scene
      const merged = mergeBranchIntoActive(working, altBranchId, {
        [targetSceneId]: 'ours',
      });
      expect(merged.resolvedConflicts).toBe(1);
      expect(merged.updatedProject.scenes.some((s) => s.id === 'scene_extra_alt')).toBe(true);
      expect(
        merged.updatedProject.scenes.find((s) => s.id === targetSceneId)?.content
      ).toContain('Parágrafo concorrente no ramo principal.');

      // Safe deletion: refuses active branch, deletes inactive branch
      const refusedDelete = deleteBranchSafely(merged.updatedProject, mainBranchId);
      expect(refusedDelete.branches.some((b) => b.id === mainBranchId)).toBe(true);

      const cleanedDelete = deleteBranchSafely(merged.updatedProject, altBranchId);
      expect(cleanedDelete.branches.some((b) => b.id === altBranchId)).toBe(false);
    });

    it('creates automatic safety backup snapshot before restoring an older snapshot', () => {
      const demo = createDemoProjectData();
      const targetSnap = demo.snapshots[0];
      const modified = {
        ...demo,
        scenes: demo.scenes.map((s, idx) =>
          idx === 0 ? { ...s, content: 'Texto modificado recentemente na sessão' } : s
        ),
      };

      const restored = restoreSnapshotWithAutoBackup(modified, targetSnap.id, 25);
      expect(restored.snapshots[0].label).toContain('Backup automático antes de restaurar');
      expect(restored.snapshots[0].scenesBackup[0].content).toBe(
        'Texto modificado recentemente na sessão'
      );
      expect(restored.scenes[0].content).toBe(targetSnap.scenesBackup[0].content);
    });
  });

  describe('memoryCompiler', () => {
    it('compiles 4 layers, respects token budget, detects epistemic leaks, and enforces privacy gate', () => {
      const demo = createDemoProjectData();
      const elias = demo.characters[0];
      const otherChar = demo.characters[1];

      // Construct a scene from otherChar POV mentioning elias's unrevealed secret
      const secretText = 'Portador secreto da Lâmina de Valdor oculta';
      const riggedProject = {
        ...demo,
        characters: demo.characters.map((c) =>
          c.id === elias.id
            ? {
                ...c,
                epistemicSecrets: [
                  {
                    id: 'sec_rigged_blade',
                    secret: secretText,
                    knownByIds: [elias.id],
                  },
                ],
              }
            : c
        ),
        scenes: [
          {
            ...demo.scenes[0],
            id: 'scene_rigged_pov',
            povCharacterId: otherChar.id,
            secretsRevealed: [],
            content: `${otherChar.name} desconfiava do Portador secreto da Lâmina de Valdor oculta na torre.`,
          },
          ...demo.scenes.slice(1),
        ],
      };

      const fullPacket = compileFourLayerContext(
        riggedProject,
        {
          ...DEFAULT_SETTINGS,
          aiMode: 'eco',
          enableMemoryCompiler: true,
          enableEpistemicTracking: true,
        },
        'manuscript',
        'scene_rigged_pov'
      );

      expect(fullPacket.layers.map((l) => l.id)).toEqual([
        'immediate',
        'epistemic',
        'world_canon',
        'rolling_summary',
      ]);
      expect(fullPacket.cloudAllowed).toBe(false);
      expect(fullPacket.epistemicAlerts.length).toBeGreaterThanOrEqual(1);
      expect(fullPacket.epistemicAlerts[0].message).toContain('Possível vazamento epistêmico');
      expect(estimateTokens(fullPacket.formattedPrompt)).toBeGreaterThan(0);

      // Cloud allowed only when copilotEnabled, !heuristicsOnly, cloud/hybrid, and gemini/openai
      const cloudPacket = compileFourLayerContext(
        riggedProject,
        {
          ...DEFAULT_SETTINGS,
          aiMode: 'cloud',
          aiProvider: 'gemini',
          copilotEnabled: true,
          copilotHeuristicsOnly: false,
        },
        'manuscript',
        'scene_rigged_pov'
      );
      expect(cloudPacket.cloudAllowed).toBe(true);

      // Token budget truncation
      const tightPacket = compileFourLayerContext(
        riggedProject,
        DEFAULT_SETTINGS,
        'manuscript',
        'scene_rigged_pov',
        { budgetTokens: 120 }
      );
      expect(tightPacket.truncatedCount).toBeGreaterThan(0);
    });
  });
});
