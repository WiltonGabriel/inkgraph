import { useState } from 'react';
import {
  FileText,
  FolderPlus,
  FilePlus,
  Link2,
  Trash2,
  Columns,
  Plus,
  BookOpen,
  Folder,
} from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { countWords, type BinderItem, type Scene } from '../../types/project';

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
    const labels = { folder: 'Nova Pasta', note: 'Nova Nota de Pesquisa', link: 'Referência Externa' };
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
      style={{
        width: 260,
        backgroundColor: '#0e1118',
        borderRight: '1px solid #1b202c',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', borderBottom: '1px solid #1b202c', padding: 6, gap: 4 }}>
        <button
          onClick={() => setTab('indice')}
          style={{
            flex: 1,
            padding: '6px 8px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: tab === 'indice' ? '#1e2638' : 'transparent',
            color: tab === 'indice' ? '#f3f4f6' : '#9ca3af',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <BookOpen size={13} /> Índice
        </button>
        <button
          onClick={() => setTab('fichario')}
          style={{
            flex: 1,
            padding: '6px 8px',
            borderRadius: 6,
            border: 'none',
            backgroundColor: tab === 'fichario' ? '#1e2638' : 'transparent',
            color: tab === 'fichario' ? '#f3f4f6' : '#9ca3af',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          <Folder size={13} /> Fichário
        </button>
      </div>

      {tab === 'indice' ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 10, borderBottom: '1px solid #1b202c' }}>
            <button
              onClick={handleCreateScene}
              style={{
                width: '100%',
                padding: '7px 10px',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Plus size={13} /> + Nova Seção
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {project.scenes.map((scene) => {
              const active = scene.id === activeSceneId;
              const words = countWords(scene.content);
              return (
                <div
                  key={scene.id}
                  onClick={() => setActiveSceneId(scene.id)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    backgroundColor: active ? '#172033' : 'transparent',
                    border: active ? '1px solid #2563eb' : '1px solid transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                  }}
                >
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: active ? '#fff' : '#d1d5db', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <FileText size={12} style={{ marginRight: 5, verticalAlign: 'middle' }} />
                      {scene.chapterNumber}. {scene.title}
                    </div>
                    <div style={{ fontSize: 10.5, color: '#6b7280', marginTop: 2 }}>
                      Ato {scene.act} · {words} pal.
                    </div>
                  </div>
                  {project.scenes.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteScene(scene.id);
                      }}
                      title="Excluir cena"
                      style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 2 }}
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: 8, borderBottom: '1px solid #1b202c', display: 'flex', gap: 4 }}>
            <button onClick={() => handleCreateBinder('folder')} style={{ flex: 1, padding: '5px 4px', backgroundColor: '#161b26', border: '1px solid #262f42', borderRadius: 5, color: '#d1d5db', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              <FolderPlus size={11} /> + Pasta
            </button>
            <button onClick={() => handleCreateBinder('note')} style={{ flex: 1, padding: '5px 4px', backgroundColor: '#161b26', border: '1px solid #262f42', borderRadius: 5, color: '#d1d5db', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              <FilePlus size={11} /> + Nota
            </button>
            <button onClick={() => handleCreateBinder('link')} style={{ flex: 1, padding: '5px 4px', backgroundColor: '#161b26', border: '1px solid #262f42', borderRadius: 5, color: '#d1d5db', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
              <Link2 size={11} /> + Link web
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {project.binder.map((item) => {
              const isPinned = pinnedBinderId === item.id;
              return (
                <div
                  key={item.id}
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    backgroundColor: isPinned ? '#172033' : '#121621',
                    border: isPinned ? '1px solid #60a5fa' : '1px solid #1f2533',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb' }}>{item.title}</span>
                    <button
                      onClick={() => {
                        if (isPinned) onPinBinderItem(null);
                        deleteBinderItem(item.id);
                      }}
                      style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <button
                    onClick={() => onPinBinderItem(isPinned ? null : item.id)}
                    style={{
                      width: '100%',
                      padding: '4px 8px',
                      backgroundColor: isPinned ? '#2563eb' : '#19202e',
                      border: '1px solid #2c3548',
                      borderRadius: 4,
                      color: '#fff',
                      fontSize: 11,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 4,
                    }}
                  >
                    <Columns size={11} /> {isPinned ? 'Fechar painel lateral' : 'Abrir ao lado'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
