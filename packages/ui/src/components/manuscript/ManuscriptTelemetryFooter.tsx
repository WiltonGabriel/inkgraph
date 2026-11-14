import type { AppSettings, Scene } from '../../types/project';
import { ACT_LABELS, type DetectedSceneMentions } from './manuscriptMentions';

interface ManuscriptTelemetryFooterProps {
  scene: Scene;
  povName: string | undefined;
  mentions: DetectedSceneMentions;
  words: number;
  charsCount: number;
  readingMinutes: number;
  settings: AppSettings;
}

export function ManuscriptTelemetryFooter({
  scene,
  povName,
  mentions,
  words,
  charsCount,
  readingMinutes,
  settings,
}: ManuscriptTelemetryFooterProps) {
  return (
    <footer
      style={{
        padding: '6px 14px',
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-surface)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        fontSize: 11.5,
        color: 'var(--text-secondary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <span>
          Capítulo {scene.chapterNumber} · {ACT_LABELS[scene.act]}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span>
          POV:{' '}
          <strong style={{ color: 'var(--text-primary)' }}>
            {povName ?? 'Livre'}
          </strong>
        </span>
        <span style={{ color: 'var(--text-muted)' }}>·</span>
        <span title="Entidades detectadas na cena">
          {mentions.chars.length} @ · {mentions.locs.length} # ·{' '}
          {mentions.factions.length} &
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        {settings.showWordCountFooter && (
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>
              {words.toLocaleString('pt-BR')}
            </strong>{' '}
            palavras
          </span>
        )}
        <span>{charsCount.toLocaleString('pt-BR')} caracteres</span>
        {settings.showReadingTimeEstimate && (
          <span>· ~{readingMinutes} min de leitura</span>
        )}
      </div>
    </footer>
  );
}
