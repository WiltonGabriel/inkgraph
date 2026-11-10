import { Type, Sliders, Eye } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import type { AppSettings } from '../../types/project';

const FONT_STACKS: Record<AppSettings['editorFont'], string> = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: 'system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
};

export function EditorSettingsTab() {
  const { settings, updateSettings } = useProject();
  const isEn = settings.language === 'en';

  const setField = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    updateSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Tipografia & Coluna de Leitura */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.9rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.88rem' }}>
          <Type size={16} color="var(--accent)" />
          <span>{isEn ? 'Typography & Reading Column' : 'Tipografia & Coluna de Leitura'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.85rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'Font Family' : 'Família Tipográfica'}
            </span>
            <select
              value={settings.editorFont}
              onChange={(e) => setField('editorFont', e.target.value as AppSettings['editorFont'])}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.45rem 0.6rem',
                color: 'var(--text-primary)',
              }}
            >
              <option value="serif">{isEn ? 'Literary Serif (Georgia)' : 'Serifa Literária (Georgia)'}</option>
              <option value="sans">{isEn ? 'Clean Sans-Serif' : 'Sem Serifa (Sistema)'}</option>
              <option value="mono">{isEn ? 'Monospace (Drafting)' : 'Monoespaçada (Rascunho)'}</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'Font Size' : 'Tamanho da Fonte'}: <strong>{settings.editorFontSize}px</strong>
            </span>
            <input
              type="range"
              min={12}
              max={28}
              step={1}
              value={settings.editorFontSize}
              onChange={(e) => setField('editorFontSize', Number(e.target.value))}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'Line Height' : 'Altura de Linha'}: <strong>{settings.editorLineHeight.toFixed(1)}</strong>
            </span>
            <input
              type="range"
              min={1.3}
              max={2.2}
              step={0.1}
              value={settings.editorLineHeight}
              onChange={(e) => setField('editorLineHeight', Number(e.target.value))}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'Max Column Width' : 'Largura Máxima da Coluna'}: <strong>{settings.editorMaxWidthCh}ch</strong>
            </span>
            <input
              type="range"
              min={55}
              max={110}
              step={5}
              value={settings.editorMaxWidthCh}
              onChange={(e) => setField('editorMaxWidthCh', Number(e.target.value))}
            />
          </label>
        </div>
      </div>

      {/* Comportamento de Escrita */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.88rem' }}>
          <Sliders size={16} color="var(--accent)" />
          <span>{isEn ? 'Writing Studio Behavior' : 'Comportamento do Estúdio de Redação'}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '0.6rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.paragraphIndent}
              onChange={(e) => setField('paragraphIndent', e.target.checked)}
            />
            <span>{isEn ? 'First-line literary paragraph indent' : 'Recuo literário na primeira linha do parágrafo'}</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.zenMode}
              onChange={(e) => setField('zenMode', e.target.checked)}
            />
            <span>{isEn ? 'Default Zen Mode (hide sidebars)' : 'Modo Zen padrão (ocultar barras laterais)'}</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.focusMode}
              onChange={(e) => setField('focusMode', e.target.checked)}
            />
            <span>{isEn ? 'Paragraph Focus (dim inactive lines)' : 'Foco de Parágrafo (atenuar linhas inativas)'}</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.typewriterMode}
              onChange={(e) => setField('typewriterMode', e.target.checked)}
            />
            <span>{isEn ? 'Typewriter scrolling (keep cursor centered)' : 'Rolagem Máquina de Escrever (cursor centralizado)'}</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.spellcheck}
              onChange={(e) => setField('spellcheck', e.target.checked)}
            />
            <span>{isEn ? 'Enable native spellcheck' : 'Ativar verificação ortográfica nativa'}</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.showWordCountFooter}
              onChange={(e) => setField('showWordCountFooter', e.target.checked)}
            />
            <span>{isEn ? 'Show word count bar in editor footer' : 'Exibir contagem de palavras no rodapé'}</span>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings.showReadingTimeEstimate}
              onChange={(e) => setField('showReadingTimeEstimate', e.target.checked)}
            />
            <span>{isEn ? 'Show estimated reading time' : 'Exibir estimativa de tempo de leitura'}</span>
          </label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border)' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'Default Manuscript Mode' : 'Modo Padrão do Editor'}
            </span>
            <select
              value={settings.editorMode}
              onChange={(e) => setField('editorMode', e.target.value as AppSettings['editorMode'])}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.45rem 0.6rem',
                color: 'var(--text-primary)',
              }}
            >
              <option value="rich">{isEn ? 'Blocks / Focus (TipTap)' : 'Blocos / Foco (TipTap)'}</option>
              <option value="markdown">{isEn ? 'Raw Markdown (CodeMirror)' : 'Markdown Fonte (CodeMirror)'}</option>
            </select>
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.languageToolEnabled}
                onChange={(e) => setField('languageToolEnabled', e.target.checked)}
              />
              <span>{isEn ? 'Local LanguageTool Grammar Check (Opt-in)' : 'LanguageTool Local de Gramática (Opcional)'}</span>
            </label>
            <input
              value={settings.languageToolUrl}
              onChange={(e) => setField('languageToolUrl', e.target.value)}
              disabled={!settings.languageToolEnabled}
              placeholder="http://localhost:8010/v2/check"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                padding: '0.42rem 0.6rem',
                color: 'var(--text-primary)',
                opacity: settings.languageToolEnabled ? 1 : 0.5,
              }}
            />
          </div>
        </div>
      </div>

      {/* Amostra ao Vivo */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '1.15rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.65rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          <Eye size={15} />
          <span>{isEn ? 'Live Typography Preview' : 'Amostra Tipográfica ao Vivo'}</span>
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            padding: '1.2rem 1.5rem',
            maxWidth: `${settings.editorMaxWidthCh}ch`,
            fontFamily: FONT_STACKS[settings.editorFont],
            fontSize: `${settings.editorFontSize}px`,
            lineHeight: settings.editorLineHeight,
            color: 'var(--text-primary)',
          }}
        >
          <p style={{ margin: 0, textIndent: settings.paragraphIndent ? '2em' : 0 }}>
            {isEn
              ? 'The mist rose slowly above the stone bastions at daybreak. The watchman rested his gloved hand upon the cold parapet, listening to the distant bells before the gates opened.'
              : 'A névoa erguia-se lentamente sobre os bastiões de pedra ao amanhecer. O vigia apoiou a mão enluvada no parapeito frio, escutando os sinos distantes antes da abertura dos portões.'}
          </p>
        </div>
      </div>
    </div>
  );
}
