import { BookOpen } from 'lucide-react';
import type { CompositionBreakdownItem } from './compositionData';

interface CompositionTooltipBodyProps {
  item: CompositionBreakdownItem;
  onOpenScene: (sceneId: string) => void;
}

export function CompositionTooltipBody({
  item,
  onOpenScene,
}: CompositionTooltipBodyProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <strong style={{ color: 'var(--text-primary)' }}>{item.title}</strong>
        <span
          style={{
            color: item.color,
            backgroundColor: item.softBg,
            fontWeight: 700,
            fontSize: 10.5,
            padding: '1px 7px',
            borderRadius: 999,
          }}
        >
          {item.pctManuscript}%
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: 'var(--text-secondary)',
          fontSize: 11,
        }}
      >
        <span>
          {item.scenes.length} {item.scenes.length === 1 ? 'cena' : 'cenas'}
        </span>
        <span>{item.words.toLocaleString('pt-BR')} palavras</span>
      </div>

      {item.scenes.length > 0 ? (
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 5,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
            Cenas (clique para abrir no Manuscrito):
          </span>
          {item.scenes.slice(0, 3).map((scene) => (
            <button
              key={scene.id}
              type="button"
              onClick={() => onOpenScene(scene.id)}
              style={{
                textAlign: 'left',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 5,
                padding: '4px 7px',
                color: 'var(--text-primary)',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 6,
              }}
            >
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                #{scene.chapterNumber} {scene.title}
              </span>
              <BookOpen
                size={11}
                style={{ color: 'var(--accent-primary)', flexShrink: 0 }}
              />
            </button>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>
          Nenhuma cena nesta categoria. Clique para abrir o Quadro.
        </div>
      )}
    </div>
  );
}
