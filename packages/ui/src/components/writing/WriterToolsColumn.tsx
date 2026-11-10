import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

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

interface WriterToolsColumnProps {
  onGenerateToScratchpad: (generatedText: string) => void;
}

export function WriterToolsColumn({ onGenerateToScratchpad }: WriterToolsColumnProps) {
  const { project, activeSceneId } = useProject();
  const [style, setStyle] = useState<(typeof STYLES)[number]>('Cinematográfico');
  const [tone, setTone] = useState<(typeof TONES)[number]>('Mais Suspense');

  const activeScene = project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0];
  const povChar =
    project.characters.find((c) => c.id === activeScene?.povCharacterId) ?? project.characters[0];
  const faction = project.factions[0];
  const world = project.worlds[0];

  const handleRunTool = (tool: (typeof TOOLS)[number]) => {
    const charName = povChar?.name ?? project.characters[0]?.name ?? 'Protagonista';
    const facName = faction?.name ?? 'a facção local';
    const worldName = world?.name ?? 'este território';
    const sceneTitle = activeScene?.title ?? 'Cena Atual';

    const outputs: Record<(typeof TOOLS)[number], string> = {
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

  return (
    <aside
      style={{
        width: 300,
        backgroundColor: '#0e1118',
        borderLeft: '1px solid #1b202c',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflowY: 'auto',
        padding: 14,
        gap: 14,
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#f3f4f6', marginBottom: 10 }}>
          <Wand2 size={14} color="#a78bfa" /> Parâmetros de Prosa
        </div>

        <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>
          Estilo Literário
        </label>
        <select
          value={style}
          onChange={(e) => setStyle(e.target.value as (typeof STYLES)[number])}
          style={{
            width: '100%',
            padding: '7px 10px',
            backgroundColor: '#141926',
            border: '1px solid #262f42',
            borderRadius: 6,
            color: '#f3f4f6',
            fontSize: 12,
            marginBottom: 10,
          }}
        >
          {STYLES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>
          Modulação de Tom
        </label>
        <select
          value={tone}
          onChange={(e) => setTone(e.target.value as (typeof TONES)[number])}
          style={{
            width: '100%',
            padding: '7px 10px',
            backgroundColor: '#141926',
            border: '1px solid #262f42',
            borderRadius: 6,
            color: '#f3f4f6',
            fontSize: 12,
          }}
        >
          {TONES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 11.5, fontWeight: 700, color: '#9ca3af', marginBottom: 2 }}>
          Ferramentas de Redação (9)
        </div>
        {TOOLS.map((tool) => (
          <button
            key={tool}
            onClick={() => handleRunTool(tool)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '8px 11px',
              backgroundColor: '#131824',
              border: '1px solid #222a3d',
              borderRadius: 6,
              color: '#e5e7eb',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{tool}</span>
            <span style={{ fontSize: 10, color: '#a78bfa' }}>Gerar</span>
          </button>
        ))}
      </div>
    </aside>
  );
}
