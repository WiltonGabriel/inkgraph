import { useId, useState } from 'react';
import { Wand2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { DASHBOARD_CARD_STYLE, DASHBOARD_SUBCARD_STYLE } from './dashboardTheme';

export function StoryDetailsCard() {
  const { project, updateProject } = useProject();
  const [showLoglineIdeas, setShowLoglineIdeas] = useState(false);
  const textareaId = useId();

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
    <section
      className="ig-card-interactive"
      style={{
        ...DASHBOARD_CARD_STYLE,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          marginBottom: 8,
        }}
      >
        <label
          htmlFor={textareaId}
          style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}
        >
          Detalhes da História — Linha de Registro (Logline)
        </label>
        <button
          type="button"
          aria-expanded={showLoglineIdeas}
          onClick={() => setShowLoglineIdeas((v) => !v)}
          style={{
            backgroundColor: 'var(--accent-soft)',
            border: '1px solid color-mix(in srgb, var(--accent-primary) 35%, var(--border-subtle))',
            color: 'var(--accent-primary)',
            borderRadius: 'var(--radius-sm, 6px)',
            padding: '4px 10px',
            fontSize: 11.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Wand2 size={12} /> Assistente de Logline
        </button>
      </div>

      <textarea
        id={textareaId}
        value={project.logline}
        onChange={(e) =>
          updateProject((prev) => ({ ...prev, logline: e.target.value }))
        }
        placeholder="Um resumo de uma frase da sua história..."
        rows={2}
        style={{
          width: '100%',
          backgroundColor: 'var(--bg-canvas)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm, 6px)',
          padding: '10px 12px',
          color: 'var(--text-primary)',
          fontSize: 13,
          lineHeight: 1.5,
          resize: 'vertical',
        }}
      />

      {showLoglineIdeas && (
        <div
          style={{
            ...DASHBOARD_SUBCARD_STYLE,
            marginTop: 10,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--accent-primary)' }}>
            Sugestões de Logline baseadas nos seus dossiês (clique para aplicar):
          </div>
          {loglineSuggestions.map((sug, idx) => (
            <button
              key={idx}
              type="button"
              className="ig-tile-interactive"
              onClick={() => {
                updateProject((prev) => ({ ...prev, logline: sug }));
                setShowLoglineIdeas(false);
              }}
              style={{
                textAlign: 'left',
                padding: '8px 10px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm, 6px)',
                color: 'var(--text-secondary)',
                fontSize: 12,
                lineHeight: 1.45,
              }}
            >
              {sug}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
