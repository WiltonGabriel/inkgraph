import { useMemo, useState } from 'react';
import { Volume2, VolumeX, Maximize2, AlignCenter, AtSign, Hash, Shield } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import { countWords } from '../../types/project';

export function ManuscriptEditorCenter() {
  const { project, settings, updateSettings, activeSceneId, upsertScene } = useProject();
  const [speaking, setSpeaking] = useState(false);

  const activeScene = project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0];

  const mentions = useMemo(() => {
    if (!activeScene) return { chars: [], locs: [], factions: [] };
    const text = activeScene.content.toLowerCase();

    const chars = project.characters.filter(
      (c) =>
        text.includes(c.name.toLowerCase()) ||
        text.includes(`@${c.name.toLowerCase()}`) ||
        c.aliases.some((a) => text.includes(a.toLowerCase()))
    );

    const allLocs = project.worlds.flatMap((w) => w.locations);
    const locs = allLocs.filter(
      (l) => text.includes(l.name.toLowerCase()) || text.includes(`#${l.name.toLowerCase()}`)
    );

    const factions = project.factions.filter(
      (f) =>
        text.includes(f.name.toLowerCase()) ||
        text.includes(`&${f.name.toLowerCase()}`) ||
        f.aliases.some((a) => text.includes(a.toLowerCase()))
    );

    return { chars, locs, factions };
  }, [activeScene, project.characters, project.worlds, project.factions]);

  if (!activeScene) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
        Selecione ou crie uma cena no índice lateral.
      </div>
    );
  }

  const words = countWords(activeScene.content);
  const readingMinutes = Math.max(1, Math.ceil(words / 220));

  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeScene.content);
      utterance.lang = 'pt-BR';
      utterance.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0a0d14', overflow: 'hidden' }}>
      {/* Top Focus & Formatting Bar */}
      <div
        style={{
          padding: '8px 16px',
          borderBottom: '1px solid #1b202c',
          backgroundColor: '#111520',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <input
          value={activeScene.title}
          onChange={(e) =>
            upsertScene({ ...activeScene, title: e.target.value, lastEditedAt: new Date().toISOString() })
          }
          placeholder="Título da Cena..."
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            color: '#f9fafb',
            fontSize: 15,
            fontWeight: 700,
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={() => updateSettings((s) => ({ ...s, zenMode: !s.zenMode }))}
            style={{
              padding: '5px 10px',
              backgroundColor: settings.zenMode ? '#2563eb' : '#181e2c',
              border: '1px solid #283147',
              borderRadius: 6,
              color: '#e5e7eb',
              fontSize: 11.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <Maximize2 size={12} /> Modo Zen
          </button>
          <button
            onClick={() => updateSettings((s) => ({ ...s, typewriterMode: !s.typewriterMode }))}
            style={{
              padding: '5px 10px',
              backgroundColor: settings.typewriterMode ? '#2563eb' : '#181e2c',
              border: '1px solid #283147',
              borderRadius: 6,
              color: '#e5e7eb',
              fontSize: 11.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <AlignCenter size={12} /> Modo Máquina de Escrever
          </button>
          <button
            onClick={handleToggleSpeech}
            style={{
              padding: '5px 10px',
              backgroundColor: speaking ? '#10b981' : '#181e2c',
              border: '1px solid #283147',
              borderRadius: 6,
              color: speaking ? '#052e16' : '#e5e7eb',
              fontSize: 11.5,
              fontWeight: speaking ? 700 : 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {speaking ? <VolumeX size={12} /> : <Volume2 size={12} />} Ler em voz alta
          </button>
        </div>
      </div>

      {/* Live Entity Mention Badges */}
      <div
        style={{
          padding: '6px 16px',
          borderBottom: '1px solid #161b26',
          backgroundColor: '#0d111a',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexWrap: 'wrap',
          minHeight: 32,
        }}
      >
        <span style={{ fontSize: 11, color: '#6b7280', marginRight: 4 }}>Menções ativas (@Personagem #Local &Facção):</span>
        {mentions.chars.map((c) => (
          <span key={c.id} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(59,130,246,0.15)', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: 3 }}>
            <AtSign size={10} /> {c.name}
          </span>
        ))}
        {mentions.locs.map((l) => (
          <span key={l.id} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Hash size={10} /> {l.name}
          </span>
        ))}
        {mentions.factions.map((f) => (
          <span key={f.id} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(248,113,113,0.15)', color: '#f87171', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Shield size={10} /> {f.name}
          </span>
        ))}
      </div>

      {/* Main Prose Textarea */}
      <textarea
        value={activeScene.content}
        onChange={(e) =>
          upsertScene({ ...activeScene, content: e.target.value, lastEditedAt: new Date().toISOString() })
        }
        spellCheck={settings.spellcheck}
        placeholder="Escreva a prosa da cena... Use @Personagem, #Local ou &Facção para vincular entidades do cânone."
        style={{
          flex: 1,
          width: '100%',
          maxWidth: settings.zenMode ? 760 : `${settings.editorMaxWidthCh || 72}ch`,
          margin: '0 auto',
          padding: settings.typewriterMode ? '18vh 36px' : '28px 36px',
          backgroundColor: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          color: '#e5e7eb',
          fontSize: settings.editorFontSize || 16,
          lineHeight: settings.editorLineHeight || 1.75,
          textIndent: settings.paragraphIndent ? '2em' : 0,
          fontFamily: settings.editorFont === 'mono' ? 'monospace' : settings.editorFont === 'sans' ? 'sans-serif' : 'Georgia, serif',
        }}
      />

      {/* Bottom Status Bar */}
      {settings.showWordCountFooter && (
        <div
          style={{
            padding: '6px 16px',
            borderTop: '1px solid #1b202c',
            backgroundColor: '#0e1118',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 11.5,
            color: '#9ca3af',
          }}
        >
          <span>Capítulo {activeScene.chapterNumber} · Ato {activeScene.act}</span>
          <span>
            {words.toLocaleString('pt-BR')} palavras
            {settings.showReadingTimeEstimate ? ` · ~${readingMinutes} min de leitura` : ''}
          </span>
        </div>
      )}
    </div>
  );
}
