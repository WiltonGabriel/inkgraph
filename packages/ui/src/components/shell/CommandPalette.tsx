import { useState, useMemo } from 'react';
import {
  Search,
  ArrowRight,
  Sparkles,
  BookOpen,
  Users,
  Shield,
  Globe,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { ViewId } from '../../types/project';

interface PaletteCommand {
  id: string;
  category: string;
  label: string;
  hint?: string;
  action: () => void;
}

export function CommandPalette() {
  const {
    project,
    setActiveView,
    setActiveSceneId,
    setShowCommandPalette,
    setShowPortal,
    setShowCopilot,
    updateSettings,
    createSnapshot,
  } = useProject();

  const [query, setQuery] = useState('');

  const go = (view: ViewId) => {
    setActiveView(view);
    setShowCommandPalette(false);
  };

  const commands: PaletteCommand[] = useMemo(
    () => [
      // Comandos IA & Rápidos
      {
        id: 'cmd_ai_write',
        category: 'Comandos IA',
        label: '/ai write — Abrir Estúdio de Redação IA',
        hint: 'Gerar, reescrever, mudar tom',
        action: () => go('writer'),
      },
      {
        id: 'cmd_ai_outline',
        category: 'Comandos IA',
        label: '/ai outline — Abrir Gerador de Contorno',
        hint: 'Estruturar capítulos, modelos e reviravoltas',
        action: () => go('outline'),
      },
      {
        id: 'cmd_canon_radar',
        category: 'Comandos IA',
        label: '/radar — Abrir Radar de Cânone',
        hint: 'Descobertas de texto, fila de staging e escopo IA',
        action: () => go('canon-radar'),
      },
      {
        id: 'cmd_ai_char',
        category: 'Comandos IA',
        label: '/ai character — Gerenciar Dossiês de Personagens',
        action: () => go('characters'),
      },
      {
        id: 'cmd_consistency',
        category: 'Comandos IA',
        label: '/consistência — Verificar Consistência & Estado Epistêmico',
        action: () => go('consistency'),
      },
      {
        id: 'cmd_critic',
        category: 'Comandos IA',
        label: '/critic — Iniciar Crítico Literário & Análise de Enredo',
        action: () => go('critic'),
      },
      {
        id: 'cmd_copilot',
        category: 'Comandos IA',
        label: 'Alternar Copiloto Lateral',
        action: () => {
          setShowCopilot(true);
          setShowCommandPalette(false);
        },
      },
      // Navegação
      { id: 'nav_dash', category: 'Navegação', label: 'Ir para Painel', action: () => go('dashboard') },
      { id: 'nav_ms', category: 'Navegação', label: 'Ir para Manuscrito & Fichário', action: () => go('manuscript') },
      { id: 'nav_plot', category: 'Navegação', label: 'Ir para Quadro de Cenas (Atos / Tela 2D)', action: () => go('plotboard') },
      { id: 'nav_timeline', category: 'Navegação', label: 'Ir para Linha do Tempo (Cronologia)', action: () => go('timeline') },
      { id: 'nav_radar', category: 'Navegação', label: 'Ir para Radar de Cânone', action: () => go('canon-radar') },
      { id: 'nav_scen', category: 'Navegação', label: 'Ir para Cenário / Roteiro Mestre', action: () => go('scenario') },
      { id: 'nav_fac', category: 'Navegação', label: 'Ir para Facções & Organizações', action: () => go('factions') },
      { id: 'nav_world', category: 'Navegação', label: 'Ir para Construção Mundial & Locais', action: () => go('worlds') },
      { id: 'nav_graph', category: 'Navegação', label: 'Ir para Grafo de Relações Interativo', action: () => go('graph') },
      { id: 'nav_obj', category: 'Navegação', label: 'Ir para Objetos de História & Grupos', action: () => go('objects') },
      { id: 'nav_mm', category: 'Navegação', label: 'Ir para Mapas Mentais', action: () => go('mindmap') },
      { id: 'nav_int', category: 'Navegação', label: 'Ir para Entrevistas com Personagens', action: () => go('interviews') },
      { id: 'nav_prev', category: 'Navegação', label: 'Ir para Visualização do Livro', action: () => go('preview') },
      { id: 'nav_prog', category: 'Navegação', label: 'Ir para Rastreador de Progresso', action: () => go('progress') },
      { id: 'nav_vc', category: 'Navegação', label: 'Ir para Controle de Versão & Staging', action: () => go('versions') },
      { id: 'nav_exp', category: 'Navegação', label: '/export — Exportar & Assistente de Compilação', action: () => go('export') },
      { id: 'nav_set', category: 'Navegação', label: 'Ir para Configurações', action: () => go('settings') },
      { id: 'nav_help', category: 'Navegação', label: 'Ir para Ajuda & Documentação', action: () => go('help') },
      // Ações & Aparência
      {
        id: 'act_snap',
        category: 'Ações Rápidas',
        label: 'Criar Instantâneo (Snapshot) Rápido do Manuscrito',
        action: () => {
          createSnapshot(`Ponto de verificação rápido (${new Date().toLocaleTimeString('pt-BR')})`);
          setShowCommandPalette(false);
        },
      },
      {
        id: 'act_portal',
        category: 'Ações Rápidas',
        label: 'Abrir Meu Espaço / Trocar Projeto',
        action: () => {
          setShowCommandPalette(false);
          setShowPortal(true);
        },
      },
      {
        id: 'theme_light',
        category: 'Aparência & Editor',
        label: 'Mudar para Modo Claro',
        action: () => {
          updateSettings((s) => ({ ...s, theme: 'light', themeBrightness: 'light' }));
          setShowCommandPalette(false);
        },
      },
      {
        id: 'theme_dark',
        category: 'Aparência & Editor',
        label: 'Mudar para Modo Escuro',
        action: () => {
          updateSettings((s) => ({ ...s, theme: 'dark', themeBrightness: 'dark' }));
          setShowCommandPalette(false);
        },
      },
      {
        id: 'theme_sepia',
        category: 'Aparência & Editor',
        label: 'Predefinição de Leitura Sépia',
        action: () => {
          updateSettings((s) => ({ ...s, theme: 'sepia', themeBrightness: 'sepia' }));
          setShowCommandPalette(false);
        },
      },
      {
        id: 'editor_zen',
        category: 'Aparência & Editor',
        label: 'Alternar Modo Zen no Manuscrito',
        action: () => {
          updateSettings((s) => ({ ...s, zenMode: !s.zenMode }));
          go('manuscript');
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const q = query.trim().toLowerCase();

  const filteredCommands = useMemo(() => {
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.hint && c.hint.toLowerCase().includes(q))
    );
  }, [commands, q]);

  const entityResults = useMemo(() => {
    if (!q) return [];
    const results: { id: string; kind: string; title: string; subtitle: string; onSelect: () => void }[] = [];

    for (const s of project.scenes) {
      if (s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q)) {
        results.push({
          id: s.id,
          kind: 'Manuscrito',
          title: s.title,
          subtitle: s.summary,
          onSelect: () => {
            setActiveSceneId(s.id);
            go('manuscript');
          },
        });
      }
    }
    for (const c of project.characters) {
      if (c.name.toLowerCase().includes(q) || c.role.toLowerCase().includes(q)) {
        results.push({
          id: c.id,
          kind: 'Personagem',
          title: c.name,
          subtitle: c.role,
          onSelect: () => go('characters'),
        });
      }
    }
    for (const f of project.factions) {
      if (f.name.toLowerCase().includes(q) || f.subtype.toLowerCase().includes(q)) {
        results.push({
          id: f.id,
          kind: 'Facção',
          title: f.name,
          subtitle: f.subtype,
          onSelect: () => go('factions'),
        });
      }
    }
    return results.slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, q]);

  return (
    <div
      onClick={() => setShowCommandPalette(false)}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 130,
        backgroundColor: 'rgba(5, 7, 11, 0.56)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '10vh',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Paleta de comandos"
        style={{
          width: '100%',
          maxWidth: 640,
          backgroundColor: 'var(--bg-elevated, var(--bg-card, #171d2e))',
          border: '1px solid var(--border-subtle, var(--border, #263046))',
          borderRadius: 'var(--radius-lg, 12px)',
          overflow: 'hidden',
          boxShadow: '0 24px 50px rgba(0, 0, 0, 0.45)',
          color: 'var(--text-primary, #f1f5f9)',
        }}
      >
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle, var(--border, #263046))',
          }}
        >
          <Search size={16} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setShowCommandPalette(false);
              }
            }}
            placeholder="Digite um comando (/ai, /export) ou pesquise cenas, personagens e facções..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary, #f1f5f9)',
              fontSize: 13.5,
            }}
          />
          <button
            type="button"
            onClick={() => setShowCommandPalette(false)}
            aria-label="Fechar paleta"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted, #64748b)',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 420, overflowY: 'auto', padding: 8 }}>
          {entityResults.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#10b981',
                  padding: '4px 10px',
                }}
              >
                Resultados no Projeto ({entityResults.length})
              </div>
              {entityResults.map((er) => (
                <button
                  key={er.id}
                  type="button"
                  onClick={er.onSelect}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm, 6px)',
                    color: 'var(--text-primary, #f1f5f9)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {er.title}{' '}
                      <span
                        style={{
                          fontSize: 10.5,
                          color: 'var(--accent-primary, #3b82f6)',
                          fontWeight: 500,
                        }}
                      >
                        [{er.kind}]
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-secondary, #94a3b8)' }}>
                      {er.subtitle}
                    </div>
                  </div>
                  <ArrowRight size={13} style={{ color: 'var(--text-muted, #64748b)' }} />
                </button>
              ))}
            </div>
          )}

          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--text-muted, #64748b)',
              padding: '4px 10px',
            }}
          >
            Todos os Comandos ({filteredCommands.length})
          </div>
          {filteredCommands.map((cmd) => (
            <button
              key={cmd.id}
              type="button"
              onClick={cmd.action}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                background: 'transparent',
                border: 'none',
                borderRadius: 'var(--radius-sm, 6px)',
                color: 'var(--text-primary, #f1f5f9)',
                fontSize: 12.5,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {cmd.category === 'Comandos IA' ? (
                  <Sparkles size={13} color="#a78bfa" />
                ) : cmd.category === 'Navegação' ? (
                  <BookOpen size={13} style={{ color: 'var(--accent-primary, #3b82f6)' }} />
                ) : (
                  <Sun size={13} color="#f59e0b" />
                )}
                <span>{cmd.label}</span>
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted, #64748b)' }}>
                {cmd.category}
              </span>
            </button>
          ))}

          {filteredCommands.length === 0 && entityResults.length === 0 && (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                color: 'var(--text-muted, #64748b)',
                fontSize: 13,
              }}
            >
              Nenhum resultado encontrado para “{query}”.
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '8px 14px',
            backgroundColor: 'var(--bg-surface, var(--bg-secondary, #111623))',
            borderTop: '1px solid var(--border-subtle, var(--border, #263046))',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: 'var(--text-muted, #64748b)',
          }}
        >
          <span>Use Enter para abrir · Esc para fechar</span>
          <span style={{ display: 'flex', gap: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Users size={11} /> {project.characters.length}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Shield size={11} /> {project.factions.length}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Globe size={11} /> {project.worlds.length}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
              <Moon size={11} /> Cofre Local
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
