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
        hint: 'Estruturar capítulos e reviravoltas',
        action: () => go('outline'),
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
      { id: 'nav_tpl', category: 'Navegação', label: 'Ir para Modelos Narrativos', action: () => go('templates') },
      { id: 'nav_plot', category: 'Navegação', label: 'Ir para Quadro de Cenas (Atos / Tela 2D / Linha do Tempo)', action: () => go('plotboard') },
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
        label: 'Abrir Portal Inicial / Trocar Projeto',
        action: () => {
          setShowCommandPalette(false);
          setShowPortal(true);
        },
      },
      {
        id: 'theme_dark',
        category: 'Aparência & Editor',
        label: 'Mudar para Modo Escuro',
        action: () => {
          updateSettings((s) => ({ ...s, theme: 'dark' }));
          setShowCommandPalette(false);
        },
      },
      {
        id: 'theme_sepia',
        category: 'Aparência & Editor',
        label: 'Predefinição de Leitura Sépia',
        action: () => {
          updateSettings((s) => ({ ...s, theme: 'sepia' }));
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
        backgroundColor: 'rgba(5, 7, 11, 0.78)',
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
        aria-label="Paleta de comandos"
        style={{
          width: '100%',
          maxWidth: 640,
          backgroundColor: '#11151f',
          border: '1px solid #262d3d',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 24px 50px rgba(0,0,0,0.65)',
        }}
      >
        {/* Search Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px',
            borderBottom: '1px solid #1f2533',
          }}
        >
          <Search size={16} color="#60a5fa" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite um comando (/ai, /export) ou pesquise cenas, personagens e facções..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f3f4f6',
              fontSize: 13.5,
            }}
          />
          <button
            onClick={() => setShowCommandPalette(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#6b7280',
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
                  onClick={er.onSelect}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 6,
                    color: '#e5e7eb',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {er.title}{' '}
                      <span style={{ fontSize: 10.5, color: '#60a5fa', fontWeight: 500 }}>
                        [{er.kind}]
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#9ca3af' }}>{er.subtitle}</div>
                  </div>
                  <ArrowRight size={13} color="#6b7280" />
                </button>
              ))}
            </div>
          )}

          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#6b7280',
              padding: '4px 10px',
            }}
          >
            Todos os Comandos ({filteredCommands.length})
          </div>
          {filteredCommands.map((cmd) => (
            <button
              key={cmd.id}
              onClick={cmd.action}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                background: 'transparent',
                border: 'none',
                borderRadius: 6,
                color: '#d1d5db',
                fontSize: 12.5,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {cmd.category === 'Comandos IA' ? (
                  <Sparkles size={13} color="#a78bfa" />
                ) : cmd.category === 'Navegação' ? (
                  <BookOpen size={13} color="#60a5fa" />
                ) : (
                  <Sun size={13} color="#fbbf24" />
                )}
                <span>{cmd.label}</span>
              </span>
              <span style={{ fontSize: 11, color: '#6b7280' }}>{cmd.category}</span>
            </button>
          ))}

          {filteredCommands.length === 0 && entityResults.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
              Nenhum resultado encontrado para “{query}”.
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '8px 14px',
            backgroundColor: '#0c0e14',
            borderTop: '1px solid #1b202c',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#6b7280',
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
              <Moon size={11} /> Local Vault
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
