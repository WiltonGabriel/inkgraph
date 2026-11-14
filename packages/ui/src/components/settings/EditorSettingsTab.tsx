import { Sliders, Type } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import type { AppSettings } from '../../types/project';
import { EditorPreviewCard } from './EditorPreviewCard';
import {
  THEME_VAR,
  checkboxInputStyle,
  checkboxLabelStyle,
  controlInputStyle,
  fieldColumnStyle,
  fieldLabelTextStyle,
  sectionCardStyle,
  sectionHeaderStyle,
} from './settingsStyles';

export function EditorSettingsTab() {
  const { draftSettings, updateDraftSetting } = useSettings();
  const isEn = draftSettings.language === 'en';

  const editorToggles: {
    key:
      | 'paragraphIndent'
      | 'editorSmartTypography'
      | 'enableMarkdownLivePreview'
      | 'zenMode'
      | 'focusMode'
      | 'typewriterMode'
      | 'spellcheck'
      | 'showWordCountFooter'
      | 'showReadingTimeEstimate';
    label: string;
  }[] = [
    {
      key: 'paragraphIndent',
      label: isEn
        ? 'First-line literary paragraph indent'
        : 'Recuo literário na primeira linha do parágrafo',
    },
    {
      key: 'editorSmartTypography',
      label: isEn
        ? 'Smart typography (curly quotes, em-dashes)'
        : 'Tipografia inteligente (aspas curvas e travessões)',
    },
    {
      key: 'enableMarkdownLivePreview',
      label: isEn
        ? 'Enable Markdown live preview in editor'
        : 'Ativar pré-visualização Markdown ao vivo',
    },
    {
      key: 'zenMode',
      label: isEn
        ? 'Default Zen Mode (hide sidebars)'
        : 'Modo Zen padrão (ocultar barras laterais)',
    },
    {
      key: 'focusMode',
      label: isEn
        ? 'Paragraph Focus (dim inactive lines)'
        : 'Foco de Parágrafo (atenuar linhas inativas)',
    },
    {
      key: 'typewriterMode',
      label: isEn
        ? 'Typewriter scrolling (keep cursor centered)'
        : 'Rolagem Máquina de Escrever (cursor centralizado)',
    },
    {
      key: 'spellcheck',
      label: isEn ? 'Enable native spellcheck' : 'Ativar verificação ortográfica nativa',
    },
    {
      key: 'showWordCountFooter',
      label: isEn
        ? 'Show word count bar in editor footer'
        : 'Exibir contagem de palavras no rodapé',
    },
    {
      key: 'showReadingTimeEstimate',
      label: isEn
        ? 'Show estimated reading time'
        : 'Exibir estimativa de tempo de leitura',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <Type size={16} color={THEME_VAR.accentPrimary} />
          <span>
            {isEn ? 'Markdown Mode, Typography & Column' : 'Modo Markdown, Tipografia & Coluna'}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(195px, 1fr))',
            gap: '0.85rem',
          }}
        >
          <label htmlFor="ink-ed-mode" style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>
              {isEn ? 'Default Markdown Mode' : 'Modo Padrão do Editor'}
            </span>
            <select
              id="ink-ed-mode"
              value={draftSettings.markdownEditorDefaultMode}
              onChange={(e) =>
                updateDraftSetting(
                  'markdownEditorDefaultMode',
                  e.target.value as AppSettings['markdownEditorDefaultMode']
                )
              }
              style={controlInputStyle}
            >
              <option value="visual">
                {isEn ? 'Visual Interface (Blocks)' : 'Interface Visual (Blocos sem Código)'}
              </option>
              <option value="write">{isEn ? 'Markdown (Prose)' : 'Markdown Literário'}</option>
              <option value="code">{isEn ? 'Source Code + YAML' : 'Código-Fonte + YAML'}</option>
              <option value="split">{isEn ? 'Split (Editor + Preview)' : 'Dividido (Editor + Leitura)'}</option>
              <option value="read">{isEn ? 'Formatted Reading' : 'Leitura Formatada'}</option>
            </select>
          </label>

          <label htmlFor="ink-ed-font" style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>{isEn ? 'Font Family' : 'Família Tipográfica'}</span>
            <select
              id="ink-ed-font"
              value={draftSettings.editorFont}
              onChange={(e) =>
                updateDraftSetting('editorFont', e.target.value as AppSettings['editorFont'])
              }
              style={controlInputStyle}
            >
              <option value="serif">
                {isEn ? 'Literary Serif (Georgia)' : 'Serifa Literária (Georgia)'}
              </option>
              <option value="sans">{isEn ? 'Clean Sans-Serif' : 'Sem Serifa (Sistema)'}</option>
              <option value="mono">{isEn ? 'Monospace (Drafting)' : 'Monoespaçada (Rascunho)'}</option>
            </select>
          </label>

          <label htmlFor="ink-ed-align" style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>
              {isEn ? 'Text Alignment' : 'Alinhamento do Texto'}
            </span>
            <select
              id="ink-ed-align"
              value={draftSettings.editorTextAlign}
              onChange={(e) =>
                updateDraftSetting(
                  'editorTextAlign',
                  e.target.value as AppSettings['editorTextAlign']
                )
              }
              style={controlInputStyle}
            >
              <option value="left">{isEn ? 'Left Aligned' : 'Alinhado à Esquerda'}</option>
              <option value="justify">{isEn ? 'Justified (Book)' : 'Justificado (Livro)'}</option>
            </select>
          </label>

          <label htmlFor="ink-ed-size" style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>
              {isEn ? 'Font Size' : 'Tamanho da Fonte'}:{' '}
              <strong style={{ color: THEME_VAR.textPrimary }}>
                {draftSettings.editorFontSize}px
              </strong>
            </span>
            <input
              id="ink-ed-size"
              type="range"
              min={12}
              max={28}
              step={1}
              value={draftSettings.editorFontSize}
              onChange={(e) => updateDraftSetting('editorFontSize', Number(e.target.value))}
              style={{ accentColor: THEME_VAR.accentPrimary }}
            />
          </label>

          <label htmlFor="ink-ed-lh" style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>
              {isEn ? 'Line Height' : 'Altura de Linha'}:{' '}
              <strong style={{ color: THEME_VAR.textPrimary }}>
                {draftSettings.editorLineHeight.toFixed(1)}
              </strong>
            </span>
            <input
              id="ink-ed-lh"
              type="range"
              min={1.3}
              max={2.2}
              step={0.1}
              value={draftSettings.editorLineHeight}
              onChange={(e) => updateDraftSetting('editorLineHeight', Number(e.target.value))}
              style={{ accentColor: THEME_VAR.accentPrimary }}
            />
          </label>

          <label htmlFor="ink-ed-spacing" style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>
              {isEn ? 'Paragraph Spacing' : 'Espaço entre Parágrafos'}:{' '}
              <strong style={{ color: THEME_VAR.textPrimary }}>
                {draftSettings.editorParagraphSpacingPx}px
              </strong>
            </span>
            <input
              id="ink-ed-spacing"
              type="range"
              min={0}
              max={28}
              step={2}
              value={draftSettings.editorParagraphSpacingPx}
              onChange={(e) =>
                updateDraftSetting('editorParagraphSpacingPx', Number(e.target.value))
              }
              style={{ accentColor: THEME_VAR.accentPrimary }}
            />
          </label>

          <label htmlFor="ink-ed-width" style={fieldColumnStyle}>
            <span style={fieldLabelTextStyle}>
              {isEn ? 'Max Column Width' : 'Largura Máxima da Coluna'}:{' '}
              <strong style={{ color: THEME_VAR.textPrimary }}>
                {draftSettings.editorMaxWidthCh}ch
              </strong>
            </span>
            <input
              id="ink-ed-width"
              type="range"
              min={55}
              max={110}
              step={5}
              value={draftSettings.editorMaxWidthCh}
              onChange={(e) => updateDraftSetting('editorMaxWidthCh', Number(e.target.value))}
              style={{ accentColor: THEME_VAR.accentPrimary }}
            />
          </label>
        </div>
      </section>

      <section style={sectionCardStyle}>
        <div style={sectionHeaderStyle}>
          <Sliders size={16} color={THEME_VAR.accentPrimary} />
          <span>
            {isEn ? 'Writing Studio Behavior' : 'Comportamento do Estúdio de Redação'}
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '0.6rem',
          }}
        >
          {editorToggles.map((item) => (
            <label key={item.key} style={checkboxLabelStyle}>
              <input
                type="checkbox"
                checked={draftSettings[item.key]}
                onChange={(e) => updateDraftSetting(item.key, e.target.checked)}
                style={checkboxInputStyle}
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </section>

      <EditorPreviewCard />
    </div>
  );
}
