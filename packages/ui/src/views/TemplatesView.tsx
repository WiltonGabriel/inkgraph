import { useState } from 'react';
import {
  LayoutTemplate,
  Sparkles,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import {
  NARRATIVE_TEMPLATES,
  type NarrativeTemplate,
} from '../data/initialProjectData';

export function TemplatesView() {
  const { applyTemplateToProject } = useProject();

  const [filter, setFilter] = useState<'Todos' | 'Estrutura' | 'Gênero'>('Todos');
  const [selectedTemplate, setSelectedTemplate] = useState<NarrativeTemplate>(
    NARRATIVE_TEMPLATES[0]
  );
  const [remixMode, setRemixMode] = useState(false);
  const [remixedSections, setRemixedSections] = useState(
    NARRATIVE_TEMPLATES[0].sections
  );
  const [aiConcept, setAiConcept] = useState('');

  const visibleTemplates = NARRATIVE_TEMPLATES.filter(
    (t) => filter === 'Todos' || t.category === filter
  );

  const handleSelectTemplate = (tpl: NarrativeTemplate) => {
    setSelectedTemplate(tpl);
    setRemixedSections(tpl.sections);
    setRemixMode(false);
  };

  const handleApply = (replaceManuscript: boolean) => {
    const customized: NarrativeTemplate = {
      ...selectedTemplate,
      sections: remixedSections.map((s) => ({
        ...s,
        description: aiConcept.trim()
          ? `${s.description} [Contexto personalizado: ${aiConcept.trim()}]`
          : s.description,
      })),
    };
    applyTemplateToProject(customized, replaceManuscript);
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 46px)', overflow: 'hidden' }}>
      {/* Left: Template Catalog */}
      <div
        style={{
          width: 370,
          backgroundColor: '#0e1118',
          borderRight: '1px solid #1b202c',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        <div style={{ padding: 16, borderBottom: '1px solid #1b202c' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#f3f4f6', marginBottom: 6 }}>
            <LayoutTemplate size={16} color="#f59e0b" /> Biblioteca de Modelos
          </div>
          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#9ca3af' }}>
            Escolha uma estrutura provada ou remixe as seções antes de aplicar.
          </p>

          <div style={{ display: 'flex', gap: 6 }}>
            {(['Todos', 'Estrutura', 'Gênero'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid #262e40',
                  backgroundColor: filter === cat ? '#2563eb' : '#141824',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {visibleTemplates.map((tpl) => {
            const active = selectedTemplate.id === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => handleSelectTemplate(tpl)}
                style={{
                  padding: 12,
                  backgroundColor: active ? '#172033' : '#131722',
                  border: active ? '1px solid #f59e0b' : '1px solid #1f2533',
                  borderRadius: 8,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: '#f3f4f6' }}>
                    {tpl.name}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '2px 7px',
                      borderRadius: 999,
                      backgroundColor: '#1b2232',
                      color: tpl.category === 'Estrutura' ? '#60a5fa' : '#34d399',
                      fontWeight: 600,
                    }}
                  >
                    {tpl.category} · {tpl.sections.length} seções
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: '#9ca3af', lineHeight: 1.4 }}>
                  {tpl.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Preview & Remix Workspace */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, maxWidth: 920 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ margin: '0 0 6px', fontSize: 22, color: '#f9fafb' }}>
              Visualização: {selectedTemplate.name}
            </h2>
            <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
              {selectedTemplate.arc}
            </p>
          </div>
          <button
            onClick={() => setRemixMode((r) => !r)}
            style={{
              padding: '8px 14px',
              backgroundColor: remixMode ? '#f59e0b' : '#19202e',
              color: remixMode ? '#111827' : '#fbbf24',
              border: '1px solid rgba(245,158,11,0.4)',
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {remixMode ? 'Modo Remix Ativo' : 'Remixar este modelo'}
          </button>
        </div>

        {/* Personalize with AI Box */}
        <div
          style={{
            padding: 16,
            backgroundColor: '#121621',
            border: '1px solid #242c3e',
            borderRadius: 10,
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 700, color: '#c4b5fd', marginBottom: 6 }}>
            <Sparkles size={15} /> Personalizar com IA (Opcional)
          </div>
          <input
            value={aiConcept}
            onChange={(e) => setAiConcept(e.target.value)}
            placeholder="Ex.: Um detetive cego investigando o esgotamento térmico da capital..."
            style={{
              width: '100%',
              backgroundColor: '#0c0f17',
              border: '1px solid #262f42',
              borderRadius: 6,
              padding: '8px 12px',
              color: '#f3f4f6',
              fontSize: 12.5,
              marginBottom: 12,
            }}
          />
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => handleApply(false)}
              style={{
                padding: '9px 16px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 7,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Check size={14} /> Aplicar ao Gerador de Contorno
            </button>
            <button
              onClick={() => handleApply(true)}
              style={{
                padding: '9px 16px',
                backgroundColor: '#10b981',
                color: '#052e16',
                border: 'none',
                borderRadius: 7,
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Aplicar Diretamente aos Capítulos do Manuscrito
            </button>
          </div>
        </div>

        {/* Sections List */}
        <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#e5e7eb' }}>
          Seções do Modelo ({remixedSections.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {remixedSections.map((sec, idx) => (
            <div
              key={idx}
              style={{
                padding: 14,
                backgroundColor: '#121621',
                border: sec.isTwist
                  ? '1px solid rgba(245, 158, 11, 0.45)'
                  : '1px solid #1f2533',
                borderRadius: 8,
              }}
            >
              {remixMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      value={sec.title}
                      onChange={(e) =>
                        setRemixedSections((prev) =>
                          prev.map((s, i) =>
                            i === idx ? { ...s, title: e.target.value } : s
                          )
                        )
                      }
                      style={{
                        flex: 1,
                        backgroundColor: '#0c0f17',
                        border: '1px solid #283044',
                        borderRadius: 5,
                        padding: '6px 8px',
                        color: '#f3f4f6',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    />
                    <button
                      onClick={() =>
                        setRemixedSections((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={sec.description}
                    onChange={(e) =>
                      setRemixedSections((prev) =>
                        prev.map((s, i) =>
                          i === idx ? { ...s, description: e.target.value } : s
                        )
                      )
                    }
                    style={{
                      width: '100%',
                      backgroundColor: '#0c0f17',
                      border: '1px solid #283044',
                      borderRadius: 5,
                      padding: '6px 8px',
                      color: '#d1d5db',
                      fontSize: 12,
                    }}
                  />
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 700, color: '#f3f4f6' }}>
                      {sec.title}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {sec.isTwist && (
                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(245,158,11,0.18)', color: '#fbbf24', fontWeight: 700 }}>
                          Reviravolta (Twist)
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: '#60a5fa', fontWeight: 600 }}>
                        Ato {sec.act}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 12.5, color: '#9ca3af', lineHeight: 1.45 }}>
                    {sec.description}
                  </div>
                </>
              )}
            </div>
          ))}

          {remixMode && (
            <button
              onClick={() =>
                setRemixedSections((prev) => [
                  ...prev,
                  {
                    title: 'Nova Seção Personalizada',
                    description: 'Descreva o objetivo dramático desta batida.',
                    act: 2,
                  },
                ])
              }
              style={{
                padding: 10,
                backgroundColor: '#151a26',
                border: '1px dashed #374151',
                borderRadius: 8,
                color: '#60a5fa',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Plus size={14} /> Adicionar Seção ao Remix
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
