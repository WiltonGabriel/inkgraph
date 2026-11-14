import { useState, useMemo } from 'react';
import { HelpCircle, Search, Keyboard, Layers, ArrowUpRight } from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import {
  SHORTCUT_CATEGORY_LABELS,
  SHORTCUT_DEFINITIONS,
  type ShortcutCategoryId,
} from '../domain/shortcutManager';

const DOC_ARTICLES = [
  {
    id: 'canon-staging',
    titlePt: 'Separação entre Cânone e Staging',
    titleEn: 'Canon & Staging Separation',
    summaryPt:
      'Arquivos confirmados residem em ./workspace/lore/ e ./workspace/manuscript/. Sugestões automatizadas aguardam revisão em ./workspace/staging/.',
    summaryEn:
      'Confirmed canon lives in ./workspace/lore/ and ./workspace/manuscript/. Automated proposals await review in ./workspace/staging/.',
  },
  {
    id: 'epistemic-engine',
    titlePt: 'Rastreamento Epistêmico de Segredos',
    titleEn: 'Epistemic Secret Tracking',
    summaryPt:
      'O motor distingue o que o Autor sabe, o que o Leitor descobriu até a cena X e o que cada Personagem sabe individualmente.',
    summaryEn:
      'The engine separates what the Author knows, what the Reader has discovered up to scene X, and what each Character knows.',
  },
  {
    id: 'markdown-truth',
    titlePt: 'Arquitetura Markdown-First & FTS5',
    titleEn: 'Markdown-First Architecture & FTS5',
    summaryPt:
      'Os documentos Markdown com YAML frontmatter são a fonte única da verdade. O índice relacional e FTS5 pode ser reconstruído a qualquer momento.',
    summaryEn:
      'Markdown files with YAML frontmatter are the single source of truth. Relational and FTS5 indexes can be rebuilt anytime.',
  },
  {
    id: 'norm-compile',
    titlePt: 'Compilação Editorial e Lauda 60×30',
    titleEn: 'Editorial Compilation & Standard Manuscript',
    summaryPt:
      'Exporte o manuscrito em HTML paginado, capítulos limpos ou lauda padronizada de 60 caracteres por 30 linhas.',
    summaryEn:
      'Export your manuscript in paginated HTML, clean chapters, or standardized manuscript formatting.',
  },
];

const CATEGORY_ORDER: ShortcutCategoryId[] = ['navigation', 'views', 'editor', 'canvas'];

export function HelpView() {
  const { settings, navigateToBreadcrumbPath } = useProject();
  const [query, setQuery] = useState('');
  const isEn = settings.language === 'en';

  const q = query.trim().toLowerCase();

  const filteredDocs = useMemo(() => {
    if (!q) return DOC_ARTICLES;
    return DOC_ARTICLES.filter((a) => {
      const title = isEn ? a.titleEn : a.titlePt;
      const summary = isEn ? a.summaryEn : a.summaryPt;
      return title.toLowerCase().includes(q) || summary.toLowerCase().includes(q);
    });
  }, [q, isEn]);

  const groupedShortcuts = useMemo(() => {
    return CATEGORY_ORDER.map((category) => {
      const items = SHORTCUT_DEFINITIONS.filter((def) => {
        if (def.category !== category) return false;
        if (!q) return true;
        const label = isEn ? def.labelEn : def.labelPt;
        const desc = isEn ? def.descEn : def.descPt;
        const binding = settings.shortcuts[def.key] || '';
        return (
          label.toLowerCase().includes(q) ||
          desc.toLowerCase().includes(q) ||
          binding.toLowerCase().includes(q)
        );
      });
      return {
        category,
        title: SHORTCUT_CATEGORY_LABELS[category][isEn ? 'en' : 'pt'],
        items,
      };
    }).filter((group) => group.items.length > 0);
  }, [q, isEn, settings.shortcuts]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        height: '100%',
        overflowY: 'auto',
        padding: '1.25rem',
        backgroundColor: 'var(--bg-canvas, var(--bg-primary, #0b0e16))',
        color: 'var(--text-primary, #f1f5f9)',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
          border: '1px solid var(--border-subtle, var(--border, #263046))',
          borderRadius: 'var(--radius-md, 8px)',
          padding: '1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.6rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <HelpCircle size={20} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              {isEn ? 'Documentation, Shortcuts & Architecture' : 'Documentação, Atalhos & Arquitetura'}
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)', margin: 0 }}>
              {isEn
                ? 'Quick reference for the local-first literary knowledge engine.'
                : 'Guia de referência rápida do motor literário local-first.'}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
            border: '1px solid var(--border-subtle, var(--border, #263046))',
            borderRadius: 'var(--radius-sm, 6px)',
            padding: '0.35rem 0.7rem',
          }}
        >
          <Search size={14} style={{ color: 'var(--text-muted, #64748b)' }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isEn ? 'Search docs & shortcuts...' : 'Buscar na documentação e atalhos...'}
            style={{
              fontSize: '0.8rem',
              outline: 'none',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary, #f1f5f9)',
              minWidth: 210,
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '0.8rem',
        }}
      >
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            style={{
              backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
              border: '1px solid var(--border-subtle, var(--border, #263046))',
              borderRadius: 'var(--radius-md, 8px)',
              padding: '0.95rem',
            }}
          >
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              {isEn ? doc.titleEn : doc.titlePt}
            </h3>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary, #94a3b8)',
                lineHeight: 1.45,
              }}
            >
              {isEn ? doc.summaryEn : doc.summaryPt}
            </p>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '1rem',
        }}
      >
        {/* Dynamic Live Shortcuts Table */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
            border: '1px solid var(--border-subtle, var(--border, #263046))',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.45rem',
              marginBottom: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Keyboard size={16} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
                {isEn ? 'Live Keyboard Shortcuts' : 'Atalhos de Teclado Ativos'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => navigateToBreadcrumbPath('InkGraph / Configurações / Atalhos de Teclado')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-primary, #3b82f6)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isEn ? 'Customize' : 'Personalizar'} <ArrowUpRight size={12} />
            </button>
          </div>

          {groupedShortcuts.length === 0 ? (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
              {isEn ? 'No shortcuts match your filter.' : 'Nenhum atalho encontrado para este filtro.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              {groupedShortcuts.map((group) => (
                <div key={group.category}>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--text-muted, #64748b)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    {group.title}
                  </div>
                  <table style={{ width: '100%', fontSize: '0.78rem', borderCollapse: 'collapse' }}>
                    <tbody>
                      {group.items.map((def) => {
                        const combo = settings.shortcuts[def.key] || '—';
                        return (
                          <tr
                            key={def.key}
                            style={{
                              borderBottom: '1px solid var(--border-subtle, var(--border, #263046))',
                            }}
                          >
                            <td style={{ padding: '0.42rem 0.6rem 0.42rem 0', width: 130 }}>
                              <kbd
                                style={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.74rem',
                                  fontWeight: 600,
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                  backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
                                  border: '1px solid var(--border-subtle, var(--border, #263046))',
                                  color: 'var(--accent-primary, #3b82f6)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {combo}
                              </kbd>
                            </td>
                            <td style={{ padding: '0.42rem 0' }}>
                              <div style={{ color: 'var(--text-primary, #f1f5f9)', fontWeight: 500 }}>
                                {isEn ? def.labelEn : def.labelPt}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted, #64748b)' }}>
                                {isEn ? def.descEn : def.descPt}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Architecture Card */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
            border: '1px solid var(--border-subtle, var(--border, #263046))',
            borderRadius: 'var(--radius-md, 8px)',
            padding: '1rem',
            alignSelf: 'start',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.7rem' }}>
            <Layers size={16} color="#10b981" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>
              {isEn ? 'Architecture Overview' : 'Visão Geral da Arquitetura'}
            </h3>
          </div>
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary, #94a3b8)',
              lineHeight: 1.55,
            }}
          >
            {isEn
              ? 'Your private vault at ./workspace/ keeps manuscripts and dossiers isolated locally. The indexer derives relational tables and FTS5 search in real time while preserving strict canon separation.'
              : 'O cofre privado em ./workspace/ mantém seus manuscritos e dossiês isolados localmente. O indexador deriva tabelas relacionais e busca textual FTS5 em tempo real, garantindo privacidade absoluta e controle estrito de cânone.'}
          </p>
        </div>
      </div>
    </div>
  );
}
