import { describe, expect, it } from 'vitest';
import {
  applyOffsetPatchesBackToFront,
  IncarnationTracker,
  ProForgeSupervisorAgent,
  retrieveRelevantContext,
  runGatewayCompletion,
} from '../src/index';

describe('@inkgraph/ai gateway, retriever & supervisor', () => {
  it('enforces offline guard and hybrid fallback to Ollama when cloud fails', async () => {
    const localBlocked = await runGatewayCompletion({
      config: {
        aiMode: 'local',
        aiProvider: 'gemini',
        geminiApiKey: 'secret',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.2:3b',
        aiTemperature: 0.7,
        aiMaxTokens: 512,
      },
      systemPrompt: 'sys',
      userPrompt: 'usr',
    });
    expect(localBlocked.ok).toBe(false);

    const mockFetch: typeof fetch = async (input) => {
      const url = String(input);
      if (url.includes('generativelanguage')) {
        throw new Error('Network offline');
      }
      return new Response(
        JSON.stringify({ message: { content: 'Fallback response from local Ollama' } }),
        { status: 200 }
      );
    };

    const hybrid = await runGatewayCompletion({
      config: {
        aiMode: 'hybrid',
        aiProvider: 'gemini',
        geminiApiKey: 'test-key',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.2:3b',
        aiTemperature: 0.7,
        aiMaxTokens: 512,
      },
      systemPrompt: 'sys',
      userPrompt: 'usr',
      fetchFn: mockFetch,
    });
    expect(hybrid.ok).toBe(true);
    if (hybrid.ok) {
      expect(hybrid.providerUsed).toBe('ollama');
      expect(hybrid.text).toContain('Fallback response');
    }
  });

  it('discards stale AI responses when workspace incarnation changes', async () => {
    const tracker = new IncarnationTracker();
    const { incarnation, release } = tracker.registerController();
    const delayedFetch: typeof fetch = async () => {
      tracker.bump(); // simulate workspace switch while in-flight
      return new Response(JSON.stringify({ message: { content: 'Late answer' } }), { status: 200 });
    };

    const res = await runGatewayCompletion(
      {
        config: {
          aiMode: 'local',
          aiProvider: 'ollama',
          geminiApiKey: '',
          ollamaUrl: 'http://localhost:11434',
          ollamaModel: 'llama3.2:3b',
          aiTemperature: 0.7,
          aiMaxTokens: 256,
        },
        systemPrompt: 'sys',
        userPrompt: 'usr',
        incarnation,
        fetchFn: delayedFetch,
      },
      tracker
    );
    release();

    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.stale).toBe(true);
    }
  });

  it('applies back-to-front offset edits cleanly and supports supervisor rollback', async () => {
    const patched = applyOffsetPatchesBackToFront('O vento frio cortou o porto antigo.', [
      { start: 2, end: 12, replacement: 'nevoeiro denso' },
      { start: 22, end: 27, replacement: 'cais' },
    ]);
    expect(patched).toBe('O nevoeiro denso cortou o cais antigo.');

    expect(() =>
      applyOffsetPatchesBackToFront('abcdef', [
        { start: 1, end: 4, replacement: 'X' },
        { start: 3, end: 5, replacement: 'Y' },
      ])
    ).toThrowError(/Overlapping/);

    const agent = new ProForgeSupervisorAgent();
    const exec = await agent.executeStage({
      stage: '3. Linha e Prosa',
      sceneTitle: 'Cais',
      sceneSummary: 'Entrada',
      sceneContent: 'Texto original.',
      config: {
        aiMode: 'local',
        aiProvider: 'ollama',
        geminiApiKey: '',
        ollamaUrl: 'http://localhost:11434',
        ollamaModel: 'llama3.2:3b',
        aiTemperature: 0.5,
        aiMaxTokens: 300,
      },
      fetchFn: async () =>
        new Response(JSON.stringify({ message: { content: 'Texto revisado.' } }), { status: 200 }),
    });
    expect(exec.ok).toBe(true);
    expect(agent.rollbackToLastCheckpoint()).toBe('Texto original.');
  });

  it('ranks relevant story context purely offline using BM25 retrieval', () => {
    const hits = retrieveRelevantContext('tratado secreto norte cartografia', [
      { id: '1', kind: 'character', title: 'Elias Vance', text: 'Cartógrafo exilado que forjou o tratado do norte.' },
      { id: '2', kind: 'world', title: 'Taverna Sul', text: 'Cerveja quente e música portuária.' },
    ]);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.chunk.id).toBe('1');
  });
});
