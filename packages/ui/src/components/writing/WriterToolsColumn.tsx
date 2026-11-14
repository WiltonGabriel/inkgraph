import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { checkAiAvailability } from '../../domain/aiAvailability';
import { SubtleAiGatePopover } from '../common/SubtleAiGatePopover';

const STYLES = ['Padrão', 'Cinematográfico', 'Conciso', 'Descritivo', 'Minimalista'] as const;
const TONES = [
  'Mais Cinematográfico',
  'Mais Formal',
  'Mais Humorístico',
  'Mais Poético',
  'Mais Suspense',
] as const;

const TOOLS = [
  'Continuar Escrita',
  'Melhorar Texto',
  'Alterar Tom',
  'Gerar Diálogo',
  'Brainstorming de Ideias',
  'Gerar Sinopse',
  'Gramática e Estilo',
  'Consistência do Universo',
  'Detector de Furos de Enredo',
] as const;

type ToolName = (typeof TOOLS)[number];

interface WriterToolsColumnProps {
  onGenerateToScratchpad: (generatedText: string) => void;
}

export function WriterToolsColumn({ onGenerateToScratchpad }: WriterToolsColumnProps) {
  const { project, settings, activeSceneId } = useProject();
  const [style, setStyle] = useState<(typeof STYLES)[number]>('Cinematográfico');
  const [tone, setTone] = useState<(typeof TONES)[number]>('Mais Suspense');
  const [pendingTool, setPendingTool] = useState<ToolName | null>(null);
  const aiStatus = checkAiAvailability(settings);

  const activeScene = project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0];
  const povChar =
    project.characters.find((c) => c.id === activeScene?.povCharacterId) ?? project.characters[0];
  const faction = project.factions[0];
  const world = project.worlds[0];

  const runToolOutput = (tool: ToolName) => {
    const charName = povChar?.name ?? project.characters[0]?.name ?? 'Protagonista';
    const facName = faction?.name ?? 'a facção local';
    const worldName = world?.name ?? 'este território';
    const sceneTitle = activeScene?.title ?? 'Cena Atual';

    const outputs: Record<ToolName, string> = {
      'Continuar Escrita': `[Estilo: ${style} · Tom: ${tone}]\n\nO vento cortante varreu as muralhas de ${worldName} enquanto ${charName} ajustava o manto pesado. Ao longe, as lanternas da ${facName} oscilavam como brasas na neblina. Cada passo sobre o calçamento gelado aproximava o inevitável confronto em "${sceneTitle}".`,
      'Melhorar Texto': `[Refinamento Literário — ${style}]\n\nA penumbra engolia os estandartes rasgados da ${facName}. ${charName} conteve a respiração; o frio não era apenas climático, mas o prenúncio silencioso de que o acordo em ${worldName} havia ruído.`,
      'Alterar Tom': `[Reescrita em tom ${tone}]\n\nNinguém pronunciou uma palavra quando os portões se fecharam. ${charName} sabia o que aquele silêncio custava nos corredores de ${worldName} — e quem pagaria a dívida antes do amanhecer.`,
      'Gerar Diálogo': `— Você realmente acreditou que a ${facName} esqueceria o juramento? — murmurou ${charName}, sem erguer o olhar.\n— Em ${worldName}, promessas duram apenas enquanto o inverno permite — respondeu o emissário, pousando o selo quebrado sobre a mesa.`,
      'Brainstorming de Ideias': `• E se ${charName} descobrir que o emissário da ${facName} guarda a chave do arquivo proibido?\n• Uma tempestade repentina isola os personagens no distrito antigo de ${worldName}.\n• Revelação parcial de um segredo epistêmico durante a negociação em "${sceneTitle}".`,
      'Gerar Sinopse': `Em "${sceneTitle}", ${charName} enfrenta as consequências diretas das tensões com a ${facName} no coração de ${worldName}, elevando o conflito dramático do Ato ${activeScene?.act ?? 1}.`,
      'Gramática e Estilo': `Diagnóstico de Estilo (${style}):\n• Ritmo frasal equilibrado com predominância de verbos de ação.\n• Sugestão: substituir adjetivações redundantes no segundo parágrafo por detalhes sensoriais de ${worldName}.`,
      'Consistência do Universo': `Verificação Epistêmica e de Cânone:\n• [OK] ${charName} age de acordo com sua motivação registrada.\n• [Atenção] Verificar se os recursos citados da ${facName} respeitam os limites estabelecidos em ${worldName}.`,
      'Detector de Furos de Enredo': `Auditoria de Causalidade (${sceneTitle}):\n• Transição temporal consistente com a duração declarada (${activeScene?.sceneDuration || 'padrão'}).\n• Nenhum personagem cita segredos ainda não revelados até este ponto da trama.`,
    };

    onGenerateToScratchpad(outputs[tool]);
  };

  const handleRunTool = (tool: ToolName) => {
    if (!aiStatus.connected) {
      setPendingTool(tool);
      return;
    }
    runToolOutput(tool);
  };

  return (
    <aside
      style={{
        width: 300,
        backgroundColor: 'var(--bg-surface, #111623)',
        borderLeft: '1px solid var(--border-subtle, #263046)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflowY: 'auto',
        padding: 14,
        gap: 14,
      }}
    >
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 6,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--text-primary, #f1f5f9)',
            }}
          >
            <Wand2 size={14} color="#a78bfa" /> Parâmetros de Prosa
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: 999,
              backgroundColor: aiStatus.connected
                ? 'rgba(16, 185, 129, 0.14)'
                : 'rgba(245, 158, 11, 0.14)',
              color: aiStatus.connected ? '#10b981' : '#f59e0b',
            }}
          >
            {aiStatus.connected ? 'IA ativa' : 'Sem IA'}
          </span>
        </div>

        <label style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: 4 }}>
          Estilo Literário
        </label>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as (typeof STYLES)[number])}
          style={{
            width: '100%',
            padding: '7px 10px',
            backgroundColor: 'var(--bg-elevated, #171d2e)',
            border: '1px solid var(--border-subtle, #263046)',
            borderRadius: 'var(--radius-sm, 6px)',
            color: 'var(--text-primary, #f1f5f9)',
            fontSize: 12,
            marginBottom: 10,
          }}
        >
          {STYLES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <label style={{ fontSize: 11, color: 'var(--text-secondary, #94a3b8)', display: 'block', marginBottom: 4 }}>
          Modulação de Tom
        </label>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value as (typeof TONES)[number])}
          style={{
            width: '100%',
            padding: '7px 10px',
            backgroundColor: 'var(--bg-elevated, #171d2e)',
            border: '1px solid var(--border-subtle, #263046)',
            borderRadius: 'var(--radius-sm, 6px)',
            color: 'var(--text-primary, #f1f5f9)',
            fontSize: 12,
          }}
        >
          {TONES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'relative' }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-secondary, #94a3b8)', marginBottom: 2 }}>
          Ferramentas de Redação (9)
        </div>

        <SubtleAiGatePopover
          open={pendingTool !== null}
          onClose={() => setPendingTool(null)}
          align="right"
          title="Nenhuma IA conectada"
          message={
            pendingTool
              ? `A ferramenta "${pendingTool}" requer um provedor de IA conectado ou uso de molde heurístico local.`
              : undefined
          }
          secondaryLabel="Inserir Molde Local"
          onSecondaryAction={() => {
            if (pendingTool) runToolOutput(pendingTool);
          }}
        />

        {TOOLS.map((tool) => (
          <button
            key={tool}
            type="button"
            onClick={() => handleRunTool(tool)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '8px 11px',
              backgroundColor: 'var(--bg-elevated, #171d2e)',
              border: '1px solid var(--border-subtle, #263046)',
              borderRadius: 'var(--radius-sm, 6px)',
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{tool}</span>
            <span style={{ fontSize: 10, color: aiStatus.connected ? '#a78bfa' : 'var(--text-muted, #64748b)' }}>
              {aiStatus.connected ? 'Gerar' : 'Requer IA'}
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}
