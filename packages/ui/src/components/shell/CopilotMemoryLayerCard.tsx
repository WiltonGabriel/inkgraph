import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { CompiledMemoryLayer } from '../../domain/memoryCompiler';
import {
  COPILOT_VAR,
  detailsCardStyle,
  getStatusTone,
  summaryRowStyle,
} from './CopilotThemeStyles';

export interface CopilotMemoryLayerCardProps {
  layer: CompiledMemoryLayer;
  defaultOpen?: boolean;
  pausedNote?: string;
}

export function CopilotMemoryLayerCard({
  layer,
  defaultOpen = false,
  pausedNote,
}: CopilotMemoryLayerCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      open={isOpen}
      onToggle={(e) => {
        const nextOpen = e.currentTarget.open;
        setIsOpen((prev) => (prev === nextOpen ? prev : nextOpen));
      }}
      style={detailsCardStyle}
    >
      <summary style={summaryRowStyle}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            minWidth: 0,
            fontSize: 11.5,
            fontWeight: 600,
            color: COPILOT_VAR.textPrimary,
          }}
        >
          <ChevronRight
            size={13}
            style={{
              flexShrink: 0,
              color: COPILOT_VAR.textMuted,
              transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 140ms ease',
            }}
          />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {layer.label}
          </span>
        </span>

        <span
          style={{
            flexShrink: 0,
            fontSize: 10,
            color: COPILOT_VAR.textSecondary,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {layer.items.length} {layer.items.length === 1 ? 'item' : 'itens'} •{' '}
          {layer.estimatedTokens} tok
        </span>
      </summary>

      <div
        style={{
          borderTop: `1px solid ${COPILOT_VAR.borderSubtle}`,
          padding: '8px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          backgroundColor: COPILOT_VAR.bgSurface,
        }}
      >
        {layer.items.length === 0 ? (
          <div style={{ fontSize: 11, color: COPILOT_VAR.textMuted }}>
            {pausedNote ?? 'Nenhum registro ativo nesta camada para o orçamento atual.'}
          </div>
        ) : (
          layer.items.map((item) => {
            const tone = item.status ? getStatusTone(item.status) : null;
            return (
              <div
                key={item.id}
                style={{
                  padding: '6px 8px',
                  borderRadius: COPILOT_VAR.radiusSm,
                  backgroundColor: COPILOT_VAR.bgElevated,
                  border: `1px solid ${COPILOT_VAR.borderSubtle}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 6,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: COPILOT_VAR.textPrimary }}>
                    {item.title}
                  </span>
                  {tone && (
                    <span
                      style={{
                        flexShrink: 0,
                        fontSize: 9.5,
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: 999,
                        backgroundColor: tone.bg,
                        border: `1px solid ${tone.border}`,
                        color: tone.text,
                      }}
                    >
                      {tone.label}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10.5, color: COPILOT_VAR.textSecondary, lineHeight: 1.4 }}>
                  {item.summary}
                </div>
              </div>
            );
          })
        )}
      </div>
    </details>
  );
}
