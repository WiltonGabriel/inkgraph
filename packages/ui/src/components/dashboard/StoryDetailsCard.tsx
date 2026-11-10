import { useState } from 'react';
import { Wand2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';

export function StoryDetailsCard() {
  const { project, updateProject } = useProject();
  const [showLoglineIdeas, setShowLoglineIdeas] = useState(false);

  const loglineSuggestions = [
    `Quando o segredo que sustenta ${project.worlds[0]?.name ?? 'o reino'} ameaça destruir os distritos baixos, ${project.characters[0]?.name ?? 'um comandante exilado'} precisa escolher entre a lealdade institucional e a sobrevivência de seu povo.`,
    `Traído pela própria ${project.factions[0]?.name ?? 'ordem militar'}, um veterano cego une forças com uma arquivista clandestina para expor o crime fundador da Coroa antes que a capital congele.`,
    `Em uma cidade movida pela queima de memórias humanas, duas mentes opostas descobrem a gravação capaz de derrubar o trono — ou apagar o último refúgio da humanidade.`,
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
