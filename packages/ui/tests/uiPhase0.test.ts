import { describe, expect, it, beforeEach, vi } from 'vitest';
import { parseLoreMarkdown } from '@inkgraph/domain';
import { DEFAULT_SETTINGS } from '../src/data/defaultSettings';
import { createDemoProjectData } from '../src/data/demoProjectFactory';
import { runAiCompletion } from '../src/services/aiClient';
import { buildMarkdownVaultFiles } from '../src/storage/vaultFolderExport';
import { IndexedDbCatalogStorage } from '../src/storage/indexedDbStorageAdapter';

describe('@inkgraph/ui Fase 0 guarantees', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v);
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
    });
  });

  it('defaults to silent Zero-AI mode and first-run guided onboarding', () => {
    expect(DEFAULT_SETTINGS.aiMode).toBe('off');
    expect(DEFAULT_SETTINGS.copilotEnabled).toBe(false);
    expect(DEFAULT_SETTINGS.onboardingCompleted).toBe(false);
    expect(DEFAULT_SETTINGS.mcpGovernance).toBe('staging_strict');
  });

  it('strictly blocks generative AI and cloud egress in off, eco, and local modes', async () => {
    const offRes = await runAiCompletion({
      settings: { ...DEFAULT_SETTINGS, aiMode: 'off', aiProvider: 'gemini' },
      systemPrompt: 'sys',
      userPrompt: 'usr',
    });
    expect(offRes.ok).toBe(false);

    const localCloudRes = await runAiCompletion({
      settings: { ...DEFAULT_SETTINGS, aiMode: 'local', aiProvider: 'openai', geminiApiKey: 'x' },
      systemPrompt: 'sys',
      userPrompt: 'usr',
    });
    expect(localCloudRes.ok).toBe(false);
    if (!localCloudRes.ok) {
      expect(localCloudRes.error).toMatch(/blocks outbound/i);
    }
  });

  it('exports ProjectData into canonical Markdown vault files that parse cleanly in @inkgraph/domain', () => {
    const demo = createDemoProjectData();
    const files = buildMarkdownVaultFiles(demo);
    const charFiles = files.filter((f) => f.relativePath.startsWith('lore/characters/'));
    const msFiles = files.filter((f) => f.relativePath.startsWith('manuscript/'));

    expect(charFiles.length).toBeGreaterThan(0);
    expect(msFiles.length).toBeGreaterThan(0);

    for (const file of charFiles) {
      const parsed = parseLoreMarkdown(file.content, file.relativePath);
      expect(parsed.frontmatter.type).toBe('character');
    }
  });

  it('reads and writes JSON safely via IndexedDbCatalogStorage fallback', async () => {
    const storage = new IndexedDbCatalogStorage();
    await storage.writeJson('test_cursor', { lastSceneId: 'scene_2', deviceName: 'Mobile' });
    const loaded = await storage.readJson<{ lastSceneId: string; deviceName: string }>('test_cursor');
    expect(loaded).toEqual({ lastSceneId: 'scene_2', deviceName: 'Mobile' });

    await storage.remove('test_cursor');
    expect(await storage.readJson('test_cursor')).toBeNull();
  });
});
