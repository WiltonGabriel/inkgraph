import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export function StoryDetailsCard() {
  const { project, updateProject } = useProject();
  const [showLoglineIdeas, setShowLoglineIdeas] = useState(false);

  const leadName = project.characters[0]?.name ?? 'o protagonista';
  const secondName = project.characters[1]?.name ?? 'um aliado improvável';
  const worldName = project.worlds[0]?.name ?? 'seu mundo';
  const facName = project.factions[0]?.name ?? 'a instituição dominante';

  const loglineSuggestions = [
    `Em "${project.title}" (${project.genre}), quando o equilíbrio de ${worldName} entra em colapso, ${leadName} precisa escolher entre a lealdade institucional e a sobrevivência daqueles que protege.`,
    `Confrontado por ${facName}, ${leadName} une forças com ${secondName} para revelar a verdade oculta nos arquivos de ${worldName} antes que o conflito se torne irreversível.`,
    `No território de ${worldName}, duas perspectivas opostas descobrem o segredo capaz de transformar a ordem vigente — ou destruir o último refúgio seguro.`,
  ];

  return (
    <div
      style={{
        backgroundColor: '#121621',
        border: '1px solid #1f2533',
        borderRadius: 10,
        padding: 18,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb' }}>
          Detalhes da História — Linha de Registro (Logline)
        </span>
        <button
          onClick={() => setShowLoglineIdeas((v) => !v)}
          style={{
            background: 'rgba(167, 139, 250, 0.12)',
            border: '1px solid rgba(167, 139, 250, 0.3)',
            color: '#c4b5fd',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11.5,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Wand2 size={12} /> Assistente de Logline
        </button>
      </div>
      <textarea
        value={project.logline}
        onChange={(e) =>
          updateProject((prev) => ({ ...prev, logline: e.target.value }))
        }
        placeholder="Um resumo de uma frase da sua história..."
        rows={2}
        style={{
          width: '100%',
          backgroundColor: '#0c0f17',
          border: '1px solid #242b3b',
          borderRadius: 7,
          padding: '10px 12px',
          color: '#e5e7eb',
          fontSize: 13,
          lineHeight: 1.5,
          resize: 'vertical',
        }}
      />
      {showLoglineIdeas && (
        <div
          style={{
            marginTop: 10,
            padding: 12,
            backgroundColor: '#0c0f17',
            border: '1px solid #283044',
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 600, color: '#a78bfa' }}>
            Sugestões de Logline baseadas nos seus dossiês (clique para aplicar):
          </div>
          {loglineSuggestions.map((sug, idx) => (
            <button
              key={idx}
              onClick={() => {
                updateProject((prev) => ({ ...prev, logline: sug }));
                setShowLoglineIdeas(false);
              }}
              style={{
                textAlign: 'left',
                padding: '8px 10px',
                backgroundColor: '#141926',
                border: '1px solid #232a3c',
                borderRadius: 6,
                color: '#d1d5db',
                fontSize: 12,
                cursor: 'pointer',
                lineHeight: 1.45,
              }}
            >
              {sug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
