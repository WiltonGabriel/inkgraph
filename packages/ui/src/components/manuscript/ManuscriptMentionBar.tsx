import { useEffect, useMemo, useRef, useState } from 'react';
import { AtSign, Box, Check, ChevronDown, Hash, Search, Shield, X } from 'lucide-react';
import type { ProjectData } from '../../types/project';
import type { DetectedSceneMentions } from './manuscriptMentions';

export type MentionCategoryKey = 'char' | 'loc' | 'faction' | 'obj';

interface MentionOption {
  id: string;
  name: string;
  subtitle?: string;
  inScene: boolean;
}

interface CategoryConfig {
  key: MentionCategoryKey;
  prefix: '@' | '#' | '&' | '!';
  label: string;
  emptyText: string;
  color: string;
  softBg: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    key: 'char',
    prefix: '@',
    label: 'Personagem',
    emptyText: 'Nenhum personagem encontrado.',
    color: 'var(--accent-primary)',
    softBg: 'var(--accent-soft)',
  },
  {
    key: 'loc',
    prefix: '#',
    label: 'Local',
    emptyText: 'Nenhum local encontrado.',
    color: 'var(--success)',
    softBg: 'color-mix(in srgb, var(--success) 15%, transparent)',
  },
  {
    key: 'faction',
    prefix: '&',
    label: 'Facção',
    emptyText: 'Nenhuma facção encontrada.',
    color: '#f59e0b',
    softBg: 'rgba(245, 158, 11, 0.14)',
  },
  {
    key: 'obj',
    prefix: '!',
    label: 'Objeto',
    emptyText: 'Nenhum objeto encontrado.',
    color: '#a855f7',
    softBg: 'rgba(168, 85, 247, 0.14)',
  },
];

function CategoryIcon({ category }: { category: MentionCategoryKey }) {
  if (category === 'char') return <AtSign size={11} aria-hidden="true" />;
  if (category === 'loc') return <Hash size={11} aria-hidden="true" />;
  if (category === 'faction') return <Shield size={11} aria-hidden="true" />;
  return <Box size={11} aria-hidden="true" />;
}

interface ManuscriptMentionBarProps {
  project: ProjectData;
  mentions: DetectedSceneMentions;
  onInsertMention: (token: string) => void;
  openCategory?: MentionCategoryKey | null;
  onOpenCategoryChange?: (next: MentionCategoryKey | null) => void;
  onHide?: () => void;
}

export function ManuscriptMentionBar({
  project,
  mentions,
  onInsertMention,
  openCategory: controlledCategory,
  onOpenCategoryChange,
  onHide,
}: ManuscriptMentionBarProps) {
  const [internalCategory, setInternalCategory] = useState<MentionCategoryKey | null>(null);
  const openCategory =
    controlledCategory !== undefined ? controlledCategory : internalCategory;

  const setOpenCategory = (next: MentionCategoryKey | null) => {
    setInternalCategory(next);
    onOpenCategoryChange?.(next);
  };

  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openCategory) {
      setQuery('');
      return;
    }
    const onMouseDown = (ev: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(ev.target as Node)) {
        setOpenCategory(null);
      }
    };
    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setOpenCategory(null);
    };
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openCategory]);

  const optionsByCategory = useMemo<Record<MentionCategoryKey, MentionOption[]>>(() => {
    const inSceneChar = new Set(mentions.chars.map((c) => c.id));
    const inSceneLoc = new Set(mentions.locs.map((l) => l.id));
    const inSceneFac = new Set(mentions.factions.map((f) => f.id));
    const inSceneObj = new Set(mentions.objects.map((o) => o.id));

    return {
      char: project.characters.map((c) => ({
        id: c.id,
        name: c.name,
        subtitle: c.role || 'Personagem',
        inScene: inSceneChar.has(c.id),
      })),
      loc: project.worlds
        .flatMap((w) => w.locations)
        .map((l) => ({
          id: l.id,
          name: l.name,
          subtitle: l.type || 'Local',
          inScene: inSceneLoc.has(l.id),
        })),
      faction: project.factions.map((f) => ({
        id: f.id,
        name: f.name,
        subtitle: f.subtype || 'Facção',
        inScene: inSceneFac.has(f.id),
      })),
      obj: project.objects.map((o) => ({
        id: o.id,
        name: o.name,
        subtitle: o.type || 'Objeto',
        inScene: inSceneObj.has(o.id),
      })),
    };
  }, [project, mentions]);

  const sceneCounts: Record<MentionCategoryKey, number> = {
    char: mentions.chars.length,
    loc: mentions.locs.length,
    faction: mentions.factions.length,
    obj: mentions.objects.length,
  };

  return (
    <div
      ref={containerRef}
      style={{
        padding: '5px 14px',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        minHeight: 34,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 2 }}>
          Menções
        </span>
        {CATEGORIES.map((cat) => {
          const isOpen = openCategory === cat.key;
          const activeCount = sceneCounts[cat.key];
          const rawOptions = optionsByCategory[cat.key];
          const normalizedQuery = query.trim().toLowerCase();
          const filtered = rawOptions
            .filter(
              (item) =>
                !normalizedQuery ||
                item.name.toLowerCase().includes(normalizedQuery) ||
                (item.subtitle && item.subtitle.toLowerCase().includes(normalizedQuery))
            )
            .sort((a, b) => Number(b.inScene) - Number(a.inScene));

          return (
            <div key={cat.key} style={{ position: 'relative' }}>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="listbox"
                onClick={() => {
                  setQuery('');
                  setOpenCategory(isOpen ? null : cat.key);
                }}
                style={{
                  fontSize: 11.5,
                  fontWeight: 500,
                  padding: '3px 9px',
                  borderRadius: 999,
                  backgroundColor: isOpen || activeCount > 0 ? cat.softBg : 'var(--bg-elevated)',
                  color: isOpen || activeCount > 0 ? cat.color : 'var(--text-secondary)',
                  border: `1px solid ${
                    isOpen ? cat.color : 'var(--border-subtle)'
                  }`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <CategoryIcon category={cat.key} />
                <span>{cat.label}</span>
                {activeCount > 0 && (
                  <span style={{ fontSize: 10, opacity: 0.85 }}>· {activeCount}</span>
                )}
                <ChevronDown size={11} aria-hidden="true" style={{ opacity: 0.7 }} />
              </button>

              {isOpen && (
                <div
                  role="dialog"
                  aria-label={`Pesquisar ${cat.label}`}
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    left: 0,
                    width: 260,
                    backgroundColor: 'var(--bg-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: '0 14px 32px rgba(0, 0, 0, 0.34)',
                    padding: 8,
                    zIndex: 60,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 8px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--bg-canvas)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <Search size={12} style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
                    <input
                      autoFocus
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={`Pesquisar ${cat.label.toLowerCase()}...`}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--text-primary)',
                        fontSize: 12,
                      }}
                    />
                  </div>

                  <div
                    role="listbox"
                    style={{
                      maxHeight: 210,
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    {filtered.length === 0 ? (
                      <div
                        style={{
                          padding: '10px 8px',
                          fontSize: 11.5,
                          color: 'var(--text-muted)',
                          textAlign: 'center',
                        }}
                      >
                        {cat.emptyText}
                      </div>
                    ) : (
                      filtered.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          role="option"
                          aria-selected={opt.inScene}
                          onClick={() => {
                            onInsertMention(`${cat.prefix}${opt.name} `);
                            setOpenCategory(null);
                          }}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            padding: '6px 8px',
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 8,
                            fontSize: 12,
                            color: 'var(--text-primary)',
                            backgroundColor: opt.inScene ? cat.softBg : 'transparent',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div
                              style={{
                                fontWeight: 500,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {cat.prefix}
                              {opt.name}
                            </div>
                            {opt.subtitle && (
                              <div
                                style={{
                                  fontSize: 10.5,
                                  color: 'var(--text-muted)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {opt.subtitle}
                              </div>
                            )}
                          </div>
                          {opt.inScene && (
                            <span
                              title="Presente nesta cena"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 2,
                                fontSize: 10,
                                color: cat.color,
                                flexShrink: 0,
                              }}
                            >
                              <Check size={11} aria-hidden="true" /> na cena
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {onHide && (
        <button
          type="button"
          onClick={onHide}
          title="Minimizar barra de menções"
          aria-label="Minimizar barra de menções"
          style={{
            width: 24,
            height: 24,
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <X size={13} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
