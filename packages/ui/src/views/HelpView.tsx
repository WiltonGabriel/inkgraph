import { useState, useMemo } from 'react';
import { HelpCircle, Search, Keyboard, Layers, BookOpenCheck } from 'lucide-react';
import { useProject } from '../context/ProjectContext';

const DOC_ARTICLES = [
  {
    id: 'canon-staging',
    title: 'Separação entre Cânone e Staging',
    summary: 'Arquivos confirmados residem em ./workspace/lore/ e ./workspace/manuscript/. Sugestões automatizadas aguardam revisão em ./workspace/staging/.',
  },
  {
    id: 'epistemic-engine',
    title: 'Rastreamento Epistêmico de Segredos',
    summary: 'O motor distingue o que o Autor sabe, o que o Leitor descobriu até a cena X e o que cada Personagem sabe individualmente.',
  },
  {
    id: 'markdown-truth',
    title: 'Arquitetura Markdown-First & FTS5',
    summary: 'Os documentos Markdown com YAML frontmatter são a fonte única da verdade. O índice relacional e FTS5 pode ser reconstruído a qualquer momento.',
  },
  {
    id: 'norm-compile',
    title: 'Compilação Editorial e Lauda 60×30',
    summary: 'Exporte o manuscrito em HTML paginado, capítulos limpos ou lauda padronizada de 60 caracteres por 30 linhas.',
  },
];

const SHORTCUTS = [
  { keys: 'Ctrl + K', action: 'Abrir Paleta de Comandos Rápidos' },
  { keys: 'Ctrl + S', action: 'Criar Instantâneo Rápido do Manuscrito' },
  { keys: 'Ctrl + Shift + F', action: 'Alternar Modo de Escrita Distração Zero' },
  { keys: 'Alt + 1..9', action: 'Alternar entre as Visões do Estúdio' },
];

export function HelpView() {
  const { settings, openOnboarding, t } = useProject();
  const [query, setQuery] = useState('');
  const isEn = settings.language === 'en';

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return DOC_ARTICLES;
    return DOC_ARTICLES.filter(
      (a) => a.title.toLowerCase().includes(q) || a.summary.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%', overflowY: 'auto' }}>
      <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <HelpCircle size={20} color="var(--accent)" />
          <div>
            <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Documentação, Atalhos & Arquitetura</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Guia de referência rápida do motor literário local-first.</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={openOnboarding}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              padding: '0.42rem 0.78rem',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: 'var(--text-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <BookOpenCheck size={14} color="var(--accent)" />
            {t.onboarding.reopenBtn}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.35rem 0.7rem' }}>
            <Search size={14} color="var(--text-muted)" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={isEn ? 'Search docs...' : 'Buscar na documentação...'} style={{ fontSize: '0.8rem', outline: 'none' }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.8rem' }}>
        {filteredDocs.map((doc) => (
          <div key={doc.id} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.95rem' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.35rem' }}>{doc.title}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{doc.summary}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.7rem' }}>
            <Keyboard size={16} color="var(--accent)" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Atalhos de Teclado</h3>
          </div>
          <table style={{ width: '100%', fontSize: '0.8rem', borderCollapse: 'collapse' }}>
            <tbody>
              {SHORTCUTS.map((s) => (
                <tr key={s.keys} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.45rem 0', fontFamily: 'monospace', color: 'var(--accent)', fontWeight: 600 }}>{s.keys}</td>
                  <td style={{ padding: '0.45rem 0', color: 'var(--text-muted)' }}>{s.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.7rem' }}>
            <Layers size={16} color="#10b981" />
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Visão Geral da Arquitetura</h3>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            O cofre privado em <code>./workspace/</code> mantém seus manuscritos e dossiês isolados localmente. O indexador deriva tabelas relacionais e busca textual FTS5 em tempo real, garantindo privacidade absoluta e controle estrito de cânone.
          </p>
        </div>
      </div>
    </div>
  );
}
