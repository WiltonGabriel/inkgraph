import { useState } from 'react';
import {
  ListTree,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import { useViewport } from '../hooks/useViewport';
import type { OutlineSection } from '../types/project';

export function OutlineGeneratorView() {
  const { project, setOutline, applyOutlineToManuscript, setActiveView } =
    useProject();
  const { isMobile } = useViewport();

  const [prompt, setPrompt] = useState(project.logline);
  const [genre, setGenre] = useState(project.genre);
  const [chapterCount, setChapterCount] = useState(6);
  const [pacing, setPacing] = useState<'default' | 'fast' | 'medium' | 'slow'>('default');
  const [includeTwist, setIncludeTwist] = useState(true);
  const [appliedBanner, setAppliedBanner] = useState(false);

  const handleGenerateOutline = () => {
    const baseIdea = prompt.trim() || 'o conflito central';
    const generated: OutlineSection[] = Array.from(
      { length: Math.max(3, Math.min(20, chapterCount)) },
      (_, idx) => {
        const ratio = (idx + 1) / chapterCount;
        const act: 1 | 2 | 3 = ratio <= 0.28 ? 1 : ratio <= 0.78 ? 2 : 3;
        const isTwistBeat =
          includeTwist && idx === Math.floor(chapterCount * 0.65);

        const titles = [
          'A Configuração e o Presságio',
          'O Incidente Incitante',
          'Cruzando a Fronteira Hostil',
          'Alianças Frágeis e Primeiras Pistas',
          'Ponto Médio: O Preço Oculto',
          'A Emboscada / Traição',
          'A Revelação Inesperada (Plot Twist)',
          'Noite Escura da Alma',
          'O Confronto Decisivo',
          'O Novo Equilíbrio',
        ];

        return {
          id: `out_gen_${Date.now()}_${idx}`,
          title: `Capítulo ${idx + 1}: ${titles[idx % titles.length]}`,
          description: isTwistBeat
            ? `Reviravolta crucial em ${genre}: uma verdade oculta inverte o que os protagonistas acreditavam sobre "${baseIdea}".`
            : `Desenvolvimento em ritmo ${pacing} focado em: ${baseIdea}.`,
          act,
          isTwist: isTwistBeat,
          targetWords: 3500,
        };
      }
    );
    setOutline(generated);
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const nextIdx = idx + dir;
    if (nextIdx < 0 || nextIdx >= project.outline.length) return;
    const copy = [...project.outline];
    const [removed] = copy.splice(idx, 1);
    copy.splice(nextIdx, 0, removed);
    setOutline(copy);
  };

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', height: '100%', overflow: 'hidden' }}>
      {/* Left: Idea & Advanced Options Form */}
      <div
        style={{
          width: isMobile ? '100%' : 370,
          maxHeight: isMobile ? '46vh' : undefined,
          backgroundColor: '#0e1118',
          borderRight: isMobile ? 'none' : '1px solid #1b202c',
          borderBottom: isMobile ? '1px solid #1b202c' : 'none',
          padding: 18,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#f3f4f6' }}>
          <ListTree size={16} color="#60a5fa" /> Estruturador de Capítulos
        </div>
        <p style={{ margin: 0, fontSize: 12, color: '#9ca3af', lineHeight: 1.45 }}>
          Crie uma espinha dorsal em 3 atos proporcional à quantidade de capítulos desejada.
        </p>

        <div>
          <label style={labelStyle}>Ideia / Prompt da História</label>
          <textarea
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex.: Um comandante cego precisa expor o pacto de sangue da Coroa..."
            style={textareaStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Gênero</label>
          <input
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="Ex.: Fantasia Política, Ficção Científica, Mistério"
            style={inputStyle}
          />
        </div>

        <div
          style={{
            padding: 12,
            backgroundColor: '#131824',
            border: '1px solid #242c3e',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb' }}>
            Opções Avançadas
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <label style={labelStyle}>Capítulos</label>
              <input
                type="number"
                min={3}
                max={24}
                value={chapterCount}
                onChange={(e) => setChapterCount(Number(e.target.value))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Ritmo</label>
              <select
                value={pacing}
                onChange={(e) => setPacing(e.target.value as typeof pacing)}
                style={inputStyle}
              >
                <option value="default">Padrão</option>
                <option value="fast">Ritmo acelerado</option>
                <option value="medium">Ritmo médio</option>
                <option value="slow">Queima lenta</option>
              </select>
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#d1d5db', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={includeTwist}
              onChange={(e) => setIncludeTwist(e.target.checked)}
            />
            Incluir uma reviravolta na história (Plot Twist)
          </label>
        </div>

        <button
          onClick={handleGenerateOutline}
          style={{
            padding: '10px 14px',
            backgroundColor: '#2563eb',
            color: '#fff',
            border: 'none',
            borderRadius: 7,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <ListTree size={15} /> Criar Estrutura em 3 Atos
        </button>
      </div>

      {/* Right: Interactive Outline Editor */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, maxWidth: 920 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 20, color: '#f9fafb' }}>
              Esboço Interativo ({project.outline.length} seções)
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#9ca3af' }}>
              Edite títulos, marque reviravoltas, reordene e aplique ao manuscrito.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() =>
                setOutline([
                  ...project.outline,
                  {
                    id: `out_${Date.now()}`,
                    title: `Capítulo ${project.outline.length + 1}: Nova Seção`,
                    description: 'Descreva o acontecimento principal desta seção.',
                    act: 2,
                    targetWords: 3000,
                  },
                ])
              }
              style={{
                padding: '8px 12px',
                backgroundColor: '#19202e',
                border: '1px solid #2c3548',
                borderRadius: 6,
                color: '#e5e7eb',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Plus size={14} /> Nova Seção
            </button>
            <button
              onClick={() => {
                applyOutlineToManuscript();
                setAppliedBanner(true);
                setTimeout(() => setAppliedBanner(false), 3000);
              }}
              style={{
                padding: '8px 14px',
                backgroundColor: '#10b981',
                color: '#052e16',
                border: 'none',
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Aplicar Esboço ao Manuscrito
            </button>
          </div>
        </div>

        {appliedBanner && (
          <div
            style={{
              marginBottom: 14,
              padding: '10px 14px',
              backgroundColor: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.35)',
              borderRadius: 8,
              color: '#34d399',
              fontSize: 12.5,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={15} /> Esboço sincronizado com os capítulos do Manuscrito!
            </span>
            <button
              onClick={() => setActiveView('manuscript')}
              style={{
                background: 'none',
                border: 'none',
                color: '#6ee7b7',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              Abrir Manuscrito →
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {project.outline.map((sec, idx) => (
            <div
              key={sec.id}
              style={{
                padding: 14,
                backgroundColor: '#121621',
                border: sec.isTwist
                  ? '1px solid rgba(245,158,11,0.5)'
                  : '1px solid #1f2533',
                borderRadius: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <input
                  value={sec.title}
                  onChange={(e) =>
                    setOutline(
                      project.outline.map((s) =>
                        s.id === sec.id ? { ...s, title: e.target.value } : s
                      )
                    )
                  }
                  style={{ ...inputStyle, fontWeight: 700 }}
                />
                <select
                  value={sec.act}
                  onChange={(e) =>
                    setOutline(
                      project.outline.map((s) =>
                        s.id === sec.id
                          ? { ...s, act: Number(e.target.value) as 1 | 2 | 3 }
                          : s
                      )
                    )
                  }
                  style={{ ...inputStyle, width: 95 }}
                >
                  <option value={1}>Ato I</option>
                  <option value={2}>Ato II</option>
                  <option value={3}>Ato III</option>
                </select>
                <button
                  onClick={() =>
                    setOutline(
                      project.outline.map((s) =>
                        s.id === sec.id ? { ...s, isTwist: !s.isTwist } : s
                      )
                    )
                  }
                  title="Marcar/desmarcar Reviravolta (Plot Twist)"
                  style={{
                    padding: '6px 9px',
                    backgroundColor: sec.isTwist
                      ? 'rgba(245,158,11,0.2)'
                      : '#181e2c',
                    border: '1px solid #2a3346',
                    borderRadius: 6,
                    color: sec.isTwist ? '#fbbf24' : '#6b7280',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  <Zap size={12} /> Twist
                </button>
                <button
                  onClick={() => moveSection(idx, -1)}
                  style={iconBtnStyle}
                  title="Mover para cima"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  onClick={() => moveSection(idx, 1)}
                  style={iconBtnStyle}
                  title="Mover para baixo"
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  onClick={() =>
                    setOutline(project.outline.filter((s) => s.id !== sec.id))
                  }
                  style={{ ...iconBtnStyle, color: '#ef4444' }}
                  title="Excluir seção"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <textarea
                rows={2}
                value={sec.description}
                onChange={(e) =>
                  setOutline(
                    project.outline.map((s) =>
                      s.id === sec.id ? { ...s, description: e.target.value } : s
                    )
                  )
                }
                style={textareaStyle}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11.5,
  fontWeight: 600,
  color: '#9ca3af',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#141926',
  border: '1px solid #262f42',
  borderRadius: 6,
  padding: '7px 10px',
  color: '#f3f4f6',
  fontSize: 12.5,
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#141926',
  border: '1px solid #262f42',
  borderRadius: 6,
  padding: '8px 10px',
  color: '#e5e7eb',
  fontSize: 12.5,
  lineHeight: 1.45,
  resize: 'vertical',
};

const iconBtnStyle: React.CSSProperties = {
  background: '#171c28',
  border: '1px solid #262f42',
  borderRadius: 6,
  color: '#9ca3af',
  padding: 6,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
};
