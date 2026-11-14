import { useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, Copy } from 'lucide-react';
import {
  COPILOT_VAR,
  TONE,
  detailsCardStyle,
  summaryRowStyle,
} from './CopilotThemeStyles';

export interface CopilotPromptPreviewProps {
  formattedPrompt: string;
}

export function CopilotPromptPreview({ formattedPrompt }: CopilotPromptPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(formattedPrompt);
      } else {
        const helper = document.createElement('textarea');
        helper.value = formattedPrompt;
        helper.style.position = 'fixed';
        helper.style.opacity = '0';
        document.body.appendChild(helper);
        helper.select();
        document.execCommand('copy');
        document.body.removeChild(helper);
      }
      setCopied(true);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <details
      open={open}
      onToggle={(e) => {
        const nextOpen = e.currentTarget.open;
        setOpen((prev) => (prev === nextOpen ? prev : nextOpen));
      }}
      style={detailsCardStyle}
    >
      <summary style={{ ...summaryRowStyle, justifyContent: 'flex-start', gap: 5 }}>
        <ChevronRight
          size={13}
          style={{
            flexShrink: 0,
            color: COPILOT_VAR.textMuted,
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 140ms ease',
          }}
        />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: COPILOT_VAR.textPrimary }}>
          Prévia do Pacote de Contexto
        </span>
      </summary>

      <div
        style={{
          borderTop: `1px solid ${COPILOT_VAR.borderSubtle}`,
          padding: 8,
          backgroundColor: COPILOT_VAR.bgSurface,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <span style={{ fontSize: 10, color: COPILOT_VAR.textMuted }}>
            {formattedPrompt.length} caracteres
          </span>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 8px',
              borderRadius: COPILOT_VAR.radiusSm,
              backgroundColor: copied ? TONE.successBg : COPILOT_VAR.bgElevated,
              border: `1px solid ${copied ? TONE.successBorder : COPILOT_VAR.borderSubtle}`,
              color: copied ? TONE.successText : COPILOT_VAR.textPrimary,
              fontSize: 10.5,
              fontWeight: 600,
            }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            {copied ? 'Copiado!' : 'Copiar pacote'}
          </button>
        </div>

        <pre
          style={{
            margin: 0,
            padding: 8,
            maxHeight: 200,
            overflowY: 'auto',
            borderRadius: COPILOT_VAR.radiusSm,
            backgroundColor: COPILOT_VAR.bgCanvas,
            border: `1px solid ${COPILOT_VAR.borderSubtle}`,
            color: COPILOT_VAR.textSecondary,
            fontSize: 10.5,
            lineHeight: 1.45,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {formattedPrompt}
        </pre>
      </div>
    </details>
  );
}
