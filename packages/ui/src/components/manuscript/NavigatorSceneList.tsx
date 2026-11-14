import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';
import { countWords, type ActDefinition, type Scene } from '../../types/project';
import { DEFAULT_ACTS } from '../../data/defaultWorkspaceConfig';
import { ACT_LABELS, SCENE_STATUS_LABELS } from './manuscriptMentions';

interface NavigatorSceneListProps {
  scenes: Scene[];
  acts?: ActDefinition[];
  activeSceneId: string;
  query: string;
  onSelectScene: (id: string) => void;
  onCreateScene: () => void;
  onDeleteScene: (id: string) => void;
}

export function NavigatorSceneList({
  scenes,
  acts,
  activeSceneId,
  query,
  onSelectScene,
  onCreateScene,
  onDeleteScene,
}: NavigatorSceneListProps) {
  const [collapsedActs, setCollapsedActs] = useState<Record<number, boolean>>({});
  const normalizedQuery = query.trim().toLowerCase();

  const resolvedActs = useMemo(() => {
    const base = acts && acts.length > 0 ? acts : DEFAULT_ACTS;
    return [...base].sort((a, b) => a.number - b.number);
  }, [acts]);

  const scenesByAct = useMemo(() => {
    const filtered = normalizedQuery
      ? scenes.filter(
          (s) =>
            s.title.toLowerCase().includes(normalizedQuery) ||
            s.summary.toLowerCase().includes(normalizedQuery) ||
            SCENE_STATUS_LABELS[s.status].toLowerCase().includes(normalizedQuery)
        )
      : scenes;

    const actGroups = resolvedActs.map((actDef) => {
      const items = filtered.filter((s) => s.act === actDef.number);
      const totalWords = items.reduce((sum, s) => sum + countWords(s.content), 0);
      return {
        act: actDef.number,
        label: actDef.title || ACT_LABELS[actDef.number] || `Ato ${actDef.number}`,
        items,
        totalWords,
      };
    });

    const knownActNumbers = new Set(resolvedActs.map((a) => a.number));
    const orphanScenes = filtered.filter((s) => !knownActNumbers.has(s.act));
    if (orphanScenes.length > 0) {
      actGroups.push({
        act: 999,
        label: 'Outros Atos',
        items: orphanScenes,
        totalWords: orphanScenes.reduce((sum, s) => sum + countWords(s.content), 0),
      });
    }
    return actGroups;
  }, [scenes, normalizedQuery, resolvedActs]);

  const toggleAct = (act: number) => {
    setCollapsedActs((prev) => ({ ...prev, [act]: !prev[act] }));
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
        <button
          type="button"
          onClick={onCreateScene}
          style={{
            width: '100%',
            minHeight: 30,
            padding: '7px 10px',
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            borderRadius: 'var(--radius-sm)',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Plus size={13} aria-hidden="true" /> + Nova Cena
        </button>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        {scenesByAct.map(({ act, label, items, totalWords }) => {
          if (items.length === 0 && normalizedQuery) return null;
          const isCollapsed = Boolean(collapsedActs[act]);

          return (
            <section key={act} aria-label={label}>
              <button
                type="button"
                onClick={() => toggleAct(act)}
                aria-expanded={!isCollapsed}
                style={{
                  width: '100%',
                  padding: '4px 6px',
                  marginBottom: 4,
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {isCollapsed ? (
                    <ChevronRight size={12} aria-hidden="true" />
                  ) : (
                    <ChevronDown size={12} aria-hidden="true" />
                  )}
                  {label}
                </span>
                <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>
                  {items.length} · {totalWords.toLocaleString('pt-BR')} pal.
                </span>
              </button>

              {!isCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {items.length === 0 ? (
                    <div
                      style={{
                        padding: '6px 10px',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        fontStyle: 'italic',
                      }}
                    >
                      Nenhuma cena neste ato.
                    </div>
                  ) : (
                    items.map((scene) => {
                      const active = scene.id === activeSceneId;
                      const words = countWords(scene.content);
                      return (
                        <div
                          key={scene.id}
                          style={{
                            padding: '8px 9px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: active
                              ? 'var(--accent-soft)'
                              : 'var(--bg-elevated)',
                            border: active
                              ? '1px solid var(--accent-primary)'
                              : '1px solid var(--border-subtle)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 6,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectScene(scene.id)}
                            style={{
                              flex: 1,
                              minWidth: 0,
                              textAlign: 'left',
                              backgroundColor: 'transparent',
                              padding: 0,
                            }}
                          >
                            <div
                              style={{
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: active
                                  ? 'var(--accent-primary)'
                                  : 'var(--text-primary)',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 5,
                                wordBreak: 'break-word',
                                lineHeight: 1.35,
                              }}
                            >
                              <FileText
                                size={12}
                                aria-hidden="true"
                                style={{ marginTop: 2, flexShrink: 0 }}
                              />
                              <span>
                                {scene.chapterNumber}. {scene.title}
                              </span>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                alignItems: 'center',
                                gap: 6,
                                marginTop: 5,
                                fontSize: 10.5,
                              }}
                            >
                              <span
                                style={{
                                  padding: '1px 6px',
                                  borderRadius: 999,
                                  backgroundColor: 'var(--bg-surface)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-secondary)',
                                  fontWeight: 500,
                                }}
                              >
                                {SCENE_STATUS_LABELS[scene.status]}
                              </span>
                              <span
                                style={{
                                  padding: '1px 6px',
                                  borderRadius: 999,
                                  backgroundColor: 'var(--bg-surface)',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                {words.toLocaleString('pt-BR')} pal.
                              </span>
                            </div>
                          </button>

                          {scenes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => onDeleteScene(scene.id)}
                              aria-label={`Excluir cena ${scene.title}`}
                              title="Excluir cena"
                              style={{
                                background: 'none',
                                color: 'var(--text-muted)',
                                padding: 3,
                                flexShrink: 0,
                              }}
                            >
                              <Trash2 size={12} aria-hidden="true" />
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
