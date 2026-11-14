import type {
  AppSettings,
  CornerStyle,
  ThemeBrightness,
  ThemePaletteId,
  UiFontFamily,
} from '../types/project';

export interface DualModePaletteSpec {
  id: ThemePaletteId;
  labelPt: string;
  labelEn: string;
  light: {
    canvas: string;
    surface: string;
    elevated: string;
    hover: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentSoft: string;
  };
  dark: {
    canvas: string;
    surface: string;
    elevated: string;
    hover: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentSoft: string;
  };
}

export const THEME_PALETTES: DualModePaletteSpec[] = [
  {
    id: 'slate',
    labelPt: 'Ardósia Sereno',
    labelEn: 'Serene Slate',
    light: {
      canvas: '#f5f7fb',
      surface: '#ffffff',
      elevated: '#f0f4f9',
      hover: '#e6edf6',
      border: '#d6dfec',
      textPrimary: '#0f172a',
      textSecondary: '#475569',
      textMuted: '#64748b',
      accent: '#2563eb',
      accentSoft: 'rgba(37, 99, 235, 0.10)',
    },
    dark: {
      canvas: '#0b0e16',
      surface: '#111623',
      elevated: '#171d2e',
      hover: '#1f273d',
      border: '#263046',
      textPrimary: '#f1f5f9',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      accent: '#3b82f6',
      accentSoft: 'rgba(59, 130, 246, 0.14)',
    },
  },
  {
    id: 'obsidian',
    labelPt: 'Obsidiana Neutra',
    labelEn: 'Neutral Obsidian',
    light: {
      canvas: '#fafafa',
      surface: '#ffffff',
      elevated: '#f4f4f5',
      hover: '#e4e4e7',
      border: '#e4e4e7',
      textPrimary: '#09090b',
      textSecondary: '#52525b',
      textMuted: '#71717a',
      accent: '#18181b',
      accentSoft: 'rgba(24, 24, 27, 0.08)',
    },
    dark: {
      canvas: '#09090c',
      surface: '#111116',
      elevated: '#181820',
      hover: '#22222d',
      border: '#272734',
      textPrimary: '#fafafa',
      textSecondary: '#a1a1aa',
      textMuted: '#71717a',
      accent: '#60a5fa',
      accentSoft: 'rgba(96, 165, 250, 0.14)',
    },
  },
  {
    id: 'paper',
    labelPt: 'Papel Literário',
    labelEn: 'Editorial Paper',
    light: {
      canvas: '#faf6ee',
      surface: '#fffdf8',
      elevated: '#f3ecde',
      hover: '#ebe1cd',
      border: '#dfd2ba',
      textPrimary: '#241c14',
      textSecondary: '#5c4d3c',
      textMuted: '#83725f',
      accent: '#b45309',
      accentSoft: 'rgba(180, 83, 9, 0.11)',
    },
    dark: {
      canvas: '#14110e',
      surface: '#1c1713',
      elevated: '#241d18',
      hover: '#2e251e',
      border: '#3a2f26',
      textPrimary: '#f5efe6',
      textSecondary: '#b6a796',
      textMuted: '#897a6b',
      accent: '#d97706',
      accentSoft: 'rgba(217, 119, 6, 0.16)',
    },
  },
  {
    id: 'forest',
    labelPt: 'Bosque Profundo',
    labelEn: 'Deep Woodland',
    light: {
      canvas: '#f2f7f4',
      surface: '#fcfffd',
      elevated: '#e7f0eb',
      hover: '#dbe9e1',
      border: '#c7dbd0',
      textPrimary: '#0f2419',
      textSecondary: '#3b5a49',
      textMuted: '#5b7a69',
      accent: '#059669',
      accentSoft: 'rgba(5, 150, 105, 0.11)',
    },
    dark: {
      canvas: '#09120e',
      surface: '#0f1c16',
      elevated: '#15261e',
      hover: '#1c3328',
      border: '#233f32',
      textPrimary: '#ecfdf5',
      textSecondary: '#94b5a5',
      textMuted: '#638574',
      accent: '#10b981',
      accentSoft: 'rgba(16, 185, 129, 0.15)',
    },
  },
  {
    id: 'amethyst',
    labelPt: 'Ametista Arcana',
    labelEn: 'Arcane Amethyst',
    light: {
      canvas: '#f7f5fc',
      surface: '#ffffff',
      elevated: '#efeafd',
      hover: '#e4dcf8',
      border: '#d6c9f2',
      textPrimary: '#1e1633',
      textSecondary: '#514373',
      textMuted: '#736596',
      accent: '#7c3aed',
      accentSoft: 'rgba(124, 58, 237, 0.10)',
    },
    dark: {
      canvas: '#0d0b16',
      surface: '#141122',
      elevated: '#1b172f',
      hover: '#241f3e',
      border: '#2e274d',
      textPrimary: '#f3f0ff',
      textSecondary: '#a79cc7',
      textMuted: '#786d99',
      accent: '#8b5cf6',
      accentSoft: 'rgba(139, 92, 246, 0.16)',
    },
  },
  {
    id: 'sunset',
    labelPt: 'Carmesim & Âmbar',
    labelEn: 'Crimson & Dusk',
    light: {
      canvas: '#fbf6f5',
      surface: '#ffffff',
      elevated: '#f6ebe9',
      hover: '#eeddd9',
      border: '#e5cbc6',
      textPrimary: '#261414',
      textSecondary: '#664343',
      textMuted: '#886363',
      accent: '#be123c',
      accentSoft: 'rgba(190, 18, 60, 0.10)',
    },
    dark: {
      canvas: '#140c0f',
      surface: '#1c1116',
      elevated: '#25171d',
      hover: '#301e26',
      border: '#3e2731',
      textPrimary: '#fdf2f4',
      textSecondary: '#b8949d',
      textMuted: '#89666f',
      accent: '#f43f5e',
      accentSoft: 'rgba(244, 63, 94, 0.15)',
    },
  },
];

const UI_FONT_STACKS: Record<UiFontFamily, string> = {
  sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  humanist: "'Plus Jakarta Sans', 'Nunito Sans', system-ui, sans-serif",
  serif: "'Newsreader', Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
};

const CORNER_RADIUS_PX: Record<CornerStyle, { sm: string; md: string; lg: string }> = {
  sharp: { sm: '2px', md: '4px', lg: '6px' },
  subtle: { sm: '6px', md: '8px', lg: '12px' },
  rounded: { sm: '10px', md: '14px', lg: '18px' },
};

/**
 * Resolves the effective brightness ('light' | 'dark' | 'sepia'), honoring `'system'`
 * via prefers-color-scheme and legacy `'theme'` field fallback.
 */
export function resolveEffectiveBrightness(
  brightness: ThemeBrightness | undefined,
  legacyTheme: AppSettings['theme']
): 'light' | 'dark' | 'sepia' {
  const mode = brightness ?? legacyTheme;
  if (mode === 'system') {
    const mm = (
      globalThis as {
        matchMedia?: (query: string) => { matches: boolean };
      }
    ).matchMedia;
    if (mm?.('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  }
  return mode;
}

/** Builds complete CSS custom properties for root theme injection. */
export function buildThemeCssVars(settings: AppSettings): {
  mode: 'light' | 'dark' | 'sepia';
  vars: Record<string, string>;
} {
  const mode = resolveEffectiveBrightness(settings.themeBrightness, settings.theme);
  const palette =
    THEME_PALETTES.find((p) => p.id === settings.themePalette) ?? THEME_PALETTES[0];

  const base =
    mode === 'sepia'
      ? {
          canvas: '#f4ecd8',
          surface: '#fbf6ea',
          elevated: '#fffdf7',
          hover: '#ebe0c6',
          border: '#dccfae',
          textPrimary: '#2c2219',
          textSecondary: '#615040',
          textMuted: '#867360',
          accent: palette.light.accent,
          accentSoft: palette.light.accentSoft,
        }
      : mode === 'light'
      ? palette.light
      : palette.dark;

  const customAccent = settings.accentColor?.trim();
  const effectiveAccent =
    customAccent && customAccent !== '#3b82f6' ? customAccent : base.accent;
  const corners = CORNER_RADIUS_PX[settings.cornerRadius ?? 'subtle'];

  return {
    mode,
    vars: {
      '--bg-canvas': base.canvas,
      '--bg-surface': base.surface,
      '--bg-elevated': base.elevated,
      '--bg-hover': base.hover,
      '--border-subtle': base.border,
      '--text-primary': base.textPrimary,
      '--text-secondary': base.textSecondary,
      '--text-muted': base.textMuted,
      '--accent-primary': effectiveAccent,
      '--accent-soft': base.accentSoft,
      '--ui-font': UI_FONT_STACKS[settings.uiFont ?? 'sans'],
      '--ui-scale': `${Math.max(85, Math.min(125, settings.uiScale || 100))}%`,
      '--radius-sm': corners.sm,
      '--radius-md': corners.md,
      '--radius-lg': corners.lg,
      '--card-shadow':
        settings.surfaceStyle === 'elevated'
          ? mode === 'dark'
            ? '0 8px 24px -6px rgba(0, 0, 0, 0.55)'
            : '0 8px 24px -6px rgba(15, 23, 42, 0.08)'
          : 'none',
    },
  };
}
