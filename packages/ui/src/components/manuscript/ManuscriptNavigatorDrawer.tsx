import { useState } from 'react';
import { BookOpen, Folder, Search, X } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { BinderItem, Scene } from '../../types/project';
import { NavigatorBinderList } from './NavigatorBinderList';
import { NavigatorSceneList } from './NavigatorSceneList';

interface ManuscriptNavigatorDrawerProps {
  pinnedBinderId: string | null;
  onPinBinderItem: (id: string | null) => void;
}

export function ManuscriptNavigatorDrawer({
  pinnedBinderId,
  onPinBinderItem,
}: ManuscriptNavigatorDrawerProps) {
  const {
    project,
    activeSceneId,
    setActiveSceneId,
    upsertScene,
    deleteScene,
    upsertBinderItem,
    deleteBinderItem,
  } = useProject();

  const [tab, setTab] = useState<'indice' | 'fichario'>('indice');
  const [query, setQuery] = useState('');

  const handleCreateScene = () => {
    const nextNum = project.scenes.length + 1;
    const newScene: Scene = {
      id: `scene_${Date.now()}`,
      chapterNumber: nextNum,
      title: `Cena ${nextNum}`,
      summary: 'Resumo da nova cena.',
      content: `# Cena ${nextNum}\n\n`,
      act: 1,
      status: 'draft',
      tension: 40,
      subplotIds: [],
      characterIds: [],
      objectIds: [],
      secretsRevealed: [],
      notes: '',
      position: { x: 100 + nextNum * 180, y: 120 },
      comments: [],
      revisions: [],
      lastEditedAt: new Date().toISOString(),
    };
    upsertScene(newScene);
    setActiveSceneId(newScene.id);
  };

  const handleCreateBinder = (type: 'folder' | 'note' | 'link') => {
    const labels = {
      folder: 'Nova Pasta',
      note: 'Nova Nota de Pesquisa',
      link: 'Referência Externa',
    };
    const newItem: BinderItem = {
      id: `binder_${Date.now()}`,
      parentId: null,
      type,
      title: labels[type],
      content: type === 'note' ? 'Anotações de pesquisa e referências...' : '',
      url: type === 'link' ? 'https://' : undefined,
      linkedSceneIds: activeSceneId ? [activeSceneId] : [],
      createdAt: new Date().toISOString(),
    };
    upsertBinderItem(newItem);
    if (type !== 'folder') onPinBinderItem(newItem.id);
  };

  return (
    <aside
      aria-label="Navegador do manuscrito"
      style={{
        width: 272,
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        minHeight: 0,
      }}
    >
      <div
        role="tablist"
        aria-label="Seções do navegador"
        style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: 6,
          gap: 4,
        }}
      >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'indice'}
          onClick={() => setTab('indice')}
          style={{
            flex: 1,
            minHeight: 28,
            padding: '6px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: tab === 'indice' ? 'var(--bg-elevated)' : 'transparent',
            color: tab === 'indice' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <BookOpen size={13} aria-hidden="true" /> Índice
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'fichario'}
          onClick={() => setTab('fichario')}
          style={{
            flex: 1,
            minHeight: 28,
            padding: '6px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: tab === 'fichario' ? 'var(--bg-elevated)' : 'transparent',
            color: tab === 'fichario' ? 'var(--text-primary)' : 'var(--text-secondary)',
            fontSize: 12,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <Folder size={13} aria-hidden="true" /> Fichário
        </button>
      </div>

      <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 8px',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <Search size={12} color="var(--text-muted)" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={tab === 'indice' ? 'Filtrar cenas...' : 'Filtrar fichário...'}
            aria-label={tab === 'indice' ? 'Filtrar cenas' : 'Filtrar fichário'}
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              fontSize: 12,
              color: 'var(--text-primary)',
            }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Limpar filtro"
              style={{ background: 'none', color: 'var(--text-muted)', padding: 2 }}
            >
              <X size={12} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {tab === 'indice' ? (
        <NavigatorSceneList
          scenes={project.scenes}
          activeSceneId={activeSceneId}
          query={query}
          onSelectScene={setActiveSceneId}
          onCreateScene={handleCreateScene}
          onDeleteScene={deleteScene}
        />
      ) : (
        <NavigatorBinderList
          items={project.binder}
          pinnedBinderId={pinnedBinderId}
          query={query}
          onPinBinderItem={onPinBinderItem}
          onCreateBinder={handleCreateBinder}
          onDeleteBinder={deleteBinderItem}
        />
      )}
    </aside>
  );
}
