import { MapPin, User } from 'lucide-react';
import type { Scene } from '../../types/project';
import { ACT_META, SCENE_STATUS_META } from './dashboardTheme';

export function getTensionColor(tension: number): string {
  if (tension >= 75) return 'var(--danger, #ef4444)';
  if (tension >= 45) return '#f59e0b';
  return 'var(--accent-primary, #3b82f6)';
}

interface TensionTooltipCardProps {
  scene: Scene;
  povName?: string;
  locationName?: string;
  onOpenScene: (sceneId: string) => void;
}

export function TensionTooltipCard({
  scene,
  povName,
  locationName,
  onOpenScene,
}: TensionTooltipCardProps) {
  const actMeta = ACT_META[scene.act];
  const statusMeta = SCENE_STATUS_META[scene.status];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '1px 6px',
              borderRadius: 999,
              backgroundColor: 'var(--accent-soft)',
              color: 'var(--accent-primary)',
            }}
          >
            #Cap {scene.chapterNumber}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: 999,
              backgroundColor: actMeta.softBg,
              color: actMeta.color,
            }}
          >
            {actMeta.shortLabel}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '1px 6px',
              borderRadius: 999,
              backgroundColor: statusMeta.softBg,
              color: statusMeta.color,
            }}
          >
            {statusMeta.label}
          </span>
        </div>
        <strong style={{ fontSize: 11.5, color: getTensionColor(scene.tension) }}>
          Tensão: {scene.tension}%
        </strong>
      </div>

      <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text-primary)' }}>
        {scene.title}
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          fontSize: 11,
          color: 'var(--text-secondary)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <User size={11} />
          {povName ?? 'Sem POV'}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <MapPin size={11} />
          {locationName ?? 'Sem local'}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: 5,
          marginTop: 1,
          gap: 8,
        }}
      >
        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          Clique seleciona · Duplo clique abre
        </span>
        <button
          type="button"
          onClick={() => onOpenScene(scene.id)}
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: '#ffffff',
            borderRadius: 5,
            padding: '3px 8px',
            fontSize: 10.5,
            fontWeight: 600,
          }}
        >
          Abrir Cena
        </button>
      </div>
    </div>
  );
}
