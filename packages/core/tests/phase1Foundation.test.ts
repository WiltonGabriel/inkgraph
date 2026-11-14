import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createDemoProjectData } from '../../ui/src/data/demoProjectFactory';
import { DEFAULT_SETTINGS } from '../../ui/src/data/defaultSettings';
import {
  SHORTCUT_DEFINITIONS,
  SHORTCUT_CATEGORY_LABELS,
  normalizeShortcutString,
  formatKeyEventToShortcut,
  matchesShortcut,
  findShortcutConflicts,
  countModifiedShortcuts,
} from '../../ui/src/domain/shortcutManager';
import {
  listDirectoryEntities,
  findEntityByIdOrAlias,
  getEntityNeighborhood,
  cascadeDeleteEntity,
} from '../../ui/src/domain/entityDirectory';
import { applyStagingDecision } from '../../ui/src/domain/stagingResolver';
import { resolveBreadcrumbPathInput } from '../../ui/src/domain/breadcrumbResolver';
import {
  verifyAndReloadStorage,
  STORAGE_KEY_CATALOG,
  STORAGE_KEY_SETTINGS,
} from '../../ui/src/domain/storageAdapter';
import {
  THEME_PALETTES,
  buildThemeCssVars,
  resolveEffectiveBrightness,
} from '../../ui/src/domain/themes';

describe('Phase 1 Foundation: Shortcuts, Directory, Staging, Breadcrumb, Storage & Themes', () => {
  describe('shortcutManager', () => {
    it('defines all 26 shortcuts across 4 categories with valid defaults', () => {
      expect(SHORTCUT_DEFINITIONS).toHaveLength(26);
      expect(Object.keys(SHORTCUT_CATEGORY_LABELS)).toEqual([
        'navigation',
        'views',
        'editor',
        'canvas',
      ]);
      for (const def of SHORTCUT_DEFINITIONS) {
        expect(DEFAULT_SETTINGS.shortcuts[def.key]).toBeTruthy();
      }
      expect(findShortcutConflicts(DEFAULT_SETTINGS.shortcuts)).toEqual({});
    });

    it('normalizes strings, formats keyboard events, matches shortcuts, and detects conflicts', () => {
      expect(normalizeShortcutString('cmd + shift + k')).toBe('Ctrl+Shift+K');
      expect(normalizeShortcutString('Alt + 2')).toBe('Alt+2');

      expect(
        formatKeyEventToShortcut({
          key: 'Control',
          ctrlKey: true,
          metaKey: false,
          altKey: false,
          shiftKey: false,
        })
      ).toBeNull();

      expect(
        formatKeyEventToShortcut({
          key: 'F1',
          ctrlKey: false,
          metaKey: false,
          altKey: false,
          shiftKey: false,
        })
      ).toBe('F1');

      expect(
        formatKeyEventToShortcut({
          key: 'r',
          ctrlKey: true,
          metaKey: false,
          altKey: false,
          shiftKey: true,
        })
      ).toBe('Ctrl+Shift+R');

      expect(
        matchesShortcut(
          { key: 'k', ctrlKey: true, metaKey: false, altKey: false, shiftKey: false },
          'Ctrl+K'
        )
      ).toBe(true);
      expect(
        matchesShortcut(
          { key: 'k', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false },
          'Ctrl+K'
        )
      ).toBe(false);

      const colliding = {
        ...DEFAULT_SETTINGS.shortcuts,
        openSettings: 'Ctrl+K',
      };
      const conflicts = findShortcutConflicts(colliding);
      expect(conflicts['Ctrl+K']).toEqual(
        expect.arrayContaining(['commandPalette', 'openSettings'])
      );
      expect(countModifiedShortcuts(colliding, DEFAULT_SETTINGS.shortcuts)).toBe(1);
    });
  });

  describe('entityDirectory', () => {
    it('indexes all entity categories, resolves aliases, computes neighborhoods, and cascades deletes', () => {
      const demo = createDemoProjectData();
      const entries = listDirectoryEntities(demo);
      expect(entries.length).toBeGreaterThan(0);

      const targetChar = demo.characters[0];
      expect(targetChar).toBeDefined();
      const firstAlias = targetChar.aliases[0];
      if (firstAlias) {
        const resolved = findEntityByIdOrAlias(demo, firstAlias);
        expect(resolved?.id).toBe(targetChar.id);
      }

      const neighborhood = getEntityNeighborhood(demo, targetChar.id);
      expect(neighborhood.entry?.id).toBe(targetChar.id);

      const cleaned = cascadeDeleteEntity(demo, 'character', targetChar.id);
      expect(cleaned.characters.some((c) => c.id === targetChar.id)).toBe(false);
      for (const sc of cleaned.scenes) {
        expect(sc.povCharacterId).not.toBe(targetChar.id);
        expect(sc.characterIds).not.toContain(targetChar.id);
      }
      for (const ch of cleaned.characters) {
        expect(ch.relationships.some((r) => r.targetId === targetChar.id)).toBe(false);
      }
      for (const mm of cleaned.mindMaps) {
        expect(mm.nodes.some((n) => n.linkedEntityId === targetChar.id)).toBe(false);
      }
    });
  });

  describe('stagingResolver', () => {
    it('approves or rejects pending staging proposals without mutating canon on rejection', () => {
      const demo = createDemoProjectData();
      const pending = demo.stagingProposals.find((p) => p.status === 'pending');
      expect(pending).toBeDefined();
      if (!pending) return;

      const rejected = applyStagingDecision(demo, pending.id, 'rejected');
      expect(
        rejected.stagingProposals.find((p) => p.id === pending.id)?.status
      ).toBe('rejected');
      expect(rejected.characters.length).toBe(demo.characters.length);

      const approved = applyStagingDecision(demo, pending.id, 'approved');
      expect(
        approved.stagingProposals.find((p) => p.id === pending.id)?.status
      ).toBe('approved');
    });
  });

  describe('breadcrumbResolver', () => {
    it('resolves accented paths, settings sub-tabs, and world pillars to navigation targets', () => {
      expect(resolveBreadcrumbPathInput('configuracoes/atalhos')).toMatchObject({
        view: 'settings',
        subPath: 'shortcuts',
      });
      expect(resolveBreadcrumbPathInput('configuracoes/sobre')).toMatchObject({
        view: 'settings',
        subPath: 'about',
      });
      expect(resolveBreadcrumbPathInput('InkGraph / Mundo / Geografia')).toMatchObject({
        view: 'worlds',
        subPath: 'Geografia',
      });
      expect(resolveBreadcrumbPathInput('meu espaco')).toMatchObject({
        openHome: true,
      });
    });
  });

  describe('storageAdapter & themes', () => {
    const store = new Map<string, string>();
    const originalStorageDesc = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

    beforeEach(() => {
      store.clear();
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: {
          getItem: (key: string) => store.get(key) ?? null,
          setItem: (key: string, val: string) => {
            store.set(key, String(val));
          },
          removeItem: (key: string) => {
            store.delete(key);
          },
          clear: () => store.clear(),
        },
      });
    });

    afterEach(() => {
      if (originalStorageDesc) {
        Object.defineProperty(globalThis, 'localStorage', originalStorageDesc);
      } else {
        delete (globalThis as Record<string, unknown>).localStorage;
      }
    });

    it('writes, reloads, and verifies catalog + settings integrity synchronously', () => {
      const demo = createDemoProjectData();
      const res = verifyAndReloadStorage([demo], demo.id, DEFAULT_SETTINGS);

      expect(res.ok).toBe(true);
      expect(res.workspaceCount).toBe(1);
      expect(res.sceneCount).toBe(demo.scenes.length);
      expect(store.get(STORAGE_KEY_CATALOG)).toBeTruthy();
      expect(store.get(STORAGE_KEY_SETTINGS)).toBeTruthy();
    });

    it('builds all 6 dual-mode palettes across light, dark, and sepia modes', () => {
      expect(THEME_PALETTES).toHaveLength(6);
      expect(resolveEffectiveBrightness('light', 'dark')).toBe('light');
      expect(resolveEffectiveBrightness('sepia', 'dark')).toBe('sepia');

      for (const palette of THEME_PALETTES) {
        const lightTheme = buildThemeCssVars({
          ...DEFAULT_SETTINGS,
          themeBrightness: 'light',
          themePalette: palette.id,
        });
        const darkTheme = buildThemeCssVars({
          ...DEFAULT_SETTINGS,
          themeBrightness: 'dark',
          themePalette: palette.id,
        });
        expect(lightTheme.mode).toBe('light');
        expect(darkTheme.mode).toBe('dark');
        expect(lightTheme.vars['--bg-canvas']).not.toBe(darkTheme.vars['--bg-canvas']);
      }
    });
  });
});
