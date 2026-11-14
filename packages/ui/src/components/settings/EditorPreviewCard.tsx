import { Eye } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import type { AppSettings } from '../../types/project';
import {
  THEME_VAR,
  innerCardStyle,
  sectionCardStyle,
  sectionHeaderStyle,
} from './settingsStyles';

const FONT_STACKS: Record<AppSettings['editorFont'], string> = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: 'system-ui, -apple-system, sans-serif',
  mono: '"JetBrains Mono", "Fira Code", monospace',
};

export function EditorPreviewCard() {
  const { draftSettings } = useSettings();
  const isEn = draftSettings.language === 'en';
  const smartDash = draftSettings.editorSmartTypography ? ' — ' : ' -- ';
  const openQuote = draftSettings.editorSmartTypography ? '“' : '"';
  const closeQuote = draftSettings.editorSmartTypography ? '”' : '"';

  return (
    <section style={sectionCardStyle}>
      <div style={{ ...sectionHeaderStyle, color: THEME_VAR.textSecondary, fontSize: '0.84rem' }}>
        <Eye size={15} />
        <span>{isEn ? 'Live Typography Preview' : 'Amostra Tipográfica ao Vivo'}</span>
      </div>

      <div
        style={{
          ...innerCardStyle,
          padding: '1.2rem 1.5rem',
          maxWidth: `${draftSettings.editorMaxWidthCh}ch`,
          fontFamily: FONT_STACKS[draftSettings.editorFont],
          fontSize: `${draftSettings.editorFontSize}px`,
          lineHeight: draftSettings.editorLineHeight,
          textAlign: draftSettings.editorTextAlign,
          color: THEME_VAR.textPrimary,
        }}
      >
        <p
          style={{
            margin: 0,
            marginBottom: `${draftSettings.editorParagraphSpacingPx}px`,
            textIndent: draftSettings.paragraphIndent ? '2em' : 0,
          }}
        >
          {isEn
            ? `The mist rose slowly above the stone bastions${smartDash}listening to the distant bells before the gates opened.`
            : `A névoa erguia-se lentamente sobre os bastiões de pedra${smartDash}escutando os sinos distantes antes da abertura dos portões.`}
        </p>
        <p style={{ margin: 0, textIndent: draftSettings.paragraphIndent ? '2em' : 0 }}>
          {isEn
            ? `${openQuote}No watchman leaves the tower before dawn,${closeQuote} the chronicle warned.`
            : `${openQuote}Nenhum vigia deixa a torre antes da alvorada,${closeQuote} advertia a crônica.`}
        </p>
      </div>
    </section>
  );
}
