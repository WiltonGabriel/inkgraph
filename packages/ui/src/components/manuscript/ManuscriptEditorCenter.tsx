import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Volume2,
  VolumeX,
  Maximize2,
  AlignCenter,
  AtSign,
  Hash,
  Shield,
  Code2,
  FileText,
  Scissors,
  EyeOff,
  Bookmark,
  Mic,
  MicOff,
  CheckCheck,
} from 'lucide-react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  canonicalMarkdownToHtml,
  extractEpistemicDirectives,
  formatCanonicalDirective,
  htmlToCanonicalMarkdown,
  splitSceneMarkdownAtOffset,
} from '@inkgraph/domain';
import { useProject } from '../../context/ProjectContext';
import { countWords, type Scene } from '../../types/project';
import { CodeMirrorSourcePane } from './CodeMirrorSourcePane';

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

export function ManuscriptEditorCenter() {
  const { project, settings, updateSettings, activeSceneId, setActiveSceneId, upsertScene } =
    useProject();

  const [speaking, setSpeaking] = useState(false);
  const [dictating, setDictating] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [ltStatus, setLtStatus] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const lastHtmlSyncedRef = useRef<string>('');

  const activeScene = project.scenes.find((s) => s.id === activeSceneId) ?? project.scenes[0];
  const editorMode = settings.editorMode ?? 'rich';
  const isEn = settings.language === 'en';

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: isEn
          ? 'Write scene prose... Use @ mentions or / commands for beats & epistemic reveals.'
          : 'Escreva a prosa da cena... Use @ para entidades ou / para beats e revelações epistêmicas.',
      }),
    ],
    content: canonicalMarkdownToHtml(activeScene?.content ?? ''),
    editorProps: {
      attributes: {
        spellcheck: String(settings.spellcheck),
        style: 'outline: none; min-height: 50vh;',
      },
    },
    onUpdate: ({ editor: ed }) => {
      if (!activeScene) return;
      const html = ed.getHTML();
      lastHtmlSyncedRef.current = html;
      const nextMd = htmlToCanonicalMarkdown(html);
      if (nextMd !== activeScene.content) {
        upsertScene({
          ...activeScene,
          content: nextMd,
          lastEditedAt: new Date().toISOString(),
        });
      }
      if (settings.typewriterMode && typeof window !== 'undefined') {
        const sel = window.getSelection();
        const anchorNode = sel?.anchorNode;
        const el =
          anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement ?? null;
        el?.scrollIntoView({ block: 'center', behavior: settings.reducedMotion ? 'auto' : 'smooth' });
      }
    },
  });

  // Sync external scene changes into TipTap without clobbering user typing
  useEffect(() => {
    if (!editor || !activeScene) return;
    const targetHtml = canonicalMarkdownToHtml(activeScene.content);
    if (targetHtml !== lastHtmlSyncedRef.current && editor.getHTML() !== targetHtml) {
      lastHtmlSyncedRef.current = targetHtml;
      editor.commands.setContent(targetHtml, { emitUpdate: false });
    }
  }, [editor, activeScene?.id, activeScene?.content]);

  const mentions = useMemo(() => {
    if (!activeScene) return { chars: [], locs: [], factions: [] };
    const text = activeScene.content.toLowerCase();

    const chars = project.characters.filter(
      (c) =>
        text.includes(c.name.toLowerCase()) ||
        text.includes(`kb:${c.id.toLowerCase()}`) ||
        c.aliases.some((a) => text.includes(a.toLowerCase()))
    );

    const allLocs = project.worlds.flatMap((w) => w.locations);
    const locs = allLocs.filter(
      (l) => text.includes(l.name.toLowerCase()) || text.includes(`kb:${l.id.toLowerCase()}`)
    );

    const factions = project.factions.filter(
      (f) =>
        text.includes(f.name.toLowerCase()) ||
        text.includes(`kb:${f.id.toLowerCase()}`) ||
        f.aliases.some((a) => text.includes(a.toLowerCase()))
    );

    return { chars, locs, factions };
  }, [activeScene, project.characters, project.worlds, project.factions]);

  const epistemicMarkers = useMemo(
    () => (activeScene ? extractEpistemicDirectives(activeScene.content) : []),
    [activeScene?.content]
  );

  const mentionCandidates = useMemo(() => {
    const q = mentionQuery.trim().toLowerCase();
    const list: { id: string; label: string; kind: string }[] = [
      ...project.characters.map((c) => ({ id: c.id, label: c.name, kind: '@' })),
      ...project.worlds.flatMap((w) => w.locations.map((l) => ({ id: l.id, label: l.name, kind: '#' }))),
      ...project.factions.map((f) => ({ id: f.id, label: f.name, kind: '&' })),
    ];
    return list.filter((item) => !q || item.label.toLowerCase().includes(q)).slice(0, 12);
  }, [mentionQuery, project.characters, project.worlds, project.factions]);

  if (!activeScene) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
        {isEn ? 'Select or create a scene in the outline.' : 'Selecione ou crie uma cena no índice lateral.'}
      </div>
    );
  }

  const words = countWords(activeScene.content);
  const readingMinutes = Math.max(1, Math.ceil(words / 220));

  const appendMarkdownSnippet = (snippet: string) => {
    const next = activeScene.content.trimEnd()
      ? `${activeScene.content.trimEnd()}\n\n${snippet}`
      : snippet;
    upsertScene({ ...activeScene, content: next, lastEditedAt: new Date().toISOString() });
    setShowSlashMenu(false);
  };

  const insertEntityMention = (id: string, label: string) => {
    const token = `[${label}](kb:${id}) `;
    const next = `${activeScene.content}${activeScene.content.endsWith(' ') || !activeScene.content ? '' : ' '}${token}`;
    upsertScene({ ...activeScene, content: next, lastEditedAt: new Date().toISOString() });
    setShowMentionPicker(false);
    setMentionQuery('');
  };

  const handleSplitSceneHere = () => {
    const midpoint = Math.floor(activeScene.content.length / 2);
    const paraBreak = activeScene.content.indexOf('\n\n', midpoint);
    const splitOffset = paraBreak !== -1 ? paraBreak : midpoint;
    const { before, after } = splitSceneMarkdownAtOffset(activeScene.content, splitOffset);
    if (!before || !after) {
      setShowSlashMenu(false);
      return;
    }

    const nextScene: Scene = {
      ...activeScene,
      id: `scene_${Date.now()}`,
      chapterNumber: activeScene.chapterNumber + 1,
      title: `${activeScene.title} (II)`,
      content: after,
      status: 'draft',
      lastEditedAt: new Date().toISOString(),
    };
    upsertScene({ ...activeScene, content: before, lastEditedAt: new Date().toISOString() });
    upsertScene(nextScene);
    setActiveSceneId(nextScene.id);
    setShowSlashMenu(false);
  };

  const handleToggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeScene.content);
      utterance.lang = settings.language;
      utterance.onend = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setSpeaking(true);
    }
  };

  const handleToggleDictation = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const RecCtor = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!RecCtor) {
      setLtStatus(isEn ? 'Speech recognition not available in this browser.' : 'Ditado por voz não suportado neste navegador.');
      return;
    }

    if (dictating) {
      recognitionRef.current?.stop();
      setDictating(false);
      return;
    }

    const rec = new RecCtor();
    rec.lang = settings.language;
    rec.continuous = true;
    rec.interimResults = false;
    rec.onresult = (ev) => {
      const lastResult = ev.results[ev.results.length - 1];
      const transcript = lastResult?.[0]?.transcript?.trim();
      if (transcript) {
        appendMarkdownSnippet(transcript);
      }
    };
    rec.onerror = () => setDictating(false);
    rec.onend = () => setDictating(false);
    recognitionRef.current = rec;
    rec.start();
    setDictating(true);
  };

  const handleLanguageToolCheck = async () => {
    if (!settings.languageToolEnabled) return;
    setLtStatus(isEn ? 'Checking grammar...' : 'Verificando gramática...');
    try {
      const body = new URLSearchParams({
        text: activeScene.content,
        language: settings.language === 'en' ? 'en-US' : 'pt-BR',
      });
      const res = await fetch(settings.languageToolUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as { matches?: { message: string }[] };
      const count = json.matches?.length ?? 0;
      setLtStatus(
        count === 0
          ? isEn ? 'LanguageTool: 0 suggestions.' : 'LanguageTool: 0 apontamentos.'
          : isEn
            ? `LanguageTool: ${count} hint(s) — first: ${json.matches?.[0]?.message ?? ''}`
            : `LanguageTool: ${count} sugestão(ões) — ${json.matches?.[0]?.message ?? ''}`
      );
    } catch (err) {
      setLtStatus(
        `LanguageTool offline (${err instanceof Error ? err.message : String(err)})`
      );
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#0a0d14', overflow: 'hidden', position: 'relative' }}>
      {/* Top Focus, Dual-Mode & Command Bar */}
      <div
        style={{
          padding: '8px 14px',
          borderBottom: '1px solid #1b202c',
          backgroundColor: '#111520',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <input
          value={activeScene.title}
          onChange={(e) =>
            upsertScene({ ...activeScene, title: e.target.value, lastEditedAt: new Date().toISOString() })
          }
          placeholder={isEn ? 'Scene Title...' : 'Título da Cena...'}
          style={{
            flex: '1 1 180px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#f9fafb',
            fontSize: 15,
            fontWeight: 700,
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() =>
              updateSettings((s) => ({
                ...s,
                editorMode: editorMode === 'rich' ? 'markdown' : 'rich',
              }))
            }
            title={isEn ? 'Toggle Rich / Markdown Source' : 'Alternar Modo Blocos / Markdown Puro'}
            style={{
              padding: '5px 9px',
              backgroundColor: editorMode === 'markdown' ? '#2563eb' : '#181e2c',
              border: '1px solid #283147',
              borderRadius: 6,
              color: '#e5e7eb',
              fontSize: 11.5,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {editorMode === 'markdown' ? <Code2 size={12} /> : <FileText size={12} />}
            {editorMode === 'markdown' ? 'Markdown' : isEn ? 'Prose' : 'Blocos'}
          </button>

          <button
            type="button"
            onClick={() => setShowMentionPicker((v) => !v)}
            style={{
              padding: '5px 9px',
              backgroundColor: showMentionPicker ? '#2563eb' : '#181e2c',
              border: '1px solid #283147',
              borderRadius: 6,
              color: '#e5e7eb',
              fontSize: 11.5,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <AtSign size={12} /> @
          </button>

          <button
            type="button"
            onClick={() => setShowSlashMenu((v) => !v)}
            style={{
              padding: '5px 9px',
              backgroundColor: showSlashMenu ? '#2563eb' : '#181e2c',
              border: '1px solid #283147',
              borderRadius: 6,
              color: '#e5e7eb',
              fontSize: 11.5,
              fontWeight: 700,
            }}
          >
            /
          </button>

          <button
            type="button"
            onClick={() => updateSettings((s) => ({ ...s, zenMode: !s.zenMode }))}
            style={{
              padding: '5px 9px',
              backgroundColor: settings.zenMode ? '#2563eb' : '#181e2c',
              border: '1px solid #283147',
              borderRadius: 6,
              color: '#e5e7eb',
              fontSize: 11.5,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <Maximize2 size={12} /> Zen
          </button>

          <button
            type="button"
            onClick={() => updateSettings((s) => ({ ...s, typewriterMode: !s.typewriterMode }))}
            title={isEn ? 'Typewriter Scroll' : 'Modo Máquina de Escrever'}
            style={{
              padding: '5px 9px',
              backgroundColor: settings.typewriterMode ? '#2563eb' : '#181e2c',
              border: '1px solid #283147',
              borderRadius: 6,
              color: '#e5e7eb',
              fontSize: 11.5,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <AlignCenter size={12} />
          </button>

          <button
            type="button"
            onClick={handleToggleDictation}
            title={isEn ? 'Voice Dictation (STT)' : 'Ditado por Voz'}
            style={{
              padding: '5px 8px',
              backgroundColor: dictating ? '#ef4444' : '#181e2c',
              border: '1px solid #283147',
              borderRadius: 6,
              color: '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {dictating ? <MicOff size={12} /> : <Mic size={12} />}
          </button>

          <button
            type="button"
            onClick={handleToggleSpeech}
            title={isEn ? 'Read Aloud (TTS)' : 'Ler em voz alta'}
            style={{
              padding: '5px 8px',
              backgroundColor: speaking ? '#10b981' : '#181e2c',
              border: '1px solid #283147',
              borderRadius: 6,
              color: speaking ? '#052e16' : '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {speaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
          </button>

          {settings.languageToolEnabled && (
            <button
              type="button"
              onClick={() => void handleLanguageToolCheck()}
              style={{
                padding: '5px 9px',
                backgroundColor: '#181e2c',
                border: '1px solid #283147',
                borderRadius: 6,
                color: '#34d399',
                fontSize: 11.5,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <CheckCheck size={12} /> Gramática
            </button>
          )}
        </div>
      </div>

      {/* Slash / Mention Floating Popovers */}
      {showSlashMenu && (
        <div style={{ padding: '8px 14px', backgroundColor: '#131824', borderBottom: '1px solid #252f44', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() =>
              appendMarkdownSnippet(
                formatCanonicalDirective({
                  kind: 'beat',
                  attributes: { id: `beat_${Date.now()}`, status: 'draft' },
                  body: isEn ? 'Beat note: describe scene turn here.' : 'Beat de cena: descreva a virada dramática aqui.',
                })
              )
            }
            style={{ padding: '5px 10px', borderRadius: 5, backgroundColor: '#1a2234', color: '#e5e7eb', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <Bookmark size={12} color="#60a5fa" /> /beat ::beat
          </button>

          <button
            type="button"
            onClick={() =>
              appendMarkdownSnippet(
                formatCanonicalDirective({
                  kind: 'epistemic-reveal',
                  attributes: {
                    entity: activeScene.povCharacterId || project.characters[0]?.id || 'char_unknown',
                    secret: isEn ? 'Secret revealed here' : 'Segredo revelado neste ponto',
                    mode: 'reveal',
                  },
                  body: isEn ? 'Write the moment the character learns this truth.' : 'Descreva o momento exato da revelação.',
                })
              )
            }
            style={{ padding: '5px 10px', borderRadius: 5, backgroundColor: '#1a2234', color: '#fbbf24', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <EyeOff size={12} /> /epistemic-reveal
          </button>

          <button
            type="button"
            onClick={() => appendMarkdownSnippet('* * *')}
            style={{ padding: '5px 10px', borderRadius: 5, backgroundColor: '#1a2234', color: '#d1d5db', fontSize: 11.5 }}
          >
            * * * {isEn ? 'Scene Break' : 'Quebra de Cena'}
          </button>

          <button
            type="button"
            onClick={handleSplitSceneHere}
            style={{ padding: '5px 10px', borderRadius: 5, backgroundColor: '#1a2234', color: '#34d399', fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <Scissors size={12} /> Split scene here
          </button>
        </div>
      )}

      {showMentionPicker && (
        <div style={{ padding: '8px 14px', backgroundColor: '#131824', borderBottom: '1px solid #252f44', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <input
            value={mentionQuery}
            onChange={(e) => setMentionQuery(e.target.value)}
            placeholder={isEn ? 'Filter character, location, or faction...' : 'Filtrar personagem, local ou facção...'}
            style={{ backgroundColor: '#0c0f17', border: '1px solid #283248', borderRadius: 5, padding: '5px 9px', fontSize: 12 }}
          />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {mentionCandidates.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => insertEntityMention(item.id, item.label)}
                style={{ padding: '4px 9px', borderRadius: 5, backgroundColor: '#1b2436', color: '#93c5fd', fontSize: 11.5 }}
              >
                {item.kind}{item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live Entity Mention Badges & Inline Epistemic Markers */}
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
        <span style={{ fontSize: 11, color: '#6b7280', marginRight: 4 }}>
          {isEn ? 'Linked entities:' : 'Entidades na cena:'}
        </span>
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
        {epistemicMarkers.map((ep, idx) => (
          <span key={idx} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 999, backgroundColor: 'rgba(245,158,11,0.15)', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 3 }}>
            <EyeOff size={10} /> {ep.secret}
          </span>
        ))}
        {ltStatus && (
          <span style={{ fontSize: 11, color: '#34d399', marginLeft: 'auto' }}>{ltStatus}</span>
        )}
      </div>

      {/* Dual-Mode Canvas: TipTap Rich Prose <-> CodeMirror Pure Markdown */}
      {editorMode === 'markdown' ? (
        <CodeMirrorSourcePane
          value={activeScene.content}
          onChange={(nextMd) =>
            upsertScene({ ...activeScene, content: nextMd, lastEditedAt: new Date().toISOString() })
          }
          fontSize={settings.editorFontSize || 16}
          lineHeight={settings.editorLineHeight || 1.75}
          maxWidth={settings.zenMode ? 760 : `${settings.editorMaxWidthCh || 72}ch`}
          typewriterMode={settings.typewriterMode}
        />
      ) : (
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            width: '100%',
          }}
        >
          <div
            style={{
              maxWidth: settings.zenMode ? 760 : `${settings.editorMaxWidthCh || 72}ch`,
              margin: '0 auto',
              padding: settings.typewriterMode ? '18vh 28px' : '24px 28px',
              color: '#e5e7eb',
              fontSize: settings.editorFontSize || 16,
              lineHeight: settings.editorLineHeight || 1.75,
              textIndent: settings.paragraphIndent ? '2em' : 0,
              fontFamily:
                settings.editorFont === 'mono'
                  ? 'monospace'
                  : settings.editorFont === 'sans'
                    ? 'sans-serif'
                    : 'Georgia, serif',
            }}
          >
            <EditorContent editor={editor} />
          </div>
        </div>
      )}

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
          <span>
            {isEn ? 'Chapter' : 'Capítulo'} {activeScene.chapterNumber} ·{' '}
            {isEn ? 'Act' : 'Ato'} {activeScene.act}
          </span>
          <span>
            {words.toLocaleString(settings.language)} {isEn ? 'words' : 'palavras'}
            {settings.showReadingTimeEstimate
              ? isEn
                ? ` · ~${readingMinutes} min read`
                : ` · ~${readingMinutes} min de leitura`
              : ''}
          </span>
        </div>
      )}
    </div>
  );
}
