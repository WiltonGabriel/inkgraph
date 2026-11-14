import type { CompiledMemoryPacket } from '../../domain/memoryCompiler';
import type { ProjectData, Scene, StagingProposal, ViewId } from '../../types/project';

export interface CopilotChatTurn {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  suggestedSnippet?: string;
  appliedAction?: 'staging' | 'draft';
}

export function buildContextualReply(
  promptText: string,
  project: ProjectData,
  activeView: ViewId,
  activeScene: Scene | undefined,
  packet: CompiledMemoryPacket
): CopilotChatTurn {
  const q = promptText.toLowerCase();

  if (q.includes('diagnóstico') || q.includes('urgente')) {
    const avgTension =
      project.scenes.length > 0
        ? Math.round(
            project.scenes.reduce((a, b) => a + b.tension, 0) / project.scenes.length
          )
        : 0;
    const secretsWithReveal = project.characters.flatMap((c) =>
      c.epistemicSecrets.filter((s) => s.revealedInSceneId)
    );
    const alertNote =
      packet.epistemicAlerts.length > 0
        ? `• Alertas epistêmicos na cena: ${packet.epistemicAlerts.length} possível(is) vazamento(s) detectado(s).`
        : secretsWithReveal.length > 0
          ? '• Ponto de atenção epistêmico: existem segredos marcados para revelação. Verifique se nenhuma cena anterior trata personagens como cientes antes do tempo.'
          : '• Elenco, cenas e fronteira epistêmica sincronizados.';

    return {
      id: `turn_${Date.now()}`,
      role: 'assistant',
      text: `Diagnóstico concluído — contexto compilado (${packet.totalEstimatedTokens}/${packet.budgetTokens} tokens).\n• Cenas mapeadas: ${project.scenes.length} (Tensão média: ${avgTension}%)\n• Elenco: ${project.characters.length} personagens e ${project.factions.length} facções ativas.\n${alertNote}`,
    };
  }

  if (q.includes('abertura') || q.includes('melhorar')) {
    const leadChar = project.characters[0]?.name ?? 'personagem';
    const snippet = activeScene
      ? `O silêncio que se seguiu não era de paz, mas de ferro represado — como se as próprias sombras sob os pés de ${leadChar} aguardassem a primeira faísca.`
      : undefined;
    return {
      id: `turn_${Date.now()}`,
      role: 'assistant',
      text: `Para fortalecer "${activeScene?.title ?? 'sua cena ativa'}", intensifique o contraste sensorial logo nos primeiros parágrafos e ancore o conflito imediato da cena. Sugestão pronta para enviar ao Staging ou aplicar com snapshot:`,
      suggestedSnippet: snippet,
    };
  }

  if (q.includes('tensão')) {
    const firstTension = project.scenes[0]?.tension ?? 60;
    const lastTension = project.scenes[project.scenes.length - 1]?.tension ?? 90;
    return {
      id: `turn_${Date.now()}`,
      role: 'assistant',
      text: `Sua curva de tensão varia de ${firstTension}% no início até ${lastTension}% nos momentos finais. Para evitar fadiga do leitor entre cenas de pico, intercale momentos de reflexão ou dilema interno antes dos confrontos decisivos.`,
    };
  }

  if (q.includes('epistêmic') || q.includes('segredo') || q.includes('memória')) {
    const alertSummary =
      packet.epistemicAlerts.length > 0
        ? packet.epistemicAlerts.map((a) => `• ${a.entityName}: ${a.message}`).join('\n')
        : '• Nenhum vazamento epistêmico detectado na cena em foco.';
    return {
      id: `turn_${Date.now()}`,
      role: 'assistant',
      text: `Estado da memória em 4 camadas (${packet.totalEstimatedTokens}/${packet.budgetTokens} tokens):\n${packet.sessionHandoff}\n${alertSummary}`,
    };
  }

  return {
    id: `turn_${Date.now()}`,
    role: 'assistant',
    text: `Analisando o contexto de "${project.title}" (tela atual: ${activeView}): você tem ${project.characters.length} personagens, ${project.factions.length} facções e ${project.scenes.length} cenas sincronizadas. Posso gerar trechos para "${activeScene?.title ?? 'o capítulo atual'}" ou auditar relações no Grafo.`,
    suggestedSnippet: `[Nota de cena gerada pelo Copiloto: destacar a tensão política entre ${project.factions[0]?.name ?? 'a Ordem'} e ${project.factions[1]?.name ?? 'a Coroa'}.]`,
  };
}

export function createCopilotStagingProposal(
  activeScene: Scene,
  snippet: string,
  packet: CompiledMemoryPacket
): StagingProposal {
  const cleanSnippet = snippet.trim();
  const existingTrimmed = activeScene.content.trimEnd();
  return {
    id: `stg_copilot_${Date.now()}`,
    fileName: `${activeScene.id}_copilot.md`,
    targetPath: `workspace/staging/proposals/${activeScene.id}_copilot.md`,
    canonicalPath: `workspace/manuscript/${activeScene.id}.md`,
    entityType: 'scene',
    entityName: activeScene.title,
    action: 'update',
    rationale: 'Trecho sugerido pelo Copiloto aguardando revisão e canonização em Staging.',
    createdAt: new Date().toLocaleString('pt-BR'),
    status: 'pending',
    epistemicImpact: packet.epistemicAlerts.map((a) => a.message),
    proposedFrontmatter: {
      id: activeScene.id,
      chapterNumber: activeScene.chapterNumber,
      act: activeScene.act,
      status: activeScene.status,
      source: 'copilot',
    },
    existingMarkdown: activeScene.content,
    proposedMarkdown: existingTrimmed
      ? `${existingTrimmed}\n\n${cleanSnippet}`
      : cleanSnippet,
  };
}
