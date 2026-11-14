import { useEffect } from 'react';

const STYLE_ELEMENT_ID = 'inkgraph-interactive-chart-styles';

const CHART_STYLES_CSS = `
.ig-card-interactive {
  transition: border-color 150ms ease, background-color 150ms ease, box-shadow 180ms ease;
}
.ig-card-interactive:hover,
.ig-card-interactive:focus-within {
  border-color: color-mix(in srgb, var(--accent-primary) 55%, var(--border-subtle)) !important;
}

.ig-tile-interactive {
  transition: border-color 150ms ease, background-color 150ms ease, box-shadow 160ms ease;
}
.ig-tile-interactive:hover,
.ig-tile-interactive:focus-visible {
  border-color: var(--accent-primary) !important;
  background-color: var(--bg-hover) !important;
}

.ig-bar-btn {
  transition: opacity 140ms ease, background-color 140ms ease, box-shadow 140ms ease;
}
.ig-bar-btn:hover,
.ig-bar-btn:focus-visible {
  opacity: 0.96;
  box-shadow: 0 0 0 2px var(--accent-primary);
}

.ig-tooltip-fade {
  opacity: 1;
}

.ig-tension-node {
  cursor: pointer;
  outline: none;
}
.ig-tension-node .ig-tension-focus-ring {
  opacity: 0;
  transition: opacity 120ms ease;
}
.ig-tension-node:focus-visible .ig-tension-focus-ring {
  opacity: 1;
}
.ig-tension-polyline {
  transition: stroke 160ms ease, opacity 160ms ease;
}
.ig-tension-dot {
  transition: r 150ms ease, fill 150ms ease, stroke-width 150ms ease;
}

@media (prefers-reduced-motion: no-preference) {
  [data-reduced-motion='false'] .ig-card-interactive {
    transition: transform 180ms cubic-bezier(0.22, 1, 0.36, 1), border-color 150ms ease, background-color 150ms ease, box-shadow 180ms ease;
  }
  [data-reduced-motion='false'] .ig-card-interactive:hover {
    transform: translateY(-2px);
  }

  [data-reduced-motion='false'] .ig-tile-interactive {
    transition: transform 160ms cubic-bezier(0.22, 1, 0.36, 1), border-color 150ms ease, background-color 150ms ease, box-shadow 160ms ease;
  }
  [data-reduced-motion='false'] .ig-tile-interactive:hover,
  [data-reduced-motion='false'] .ig-tile-interactive:focus-visible {
    transform: translateY(-2px);
  }

  [data-reduced-motion='false'] .ig-bar-grow {
    transform-origin: bottom;
    animation: igBarGrowIn 340ms cubic-bezier(0.22, 1, 0.36, 1) both;
    animation-delay: var(--ig-bar-delay, 0ms);
  }

  [data-reduced-motion='false'] .ig-tooltip-fade {
    animation: igTooltipPop 140ms cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  [data-reduced-motion='false'] .ig-tension-aura-pulse {
    transform-box: fill-box;
    transform-origin: center;
    animation: igAuraPulse 1.8s ease-in-out infinite;
  }
}

@keyframes igBarGrowIn {
  from {
    transform: scaleY(0.1);
    opacity: 0.55;
  }
  to {
    transform: scaleY(1);
    opacity: 1;
  }
}

@keyframes igTooltipPop {
  from {
    opacity: 0;
    transform: translateY(4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes igAuraPulse {
  0%, 100% {
    transform: scale(0.95);
    opacity: 0.38;
  }
  50% {
    transform: scale(1.22);
    opacity: 0.16;
  }
}
`;

export function InteractiveChartStyles() {
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (document.getElementById(STYLE_ELEMENT_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ELEMENT_ID;
    style.textContent = CHART_STYLES_CSS;
    document.head.appendChild(style);
  }, []);

  return null;
}
