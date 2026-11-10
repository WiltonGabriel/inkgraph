import { useState, useMemo } from 'react';
import {
  BookOpen,
  Sparkles,
  Target,
  Flame,
  Activity,
  Users,
  Globe,
  Shield,
  ArrowRight,
  Download,
  Upload,
  Wand2,
} from 'lucide-react';
import { useProject } from '../context/ProjectContext';
import {
  calculateCharacterCompleteness,
  calculateFactionCompleteness,
  calculateWorldCompleteness,
  countWords,
} from '../types/project';
import { CompletenessRing } from '../components/ui/CompletenessRing';

export function DashboardView() {
  const {
    project,
    updateProject,
    totalWordCount,
    setActiveView,
    setActiveSceneId,
    exportProjectJson,
    importProjectJson,
  } = useProject();

  const [editingGoal, setEditingGoal] = useState(false);
  const [goalDraft, setGoalDraft] = useState(String(project.wordCountGoal));
  const [deadlineDraft, setDeadlineDraft] = useState(project.deadline ?? '');
  const [showLoglineIdeas, setShowLoglineIdeas] = useState(false);

  const lastScene = useMemo(() => {
    if (project.scenes.length === 0) return null;
    return [...project.scenes].sort((a, b) =>
      b.lastEditedAt.localeCompare(a.lastEditedAt)
    )[0];
  }, [project.scenes]);

  const wordGoalPercent = Math.min(
    100,
    Math.round((totalWordCount / Math.max(1, project.wordCountGoal)) * 100)
  );
  const wordsRemaining = Math.max(0, project.wordCountGoal - totalWordCount);

  const daysLeft = useMemo(() => {
    if (!project.deadline) return null;
    const diff =
      new Date(project.deadline).getTime() - new Date().setHours(0, 0, 0, 0);
    return Math.ceil(diff / 86400000);
  }, [project.deadline]);

  const requiredPacePerDay =
    daysLeft && daysLeft > 0 ? Math.ceil(wordsRemaining / daysLeft) : null;

  // Health score calculation (0-100)
  const castDepth = useMemo(() => {
    if (project.characters.length === 0) return 0;
    const sum = project.characters.reduce(
      (acc, c) => acc + calculateCharacterCompleteness(c),
      0
    );
    return Math.round(sum / project.characters.length);
  }, [project.characters]);

  const worldDepth = useMemo(() => {
    const wScores = project.worlds.map(calculateWorldCompleteness);
    const fScores = project.factions.map(calculateFactionCompleteness);
    const all = [...wScores, ...fScores];
    if (all.length === 0) return 0;
    return Math.round(all.reduce((a, b) => a + b, 0) / all.length);
  }, [project.worlds, project.factions]);

  const healthScore = Math.round(
    wordGoalPercent * 0.3 + castDepth * 0.35 + worldDepth * 0.35
  );

  // Composition breakdown
  const statusCounts = useMemo(() => {
    const counts = {
      outline: 0,
      draft: 0,
      'first-draft': 0,
      revised: 0,
      final: 0,
    };
    for (const s of project.scenes) {
      counts[s.status] = (counts[s.status] ?? 0) + 1;
    }
    return counts;
  }, [project.scenes]);

  const avgWordsPerScene =
    project.scenes.length > 0
      ? Math.round(totalWordCount / project.scenes.length)
      : 0;
  const readingTimeMinutes = Math.max(1, Math.ceil(totalWordCount / 220));

  const recentLogs = project.writingLogs.slice(-14);
  const weekWords = recentLogs
    .slice(-7)
    .reduce((acc, l) => acc + l.wordsWritten, 0);

  const handleDownloadBackup = () => {
    const json = exportProjectJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}-backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loglineSuggestions = [
    `Quando o segredo que sustenta ${project.worlds[0]?.name ?? 'o reino'} ameaça destruir os distritos baixos, ${project.characters[0]?.name ?? 'um comandante exilado'} precisa escolher entre a lealdade institucional e a sobrevivência de seu povo.`,
    `Traído pela própria ${project.factions[0]?.name ?? 'ordem militar'}, um veterano cego une forças com uma arquivista clandestina para expor o crime fundador da Coroa antes que a capital congele.`,
    `Em uma cidade movida pela queima de memórias humanas, duas mentes opostas descobrem a gravação capaz de derrubar o trono — ou apagar o último refúgio da humanidade.`,
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1360, margin: '0 auto' }}>
      {/* Top Greeting & Continue Writing Banner */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '20px 24px',
          backgroundColor: '#121621',
          border: '1px solid #212838',
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <div>
          <div style={{ fontSize: 12, color: '#60a5fa', fontWeight: 600, marginBottom: 4 }}>
            Visão geral do projeto · {project.genre}
          </div>
          <h1 style={{ margin: 0, fontSize: 22, color: '#f3f4f6' }}>
            Bem-vindo de volta a {project.title}
          </h1>
          <div style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 4 }}>
            {lastScene
              ? `Última edição: ${lastScene.title} (${countWords(lastScene.content)} palavras)`
              : 'Comece sua história na visualização Manuscrito.'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              if (lastScene) setActiveSceneId(lastScene.id);
              setActiveView('manuscript');
            }}
            style={{
              padding: '10px 18px',
              backgroundColor: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <BookOpen size={15} /> Continuar escrevendo <ArrowRight size={14} />
          </button>
          <button
            onClick={() => setActiveView('writer')}
            style={{
              padding: '10px 14px',
              backgroundColor: '#1a2030',
              color: '#d1d5db',
              border: '1px solid #2c3548',
              borderRadius: 8,
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
            }}
          >
            <Sparkles size={14} color="#a78bfa" /> Estúdio de Redação
          </button>
        </div>
      </div>

      {/* Story Details + Logline Assistant */}
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

      {/* 3-Column Metrics Grid: Goals, Momentum, Project Health */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        {/* 1. Metas do Projeto */}
        <div
          style={{
            backgroundColor: '#121621',
            border: '1px solid #1f2533',
            borderRadius: 10,
            padding: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 13.5,
                fontWeight: 700,
                color: '#f3f4f6',
              }}
            >
              <Target size={15} color="#60a5fa" /> Metas do Projeto
            </span>
            <button
              onClick={() => setEditingGoal((v) => !v)}
              style={{
                background: 'none',
                border: '1px solid #2c3446',
                color: '#9ca3af',
                borderRadius: 5,
                padding: '3px 8px',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {editingGoal ? 'Fechar' : 'Editar meta'}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <CompletenessRing percent={wordGoalPercent} size={64} strokeWidth={5} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f9fafb' }}>
                {totalWordCount.toLocaleString('pt-BR')}{' '}
                <span style={{ fontSize: 12.5, color: '#6b7280', fontWeight: 400 }}>
                  / {project.wordCountGoal.toLocaleString('pt-BR')} palavras
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: '#9ca3af', marginTop: 3 }}>
                {wordsRemaining.toLocaleString('pt-BR')} palavras restantes
              </div>
              <div style={{ fontSize: 11.5, color: '#10b981', marginTop: 4 }}>
                {daysLeft !== null
                  ? daysLeft > 0
                    ? `${daysLeft} dias restantes · Ritmo: ~${requiredPacePerDay} palavras/dia`
                    : 'Prazo final atingido'
                  : 'Sem prazo definido'}
              </div>
            </div>
          </div>

          {editingGoal && (
            <div
              style={{
                marginTop: 14,
                paddingTop: 12,
                borderTop: '1px solid #1e2433',
                display: 'flex',
                gap: 8,
                alignItems: 'flex-end',
              }}
            >
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10.5, color: '#9ca3af', display: 'block', marginBottom: 3 }}>
                  Meta de palavras
                </label>
                <input
                  type="number"
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: '#0c0f17',
                    border: '1px solid #2a3245',
                    borderRadius: 5,
                    color: '#fff',
                    fontSize: 12,
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10.5, color: '#9ca3af', display: 'block', marginBottom: 3 }}>
                  Prazo alvo
                </label>
                <input
                  type="date"
                  value={deadlineDraft}
                  onChange={(e) => setDeadlineDraft(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    backgroundColor: '#0c0f17',
                    border: '1px solid #2a3245',
                    borderRadius: 5,
                    color: '#fff',
                    fontSize: 12,
                  }}
                />
              </div>
              <button
                onClick={() => {
                  updateProject((prev) => ({
                    ...prev,
                    wordCountGoal: Math.max(100, Number(goalDraft) || 60000),
                    deadline: deadlineDraft || undefined,
                  }));
                  setEditingGoal(false);
                }}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 5,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Salvar
              </button>
            </div>
          )}
        </div>

        {/* 2. Momento de Escrita (14 dias) */}
        <div
          style={{
            backgroundColor: '#121621',
            border: '1px solid #1f2533',
            borderRadius: 10,
            padding: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 13.5,
                fontWeight: 700,
                color: '#f3f4f6',
              }}
            >
              <Flame size={15} color="#f59e0b" /> Momento de Escrita
            </span>
            <span style={{ fontSize: 11.5, color: '#fbbf24', fontWeight: 600 }}>
              7 dias de sequência
            </span>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>Hoje</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f3f4f6' }}>
                {recentLogs[recentLogs.length - 1]?.wordsWritten ?? 0}{' '}
                <span style={{ fontSize: 11, color: '#6b7280' }}>
                  / {project.dailyWordGoal}
                </span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>Essa semana</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>
                {weekWords.toLocaleString('pt-BR')} palavras
              </div>
            </div>
          </div>

          {/* 14-day mini bar chart */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: 4,
              height: 44,
              paddingTop: 6,
            }}
          >
            {recentLogs.map((log) => {
              const h = Math.min(
                100,
                Math.round((log.wordsWritten / Math.max(1, project.dailyWordGoal)) * 100)
              );
              return (
                <div
                  key={log.date}
                  title={`${log.date}: ${log.wordsWritten} palavras`}
                  style={{
                    flex: 1,
                    height: `${Math.max(10, h)}%`,
                    backgroundColor:
                      log.wordsWritten >= project.dailyWordGoal
                        ? '#10b981'
                        : log.wordsWritten > 0
                          ? '#3b82f6'
                          : '#1f2533',
                    borderRadius: 3,
                  }}
                />
              );
            })}
          </div>
          <div style={{ fontSize: 10.5, color: '#6b7280', marginTop: 6 }}>
            Atividade nos últimos 14 dias
          </div>
        </div>

        {/* 3. Saúde do Projeto */}
        <div
          style={{
            backgroundColor: '#121621',
            border: '1px solid #1f2533',
            borderRadius: 10,
            padding: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                fontSize: 13.5,
                fontWeight: 700,
                color: '#f3f4f6',
              }}
            >
              <Activity size={15} color="#10b981" /> Saúde do Projeto
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#10b981',
                backgroundColor: 'rgba(16,185,129,0.12)',
                padding: '2px 8px',
                borderRadius: 999,
              }}
            >
              {healthScore}/100
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ color: '#9ca3af' }}>Profundidade do elenco ({project.characters.length})</span>
                <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{castDepth}%</span>
              </div>
              <div style={{ height: 5, backgroundColor: '#1b2230', borderRadius: 999 }}>
                <div style={{ width: `${castDepth}%`, height: '100%', backgroundColor: '#3b82f6', borderRadius: 999 }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ color: '#9ca3af' }}>
                  Cobertura de Mundo & Facções ({project.worlds.length + project.factions.length})
                </span>
                <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{worldDepth}%</span>
              </div>
              <div style={{ height: 5, backgroundColor: '#1b2230', borderRadius: 999 }}>
                <div style={{ width: `${worldDepth}%`, height: '100%', backgroundColor: '#10b981', borderRadius: 999 }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 4, color: '#9ca3af', fontSize: 11.5 }}>
              <span>Legibilidade (heurística Flesch): <strong style={{ color: '#e5e7eb' }}>68/100</strong></span>
              <span style={{ color: '#34d399' }}>Linha do tempo: OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Composição do Manuscrito + Ações Rápidas & Backup */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 16,
        }}
      >
        {/* Composição do Manuscrito */}
        <div
          style={{
            backgroundColor: '#121621',
            border: '1px solid #1f2533',
            borderRadius: 10,
            padding: 18,
          }}
        >
          <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#f3f4f6' }}>
            Composição do Manuscrito
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div style={{ padding: 10, backgroundColor: '#0c0f17', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>Cenas</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#f3f4f6' }}>
                {project.scenes.length}
              </div>
            </div>
            <div style={{ padding: 10, backgroundColor: '#0c0f17', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>Média / cena</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#60a5fa' }}>
                {avgWordsPerScene} pal.
              </div>
            </div>
            <div style={{ padding: 10, backgroundColor: '#0c0f17', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>Tempo de leitura</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#10b981' }}>
                ~{readingTimeMinutes} min
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 11.5 }}>
            <span style={{ padding: '4px 9px', borderRadius: 6, backgroundColor: '#19202e', color: '#9ca3af' }}>
              Contorno: <strong>{statusCounts.outline}</strong>
            </span>
            <span style={{ padding: '4px 9px', borderRadius: 6, backgroundColor: '#19202e', color: '#fbbf24' }}>
              Rascunho: <strong>{statusCounts.draft}</strong>
            </span>
            <span style={{ padding: '4px 9px', borderRadius: 6, backgroundColor: '#19202e', color: '#60a5fa' }}>
              1º Rascunho: <strong>{statusCounts['first-draft']}</strong>
            </span>
            <span style={{ padding: '4px 9px', borderRadius: 6, backgroundColor: '#19202e', color: '#34d399' }}>
              Revisado: <strong>{statusCounts.revised}</strong>
            </span>
            <span style={{ padding: '4px 9px', borderRadius: 6, backgroundColor: '#19202e', color: '#a78bfa' }}>
              Final: <strong>{statusCounts.final}</strong>
            </span>
          </div>
        </div>

        {/* Ações Rápidas & Backup */}
        <div
          style={{
            backgroundColor: '#121621',
            border: '1px solid #1f2533',
            borderRadius: 10,
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 12px', fontSize: 14, color: '#f3f4f6' }}>
              Ações Rápidas & Universo
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <button
                onClick={() => setActiveView('characters')}
                style={{
                  padding: '10px',
                  backgroundColor: '#171c29',
                  border: '1px solid #252c3e',
                  borderRadius: 8,
                  color: '#e5e7eb',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Users size={15} color="#60a5fa" style={{ marginBottom: 4 }} />
                <div style={{ fontWeight: 600 }}>Personagens</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{project.characters.length} dossiês</div>
              </button>
              <button
                onClick={() => setActiveView('factions')}
                style={{
                  padding: '10px',
                  backgroundColor: '#171c29',
                  border: '1px solid #252c3e',
                  borderRadius: 8,
                  color: '#e5e7eb',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Shield size={15} color="#f87171" style={{ marginBottom: 4 }} />
                <div style={{ fontWeight: 600 }}>Facções</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{project.factions.length} ordens</div>
              </button>
              <button
                onClick={() => setActiveView('worlds')}
                style={{
                  padding: '10px',
                  backgroundColor: '#171c29',
                  border: '1px solid #252c3e',
                  borderRadius: 8,
                  color: '#e5e7eb',
                  fontSize: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Globe size={15} color="#10b981" style={{ marginBottom: 4 }} />
                <div style={{ fontWeight: 600 }}>Mundos</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>
                  {project.worlds[0]?.locations.length ?? 0} locais
                </div>
              </button>
            </div>
          </div>

          <div
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid #1e2433',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 11.5, color: '#9ca3af' }}>
              Backup e restauração instantânea:
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleDownloadBackup}
                style={{
                  padding: '6px 10px',
                  backgroundColor: '#19202e',
                  border: '1px solid #2c3548',
                  borderRadius: 6,
                  color: '#e5e7eb',
                  fontSize: 11.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Download size={12} /> Exportar JSON
              </button>
              <label
                style={{
                  padding: '6px 10px',
                  backgroundColor: '#19202e',
                  border: '1px solid #2c3548',
                  borderRadius: 6,
                  color: '#e5e7eb',
                  fontSize: 11.5,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <Upload size={12} /> Importar JSON
                <input
                  type="file"
                  accept=".json"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const r = new FileReader();
                    r.onload = (ev) => importProjectJson(String(ev.target?.result ?? ''));
                    r.readAsText(file);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
